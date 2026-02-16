'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Subscription } from "@/lib/types";

export async function getSubscriptions(): Promise<Subscription[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      `
      *,
      category:categories(id, name, emoji)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("Error fetching subscriptions:", error);
    return [];
  }

  const { data: presets } = await supabase
    .from("subscription_presets")
    .select("name, logo_url");

  const presetLogoMap = new Map<string, string>();
  (presets || []).forEach((preset: { name: string; logo_url: string | null }) => {
    if (preset.logo_url) {
      presetLogoMap.set(preset.name.toLowerCase(), preset.logo_url);
    }
  });

  const enriched = (data as Subscription[]).map((sub) => {
    if (!sub.logo_url) {
      const matchedLogo = presetLogoMap.get(sub.name.toLowerCase());
      if (matchedLogo) {
        return { ...sub, logo_url: matchedLogo };
      }
    }
    return sub;
  });

  return enriched;
}

export async function upsertSubscription(subscription: Partial<Subscription>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Usuario no autenticado" };
  }

  const payload = {
    user_id: user.id,
    name: subscription.name ?? '',
    amount: subscription.amount ?? 0,
    currency: subscription.currency ?? 'COP',
    billing_day: subscription.billing_day ?? 1,
    frequency: subscription.frequency ?? 'monthly',
    category_id: subscription.category_id ?? '',
    is_active: subscription.is_active ?? true,
    logo_url: subscription.logo_url, // Save the logo URL if provided
    id: subscription.id,
  };

  const { error } = await supabase.from("subscriptions").upsert(payload);

  if (error) {
    console.error("Error upserting subscription:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/subscriptions");

  return { success: true };
}

export async function deleteSubscription(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Usuario no autenticado" };
  }

  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/subscriptions");

  return { success: true };
}

export async function registerSubscriptionPayment(subscriptionId: string, date?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Usuario no autenticado" };
  }

  // 1. Fetch Subscription
  const { data: subscription, error: fetchError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !subscription) {
    return { success: false, error: "Suscripción no encontrada" };
  }

  const paymentDate = date ? new Date(date) : new Date();

  // 2. Create Transaction
  const { error: txError } = await supabase.from("transactions").insert({
    user_id: user.id,
    description: subscription.name,
    amount: subscription.amount,
    currency: subscription.currency,
    date: paymentDate.toISOString(),
    category_id: subscription.category_id,
    emoji: "📅" // Optional: add a specific emoji or let UI handle it
  });

  if (txError) {
    return { success: false, error: "Error creando transacción: " + txError.message };
  }

  // 3. Update Last Payment Date
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({ last_payment_date: paymentDate.toISOString() })
    .eq("id", subscriptionId);

  if (updateError) {
     console.error("Error updating last_payment_date:", updateError);
     // We don't fail the whole operation if this fails, but it's not ideal
  }

  revalidatePath("/");
  revalidatePath("/subscriptions");
  revalidatePath("/transactions");

  return { success: true };
}

export async function runMonthlySubscriptions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Usuario no autenticado" };
  }

  const today = new Date();
  const currentDay = today.getDate();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .lte("billing_day", currentDay);

  if (error || !subscriptions) {
    return { success: false, error: "No se pudieron obtener las suscripciones" };
  }

  const dueSubscriptions = subscriptions.filter((sub) => {
    if (!sub.last_payment_date) return true;
    const lastPayment = new Date(sub.last_payment_date as string);
    return lastPayment < monthStart;
  });

  let processed = 0;

  for (const sub of dueSubscriptions) {
    const paymentDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      sub.billing_day || currentDay
    );

    const { error: txError } = await supabase.from("transactions").insert({
      user_id: user.id,
      description: sub.name,
      amount: sub.amount,
      currency: sub.currency,
      date: paymentDate.toISOString(),
      category_id: sub.category_id,
      emoji: "📅",
    });

    if (txError) {
      console.error("Error creando transacción para suscripción:", txError);
      continue;
    }

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({ last_payment_date: paymentDate.toISOString() })
      .eq("id", sub.id);

    if (updateError) {
      console.error("Error actualizando last_payment_date:", updateError);
    }

    processed += 1;
  }

  revalidatePath("/");
  revalidatePath("/subscriptions");
  revalidatePath("/transactions");

  return { success: true, count: processed };
}
