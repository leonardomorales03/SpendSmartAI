'use server'

import { createClient } from '@/lib/supabase/server'
import { groq } from '@/lib/groq'
import { AIAnswer } from '@/lib/types'

// Define the available tools/functions for the LLM
const AVAILABLE_TOOLS = [
    {
        name: "get_transactions",
        description: "Get a list of transactions filtered by date range, category, or description.",
        parameters: {
            type: "object",
            properties: {
                startDate: { type: "string", description: "Start date in YYYY-MM-DD format" },
                endDate: { type: "string", description: "End date in YYYY-MM-DD format" },
                categoryName: { type: "string", description: "Name of the category to filter by (e.g. 'Food', 'Transport')" },
                limit: { type: "number", description: "Maximum number of transactions to return (default 20)" }
            }
        }
    },
    {
        name: "get_budget_status",
        description: "Get the current status of the monthly budget and category budgets.",
        parameters: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "get_saving_goals",
        description: "Get the list of current saving goals for the authenticated user.",
        parameters: {
            type: "object",
            properties: {}
        }
    }
];

type RouterResponse = {
    tool?: 'get_transactions' | 'get_budget_status' | 'get_saving_goals' | 'none';
    parameters?: {
        startDate?: string;
        endDate?: string;
        categoryName?: string;
        limit?: number;
    };
    thought?: string;
};

type TransactionsToolParams = NonNullable<RouterResponse['parameters']>;

