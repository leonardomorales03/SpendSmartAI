'use client'

import { Plus, MessageSquare, ScanLine } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
    return (
        <div className="flex gap-4 p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-x-auto">
            <Link 
                href="/transactions/new"
                className="flex flex-col items-center gap-2 p-3 min-w-[80px] rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all active:scale-95 group"
            >
                <div className="p-3 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                    <Plus className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                    Gasto
                </span>
            </Link>

            <button 
                onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                className="flex flex-col items-center gap-2 p-3 min-w-[80px] rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all active:scale-95 group"
            >
                <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                    <ScanLine className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                    Escanear
                </span>
            </button>

            <Link 
                href="/chat"
                className="flex flex-col items-center gap-2 p-3 min-w-[80px] rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all active:scale-95 group"
            >
                <div className="p-3 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">
                    <MessageSquare className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                    Asistente
                </span>
            </Link>
        </div>
    )
}
