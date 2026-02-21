'use client'

import { useSettings } from "@/components/providers/settings-provider";
import Link from "next/link";
import { AppLogo } from "@/components/ui/app-logo";

export function Header({ email }: { email?: string }) {
    const { t, profile } = useSettings();

    return (
        <header className="max-w-2xl mx-auto mb-8 text-center space-y-4">
            <div className="flex items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <AppLogo className="w-12 h-12 md:w-16 md:h-16 drop-shadow-xl" />
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-t from-zinc-400 to-white">
                    {t('dashboard.title')}
                </h1>
            </div>
        </header>
    )
}
