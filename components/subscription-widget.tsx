'use client'

import { Calendar, AlertCircle, ArrowRight } from 'lucide-react'
import { Subscription } from '@/lib/types'
import { useSettings } from '@/components/providers/settings-provider'
import Link from 'next/link'

interface SubscriptionWidgetProps {
    subscriptions?: Subscription[]
}

export function SubscriptionWidget({ subscriptions = [] }: SubscriptionWidgetProps) {
    const { formatCurrency } = useSettings()
    
    if (!subscriptions || subscriptions.length === 0) {
        return (
             <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
                 <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600 dark:text-indigo-400">
                    <Calendar className="w-6 h-6" />
                 </div>
                 <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Suscripciones</h3>
                 <p className="text-sm text-zinc-500 mb-4">No tienes gastos recurrentes.</p>
                 <Link href="/subscriptions" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                    Agregar Suscripción
                 </Link>
             </div>
        )
    }

    const today = new Date().getDate()
    const activeSubs = subscriptions.filter(s => s.is_active)

    // Sort by next billing day relative to today
    const upcoming = activeSubs.sort((a, b) => {
        const diffA = a.billing_day - today
        const diffB = b.billing_day - today
        
        // If passed this month, move to next (add 30 days roughly)
        const daysA = diffA >= 0 ? diffA : diffA + 30
        const daysB = diffB >= 0 ? diffB : diffB + 30
        
        return daysA - daysB
    }).slice(0, 3)

    const remainingAmount = activeSubs.reduce((acc, s) => {
        // Simple logic: if billing day >= today, count it
        // Note: Ideally we should check if it was already paid this month using last_payment_date
        // But for widget summary, simplified view is okay for now, or we can improve it.
        
        // Improved logic with last_payment_date check
        if (s.last_payment_date) {
             const lastPaid = new Date(s.last_payment_date)
             const now = new Date()
             if (lastPaid.getMonth() === now.getMonth() && lastPaid.getFullYear() === now.getFullYear()) {
                 return acc // Already paid this month
             }
        }
        
        // If not paid this month, check if billing day is upcoming or past due
        // Actually "Remaining to pay" usually implies what is left to be paid in current month
        if (s.billing_day >= today) return acc + s.amount
        
        return acc
    }, 0)

    return (
        <div className="bg-gradient-to-br from-zinc-900 to-black dark:from-indigo-950 dark:to-black text-white p-6 rounded-3xl shadow-lg relative overflow-hidden group hover:shadow-xl transition-shadow border border-zinc-800">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Calendar className="w-24 h-24" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-indigo-300" />
                        <h3 className="font-semibold text-lg">Próximos Pagos</h3>
                    </div>
                    <Link href="/subscriptions" className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>

                <div className="space-y-3">
                    {upcoming.map(sub => {
                        const isToday = sub.billing_day === today
                        return (
                            <div key={sub.id} className={`flex justify-between items-center p-3 rounded-xl backdrop-blur-sm ${isToday ? 'bg-amber-500/20 border border-amber-500/50' : 'bg-white/10'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center">
                                        {sub.logo_url ? (
                                            <img src={sub.logo_url} alt={sub.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs">{sub.category?.emoji || '📅'}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm truncate max-w-[100px]">{sub.name}</span>
                                        <span className={`text-xs ${isToday ? 'text-amber-200 font-bold' : 'text-gray-400'}`}>
                                            {isToday ? '¡Vence Hoy!' : `Día ${sub.billing_day}`}
                                        </span>
                                    </div>
                                </div>
                                <span className="font-bold text-sm">{formatCurrency(sub.amount)}</span>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-end">
                    <span className="text-sm text-gray-400">Restante este mes</span>
                    <span className="text-xl font-bold text-indigo-300">{formatCurrency(remainingAmount)}</span>
                </div>
            </div>
        </div>
    )
}
