'use client'

import { useState } from 'react'
import { MagicInput } from '@/components/magic-input'
import { SpendingChart } from '@/components/spending-chart'
import { CategoryChart } from '@/components/category-chart'
import { StatsGridRefined } from '@/components/stats-grid-refined'
import { SpendingVelocity } from '@/components/spending-velocity'
import { SubscriptionWidget } from '@/components/subscription-widget'
import { PredictiveInsights } from '@/components/predictive-insights'
import { FinancialSummaryCard } from '@/components/financial-summary-card'
import { QuickActions } from '@/components/quick-actions'
import { ArrowRight, Settings, Bell } from 'lucide-react'
import Link from 'next/link'

import { LevelCard } from '@/components/gamification/level-card'
import { useSettings } from '@/components/providers/settings-provider'

import { Subscription, SavingGoal } from '@/lib/types'
import { SavingGoalsCard } from '@/components/saving-goals-card'

interface DashboardProps {
    initialTransactions: any[]
    budget: number
    userProgress: any
    subscriptions: Subscription[]
    savingGoals: SavingGoal[]
}

export function DashboardRefined({ initialTransactions, budget, userProgress, subscriptions, savingGoals }: DashboardProps) {
    const { t, formatCurrency } = useSettings()
    const [transactions, setTransactions] = useState(initialTransactions)
    const [goals, setGoals] = useState<SavingGoal[]>(savingGoals)

    const handleTransactionAdded = (newTransactions: any[]) => {
        setTransactions(prev => [...newTransactions, ...prev])
    }

    // Calculate totals for summary card
    const totalExpenses = transactions.reduce((acc, t) => acc + t.amount, 0)
    const estimatedIncome = budget

    return (
        <div className="space-y-6 relative max-w-[1600px] mx-auto pb-20">

            {/* Top Bar: Greeting & Settings */}
            <div className="flex justify-between items-center py-2">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        Hola, {userProgress?.display_name || 'Usuario'} 👋
                    </h1>
                    <p className="text-zinc-500 text-sm">Aquí tienes tu resumen financiero.</p>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                        <Bell className="w-5 h-5" />
                    </button>
                    <Link
                        href="/settings"
                        className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
                    >
                        <Settings className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            {/* Main Grid Layout - Changed to optimize mobile flow */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                {/* Left Column: Input & Main Stats (8 cols) */}
                <div className="xl:col-span-8 space-y-6">

                    {/* Magic Input - Primary Action */}
                    <MagicInput onTransactionAdded={handleTransactionAdded} />

                    {/* Quick Actions */}
                    <QuickActions />

                    {/* Stats Overview - Grid System Improved for Mobile */}
                    {/* Mobile: 1 col, Tablet: 2 cols, Desktop: 4 cols */}
                    <StatsGridRefined transactions={transactions} />

                    {/* Charts Row - Stacked on Mobile */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SpendingChart transactions={transactions} budget={budget} />
                        <CategoryChart transactions={transactions} />
                    </div>

                    {/* History & Insights - Stacked on Mobile */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PredictiveInsights transactions={transactions} budget={budget} />
                        <SpendingVelocity transactions={transactions} />
                    </div>

                    {/* Recent Transactions List */}
                    <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                {t('dashboard.recentTransactions')}
                            </h3>
                            <Link
                                href="/transactions"
                                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
                            >
                                {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {transactions.length > 0 ? (
                            <div className="space-y-3">
                                {transactions.slice(0, 5).map((t) => (
                                    <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
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
                                            {formatCurrency(t.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-500 text-center py-8">
                                {t('dashboard.noTransactions')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Column: Sidebar (4 cols) */}
                <div className="xl:col-span-4 space-y-6">

                    {/* Financial Summary Card */}
                    <FinancialSummaryCard
                        income={estimatedIncome}
                        expenses={totalExpenses}
                        budget={budget}
                        savingGoals={goals}
                    />

                    <SavingGoalsCard initialGoals={goals} onGoalsChange={setGoals} />

                    {/* Level & Progress */}
                    {userProgress && (
                        <LevelCard
                            level={userProgress.level}
                            xp={userProgress.xp}
                            nextLevelXp={userProgress.next_level_xp}
                            progressPercent={userProgress.progress_percent}
                            streak={userProgress.current_streak}
                        />
                    )}

                    {/* Subscriptions Widget */}
                    <SubscriptionWidget subscriptions={subscriptions} />

                    {/* Tip of the day - Improved margins */}
                    <div className="p-6 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30">
                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Tip del día</p>
                        <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
                            "Revisar tus suscripciones mensualmente puede ahorrarte hasta un 15% de gastos hormiga. ¡Ya diste el primer paso!"
                        </p>
                    </div>

                </div>

            </div>
        </div>
    )
}
