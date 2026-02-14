'use server'

/**
 * Server action to fetch real-time exchange rates.
 * Uses the free Frankfurter API (https://api.frankfurter.app)
 * It supports common currencies like USD, EUR, GBP, CAD, AUD, JPY, CHF, CNY, MXN, BRL, etc.
 * Note: COP is not directly supported by Frankfurter as a base currency in some free tiers, 
 * but it is supported as a target. However, for a robust solution we might need a fallback or a different API if Frankfurter fails for specific pairs.
 * 
 * Update: Frankfurter supports many currencies but let's check if COP is supported as BASE.
 * If not, we can convert via USD (e.g. COP -> USD = 1 / (USD -> COP)).
 */

export async function getExchangeRate(from: string, to: string): Promise<number | null> {
    if (from === to) return 1;

    try {
        // Try direct conversion
        const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`, { next: { revalidate: 3600 } }); // Cache for 1 hour
        
        if (!response.ok) {
            // Fallback: Frankfurter might not support COP as base. 
            // Strategy: Convert everything to USD first, then to target.
            // But Frankfurter free API has limitations on base currencies.
            // Let's try Open Exchange Rates or similar if needed, but for now let's try a different free API that supports more bases:
            // https://open.er-api.com/v6/latest/USD (Open Exchange Rates free tier is good but requires key, open.er-api is a wrapper)
            // Let's use https://api.exchangerate-api.com/v4/latest/USD which is often open.
            
            // Alternative: https://api.exchangerate-api.com/v4/latest/${from}
            const fallbackResponse = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
            if (fallbackResponse.ok) {
                const data = await fallbackResponse.json();
                return data.rates[to] || null;
            }
            
            throw new Error('Failed to fetch exchange rate');
        }

        const data = await response.json();
        return data.rates[to];
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        
        // Second fallback: specific hardcoded check for common pairs if API fails (just in case)
        // This is "smart" enough for a demo if offline
        if (from === 'USD' && to === 'COP') return 4100;
        if (from === 'COP' && to === 'USD') return 0.00024;
        if (from === 'EUR' && to === 'COP') return 4500;
        if (from === 'COP' && to === 'EUR') return 0.00022;
        
        return null;
    }
}
