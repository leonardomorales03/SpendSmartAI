'use client'

import { useState } from 'react'
import { Transaction } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { Trash2, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react'
import { deleteTransaction } from '@/actions/transaction'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { EditTransactionModal } from './edit-transaction-modal'

interface TransactionTableProps {
  transactions: any[] // Using any for now to include the joined category
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
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null)

  const totalPages = Math.ceil(totalCount / pageSize)

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
        <div className="overflow-hidden border rounded-lg shadow-sm">
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
                <tr key={t.id} className="hover:bg-muted/5 transition-colors">
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
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {new Date(t.date).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'short',
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
