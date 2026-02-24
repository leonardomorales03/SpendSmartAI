'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Home,
    PieChart,
    Wallet,
    MessageSquare,
    Settings,
    LogOut
} from 'lucide-react';
import { useSettings } from '@/components/providers/settings-provider';

export function Navigation({ email }: { email?: string }) {
    const { t, profile } = useSettings();
    const pathname = usePathname();

    const navItems = [
        { name: t('nav.history') || 'Historial', href: '/transactions', icon: Home },
        { name: t('nav.budget') || 'Presupuesto', href: '/budget', icon: Wallet },
        { name: t('nav.categories') || 'Categorías', href: '/categories', icon: PieChart },
        { name: t('nav.chat') || 'Chat IA ✨', href: '/chat', icon: MessageSquare, highlight: true },
        { name: t('nav.settings') || 'Configuración', href: '/settings', icon: Settings },
    ];

    return (
        <>
            {/* --- Desktop & Tablet Header/Top Bar Navigation --- */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 hidden md:block">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

                    {/* Logo / Profile */}
                    <Link href="/" className="flex items-center gap-3 active:scale-95 transition-transform">
                        {profile?.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={profile.avatarUrl}
                                alt="Avatar"
                                className="w-9 h-9 rounded-full border border-white/10 shadow-sm"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 font-medium text-sm">
                                {email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                        <span className="font-semibold text-zinc-100 hidden lg:block tracking-tight text-sm">
                            {profile?.displayName || email?.split('@')[0] || 'SpendSmart'}
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <nav className="flex items-center gap-1 lg:gap-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                    flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] min-w-[44px] justify-center
                    ${isActive
                                            ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                                            : item.highlight
                                                ? 'text-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-300'
                                                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                        }
                  `}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden md:block">{item.name}</span>
                                </Link>
                            );
                        })}

                        <div className="w-px h-6 bg-white/10 mx-2" />

                        {/* Logout */}
                        <form action="/auth/signout" method="post">
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-all duration-200 min-h-[44px]"
                                aria-label={t('nav.logout') || 'Cerrar Sesión'}
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden lg:block">{t('nav.logout') || 'Cerrar Sesión'}</span>
                            </button>
                        </form>
                    </nav>
                </div>
            </header>

            {/* --- Mobile Top Bar (Logo & Profile only) --- */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 md:hidden h-14 flex items-center px-4 justify-between">
                <Link href="/" className="flex items-center gap-2 active:scale-95 transition-transform">
                    {profile?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={profile.avatarUrl}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full border border-white/10"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 font-medium text-xs">
                            {email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                    <span className="font-semibold text-zinc-100 text-sm">
                        SpendSmart
                    </span>
                </Link>
            </header>

            {/* --- Mobile Bottom Navigation Bar --- */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-white/5 md:hidden pb-safe">
                <div className="flex items-center justify-around px-2 h-16">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex flex-col items-center justify-center w-full h-full space-y-1 relative transition-colors duration-200
                                    ${isActive
                                        ? 'text-white'
                                        : item.highlight
                                            ? 'text-emerald-400'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                    }
                                `}
                            >
                                <motion.div
                                    whileTap={{ scale: 0.85 }}
                                    className="relative flex items-center justify-center"
                                >
                                    <Icon className={`w-5 h-5 ${item.highlight && !isActive ? 'text-emerald-500' : ''}`} />
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobileNavIndicator"
                                            className="absolute -inset-2 bg-white/10 rounded-xl -z-10"
                                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        />
                                    )}
                                </motion.div>
                                <span className={`text-[10px] font-medium leading-none ${isActive ? 'font-semibold' : ''}`}>
                                    {item.name.replace(' ✨', '')}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
