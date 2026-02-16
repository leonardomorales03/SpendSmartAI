import { createClient } from "@/lib/supabase/server";
import { getSubscriptions } from "@/actions/subscriptions";
import { getCategories } from "@/actions/categories";
import { getSubscriptionPresets } from "@/actions/subscription-presets";
import { redirect } from "next/navigation";
import { SubscriptionsClient } from "@/components/subscriptions/subscriptions-client";
import { Header } from "@/components/header";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const subscriptions = await getSubscriptions();
  const categories = await getCategories();
  const presets = await getSubscriptionPresets();

  return (
    <main className="min-h-screen p-6 md:p-12 font-[family-name:var(--font-geist-sans)]">
      <Header email={user.email} />
      
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Suscripciones</h1>
            <p className="text-zinc-500 mt-2">Administra tus gastos recurrentes y recibe recordatorios.</p>
        </div>

        <SubscriptionsClient 
            initialSubscriptions={subscriptions} 
            categories={categories}
            presets={presets}
        />
      </div>
    </main>
  );
}
