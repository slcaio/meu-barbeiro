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
        <div key={`${t.source}-${t.id}`} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            {t.type === 'income' ? (
              <ArrowUpCircle className="h-8 w-8 text-green-500" />
            ) : (
              <ArrowDownCircle className="h-8 w-8 text-red-500" />
            )}
            <div>
              <p className="font-medium">{t.description}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="bg-secondary px-1.5 py-0.5 rounded text-xs font-medium">
                  {t.category}
                </span>
                <span>•</span>
                <span>
                  {new Date(t.date).toLocaleDateString('pt-BR')}
                  {t.source === 'appointment' && ' (Agendamento)'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {t.type === 'income' ? '+' : '-'} 
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
            </span>
            
            {t.source === 'manual' && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-red-500"
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
