'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  password?: string
  onStrengthChange: (isStrong: boolean) => void
}

export function PasswordStrength({ password = '', onStrengthChange }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0)
  const [feedback, setFeedback] = useState<string>('')

  useEffect(() => {
    let score = 0
    let message = ''

    if (!password) {
      setStrength(0)
      setFeedback('')
      onStrengthChange(false)
      return
    }

    // Criterios
    const hasLength = password.length >= 8
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[^A-Za-z0-9]/.test(password)
    const hasCommonPatterns = /(123456|password|qwerty)/i.test(password)

    if (hasLength) score += 1
    if (hasUpper) score += 1
    if (hasLower) score += 1
    if (hasNumber) score += 1
    if (hasSpecial) score += 1
    if (hasCommonPatterns) score -= 2

    // Verificar cumplimiento estricto de requisitos mínimos para habilitar
    const meetsRequirements = hasLength && hasUpper && hasLower && hasNumber && hasSpecial && !hasCommonPatterns
    
    // Normalizar score entre 0 y 4
    let finalScore = 0
    
    if (score < 2) finalScore = 0 // Débil
    else if (score < 4) finalScore = 1 // Media
    else if (score < 5) finalScore = 2 // Fuerte
    else finalScore = 3 // Muy Fuerte

    setStrength(finalScore)

    // Determinar mensaje y color
    let newMessage = ''
    switch (finalScore) {
      case 0:
        newMessage = 'Débil - Agrega más variedad de caracteres'
        break
      case 1:
        newMessage = 'Media - Vas por buen camino'
        break
      case 2:
        newMessage = 'Fuerte - Buena contraseña'
        break
      case 3:
        newMessage = 'Muy Fuerte - Excelente seguridad'
        break
    }
    
    // Feedback específico de qué falta
    if (!meetsRequirements) {
        if (!hasLength) newMessage = 'Mínimo 8 caracteres'
        else if (!hasUpper) newMessage = 'Falta mayúscula'
        else if (!hasLower) newMessage = 'Falta minúscula'
        else if (!hasNumber) newMessage = 'Falta número'
        else if (!hasSpecial) newMessage = 'Falta carácter especial'
    }

    // Si tiene patrones comunes, anular todo
    if (hasCommonPatterns) {
      setStrength(0)
      newMessage = 'Insegura - Evita patrones comunes como "123456" o "password"'
      onStrengthChange(false)
    } else {
      // Solo aprobar si cumple TODOS los requisitos estrictos, independientemente del score visual
      onStrengthChange(meetsRequirements)
    }

    setFeedback(newMessage)
  }, [password, onStrengthChange])

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
