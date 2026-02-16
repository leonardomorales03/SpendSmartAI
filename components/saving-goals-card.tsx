'use client'

import { useState } from 'react'
import { SavingGoal } from '@/lib/types'
import { useSettings } from '@/components/providers/settings-provider'
import { Plus, Target, Trash2, Calendar, Trophy, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { upsertSavingGoal, deleteSavingGoal } from '@/actions/saving-goals'
import { SAVING_GOAL_CATEGORIES } from '@/lib/constants'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'

interface SavingGoalsCardProps {
    initialGoals: SavingGoal[]
    onGoalsChange?: (goals: SavingGoal[]) => void
}

export function SavingGoalsCard({ initialGoals, onGoalsChange }: SavingGoalsCardProps) {
    const { formatCurrency } = useSettings()
    const [goals, setGoals] = useState<SavingGoal[]>(initialGoals)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null)
    const [name, setName] = useState('')
    const [targetAmount, setTargetAmount] = useState('')
    const [currentAmount, setCurrentAmount] = useState('')
    const [deadline, setDeadline] = useState('')
    const [category, setCategory] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const openCreate = () => {
        setEditingGoal(null)
        setName('')
        setTargetAmount('')
        setCurrentAmount('')
        setDeadline('')
        setCategory('')
        setIsModalOpen(true)
    }

    const openEdit = (goal: SavingGoal) => {
        setEditingGoal(goal)
        setName(goal.name)
        setTargetAmount(goal.target_amount.toString())
        setCurrentAmount(goal.current_amount?.toString() || '')
        setDeadline(goal.deadline || '')
        setCategory(goal.category || '')
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !targetAmount) {
            toast.error('Nombre y monto objetivo son obligatorios')
            return
        }

        setIsSaving(true)

        try {
            const payload = {
                id: editingGoal?.id,
                name,
                target_amount: parseFloat(targetAmount),
                current_amount: currentAmount ? parseFloat(currentAmount) : 0,
                deadline: deadline || null,
                category: category || null
            }

            const result = await upsertSavingGoal(payload)

            if (result.success && result.goal) {
                const savedGoal = result.goal
                const updatedGoals = editingGoal
                    ? goals.map(g => g.id === savedGoal.id ? savedGoal : g)
                    : [...goals, savedGoal]

                setGoals(updatedGoals)
                if (onGoalsChange) {
                    onGoalsChange(updatedGoals)
                }
                toast.success(editingGoal ? 'Meta actualizada' : 'Meta creada')
                setIsModalOpen(false)
            } else {
                toast.error(result.error || 'No se pudo guardar la meta')
            }
        } catch {
            toast.error('Ocurrió un error inesperado')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (goal: SavingGoal) => {
        if (!confirm('¿Eliminar esta meta de ahorro?')) return

        const result = await deleteSavingGoal(goal.id)

        if (result.success) {
            const remaining = goals.filter(g => g.id !== goal.id)
            setGoals(remaining)
            if (onGoalsChange) {
                onGoalsChange(remaining)
            }
            toast.success('Meta eliminada')
        } else {
            toast.error(result.error || 'No se pudo eliminar la meta')
        }
    }

    const calculateProgress = (goal: SavingGoal) => {
        if (!goal.target_amount || goal.target_amount <= 0) return 0
        return Math.min(100, (goal.current_amount / goal.target_amount) * 100)
    }

    const formatDeadline = (date: string | null) => {
        if (!date) return null
        const d = new Date(date)
        return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    return (
        <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Target className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Metas de Ahorro</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Define objetivos claros y sigue tu progreso.
                        </p>
                    </div>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    Nueva
                </button>
            </div>

            {goals.length === 0 ? (
                <div className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-6">
                    Aún no tienes metas de ahorro creadas.
                </div>
            ) : (
                <div className="space-y-4">
                    {goals.slice(0, 3).map(goal => {
                        const progress = calculateProgress(goal)
                        const isCompleted = progress >= 100
                        return (
                            <div
                                key={goal.id}
                                className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-3"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                                {goal.name}
                                            </p>
                                            {isCompleted && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full mt-1">
                                                    <Trophy className="w-3 h-3" />
                                                    Meta alcanzada
                                                </span>
                                            )}
                                            {goal.category && (
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                    {goal.category}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEdit(goal)}
                                                className="p-1 rounded-full text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(goal)}
                                                className="p-1 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                                        <span>
                                            {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                                        </span>
                                        {goal.deadline && (
                                            <span className="inline-flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDeadline(goal.deadline)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-lime-400'}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {goals.length > 3 && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                            Tienes {goals.length - 3} metas más.
                        </p>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                            {editingGoal ? 'Editar meta' : 'Nueva meta de ahorro'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                    Nombre de la meta
                                </label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500/60"
                                    placeholder="Fondo de emergencia, Viaje, Deuda, etc."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                        Monto objetivo
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={targetAmount}
                                        onChange={e => setTargetAmount(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500/60"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                        Monto actual
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={currentAmount}
                                        onChange={e => setCurrentAmount(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500/60"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                        Fecha límite
                                    </label>
                                    <input
                                        type="date"
                                        value={deadline}
                                        onChange={e => setDeadline(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500/60"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                        Categoría
                                    </label>
                                    <Select
                                        value={category}
                                        onValueChange={setCategory}
                                    >
                                        <SelectTrigger className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm">
                                            <SelectValue placeholder="Selecciona una categoría" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SAVING_GOAL_CATEGORIES.map(option => (
                                                <SelectItem key={option.id} value={option.name}>
                                                    <span className="mr-2">{option.emoji}</span>
                                                    {option.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-3 py-2 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-4 py-2 text-xs font-medium rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? 'Guardando...' : editingGoal ? 'Guardar cambios' : 'Crear meta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
