'use client'

import { useState, useOptimistic } from 'react'
import { Transaction, AIAnswer } from '@/lib/types'
import { MagicInput } from '@/components/magic-input'
import { TransactionItem } from '@/components/transaction-item'
import { SpendingChart } from '@/components/spending-chart'
import { SpendingVelocity } from '@/components/spending-velocity'
import { SubscriptionWidget } from '@/components/subscription-widget'
import { AIResult } from '@/components/ai-result'
import { StatsGrid } from '@/components/stats-grid'
import { CategoryChart } from '@/components/category-chart'
import { AnimatePresence } from 'framer-motion'

export function Dashboard({ initialTransactions, initialBudget }: { initialTransactions: Transaction[], initialBudget: number }) {
    const [aiAnswer, setAiAnswer] = useState<AIAnswer | null>(null)

    const [optimisticTransactions, addOptimisticTransaction] = useOptimistic(
        initialTransactions,
        (state, newTransaction: Transaction) => [newTransaction, ...state]
    )

    const handleAddTransaction = (result: Transaction | AIAnswer | Transaction[]) => {
        // Check if it's an array of transactions
        if (Array.isArray(result)) {
            setAiAnswer(null);
            result.forEach(t => addOptimisticTransaction(t));
            return;
        }

        // Check if it is an Answer or a single Transaction
        if ('type' in result && result.type === 'answer') {
            setAiAnswer(result);
        } else {
            const t = result as Transaction;
            setAiAnswer(null); // Clear previous answer if adding a new expense
            if (t.id) { // Ensure it's a valid transaction object
                addOptimisticTransaction(t);
            }
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
            {/* 1. MAGIC INPUT (The Star Feature) */}
            <section className="sticky top-4 z-20 backdrop-blur-xl bg-background/30 p-2 rounded-2xl border border-white/5 shadow-lg group">
                <MagicInput onAddTransaction={handleAddTransaction} />
            </section>

            {/* 2. TOTAL SPENDING & KPIs */}
            <div className="space-y-6">
                <SpendingChart transactions={optimisticTransactions} initialBudget={initialBudget} />
                <StatsGrid transactions={optimisticTransactions} />
            </div>

            {/* AI RESULT AREA (Right below input) */}
            <AnimatePresence>
                {aiAnswer && <AIResult answer={aiAnswer} />}
            </AnimatePresence>

            {/* 3. CHARTS GRID (Analysis) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CategoryChart transactions={optimisticTransactions} />
                <SpendingVelocity transactions={optimisticTransactions} />
            </div>

            {/* 4. UPCOMING PAYMENTS */}
            <div className="max-w-md">
                <SubscriptionWidget />
            </div>

            {/* 5. SMART LIST */}
            <section className="space-y-4">
                <div className="flex justify-between items-center text-muted-foreground text-sm font-medium">
                    <h3>Transacciones Recientes</h3>
                    <span>Hoy</span>
                </div>

                <div className="space-y-3">
                    <AnimatePresence initial={false} mode='popLayout'>
                        {optimisticTransactions.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                No hay gastos aún. ¡Prueba la caja mágica! ✨
                            </div>
                        ) : (
                            optimisticTransactions.map((t) => (
                                <TransactionItem key={t.id} transaction={t} />
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </section>
        </div>
    )
}
