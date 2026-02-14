import { getAchievements, getUserProgress } from '@/actions/gamification'
import { Trophy, Lock, CheckCircle2, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AchievementsPage() {
    const achievements = await getAchievements()
    const progress = await getUserProgress()

    const unlockedCount = achievements.filter(a => a.unlocked_at).length
    const totalCount = achievements.length
    const completionPercent = Math.round((unlockedCount / totalCount) * 100) || 0

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-black p-6 md:p-12 pb-24">
            <header className="max-w-2xl mx-auto mb-8">
                <Link href="/" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Volver al Dashboard
                </Link>
                
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                        Sala de Trofeos
                    </h1>
                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-bold border border-yellow-200 dark:border-yellow-900/50">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>{unlockedCount}/{totalCount}</span>
                    </div>
                </div>
                
                <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                    Completa desafíos para ganar XP y subir de nivel. ¡Colecciónalos todos!
                </p>

                {/* Progress Bar */}
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-8">
                    <div 
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out"
                        style={{ width: `${completionPercent}%` }}
                    />
                </div>
            </header>

            <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => {
                    const isUnlocked = !!achievement.unlocked_at
                    
                    return (
                        <div 
                            key={achievement.id}
                            className={cn(
                                "relative overflow-hidden p-4 rounded-2xl border transition-all duration-300",
                                isUnlocked 
                                    ? "bg-white dark:bg-zinc-900 border-indigo-100 dark:border-indigo-900/30 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800" 
                                    : "bg-zinc-100 dark:bg-zinc-950 border-transparent opacity-70 grayscale"
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl shadow-inner",
                                    isUnlocked ? "bg-gradient-to-br from-indigo-100 to-white dark:from-indigo-900/50 dark:to-zinc-900" : "bg-zinc-200 dark:bg-zinc-800"
                                )}>
                                    {/* Map icon name to Lucide component dynamically or use emoji fallback */}
                                    {isUnlocked ? '🏆' : <Lock className="w-5 h-5 text-zinc-400" />}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={cn("font-bold truncate", isUnlocked ? "text-zinc-900 dark:text-white" : "text-zinc-500")}>
                                            {achievement.title}
                                        </h3>
                                        {isUnlocked && (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">
                                        {achievement.description}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                            isUnlocked 
                                                ? "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800" 
                                                : "bg-zinc-200 text-zinc-500 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-600 dark:border-zinc-700"
                                        )}>
                                            +{achievement.xp_reward} XP
                                        </span>
                                        {isUnlocked && (
                                            <span className="text-[10px] text-zinc-400">
                                                {new Date(achievement.unlocked_at!).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </main>
    )
}
