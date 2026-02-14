import { getLeaderboard } from '@/actions/gamification'
import { Medal, ChevronLeft, User } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
    const leaderboard = await getLeaderboard()

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-black p-6 md:p-12">
            <header className="max-w-md mx-auto mb-8 text-center">
                 <Link href="/" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors absolute left-6 top-6">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Volver
                </Link>

                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 mb-4 ring-4 ring-yellow-50 dark:ring-yellow-900/10">
                    <Medal className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">
                    Ranking Global
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Los ahorradores más legendarios de SpendSmart.
                </p>
            </header>

            <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {leaderboard.map((user: any, index: number) => {
                    const rank = index + 1
                    let rankIcon = null
                    let rankClass = "text-zinc-500 font-bold text-sm"
                    let bgClass = "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"

                    if (rank === 1) {
                        rankIcon = "🥇"
                        rankClass = "text-yellow-500 font-black text-xl"
                        bgClass = "bg-yellow-50/50 dark:bg-yellow-900/10 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                    } else if (rank === 2) {
                        rankIcon = "🥈"
                        rankClass = "text-zinc-400 font-black text-xl"
                    } else if (rank === 3) {
                        rankIcon = "🥉"
                        rankClass = "text-amber-700 font-black text-xl"
                    }

                    return (
                        <div 
                            key={index} 
                            className={cn(
                                "flex items-center gap-4 p-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 transition-colors",
                                bgClass
                            )}
                        >
                            <div className="w-8 text-center shrink-0">
                                {rankIcon ? <span className="text-2xl">{rankIcon}</span> : <span className={rankClass}>#{rank}</span>}
                            </div>
                            
                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.display_name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                    {user.display_name || 'Usuario Anónimo'}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                    Nivel {user.level}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="font-black text-indigo-600 dark:text-indigo-400">
                                    {user.xp.toLocaleString()}
                                </p>
                                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                                    XP Total
                                </p>
                            </div>
                        </div>
                    )
                })}

                {leaderboard.length === 0 && (
                    <div className="p-8 text-center text-zinc-500">
                        <p>Aún no hay datos en el ranking. ¡Sé el primero!</p>
                    </div>
                )}
            </div>
        </main>
    )
}
