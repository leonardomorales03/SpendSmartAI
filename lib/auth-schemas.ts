import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>

export const allowedDomains = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'yahoo.es',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'protonmail.com',
  'tutanota.com',
  'zoho.com',
  'fastmail.com',
  'gmx.com',
  'mail.com',
]

export const registerSchema = z
  .object({
    fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    email: z
      .string()
      .email('Ingresa un correo electrónico válido')
      .refine((email) => {
        const domain = email.split('@')[1]
        return allowedDomains.includes(domain)
      }, 'El dominio del correo no está permitido (usa Gmail, Outlook, Yahoo, etc.)'),
    phone: z.string().optional(),
    birthDate: z.date({
      message: 'La fecha de nacimiento es requerida',
    }).refine((date) => {
      const today = new Date()
      const age = today.getFullYear() - date.getFullYear()
      const m = today.getMonth() - date.getMonth()
      const actualAge = (m < 0 || (m === 0 && today.getDate() < date.getDate())) ? age - 1 : age
      return actualAge >= 18
    }, 'Debes tener al menos 18 años para registrarte'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número')
      .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial')
      .refine(
        (val) => !/(123456|password|qwerty)/i.test(val),
        'La contraseña contiene patrones demasiado comunes'
      ),
    confirmPassword: z.string().min(1, 'Debes confirmar tu contraseña'),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'Debes aceptar los términos y condiciones',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
