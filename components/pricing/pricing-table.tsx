'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, Zap, Shield, Crown } from 'lucide-react'
import { createCheckoutSession } from '@/actions/billing/checkout'
import { PLANS } from '@/lib/billing-plans'
import { toast } from 'sonner'
import { useSettings } from '@/components/providers/settings-provider'
import { cn } from '@/lib/utils'

export function PricingTable() {
    const { t, formatCurrency, settings } = useSettings()
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

    const currentPlan = settings?.plan || 'free'

    const handleSubscribe = async (planId: string) => {
        setIsLoading(planId)
        try {
            const result = await createCheckoutSession(planId)
            if (result.success && result.url) {
                // In real implementation, redirect to payment gateway
                // router.push(result.url)
                toast.success('Redirigiendo a la pasarela de pagos...')
                window.location.href = result.url
            } else {
                toast.error(result.error || 'Error al procesar la solicitud')
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado')
        } finally {
            setIsLoading(null)
        }
    }

    const plans = PLANS

    return (
        <div className="w-full max-w-5xl mx-auto py-12 px-4">
            <div className="text-center mb-12 space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                    Invierte en tu futuro financiero
                </h2>
                <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
                    Elige el plan que mejor se adapte a tus necesidades. Cancela cuando quieras.
                </p>
                
                {/* Billing Toggle (Future) */}
                {/* <div className="flex items-center justify-center gap-4 pt-4">
                    <span className={cn("text-sm font-medium", billingCycle === 'monthly' ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500")}>Mensual</span>
                    <Switch checked={billingCycle === 'yearly'} onCheckedChange={(c) => setBillingCycle(c ? 'yearly' : 'monthly')} />
                    <span className={cn("text-sm font-medium", billingCycle === 'yearly' ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500")}>Anual (-20%)</span>
                </div> */}
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {plans.map((plan) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -5 }}
                        className={cn(
                            "relative flex flex-col p-8 rounded-3xl border transition-all duration-300",
                            plan.popular 
                                ? "bg-zinc-900 dark:bg-zinc-50 border-zinc-900 dark:border-zinc-50 shadow-xl scale-105 z-10" 
                                : "bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
                        )}
                    >
                        {plan.popular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg flex items-center gap-1">
                                <Crown className="w-3 h-3" /> Recomendado
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className={cn(
                                "text-lg font-semibold mb-2",
                                plan.popular ? "text-zinc-100 dark:text-zinc-900" : "text-zinc-900 dark:text-zinc-100"
                            )}>
                                {plan.name}
                            </h3>
                            <div className="flex items-baseline gap-1">
                                <span className={cn(
                                    "text-4xl font-bold",
                                    plan.popular ? "text-white dark:text-black" : "text-zinc-900 dark:text-white"
                                )}>
                                    {plan.price === 0 ? 'Gratis' : `$${(plan.price / 1000).toFixed(0)}k`}
                                </span>
                                {plan.price > 0 && (
                                    <span className={cn(
                                        "text-sm",
                                        plan.popular ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-500"
                                    )}>/mes</span>
                                )}
                            </div>
                            <p className={cn(
                                "mt-4 text-sm leading-relaxed",
                                plan.popular ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-500"
                            )}>
                                {plan.description}
                            </p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm">
                                    <Check className={cn(
                                        "w-5 h-5 shrink-0",
                                        plan.popular ? "text-emerald-400 dark:text-emerald-600" : "text-emerald-500"
                                    )} />
                                    <span className={cn(
                                        plan.popular ? "text-zinc-300 dark:text-zinc-700" : "text-zinc-600 dark:text-zinc-400"
                                    )}>
                                        {feature}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => plan.price > 0 && handleSubscribe(plan.id)}
                            disabled={plan.price === 0 || isLoading === plan.id || currentPlan === 'pro'}
                            className={cn(
                                "w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2",
                                plan.popular
                                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-lg"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700",
                                (plan.price === 0 || currentPlan === 'pro') && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isLoading === plan.id ? (
                                <span className="animate-pulse">Procesando...</span>
                            ) : (
                                <>
                                    {plan.price === 0 ? (currentPlan === 'free' ? 'Plan Actual' : 'Plan Básico') : (currentPlan === 'pro' ? 'Plan Activo' : plan.cta)}
                                    {plan.price > 0 && currentPlan !== 'pro' && <Zap className="w-4 h-4" />}
                                </>
                            )}
                        </button>
                    </motion.div>
                ))}
            </div>

            <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
                <div className="space-y-2">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h4 className="font-semibold">Seguridad Bancaria</h4>
                    <p className="text-sm text-zinc-500">Tus datos están encriptados y protegidos con los más altos estándares.</p>
                </div>
                <div className="space-y-2">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="font-semibold">IA Avanzada</h4>
                    <p className="text-sm text-zinc-500">Acceso a los modelos más potentes (Llama 3, GPT-4) para analizar tus gastos.</p>
                </div>
                <div className="space-y-2">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h4 className="font-semibold">Soporte Prioritario</h4>
                    <p className="text-sm text-zinc-500">Resolvemos tus dudas y problemas técnicos en menos de 24 horas.</p>
                </div>
            </div>
        </div>
    )
}
