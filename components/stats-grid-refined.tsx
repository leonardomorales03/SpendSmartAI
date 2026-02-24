'use client'

import { Transaction } from '@/lib/types'
import { calculateStats } from '@/lib/stats'
import { motion } from 'framer-motion'
import { Receipt, Activity, PieChart } from 'lucide-react'
import { useSettings } from '@/components/providers/settings-provider'

export function StatsGridRefined({ transactions }: { transactions: Transaction[] }) {
    const { formatCurrency, t } = useSettings()

    // Loading State
    if (!transactions || transactions.length === 0) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[1, 2, 3, 4].map((idx) => (
                    <div
                        key={idx}
                        className="p-4 bg-card/40 backdrop-blur-md border border-dashed border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl h-32 animate-pulse"
                    />
                ))}
            </div>
        )
    }

    const stats = calculateStats(transactions);

    const items = [
        {
            title: t('dashboard.transactions'),
            value: stats.count.toString(),
            sub: 'transacciones',
            icon: <Receipt className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />,
            trend: 'flat' as const,
            color: 'bg-cyan-500/10'
        },
        {
            title: 'Top Categoría',
            value: stats.topCategory.name,
            sub: `${stats.topCategory.percent.toFixed(0)}% del total`,
            icon: <PieChart className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />,
            trend: 'flat' as const,
            color: 'bg-amber-500/10'
        },
        {
            title: 'Promedio/Día',
            value: formatCurrency(stats.dailyAvg),
            sub: 'diario',
            icon: <Activity className="w-4 h-4 md:w-5 md:h-5 text-pink-400" />,
            trend: 'flat' as const,
            color: 'bg-pink-500/10'
        }
    ];

    return (
        <div className="grid grid-cols-3 gap-2 md:gap-4">
            {items.map((item, idx) => (
                <motion.div
                    key={item.title}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-2 md:p-5 bg-card/60 backdrop-blur-xl border border-white/5 rounded-2xl flex flex-col justify-between hover:bg-card/80 transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                    <div className="flex justify-between items-start mb-1 md:mb-4">
                        <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl ${item.color} transition-transform group-hover:scale-105`}>
                            {item.icon}
                        </div>
                    </div>

                    <div>
                        <p className="text-[9px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 truncate">
                            {item.title}
                        </p>
                        <h3 className="text-sm md:text-2xl font-bold text-foreground tracking-tight truncate">
                            {item.value}
                        </h3>
                        <p className={`text-[9px] md:text-xs font-medium mt-0.5 md:mt-1 truncate ${(item.trend as string) === 'up'
                                ? 'text-rose-400'
                                : (item.trend as string) === 'down'
                                    ? 'text-emerald-400'
                                    : 'text-zinc-500'
                            }`}>
                            {item.sub}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
