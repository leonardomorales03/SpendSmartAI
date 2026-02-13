'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App-level error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-4 text-white bg-black">
      <h2 className="text-xl font-bold text-red-500">¡Algo salió mal!</h2>
      <p className="text-zinc-400 font-mono text-sm bg-zinc-900 p-4 rounded max-w-lg overflow-auto">
        {error.message || 'Error desconocido'}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500 transition-colors"
      >
        Intentar de nuevo
      </button>
    </div>
  )
}
