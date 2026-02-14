'use server'

import { Transaction, AIAnswer } from '@/lib/types'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { groq } from '@/lib/groq'
import { detectAnomaly } from './anomaly'

export async function extractFromPdf(formData: FormData): Promise<Transaction[] | AIAnswer> {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No se proporcionó ningún archivo PDF');

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    try {
        // @ts-ignore
        const PDFParser = require('pdf2json');
        
        const text = await new Promise<string>((resolve, reject) => {
            const pdfParser = new PDFParser(null, 1); // 1 = text only
            
            pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
            pdfParser.on("pdfParser_dataReady", () => {
                // getRawTextContent devuelve el texto extraído
                resolve(pdfParser.getRawTextContent());
            });

            pdfParser.parseBuffer(buffer);
        });

        console.log('--- TEXTO EXTRAÍDO DE PDF (pdf2json) ---');
        console.log(text.substring(0, 200) + '...'); // Log truncado para no ensuciar

        return extractTransactionDetails(text);
    } catch (error) {
        console.error('Error al procesar PDF:', error);
        throw new Error('No se pudo procesar el PDF');
    }
}

export async function extractTransactionDetails(text: string): Promise<Transaction[] | AIAnswer> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. DETECT IF IT IS A QUESTION (ASK MY MONEY)
    if (text.startsWith('?')) {
        if (!user) {
             return {
                type: 'answer',
                text: "Debes iniciar sesión para consultar tus datos.",
            } as AIAnswer;
        }

        // Obtenemos historial reciente para que la IA responda con contexto real
        const { data: recentTransactions } = await supabase
            .from('transactions')
            .select('*, category:categories(name)')
            .eq('user_id', user.id)
            .limit(20);

        // NUEVO: Obtenemos los presupuestos por categoría
        const { data: categoryBudgets } = await supabase
            .from('category_budgets')
            .select('amount, category:categories(name)')
            .eq('user_id', user.id);

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Eres un asistente financiero experto. Responde preguntas sobre los gastos y presupuestos del usuario basados en los datos proporcionados. Puedes calcular totales y resumir información. Sé breve y amigable. Si no hay datos, dilo."
                },
                {
                    role: "user",
                    content: `Datos de gastos recientes: ${JSON.stringify(recentTransactions)}. 
                    Presupuestos por categoría: ${JSON.stringify(categoryBudgets)}. 
                    Pregunta: ${text.substring(1)}`
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
    console.log('--- PROCESANDO CON IA (Multi-Transaction) ---');
    console.log('Texto recibido:', text);

    const { data: dbCategories } = await supabase.from('categories').select('*');
    const categoriesList = (dbCategories || []).map((c: any) => `${c.name} (ID: ${c.id})`).join(', ');

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `Eres un extractor de datos bancarios. Tu objetivo es convertir lenguaje natural en un array de transacciones JSON. 
                Contexto: Colombia. 
                Si el usuario dice 'k' o 'mil', multiplícalo (ej: 50k = 50000). 
                Categorías disponibles (USA LOS IDs PROPORCIONADOS): [${categoriesList}].
                
                IMPORTANTE: Si el usuario menciona múltiples gastos (ej: "4000 en comida y 10000 en gasolina"), extrae CADA UNO por separado.
                
                Responde ÚNICAMENTE con este JSON:
                {
                    "transactions": [
                        {
                            "amount": number,
                            "category_id": "string-uuid",
                            "description": "Limpiar descripción (ej: 'Pizza')",
                            "emoji": "emoji sugerido"
                        }
                    ]
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

    const content = completion.choices[0]?.message?.content || '{"transactions": []}';
    console.log('Respuesta AI:', content);

    const aiResult = JSON.parse(content);
    const transactions = await Promise.all((aiResult.transactions || []).map(async (t: any) => {
        const category = dbCategories?.find((c: any) => c.id === t.category_id) || { id: null, name: 'General', emoji: '📦' };
        const categoryId = t.category_id || category.id;
        
        // Detect anomalies
        let warning: string | undefined;
        if (user && categoryId) {
             warning = await detectAnomaly(user.id, categoryId, t.amount || 0);
        }

        return {
            id: crypto.randomUUID(),
            amount: t.amount || 0,
            category_id: categoryId,
            category: category,
            description: t.description || text,
            date: new Date().toISOString(),
            emoji: t.emoji || category.emoji || '📦',
            warning
        } as Transaction;
    }));

    return transactions;
}

export async function saveTransaction(transaction: Transaction) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
    }

    const { error } = await supabase
        .from('transactions')
        .insert([{
            amount: transaction.amount,
            category_id: transaction.category_id,
            description: transaction.description,
            date: transaction.date,
            user_id: user.id
        }]);

    if (error) {
        console.error('Error saving to Supabase:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/');
    return { success: true };
}

export async function transcribeAudio(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No se proporcionó ningún archivo de audio');

    const transcription = await groq.audio.transcriptions.create({
        file: file,
        model: "whisper-large-v3",
        response_format: "json",
        language: "es",
    });

    return transcription.text;
}

export async function extractFromImage(formData: FormData): Promise<Transaction[] | AIAnswer> {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No se proporcionó ninguna imagen');

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    const supabase = await createClient()
    const { data: dbCategories } = await supabase.from('categories').select('*');
    const categoriesList = (dbCategories || []).map((c: any) => `${c.name} (ID: ${c.id})`).join(', ');

    const { data: { user } } = await supabase.auth.getUser()

    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Eres un extractor de datos de recibos. Tu objetivo es convertir la imagen en JSON. 
                        Contexto: Colombia. 
                        Categorías disponibles (USA LOS IDs): [${categoriesList}].
                        
                        IMPORTANTE: Si el recibo tiene múltiples ítems claros que deben registrarse por separado, devuélvelos como una lista.
                        
                        Responde ÚNICAMENTE con este JSON:
                        {
                            "transactions": [
                                {
                                    "amount": number,
                                    "category_id": "string-uuid",
                                    "description": "Limpiar descripción (ej: 'Pizza')",
                                    "emoji": "emoji sugerido"
                                }
                            ]
                        }`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content || '{"transactions": []}';
        const aiResult = JSON.parse(content);
        const transactions = await Promise.all((aiResult.transactions || []).map(async (t: any) => {
            const category = dbCategories?.find((c: any) => c.id === t.category_id) || { id: null, name: 'General', emoji: '📦' };
            const categoryId = t.category_id || category.id;
            
            // Detect anomalies
            let warning: string | undefined;
            if (user && categoryId) {
                warning = await detectAnomaly(user.id, categoryId, t.amount || 0);
            }

            return {
                id: crypto.randomUUID(),
                amount: t.amount || 0,
                category_id: categoryId,
                category: category,
                description: t.description || 'Gasto desde imagen',
                date: new Date().toISOString(),
                emoji: t.emoji || category.emoji || '📦',
                warning
            } as Transaction;
        }));

        return transactions;
    } catch (error) {
        console.error('Error al procesar imagen con IA:', error);
        throw new Error('Error al analizar la imagen. Intenta con una foto más clara.');
    }
}

