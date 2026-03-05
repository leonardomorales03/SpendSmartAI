'use server'

import { createClient } from '@/lib/supabase/server'
import { FREE_LIMITS, getUserPlan } from '@/lib/plan-limits'
import { revalidatePath } from 'next/cache'

export type LimitsStatus = {
    plan: 'free' | 'pro'
    aiChat: {
        count: number
        limit: number
        remaining: number
    }
    magicScan: {
        count: number
        limit: number
        remaining: number
    }
    savingGoals: {
        count: number
        limit: number
        remaining: number
    }
    debts: {
        count: number
        limit: number
        remaining: number
    }
}

export async function getLimitsStatus(): Promise<LimitsStatus> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const plan = await getUserPlan(user.id)

    // AI Chat Usage (24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: aiCount } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('event_name', 'ai_chat_usage')
        .gte('created_at', oneDayAgo)

    // Magic Scan Usage (30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: scanCount } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('event_name', 'magic_scan_usage')
        .gte('created_at', thirtyDaysAgo)

    // Saving Goals
    const { count: goalsCount } = await supabase
        .from('saving_goals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

    // Debts
    const { count: debtsCount } = await supabase
        .from('debts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

    return {
        plan,
        aiChat: {
            count: aiCount || 0,
            limit: FREE_LIMITS.AI_DAILY_LIMIT,
            remaining: Math.max(FREE_LIMITS.AI_DAILY_LIMIT - (aiCount || 0), 0)
        },
        magicScan: {
            count: scanCount || 0,
            limit: FREE_LIMITS.MAGIC_SCAN_MONTHLY_LIMIT,
            remaining: Math.max(FREE_LIMITS.MAGIC_SCAN_MONTHLY_LIMIT - (scanCount || 0), 0)
        },
        savingGoals: {
            count: goalsCount || 0,
            limit: FREE_LIMITS.MAX_SAVING_GOALS,
            remaining: Math.max(FREE_LIMITS.MAX_SAVING_GOALS - (goalsCount || 0), 0)
        },
        debts: {
            count: debtsCount || 0,
            limit: FREE_LIMITS.MAX_DEBTS,
            remaining: Math.max(FREE_LIMITS.MAX_DEBTS - (debtsCount || 0), 0)
        }
    }
}

export async function resetUsage(type: 'ai_chat' | 'magic_scan' | 'goals' | 'debts') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    if (type === 'ai_chat') {
        await supabase
            .from('analytics_events')
            .delete()
            .eq('user_id', user.id)
            .eq('event_name', 'ai_chat_usage')
    } else if (type === 'magic_scan') {
        await supabase
            .from('analytics_events')
            .delete()
            .eq('user_id', user.id)
            .eq('event_name', 'magic_scan_usage')
    } else if (type === 'goals') {
        // Only delete goals created by devtools (identified by specific name or just all?)
        // For safety, let's just delete ALL goals for this user in dev environment
        await supabase
            .from('saving_goals')
            .delete()
            .eq('user_id', user.id)
    } else if (type === 'debts') {
        await supabase
            .from('debts')
            .delete()
            .eq('user_id', user.id)
    }
    
    revalidatePath('/devtools/limits')
}

export async function resetToFreePlan() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    await supabase
        .from('user_settings')
        .update({
            plan: 'free',
            pro_until: null,
            billing_status: 'none',
            billing_provider: null,
            billing_customer_id: null
        })
        .eq('user_id', user.id)

    revalidatePath('/devtools/limits')
    revalidatePath('/')
}

export async function fillUsage(type: 'ai_chat' | 'magic_scan' | 'goals' | 'debts') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const status = await getLimitsStatus()

    if (type === 'ai_chat') {
        const needed = status.aiChat.remaining
        if (needed <= 0) return

        const events = Array(needed).fill(0).map(() => ({
            user_id: user.id,
            event_name: 'ai_chat_usage',
            event_data: { source: 'devtools' }
        }))
        await supabase.from('analytics_events').insert(events)

    } else if (type === 'magic_scan') {
        const needed = status.magicScan.remaining
        if (needed <= 0) return

        const events = Array(needed).fill(0).map(() => ({
            user_id: user.id,
            event_name: 'magic_scan_usage',
            event_data: { source: 'devtools' }
        }))
        await supabase.from('analytics_events').insert(events)

    } else if (type === 'goals') {
        const needed = status.savingGoals.remaining
        if (needed <= 0) return

        const goals = Array(needed).fill(0).map((_, i) => ({
            user_id: user.id,
            name: `Meta de Prueba ${i+1}`,
            target_amount: 1000,
            current_amount: 0,
            category: 'Ahorro'
        }))
        await supabase.from('saving_goals').insert(goals)

    } else if (type === 'debts') {
        const needed = status.debts.remaining
        if (needed <= 0) return

        const debts = Array(needed).fill(0).map((_, i) => ({
            user_id: user.id,
            name: `Deuda de Prueba ${i+1}`,
            original_amount: 500,
            remaining_amount: 500,
            type: 'other'
        }))
        await supabase.from('debts').insert(debts)
    }

    revalidatePath('/devtools/limits')
}
