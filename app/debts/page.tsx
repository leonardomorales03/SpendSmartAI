import { createClient } from "@/lib/supabase/server"
import { getDebts } from "@/actions/debts"
import { DebtsList } from "@/components/debts-list"
import { Header } from "@/components/header"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function DebtsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: debts } = await getDebts()

  return (
    <main className="min-h-screen p-6 md:p-12 font-[family-name:var(--font-geist-sans)]">
      <Header email={user.email} />
      <div className="mt-6">
        <DebtsList initialDebts={debts || []} />
      </div>
    </main>
  )
}
