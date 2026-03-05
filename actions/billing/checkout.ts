'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Mock types for now - will be replaced by real Wompi/Stripe types
export type CheckoutSession = {
    checkoutUrl: string
    sessionId: string
}

export async function createCheckoutSession(planId: string): Promise<{ success: boolean, url?: string, error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        return { success: false, error: 'Usuario no autenticado' }
    }

    try {
        // TODO: Integrate real Wompi/Stripe API here
        // For now, we simulate a checkout URL or return a mock success
        
        console.log(`[Billing] Creating checkout session for user ${user.id} and plan ${planId}`)

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // In a real implementation, we would:
        // 1. Call Wompi API to create a transaction reference
        // 2. Save the reference in our DB (billing_subscriptions with status 'pending')
        // 3. Return the Wompi checkout URL

        // Mock URL for now (this would be the Wompi payment page)
        // We redirect to our local mock gateway
        const mockCheckoutUrl = `/billing/mock-gateway?user=${user.id}&plan=${planId}`

        return { 
            success: true, 
            url: mockCheckoutUrl 
        }

    } catch (error) {
        console.error('Error creating checkout session:', error)
        return { success: false, error: 'Error al iniciar el pago' }
    }
}

export async function getSubscriptionStatus() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    const { data: settings } = await supabase
        .from('user_settings')
        .select('plan, pro_until, billing_status')
        .eq('user_id', user.id)
        .single()

    return settings
}
