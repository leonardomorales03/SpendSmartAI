'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Zap } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function PaymentSuccessPage() {
    const router = useRouter()

    useEffect(() => {
        const duration = 3 * 1000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

        const random = (min: number, max: number) => Math.random() * (max - min) + min

        const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now()

            if (timeLeft <= 0) {
                return clearInterval(interval)
            }

            const particleCount = 50 * (timeLeft / duration)
            confetti({
                ...defaults, 
                particleCount,
                origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 }
            })
            confetti({
                ...defaults, 
                particleCount,
                origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 }
            })
        }, 250)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-8 max-w-lg"
            >
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                    className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto"
                >
                    <CheckCircle2 className="w-12 h-12" />
                </motion.div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                        ¡Bienvenido a Pro!
                    </h1>
                    <p className="text-lg text-zinc-500">
                        Tu suscripción se ha activado correctamente. Ahora tienes acceso ilimitado a todas las funciones premium.
                    </p>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-left space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Nuevos superpoderes desbloqueados:
                    </h3>
                    <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Consultas de IA ilimitadas
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Múltiples billeteras y monedas
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Exportación avanzada de datos
                        </li>
                    </ul>
                </div>

                <button
                    onClick={() => router.push('/budget')}
                    className="w-full py-4 rounded-xl font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
                >
                    Ir al Dashboard
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </motion.div>
        </div>
    )
}
