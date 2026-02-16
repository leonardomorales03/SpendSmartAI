'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { groq } from '@/lib/groq'

export async function getBudget() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return 1000000;

        const { data, error } = await supabase
            .from('user_settings')
            .select('monthly_budget')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle(); 

        if (error) {
            console.error('Error fetching budget:', error);
            return 1000000;
        }

        return data?.monthly_budget || 1000000;
    } catch (error) {
        console.error('Unexpected error fetching budget:', error);
        return 1000000;
    }
}

export async function updateBudget(newBudget: number) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return { success: false, error: 'Usuario no autenticado' };

        // Check if row exists
        const { data: existingData } = await supabase
            .from('user_settings')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();
        
        let error;
        if (existingData) {
            const res = await supabase
                .from('user_settings')
                .update({ monthly_budget: newBudget })
                .eq('id', existingData.id);
            error = res.error;
        } else {
            const res = await supabase
                .from('user_settings')
                .insert([{ monthly_budget: newBudget, user_id: user.id }]);
            error = res.error;
        }

        if (error) {
            console.error('Error updating budget:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/');
        revalidatePath('/budget');
        return { success: true };
    } catch (error) {
        console.error('Unexpected error updating budget:', error);
        return { success: false, error: 'Unexpected error' };
    }
}

export type CategoryBudgetProgress = {
    categoryId: string;
    categoryName: string;
    emoji: string;
    budget: number;
    spent: number;
    percentage: number;
}

export type BudgetWarning = {
    type: 'error' | 'warning' | 'info';
    message: string;
    categoryId?: string;
}

export type AIPrediction = {
    categoryId: string;
    projectedSpend: number;
    daysUntilDepletion: number | null;
}

export type AIBudgetInsight = {
    predictions: AIPrediction[];
    recommendations: string[];
}

export type BudgetOverview = {
    global: {
        budget: number;
        spent: number;
        percentage: number;
    };
    categories: CategoryBudgetProgress[];
    warnings: BudgetWarning[];
}

export async function getBudgetProgress(month: number = new Date().getMonth(), year: number = new Date().getFullYear()): Promise<BudgetOverview | null> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return null;

        // 1. Get Global Budget
        const globalBudget = await getBudget();

        // Note: Javascript months are 0-indexed, so we need to be careful with dates
        const startDate = new Date(year, month, 1).toISOString();
        // Get last day of month: day 0 of next month
        const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

        // 2. Get Aggregated Spending via RPC (Performance Optimization)
        const { data: aggregatedSpending, error: rpcError } = await supabase
            .rpc('get_monthly_category_spending', {
                p_user_id: user.id,
                p_start_date: startDate,
                p_end_date: endDate
            });

        const spendingByCategory = new Map<string, number>();

        if (rpcError) {
            console.warn('Performance optimization (RPC) unavailable, falling back to raw query:', rpcError.message);
            const { data: transactions } = await supabase
                .from('transactions')
                .select('amount, category_id')
                .eq('user_id', user.id)
                .gte('date', startDate)
                .lte('date', endDate);

            transactions?.forEach(t => {
                if (t.category_id) {
                    const current = spendingByCategory.get(t.category_id) || 0;
                    spendingByCategory.set(t.category_id, current + t.amount);
                }
            });
        } else if (aggregatedSpending) {
            type AggregatedSpendingRow = {
                category_id: string | null;
                total_spent: number | string;
            };

            (aggregatedSpending as AggregatedSpendingRow[]).forEach((row) => {
                if (row.category_id) {
                    spendingByCategory.set(row.category_id, Number(row.total_spent));
                }
            });
        }

        // 3. Get All Categories
        const { data: categories } = await supabase
            .from('categories')
            .select('*')
            .or(`user_id.eq.${user.id},user_id.is.null`);

        // 4. Get Category Budgets
        const { data: categoryBudgets } = await supabase
            .from('category_budgets')
            .select('category_id, amount')
            .eq('user_id', user.id);

        // 5. Aggregate Data
        let totalSpent = 0;
        spendingByCategory.forEach(amount => totalSpent += amount);
        
        const categoryMap = new Map<string, { spent: number; budget: number; name: string; emoji: string }>();

        // Initialize with all categories
        categories?.forEach(cat => {
            categoryMap.set(cat.id, {
                spent: 0,
                budget: 0,
                name: cat.name,
                emoji: cat.emoji || '📦'
            });
        });

        // Add budget info
        categoryBudgets?.forEach(cb => {
            if (categoryMap.has(cb.category_id)) {
                const entry = categoryMap.get(cb.category_id)!;
                entry.budget = Number(cb.amount);
            }
        });

        // Add spending info
        spendingByCategory.forEach((amount, categoryId) => {
            if (categoryMap.has(categoryId)) {
                const entry = categoryMap.get(categoryId)!;
                entry.spent = amount;
            }
        });

        const categoriesProgress: CategoryBudgetProgress[] = Array.from(categoryMap.entries()).map(([id, data]) => ({
            categoryId: id,
            categoryName: data.name,
            emoji: data.emoji,
            budget: data.budget,
            spent: data.spent,
            percentage: data.budget > 0 ? (data.spent / data.budget) * 100 : 0
        })).sort((a, b) => {
            // Sort by budget set (first), then by spent amount
            if (a.budget > 0 && b.budget === 0) return -1;
            if (a.budget === 0 && b.budget > 0) return 1;
            return b.spent - a.spent;
        });

        // 6. Generate Warnings
        const warnings: BudgetWarning[] = [];
        const totalCategoryBudget = categoriesProgress.reduce((sum, cat) => sum + cat.budget, 0);

        // Warning 1: Category Sum > Global Budget
        if (totalCategoryBudget > globalBudget) {
            const difference = totalCategoryBudget - globalBudget;
            warnings.push({
                type: 'error',
                message: `El presupuesto total de categorías (${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(totalCategoryBudget)}) excede el presupuesto general (${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(globalBudget)}) por ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(difference)}.`
            });
        }

        // Warning 2: Excessive concentration
        if (totalCategoryBudget > 0) {
            categoriesProgress.forEach(cat => {
                if (cat.budget > 0) {
                    const share = (cat.budget / totalCategoryBudget) * 100;
                    if (share > 40) { // Threshold: 40%
                        warnings.push({
                            type: 'warning',
                            message: `La categoría ${cat.categoryName} representa el ${share.toFixed(1)}% del presupuesto total asignado, lo cual podría afectar otras áreas.`,
                            categoryId: cat.categoryId
                        });
                    }
                }
            });
        }

        return {
            global: {
                budget: globalBudget,
                spent: totalSpent,
                percentage: globalBudget > 0 ? (totalSpent / globalBudget) * 100 : 0
            },
            categories: categoriesProgress,
            warnings
        };

    } catch (error) {
        console.error('Error getting budget progress:', error);
        return null;
    }
}

