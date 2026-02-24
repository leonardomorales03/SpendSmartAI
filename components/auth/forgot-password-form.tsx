'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/auth-schemas'
import { resetPassword } from '@/app/login/actions'

interface ForgotPasswordFormProps {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('email', data.email)

      const result = await resetPassword(formData)
      if (result?.error) {
        toast.error(result.error)
      } else if (result?.message) {
        toast.success(result.message)
        onBack()
      }
    } catch {
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
            Correo electrónico
          </label>
          <input
            {...register('email')}
            id="email"
            type="email"
            placeholder="usuario@dominio.com"
            className="mt-1 block w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500 animate-in fade-in slide-in-from-top-1">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
        Enviar instrucciones
      </button>

      <button
        type="button"
        onClick={onBack}
        className="flex w-full items-center justify-center text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al inicio de sesión
      </button>
    </form>
  )
}
