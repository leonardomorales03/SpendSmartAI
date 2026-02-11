'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const credentials = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('fullName'),
        phone: formData.get('phone'),
        birth_date: formData.get('birthDate'),
        terms_version: formData.get('termsVersion'),
        terms_accepted_at: formData.get('termsAcceptedAt'),
      },
    },
  }

  const { data, error } = await supabase.auth.signUp(credentials)

  if (error) {
    console.error('Signup error:', error)
    return { error: error.message, code: error.code }
  }

  if (data.user && !data.session) {
    return { success: true, message: 'Registro exitoso. Por favor revisa tu correo electrónico para validar tu cuenta' }
  }

  // Si hay sesión, el usuario está logueado automáticamente
  return { success: true, redirect: '/', message: 'Registro exitoso. Ingresando...' }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña' }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden' }
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
