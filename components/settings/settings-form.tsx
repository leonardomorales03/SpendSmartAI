'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, CreditCard, Lock, Save, Loader2, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile, updatePreferences, updatePassword, UserSettings, UserProfile } from '@/actions/settings'
import { getExchangeRate } from '@/actions/currency'
import { useRouter } from 'next/navigation'
import { useSettings } from '@/components/providers/settings-provider'

interface SettingsFormProps {
    settings: UserSettings
    profile: UserProfile
}

const CURRENCIES = [
    { code: 'COP', label: 'Peso Colombiano (COP)', locale: 'es-CO', symbol: '$' },
    { code: 'USD', label: 'Dólar Estadounidense (USD)', locale: 'en-US', symbol: '$' },
    { code: 'EUR', label: 'Euro (EUR)', locale: 'es-ES', symbol: '€' },
    { code: 'MXN', label: 'Peso Mexicano (MXN)', locale: 'es-MX', symbol: '$' },
]

const AVATAR_PRESETS = [
    'https://api.dicebear.com/9.x/bottts/svg?seed=Gizmo&backgroundColor=e3f2fd',
    'https://api.dicebear.com/9.x/bottts/svg?seed=Pixel&backgroundColor=f3e5f5',
    'https://api.dicebear.com/9.x/bottts/svg?seed=Robo&backgroundColor=e0f7fa',
    'https://api.dicebear.com/9.x/bottts/svg?seed=Byte&backgroundColor=fbe9e7',
    'https://api.dicebear.com/9.x/bottts/svg?seed=Circuit&backgroundColor=f1f8e9',
    'https://api.dicebear.com/9.x/bottts/svg?seed=Data&backgroundColor=fff8e1',
    'https://api.dicebear.com/9.x/bottts/svg?seed=Nano&backgroundColor=e8eaf6',
    'https://api.dicebear.com/9.x/bottts/svg?seed=Watt&backgroundColor=fce4ec',
    'https://api.dicebear.com/9.x/bottts/svg?seed=Zeta&backgroundColor=e0f2f1',
    'https://api.dicebear.com/9.x/bottts/svg?seed=Omega&backgroundColor=f3e5f5',
]

