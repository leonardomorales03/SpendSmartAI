'use client'

import { Calendar, AlertCircle } from 'lucide-react'

// Mock Subscriptions
const SUBSCRIPTIONS = [
    { id: 1, name: 'Spotify Premium', amount: 16900, date: 5, status: 'paid' },
    { id: 2, name: 'Netflix', amount: 35000, date: 15, status: 'upcoming' },
    { id: 3, name: 'iCloud+', amount: 3900, date: 22, status: 'upcoming' },
]

export function SubscriptionWidget() {
    const upcomingAmount = SUBSCRIPTIONS
        .filter(s => s.status === 'upcoming')
        .reduce((acc, s) => acc + s.amount, 0);

    return (
        <div className="bg-gradient-to-br from-gray-900 to-black text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Calendar className="w-24 h-24" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-semibold text-lg">Próximos Pagos</h3>
                </div>

                <div className="space-y-3">
                    {SUBSCRIPTIONS.filter(s => s.status === 'upcoming').map(sub => (
                        <div key={sub.id} className="flex justify-between items-center bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{sub.name}</span>
                                <span className="text-xs text-gray-400">Día {sub.date}</span>
                            </div>
                            <span className="font-bold text-sm">${sub.amount.toLocaleString('es-CO')}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-end">
                    <span className="text-sm text-gray-400">Total pendiente</span>
                    <span className="text-xl font-bold text-indigo-400">${upcomingAmount.toLocaleString('es-CO')}</span>
                </div>
            </div>
        </div>
    )
}
