'use client'

import { createContext, useContext, ReactNode, useState } from 'react'
import { UserSettings, UserProfile } from '@/actions/settings'
import es from '@/dictionaries/es.json'
import en from '@/dictionaries/en.json'

const dictionaries = { es, en }

type SettingsContextType = {
    settings: UserSettings | null
    profile: UserProfile | null
    formatCurrency: (amount: number) => string
    t: (key: string) => string
    language: 'es' | 'en'
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

import { OnboardingModal } from '@/components/onboarding-modal'

export function SettingsProvider({ 
    children, 
    initialSettings,
    initialProfile
}: { 
    children: ReactNode
    initialSettings: UserSettings | null 
    initialProfile: UserProfile | null
}) {
    const language = (initialSettings?.language as 'es' | 'en') || 'es'
    const dict = dictionaries[language] || dictionaries.es
    const [showOnboarding, setShowOnboarding] = useState(
        () => Boolean(initialSettings && !initialSettings.has_completed_onboarding)
    )

    const t = (key: string): string => {
        const keys = key.split('.')
        let current: unknown = dict
        for (const k of keys) {
            if (typeof current !== 'object' || current === null || !(k in (current as Record<string, unknown>))) {
                return key
            }
            current = (current as Record<string, unknown>)[k]
        }
        return typeof current === 'string' ? current : key
    }

    const formatCurrency = (amount: number) => {
        const currency = initialSettings?.currency || 'COP'
        const locale = initialSettings?.locale || 'es-CO'
        
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: currency === 'COP' ? 0 : 2,
            maximumFractionDigits: currency === 'COP' ? 0 : 2,
        }).format(amount)
    }

    return (
        <SettingsContext.Provider value={{ 
            settings: initialSettings, 
            profile: initialProfile,
            formatCurrency, 
            t, 
            language 
        }}>
            {children}
            <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider')
    }
    return context
}
