'use client'

import { Transaction } from '@/lib/types'
import { calculateStats } from '@/lib/stats'
import { motion } from 'framer-motion'
import { TrendingUp, Receipt, Activity } from 'lucide-react'
import { useSettings } from '@/components/providers/settings-provider'

export function StatsGrid({ transactions }: { transactions: Transaction[] }) {
    const { formatCurrency, t } = useSettings()

    if (!transactions || transactions.length === 0) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((idx) => (
                    <div
                        key={idx}
                        className="p-4 bg-card/40 backdrop-blur-md border border-dashed border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl flex flex-col justify-between"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="h-3 w-24 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                            <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-6 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                            <div className="h-2 w-32 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const stats = calculateStats(transactions);

    const items = [
        {
            title: t('dashboard.totalMonth'),
            value: formatCurrency(stats.totalMonth),
            sub: `${stats.diffPercent > 0 ? '+' : ''}${stats.diffPercent.toFixed(1)}% ${t('dashboard.vsPrevious')}`,
            icon: <TrendingUp className="w-5 h-5 text-indigo-400" />,
            trend: stats.diffPercent > 0 ? 'up' : stats.diffPercent < 0 ? 'down' : 'flat'
        },
        {
            title: t('dashboard.transactions'),
            value: stats.count.toString(),
            sub: t('dashboard.transactionsSub'),
            icon: <Receipt className="w-5 h-5 text-cyan-400" />,
            trend: 'flat' as const
        },
        {
            title: t('dashboard.topCategory'),
            value: stats.topCategory.name,
            sub: `${stats.topCategory.percent.toFixed(0)}% ${t('dashboard.topCategorySub')}`,
            icon: <span className="text-xl">{stats.topCategory.emoji}</span>,
            trend: 'flat' as const
        },
        {
            title: t('dashboard.dailyAvg'),
            value: formatCurrency(stats.dailyAvg),
            sub: t('dashboard.dailyAvgSub'),
            icon: <Activity className="w-5 h-5 text-pink-400" />,
            trend: 'flat' as const
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item, idx) => (
                <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl flex flex-col justify-between hover:bg-card/60 transition-colors group"
                >
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.title}</p>
                        <div className="p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform">
                            {item.icon}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-foreground mb-1">{item.value}</h3>
                        <p className={`text-[10px] font-medium ${
                            item.trend === 'up'
                                ? 'text-red-400'
                                : item.trend === 'down'
                                    ? 'text-green-400'
                                    : 'text-muted-foreground'
                        }`}>
                            {item.sub}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
