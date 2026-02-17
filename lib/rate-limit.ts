import { createClient } from '@/lib/supabase/server'

type RateLimitConfig = {
    key: string
    maxRequests: number
    windowSeconds: number
}

export async function checkRateLimit(config: RateLimitConfig) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { allowed: false, remaining: 0, resetAt: null }
    }

    const windowStart = new Date(Date.now() - config.windowSeconds * 1000).toISOString()

    const { data, error, count } = await supabase
        .from('analytics_events')
        .select('id, created_at', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('event_name', config.key)
        .gte('created_at', windowStart)

    if (error) {
        console.error('Error checking rate limit:', error)
        return { allowed: true, remaining: config.maxRequests, resetAt: null }
    }

    const currentCount = count || (data ? data.length : 0)
    const remaining = Math.max(config.maxRequests - currentCount, 0)

    if (currentCount >= config.maxRequests) {
        const oldest = data && data.length > 0 ? data[0] : null
        const resetAt = oldest ? new Date(new Date(oldest.created_at).getTime() + config.windowSeconds * 1000) : null
        return { allowed: false, remaining: 0, resetAt }
    }

    const { error: insertError } = await supabase
        .from('analytics_events')
        .insert({
            user_id: user.id,
            event_name: config.key,
            event_data: {},
        })

    if (insertError) {
        console.error('Error registering rate limit event:', insertError)
    }

    return { allowed: true, remaining, resetAt: null }
}

