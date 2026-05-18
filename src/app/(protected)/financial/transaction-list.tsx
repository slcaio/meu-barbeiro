'use client'

import { ArrowUpCircle, ArrowDownCircle, CalendarDays, Tag, CreditCard, Package } from 'lucide-react'
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
  isCogs: boolean
  stockMovementId: string | null
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

interface TransactionListProps {
  transactions: Transaction[]
  onSelect?: (transaction: Transaction) => void
}

export function TransactionList({ transactions, onSelect }: TransactionListProps) {
  if (transactions.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nenhuma movimentação neste mês.</p>
  }

  return (
    <div className="space-y-3">
      {transactions.map((t) => {
        const isIncome = t.type === 'income'
        const isCogs = t.isCogs
        const formattedDate = new Date(`${t.date}T12:00:00`).toLocaleDateString('pt-BR')

        const accentTextClass = isCogs
          ? 'text-amber-600 dark:text-amber-400'
          : isIncome
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-600 dark:text-red-400'

        const accentBorderClass = isCogs
          ? 'border-l-amber-500'
          : isIncome
            ? 'border-l-emerald-500'
            : 'border-l-red-500'

        const Icon = isCogs ? Package : isIncome ? ArrowUpCircle : ArrowDownCircle

        const handleClick = () => onSelect?.(t)
        const handleKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect?.(t)
          }
        }

        return (
          <div key={`${t.source}-${t.id}`} className="sm:border-b sm:border-border/50 sm:last:border-0 sm:pb-1">
            {/* Mobile card */}
            <div
              role="button"
              tabIndex={0}
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              className={cn(
                'sm:hidden rounded-lg border bg-card overflow-hidden cursor-pointer transition-colors',
                'hover:bg-accent/40 active:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'border-l-4',
                accentBorderClass
              )}
            >
              <div className="flex items-start justify-between gap-3 px-3 pt-3 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', accentTextClass)} />
                  <p className="font-medium text-sm leading-snug line-clamp-2">{t.description}</p>
                </div>
                <span className={cn('font-bold text-sm whitespace-nowrap shrink-0', accentTextClass)}>
                  {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 px-3 pb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-xs font-medium">
                    <Tag className="h-3 w-3" />
                    {t.category}
                  </span>
                  {isCogs && (
                    <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded text-xs font-medium">
                      CMV
                    </span>
                  )}
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
              </div>
            </div>

            {/* Desktop row */}
            <div
              role="button"
              tabIndex={0}
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              className={cn(
                'hidden sm:flex sm:items-center sm:justify-between gap-4 cursor-pointer',
                'rounded-lg px-3 py-3 transition-colors hover:bg-muted/50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'border-l-2',
                accentBorderClass
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={cn('h-8 w-8 shrink-0', accentTextClass)} />
                <div className="min-w-0">
                  <p className="font-medium truncate">{t.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="bg-secondary px-1.5 py-0.5 rounded text-xs font-medium">
                      {t.category}
                    </span>
                    {isCogs && (
                      <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded text-xs font-medium">
                        CMV
                      </span>
                    )}
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
                <span className={cn('font-bold whitespace-nowrap', accentTextClass)}>
                  {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
