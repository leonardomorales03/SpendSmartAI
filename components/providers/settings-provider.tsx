'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { UserSettings, UserProfile } from '@/actions/settings'
import es from '@/dictionaries/es.json'
import en from '@/dictionaries/en.json'

const dictionaries = { es, en }

type SettingsContextType = {
    settings: UserSettings | null
    profile: UserProfile | null
    formatCurrency: (amount: number) => string
    t: (key: string) => any
    language: 'es' | 'en'
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

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

    const t = (key: string) => {
        const keys = key.split('.')
        let current: any = dict
        for (const k of keys) {
            if (current[k] === undefined) return key
            current = current[k]
        }
        return current
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
