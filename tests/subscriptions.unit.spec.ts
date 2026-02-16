import { test, expect } from '@playwright/test'
import { calculateTotalMonthly, calculateRemainingThisMonth, getDueToday, getCalendarCounts } from '@/lib/subscriptions'
import type { Subscription } from '@/lib/types'

const baseDate = new Date(2025, 0, 15)

const buildSubscription = (partial: Partial<Subscription>): Subscription => {
  return {
    id: partial.id || 'id',
    user_id: partial.user_id || 'user',
    name: partial.name || 'Test',
    amount: partial.amount ?? 10000,
    currency: partial.currency || 'COP',
    billing_day: partial.billing_day ?? 1,
    frequency: partial.frequency || 'monthly',
    category_id: partial.category_id || 'cat',
    is_active: partial.is_active ?? true,
    last_payment_date: partial.last_payment_date,
    logo_url: partial.logo_url,
    created_at: partial.created_at || new Date().toISOString(),
    category: partial.category,
  }
}

test.describe('Helpers de suscripciones', () => {
  test('calculateTotalMonthly suma mensual y anual prorrateado', () => {
    const subscriptions: Subscription[] = [
      buildSubscription({ amount: 10000, frequency: 'monthly' }),
      buildSubscription({ amount: 120000, frequency: 'yearly' }),
      buildSubscription({ amount: 5000, is_active: false }),
    ]

    const total = calculateTotalMonthly(subscriptions)
    expect(total).toBe(10000 + 120000 / 12)
  })

  test('calculateRemainingThisMonth considera solo cobros futuros del mes', () => {
    const subscriptions: Subscription[] = [
      buildSubscription({ amount: 10000, billing_day: 20 }),
      buildSubscription({ amount: 15000, billing_day: 10 }),
      buildSubscription({ amount: 8000, billing_day: 15 }),
    ]

    const remaining = calculateRemainingThisMonth(subscriptions, baseDate)
    expect(remaining).toBe(10000 + 8000)
  })

  test('getDueToday devuelve solo suscripciones activas que no se han pagado hoy', () => {
    const today = new Date(2025, 0, 15)
    const paidToday = new Date(2025, 0, 15).toISOString()
    const paidEarlier = new Date(2025, 0, 10).toISOString()

    const subscriptions: Subscription[] = [
      buildSubscription({ id: 'due', billing_day: 15 }),
      buildSubscription({ id: 'paidToday', billing_day: 15, last_payment_date: paidToday }),
      buildSubscription({ id: 'paidEarlier', billing_day: 15, last_payment_date: paidEarlier }),
      buildSubscription({ id: 'otherDay', billing_day: 10 }),
      buildSubscription({ id: 'inactive', billing_day: 15, is_active: false }),
    ]

    const due = getDueToday(subscriptions, today)
    const ids = due.map((s) => s.id)

    expect(ids).toContain('due')
    expect(ids).toContain('paidEarlier')
    expect(ids).not.toContain('paidToday')
    expect(ids).not.toContain('otherDay')
    expect(ids).not.toContain('inactive')
  })

  test('getCalendarCounts agrupa suscripciones activas por día de cobro', () => {
    const subscriptions: Subscription[] = [
      buildSubscription({ billing_day: 5 }),
      buildSubscription({ billing_day: 5 }),
      buildSubscription({ billing_day: 10 }),
      buildSubscription({ billing_day: 10, is_active: false }),
    ]

    const counts = getCalendarCounts(subscriptions)

    expect(counts[5]).toBe(2)
    expect(counts[10]).toBe(1)
    expect(counts[1]).toBeUndefined()
  })
})

