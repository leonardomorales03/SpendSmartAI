'use client'

import { useState, useEffect } from 'react'
import { Subscription, Category } from '@/lib/types'
import { SubscriptionPreset } from '@/actions/subscription-presets'
import { upsertSubscription } from '@/actions/subscriptions'
import { toast } from 'sonner'
import { X, Save, Loader2, Calendar, Sparkles } from 'lucide-react'
import { useSettings } from '@/components/providers/settings-provider'
import { getExchangeRate } from '@/actions/currency'

interface SubscriptionModalProps {
  subscription?: Subscription | null
  categories: Category[]
  presets?: SubscriptionPreset[]
  isOpen: boolean
  onClose: () => void
}

export function SubscriptionModal({ subscription, categories, presets = [], isOpen, onClose }: SubscriptionModalProps) {
  const { settings } = useSettings()
  const userCurrency = settings?.currency || 'COP'
  
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [billingDay, setBillingDay] = useState(1)
  const [categoryId, setCategoryId] = useState('')
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly')
  const [isActive, setIsActive] = useState(true)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  
  const [isSaving, setIsSaving] = useState(false)

  // Load subscription data when opened/changed
  useEffect(() => {
    if (isOpen) {
        if (subscription) {
            setName(subscription.name)
            setAmount(subscription.amount.toString())
            setBillingDay(subscription.billing_day)
            setCategoryId(subscription.category_id || '')
            setFrequency(subscription.frequency)
            setIsActive(subscription.is_active)
            setLogoUrl(subscription.logo_url || null)
        } else {
            // Reset for new subscription
            setName('')
            setAmount('')
            setBillingDay(new Date().getDate()) // Default to today
            setCategoryId(categories[0]?.id || '')
            setFrequency('monthly')
            setIsActive(true)
            setLogoUrl(null)
        }
    }
  }, [isOpen, subscription, categories])

  const handlePresetSelect = async (preset: SubscriptionPreset) => {
    setName(preset.name)

    if (preset.logo_url) {
      setLogoUrl(preset.logo_url)
    }

    if (preset.default_amount) {
      let finalAmount = preset.default_amount

      if (userCurrency && userCurrency !== 'USD') {
        try {
          const rate = await getExchangeRate('USD', userCurrency)
          if (rate) {
            const converted = preset.default_amount * rate
            finalAmount = userCurrency === 'COP' ? Math.round(converted) : parseFloat(converted.toFixed(2))
          }
        } catch (error) {
          console.error('Error fetching exchange rate for subscription preset', error)
        }
      }

      setAmount(finalAmount.toString())
    }

    const category = categories.find(
      (c) =>
        c.name.toLowerCase() === preset.category_name.toLowerCase() ||
        (preset.category_name === 'Suscripciones' && c.name === 'Ocio'),
    )

    if (category) {
      setCategoryId(category.id)
    } else if (categories.length > 0) {
      setCategoryId(categories[0].id)
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const payload = {
        id: subscription?.id,
        name,
        amount: parseFloat(amount),
        currency: subscription?.currency || userCurrency || 'COP',
        billing_day: billingDay,
        frequency,
        category_id: categoryId,
        is_active: isActive,
        logo_url: logoUrl || undefined
      }

      const result = await upsertSubscription(payload)

      if (result.success) {
        toast.success(subscription ? 'Suscripción actualizada' : 'Suscripción creada')
        onClose()
      } else {
        toast.error('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error saving subscription:', error)
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {subscription ? 'Editar Suscripción' : 'Nueva Suscripción'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors text-zinc-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggested Presets */}
        {!subscription && presets && presets.length > 0 && (
            <div className="px-6 pt-6 pb-0">
                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Populares</span>
                </div>
                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                    {presets.map(preset => (
                        <button
                            key={preset.id}
                            type="button"
                            onClick={() => handlePresetSelect(preset)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all hover:scale-105"
                        >
                            {preset.logo_url ? (
                                <img src={preset.logo_url} alt={preset.name} className="w-4 h-4 rounded-full object-cover" />
                            ) : (
                                <span>{preset.icon}</span>
                            )}
                            {preset.name}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name & Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre del Servicio</label>
              <input
                type="text"
                list="preset-names"
                value={name}
                onChange={(e) => {
                    setName(e.target.value)
                    // Auto-fill details if matches a preset exactly
                    const preset = presets.find(p => p.name.toLowerCase() === e.target.value.toLowerCase())
                    if (preset && !amount) {
                        handlePresetSelect(preset)
                    }
                }}
                placeholder="Ej: Netflix"
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                required
              />
              <datalist id="preset-names">
                {presets.map(preset => (
                    <option key={preset.id} value={preset.name} />
                ))}
              </datalist>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Monto</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                />
              </div>
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Categoría</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                required
              >
                <option value="" disabled>Seleccionar</option>
                {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                        {cat.emoji} {cat.name}
                    </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Día de Cobro</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                    type="number"
                    min="1"
                    max="31"
                    value={billingDay}
                    onChange={(e) => setBillingDay(parseInt(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                />
              </div>
            </div>
          </div>

          {/* Frequency & Status */}
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Frecuencia:</label>
                <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
                    <button
                        type="button"
                        onClick={() => setFrequency('monthly')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${frequency === 'monthly' ? 'bg-white dark:bg-zinc-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                    >
                        Mensual
                    </button>
                    <button
                        type="button"
                        onClick={() => setFrequency('yearly')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${frequency === 'yearly' ? 'bg-white dark:bg-zinc-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                    >
                        Anual
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={isActive} 
                        onChange={(e) => setIsActive(e.target.checked)} 
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    <span className="ml-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {isActive ? 'Activa' : 'Pausada'}
                    </span>
                </label>
            </div>
          </div>

          <div className="pt-4 flex gap-3 justify-end border-t border-zinc-100 dark:border-zinc-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Guardar Suscripción
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