export function SettingsForm({ settings, profile }: SettingsFormProps) {
    const router = useRouter()
    const { t } = useSettings()
    const [isLoading, setIsLoading] = useState(false)
    const [isConverting, setIsConverting] = useState(false)
    const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile')

    // Form State
    const [displayName, setDisplayName] = useState(profile.displayName || '')
    const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '')
    
    const [currency, setCurrency] = useState(settings.currency)
    const [monthlyBudget, setMonthlyBudget] = useState(settings.monthly_budget.toString())
    const [language, setLanguage] = useState(settings.language || 'es')

    // Password State
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // Handle currency change and auto-convert budget
    const handleCurrencyChange = async (newCurrency: string) => {
        const oldCurrency = currency;
        setCurrency(newCurrency);

        if (oldCurrency !== newCurrency && monthlyBudget) {
            setIsConverting(true);
            try {
                const rate = await getExchangeRate(oldCurrency, newCurrency);
                if (rate) {
                    const currentVal = parseFloat(monthlyBudget);
                    if (!isNaN(currentVal)) {
                        const converted = currentVal * rate;
                        setMonthlyBudget(newCurrency === 'COP' ? Math.round(converted).toString() : converted.toFixed(2));
                        toast.info(`${t('settings.currencyNote')} (Rate: ${rate.toFixed(4)})`);
                    }
                }
            } catch (error) {
                console.error('Conversion error:', error);
            } finally {
                setIsConverting(false);
            }
        }
    }

    const handleSavePreferences = async () => {
        setIsLoading(true)
        try {
            const selectedCurrency = CURRENCIES.find(c => c.code === currency)
            const result = await updatePreferences({
                currency,
                locale: selectedCurrency?.locale || 'es-CO',
                monthlyBudget: parseFloat(monthlyBudget),
                language
            })
            
            if (result.success) {
                toast.success(t('settings.savePrefs'))
                router.refresh()
            } else {
                toast.error('Error: ' + result.error)
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveProfile = async () => {
        setIsLoading(true)
        try {
            const result = await updateProfile({ displayName, avatarUrl })
            if (result.success) {
                toast.success(t('settings.saveChanges'))
                router.refresh()
            } else {
                toast.error('Error: ' + result.error)
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado')
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdatePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error(t('settings.passwordsDoNotMatch'))
            return
        }
        if (newPassword.length < 6) {
            toast.error(t('settings.passwordTooShort'))
            return
        }

        setIsLoading(true)
        try {
            const result = await updatePassword(newPassword)
            if (result.success) {
                toast.success(t('settings.passwordUpdated'))
                setNewPassword('')
                setConfirmPassword('')
            } else {
                toast.error('Error: ' + result.error)
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <nav className="md:col-span-1 space-y-1">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                        activeTab === 'profile' 
                            ? 'bg-zinc-900 text-white shadow-md' 
                            : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                >
                    <User className="w-4 h-4" />
                    {t('settings.profile')}
                </button>
                <button
                    onClick={() => setActiveTab('preferences')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                        activeTab === 'preferences' 
                            ? 'bg-zinc-900 text-white shadow-md' 
                            : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                >
                    <Globe className="w-4 h-4" />
                    {t('settings.preferences')}
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                        activeTab === 'security' 
                            ? 'bg-zinc-900 text-white shadow-md' 
                            : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                >
                    <Lock className="w-4 h-4" />
                    {t('settings.security')}
                </button>
            </nav>

            {/* Content Area */}
            <div className="md:col-span-3">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                >
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold mb-1">{t('settings.personalInfo')}</h2>
                                <p className="text-sm text-zinc-500">{t('settings.personalInfoSub')}</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">{t('settings.displayName')}</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                        placeholder="Tu nombre"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">{t('settings.chooseAvatar')}</label>
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        {AVATAR_PRESETS.map((url) => (
                                            <button
                                                key={url}
                                                onClick={() => setAvatarUrl(url)}
                                                className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                                                    avatarUrl === url 
                                                        ? 'border-black dark:border-white scale-110 shadow-md' 
                                                        : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                                                }`}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {t('settings.saveChanges')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold mb-1">{t('settings.regionalPrefs')}</h2>
                                <p className="text-sm text-zinc-500">{t('settings.regionalPrefsSub')}</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">{t('settings.language')}</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setLanguage('es')}
                                            className={`flex-1 px-4 py-2.5 rounded-xl border transition-all ${
                                                language === 'es' 
                                                    ? 'bg-zinc-900 text-white border-zinc-900' 
                                                    : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100'
                                            }`}
                                        >
                                            Español 🇪🇸
                                        </button>
                                        <button
                                            onClick={() => setLanguage('en')}
                                            className={`flex-1 px-4 py-2.5 rounded-xl border transition-all ${
                                                language === 'en' 
                                                    ? 'bg-zinc-900 text-white border-zinc-900' 
                                                    : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100'
                                            }`}
                                        >
                                            English 🇺🇸
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5">{t('settings.mainCurrency')}</label>
                                    <select
                                        value={currency}
                                        onChange={(e) => handleCurrencyChange(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all appearance-none"
                                        disabled={isConverting}
                                    >
                                        {CURRENCIES.map(c => (
                                            <option key={c.code} value={c.code}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                        {t('settings.currencyNote')}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5">
                                        {t('settings.monthlyBudget')}
                                        {isConverting && <span className="ml-2 text-xs text-indigo-500 animate-pulse">{t('settings.converting')}</span>}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">
                                            {CURRENCIES.find(c => c.code === currency)?.symbol}
                                        </span>
                                        <input
                                            type="number"
                                            value={monthlyBudget}
                                            onChange={(e) => setMonthlyBudget(e.target.value)}
                                            className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={handleSavePreferences}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {t('settings.savePrefs')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold mb-1">{t('settings.security')}</h2>
                                <p className="text-sm text-zinc-500">{t('settings.securityMsg')}</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">{t('settings.newPassword')}</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">{t('settings.confirmPassword')}</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={handleUpdatePassword}
                                        disabled={isLoading || !newPassword || !confirmPassword}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {t('settings.updatePassword')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
