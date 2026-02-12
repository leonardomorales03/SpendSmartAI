'use client'

import { useState } from 'react'
import { MagicInput } from '@/components/magic-input'
import { SpendingChart } from '@/components/spending-chart'
import { CategoryChart } from '@/components/category-chart'
import { StatsGrid } from '@/components/stats-grid'
import { SpendingVelocity } from '@/components/spending-velocity'
import { SubscriptionWidget } from '@/components/subscription-widget'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface DashboardProps {
  initialTransactions: any[]
  budget: number
}

export function Dashboard({ initialTransactions, budget }: DashboardProps) {
  // We need to keep this state to update UI when new transactions are added
  const [transactions, setTransactions] = useState(initialTransactions)
  
  const handleTransactionAdded = (newTransactions: any[]) => {
    // Add new transactions to the top of the list
    setTransactions(prev => [...newTransactions, ...prev])
  }

  return (
    <div className="space-y-6">
      <MagicInput onTransactionAdded={handleTransactionAdded} />
      
      <StatsGrid transactions={transactions} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SpendingChart transactions={transactions} budget={budget} />
        <CategoryChart transactions={transactions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SpendingVelocity transactions={transactions} />
        <div className="space-y-6">
          <SubscriptionWidget />
          
          {/* Quick Access to Full History */}
          <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Últimos Movimientos
              </h3>
              <Link 
                href="/transactions" 
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
              >
                Ver todo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.slice(0, 3).map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{t.emoji || '📦'}</span>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {t.description}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(t.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      ${t.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 text-center py-4">
                No hay movimientos recientes
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
