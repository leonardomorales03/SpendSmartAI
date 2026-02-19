'use client'

import { useState, useEffect } from 'react'
import { MagicInput } from '@/components/magic-input'
import { SpendingChart } from '@/components/spending-chart'
import { CategoryChart } from '@/components/category-chart'
import { StatsGridRefined } from '@/components/stats-grid-refined'
import { SpendingVelocity } from '@/components/spending-velocity'
import { SubscriptionWidget } from '@/components/subscription-widget'
import { PredictiveInsights } from '@/components/predictive-insights'
import { FinancialSummaryCard } from '@/components/financial-summary-card'
import { QuickActions } from '@/components/quick-actions'
import { ArrowRight, Settings, Bell, Sun, CalendarRange, CalendarDays } from 'lucide-react'
import Link from 'next/link'

import { LevelCard } from '@/components/gamification/level-card'
import { useSettings } from '@/components/providers/settings-provider'

import { Subscription, SavingGoal } from '@/lib/types'
import { SavingGoalsCard } from '@/components/saving-goals-card'
import { DebtsSummaryCard } from '@/components/debts-summary-card'
import { motion } from 'framer-motion'

const DASHBOARD_PHRASES = [
    'Tu dinero, bajo control y sin estrés.',
    'Pequeños hábitos hoy, grandes resultados en tus finanzas mañana.',
    'Gasta con intención, ahorra con claridad.',
    'Cada movimiento aquí te acerca a tus metas.'
]

interface DashboardProps {
    initialTransactions: any[]
    budget: number
    userProgress: any
    subscriptions: Subscription[]
    savingGoals: SavingGoal[]
    initialDebts?: any[]
}

export function DashboardRefined({
    initialTransactions,
    budget,
    userProgress,
    subscriptions,
    savingGoals,
    initialDebts = [],
}: DashboardProps) {
    const { t, formatCurrency } = useSettings()
    const [transactions, setTransactions] = useState(initialTransactions)
    const [goals, setGoals] = useState<SavingGoal[]>(savingGoals)
    const [debts] = useState(initialDebts)
    const [phraseIndex, setPhraseIndex] = useState(0)

    useEffect(() => {
        if (DASHBOARD_PHRASES.length <= 1) return
        const id = setInterval(() => {
            setPhraseIndex(prev => (prev + 1) % DASHBOARD_PHRASES.length)
        }, 7000)
        return () => clearInterval(id)
    }, [])

    const handleTransactionAdded = (newTransactions: any[]) => {
        setTransactions(prev => [...newTransactions, ...prev])
    }

    const totalExpenses = transactions.reduce((acc, t) => acc + t.amount, 0)
    const estimatedIncome = budget

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    const day = startOfWeek.getDay()
    const diff = day === 0 ? 6 : day - 1
    startOfWeek.setDate(startOfWeek.getDate() - diff)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const spentToday = transactions
        .filter(t => {
            const d = new Date(t.date)
            return d >= startOfToday
        })
        .reduce((acc, t) => acc + t.amount, 0)

    const spentWeek = transactions
        .filter(t => {
            const d = new Date(t.date)
            return d >= startOfWeek
        })
        .reduce((acc, t) => acc + t.amount, 0)

    const spentMonth = transactions
        .filter(t => {
            const d = new Date(t.date)
            return d >= startOfMonth
        })
        .reduce((acc, t) => acc + t.amount, 0)

    return (
        <div className="space-y-6 relative max-w-[1600px] mx-auto pb-20">

            <div className="flex justify-between items-center py-2">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        Hola, {userProgress?.display_name || 'Usuario'} 👋
                    </h1>
                    <motion.p
                        key={phraseIndex}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-zinc-500 text-sm mt-1"
                    >
                        {DASHBOARD_PHRASES[phraseIndex]}
                    </motion.p>
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className="p-4 md:p-5 bg-card/60 backdrop-blur-xl border border-white/5 rounded-2xl flex flex-col justify-between hover:bg-card/80 transition-all duration-300 shadow-sm hover:shadow-md group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
                                    <Sun className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <span className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Hoy
                                </span>
                            </div>
                            <div>
                                <p className="text-[11px] md:text-xs text-muted-foreground mb-0.5">
                                    Gasto de hoy
                                </p>
                                <p className="text-lg md:text-2xl font-bold tracking-tight text-foreground">
                                    {formatCurrency(spentToday)}
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: 0.05 }}
                            className="p-4 md:p-5 bg-card/60 backdrop-blur-xl border border-white/5 rounded-2xl flex flex-col justify-between hover:bg-card/80 transition-all duration-300 shadow-sm hover:shadow-md group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
                                    <CalendarRange className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <span className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Esta semana
                                </span>
                            </div>
                            <div>
                                <p className="text-[11px] md:text-xs text-muted-foreground mb-0.5">
                                    Gasto acumulado
                                </p>
                                <p className="text-lg md:text-2xl font-bold tracking-tight text-foreground">
                                    {formatCurrency(spentWeek)}
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: 0.1 }}
                            className="p-4 md:p-5 bg-card/60 backdrop-blur-xl border border-white/5 rounded-2xl flex flex-col justify-between hover:bg-card/80 transition-all duration-300 shadow-sm hover:shadow-md group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-105 transition-transform">
                                    <CalendarDays className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <span className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Este mes
                                </span>
                            </div>
                            <div>
                                <p className="text-[11px] md:text-xs text-muted-foreground mb-0.5">
                                    Gasto del mes
                                </p>
                                <p className="text-lg md:text-2xl font-bold tracking-tight text-foreground">
                                    {formatCurrency(spentMonth)}
                                </p>
                            </div>
                        </motion.div>
                    </div>

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

                    {/* Debts Summary */}
                    <DebtsSummaryCard debts={debts} />

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
