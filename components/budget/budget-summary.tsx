'use client'

import { useState } from 'react'
import { updateBudget } from '@/actions/budget'
import { toast } from 'sonner'
import { Edit2, Check, X } from 'lucide-react'

type BudgetSummaryProps = {
    budget: number;
    spent: number;
    percentage: number;
}

export function BudgetSummary({ budget, spent, percentage }: BudgetSummaryProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [newBudget, setNewBudget] = useState(budget)
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        setIsLoading(true)
        const res = await updateBudget(newBudget)
        setIsLoading(false)
        if (res.success) {
            toast.success('Presupuesto global actualizado')
            setIsEditing(false)
        } else {
            toast.error('Error al actualizar el presupuesto')
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const progressColor = percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'

    return (
        <div className="bg-zinc-900 rounded-xl p-6 border border-white/5">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-white">Presupuesto Global</h2>
                    <p className="text-zinc-400 text-sm">Tu límite de gasto mensual</p>
                </div>
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <Edit2 className="w-4 h-4" />
                    </button>
                ) : (
                    <div className="flex gap-2">
                         <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white/5 rounded-lg text-red-400 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                        <button onClick={handleSave} disabled={isLoading} className="p-2 hover:bg-white/5 rounded-lg text-green-400 transition-colors">
                            <Check className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="mb-6">
                {isEditing ? (
                    <input
                        type="number"
                        value={newBudget}
                        onChange={(e) => setNewBudget(Number(e.target.value))}
                        className="text-3xl font-bold bg-transparent border-b border-white/20 focus:border-indigo-500 focus:outline-none w-full py-1 text-white"
                        autoFocus
                    />
                ) : (
                    <div className="text-3xl font-bold text-white">
                        {formatCurrency(budget)}
                    </div>
                )}
                <div className="flex justify-between mt-2 text-sm">
                    <span className="text-zinc-400">Gastado: <span className="text-white">{formatCurrency(spent)}</span></span>
                    <span className={percentage > 100 ? "text-red-400" : "text-zinc-400"}>
                        {percentage.toFixed(1)}%
                    </span>
                </div>
            </div>

            <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 ${progressColor}`} 
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            
            {percentage > 100 && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    ⚠️ Has excedido tu presupuesto global.
                </div>
            )}
        </div>
    )
}
