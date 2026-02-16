'use server'

import { createClient } from '@/lib/supabase/server'

export interface SubscriptionPreset {
  id: string
  name: string
  category_name: string
  default_amount: number | null
  icon: string | null
  logo_url: string | null
  popularity_score: number
}

export async function getSubscriptionPresets() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscription_presets')
    .select('*')
    .order('popularity_score', { ascending: false })

  if (error) {
    console.error('Error fetching subscription presets:', error)
    return []
  }

  return data as SubscriptionPreset[]
}
