import { Dashboard } from "@/components/dashboard";
import { Transaction } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { getBudget } from "@/actions/budget";
import { getUserProgress } from "@/actions/gamification";
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
  const userProgress = await getUserProgress();

  return (
    <main className="min-h-screen p-6 md:p-12 font-[family-name:var(--font-geist-sans)]">
      <Header email={user.email} />

      <Dashboard 
        initialTransactions={transactions} 
        budget={initialBudget} 
        userProgress={userProgress}
      />
    </main>
  );
}