export async function updateCategoryBudget(categoryId: string, amount: number) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return { success: false, error: 'Usuario no autenticado' };

        // Upsert
        const { error } = await supabase
            .from('category_budgets')
            .upsert({ 
                user_id: user.id, 
                category_id: categoryId, 
                amount: amount 
            }, { 
                onConflict: 'user_id, category_id' 
            });

        if (error) {
            console.error('Error updating category budget:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/budget');
        return { success: true };
    } catch (error) {
        console.error('Unexpected error updating category budget:', error);
        return { success: false, error: 'Unexpected error' };
    }
}

export async function getAIBudgetPrediction(categoriesProgress: CategoryBudgetProgress[]): Promise<AIBudgetInsight | null> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null;

        // Construct context for AI
        const context = {
            date: new Date().toISOString().split('T')[0],
            categories: categoriesProgress.filter(c => c.budget > 0 || c.spent > 0).map(c => ({
                name: c.categoryName,
                budget: c.budget,
                spent: c.spent,
                percentage: c.percentage.toFixed(1)
            }))
        };

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Eres un analista financiero experto. Analiza los datos de presupuesto y gastos actuales.
                    
                    Tu tarea:
                    1. Predice si alguna categoría se quedará sin presupuesto antes de fin de mes.
                    2. Sugiere reasignaciones de presupuesto específicas.
                    
                    Responde ÚNICAMENTE con un JSON válido con esta estructura:
                    {
                        "predictions": [
                            { "categoryId": "nombre_categoria", "projectedSpend": numero, "daysUntilDepletion": numero_o_null }
                        ],
                        "recommendations": [
                            "mensaje corto de recomendación 1",
                            "mensaje corto de recomendación 2"
                        ]
                    }
                    `
                },
                {
                    role: "user",
                    content: `Datos actuales: ${JSON.stringify(context)}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return null;

        return JSON.parse(content) as AIBudgetInsight;

    } catch (error) {
        console.error('Error getting AI prediction:', error);
        return null;
    }
}
