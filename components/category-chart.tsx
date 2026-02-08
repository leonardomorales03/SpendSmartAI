'use client'

import { Transaction } from '@/lib/types'
import { calculateStats } from '@/lib/stats'
import { motion } from 'framer-motion'

export function CategoryChart({ transactions }: { transactions: Transaction[] }) {
    const stats = calculateStats(transactions);

    return (
        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm h-full">
            <div className="mb-6">
                <h3 className="font-semibold text-foreground">Gastos por Categoría</h3>
                <p className="text-xs text-muted-foreground">Distribución del mes actual</p>
            </div>

            <div className="space-y-4">
                {stats.categoryData.slice(0, 5).map((cat, idx) => {
                    const percent = stats.totalMonth > 0 ? (cat.value / stats.totalMonth) * 100 : 0;

                    return (
                        <div key={cat.name} className="space-y-1">
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <span>{cat.emoji}</span>
                                    <span className="font-medium text-foreground">{cat.name}</span>
                                </div>
                                <span className="text-muted-foreground font-semibold">
                                    {percent.toFixed(0)}%
                                </span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percent}%` }}
                                    transition={{ duration: 1, delay: idx * 0.1 }}
                                    className="h-full bg-primary"
                                />
                            </div>
                        </div>
                    );
                })}

                {stats.categoryData.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-10">
                        No hay datos para mostrar.
                    </p>
                )}
            </div>
        </div>
    );
}
