'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const quotes = [
    "Un presupuesto le dice a tu dinero a dónde ir.",
    "No ahorres lo que queda después de gastar.",
    "Cuida los pequeños gastos; un pequeño agujero hunde barcos.",
    "La libertad financiera es vivir según tus términos.",
    "Tu mente es tu activo más valioso. Invierte en ella.",
    "El riesgo viene de no saber lo que estás haciendo."
]

export function WisdomBanner() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % quotes.length);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-10 flex items-center justify-center pointer-events-none select-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(10px)' }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="flex items-center gap-3"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                    <p className="text-zinc-500 text-[13px] font-mono tracking-wide uppercase">
                        {quotes[index]}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
