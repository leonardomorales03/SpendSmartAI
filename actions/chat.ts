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
    }
];

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

        const routerResponse = JSON.parse(routerCompletion.choices[0]?.message?.content || '{}');
        const { tool, parameters } = routerResponse;

        let contextData: any = {};

        // 2. Data Retrieval (Execution)
        if (tool === 'get_transactions') {
            let queryBuilder = supabase
                .from('transactions')
                .select('*, category:categories(name)')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(parameters.limit || 50);

            if (parameters.startDate) queryBuilder = queryBuilder.gte('date', parameters.startDate);
            if (parameters.endDate) queryBuilder = queryBuilder.lte('date', parameters.endDate);
            
            // If category name is provided, we need to find the ID first or filter after join
            // Ideally we'd join and filter, but Supabase simple filtering on joined tables is tricky with just one query string
            // For MVP, let's fetch and filter in memory or try to resolve category ID first
            if (parameters.categoryName) {
                // Try to find category ID
                const { data: categories } = await supabase
                    .from('categories')
                    .select('id')
                    .ilike('name', `%${parameters.categoryName}%`)
                    .limit(1);
                
                if (categories && categories.length > 0) {
                    queryBuilder = queryBuilder.eq('category_id', categories[0].id);
                }
            }

            const { data, error } = await queryBuilder;
            if (error) throw new Error(error.message);
            contextData = { transactions: data };

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
                budget: settings?.monthly_budget,
                category_budgets: categoryBudgets,
                current_spending: spending
            };
        }

        // 3. Final Answer Generation (Synthesis)
        const finalCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Eres un experto analista financiero personal.
                    Responde a la pregunta del usuario basándote EXCLUSIVAMENTE en los datos proporcionados.
                    
                    Contexto de Datos:
                    ${JSON.stringify(contextData)}
                    
                    Instrucciones:
                    - Sé conciso pero amable.
                    - Si la respuesta implica números, dales formato de moneda (ej: $50,000 COP).
                    - Si detectas algo inusual (ej: gasto muy alto en una categoría), menciónalo (Insight).
                    - Si no hay datos suficientes, dilo claramente.
                    - Responde siempre en Español.`
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
