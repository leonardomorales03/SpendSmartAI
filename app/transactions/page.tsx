import { Suspense } from 'react'
import { getTransactions } from '@/actions/transaction'
import { TransactionTable } from '@/components/transactions/transaction-table'
import { TransactionFilters } from '@/components/transactions/transaction-filters'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const search = resolvedSearchParams.search || ''
  const categoryId = resolvedSearchParams.categoryId || 'all'
  const startDate = resolvedSearchParams.startDate
  const endDate = resolvedSearchParams.endDate

  const { data: transactions, count, error } = await getTransactions(page, 10, {
    category_id: categoryId,
    search,
    startDate,
    endDate,
  })

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial de Transacciones</h1>
          <p className="text-muted-foreground mt-1">
            Visualiza y gestiona todos tus gastos registrados.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Suspense fallback={<div>Cargando filtros...</div>}>
          <TransactionFilters />
        </Suspense>

        <Suspense fallback={<div className="h-64 flex items-center justify-center border rounded-lg bg-muted/10">Cargando transacciones...</div>}>
          <TransactionTable 
            transactions={transactions || []} 
            totalCount={count || 0}
            currentPage={page}
            pageSize={10}
          />
        </Suspense>
      </div>
    </div>
  )
}
