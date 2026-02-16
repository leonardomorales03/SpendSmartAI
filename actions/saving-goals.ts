'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SavingGoal } from '@/lib/types'

export async function getSavingGoals(): Promise<SavingGoal[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('saving_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

    if (error || !data) {
        console.error('Error fetching saving goals:', error)
        return []
    }

    return data as SavingGoal[]
}

type SavingGoalInput = {
    id?: string
    name: string
    target_amount: number
    current_amount?: number
    deadline?: string | null
    category?: string | null
}

type UpsertSavingGoalResult = {
    success: boolean
    error?: string
    goal?: SavingGoal
}

export async function upsertSavingGoal(input: SavingGoalInput): Promise<UpsertSavingGoalResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Usuario no autenticado' }
    }

    const payload: Partial<SavingGoal> = {
        user_id: user.id,
        name: input.name,
        target_amount: input.target_amount,
        current_amount: input.current_amount ?? 0,
        deadline: input.deadline ?? null,
        category: input.category ?? null
    }

    if (input.id) {
        payload.id = input.id
    }

    const { data, error } = await supabase
        .from('saving_goals')
        .upsert(payload)
        .select('*')
        .single()

    if (error || !data) {
        console.error('Error upserting saving goal:', error)
        return { success: false, error: error?.message || 'No se pudo guardar la meta' }
    }

    revalidatePath('/')

    return { success: true, goal: data as SavingGoal }
}

export async function deleteSavingGoal(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Usuario no autenticado' }
    }

    const { error } = await supabase
        .from('saving_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting saving goal:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/')

    return { success: true }
}
