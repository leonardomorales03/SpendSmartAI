'use server'

import { Transaction, AIAnswer } from '@/lib/types'
import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'
import { groq } from '@/lib/groq'

export async function extractTransactionDetails(text: string): Promise<Transaction | AIAnswer> {
    // 1. DETECT IF IT IS A QUESTION (ASK MY MONEY)
    if (text.startsWith('?')) {
        // Obtenemos historial reciente para que la IA responda con contexto real
        const { data: recentTransactions } = await supabase
            .from('transactions')
            .select('*, category:categories(name)')
            .limit(20);

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Eres un asistente financiero experto. Responde preguntas sobre los gastos del usuario basados en los datos proporcionados. Sé breve y amigable. Si no hay datos, dilo."
                },
                {
                    role: "user",
                    content: `Datos de gastos: ${JSON.stringify(recentTransactions)}. Pregunta: ${text.substring(1)}`
                },
            ],
            model: "llama-3.3-70b-versatile",
        });

        return {
            type: 'answer',
            text: completion.choices[0]?.message?.content || "No pude procesar tu pregunta.",
        } as AIAnswer;
    }

    // 2. NORMAL TRANSACTION EXTRACTION WITH REAL AI
    console.log('--- PROCESANDO CON IA ---');
    console.log('Texto recibido:', text);

    const { data: dbCategories } = await supabase.from('categories').select('*');
    const categoriesList = (dbCategories || []).map(c => `${c.name} (ID: ${c.id})`).join(', ');

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `Eres un extractor de datos bancarios. Tu objetivo es convertir lenguaje natural en JSON. 
                Contexto: Colombia. 
                Si el usuario dice 'k' o 'mil', multiplícalo (ej: 50k = 50000). 
                Categorías disponibles (USA LOS IDs PROPORCIONADOS): [${categoriesList}].
                
                Responde ÚNICAMENTE con este JSON:
                {
                    "amount": number,
                    "category_id": "string-uuid",
                    "description": "Limpiar descripción (ej: 'Pizza' en lugar de 'Cena con pizza 45000')",
                    "emoji": "emoji sugerido"
                }`
            },
            {
                role: "user",
                content: text
            },
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || '{}';
    console.log('Respuesta AI:', content);

    const aiResult = JSON.parse(content);
    const category = dbCategories?.find(c => c.id === aiResult.category_id) || { id: null, name: 'General', emoji: '📦' };

    return {
        id: crypto.randomUUID(),
        amount: aiResult.amount || 0,
        category_id: aiResult.category_id || category.id,
        category: category,
        description: aiResult.description || text,
        date: new Date().toISOString(),
        emoji: aiResult.emoji || category.emoji || '📦'
    } as Transaction;
}

export async function saveTransaction(transaction: Transaction) {
    const { error } = await supabase
        .from('transactions')
        .insert([{
            amount: transaction.amount,
            category_id: transaction.category_id,
            description: transaction.description,
            date: transaction.date
        }]);

    if (error) {
        console.error('Error saving to Supabase:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/');
    return { success: true };
}
