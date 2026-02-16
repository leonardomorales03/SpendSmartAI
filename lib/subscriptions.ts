import { Subscription } from '@/lib/types'

export function calculateTotalMonthly(subscriptions: Subscription[]): number {
  return subscriptions
    .filter((s) => s.is_active)
    .reduce((acc, s) => {
      if (s.frequency === 'monthly') return acc + s.amount
      if (s.frequency === 'yearly') return acc + s.amount / 12
      return acc
    }, 0)
}

export function calculateRemainingThisMonth(subscriptions: Subscription[], today: Date): number {
  const currentDay = today.getDate()

  return subscriptions
    .filter((s) => s.is_active)
    .reduce((acc, s) => {
      if (s.billing_day >= currentDay && s.frequency === 'monthly') {
        return acc + s.amount
      }
      return acc
    }, 0)
}

export function getDueToday(subscriptions: Subscription[], today: Date): Subscription[] {
  const currentDay = today.getDate()

  return subscriptions.filter((s) => {
    if (!s.is_active) return false
    if (s.billing_day !== currentDay) return false

    if (s.last_payment_date) {
      const lastPaid = new Date(s.last_payment_date)
      if (
        lastPaid.getDate() === currentDay &&
        lastPaid.getMonth() === today.getMonth() &&
        lastPaid.getFullYear() === today.getFullYear()
      ) {
        return false
      }
    }

    return true
  })
}

export function getCalendarCounts(subscriptions: Subscription[]): Record<number, number> {
  const counts: Record<number, number> = {}

  subscriptions
    .filter((s) => s.is_active)
    .forEach((s) => {
      if (!counts[s.billing_day]) {
        counts[s.billing_day] = 0
      }
      counts[s.billing_day] += 1
    })

  return counts
}

