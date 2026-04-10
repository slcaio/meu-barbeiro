'use client'

import { Button } from '@/components/ui/button'
import { Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { deleteTransaction } from '@/app/financial/actions'
import { useTransition } from 'react'

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
    <div className="space-y-4">
      {transactions.map((t) => (
        <div key={`${t.source}-${t.id}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 last:border-0 last:pb-0 gap-2 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {t.type === 'income' ? (
              <ArrowUpCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 shrink-0" />
            ) : (
              <ArrowDownCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-medium truncate">{t.description}</p>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-sm text-muted-foreground">
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
                  {new Date(t.date).toLocaleDateString('pt-BR')}
                  {t.source === 'appointment' && ' (Agendamento)'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0 pl-9 sm:pl-0">
            <span className={`font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {t.type === 'income' ? '+' : '-'} 
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
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
      ))}
    </div>
  )
}
