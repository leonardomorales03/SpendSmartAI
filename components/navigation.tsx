'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    PieChart,
    Wallet,
    MessageSquare,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useSettings } from '@/components/providers/settings-provider';

export function Navigation({ email }: { email?: string }) {
    const { t, profile } = useSettings();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

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

            {/* --- Mobile Top Bar --- */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 md:hidden h-14 flex items-center px-4 justify-between">
                <Link href="/" className="flex items-center gap-2 active:scale-95 transition-transform" onClick={() => setIsMobileMenuOpen(false)}>
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

                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 -mr-2 text-zinc-400 hover:text-zinc-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-transparent active:bg-white/5"
                    aria-label="Abrir menú"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </header>

            {/* --- Mobile Slide-out Menu --- */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        {/* Slide-out Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={{ left: 0, right: 0.5 }}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipeThreshold = 50;
                                if (offset.x > swipeThreshold || velocity.x > 500) {
                                    setIsMobileMenuOpen(false);
                                }
                            }}
                            className="fixed top-0 right-0 bottom-0 w-[80vw] max-w-[320px] bg-zinc-950 border-l border-white/5 z-50 shadow-2xl flex flex-col md:hidden"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-white/5 h-14">
                                <span className="font-medium text-zinc-200">Menú</span>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-transparent active:bg-white/5"
                                    aria-label="Cerrar menú"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`
                        flex items-center gap-4 px-4 py-3 min-h-[48px] rounded-2xl text-base font-medium transition-all
                        ${isActive
                                                    ? 'bg-white/10 text-white'
                                                    : item.highlight
                                                        ? 'text-emerald-400 hover:bg-emerald-400/5'
                                                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                                }
                      `}
                                        >
                                            <Icon className={`w-5 h-5 ${item.highlight && !isActive ? 'text-emerald-500' : ''}`} />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="p-4 border-t border-white/5 mt-auto">
                                <form action="/auth/signout" method="post">
                                    <button
                                        type="submit"
                                        className="flex w-full items-center gap-4 px-4 py-3 min-h-[48px] rounded-2xl text-base font-medium text-red-400 hover:bg-red-400/10 active:bg-red-400/20 transition-all"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        <span>{t('nav.logout') || 'Cerrar Sesión'}</span>
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
