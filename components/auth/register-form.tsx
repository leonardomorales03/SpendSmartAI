'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, Check, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { registerSchema, type RegisterInput, allowedDomains } from '@/lib/auth-schemas'
import { signup } from '@/app/login/actions'
import { PasswordStrength } from './password-strength'
import { BirthDatePicker } from './birth-date-picker'
import { TermsModal } from './terms-modal'
import { cn } from '@/lib/utils'

interface RegisterFormProps {
  onLoginClick: () => void
}

type RegistrationStatus = 'idle' | 'loading' | 'success' | 'error'

export function RegisterForm({ onLoginClick }: RegisterFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<RegistrationStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPasswordStrong, setIsPasswordStrong] = useState(false)
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const [redirectCount, setRedirectCount] = useState(5)

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  })

  const password = watch('password')
  const confirmPassword = watch('confirmPassword')
  const email = watch('email')
  const termsAccepted = watch('termsAccepted')

  // Validar email en tiempo real para dominios
  const [emailDomainError, setEmailDomainError] = useState<string | null>(null)

  useEffect(() => {
    if (email && email.includes('@')) {
      const domain = email.split('@')[1]
      if (domain && !allowedDomains.includes(domain)) {
        setEmailDomainError(`Dominio no permitido. Usa: ${allowedDomains.slice(0, 3).join(', ')}...`)
      } else {
        setEmailDomainError(null)
      }
    } else {
      setEmailDomainError(null)
    }
  }, [email])

  // Timer para redirección
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (status === 'success' && redirectCount > 0) {
      timer = setTimeout(() => {
        setRedirectCount((prev) => prev - 1)
      }, 1000)
    } else if (status === 'success' && redirectCount === 0) {
      onLoginClick() // Cambiar a vista de login o redirigir
    }
    return () => clearTimeout(timer)
  }, [status, redirectCount, onLoginClick])

  const onSubmit = async (data: RegisterInput) => {
    if (!isPasswordStrong) {
      toast.error('La contraseña no es lo suficientemente segura')
      return
    }

    setStatus('loading')
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const formData = new FormData()
      formData.append('email', data.email)
      formData.append('password', data.password)
      formData.append('fullName', data.fullName)
      formData.append('phone', data.phone || '')
      formData.append('birthDate', data.birthDate.toISOString())
      formData.append('termsVersion', '1.0')
      formData.append('termsAcceptedAt', new Date().toISOString())

      const result = await signup(formData)
      
      if (result?.error) {
        setStatus('error')
        const errorLower = result.error.toLowerCase()
        
        // Mapeo de errores comunes de Supabase
        if (errorLower.includes('already registered') || result.code === '409') {
          setErrorMessage('Este correo electrónico ya está registrado. Por favor intenta iniciar sesión.')
        } else if (result.code === '429' || errorLower.includes('rate limit')) {
          setErrorMessage('Demasiados intentos de registro. Por seguridad, espera unos minutos antes de volver a intentar con este correo.')
        } else {
          setErrorMessage(result.error || 'Error al procesar el registro. Por favor intenta nuevamente.')
        }
      } else if (result?.success) {
        setStatus('success')
        // Si hay redirección inmediata, usarla
        if (result.redirect) {
            router.push(result.redirect)
        }
        setSuccessMessage(result.message || 'Registro exitoso.')
      }
    } catch (error) {
      setStatus('error')
      setErrorMessage('Ocurrió un error inesperado de conexión. Verifica tu internet.')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="rounded-full bg-green-500/20 p-4">
          <Check className="h-12 w-12 text-green-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">¡Registro Exitoso!</h3>
          <p className="text-zinc-400 max-w-xs mx-auto">
            {successMessage}
          </p>
        </div>
        
        <div className="text-sm text-zinc-500">
          Redirigiendo al inicio de sesión en <span className="text-white font-mono font-bold">{redirectCount}</span> segundos...
        </div>

        <button
          onClick={onLoginClick}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Ir al Inicio de Sesión ahora
        </button>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Mensaje de Error Global */}
        {status === 'error' && errorMessage && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm text-red-400">
              <p className="font-medium text-red-300">Error de Registro</p>
              {errorMessage}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-zinc-300">
              Nombre completo
            </label>
            <input
              {...register('fullName')}
              id="fullName"
              type="text"
              placeholder="Juan Pérez"
              className={cn(
                "mt-1 block w-full rounded-lg border bg-black/50 px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 sm:text-sm transition-colors",
                errors.fullName 
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" 
                  : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500"
              )}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-500 animate-in fade-in slide-in-from-top-1">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
              Correo electrónico
            </label>
            <div className="relative">
              <input
                {...register('email')}
                id="email"
                type="email"
                placeholder="usuario@gmail.com"
                className={cn(
                  "mt-1 block w-full rounded-lg border bg-black/50 px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 sm:text-sm transition-colors",
                  errors.email || emailDomainError
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" 
                    : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500"
                )}
              />
            </div>
            {(errors.email || emailDomainError) && (
              <p className="mt-1 text-xs text-red-500 animate-in fade-in slide-in-from-top-1">
                {errors.email?.message || emailDomainError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-zinc-300">
                Teléfono (opcional)
              </label>
              <input
                {...register('phone')}
                id="phone"
                type="tel"
                placeholder="+57 300..."
                className="mt-1 block w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="relative">
              <label htmlFor="birthDate" className="block text-sm font-medium text-zinc-300">
                Fecha de nacimiento
              </label>
              <Controller
                control={control}
                name="birthDate"
                render={({ field }) => (
                  <BirthDatePicker
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.birthDate?.message}
                  />
                )}
              />
            </div>
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
                className={cn(
                  "block w-full rounded-lg border bg-black/50 px-3 py-2 pr-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 sm:text-sm transition-colors",
                  errors.password 
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" 
                    : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            <div className="mt-2">
              <PasswordStrength 
                password={password} 
                onStrengthChange={setIsPasswordStrong} 
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300">
              Confirmar Contraseña
            </label>
            <div className="relative mt-1">
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className={cn(
                  "block w-full rounded-lg border bg-black/50 px-3 py-2 pr-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 sm:text-sm transition-colors",
                  errors.confirmPassword
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500"
                    : confirmPassword && confirmPassword === password
                      ? "border-green-500/50 focus:border-green-500 focus:ring-green-500"
                      : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500"
                )}
              />
              {confirmPassword && confirmPassword.length >= 3 && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {confirmPassword === password ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {confirmPassword && confirmPassword !== password && (
               <p className="mt-1 text-xs text-red-500 animate-in fade-in slide-in-from-top-1">
                 Las contraseñas no coinciden
               </p>
            )}
          </div>

          <div className="flex items-center">
            <input
              {...register('termsAccepted')}
              id="terms"
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-zinc-400">
              Acepto los{' '}
              <button
                type="button"
                onClick={() => setIsTermsOpen(true)}
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
              >
                términos y condiciones
              </button>
            </label>
          </div>
          {errors.termsAccepted && (
            <p className="text-xs text-red-500 animate-in fade-in slide-in-from-top-1">
              {errors.termsAccepted.message}
            </p>
          )}
        </div>

        <button
        type="submit"
        disabled={status === 'loading' || !isPasswordStrong}
        className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
        Registrarse
      </button>

        <div className="text-center text-sm text-zinc-400">
          ¿Ya tienes una cuenta?{' '}
          <button
            type="button"
            onClick={onLoginClick}
            className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Inicia sesión aquí
          </button>
        </div>
      </form>

      <TermsModal 
        open={isTermsOpen} 
        onOpenChange={setIsTermsOpen} 
      />
    </>
  )
}
