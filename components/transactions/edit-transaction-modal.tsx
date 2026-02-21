'use client'

import { useEffect, useState } from 'react'
import { Transaction, Category } from '@/lib/types'
import { updateTransaction } from '@/actions/transaction'
import { getCategories } from '@/actions/categories'
import { getDebts, Debt } from '@/actions/debts'
import { toast } from 'sonner'
import { X, Save, Loader2 } from 'lucide-react'

interface EditTransactionModalProps {
  transaction: Transaction
  isOpen: boolean
  onClose: () => void
}

export function EditTransactionModal({ transaction, isOpen, onClose }: EditTransactionModalProps) {
  const [description, setDescription] = useState(transaction.description)
  const [amount, setAmount] = useState(transaction.amount.toString())
  const [date, setDate] = useState(() => {
    const d = new Date(transaction.date)
    const offset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
  })
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState(transaction.category_id)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [debts, setDebts] = useState<Debt[]>([])
  const [debtId, setDebtId] = useState(transaction.debt_id || '')

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingCategories(true)
        const [catData, debtData] = await Promise.all([
          getCategories(),
          getDebts()
        ])
        setCategories(catData || [])
        setDebts(debtData.data || [])
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Error al cargar datos')
      } finally {
        setIsLoadingCategories(false)
      }
    }

    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  if (!isOpen) return null

  const selectedCategory = categories.find(c => c.id === categoryId)
  const isDebtCategory = selectedCategory?.name?.toLowerCase().includes('deuda')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const result = await updateTransaction(transaction.id, {
        description,
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        category_id: categoryId,
        debt_id: isDebtCategory ? debtId : undefined
      })

      if (result.success) {
        toast.success('Gasto actualizado correctamente')
        onClose()
      } else {
        toast.error('Error al actualizar: ' + result.error)
      }
    } catch (error) {
      console.error('Error updating transaction:', error)
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-xl shadow-xl border animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Editar Gasto</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={isLoadingCategories || isSaving}
                className="w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {isDebtCategory && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Vincular Deuda</label>
                <select
                  value={debtId}
                  onChange={(e) => setDebtId(e.target.value)}
                  disabled={isSaving}
                  className="w-full px-3 py-2 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- No vincular --</option>
                  {debts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.remaining_amount.toLocaleString('es-CO')} left)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-2 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
