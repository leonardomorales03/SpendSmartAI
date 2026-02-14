'use client'

import { useState } from 'react'
import { updateCategoryBudget, CategoryBudgetProgress } from '@/actions/budget'
import { toast } from 'sonner'
import { Edit2, Check, X } from 'lucide-react'

type CategoryCardProps = {
    category: CategoryBudgetProgress
}

function CategoryCard({ category }: CategoryCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [amount, setAmount] = useState(category.budget)
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        setIsLoading(true)
        const res = await updateCategoryBudget(category.categoryId, amount)
        setIsLoading(false)
        if (res.success) {
            toast.success(`Presupuesto de ${category.categoryName} actualizado`)
            setIsEditing(false)
        } else {
            toast.error('Error al actualizar')
        }
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
    
    // Only show progress bar if budget is set
    const hasBudget = category.budget > 0
    const progressColor = category.percentage > 100 ? 'bg-red-500' : category.percentage > 80 ? 'bg-yellow-500' : 'bg-indigo-500'

    return (
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5 hover:bg-zinc-900 transition-colors">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl">
                        {category.emoji}
                    </div>
                    <div>
                        <h3 className="font-medium text-white">{category.categoryName}</h3>
                        <div className="text-xs text-zinc-400">
                            Gastado: {formatCurrency(category.spent)}
                        </div>
                    </div>
                </div>
                
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-24 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                            placeholder="0"
                            autoFocus
                        />
                         <button onClick={handleSave} disabled={isLoading} className="p-1.5 text-green-400 hover:bg-white/5 rounded transition-colors">
                            <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setIsEditing(false)} className="p-1.5 text-red-400 hover:bg-white/5 rounded transition-colors">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        <span className={`text-sm font-medium ${hasBudget ? 'text-white' : 'text-zinc-500'}`}>
                            {hasBudget ? formatCurrency(category.budget) : 'Sin límite'}
                        </span>
                        <Edit2 className="w-3.5 h-3.5 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                    </button>
                )}
            </div>

            {hasBudget && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-500">
                        <span>Progreso</span>
                        <span className={category.percentage > 100 ? "text-red-400" : ""}>{category.percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${progressColor}`} 
                            style={{ width: `${Math.min(category.percentage, 100)}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export function CategoryBudgetList({ categories }: { categories: CategoryBudgetProgress[] }) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {categories.map((cat) => (
                <CategoryCard key={cat.categoryId} category={cat} />
            ))}
        </div>
    )
}
