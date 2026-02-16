import { FinancialChat } from "@/components/chat/financial-chat"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <main className="min-h-screen p-6 md:p-12 font-[family-name:var(--font-geist-sans)] bg-background">
            <header className="max-w-2xl mx-auto mb-8 text-center space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                    Chat Financiero Contextual
                </h1>
                <p className="text-muted-foreground">
                    Pregunta sobre tus gastos, presupuesto y tendencias usando lenguaje natural.
                </p>
                <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mt-4">
                    <Link href="/" className="hover:text-primary transition-colors">← Volver al Dashboard</Link>
                </div>
            </header>

            <div className="max-w-4xl mx-auto flex justify-center">
                <FinancialChat />
            </div>
        </main>
    )
}
