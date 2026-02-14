import { getBudgetProgress } from '@/actions/budget'
import { BudgetSummary } from '@/components/budget/budget-summary'
import { CategoryBudgetList } from '@/components/budget/category-budget-list'
import { BudgetAlerts } from '@/components/budget/budget-alerts'
import { AIBudgetInsights } from '@/components/budget/ai-budget-insights'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function BudgetPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const budgetData = await getBudgetProgress()

    if (!budgetData) {
        return (
            <div className="min-h-screen bg-black text-white p-8">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-zinc-500">No se pudo cargar la información del presupuesto.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 pb-32">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Mi Presupuesto</h1>
                    <p className="text-zinc-400">Administra tus límites de gasto mensual y por categoría.</p>
                </div>

                <BudgetAlerts warnings={budgetData.warnings} />

                <BudgetSummary 
                    budget={budgetData.global.budget} 
                    spent={budgetData.global.spent} 
                    percentage={budgetData.global.percentage} 
                />

                <AIBudgetInsights categories={budgetData.categories} />

                <div>
                    <h2 className="text-lg font-semibold mb-4">Presupuestos por Categoría</h2>
                    <CategoryBudgetList categories={budgetData.categories} />
                </div>
            </div>
        </div>
    )
}
