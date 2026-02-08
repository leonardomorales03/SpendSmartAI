'use client'

import { Transaction } from '@/lib/types'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function TransactionItem({ transaction }: { transaction: Transaction }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            layout
            className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors group"
        >
            <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 text-2xl bg-secondary rounded-full group-hover:scale-110 transition-transform">
                    {transaction.emoji || transaction.category?.emoji || '📦'}
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">{transaction.description}</h3>
                    <p className="text-xs text-muted-foreground capitalize">
                        {transaction.category?.name || 'General'} • {formatDistanceToNow(new Date(transaction.date), { addSuffix: true, locale: es })}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <span className="block font-bold text-foreground">
                    ${transaction.amount.toLocaleString('es-CO')}
                </span>
            </div>
        </motion.div>
    )
}
