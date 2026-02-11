'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface BirthDatePickerProps {
  value?: Date
  onChange: (date: Date) => void
  error?: string
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function BirthDatePicker({ value, onChange, error }: BirthDatePickerProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

  // Estado interno para manejar la selección parcial
  const [day, setDay] = React.useState<number | ''>('')
  const [month, setMonth] = React.useState<number | ''>('')
  const [year, setYear] = React.useState<number | ''>('')

  // Sincronizar con prop value
  React.useEffect(() => {
    if (value) {
      setDay(value.getDate())
      setMonth(value.getMonth())
      setYear(value.getFullYear())
    }
  }, [value])

  // Calcular días en el mes seleccionado (usando estado interno)
  const getDaysInMonth = (y: number | '', m: number | '') => {
    if (y === '' || m === '') return 31
    // new Date(year, month + 1, 0) da el último día del mes
    return new Date(y, m + 1, 0).getDate()
  }

  const daysInMonth = getDaysInMonth(year, month)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const handleChange = (type: 'day' | 'month' | 'year', val: string) => {
    const numVal = val === '' ? '' : Number(val)
    
    let newDay = day
    let newMonth = month
    let newYear = year

    if (type === 'day') newDay = numVal
    if (type === 'month') newMonth = numVal
    if (type === 'year') newYear = numVal

    // Actualizar estado interno inmediatamente para UI
    if (type === 'day') setDay(newDay)
    if (type === 'month') setMonth(newMonth)
    if (type === 'year') setYear(newYear)

    // Si tenemos los tres valores, notificar al padre
    if (newYear !== '' && newMonth !== '' && newDay !== '') {
      // Validar que el día sea válido para el nuevo mes/año
      const maxDays = getDaysInMonth(newYear, newMonth)
      const validDay = Math.min(newDay, maxDays)
      
      // Si el día cambió por la validación, actualizar estado interno también
      if (validDay !== newDay) setDay(validDay)

      const newDate = new Date(newYear, newMonth, validDay)
      onChange(newDate)
    }
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-3 gap-2">
        {/* Día */}
        <select
          value={day}
          onChange={(e) => handleChange('day', e.target.value)}
          className={cn(
            "block w-full rounded-lg border bg-black/50 px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 sm:text-sm transition-colors appearance-none",
            error ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-indigo-500"
          )}
        >
          <option value="" disabled>Día</option>
          {days.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Mes */}
        <select
          value={month}
          onChange={(e) => handleChange('month', e.target.value)}
          className={cn(
            "block w-full rounded-lg border bg-black/50 px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 sm:text-sm transition-colors appearance-none",
            error ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-indigo-500"
          )}
        >
          <option value="" disabled>Mes</option>
          {MONTHS.map((m, index) => (
            <option key={m} value={index}>{m}</option>
          ))}
        </select>

        {/* Año */}
        <select
          value={year}
          onChange={(e) => handleChange('year', e.target.value)}
          className={cn(
            "block w-full rounded-lg border bg-black/50 px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 sm:text-sm transition-colors appearance-none",
            error ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-indigo-500"
          )}
        >
          <option value="" disabled>Año</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      {error && (
        <p className="text-xs text-red-500 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  )
}
