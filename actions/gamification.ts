'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Types for Gamification
export type UserProgress = {
    id: string
    user_id: string
    xp: number
    level: number
    current_streak: number
    longest_streak: number
    last_activity_date: string | null
    display_name: string | null
    next_level_xp: number
    progress_percent: number
}

export type Achievement = {
    id: string
    code: string
    title: string
    description: string
    icon_name: string
    xp_reward: number
    unlocked_at?: string | null
}

const LEVEL_XP_BASE = 100
const LEVEL_MULTIPLIER = 1.5

// Helper to calculate level threshold
function getXpForLevel(level: number): number {
    // Level 1: 0 XP
    // Level 2: 100 XP
    // Level 3: 250 XP
    // ...
    return Math.floor(LEVEL_XP_BASE * Math.pow(level - 1, LEVEL_MULTIPLIER))
}

export async function getUserProgress(): Promise<UserProgress | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    // Ensure user_progress exists
    const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!progress) {
        // Create if missing (fallback for existing users before migration trigger)
        const { data: newProgress } = await supabase
            .from('user_progress')
            .insert({ user_id: user.id, display_name: user.email?.split('@')[0] })
            .select()
            .single()
        
        if (!newProgress) return null // Handle failed insert

        return formatProgress(newProgress)
    }

    return formatProgress(progress)
}

function formatProgress(raw: RawUserProgress): UserProgress {
    if (!raw) {
        console.error('formatProgress received null raw data')
        throw new Error('Progress data is missing')
    }
    const currentLevelXp = getXpForLevel(raw.level)
    const nextLevelXp = getXpForLevel(raw.level + 1)
    const needed = nextLevelXp - currentLevelXp
    const current = raw.xp - currentLevelXp
    const percent = Math.min(100, Math.max(0, (current / needed) * 100))

    return {
        ...raw,
        next_level_xp: nextLevelXp,
        progress_percent: percent
    }
}

type RawUserProgress = {
    id: string
    user_id: string
    xp: number
    level: number
    current_streak: number
    longest_streak: number
    last_activity_date: string | null
    display_name: string | null
}

type RawAchievement = {
    id: string
    code: string
    title: string
    description: string
    icon_name: string
    xp_reward: number
    condition_type: 'TRANSACTION_COUNT' | 'STREAK_DAYS' | 'TIME_LATE' | 'TIME_EARLY'
    condition_value: number
    category: string
}

type UserAchievementRow = {
    achievement_id: string
    unlocked_at?: string
}

export async function getAchievements(): Promise<Achievement[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return []

    // Get all achievements
    const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .order('xp_reward', { ascending: true })

    // Get unlocked
    const { data: unlocked } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id)

    const unlockedMap = new Map(
        (unlocked as UserAchievementRow[] | null | undefined)?.map((u) => [
            u.achievement_id,
            u.unlocked_at,
        ]) || [],
    )

    return ((allAchievements || []) as RawAchievement[]).map((a) => ({
        ...a,
        unlocked_at: unlockedMap.get(a.id) || null,
    }))
}

export async function checkDailyStreak(userId: string) {
    const supabase = await createClient()
    
    const today = new Date().toISOString().split('T')[0]
    
    const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (!progress) return

    const lastActivity = progress.last_activity_date
    
    // Logic:
    // If last_activity == today, do nothing (already counted)
    // If last_activity == yesterday, increment streak
    // If last_activity < yesterday, reset streak to 1
    // If last_activity is null, set to 1

    if (lastActivity === today) return // Already checked in

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    
    let newStreak = 1
    if (lastActivity === yesterday) {
        newStreak = progress.current_streak + 1
    }

    const updates: Partial<RawUserProgress> = {
        last_activity_date: today,
        current_streak: newStreak
    }

    if (newStreak > progress.longest_streak) {
        updates.longest_streak = newStreak
    }

    await supabase
        .from('user_progress')
        .update(updates)
        .eq('user_id', userId)
    
    return newStreak
}

export async function addXp(amount: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (!progress) return

    const newXp = progress.xp + amount
    let newLevel = progress.level
    
    // Check level up
    while (newXp >= getXpForLevel(newLevel + 1)) {
        newLevel++
    }

    await supabase
        .from('user_progress')
        .update({ xp: newXp, level: newLevel })
        .eq('user_id', user.id)

    if (newLevel > progress.level) {
        return { leveledUp: true, newLevel }
    }
    
    revalidatePath('/')
    return { leveledUp: false }
}

type TransactionForAchievements = {
    date: string
}

export async function checkAchievements(transaction: TransactionForAchievements) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const unlocked: Achievement[] = []

    // 1. Get locked achievements
    const { data: allAchievements } = await supabase.from('achievements').select('*')
    const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id)

    const unlockedIds = new Set(
        (userAchievements as UserAchievementRow[] | null | undefined)?.map(
            (ua) => ua.achievement_id,
        ) || [],
    )
    const locked =
        (allAchievements as RawAchievement[] | null | undefined)?.filter(
            (a) => !unlockedIds.has(a.id),
        ) || []

    // 2. Evaluate conditions
    // This is a simplified check. In a real app, this might be more complex or use triggers.
    
    // Count total transactions
    const { count: txCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

    // Check Streak
    const { data: progress } = await supabase
        .from('user_progress')
        .select('current_streak')
        .eq('user_id', user.id)
        .single()
    
    const currentStreak = progress?.current_streak || 0

    // Check Time
    const txDate = new Date(transaction.date)
    const hour = txDate.getHours()

    for (const achievement of locked) {
        let shouldUnlock = false

        switch (achievement.condition_type) {
            case 'TRANSACTION_COUNT':
                if ((txCount || 0) >= achievement.condition_value) shouldUnlock = true
                break
            case 'STREAK_DAYS':
                if (currentStreak >= achievement.condition_value) shouldUnlock = true
                break
            case 'TIME_LATE':
                if (hour >= 22) shouldUnlock = true // After 10 PM
                break
            case 'TIME_EARLY':
                if (hour < 7) shouldUnlock = true // Before 7 AM
                break
        }

        if (shouldUnlock) {
            // Unlock!
            await supabase.from('user_achievements').insert({
                user_id: user.id,
                achievement_id: achievement.id
            })
            
            // Give Reward
            await addXp(achievement.xp_reward)
            
            unlocked.push(achievement)
        }
    }

    if (unlocked.length > 0) {
        revalidatePath('/achievements')
    }

    return unlocked
}
