import { Dashboard } from "@/components/dashboard";
import { Transaction } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { WisdomBanner } from "@/components/wisdom-banner";
import { getBudget } from "@/actions/budget";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

async function getTransactions(): Promise<Transaction[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories(id, name, emoji)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  // Mapeamos para que la UI los entienda (emoji del category)
  return (data || []).map(t => ({
    ...t,
    emoji: t.category?.emoji || '📦'
  }));
}

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const transactions = await getTransactions();
  const initialBudget = await getBudget();

  return (
    <main className="min-h-screen p-6 md:p-12 font-[family-name:var(--font-geist-sans)]">
      <header className="max-w-2xl mx-auto mb-8 text-center space-y-2">
        <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-t from-zinc-400 to-white animate-in fade-in slide-in-from-bottom-4 duration-1000">
          SpendSmart AI
        </h1>
        <div className="flex flex-col items-center justify-center gap-2">
          <WisdomBanner />
    <div className="flex items-center gap-3 text-xs text-zinc-500">
      <span>{user.email}</span>
      <span className="text-zinc-700">|</span>
      <a href="/transactions" className="hover:text-white transition-colors">
        Historial
      </a>
      <span className="text-zinc-700">|</span>
      <a href="/budget" className="hover:text-white transition-colors">
        Presupuesto
      </a>
      <span className="text-zinc-700">|</span>
      <a href="/categories" className="hover:text-white transition-colors">
        Categorías
      </a>
      <span className="text-zinc-700">|</span>
      <form action="/auth/signout" method="post">
          <button className="hover:text-white transition-colors" type="submit">
            Cerrar Sesión
          </button>
      </form>
    </div>
        </div>
      </header>

      <Dashboard initialTransactions={transactions} budget={initialBudget} />
    </main>
  );
}
