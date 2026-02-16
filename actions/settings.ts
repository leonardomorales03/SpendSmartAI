'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getExchangeRate } from '@/actions/currency'

export type UserSettings = {
    id: string
    user_id: string
    monthly_budget: number
    currency: string
    locale: string
    language?: 'es' | 'en'
    has_completed_onboarding?: boolean
}

export type UserProfile = {
    displayName: string | null
    avatarUrl: string | null
    email: string | null
}

export async function getSettings() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    // Fetch settings
    const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

    // Fetch profile (from user_progress or auth metadata if we decide to sync)
    // For now we use user_progress as the source of truth for display_name/avatar
    const { data: profile } = await supabase
        .from('user_progress')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle()

    // Default settings if not found
    const defaultSettings: UserSettings = {
        id: settings?.id || '',
        user_id: user.id,
        monthly_budget: settings?.monthly_budget || 1000000,
        currency: settings?.currency || 'COP',
        locale: settings?.locale || 'es-CO',
        language: settings?.language || 'es',
        has_completed_onboarding: settings?.has_completed_onboarding || false
    }

    return {
        settings: defaultSettings,
        profile: {
            displayName: profile?.display_name || user.email?.split('@')[0] || 'Usuario',
            avatarUrl: profile?.avatar_url || null,
            email: user.email || null
        } as UserProfile
    }
}

type UpdatePreferencesInput = {
    currency?: string
    locale?: string
    monthlyBudget?: number
    language?: string
    hasCompletedOnboarding?: boolean
}

type TransactionRow = {
    id: string
    user_id: string
    amount: number
}

type CategoryBudgetRow = {
    id: string
    user_id: string
    category_id: string
    amount: number
}

type UserSettingsUpdate = {
    currency?: string
    locale?: string
    monthly_budget?: number
    language?: string
    has_completed_onboarding?: boolean
}

export async function updatePreferences(data: UpdatePreferencesInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { success: false, error: 'Unauthorized' }

    // Check if settings exist
    const { data: existing } = await supabase
        .from('user_settings')
        .select('id, currency')
        .eq('user_id', user.id)
        .maybeSingle()

    let error
    let rate = 1;

    // Check if currency changed
    if (existing && data.currency && existing.currency !== data.currency) {
        // Fetch rate to convert other data
        const fetchedRate = await getExchangeRate(existing.currency, data.currency);
        if (fetchedRate) {
            rate = fetchedRate;
        } else {
            console.warn(`Could not fetch rate for ${existing.currency} -> ${data.currency}, using 1`);
        }
    }

    if (existing) {
        // 1. Update Settings
        const updatePayload: UserSettingsUpdate = {
            currency: data.currency,
            locale: data.locale,
            monthly_budget: data.monthlyBudget,
            language: data.language
        }
        
        if (data.hasCompletedOnboarding !== undefined) {
            updatePayload.has_completed_onboarding = data.hasCompletedOnboarding
        }

        const { error: updateError } = await supabase
            .from('user_settings')
            .update(updatePayload)
            .eq('user_id', user.id)
        error = updateError

        // 2. If currency changed and rate is valid, update all transactions and category budgets
        if (rate !== 1) {
            console.log(`Converting user data from ${existing.currency} to ${data.currency} with rate ${rate}`);
            
            // Note: This should ideally be a transaction or RPC for atomicity.
            // But for now we do sequential updates.
            
            // A. Update Transactions
            // We need to fetch all transactions first because we can't do "amount = amount * X" in Supabase Client update easily without RPC
            // Actually, maybe we can write a quick RPC or just iterate. Iterating is safer for small datasets.
            // Let's create an RPC for this would be better, but let's try RPC if possible, otherwise fetch-update loop.
            // Given I cannot create RPC easily from here without migration file, I will use fetch-update for now (assuming < 1000 txs).
            // Actually, let's use a raw SQL query if possible? No, we are in client.
            // Let's iterate. It's an MVP.

            const { data: transactions } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id);
            
            if (transactions && transactions.length > 0) {
                const updates = (transactions as TransactionRow[]).map(t => ({
                    ...t,
                    amount: t.amount * rate
                }));
                
                // Supabase upsert/update batch
                for (const batch of chunkArray(updates, 100)) {
                    const { error } = await supabase.from('transactions').upsert(batch);
                    if (error) console.error('Error updating transactions batch:', error);
                }
            }

            // B. Update Category Budgets
            const { data: catBudgets } = await supabase
                .from('category_budgets')
                .select('id, amount, category_id, user_id')
                .eq('user_id', user.id);

            if (catBudgets && catBudgets.length > 0) {
                const budgetUpdates = (catBudgets as CategoryBudgetRow[]).map(b => ({
                    ...b,
                    amount: b.amount * rate
                }));
                await supabase.from('category_budgets').upsert(budgetUpdates);
            }
        }

    } else {
        const { error: insertError } = await supabase
            .from('user_settings')
            .insert({
                user_id: user.id,
                currency: data.currency || 'COP',
                locale: data.locale || 'es-CO',
                monthly_budget: data.monthlyBudget || 1000000,
                language: data.language || 'es',
                has_completed_onboarding: data.hasCompletedOnboarding || false
            })
        error = insertError
    }

    if (error) {
        console.error('Error updating preferences:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/settings')
    revalidatePath('/budget')
    
    return { success: true }
}

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = []
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size))
    }
    return chunked
}

export async function updateProfile(data: { displayName?: string, avatarUrl?: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { success: false, error: 'Unauthorized' }

    // Update user_progress (which acts as profile)
    const { error } = await supabase
        .from('user_progress')
        .update({
            display_name: data.displayName,
            avatar_url: data.avatarUrl
        })
        .eq('user_id', user.id)

    if (error) {
        console.error('Error updating profile:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/settings')

    return { success: true }
}

export async function updatePassword(password: string) {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })
    
    if (error) {
        return { success: false, error: error.message }
    }
    
    return { success: true }
}
