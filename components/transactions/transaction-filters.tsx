'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Search } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'

export function TransactionFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      // Reset page when filter changes
      params.set('page', '1')
      return params.toString()
    },
    [searchParams]
  )

  const handleSearch = useDebouncedCallback((term: string) => {
    router.push(`?${createQueryString('search', term)}`)
  }, 300)

  const applyDateRange = (start?: Date, end?: Date) => {
    const params = new URLSearchParams(searchParams.toString())

    if (start) {
      const iso = start.toISOString().split('T')[0]
      params.set('startDate', iso)
    } else {
      params.delete('startDate')
    }

    if (end) {
      const iso = end.toISOString().split('T')[0]
      params.set('endDate', iso)
    } else {
      params.delete('endDate')
    }

    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const handleQuickFilter = (type: 'today' | 'yesterday' | 'this_week' | 'this_month') => {
    const now = new Date()

    if (type === 'today') {
      const start = new Date(now)
      const end = new Date(now)
      applyDateRange(start, end)
      return
    }

    if (type === 'yesterday') {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      applyDateRange(yesterday, yesterday)
      return
    }

    if (type === 'this_week') {
      const start = new Date(now)
      const day = start.getDay()
      const diff = day === 0 ? 6 : day - 1
      start.setDate(start.getDate() - diff)
      const end = new Date(now)
      applyDateRange(start, end)
      return
    }

    if (type === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now)
      applyDateRange(start, end)
      return
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-card border rounded-lg shadow-sm">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar gastos (ej: Pizza, Netflix)..."
          className="w-full pl-9 pr-4 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value)
            handleSearch(e.target.value)
          }}
        />
      </div>
      
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground mr-1">Rango rápido:</span>
        <button
          type="button"
          onClick={() => handleQuickFilter('today')}
          className="px-3 py-1 rounded-full border border-border text-xs hover:bg-muted transition-colors"
        >
          Hoy
        </button>
        <button
          type="button"
          onClick={() => handleQuickFilter('yesterday')}
          className="px-3 py-1 rounded-full border border-border text-xs hover:bg-muted transition-colors"
        >
          Ayer
        </button>
        <button
          type="button"
          onClick={() => handleQuickFilter('this_week')}
          className="px-3 py-1 rounded-full border border-border text-xs hover:bg-muted transition-colors"
        >
          Esta semana
        </button>
        <button
          type="button"
          onClick={() => handleQuickFilter('this_month')}
          className="px-3 py-1 rounded-full border border-border text-xs hover:bg-muted transition-colors"
        >
          Este mes
        </button>
      </div>
    </div>
  )
}
