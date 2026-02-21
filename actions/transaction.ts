'use server'

import { Transaction, AIAnswer, Category } from '@/lib/types'

type AiTransaction = {
    amount?: number;
    category_id?: string;
    description?: string;
    emoji?: string;
};

type AiTransactionItem = {
    name?: string;
    quantity?: number;
    unit_price?: number;
    total_amount?: number;
    category?: string;
};

type AiTransactionWithItems = AiTransaction & {
    items?: AiTransactionItem[];
};
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { groq, GROQ_MODELS } from '@/lib/groq'
import { checkRateLimit } from '@/lib/rate-limit'
import { detectAnomaly } from './anomaly'
import { checkDailyStreak, checkAchievements, addXp } from './gamification'
import { addDebtPayment, getDebts, syncDebtPayment, deleteDebtPaymentByTransaction } from './debts'
import { getSavingGoals, upsertSavingGoal } from '@/actions/saving-goals'

export async function extractFromPdf(formData: FormData): Promise<Transaction[] | AIAnswer> {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No se proporcionó ningún archivo PDF');

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const rate = await checkRateLimit({
        key: 'ai_pdf_extract',
        maxRequests: 20,
        windowSeconds: 60 * 60,
    })

    if (!rate.allowed) {
        return {
            type: 'answer',
            text: 'Has alcanzado el límite de análisis de documentos por hora. Intenta de nuevo más tarde.',
        } as AIAnswer
    }

    try {
        const pdf2json = await import('pdf2json');
        type PdfParserErrorEvent = {
            parserError?: unknown;
        };
        type PdfParserInstance = {
            on: (
                event: 'pdfParser_dataError' | 'pdfParser_dataReady',
                cb: (data: PdfParserErrorEvent) => void
            ) => void;
            parseBuffer: (buffer: Buffer) => void;
            getRawTextContent: () => string;
        };
        type Pdf2JsonModule = {
            default?: new (...args: unknown[]) => PdfParserInstance;
        } | (new (...args: unknown[]) => PdfParserInstance);

        const PdfCtor =
            (pdf2json as Pdf2JsonModule as { default?: new (...args: unknown[]) => PdfParserInstance })
                .default ?? (pdf2json as unknown as new (...args: unknown[]) => PdfParserInstance);

        const text = await new Promise<string>((resolve, reject) => {
            const pdfParser = new PdfCtor(null, 1);

            pdfParser.on("pdfParser_dataError", (errData) => {
                const error =
                    errData.parserError instanceof Error
                        ? errData.parserError
                        : new Error('Error al procesar el PDF');
                reject(error);
            });
            pdfParser.on("pdfParser_dataReady", () => {
                resolve(pdfParser.getRawTextContent());
            });

            pdfParser.parseBuffer(buffer);
        });

        console.log('--- TEXTO EXTRAÍDO DE PDF (pdf2json) ---');
        console.log(text.substring(0, 200) + '...'); // Log truncado para no ensuciar

        return extractTransactionDetails(text, { autoSaveItems: false });
    } catch (error) {
        console.error('Error al procesar PDF:', error);
        throw new Error('No se pudo procesar el PDF');
    }
}

