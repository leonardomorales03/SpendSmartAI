'use server'

import { createClient } from '@/lib/supabase/server'

export async function detectAnomaly(userId: string, categoryId: string, amount: number): Promise<string | undefined> {
    const supabase = await createClient()

    // 1. Fetch historical data for this category (last 30 transactions)
    const { data: history, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('category_id', categoryId)
        .order('date', { ascending: false })
        .limit(30);

    if (error || !history || history.length < 5) {
        // Not enough data to determine anomaly
        return undefined;
    }

    // 2. Calculate Mean and Standard Deviation
    const amounts = history.map(t => t.amount);
    const n = amounts.length;
    const mean = amounts.reduce((a, b) => a + b, 0) / n;
    
    const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // 3. Z-Score Calculation
    // We only care about high anomalies (spending too much)
    const threshold = 2.0; // 2 Sigma (95% confidence interval)
    
    // Avoid division by zero if stdDev is 0 (all amounts are the same)
    if (stdDev === 0) {
        if (amount > mean * 2) {
             return `Este gasto es inusualmente alto (Promedio: ${formatCurrency(mean)})`;
        }
        return undefined;
    }

    const zScore = (amount - mean) / stdDev;

    if (zScore > threshold) {
        return `Este gasto es ${zScore.toFixed(1)}x más alto de lo normal para esta categoría (Promedio: ${formatCurrency(mean)})`;
    }

    return undefined;
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(amount);
}
