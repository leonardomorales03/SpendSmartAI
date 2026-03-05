export type PricingPlan = {
    id: 'free' | 'pro_monthly' | 'pro_yearly'
    name: string
    price: number
    currency: string
    features: string[]
    description?: string
    cta?: string
    popular?: boolean
}

export const PLANS: PricingPlan[] = [
    {
        id: 'free',
        name: 'Gratis',
        price: 0,
        currency: 'COP',
        description: 'Para empezar a organizar tus finanzas',
        features: [
            'Registro manual ilimitado',
            'Categorías básicas',
            '5 consultas de IA al día',
            '1 billetera'
        ],
        cta: 'Tu plan actual',
        popular: false
    },
    {
        id: 'pro_monthly',
        name: 'Pro Mensual',
        price: 15000,
        currency: 'COP',
        description: 'Potencia tus finanzas con IA ilimitada',
        features: [
            'Todo lo del plan Gratis',
            'IA Ilimitada (Voz, Texto, Imágenes)',
            'Múltiples billeteras y monedas',
            'Reportes avanzados y exportación',
            'Gestión de deudas',
            'Soporte prioritario'
        ],
        cta: 'Mejorar a Pro',
        popular: true
    }
]
