'use client'

import { useState } from 'react'
import { useSettings } from '@/components/providers/settings-provider'
import { cn } from '@/lib/utils'
import { Wallet, ArrowDownRight, ArrowUpRight, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createDebt, addDebtPayment } from '@/actions/debts'

type DebtType = 'credit_card' | 'loan' | 'personal' | 'other'
type DebtStatus = 'active' | 'paid' | 'defaulted'

type Debt = {
  id: string
  name: string
  type: DebtType
  original_amount: number
  remaining_amount: number
  status: DebtStatus
  due_date?: string | null
  min_monthly_payment?: number | null
}

interface DebtsSummaryCardProps {
  debts: Debt[]
}

export function DebtsSummaryCard({ debts }: DebtsSummaryCardProps) {
  const { formatCurrency } = useSettings()
  const [localDebts, setLocalDebts] = useState<Debt[]>(debts || [])
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

  const activeDebts = localDebts.filter(d => d.status === 'active')
  const paidDebts = localDebts.filter(d => d.status === 'paid')

  const totalOriginal = activeDebts.reduce((sum, d) => sum + Number(d.original_amount || 0), 0)
  const totalRemaining = activeDebts.reduce((sum, d) => sum + Number(d.remaining_amount || 0), 0)
  const totalPaid = totalOriginal - totalRemaining

  const progress = totalOriginal > 0 ? Math.min((totalPaid / totalOriginal) * 100, 100) : 0

  const hasDebts = localDebts.length > 0

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

      const updatedDebts = [result.debt as Debt, ...localDebts]
      setLocalDebts(updatedDebts)
      toast.success('Deuda creada')
      setIsCreateModalOpen(false)
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

      const updatedDebts = localDebts.map(d => {
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

      setLocalDebts(updatedDebts)
      toast.success('Pago registrado')
      setPaymentDebt(null)
      setPaymentAmount('')
      setPaymentDate('')
      setPaymentNote('')
    } catch {
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsPaying(false)
    }
  }

  const visibleDebts = activeDebts.slice(0, 3)

  return (
    <>
      <div className="relative overflow-hidden p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Deudas y préstamos</p>
              {hasDebts ? (
                <>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                    {formatCurrency(totalRemaining)} pendientes
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Has pagado {formatCurrency(totalPaid)} de {formatCurrency(totalOriginal)} en deudas activas.
                  </p>
                </>
              ) : (
                <p className="text-sm text-zinc-500 mt-1">
                  Aún no has registrado ninguna deuda. Usa esta sección para llevar control de tarjetas y
                  préstamos.
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-2xl">
                <Wallet className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
              </div>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Nueva deuda
              </button>
            </div>
          </div>

          {hasDebts && (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-zinc-500">Progreso de desendeudamiento</span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                      <ArrowDownRight className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      Pagado en deudas
                    </span>
                  </div>
                  <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                    {formatCurrency(totalPaid)}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Deudas activas
                    </span>
                  </div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {activeDebts.length} activas · {paidDebts.length} pagadas
                  </p>
                </div>
              </div>

              {visibleDebts.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-medium text-zinc-500">Deudas principales</p>
                  {visibleDebts.map(debt => (
                    <div
                      key={debt.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {debt.name}
                        </span>
                        <span className="text-xs text-zinc-500">
                          Saldo: {formatCurrency(debt.remaining_amount)}
                        </span>
                      </div>
                      <button
                        onClick={() => openPaymentModal(debt)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      >
                        Abonar
                      </button>
                    </div>
                  ))}
                  {activeDebts.length > visibleDebts.length && (
                    <p className="text-[11px] text-zinc-500">
                      Tienes {activeDebts.length - visibleDebts.length} deudas activas más.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Nueva deuda o préstamo
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Cerrar
              </button>
            </div>
            <form onSubmit={handleCreateDebt} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Nombre de la deuda
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60"
                  placeholder="Tarjeta Visa, Préstamo auto, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Tipo
                  </label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as DebtType)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60"
                  >
                    <option value="credit_card">Tarjeta de crédito</option>
                    <option value="loan">Préstamo</option>
                    <option value="personal">Deuda personal</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Monto total
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={originalAmount}
                    onChange={e => setOriginalAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Tasa de interés (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={interestRate}
                    onChange={e => setInterestRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60"
                    placeholder="Opcional"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Pago mínimo mensual
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={minMonthlyPayment}
                    onChange={e => setMinMonthlyPayment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Fecha de vencimiento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Guardar deuda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paymentDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Registrar pago
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {paymentDebt.name} · Saldo actual: {formatCurrency(paymentDebt.remaining_amount)}
                </p>
              </div>
              <button
                onClick={() => setPaymentDebt(null)}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Cerrar
              </button>
            </div>
            <form onSubmit={handleRegisterPayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Monto del pago
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Fecha
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Nota
                </label>
                <textarea
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500/60 resize-none"
                  rows={3}
                  placeholder="Pago extra, ajuste, etc. (opcional)"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentDebt(null)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  disabled={isPaying}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPaying}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPaying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Registrar pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
