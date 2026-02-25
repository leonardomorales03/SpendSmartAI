'use client'

import { useState } from 'react'
import { Subscription, Category } from '@/lib/types'
import { SubscriptionPreset } from '@/actions/subscription-presets'
import { registerSubscriptionPayment, deleteSubscription, runMonthlySubscriptions } from '@/actions/subscriptions'
import { SubscriptionModal } from './subscription-modal'
import { Plus, Edit2, Trash2, Calendar, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useSettings } from '@/components/providers/settings-provider'
import { calculateTotalMonthly, calculateRemainingThisMonth, getDueToday, getCalendarCounts } from '@/lib/subscriptions'

interface SubscriptionsClientProps {
  initialSubscriptions: Subscription[]
  categories: Category[]
  presets?: SubscriptionPreset[]
}

export function SubscriptionsClient({ initialSubscriptions, categories, presets = [] }: SubscriptionsClientProps) {
  const router = useRouter()
  const { formatCurrency } = useSettings()
  
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)
  const [isRunningAuto, setIsRunningAuto] = useState(false)

  if (initialSubscriptions !== subscriptions) {
    setSubscriptions(initialSubscriptions)
  }

  const today = new Date()
  const totalMonthly = calculateTotalMonthly(subscriptions)
  const remainingToPay = calculateRemainingThisMonth(subscriptions, today)
  const dueToday = getDueToday(subscriptions, today)
  const calendarCounts = getCalendarCounts(subscriptions)
  const activeCount = subscriptions.filter((s) => s.is_active).length
  const hasActiveSubscriptions = activeCount > 0

  // Actions
  const handleEdit = (sub: Subscription) => {
    setEditingSubscription(sub)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingSubscription(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta suscripción?')) {
        const result = await deleteSubscription(id)
        if (result.success) {
            toast.success('Suscripción eliminada')
            router.refresh()
        } else {
            toast.error('Error al eliminar')
        }
    }
  }

  const handleConfirmPayment = async (id: string) => {
    setProcessingPayment(id)
    try {
        const result = await registerSubscriptionPayment(id)
        if (result.success) {
            toast.success('Pago registrado correctamente')
            router.refresh()
        } else {
            toast.error('Error al registrar pago')
        }
    } catch (error) {
        console.error('Error confirming subscription payment:', error)
        toast.error('Error inesperado')
    } finally {
        setProcessingPayment(null)
    }
  }

  const handleRunMonthly = async () => {
    setIsRunningAuto(true)
    try {
      const result = await runMonthlySubscriptions()
      if (result.success) {
        if (result.count && result.count > 0) {
          toast.success(`Se registraron ${result.count} pagos de suscripciones de este mes`)
        } else {
          toast.info('No había pagos pendientes de este mes para registrar')
        }
        router.refresh()
      } else {
        toast.error(result.error || 'Error al registrar pagos de suscripciones')
      }
    } catch (error) {
      console.error('Error running monthly subscriptions:', error)
      toast.error('Error inesperado al registrar pagos de suscripciones')
    } finally {
      setIsRunningAuto(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Costo Mensual Total</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(totalMonthly)}
            </p>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                    <Calendar className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Restante este mes</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(remainingToPay)}
            </p>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Activas</span>
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {activeCount}
                </p>
            </div>
            <button 
                onClick={handleCreate}
                aria-label="Nueva suscripción"
                className="p-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full hover:scale-105 transition-transform shadow-lg"
            >
                <Plus className="w-6 h-6" />
            </button>
        </div>
      </div>

      {/* Auto-pay & Calendar */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Automatización ligera</h2>
            <p className="text-sm text-zinc-500">
              Registra en lote los pagos de este mes según el día de cobro configurado.
            </p>
          </div>
          <button
            onClick={handleRunMonthly}
            disabled={isRunningAuto}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {isRunningAuto ? 'Registrando pagos...' : 'Registrar pagos de este mes'}
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Calendario de cobros
            </h3>
          </div>
          {!hasActiveSubscriptions ? (
            <p className="text-sm text-zinc-500">
              Aún no tienes suscripciones activas para mostrar en el calendario.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2 text-xs mb-3">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                  const count = calendarCounts[day] || 0
                  const has = count > 0
                  return (
                    <div
                      key={day}
                      className={`flex flex-col items-center justify-center rounded-lg border px-1.5 py-1 ${
                        has
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200'
                          : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                      }`}
                    >
                      <span className="font-semibold">{day}</span>
                      {has && <span className="text-[10px] font-medium mt-0.5">{count}x</span>}
                    </div>
                  )
                })}
              </div>
              <p className="text-[11px] text-zinc-500">
                Los días resaltados indican cuándo se cobran tus suscripciones. El botón de arriba registra los pagos pendientes del mes actual.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Due Today Section */}
      {dueToday.length > 0 && (
        <section className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-lg font-bold">Vencen Hoy</h2>
          </div>
          <div className="grid gap-4">
            {dueToday.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 p-5 shadow-sm"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{s.name}</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {formatCurrency(s.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                    {processingPayment === s.id ? (
                         <span className="text-sm text-zinc-500 animate-pulse">Procesando...</span>
                    ) : (
                        <>
                            <button
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                            >
                                Aún no
                            </button>
                            <button
                                onClick={() => handleConfirmPayment(s.id)}
                                className="px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all hover:scale-105"
                            >
                                Sí, ya pagué
                            </button>
                        </>
                    )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Subscriptions List */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Todas las Suscripciones</h2>
        {subscriptions.length === 0 ? (
          <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 mb-4">No tienes suscripciones registradas</p>
            <button 
                onClick={handleCreate}
                className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
                Agregar la primera
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {subscriptions.map((s) => (
              <div
                key={s.id}
                className={`group flex items-center justify-between rounded-2xl border p-4 transition-all hover:shadow-md ${!s.is_active ? 'opacity-60 bg-zinc-50 dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-800' : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'}`}
              >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl overflow-hidden ${!s.is_active ? 'bg-zinc-100 dark:bg-zinc-900' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
                        {s.logo_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={s.logo_url} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                             s.category?.emoji || '📅'
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{s.name}</span>
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                {formatCurrency(s.amount)}
                            </span>
                            <span>•</span>
                            <span>Día {s.billing_day}</span>
                            <span>•</span>
                            <span className="capitalize">{s.frequency === 'monthly' ? 'Mensual' : 'Anual'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleEdit(s)}
                        className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => handleDelete(s.id)}
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <SubscriptionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        subscription={editingSubscription}
        presets={presets}
      />
    </div>
  )
}