export async function processFinancialQuery(query: string): Promise<AIAnswer> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return {
            type: 'answer',
            text: "Debes iniciar sesión para realizar consultas."
        };
    }

    try {
        // 1. Intent Classification & Tool Selection (Router)
        const routerCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a financial data retrieval assistant. Your goal is to determine which data is needed to answer the user's question.
                    
                    Available Tools:
                    ${JSON.stringify(AVAILABLE_TOOLS)}
                    
                    Current Date: ${new Date().toISOString().split('T')[0]}
                    
                    Respond with a JSON object containing:
                    - "tool": The name of the tool to use (or "none" if general knowledge).
                    - "parameters": The parameters for the tool.
                    - "thought": A brief explanation of why you chose this tool.
                    
                    Example:
                    User: "How much did I spend on food last week?"
                    Response: { "tool": "get_transactions", "parameters": { "categoryName": "Comida", "startDate": "2023-10-01", "endDate": "2023-10-07" }, "thought": "User wants food spending for a specific date range." }`
                },
                {
                    role: "user",
                    content: query
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const routerResponse = JSON.parse(
            routerCompletion.choices[0]?.message?.content || '{}',
        ) as RouterResponse;
        const { tool, parameters } = routerResponse;
        
        let contextData: {
            tool_used: string;
            tool_parameters: TransactionsToolParams;
            type?: 'transactions' | 'budget_status' | 'saving_goals';
            summary?: {
                total_amount: number;
                transaction_count: number;
                date_range_start: string | null;
                date_range_end: string | null;
            };
            raw?: { transactions: unknown[] };
            budget?: number;
            category_budgets?: unknown;
            current_spending?: unknown;
            goals?: unknown[];
        } = {
            tool_used: tool || 'none',
            tool_parameters: (parameters || {}) as TransactionsToolParams,
        };

        // 2. Data Retrieval (Execution)
        if (tool === 'get_transactions') {
            const safeParams: TransactionsToolParams = parameters || {};

            let queryBuilder = supabase
                .from('transactions')
                .select('*, category:categories(name)')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(safeParams.limit || 50);

            if (safeParams.startDate) queryBuilder = queryBuilder.gte('date', safeParams.startDate);
            if (safeParams.endDate) queryBuilder = queryBuilder.lte('date', safeParams.endDate);
            
            // If category name is provided, we need to find the ID first or filter after join
            // Ideally we'd join and filter, but Supabase simple filtering on joined tables is tricky with just one query string
            // For MVP, let's fetch and filter in memory or try to resolve category ID first
            if (safeParams.categoryName) {
                // Try to find category ID
                const { data: categories } = await supabase
                    .from('categories')
                    .select('id')
                    .ilike('name', `%${safeParams.categoryName}%`)
                    .limit(1);
                
                if (categories && categories.length > 0) {
                    queryBuilder = queryBuilder.eq('category_id', categories[0].id);
                }
            }

            const { data, error } = await queryBuilder;
            if (error) throw new Error(error.message);

            const transactions = data || [];

            let total = 0;
            const count = transactions.length;
            let firstDate: string | null = null;
            let lastDate: string | null = null;

            transactions.forEach((t) => {
                total += Number(t.amount || 0);
                const d = new Date(t.date);
                const iso = d.toISOString();
                if (!firstDate || iso < firstDate) firstDate = iso;
                if (!lastDate || iso > lastDate) lastDate = iso;
            });

            contextData = {
                ...contextData,
                type: 'transactions',
                summary: {
                    total_amount: total,
                    transaction_count: count,
                    date_range_start: firstDate,
                    date_range_end: lastDate,
                },
                raw: { transactions },
            };

        } else if (tool === 'get_budget_status') {
            // Reusing logic from budget.ts (simplified)
            const { data: settings } = await supabase.from('user_settings').select('monthly_budget').single();
            const { data: categoryBudgets } = await supabase.from('category_budgets').select('*, category:categories(name)');
            
            // Get current month spending
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            const { data: spending } = await supabase
                .rpc('get_monthly_category_spending', {
                    p_user_id: user.id,
                    p_start_date: startOfMonth.toISOString(),
                    p_end_date: new Date().toISOString()
                });

            contextData = { 
                ...contextData,
                type: 'budget_status',
                budget: settings?.monthly_budget,
                category_budgets: categoryBudgets,
                current_spending: spending
            };
        }
        else if (tool === 'get_saving_goals') {
            const { data: goals } = await supabase
                .from('saving_goals')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            contextData = {
                ...contextData,
                type: 'saving_goals',
                goals: goals || []
            };
        }

        // 3. Final Answer Generation (Synthesis)
        const finalCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Eres un experto analista financiero personal.
Responde a la pregunta del usuario basándote EXCLUSIVAMENTE en los datos proporcionados abajo.

=== CONTEXTO ESTRUCTURADO ===
${JSON.stringify(contextData)}
==============================

INSTRUCCIONES IMPORTANTES:
- Responde SIEMPRE en español, en un máximo de 2-3 párrafos y, si aplica, una viñeta final de recomendación.
- Cuando menciones números o montos, explica SIEMPRE de dónde salen:
  - Indica si son SUMAS, PROMEDIOS u otro tipo de cálculo.
  - Menciona el rango de fechas y la categoría si aplica (por ejemplo: "entre el 01-01 y el 15-01 en Comida").
- Si el contexto incluye "summary.total_amount" y "summary.transaction_count", úsalo explícitamente en la explicación.
- Si el contexto es de tipo "budget_status", explica la relación entre gasto actual y presupuesto (global y por categoría).
- Si el contexto es de tipo "saving_goals", conecta la respuesta con el avance hacia las metas de ahorro.
- Si no hay datos suficientes, dilo claramente y sugiere qué tipo de información adicional se necesitaría.
- Sé amable pero directo, evitando relleno innecesario.`
                },
                {
                    role: "user",
                    content: query
                }
            ],
            model: "llama-3.3-70b-versatile"
        });

        return {
            type: 'answer',
            text: finalCompletion.choices[0]?.message?.content || "No pude generar una respuesta."
        };

    } catch (error) {
        console.error('Error in financial chat:', error);
        return {
            type: 'answer',
            text: "Lo siento, hubo un error al procesar tu consulta. Intenta reformularla."
        };
    }
}
