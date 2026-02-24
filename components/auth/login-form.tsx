'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { loginSchema, type LoginInput } from '@/lib/auth-schemas'
import { login } from '@/app/login/actions'

interface LoginFormProps {
  onForgotPassword: () => void
  onRegisterClick: () => void
}

export function LoginForm({ onForgotPassword, onRegisterClick }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('email', data.email)
      formData.append('password', data.password)
      if (data.rememberMe) {
        formData.append('rememberMe', 'true')
      }

      const result = await login(formData)
      if (result?.error) {
        toast.error(result.error)
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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
            Contraseña
          </label>
          <div className="relative mt-1">
            <input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="block w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 pr-10 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500 animate-in fade-in slide-in-from-top-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              {...register('rememberMe')}
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-400">
              Recordarme
            </label>
          </div>

          <div className="text-sm">
            <button
              type="button"
              onClick={onForgotPassword}
              className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
        Iniciar Sesión
      </button>

      <div className="text-center text-sm text-zinc-400">
        ¿No tienes una cuenta?{' '}
        <button
          type="button"
          onClick={onRegisterClick}
          className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Regístrate aquí
        </button>
      </div>
    </form>
  )
}
