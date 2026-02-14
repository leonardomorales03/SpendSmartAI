'use client'

import { BudgetWarning } from '@/actions/budget'
import { AlertTriangle, Info, AlertCircle } from 'lucide-react'

export function BudgetAlerts({ warnings }: { warnings: BudgetWarning[] }) {
    if (!warnings || warnings.length === 0) return null

    return (
        <div className="space-y-3">
            {warnings.map((warning, index) => (
                <div 
                    key={index}
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                        warning.type === 'error' 
                            ? 'bg-red-500/10 border-red-500/20 text-red-200' 
                            : warning.type === 'warning'
                            ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200'
                            : 'bg-blue-500/10 border-blue-500/20 text-blue-200'
                    }`}
                >
                    {warning.type === 'error' ? (
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                    ) : warning.type === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-yellow-400" />
                    ) : (
                        <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" />
                    )}
                    <div>
                        <p className="text-sm font-medium">{warning.message}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
