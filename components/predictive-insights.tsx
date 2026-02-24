'use client'

import { useState, useTransition, useEffect } from "react"
import { Transaction } from "@/lib/types"
import { Sparkles, Loader2 } from "lucide-react"
import { getAIPredictiveInsights } from "@/actions/insights"

interface PredictiveInsightsProps {
    transactions: Transaction[]
    budget: number
}

export function PredictiveInsights({ transactions, budget }: PredictiveInsightsProps) {
    const [insight, setInsight] = useState<{ title: string, description: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = now.getDate();

    // Filter current month transactions
    const monthlyTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalSpent = monthlyTransactions.reduce((acc, t) => acc + t.amount, 0);

    // Calculate projections
    // Avoid division by zero on day 1 (use 1 as minimum)
    const effectiveDay = Math.max(currentDay, 1);
    const dailyAverage = totalSpent / effectiveDay;
    const projectedTotal = dailyAverage * daysInMonth;

    useEffect(() => {
        if (transactions.length === 0 || budget === 0) return;

        const dateStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const cacheKey = "spend_smart_daily_insight";

        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.dateStr === dateStr) {
                    setInsight(parsed.insight);
                    return;
                }
            }
        } catch (e) {
            console.error("Error reading insight cache", e);
        }

        startTransition(async () => {
            const result = await getAIPredictiveInsights(monthlyTransactions, budget, dailyAverage, projectedTotal);
            if (result.success && result.insight) {
                setInsight(result.insight);
                try {
                    localStorage.setItem(cacheKey, JSON.stringify({
                        dateStr,
                        insight: result.insight
                    }));
                } catch (e) {
                    console.error("Error saving insight cache", e);
                }
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transactions.length, budget, currentMonth]);

    if (transactions.length === 0 || budget === 0) {
        return (
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        IA Predictiva
                    </h3>
                </div>
                <p className="text-sm text-zinc-500">
                    Registra más gastos para activar el análisis experto.
                </p>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-all duration-300 group min-h-[160px] flex flex-col justify-center">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />

            {!insight && isPending ? (
                <div className="space-y-4 animate-pulse">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-900 rounded-md" />
                        <div className="h-3 w-2/3 bg-zinc-100 dark:bg-zinc-900 rounded-md" />
                    </div>
                </div>
            ) : insight ? (
                <div className="relative z-10 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="w-5 h-5 fill-emerald-500/10" />
                        <h3 className="text-xl font-bold tracking-tight leading-none">
                            {insight.title}
                        </h3>
                    </div>

                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                        {insight.description}
                    </p>

                    <div className="pt-2 flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            Análisis en tiempo real
                        </span>
                    </div>
                </div>
            ) : (
                <div className="text-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-300" />
                    <p className="text-xs text-zinc-400">Preparando tu resumen...</p>
                </div>
            )}
        </div>
    )
}