export async function extractTransactionDetails(
    text: string,
    options?: { autoSaveItems?: boolean }
): Promise<Transaction[] | AIAnswer> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const rate = await checkRateLimit({
        key: 'ai_text_extract',
        maxRequests: 20,
        windowSeconds: 60 * 60,
    })

    if (!rate.allowed) {
        return {
            type: 'answer',
            text: 'Has alcanzado el límite de solicitudes de IA por hora. Intenta de nuevo más tarde.',
        } as AIAnswer
    }

    // 1. DETECT IF IT IS A QUESTION (ASK MY MONEY)
    if (text.startsWith('?')) {
        if (!user) {
            return {
                type: 'answer',
                text: "Debes iniciar sesión para consultar tus datos.",
            } as AIAnswer;
        }

        try {
            // Obtenemos historial reciente para que la IA responda con contexto real
            const { data: recentTransactions } = await supabase
                .from('transactions')
                .select('*, category:categories(name)')
                .eq('user_id', user.id)
                .limit(20);

            // Obtenemos los presupuestos por categoría
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
                model: GROQ_MODELS.TEXT_GENERAL,
            });

            return {
                type: 'answer',
                text: completion.choices[0]?.message?.content || "No pude procesar tu pregunta.",
            } as AIAnswer;
        } catch (error) {
            console.error('Error en IA de preguntas financieras:', error);
            return {
                type: 'answer',
                text: "Lo siento, hubo un problema al usar la IA para responder tu pregunta. Intenta de nuevo más tarde o reformúlala de forma más simple.",
            } as AIAnswer;
        }
    }

    // 2. NORMAL TRANSACTION EXTRACTION WITH REAL AI
    console.log('--- PROCESANDO CON IA (Multi-Transaction) ---');
    console.log('Texto recibido:', text);

    try {
        const { data: dbCategories } = await supabase.from('categories').select('*');
        const categories = (dbCategories || []) as Category[];
        const categoriesList = categories.map((c) => `${c.name} (ID: ${c.id})`).join(', ');

        const { data: debts } = await getDebts();
        const debtsList = (debts || []).map(d => `${d.name} (ID: ${d.id}, Saldo: ${d.remaining_amount})`).join(', ');

        const savingGoals = await getSavingGoals();
        const goalsList = savingGoals.map(g => `${g.name} (ID: ${g.id}, Actual: ${g.current_amount})`).join(', ');

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Eres un extractor de datos bancarios. Tu objetivo es convertir lenguaje natural en un array de transacciones JSON. 
                    Contexto: Colombia. 
                    Si el usuario dice 'k' o 'mil', multiplícalo (ej: 50k = 50000). 
                    Categorías disponibles (USA LOS IDs PROPORCIONADOS): [${categoriesList}].
                    
                    DEUDAS DISPONIBLES: [${debtsList}].
                    Si el usuario menciona un "abono", "pago de tarjeta", "pago de cuota" o similar, intenta identificar a qué DEUDA se refiere.

                    METAS DE AHORRO DISPONIBLES: [${goalsList}].
                    Si el usuario menciona "ahorrar X para Y", "meter X a Y", "agregar X al ahorro Y" o similar:
                    1. Verifica si el nombre "Y" coincide EXACTAMENTE o es MUY SIMILAR a una meta existente.
                    2. Si coincide, usa el campo "goal_updates".
                    3. Si NO coincide con ninguna meta de la lista, RESPONDE con una transacción normal (gasto) O, si es claramente una intención de ahorro pero la meta no existe, puedes ignorarlo en "transactions" y responder en texto que la meta no existe (pero el formato JSON no permite texto libre fuera de la estructura, así que mejor asume que es un gasto o ignóralo).
                    4. PRIORIDAD: Si la meta no existe, NO inventes un ID.
                    
                    IMPORTANTE: Si el usuario menciona múltiples gastos (ej: "4000 en comida y 10000 en gasolina"), extrae CADA UNO por separado.
                    
                    Responde ÚNICAMENTE con este JSON:
                    {
                        "transactions": [
                            {
                                "amount": number,
                                "category_id": "string-uuid",
                                "debt_id": "string-uuid (SOLO SI ES UN ABONO A DEUDA)",
                                "description": "Limpiar descripción (ej: 'Pizza' o 'Abono Tarjeta NU')",
                                "emoji": "emoji sugerido",
                                "items": [
                                    {
                                        "name": "Nombre del producto o concepto",
                                        "quantity": number,
                                        "unit_price": number,
                                        "total_amount": number,
                                        "category": "Etiqueta opcional, ej: 'lácteos'"
                                    }
                                ]
                            }
                        ],
                        "goal_updates": [
                            {
                                "goal_id": "string-uuid",
                                "amount_to_add": number
                            }
                        ]
                    }`
                },
                {
                    role: "user",
                    content: text
                },
            ],
            model: GROQ_MODELS.TEXT_GENERAL,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content || '{"transactions": []}';
        console.log('Respuesta AI:', content);

        const aiResult = JSON.parse(content) as { 
            transactions?: AiTransactionWithItems[],
            goal_updates?: { goal_id: string, amount_to_add: number }[]
        };

        // 2.1 PROCESS GOAL UPDATES
        let goalUpdateMessage = '';
        if (aiResult.goal_updates && aiResult.goal_updates.length > 0) {
            for (const update of aiResult.goal_updates) {
                const goal = savingGoals.find(g => g.id === update.goal_id);
                if (goal) {
                    const newAmount = (goal.current_amount || 0) + update.amount_to_add;
                    await upsertSavingGoal({
                        id: goal.id,
                        name: goal.name,
                        target_amount: goal.target_amount,
                        current_amount: newAmount,
                        deadline: goal.deadline,
                        category: goal.category
                    });
                    goalUpdateMessage += `Abonado ${update.amount_to_add} a ${goal.name}. `;
                }
            }
        }

        // If only goals were updated and no transactions, return answer
        if ((!aiResult.transactions || aiResult.transactions.length ===0) && goalUpdateMessage) {
            // Fetch updated goals to return to UI
            const updatedGoals = await getSavingGoals();
            return {
                type: 'answer',
                text: `¡Listo! ${goalUpdateMessage}`,
                refreshRequired: true,
                updatedGoals
            } as AIAnswer;
        }

        const transactions = await Promise.all((aiResult.transactions || []).map(async (t: AiTransactionWithItems) => {
            const category =
                categories.find((c) => c.id === t.category_id) ||
                { id: 'unknown', name: 'General', emoji: '📦' };
            const categoryId = t.category_id || category.id;

            let warning: string | undefined;
            if (user && categoryId) {
                warning = await detectAnomaly(user.id, categoryId, t.amount || 0);
            }

            const transaction: Transaction = {
                id: crypto.randomUUID(),
                amount: t.amount || 0,
                category_id: categoryId,
                category: category,
                description: t.description || text,
                date: new Date().toISOString(),
                emoji: t.emoji || category.emoji || '📦',
                warning,
                debt_id: (t as any).debt_id,
                items: t.items?.map(i => ({
                    id: crypto.randomUUID(),
                    transaction_id: '', // Will be set on save
                    name: i.name || 'Item',
                    quantity: i.quantity || 1,
                    unit_price: i.unit_price || 0,
                    total_amount: i.total_amount || 0,
                    category: i.category
                }))
            };

            if (options?.autoSaveItems && user) {
                await saveTransaction(transaction, t.items);
            }

            return transaction;
        }));

        return transactions;
    } catch (error) {
        console.error('Error en extracción de transacciones con IA:', error);
        return [];
    }
}

export async function saveTransaction(transaction: Transaction, items?: AiTransactionItem[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
    }

    // IF IT'S A DEBT PAYMENT, USE addDebtPayment instead
    if (transaction.debt_id) {
        const debtResult = await addDebtPayment({
            debt_id: transaction.debt_id,
            amount: transaction.amount,
            date: transaction.date,
            note: transaction.description
        });

        if (debtResult.success) {
            revalidatePath('/');
            return { success: true };
        } else {
            return { success: false, error: debtResult.error || 'Error al registrar abono a deuda' };
        }
    }

    const { data, error } = await supabase
        .from('transactions')
        .insert([{
            amount: transaction.amount,
            category_id: transaction.category_id,
            description: transaction.description,
            date: transaction.date,
            user_id: user.id
        }])
        .select('id')
        .single();

    if (error || !data) {
        console.error('Error saving to Supabase:', error);
        return { success: false, error: error?.message || 'Error guardando transacción' };
    }

    const transactionId = data.id as string;

    // Use provided items OR items from the transaction object
    // We handle both AiTransactionItem and TransactionItem structures
    const itemsToProcess = items || transaction.items;

    if (itemsToProcess && itemsToProcess.length > 0) {
        const validItems = itemsToProcess
            .filter((i) => i.name && (i.total_amount || i.unit_price))
            .map((i) => ({
                user_id: user.id,
                transaction_id: transactionId,
                name: i.name as string,
                quantity: i.quantity ?? 1,
                unit_price: i.unit_price ?? (i.total_amount ?? 0),
                total_amount: i.total_amount ?? (i.unit_price ?? 0),
                category: i.category ?? null
            }));

        if (validItems.length > 0) {
            const { error: itemsError } = await supabase
                .from('transaction_items')
                .insert(validItems);

            if (itemsError) {
                console.error('Error saving transaction items:', itemsError);
            }
        }
    }

    // --- GAMIFICATION HOOKS ---
    try {
        // 1. Check Streak
        await checkDailyStreak(user.id);

        // 2. Add XP for transaction (10 XP)
        await addXp(10);

        // 3. Check Achievements
        const unlocked = await checkAchievements(transaction);

        revalidatePath('/');
        return { success: true, unlockedAchievements: unlocked };
    } catch (gamificationError) {
        console.error('Gamification error:', gamificationError);
        // Don't fail the transaction if gamification fails
        revalidatePath('/');
        return { success: true };
    }
}

export async function transcribeAudio(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No se proporcionó ningún archivo de audio');

    const rate = await checkRateLimit({
        key: 'ai_audio_transcription',
        maxRequests: 20,
        windowSeconds: 60 * 60,
    })

    if (!rate.allowed) {
        throw new Error('Has alcanzado el límite de transcripciones de audio por hora. Intenta de nuevo más tarde.');
    }

    const transcription = await groq.audio.transcriptions.create({
        file: file,
        model: GROQ_MODELS.AUDIO_TRANSCRIPTION,
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

    const rate = await checkRateLimit({
        key: 'ai_image_extract',
        maxRequests: 20,
        windowSeconds: 60 * 60,
    })

    if (!rate.allowed) {
        return {
            type: 'answer',
            text: 'Has alcanzado el límite de análisis de imágenes por hora. Intenta de nuevo más tarde.',
        } as AIAnswer
    }

    const supabase = await createClient()
    const { data: dbCategories } = await supabase.from('categories').select('*');
    const categories = (dbCategories || []) as Category[];
    const categoriesList = categories.map((c) => `${c.name} (ID: ${c.id})`).join(', ');

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
                        
                        IMPORTANTE: Si el recibo tiene múltiples ítems claros que deben registrarse por separado, devuélvelos como una lista dentro de cada transacción, en el campo "items".
                        
                        Responde ÚNICAMENTE con este JSON:
                        {
                            "transactions": [
                                {
                                    "amount": number,
                                    "category_id": "string-uuid",
                                    "description": "Limpiar descripción (ej: 'Pizza')",
                                    "emoji": "emoji sugerido",
                                    "items": [
                                        {
                                            "name": "Nombre del producto o concepto",
                                            "quantity": number,
                                            "unit_price": number,
                                            "total_amount": number,
                                            "category": "Etiqueta opcional, ej: 'lácteos'"
                                        }
                                    ]
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
            model: GROQ_MODELS.IMAGE_EXTRACTION,
            response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content || '{"transactions": []}';
        const aiResult = JSON.parse(content) as { transactions?: AiTransactionWithItems[] };
        const transactions = await Promise.all((aiResult.transactions || []).map(async (t: AiTransactionWithItems) => {
            const category =
                categories.find((c) => c.id === t.category_id) ||
                { id: 'unknown', name: 'General', emoji: '📦' };
            const categoryId = t.category_id || category.id;

            let warning: string | undefined;
            if (user && categoryId) {
                warning = await detectAnomaly(user.id, categoryId, t.amount || 0);
            }

            const transaction: Transaction = {
                id: crypto.randomUUID(),
                amount: t.amount || 0,
                category_id: categoryId,
                category: category,
                description: t.description || 'Gasto desde imagen',
                date: new Date().toISOString(),
                emoji: t.emoji || category.emoji || '📦',
                warning,
                items: t.items?.map(i => ({
                    id: crypto.randomUUID(),
                    transaction_id: '',
                    name: i.name || 'Item',
                    quantity: i.quantity || 1,
                    unit_price: i.unit_price || 0,
                    total_amount: i.total_amount || 0,
                    category: i.category
                }))
            };

            // Removed explicit save to avoid duplication in MagicInput
            // if (user) {
            //     await saveTransaction(transaction, t.items);
            // }

            return transaction;
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
        .select('*, category:categories(name, emoji), debt_payment:debt_payments(debt_id), items:transaction_items(*)', { count: 'exact' })
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

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

    // After fetching:
    const { data: rawData, count, error } = await query.range(from, to);

    if (error) {
        console.error('Error fetching transactions:', error);
        return { data: [], count: 0, error: error.message };
    }

    const data = (rawData as any[]).map(t => ({
        ...t,
        debt_id: Array.isArray(t.debt_payment)
            ? t.debt_payment[0]?.debt_id
            : t.debt_payment?.debt_id
    }));

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
            category_id: updates.category_id,
        })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating transaction:', error);
        return { success: false, error: error.message };
    }

    // Sync with debt if necessary
    if (updates.amount !== undefined || updates.debt_id !== undefined) {
        await syncDebtPayment(id, updates.amount || 0, updates.debt_id);
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

    // Unlink and revert debt if necessary
    await deleteDebtPaymentByTransaction(id);

    revalidatePath('/');
    revalidatePath('/transactions');
    return { success: true };
}
