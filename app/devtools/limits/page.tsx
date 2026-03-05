'use client'

import { useState, useEffect } from 'react'
import { getLimitsStatus, fillUsage, resetUsage, resetToFreePlan, type LimitsStatus } from '@/actions/devtools/limits'
import { Loader2, Plus, Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function LimitsPage() {
    const [status, setStatus] = useState<LimitsStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const fetchStatus = async () => {
        try {
            const data = await getLimitsStatus()
            setStatus(data)
        } catch (error) {
            console.error(error)
            toast.error('Error al cargar estado de límites')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStatus()
    }, [])

    const handleFill = async (type: 'ai_chat' | 'magic_scan' | 'goals' | 'debts') => {
        setActionLoading(`fill-${type}`)
        try {
            await fillUsage(type)
            toast.success(`Límite de ${type} llenado`)
            await fetchStatus()
        } catch (error) {
            toast.error('Error al llenar límite')
        } finally {
            setActionLoading(null)
        }
    }

    const handleReset = async (type: 'ai_chat' | 'magic_scan' | 'goals' | 'debts') => {
        setActionLoading(`reset-${type}`)
        try {
            await resetUsage(type)
            toast.success(`Uso de ${type} reiniciado`)
            await fetchStatus()
        } catch (error) {
            toast.error('Error al reiniciar uso')
        } finally {
            setActionLoading(null)
        }
    }

    const handleDowngrade = async () => {
        setActionLoading('downgrade')
        try {
            await resetToFreePlan()
            toast.success('Plan reseteado a FREE')
            await fetchStatus()
        } catch (error) {
            toast.error('Error al resetear plan')
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!status) return null

    return (
        <div className="container mx-auto py-10 max-w-4xl px-4">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Probador de Límites (DevTools)</h1>
                    <p className="text-zinc-400">Administra y prueba los límites del plan Free/Pro</p>
                </div>
                <div className={cn(
                    "px-4 py-1 rounded-full text-sm font-medium",
                    status.plan === 'pro' 
                        ? "bg-gradient-to-r from-yellow-400 to-amber-600 text-black" 
                        : "bg-zinc-800 text-zinc-300"
                )}>
                    Plan Actual: {status.plan.toUpperCase()}
                </div>
            </div>
            
            {status.plan === 'pro' && (
                <div className="mb-8 p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <div>
                            <h3 className="font-medium text-yellow-500">Modo PRO Activo</h3>
                            <p className="text-sm text-zinc-400">Los límites no se aplican en el plan PRO.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDowngrade}
                        disabled={actionLoading === 'downgrade'}
                        className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md text-sm font-medium hover:bg-red-500/20 transition-colors flex items-center gap-2"
                    >
                        {actionLoading === 'downgrade' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RotateCcw className="h-4 w-4" />
                        )}
                        Forzar Downgrade a FREE
                    </button>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* AI Chat Limit */}
                <LimitCard
                    title="Consultas IA (Diario)"
                    description="Límite de 10 consultas por día"
                    count={status.aiChat.count}
                    limit={status.aiChat.limit}
                    type="ai_chat"
                    onFill={() => handleFill('ai_chat')}
                    onReset={() => handleReset('ai_chat')}
                    loading={actionLoading}
                />

                {/* Magic Scan Limit */}
                <LimitCard
                    title="Escaneos Mágicos (Mensual)"
                    description="Límite de 5 escaneos por mes"
                    count={status.magicScan.count}
                    limit={status.magicScan.limit}
                    type="magic_scan"
                    onFill={() => handleFill('magic_scan')}
                    onReset={() => handleReset('magic_scan')}
                    loading={actionLoading}
                />

                {/* Saving Goals Limit */}
                <LimitCard
                    title="Metas de Ahorro"
                    description="Máximo 1 meta activa"
                    count={status.savingGoals.count}
                    limit={status.savingGoals.limit}
                    type="goals"
                    onFill={() => handleFill('goals')}
                    onReset={() => handleReset('goals')}
                    loading={actionLoading}
                />

                {/* Debts Limit */}
                <LimitCard
                    title="Deudas"
                    description="Máximo 1 deuda registrada"
                    count={status.debts.count}
                    limit={status.debts.limit}
                    type="debts"
                    onFill={() => handleFill('debts')}
                    onReset={() => handleReset('debts')}
                    loading={actionLoading}
                />
            </div>
        </div>
    )
}

function LimitCard({ 
    title, 
    description, 
    count, 
    limit, 
    type, 
    onFill, 
    onReset,
    loading 
}: { 
    title: string
    description: string
    count: number
    limit: number
    type: string
    onFill: () => void
    onReset: () => void
    loading: string | null
}) {
    const percentage = Math.min((count / limit) * 100, 100)
    const isFull = count >= limit

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <p className="text-sm text-zinc-400">{description}</p>
                </div>
                <div className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                    isFull 
                        ? "bg-red-500/10 text-red-500 border-red-500/20" 
                        : "bg-zinc-800 text-zinc-300 border-zinc-700"
                )}>
                    {count} / {limit}
                </div>
            </div>
            
            <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div 
                    className={cn(
                        "h-full transition-all duration-500 ease-out",
                        isFull ? "bg-red-500" : "bg-primary"
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            
            <div className="flex gap-2 justify-end">
                <button
                    onClick={onReset}
                    disabled={loading !== null}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3"
                >
                    {loading === `reset-${type}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                    ) : (
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                    )}
                    Reiniciar
                </button>
                <button
                    onClick={onFill}
                    disabled={isFull || loading !== null}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3"
                >
                    {loading === `fill-${type}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                    ) : (
                        <Plus className="h-3.5 w-3.5 mr-2" />
                    )}
                    Llenar Límite
                </button>
            </div>
        </div>
    )
}
