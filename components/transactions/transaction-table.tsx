'use client'

import { useState } from 'react'
import { Transaction } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { Trash2, ChevronLeft, ChevronRight, Edit2, ChevronDown } from 'lucide-react'
import { deleteTransaction } from '@/actions/transaction'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { EditTransactionModal } from './edit-transaction-modal'

interface TransactionTableProps {
  transactions: Transaction[]
  totalCount: number
  currentPage: number
  pageSize: number
}

export function TransactionTable({
  transactions,
  totalCount,
  currentPage,
  pageSize
}: TransactionTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  const totalPages = Math.ceil(totalCount / pageSize)

  const handleExportCsv = () => {
    if (!transactions || transactions.length === 0) {
      toast.info('No hay transacciones para exportar')
      return
    }

    const headers = ['Fecha', 'Descripción', 'Categoría', 'Monto']
    const rows = transactions.map((t) => [
      t.date,
      t.description,
      t.category?.name || '',
      t.amount.toString(),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'spendsmart_transacciones.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Exportación opcional generada correctamente')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de querer eliminar este gasto?')) return

    setIsDeleting(id)
    try {
      const result = await deleteTransaction(id)
      if (result.success) {
        toast.success('Gasto eliminado correctamente')
        router.refresh()
      } else {
        toast.error('Error al eliminar: ' + result.error)
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsDeleting(null)
    }
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/5">
        <p className="text-muted-foreground">No se encontraron transacciones.</p>
      </div>
    )
  }

  return (
    <>
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          isOpen={!!editingTransaction}
          onClose={() => {
            setEditingTransaction(null)
            router.refresh()
          }}
        />
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Transacciones</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Exportación de reportes marcada como opcional
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 text-xs font-medium rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            Exportar CSV (Opcional)
          </button>
        </div>

        <div className="hidden md:block overflow-hidden border rounded-lg shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-4 py-3 w-[60px]">Icono</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-right">Fecha</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-center w-[100px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-card">
              {transactions.map((t) => (
                <tr key={`${t.id}-desktop`} className="hover:bg-muted/5 transition-colors">
                  <td className="px-4 py-3 text-2xl text-center">
                    {t.emoji || t.category?.emoji || '📦'}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {t.description}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                      {t.category?.name || 'General'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                    {new Date(t.date).toLocaleString('es-CO', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-center flex justify-center gap-2">
                    <button
                      onClick={() => setEditingTransaction(t)}
                      className="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-md transition-colors"
                      title="Editar gasto"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={isDeleting === t.id}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
                      title="Eliminar gasto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Mobile Expandable Cards --- */}
        <div className="md:hidden space-y-3">
          {transactions.map((t) => (
            <details key={`${t.id}-mobile`} className="group bg-card border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden shadow-sm">
              <summary className="flex items-center justify-between p-4 cursor-pointer select-none text-zinc-900 dark:text-zinc-100">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-2xl flex-shrink-0">{t.emoji || t.category?.emoji || '📦'}</span>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-sm truncate">{t.description}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(t.date).toLocaleString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="font-bold text-sm">{formatCurrency(t.amount)}</span>
                  <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform duration-200" />
                </div>
              </summary>
              <div className="p-4 pt-2 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Categoría</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 w-fit">
                      {t.category?.name || 'General'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingTransaction(t)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={isDeleting === t.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>
              </div>
            </details>
          ))}
        </div>


        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2">
            <p className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, totalCount)} de {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
