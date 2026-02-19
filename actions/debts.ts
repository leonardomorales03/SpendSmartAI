'use server'

import { createClient } from '@/lib/supabase/server'

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

  const newRemaining = Number(debt.remaining_amount) - amount
  const nextStatus: DebtStatus = newRemaining <= 0 ? 'paid' : debt.status

  const { error: paymentError } = await supabase
    .from('debt_payments')
    .insert({
      debt_id: input.debt_id,
      user_id: user.id,
      transaction_id: input.transaction_id ?? null,
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

  return { success: true }
}

