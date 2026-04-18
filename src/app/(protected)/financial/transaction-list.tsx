'use client'

import { Button } from '@/components/ui/button'
import { Trash2, ArrowUpCircle, ArrowDownCircle, CalendarDays, Tag, CreditCard } from 'lucide-react'
import { deleteTransaction } from '@/app/financial/actions'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'

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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      startTransition(async () => {
        await deleteTransaction(id)
      })
    }
  }

  if (transactions.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nenhuma movimentação neste mês.</p>
  }

  return (
    <div className="space-y-3">
      {transactions.map((t) => {
        const isIncome = t.type === 'income'
        const formattedDate = new Date(t.date).toLocaleDateString('pt-BR')

        return (
          <div key={`${t.source}-${t.id}`} className="sm:border-b sm:border-border/50 sm:last:border-0 sm:pb-1">
            {/* Mobile card (hidden on sm+) */}
            <div className={cn(
              'sm:hidden rounded-lg border bg-card overflow-hidden',
              isIncome ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-red-500'
            )}>
              {/* Card top row: icon + description + amount */}
              <div className="flex items-start justify-between gap-3 px-3 pt-3 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {isIncome ? (
                    <ArrowUpCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <p className="font-medium text-sm leading-snug line-clamp-2">{t.description}</p>
                </div>
                <span className={cn(
                  'font-bold text-sm whitespace-nowrap shrink-0',
                  isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>

              {/* Card bottom row: metadata + delete */}
              <div className="flex items-center justify-between gap-2 px-3 pb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-xs font-medium">
                    <Tag className="h-3 w-3" />
                    {t.category}
                  </span>
                  {t.paymentMethodName && (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-xs font-medium">
                      <CreditCard className="h-3 w-3" />
                      {t.paymentMethodName}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {formattedDate}
                    {t.source === 'appointment' && ' · Agend.'}
                  </span>
                </div>
                {t.source === 'manual' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-500 shrink-0"
                    onClick={() => handleDelete(t.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Desktop row (hidden on mobile) */}
            <div className={cn(
              'hidden sm:flex sm:items-center sm:justify-between gap-4',
              'rounded-lg px-3 py-3 transition-colors hover:bg-muted/50',
              'border-l-2',
              isIncome ? 'border-l-emerald-500' : 'border-l-red-500'
            )}>
              <div className="flex items-center gap-3 min-w-0">
                {isIncome ? (
                  <ArrowUpCircle className="h-8 w-8 text-green-500 shrink-0" />
                ) : (
                  <ArrowDownCircle className="h-8 w-8 text-red-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium truncate">{t.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="bg-secondary px-1.5 py-0.5 rounded text-xs font-medium">
                      {t.category}
                    </span>
                    {t.paymentMethodName && (
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-xs font-medium">
                        {t.paymentMethodName}
                      </span>
                    )}
                    <span>•</span>
                    <span>
                      {formattedDate}
                      {t.source === 'appointment' && ' (Agendamento)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className={cn(
                  'font-bold whitespace-nowrap',
                  isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
                {t.source === 'manual' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-500"
                    onClick={() => handleDelete(t.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
