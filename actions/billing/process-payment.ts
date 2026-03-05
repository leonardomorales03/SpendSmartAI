'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function processMockPayment(planId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Usuario no autenticado' }
    }

    try {
        // Call the secure RPC function to update user_settings and create subscription
        const { data, error } = await supabase.rpc('process_mock_payment', {
            p_plan_id: planId
        })

        if (error) {
            console.error('Error in process_mock_payment RPC:', error)
            throw new Error(error.message)
        }

        revalidatePath('/', 'layout')
        
        return { success: true, data }
    } catch (error) {
        console.error('Error processing mock payment:', error)
        return { success: false, error: 'Error al procesar el pago' }
    }
}
