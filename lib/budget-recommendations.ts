// Recomendaciones de presupuesto adaptadas al contexto colombiano (2024-2025)
// Basado en regla 50/30/20 ajustada por costo de vida local

export type BudgetRecommendation = {
  category: string;
  emoji: string;
  percentage: number;
  amount: number;
  range: string; // Rango flexible sugerido
  description: string;
};

export const STANDARD_INCOME = 5000000;

export const BUDGET_DISTRIBUTION: Omit<BudgetRecommendation, 'amount'>[] = [
  {
    category: 'Vivienda',
    emoji: '🏠',
    percentage: 0.35,
    range: '30% - 40%',
    description: 'Arriendo/Hipoteca, administración y servicios públicos básicos'
  },
  {
    category: 'Alimentación',
    emoji: '🛒',
    percentage: 0.20,
    range: '15% - 25%',
    description: 'Mercado mensual y comidas básicas fuera de casa'
  },
  {
    category: 'Transporte',
    emoji: '🚌',
    percentage: 0.10,
    range: '10% - 15%',
    description: 'Transporte público, gasolina, mantenimiento o apps de movilidad'
  },
  {
    category: 'Ahorro e Inversión',
    emoji: '💰',
    percentage: 0.15,
    range: '10% - 20%',
    description: 'Fondo de emergencia, CDTs, pensiones voluntarias'
  },
  {
    category: 'Deudas',
    emoji: '💳',
    percentage: 0.10,
    range: '0% - 20%',
    description: 'Cuotas de tarjetas de crédito o créditos de consumo'
  },
  {
    category: 'Entretenimiento y Ocio',
    emoji: '🎉',
    percentage: 0.05,
    range: '5% - 10%',
    description: 'Salidas, cine, hobbies y streaming'
  },
  {
    category: 'Salud y Bienestar',
    emoji: '💊',
    percentage: 0.05,
    range: '3% - 7%',
    description: 'Copagos, medicamentos no cubiertos y cuidado personal'
  }
];

export function calculateBudgetRecommendations(income: number = STANDARD_INCOME): BudgetRecommendation[] {
  return BUDGET_DISTRIBUTION.map(item => ({
    ...item,
    amount: Math.round(income * item.percentage)
  }));
}
