'use client'

import { Transaction } from '@/lib/types'
import { calculateStats } from '@/lib/stats'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Receipt, Pizza, Activity } from 'lucide-react'
import { useSettings } from '@/components/providers/settings-provider'

export function StatsGrid({ transactions }: { transactions: Transaction[] }) {
    const { formatCurrency, t } = useSettings()
    const stats = calculateStats(transactions);

    const items = [
        {
            title: t('dashboard.totalMonth'),
            value: formatCurrency(stats.totalMonth),
            sub: `${stats.diffPercent > 0 ? '+' : ''}${stats.diffPercent.toFixed(1)}% ${t('dashboard.vsPrevious')}`,
            icon: <TrendingUp className="w-5 h-5 text-indigo-400" />,
            trend: stats.diffPercent > 0 ? 'up' : 'down'
        },
        {
            title: t('dashboard.transactions'),
            value: stats.count.toString(),
            sub: t('dashboard.transactionsSub'),
            icon: <Receipt className="w-5 h-5 text-cyan-400" />,
        },
        {
            title: t('dashboard.topCategory'),
            value: stats.topCategory.name,
            sub: `${stats.topCategory.percent.toFixed(0)}% ${t('dashboard.topCategorySub')}`,
            icon: <span className="text-xl">{stats.topCategory.emoji}</span>,
        },
        {
            title: t('dashboard.dailyAvg'),
            value: formatCurrency(stats.dailyAvg),
            sub: t('dashboard.dailyAvgSub'),
            icon: <Activity className="w-5 h-5 text-pink-400" />,
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
                        <p className={`text-[10px] font-medium ${item.trend === 'up' ? 'text-red-400' :
                                item.trend === 'down' ? 'text-green-400' :
                                    'text-muted-foreground'
                            }`}>
                            {item.sub}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
