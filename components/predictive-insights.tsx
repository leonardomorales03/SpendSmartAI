'use client'

import { Transaction } from "@/lib/types"
import { AlertTriangle, TrendingUp, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface PredictiveInsightsProps {
    transactions: Transaction[]
    budget: number
}

export function PredictiveInsights({ transactions, budget }: PredictiveInsightsProps) {
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
    const isExceeding = projectedTotal > budget;
    
    // Calculate "days until depletion" if exceeding
    const remainingBudget = budget - totalSpent;
    let daysUntilDepletion: number | null = null;
    
    if (remainingBudget > 0 && dailyAverage > 0) {
        daysUntilDepletion = Math.floor(remainingBudget / dailyAverage);
    } else if (remainingBudget <= 0) {
        daysUntilDepletion = 0; // Already exceeded
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (transactions.length === 0 || budget === 0) return null;

    return (
        <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-zinc-500" />
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Insights Predictivos
                </h3>
            </div>
            
            <div className="space-y-4">
                <div className="flex items-start gap-4">
                    <div className={cn(
                        "p-2 rounded-xl shrink-0",
                        isExceeding ? "bg-red-100 text-red-600 dark:bg-red-900/20" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20"
                    )}>
                        {isExceeding ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    </div>
                    <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {isExceeding 
                                ? "Proyección: Excederás tu presupuesto" 
                                : "Vas por buen camino"}
                        </p>
                        <p className="text-sm text-zinc-500 mt-1">
                            {isExceeding 
                                ? `A este ritmo, gastarás ${formatCurrency(projectedTotal)} al final del mes.` 
                                : `Se estima un gasto total de ${formatCurrency(projectedTotal)} (Presupuesto: ${formatCurrency(budget)}).`}
                        </p>
                    </div>
                </div>

                {isExceeding && daysUntilDepletion !== null && daysUntilDepletion > 0 && daysUntilDepletion < (daysInMonth - currentDay) && (
                    <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/20">
                        <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                            ⚠️ Alerta: Agotarás tu presupuesto en aproximadamente <span className="font-bold">{daysUntilDepletion} días</span>.
                        </p>
                    </div>
                )}
                
                {isExceeding && remainingBudget <= 0 && (
                        <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/20">
                        <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                            ⚠️ Has superado tu presupuesto mensual.
                        </p>
                    </div>
                )}

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between text-xs text-zinc-500">
                    <span>Promedio diario actual:</span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {formatCurrency(dailyAverage)} / día
                    </span>
                </div>
            </div>
        </div>
    )
}
