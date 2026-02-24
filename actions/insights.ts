'use server'

import { groq } from '@/lib/groq'
import { Transaction } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'

export async function getAIPredictiveInsights(
    transactions: Transaction[],
    budget: number,
    dailyAverage: number,
    projectedTotal: number
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'User not authenticated' }
        }

        // Prepare data summary to save tokens
        const categoryMap: Record<string, number> = {}
        transactions.forEach(t => {
            const catName = t.category?.name || 'General'
            categoryMap[catName] = (categoryMap[catName] || 0) + t.amount
        })

        const categorySummary = Object.entries(categoryMap)
            .sort((a, b) => b[1] - a[1])
            .map(([name, amount]) => `${name}: $${amount}`)
            .join(', ')

        const prompt = `Actúa como un asesor financiero inteligente y empático. Analiza los siguientes datos del mes actual del usuario.
        
Datos:
- Presupuesto mensual: $${budget}
- Gasto proyectado a fin de mes: $${projectedTotal}
- Promedio de gasto diario: $${dailyAverage}
- Principales gastos por categoría: ${categorySummary || 'Ninguno aún'}

Instrucciones:
1. Genera un "título" corto (máximo 4-5 palabras) que resuma la situación (ej: "Vas por buen camino", "Cuidado con el presupuesto", "Excelente ahorro", etc.).
2. Genera una "descripción" corta y muy directa (máximo 2-3 frases breves). Si el gasto proyectado supera el presupuesto, da una advertencia amigable y sugiere en qué categoría recortar. Si va bien, da un breve refuerzo positivo o un consejo para ahorrar el excedente.
3. Sé conciso, usando un tono coloquial (ej. colombiano si es posible pero sutil). 
4. Devuelve ÚNICAMENTE un JSON válido con esta estructura:
{
    "title": "tu título aquí",
    "description": "tu descripción aquí"
}
`

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile", // Need a model that reliably supports JSON format
            temperature: 0.7,
            max_tokens: 200,
            response_format: { type: "json_object" }
        })

        const content = completion.choices[0]?.message?.content?.trim()

        if (!content) {
            return { success: false, error: 'No se generó insight' }
        }

        const insightData = JSON.parse(content)

        return { success: true, insight: insightData }

    } catch (error) {
        console.error('Error generating AI insight:', error)
        return { success: false, error: 'Error al generar insight con IA' }
    }
}
