'use client'

import { Plus, MessageSquare, ScanLine } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
    return (
        <div className="grid grid-cols-3 gap-2 md:flex md:items-center md:justify-center md:gap-3 py-2">
            <Link
                href="/transactions"
                className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 rounded-2xl sm:rounded-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-white dark:hover:bg-zinc-800 transition-all active:scale-95 group shadow-sm"
            >
                <div className="p-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold sm:font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 text-center">
                    Gasto
                </span>
            </Link>

            <button
                onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 rounded-2xl sm:rounded-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:bg-white dark:hover:bg-zinc-800 transition-all active:scale-95 group shadow-sm"
            >
                <div className="p-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <ScanLine className="w-4 h-4" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold sm:font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 text-center">
                    Escanear
                </span>
            </button>

            <Link
                href="/chat"
                className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 rounded-2xl sm:rounded-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:bg-white dark:hover:bg-zinc-800 transition-all active:scale-95 group shadow-sm"
            >
                <div className="p-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                    <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold sm:font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 text-center">
                    Asistente
                </span>
            </Link>
        </div>
    )
}
