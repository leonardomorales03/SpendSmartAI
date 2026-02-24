'use client'

import { useState } from 'react'
import { useSettings } from '@/components/providers/settings-provider'
import { cn } from '@/lib/utils'
import { ArrowLeft, Plus, Loader2, Wallet, ArrowDownRight } from 'lucide-react'
import { toast } from 'sonner'
import { createDebt, addDebtPayment, Debt } from '@/actions/debts'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type DebtType = 'credit_card' | 'loan' | 'personal' | 'other'
type DebtStatus = 'active' | 'paid' | 'defaulted'

interface DebtsListProps {
  initialDebts: Debt[]
}

export function DebtsList({ initialDebts }: DebtsListProps) {
  const { formatCurrency } = useSettings()
  const router = useRouter()
  const [debts, setDebts] = useState<Debt[]>(initialDebts)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<DebtType>('credit_card')
  const [originalAmount, setOriginalAmount] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [minMonthlyPayment, setMinMonthlyPayment] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [isPaying, setIsPaying] = useState(false)

  const activeDebts = debts.filter(d => d.status === 'active')
  const paidDebts = debts.filter(d => d.status === 'paid')

  const totalOriginal = activeDebts.reduce((sum, d) => sum + Number(d.original_amount || 0), 0)
  const totalRemaining = activeDebts.reduce((sum, d) => sum + Number(d.remaining_amount || 0), 0)
  const totalPaid = totalOriginal - totalRemaining

  const progress = totalOriginal > 0 ? Math.min((totalPaid / totalOriginal) * 100, 100) : 0

  const openCreateModal = () => {
    setName('')
    setType('credit_card')
    setOriginalAmount('')
    setInterestRate('')
    setDueDate('')
    setMinMonthlyPayment('')
    setIsCreateModalOpen(true)
  }

  const openPaymentModal = (debt: Debt) => {
    setPaymentDebt(debt)
    setPaymentAmount(debt.min_monthly_payment ? String(debt.min_monthly_payment) : '')
    const today = new Date()
    const iso = today.toISOString().slice(0, 10)
    setPaymentDate(iso)
    setPaymentNote('')
  }

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !originalAmount) {
      toast.error('Nombre y monto son obligatorios')
      return
    }

    const amount = parseFloat(originalAmount)
    if (!amount || amount <= 0) {
      toast.error('Monto inválido')
      return
    }

    setIsSaving(true)

    try {
      const result = await createDebt({
        name,
        type,
        original_amount: amount,
        interest_rate: interestRate ? parseFloat(interestRate) : undefined,
        due_date: dueDate || undefined,
        min_monthly_payment: minMonthlyPayment ? parseFloat(minMonthlyPayment) : undefined,
      })

      if (!result.success || !result.debt) {
        toast.error(result.error || 'No se pudo crear la deuda')
        return
      }

      const updatedDebts = [result.debt as Debt, ...debts]
      setDebts(updatedDebts)
      toast.success('Deuda creada')
      setIsCreateModalOpen(false)
      router.refresh()
    } catch {
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!paymentDebt) return

    if (!paymentAmount) {
      toast.error('El monto del pago es obligatorio')
      return
    }

    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0) {
      toast.error('Monto inválido')
      return
    }

    if (amount > Number(paymentDebt.remaining_amount || 0)) {
      toast.error('El pago no puede ser mayor al saldo pendiente')
      return
    }

    setIsPaying(true)

    try {
      const result = await addDebtPayment({
        debt_id: paymentDebt.id,
        amount,
        date: paymentDate || undefined,
        note: paymentNote || undefined,
      })

      if (!result.success) {
        toast.error(result.error || 'No se pudo registrar el pago')
        return
      }

      const updatedDebts = debts.map(d => {
        if (d.id !== paymentDebt.id) return d
        const remaining = Number(d.remaining_amount || 0) - amount
        const nextRemaining = remaining < 0 ? 0 : remaining
        const nextStatus: DebtStatus = nextRemaining <= 0 ? 'paid' : d.status
        return {
          ...d,
          remaining_amount: nextRemaining,
          status: nextStatus,
        }
      })

      setDebts(updatedDebts)
      toast.success('Pago registrado')
      setPaymentDebt(null)
      setPaymentAmount('')
      setPaymentDate('')
      setPaymentNote('')
      router.refresh()
    } catch {
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Deudas y Préstamos
            </h1>
            <p className="text-sm text-zinc-500">
              Gestiona todas tus obligaciones financieras
            </p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          Nueva Deuda
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
           <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
               <Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-sm font-medium text-zinc-500">Total Pendiente</span>
           </div>
           <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
             {formatCurrency(totalRemaining)}
           </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
           <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
               <ArrowDownRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-zinc-500">Total Pagado</span>
           </div>
           <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
             {formatCurrency(totalPaid)}
           </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-center">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-zinc-500">Progreso Global</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                <div
                    className={cn(
                    'h-full rounded-full transition-all',
                    progress < 40 ? 'bg-red-500' : progress < 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    )}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Deudas Activas ({activeDebts.length})
            </h2>
            {activeDebts.length > 0 ? (
                <div className="space-y-3">
                    {activeDebts.map(debt => (
                        <div key={debt.id} className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{debt.name}</h3>
                                    <p className="text-xs text-zinc-500 capitalize">{debt.type.replace('_', ' ')}</p>
                                </div>
                                <button
                                    onClick={() => openPaymentModal(debt)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                                >
                                    Abonar
                                </button>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Original</span>
                                    <span className="font-medium">{formatCurrency(debt.original_amount)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Pendiente</span>
                                    <span className="font-bold text-red-500">{formatCurrency(debt.remaining_amount)}</span>
                                </div>
                                {debt.min_monthly_payment && (
                                    <div className="flex justify-between text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800">
                                        <span className="text-zinc-400">Pago mínimo</span>
                                        <span className="text-zinc-600 dark:text-zinc-400">{formatCurrency(debt.min_monthly_payment)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800">
                    <p className="text-zinc-500">No tienes deudas activas. ¡Felicidades!</p>
                </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                Historial de Pagadas ({paidDebts.length})
            </h2>
            {paidDebts.length > 0 ? (
                <div className="space-y-3">
                    {paidDebts.map(debt => (
                        <div key={debt.id} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/50 opacity-75 hover:opacity-100 transition-opacity">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100 line-through decoration-zinc-400">{debt.name}</h3>
                                    <p className="text-xs text-zinc-500 capitalize">{debt.type.replace('_', ' ')}</p>
                                </div>
                                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                    PAGADA
                                </span>
                            </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Monto total</span>
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">{formatCurrency(debt.original_amount)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800">
                    <p className="text-zinc-500 text-sm">Aún no has terminado de pagar ninguna deuda.</p>
                </div>
            )}
          </div>
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Nueva deuda
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <div className="w-4 h-4 text-zinc-500">✕</div>
              </button>
            </div>
            <form onSubmit={handleCreateDebt} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Nombre
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Ej: Tarjeta Visa"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Tipo
                  </label>
                  <div className="relative">
                    <select
                        value={type}
                        onChange={e => setType(e.target.value as DebtType)}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                    >
                        <option value="credit_card">Tarjeta Crédito</option>
                        <option value="loan">Préstamo</option>
                        <option value="personal">Personal</option>
                        <option value="other">Otro</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ArrowDownRight className="w-4 h-4 text-zinc-400" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Monto Total
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={originalAmount}
                    onChange={e => setOriginalAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Interés (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={interestRate}
                    onChange={e => setInterestRate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="Opcional"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Pago Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={minMonthlyPayment}
                    onChange={e => setMinMonthlyPayment(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Vencimiento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Guardar Deuda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paymentDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Registrar Pago
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  {paymentDebt.name}
                </p>
              </div>
              <button
                onClick={() => setPaymentDebt(null)}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <div className="w-4 h-4 text-zinc-500">✕</div>
              </button>
            </div>
            <form onSubmit={handleRegisterPayment} className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 mb-4">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">Saldo Actual</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(paymentDebt.remaining_amount)}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Monto a Pagar
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-lg"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Fecha
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Nota (Opcional)
                </label>
                <textarea
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                  rows={2}
                  placeholder="Ej: Pago extra de aguinaldo"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setPaymentDebt(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  disabled={isPaying}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPaying}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                >
                  {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
