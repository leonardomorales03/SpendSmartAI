'use client'

import { useSettings } from "@/components/providers/settings-provider";
import Link from "next/link";

export function Header({ email }: { email?: string }) {
    const { t, profile } = useSettings();

    return (
        <header className="max-w-2xl mx-auto mb-8 text-center space-y-2">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-t from-zinc-400 to-white animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {t('dashboard.title')}
            </h1>
        </header>
    )
}
