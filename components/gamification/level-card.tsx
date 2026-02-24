'use client'

import { motion } from 'framer-motion'
import { Trophy, Flame } from 'lucide-react'
import Link from 'next/link'
import { useSettings } from '@/components/providers/settings-provider'

interface LevelCardProps {
    level: number
    xp: number
    nextLevelXp: number
    progressPercent: number
    streak: number
}

export function LevelCard({ level, xp, nextLevelXp, progressPercent, streak }: LevelCardProps) {
    const { t } = useSettings()

    return (
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                            <span className="text-xl font-black">{level}</span>
                        </div>
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5, type: 'spring' }}
                            className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm"
                        >
                            {t('gamification.lvl')}
                        </motion.div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-none mb-1">{t('gamification.noviceSaver')}</h3>
                        <p className="text-xs text-indigo-200 font-medium">
                            {xp} / {nextLevelXp} XP
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 bg-orange-500/20 px-2 py-1 rounded-lg border border-orange-500/30">
                        <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-pulse" />
                        <span className="text-sm font-bold text-orange-100">{streak} {t('gamification.days')}</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-black/20 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                />
            </div>
            
            <div className="mt-4 flex justify-between items-center text-xs font-medium text-indigo-200">
                <Link href="/achievements" className="flex items-center gap-1 hover:text-white transition-colors">
                    <Trophy className="w-3.5 h-3.5" />
                    {t('gamification.viewAchievements')}
                </Link>
            </div>
        </div>
    )
}
