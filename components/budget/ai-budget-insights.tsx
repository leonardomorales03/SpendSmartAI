'use client'

import { useState } from 'react'
import { getAIBudgetPrediction, CategoryBudgetProgress, AIBudgetInsight } from '@/actions/budget'
import { Sparkles, TrendingUp, AlertOctagon } from 'lucide-react'

export function AIBudgetInsights({ categories }: { categories: CategoryBudgetProgress[] }) {
    const [insight, setInsight] = useState<AIBudgetInsight | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [hasLoaded, setHasLoaded] = useState(false)

    const handleAnalyze = async () => {
        setIsLoading(true)
        const data = await getAIBudgetPrediction(categories)
        setInsight(data)
        setHasLoaded(true)
        setIsLoading(false)
    }

    if (!hasLoaded) {
        return (
            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-xl p-6 border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                <div className="relative z-10 flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Análisis Predictivo IA</h3>
                        <p className="text-sm text-zinc-400 max-w-sm mx-auto mt-1">
                            Nuestra IA puede analizar tus patrones de gasto para predecir si te quedarás sin presupuesto y sugerir ajustes inteligentes.
                        </p>
                    </div>
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>Analizando...</>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generar Análisis
                            </>
                        )}
                    </button>
                </div>
            </div>
        )
    }

    if (!insight) return null

    return (
        <div className="bg-zinc-900 rounded-xl p-6 border border-white/5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">Insights de IA</h2>
            </div>

            {/* Predicciones */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Proyecciones</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                    {insight.predictions.map((pred, i) => (
                        <div key={i} className="bg-zinc-800/50 p-3 rounded-lg border border-white/5">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-white">{pred.categoryId}</span>
                                {pred.daysUntilDepletion !== null && pred.daysUntilDepletion < 7 && (
                                    <AlertOctagon className="w-4 h-4 text-red-400" />
                                )}
                            </div>
                            <div className="text-sm text-zinc-400">
                                Proyección: <span className="text-white">${pred.projectedSpend.toLocaleString()}</span>
                            </div>
                            {pred.daysUntilDepletion !== null && (
                                <div className={`text-xs mt-1 ${pred.daysUntilDepletion < 7 ? 'text-red-400' : 'text-zinc-500'}`}>
                                    Se agota en {pred.daysUntilDepletion} días
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Recomendaciones */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Recomendaciones</h3>
                <div className="space-y-2">
                    {insight.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-3 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-indigo-200">{rec}</p>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="flex justify-end">
                <button 
                    onClick={handleAnalyze} 
                    className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
                >
                    <Sparkles className="w-3 h-3" /> Actualizar análisis
                </button>
            </div>
        </div>
    )
}
