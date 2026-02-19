'use client'

import { useSettings } from "@/components/providers/settings-provider";
import Link from "next/link";

export function Header({ email }: { email?: string }) {
    const { t, profile } = useSettings();

    return (
        <header className="max-w-2xl mx-auto mb-8 text-center space-y-2">
            <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-t from-zinc-400 to-white animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {t('dashboard.title')}
            </h1>
            <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex flex-wrap justify-center items-center gap-3 text-xs text-zinc-500">
                    <div className="flex items-center gap-2">
                        {profile?.avatarUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                                src={profile.avatarUrl} 
                                alt="Avatar" 
                                className="w-5 h-5 rounded-full border border-zinc-700" 
                            />
                        )}
                        <span className="font-medium text-zinc-300">
                            {profile?.displayName || email}
                        </span>
                    </div>
                    <span className="text-zinc-700">|</span>
                    <Link href="/transactions" className="hover:text-white transition-colors">
                        {t('nav.history')}
                    </Link>
                    <span className="text-zinc-700">|</span>
                    <Link href="/budget" className="hover:text-white transition-colors">
                        {t('nav.budget')}
                    </Link>
                    <span className="text-zinc-700">|</span>
                    <Link href="/categories" className="hover:text-white transition-colors">
                        {t('nav.categories')}
                    </Link>
                    <span className="text-zinc-700">|</span>
                    <Link href="/chat" className="hover:text-white transition-colors text-emerald-400 font-medium">
                        {t('nav.chat')}
                    </Link>
                    <span className="text-zinc-700">|</span>
                    <Link href="/settings" className="hover:text-white transition-colors">
                         {t('nav.settings')}
                    </Link>
                    <span className="text-zinc-700">|</span>
                    <form action="/auth/signout" method="post" className="inline">
                        <button className="hover:text-white transition-colors" type="submit">
                            {t('nav.logout')}
                        </button>
                    </form>
                </div>
            </div>
        </header>
    )
}
