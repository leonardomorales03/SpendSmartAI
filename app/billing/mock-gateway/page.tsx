'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, ShieldCheck, XCircle, CheckCircle2 } from 'lucide-react'
import { processMockPayment } from '@/actions/billing/process-payment'
import { PLANS } from '@/lib/billing-plans'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function MockGatewayPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
    
    const planId = searchParams.get('plan')
    const userId = searchParams.get('user')
    
    const selectedPlan = PLANS.find(p => p.id === planId)

    useEffect(() => {
        if (!planId || !userId) {
            setStatus('error')
        }
    }, [planId, userId])

    const handlePayment = async () => {
        if (!planId) return

        setStatus('processing')
        
        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            const result = await processMockPayment(planId)
            
            if (result.success) {
                setStatus('success')
                setTimeout(() => {
                    router.push('/billing/success')
                }, 1500)
            } else {
                setStatus('error')
                toast.error(result.error || 'Error en el procesamiento')
            }
        } catch (error) {
            setStatus('error')
            toast.error('Error de conexión con la pasarela')
        }
    }

    if (!selectedPlan) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="text-center space-y-4">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <h1 className="text-xl font-bold">Plan no válido</h1>
                    <button onClick={() => router.back()} className="text-sm text-zinc-500 hover:underline">
                        Volver
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
            >
                {/* Header simulating Wompi/Stripe */}
                <div className="bg-[#1a1b25] p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">W</div>
                        <span className="font-medium">Pasarela Segura</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-400 bg-white/10 px-2 py-1 rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Modo Pruebas</span>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-sm text-zinc-500 uppercase tracking-wider font-medium">Total a pagar</p>
                        <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                            ${selectedPlan.price.toLocaleString('es-CO')} <span className="text-lg text-zinc-500 font-normal">COP</span>
                        </div>
                        <p className="text-sm text-zinc-500">Suscripción {selectedPlan.name}</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Comercio</span>
                            <span className="font-medium">SpendSmart AI</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Referencia</span>
                            <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                                MOCK-{Math.random().toString(36).substring(7).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Fecha</span>
                            <span className="font-medium">{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="pt-6 space-y-3">
                        <button
                            onClick={handlePayment}
                            disabled={status === 'processing' || status === 'success'}
                            className={cn(
                                "w-full py-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2",
                                status === 'success' ? "bg-emerald-500" : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]",
                                status === 'processing' && "opacity-80 cursor-wait"
                            )}
                        >
                            {status === 'processing' ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Procesando pago...
                                </>
                            ) : status === 'success' ? (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    ¡Pago Aprobado!
                                </>
                            ) : (
                                `Pagar $${selectedPlan.price.toLocaleString('es-CO')}`
                            )}
                        </button>

                        <button
                            onClick={() => router.back()}
                            disabled={status !== 'idle'}
                            className="w-full py-3 rounded-xl font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar transacción
                        </button>
                    </div>
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-950/50 p-4 text-center text-xs text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
                    Esta es una simulación segura. No se realizará ningún cargo real.
                </div>
            </motion.div>
        </div>
    )
}
