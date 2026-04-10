'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Download, FileSpreadsheet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  date: string
  source: 'appointment' | 'manual'
  paymentMethodName: string | null
}

interface Summary {
  totalIncome: number
  expenses: number
  netProfit: number
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function StatementReportDialog({
  transactions,
  summary,
}: {
  transactions: Transaction[]
  summary: Summary
}) {
  const [isOpen, setIsOpen] = useState(false)

  const exportCSV = () => {
    const BOM = '\uFEFF'
    const header = 'Data;Tipo;Categoria;Descrição;Método de Pagamento;Valor\n'
    const rows = transactions.map((t) => {
      const date = new Date(t.date).toLocaleDateString('pt-BR')
      const type = t.type === 'income' ? 'Receita' : 'Despesa'
      const amount = t.amount.toFixed(2).replace('.', ',')
      const description = t.description.replace(/;/g, ',')
      const paymentMethod = t.paymentMethodName || '-'
      return `${date};${type};${t.category};${description};${paymentMethod};${amount}`
    })

    const totalsRow = `\n;;;;Receita Total;${summary.totalIncome.toFixed(2).replace('.', ',')}\n;;;;Despesas;${summary.expenses.toFixed(2).replace('.', ',')}\n;;;;Lucro Líquido;${summary.netProfit.toFixed(2).replace('.', ',')}`

    const csvContent = BOM + header + rows.join('\n') + totalsRow
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `extrato_${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Relatório do Extrato
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Relatório do Extrato</DialogTitle>
          <DialogDescription>
            Visualize o extrato filtrado e exporte em CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-1">
          {/* Summary Cards */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">Receita Total</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(summary.totalIncome)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">Despesas</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">{formatBRL(summary.expenses)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">Lucro Líquido</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className={`text-lg sm:text-xl font-bold ${summary.netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatBRL(summary.netProfit)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction List */}
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma transação encontrada no período filtrado.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {transactions.length} transaç{transactions.length === 1 ? 'ão' : 'ões'}
                </p>
                <Button onClick={exportCSV} size="sm">
                  <Download className="mr-2 h-4 w-4" /> Exportar CSV
                </Button>
              </div>

              <div className="divide-y border rounded-lg">
                {transactions.map((t) => (
                  <div key={`${t.source}-${t.id}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 sm:px-4 py-3 gap-1 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      {t.type === 'income' ? (
                        <ArrowUpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 shrink-0" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.description}</p>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="bg-secondary px-1.5 py-0.5 rounded font-medium">
                            {t.category}
                          </span>
                          {t.paymentMethodName && (
                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                              {t.paymentMethodName}
                            </span>
                          )}
                          <span>•</span>
                          <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm font-bold whitespace-nowrap pl-6 sm:pl-0 ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'} {formatBRL(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
