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

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border rounded-lg shadow-sm">
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Desde:</label>
          <input
            type="datetime-local"
            className="px-2 py-1.5 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchParams.get('startDate') || ''}
            onChange={(e) => router.push(`?${createQueryString('startDate', e.target.value)}`)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hasta:</label>
          <input
            type="datetime-local"
            className="px-2 py-1.5 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchParams.get('endDate') || ''}
            onChange={(e) => router.push(`?${createQueryString('endDate', e.target.value)}`)}
          />
        </div>

        {(searchParams.get('search') || searchParams.get('startDate') || searchParams.get('endDate')) && (
          <button
            onClick={() => {
              setSearchValue('')
              router.push(window.location.pathname)
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* 
        TODO: Add Category Filter dropdown here 
        Need to fetch categories first, for now keeping it simple with search
      */}
    </div>
  )
}
