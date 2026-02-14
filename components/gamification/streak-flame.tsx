'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Flame } from 'lucide-react'

export function StreakFlame({ streak }: { streak: number }) {
    if (streak === 0) return null

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center"
        >
            <div className="relative">
                <motion.div
                    animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [-2, 2, -2] 
                    }}
                    transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <Flame className="w-16 h-16 text-orange-500 fill-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                </motion.div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pt-2">
                    <span className="text-white font-black text-lg drop-shadow-md">{streak}</span>
                </div>
            </div>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">Días en Racha</p>
        </motion.div>
    )
}
