'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type DebtType = 'credit_card' | 'loan' | 'personal' | 'other'
type DebtStatus = 'active' | 'paid' | 'defaulted'

export type Debt = {
  id: string
  user_id: string
  name: string
  type: DebtType
  original_amount: number
  remaining_amount: number
  interest_rate: number | null
  due_date: string | null
  min_monthly_payment: number | null
  status: DebtStatus
  created_at: string
  updated_at: string
}

export type DebtPayment = {
  id: string
  debt_id: string
  user_id: string
  transaction_id: string | null
  amount: number
  date: string
  note: string | null
  created_at: string
}

type CreateDebtInput = {
  name: string
  type?: DebtType
  original_amount: number
  interest_rate?: number
  due_date?: string
  min_monthly_payment?: number
}

type AddDebtPaymentInput = {
  debt_id: string
  amount: number
  date?: string
  note?: string
  transaction_id?: string
}

export async function getDebts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [] as Debt[], error: 'Usuario no autenticado' }
  }

  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching debts:', error)
    return { data: [] as Debt[], error: error.message }
  }

  return { data: data as Debt[], error: null }
}

export async function createDebt(input: CreateDebtInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  const { data, error } = await supabase
    .from('debts')
    .insert({
      user_id: user.id,
      name: input.name,
      type: input.type || 'other',
      original_amount: input.original_amount,
      remaining_amount: input.original_amount,
      interest_rate: input.interest_rate ?? null,
      due_date: input.due_date ?? null,
      min_monthly_payment: input.min_monthly_payment ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating debt:', error)
    return { success: false, error: error.message }
  }

  return { success: true, debt: data as Debt }
}

export async function addDebtPayment(input: AddDebtPaymentInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  const amount = Number(input.amount)
  if (!amount || amount <= 0) {
    return { success: false, error: 'Monto inválido' }
  }

  // 1. Load Debt
  const { data: debt, error: debtError } = await supabase
    .from('debts')
    .select('*')
    .eq('id', input.debt_id)
    .eq('user_id', user.id)
    .single()

  if (debtError || !debt) {
    console.error('Error loading debt:', debtError)
    return { success: false, error: 'Deuda no encontrada' }
  }

  // 2. Find or Create "Deuda" Category
  let categoryId: string | null = null
  const { data: catData } = await supabase
    .from('categories')
    .select('id')
    .ilike('name', 'Deuda')
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .limit(1)
    .single()

  if (catData) {
    categoryId = catData.id
  } else {
    const { data: newCat, error: catError } = await supabase
      .from('categories')
      .insert({
        name: 'Deuda',
        emoji: '💸',
        user_id: user.id
      })
      .select('id')
      .single()

    if (!catError && newCat) {
      categoryId = newCat.id
    }
  }

  // 3. Create Transaction for the payment
  const { data: transaction, error: transError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      amount: amount,
      category_id: categoryId,
      description: `Pago de deuda: ${debt.name}`,
      date: input.date ?? new Date().toISOString()
    })
    .select('id')
    .single()

  if (transError) {
    console.error('Error creating transaction for debt payment:', transError)
    // We continue anyway, but it's a warning
  }

  const transactionId = transaction?.id || null

  // 4. Update Debt remaining amount
  const newRemaining = Number(debt.remaining_amount) - amount
  const nextStatus: DebtStatus = newRemaining <= 0 ? 'paid' : debt.status

  const { error: paymentError } = await supabase
    .from('debt_payments')
    .insert({
      debt_id: input.debt_id,
      user_id: user.id,
      transaction_id: transactionId,
      amount,
      date: input.date ?? new Date().toISOString(),
      note: input.note ?? null,
    })

  if (paymentError) {
    console.error('Error creating debt payment:', paymentError)
    return { success: false, error: paymentError.message }
  }

  const { error: updateError } = await supabase
    .from('debts')
    .update({
      remaining_amount: newRemaining < 0 ? 0 : newRemaining,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.debt_id)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Error updating debt remaining_amount:', updateError)
    return { success: false, error: updateError.message }
  }

  revalidatePath('/')
  revalidatePath('/transactions')

  return { success: true, transactionId }
}

export async function syncDebtPayment(transactionId: string, newAmount: number, newDebtId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // 1. Get current payment
  const { data: payment, error: pError } = await supabase
    .from('debt_payments')
    .select('*')
    .eq('transaction_id', transactionId)
    .single()

  if (pError || !payment) return

  const oldAmount = Number(payment.amount)
  const oldDebtId = payment.debt_id
  const isDebtChange = newDebtId && newDebtId !== oldDebtId

  // 2. Update debt(s) balance
  if (isDebtChange) {
    // Revert OLD debt
    const { data: oldDebt } = await supabase.from('debts').select('*').eq('id', oldDebtId).single()
    if (oldDebt) {
      await supabase.from('debts').update({
        remaining_amount: Number(oldDebt.remaining_amount) + oldAmount,
        status: 'active',
        updated_at: new Date().toISOString()
      }).eq('id', oldDebtId)
    }

    // Apply to NEW debt
    const { data: newDebt } = await supabase.from('debts').select('*').eq('id', newDebtId).single()
    if (newDebt) {
      const remaining = Number(newDebt.remaining_amount) - newAmount
      await supabase.from('debts').update({
        remaining_amount: remaining < 0 ? 0 : remaining,
        status: remaining <= 0 ? 'paid' : 'active',
        updated_at: new Date().toISOString()
      }).eq('id', newDebtId)
    }
  } else {
    // Just amount change on the same debt
    const diff = Number(newAmount) - oldAmount
    const { data: debt } = await supabase.from('debts').select('*').eq('id', oldDebtId).single()
    if (debt) {
      const remaining = Number(debt.remaining_amount) - diff
      await supabase.from('debts').update({
        remaining_amount: remaining < 0 ? 0 : remaining,
        status: remaining <= 0 ? 'paid' : 'active',
        updated_at: new Date().toISOString()
      }).eq('id', oldDebtId)
    }
  }

  // 3. Update payment record
  await supabase
    .from('debt_payments')
    .update({
      amount: newAmount,
      debt_id: newDebtId || oldDebtId
    })
    .eq('id', payment.id)
}

export async function deleteDebtPaymentByTransaction(transactionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // 1. Get the payment to know how much to revert
  const { data: payment, error: pError } = await supabase
    .from('debt_payments')
    .select('*')
    .eq('transaction_id', transactionId)
    .single()

  if (pError || !payment) return

  // 2. Revert debt balance
  const { data: debt, error: dError } = await supabase
    .from('debts')
    .select('*')
    .eq('id', payment.debt_id)
    .single()

  if (!dError && debt) {
    const newRemaining = Number(debt.remaining_amount) + Number(payment.amount)
    const nextStatus = 'active' // Reverting a payment usually makes it active again
    await supabase
      .from('debts')
      .update({
        remaining_amount: newRemaining,
        status: nextStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.debt_id)
  }

  // 3. Delete the payment record
  await supabase
    .from('debt_payments')
    .delete()
    .eq('id', payment.id)
}

