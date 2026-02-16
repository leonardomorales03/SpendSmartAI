'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  password?: string
  onStrengthChange: (isStrong: boolean) => void
}

export function PasswordStrength({ password = '', onStrengthChange }: PasswordStrengthProps) {
  const hasLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const hasCommonPatterns = /(123456|password|qwerty)/i.test(password)

  let score = 0
  if (hasLength) score += 1
  if (hasUpper) score += 1
  if (hasLower) score += 1
  if (hasNumber) score += 1
  if (hasSpecial) score += 1
  if (hasCommonPatterns) score -= 2

  const meetsRequirements =
    hasLength && hasUpper && hasLower && hasNumber && hasSpecial && !hasCommonPatterns

  let strength = 0
  if (score < 2) strength = 0
  else if (score < 4) strength = 1
  else if (score < 5) strength = 2
  else strength = 3

  let feedback = ''
  switch (strength) {
    case 0:
      feedback = 'Débil - Agrega más variedad de caracteres'
      break
    case 1:
      feedback = 'Media - Vas por buen camino'
      break
    case 2:
      feedback = 'Fuerte - Buena contraseña'
      break
    case 3:
      feedback = 'Muy Fuerte - Excelente seguridad'
      break
  }

  if (!meetsRequirements) {
    if (!hasLength) feedback = 'Mínimo 8 caracteres'
    else if (!hasUpper) feedback = 'Falta mayúscula'
    else if (!hasLower) feedback = 'Falta minúscula'
    else if (!hasNumber) feedback = 'Falta número'
    else if (!hasSpecial) feedback = 'Falta carácter especial'
  }

  if (hasCommonPatterns) {
    strength = 0
    feedback = 'Insegura - Evita patrones comunes como "123456" o "password"'
  }

  useEffect(() => {
    onStrengthChange(meetsRequirements && !hasCommonPatterns)
  }, [meetsRequirements, hasCommonPatterns, onStrengthChange])

  const getColor = (index: number) => {
    if (strength === 0) return 'bg-red-500'
    if (strength === 1) return 'bg-yellow-500'
    if (strength === 2) return 'bg-green-500'
    if (strength === 3) return 'bg-emerald-500'
    return 'bg-zinc-800'
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 h-1.5 w-full">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            initial={{ width: '0%' }}
            animate={{ 
              width: '25%',
              backgroundColor: index <= strength ? undefined : '#27272a' // zinc-800
            }}
            className={cn(
              "h-full rounded-full transition-colors duration-300",
              index <= strength ? getColor(index) : "bg-zinc-800"
            )}
          />
        ))}
      </div>
      <p className={cn(
        "text-xs text-right transition-colors duration-300",
        strength <= 1 ? "text-red-400" :
        strength === 2 ? "text-yellow-400" :
        strength === 3 ? "text-green-400" : "text-emerald-400"
      )}>
        {feedback}
      </p>
    </div>
  )
}
