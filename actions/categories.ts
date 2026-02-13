'use server'

import { createClient } from '@/lib/supabase/server'
import { Category } from '@/lib/types'
import { revalidatePath } from 'next/cache'

export async function getCategories() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Obtenemos categorías globales (donde user_id es NULL) y las del usuario
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return (data || []) as Category[]
}

export async function createCategory(category: Omit<Category, 'id'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Usuario no autenticado' }

  const { error } = await supabase
    .from('categories')
    .insert([{
      name: category.name,
      emoji: category.emoji,
      user_id: user.id
    }])

  if (error) {
    console.error('Error creating category:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/categories')
  revalidatePath('/transactions')
  revalidatePath('/')
  return { success: true }
}

export async function updateCategory(id: string, updates: Partial<Category>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Usuario no autenticado' }

  // Solo permitimos editar categorías que pertenecen al usuario
  const { error } = await supabase
    .from('categories')
    .update({
      name: updates.name,
      emoji: updates.emoji
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating category:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/categories')
  revalidatePath('/transactions')
  revalidatePath('/')
  return { success: true }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Usuario no autenticado' }

  // Verificar si hay transacciones usando esta categoría
  const { count } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)

  if (count && count > 0) {
    return { success: false, error: 'No se puede eliminar una categoría que tiene gastos asociados.' }
  }

  // Solo eliminar categorías del usuario
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting category:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/categories')
  revalidatePath('/transactions')
  revalidatePath('/')
  return { success: true }
}
