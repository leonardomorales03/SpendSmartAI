'use client'

import { motion } from 'framer-motion'
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'
import { useSettings } from '@/components/providers/settings-provider'
import { cn } from '@/lib/utils'

interface FinancialSummaryCardProps {
    income: number
    expenses: number
    budget: number
}

export function FinancialSummaryCard({ income, expenses, budget }: FinancialSummaryCardProps) {
    const { formatCurrency } = useSettings()

    // Calculations
    const balance = income - expenses
    const budgetUsedPercent = Math.min(budget > 0 ? (expenses / budget) * 100 : 0, 100)
    const isOverBudget = expenses > budget

    // Proyección simple: si estamos a día 15 y gastamos X, proyectamos 2X a fin de mes
    const today = new Date().getDate()
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    const projectedExpenses = (expenses / Math.max(today, 1)) * daysInMonth

    return (
        <div className="relative overflow-hidden p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex flex-col gap-6">

                {/* Header: Balance Total */}
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                            Balance del Mes
                        </p>
                        <h2 className={cn(
                            "text-3xl font-bold tracking-tight",
                            balance >= 0 ? "text-zinc-900 dark:text-zinc-100" : "text-red-500"
                        )}>
                            {formatCurrency(balance)}
                        </h2>
                    </div>
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-2xl">
                        <Wallet className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                    </div>
                </div>

                {/* Grid: Ingresos vs Gastos */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                <ArrowDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Ingresos</span>
                        </div>
                        <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                            {formatCurrency(income)}
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                            <span className="text-xs font-semibold text-red-700 dark:text-red-400">Gastos</span>
                        </div>
                        <p className="text-lg font-bold text-red-900 dark:text-red-100">
                            {formatCurrency(expenses)}
                        </p>
                    </div>
                </div>

                {/* Presupuesto Progress */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-xs font-medium text-zinc-500">Presupuesto</p>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {formatCurrency(expenses)} <span className="text-zinc-400">/ {formatCurrency(budget)}</span>
                            </p>
                        </div>
                        <span className={cn(
                            "text-xs font-bold px-2 py-1 rounded-full",
                            isOverBudget ? "bg-red-100 text-red-600" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                        )}>
                            {budgetUsedPercent.toFixed(0)}%
                        </span>
                    </div>

                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${budgetUsedPercent}%` }}
                            className={cn(
                                "h-full rounded-full",
                                isOverBudget ? "bg-red-500" : "bg-zinc-900 dark:bg-zinc-100"
                            )}
                        />
                    </div>

                    {!isOverBudget && (
                        <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Proyección fin de mes: <span className="font-medium text-zinc-600 dark:text-zinc-300">{formatCurrency(projectedExpenses)}</span>
                        </p>
                    )}
                </div>


            </div>
        </div>
    )
}
