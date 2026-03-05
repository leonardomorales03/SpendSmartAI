import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export const FREE_LIMITS = {
    AI_DAILY_LIMIT: 10,
    MAGIC_SCAN_MONTHLY_LIMIT: 5,
    MAX_SAVING_GOALS: 1,
    MAX_DEBTS: 1
}

export async function getUserPlan(userId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('user_settings')
        .select('plan, pro_until')
        .eq('user_id', userId)
        .single()
    
    // Check if pro_until is valid
    const isPro = data?.plan === 'pro' || 
                  data?.plan === 'pro_monthly' || 
                  data?.plan === 'pro_yearly' ||
                  (data?.pro_until && new Date(data.pro_until) > new Date())

    return isPro ? 'pro' : 'free'
}

export type FeatureAccessResult = {
    allowed: boolean
    error?: string
    remaining?: number
    resetAt?: Date | null
}

export async function checkFeatureAccess(feature: 'ai_chat' | 'magic_scan' | 'create_goal' | 'create_debt'): Promise<FeatureAccessResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { allowed: false, error: 'Usuario no autenticado' }

    const plan = await getUserPlan(user.id)
    if (plan === 'pro') return { allowed: true }

    // Logic for FREE plan
    switch (feature) {
        case 'ai_chat': {
            // 5 per day
            const result = await checkRateLimit({
                key: 'ai_chat_usage',
                maxRequests: FREE_LIMITS.AI_DAILY_LIMIT,
                windowSeconds: 24 * 60 * 60 // 1 day
            })
            if (!result.allowed) {
                return { 
                    allowed: false, 
                    error: `Has alcanzado el límite diario de ${FREE_LIMITS.AI_DAILY_LIMIT} consultas de IA. Mejora a Pro para acceso ilimitado.` 
                }
            }
            return { allowed: true, remaining: result.remaining }
        }
        case 'magic_scan': {
            // 5 per month
            const result = await checkRateLimit({
                key: 'magic_scan_usage',
                maxRequests: FREE_LIMITS.MAGIC_SCAN_MONTHLY_LIMIT,
                windowSeconds: 30 * 24 * 60 * 60 // 30 days approx
            })
            if (!result.allowed) {
                return { 
                    allowed: false, 
                    error: `Has alcanzado el límite mensual de ${FREE_LIMITS.MAGIC_SCAN_MONTHLY_LIMIT} escaneos inteligentes. Mejora a Pro para escaneos ilimitados.` 
                }
            }
            return { allowed: true, remaining: result.remaining }
        }
        case 'create_goal': {
            // Max 1
            const { count } = await supabase
                .from('saving_goals')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
            
            if ((count || 0) >= FREE_LIMITS.MAX_SAVING_GOALS) {
                return { 
                    allowed: false, 
                    error: `El plan gratuito permite máximo ${FREE_LIMITS.MAX_SAVING_GOALS} meta de ahorro. Mejora a Pro para metas ilimitadas.` 
                }
            }
            return { allowed: true }
        }
        case 'create_debt': {
            // Max 1
            const { count } = await supabase
                .from('debts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
            
            if ((count || 0) >= FREE_LIMITS.MAX_DEBTS) {
                return { 
                    allowed: false, 
                    error: `El plan gratuito permite máximo ${FREE_LIMITS.MAX_DEBTS} deuda registrada. Mejora a Pro para gestión ilimitada.` 
                }
            }
            return { allowed: true }
        }
    }
}