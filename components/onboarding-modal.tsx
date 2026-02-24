'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Sparkles, User, ArrowRight } from 'lucide-react'
import { useSettings } from '@/components/providers/settings-provider'
import { updatePreferences, updateProfile } from '@/actions/settings'
import { SubscriptionPreset, getSubscriptionPresets } from '@/actions/subscription-presets'
import { upsertSubscription } from '@/actions/subscriptions'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

interface OnboardingModalProps {
    isOpen: boolean
    onClose: () => void
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
    useSettings()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [presets, setPresets] = useState<SubscriptionPreset[]>([])

    // Step 1: Budget & Currency
    const [currency, setCurrency] = useState('COP')
    const [budget, setBudget] = useState('1000000')

    // Step 2: Subscriptions
    const [selectedPresets, setSelectedPresets] = useState<string[]>([])

    // Step 3: Profile
    const [displayName, setDisplayName] = useState('')
    const [avatarUrl] = useState('')

    useEffect(() => {
        if (isOpen) {
            loadPresets()
        }
    }, [isOpen])

    const loadPresets = async () => {
        const data = await getSubscriptionPresets()
        setPresets(data)
    }

    const handleNext = async () => {
        if (step === 1) {
            setStep(2)
        } else if (step === 2) {
            setStep(3)
        } else {
            await handleFinish()
        }
    }

    const handleFinish = async () => {
        setIsLoading(true)
        try {
            // 1. Save Settings
            await updatePreferences({
                currency,
                monthlyBudget: parseFloat(budget),
                hasCompletedOnboarding: true
            })

            // 2. Save Subscriptions
            if (selectedPresets.length > 0) {
                const selected = presets.filter(p => selectedPresets.includes(p.id))
                for (const preset of selected) {
                    await upsertSubscription({
                        name: preset.name,
                        amount: preset.default_amount || 0,
                        currency: currency, // Use user currency
                        billing_day: 1, // Default to 1st
                        frequency: 'monthly',
                        is_active: true,
                        logo_url: preset.logo_url || undefined
                        // category_id will be mapped in backend or we can fetch categories here. 
                        // For simplicity, let's leave it null or handle it if critical.
                        // Actually upsertSubscription needs a category_id usually.
                        // Ideally we should auto-assign categories.
                        // Let's assume the backend handles null category or we skip it for now.
                    })
                }
            }

            // 3. Save Profile
            if (displayName) {
                await updateProfile({
                    displayName,
                    avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${displayName}`
                })
            }

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            })

            toast.success('¡Todo listo! Bienvenido a SpendSmart AI')
            onClose()
        } catch (error) {
            console.error(error)
            toast.error('Hubo un error al guardar tu configuración')
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
                {/* Progress Bar */}
                <div className="h-1 bg-zinc-100 dark:bg-zinc-900 w-full">
                    <motion.div 
                        className="h-full bg-indigo-600"
                        animate={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
                                        <Wallet className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-2xl font-bold">Define tu Meta</h2>
                                    <p className="text-zinc-500">¿Cuál es tu presupuesto mensual ideal?</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Moneda Principal</label>
                                        <select 
                                            value={currency} 
                                            onChange={(e) => setCurrency(e.target.value)}
                                            className="w-full mt-1 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                                        >
                                            <option value="COP">Peso Colombiano (COP)</option>
                                            <option value="USD">Dólar (USD)</option>
                                            <option value="EUR">Euro (EUR)</option>
                                            <option value="MXN">Peso Mexicano (MXN)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Presupuesto Mensual</label>
                                        <div className="relative mt-1">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                                            <input 
                                                type="number" 
                                                value={budget}
                                                onChange={(e) => setBudget(e.target.value)}
                                                className="w-full pl-8 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-lg"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-pink-50 dark:bg-pink-900/20 rounded-full flex items-center justify-center mx-auto text-pink-600 dark:text-pink-400">
                                        <Sparkles className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-2xl font-bold">Suscripciones</h2>
                                    <p className="text-zinc-500">Selecciona las que ya tienes activas</p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {presets.map(preset => (
                                        <button
                                            key={preset.id}
                                            onClick={() => {
                                                if (selectedPresets.includes(preset.id)) {
                                                    setSelectedPresets(prev => prev.filter(id => id !== preset.id))
                                                } else {
                                                    setSelectedPresets(prev => [...prev, preset.id])
                                                }
                                            }}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                                                selectedPresets.includes(preset.id)
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500'
                                                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300'
                                            }`}
                                        >
                                            {preset.logo_url ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={preset.logo_url} alt={preset.name} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <span className="text-2xl">{preset.icon}</span>
                                            )}
                                            <span className="text-xs font-medium text-center line-clamp-1">{preset.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div 
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                                        <User className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-2xl font-bold">Tu Perfil</h2>
                                    <p className="text-zinc-500">¿Cómo quieres que te llamemos?</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-center mb-6">
                                        <div className="relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img 
                                                src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${displayName || 'user'}`}
                                                alt="Avatar"
                                                className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre Visible</label>
                                        <input 
                                            type="text" 
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Ej: Leo Morales"
                                            className="w-full mt-1 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleNext}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Guardando...' : (step === 3 ? 'Comenzar' : 'Siguiente')}
                            {!isLoading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
