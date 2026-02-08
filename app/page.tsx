import { Dashboard } from "@/components/dashboard";
import { Transaction } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { WisdomBanner } from "@/components/wisdom-banner";

export const dynamic = 'force-dynamic';

async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories(id, name, emoji)
    `)
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
  const transactions = await getTransactions();

  return (
    <main className="min-h-screen p-6 md:p-12 font-[family-name:var(--font-geist-sans)]">
      <header className="max-w-2xl mx-auto mb-8 text-center space-y-2">
        <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-t from-zinc-400 to-white animate-in fade-in slide-in-from-bottom-4 duration-1000">
          SpendSmart AI
        </h1>
        <WisdomBanner />
      </header>

      <Dashboard initialTransactions={transactions} />
    </main>
  );
}
