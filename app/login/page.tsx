'use client'

import { useState } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'register' | 'forgot-password'>('login')

  const getTitle = () => {
    switch (view) {
      case 'login':
        return 'SpendSmart AI'
      case 'register':
        return 'Crear cuenta'
      case 'forgot-password':
        return 'Recuperar contraseña'
    }
  }

  const getDescription = () => {
    switch (view) {
      case 'login':
        return 'Ingresa a tu cuenta para gestionar tus finanzas'
      case 'register':
        return 'Únete a nosotros para empezar a ahorrar de forma inteligente'
      case 'forgot-password':
        return 'Ingresa tu correo y te enviaremos instrucciones'
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">{getTitle()}</h2>
          <p className="mt-2 text-sm text-zinc-400">{getDescription()}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'login' && (
              <LoginForm
                onForgotPassword={() => setView('forgot-password')}
                onRegisterClick={() => setView('register')}
              />
            )}
            {view === 'register' && <RegisterForm onLoginClick={() => setView('login')} />}
            {view === 'forgot-password' && <ForgotPasswordForm onBack={() => setView('login')} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