export async function getTransactions(
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    category_id?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: [], count: 0, error: 'Usuario no autenticado' };

  let query = supabase
    .from('transactions')
    .select('*, category:categories(name, emoji)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (filters?.category_id && filters.category_id !== 'all') {
    query = query.eq('category_id', filters.category_id);
  }

  if (filters?.startDate) {
    query = query.gte('date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('date', filters.endDate);
  }
  
  if (filters?.search) {
      query = query.ilike('description', `%${filters.search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error('Error fetching transactions:', error);
    return { data: [], count: 0, error: error.message };
  }

  return { data, count };
}

export async function updateTransaction(id: string, updates: Partial<Transaction>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Usuario no autenticado' };

    const { error } = await supabase
        .from('transactions')
        .update({
            amount: updates.amount,
            description: updates.description,
            date: updates.date,
            // category_id: updates.category_id, // TODO: Enable when we have a category selector
        })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating transaction:', error);
        return { success: false, error: error.message };
    }
    
    revalidatePath('/');
    revalidatePath('/transactions');
    return { success: true };
}

export async function deleteTransaction(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Usuario no autenticado' };

    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting transaction:', error);
        return { success: false, error: error.message };
    }
    
    revalidatePath('/');
    revalidatePath('/transactions');
    return { success: true };
}
