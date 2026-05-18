'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionList } from './transaction-list'
import { StatementReportDialog } from './statement-report-dialog'
import { FinancialFilters } from './financial-filters'
import { TransactionDetailsDialog, type TransactionDetail } from './transaction-details-dialog'

const ITEMS_PER_PAGE = 30

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  date: string
  source: 'appointment' | 'manual'
  paymentMethodName: string | null
  isCogs: boolean
  stockMovementId: string | null
}

interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
}

export function TransactionSection({ transactions, categories }: { transactions: Transaction[]; categories: Category[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetail | null>(null)

  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions
    const term = searchTerm.toLowerCase()
    return transactions.filter((t) => t.description.toLowerCase().includes(term))
  }, [transactions, searchTerm])

  const filteredSummary = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = filteredTransactions
      .filter((t) => t.type === 'expense' && !t.isCogs)
      .reduce((sum, t) => sum + t.amount, 0)
    const cogs = filteredTransactions
      .filter((t) => t.type === 'expense' && t.isCogs)
      .reduce((sum, t) => sum + t.amount, 0)
    return { totalIncome, expenses, cogs, netProfit: totalIncome - expenses - cogs }
  }, [filteredTransactions])

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  return (
    <>
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(filteredSummary.totalIncome)}
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(filteredSummary.expenses)}
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo de Produtos</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Package className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(filteredSummary.cogs)}
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold ${filteredSummary.netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(filteredSummary.netProfit)}
            </div>
          </CardContent>
        </Card>
      </div>

      <FinancialFilters categories={categories} />

      {/* Search + Report */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <StatementReportDialog transactions={filteredTransactions} summary={filteredSummary} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Extrato Mensal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TransactionList
            transactions={paginatedTransactions}
            onSelect={(t) => setSelectedTransaction(t)}
          />

          {filteredTransactions.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1}–{Math.min(endIndex, filteredTransactions.length)} de{' '}
                {filteredTransactions.length} registros
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={safeCurrentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm font-medium">
                  Página {safeCurrentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={safeCurrentPage >= totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionDetailsDialog
        transaction={selectedTransaction}
        open={selectedTransaction !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTransaction(null)
        }}
        categories={categories}
      />
    </>
  )
}
