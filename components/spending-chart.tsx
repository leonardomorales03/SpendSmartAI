
import { useState, useRef, useTransition } from 'react'
import { Transaction } from '@/lib/types'
import { Pencil, Check, Loader2 } from 'lucide-react'
import { updateBudget } from '@/actions/budget'

export function SpendingChart({ transactions, budget }: { transactions: Transaction[], budget: number }) {
    const [currentBudget, setCurrentBudget] = useState(budget);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, startTransition] = useTransition();
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        if (inputRef.current) {
            const newVal = parseFloat(inputRef.current.value);
            if (!isNaN(newVal) && newVal > 0) {
                // Optimistic update
                setCurrentBudget(newVal);
                
                startTransition(async () => {
                    await updateBudget(newVal);
                });
            }
        }
        setIsEditing(false);
    }

    const total = transactions.reduce((acc, t) => acc + t.amount, 0);
    const percentage = Math.min((total / currentBudget) * 100, 100);

    return (
        <div className="p-6 bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-3xl text-white shadow-xl border border-indigo-800/50 relative overflow-hidden group">

            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="flex justify-between items-end mb-6 relative">
                <div>
                    <p className="text-indigo-300 text-sm font-medium mb-1">Gasto Total (Mes)</p>
                    <h2 className="text-4xl font-bold tracking-tight">${total.toLocaleString('es-CO')}</h2>
                </div>
                <div className="text-right">
                    <p className="text-indigo-300 text-xs mb-1">Presupuesto</p>

                    {isEditing ? (
                        <div className="flex items-center gap-2 justify-end">
                            <input
                                ref={inputRef}
                                type="number"
                                defaultValue={currentBudget}
                                className="w-24 px-2 py-1 text-sm bg-black/20 rounded border border-indigo-500/50 text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            />
                            <button
                                onClick={handleSave}
                                className="p-1 bg-indigo-500 hover:bg-indigo-400 rounded-full text-white transition-colors"
                            >
                                <Check className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <div
                            className="flex items-center gap-2 justify-end cursor-pointer group/edit hover:text-indigo-200 transition-colors"
                            onClick={() => !isSaving && setIsEditing(true)}
                        >
                            <p className="font-semibold text-lg">${currentBudget.toLocaleString('es-CO')}</p>
                            {isSaving ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Pencil className="w-3 h-3 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${percentage > 100 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className="flex justify-between items-center mt-3 text-xs text-indigo-300/80 font-medium">
                <span>0%</span>
                <span className={percentage > 100 ? 'text-red-300 font-bold' : ''}>
                    {percentage.toFixed(1)}% usado
                </span>
            </div>
        </div>
    )
}
