'use client'

import { useState } from 'react'
import { History, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { getStockMovements } from '@/app/stock/actions'
import { cn } from '@/lib/utils'
import type { Product, StockMovement } from '@/types/database.types'

interface StockHistoryDialogProps {
  product: Product
}

const typeConfig = {
  entry: { label: 'Entrada', icon: ArrowDownCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  exit: { label: 'Saída', icon: ArrowUpCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  adjustment: { label: 'Ajuste', icon: RefreshCw, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
}

const sourceLabels: Record<string, string> = {
  manual: 'Manual',
  sale: 'Venda',
  purchase: 'Compra',
  adjustment: 'Ajuste',
}

const statusConfig = {
  none: { label: 'N/A', color: 'text-muted-foreground', bg: 'bg-muted' },
  pending: { label: 'Pendente', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  settled: { label: 'Liquidado', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
}

export function StockHistoryDialog({ product }: StockHistoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(false)

  const handleOpen = async () => {
    setIsOpen(true)
    setLoading(true)
    try {
      const data = await getStockMovements(product.id)
      setMovements(data)
    } catch {
      setMovements([])
    } finally {
      setLoading(false)
    }
  }

  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpen}>
        <History className="h-4 w-4" />
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Histórico — ${product.name}`}>
        <div className="space-y-1 mb-4">
          <p className="text-sm text-muted-foreground">
            Estoque atual: <strong>{product.current_stock} {product.unit}</strong>
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
        ) : movements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma movimentação registrada.</p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {movements.map((mv) => {
              const config = typeConfig[mv.type]
              const status = statusConfig[mv.financial_status]
              const Icon = config.icon

              return (
                <div key={mv.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', config.bg)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-xs font-semibold rounded-full px-2 py-0.5', config.bg, config.color)}>
                        {config.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{sourceLabels[mv.source]}</span>
                      {mv.financial_status !== 'none' && (
                        <span className={cn('text-xs rounded-full px-2 py-0.5', status.bg, status.color)}>
                          {status.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">
                      {mv.quantity} un
                      {mv.total_cost != null && <span className="text-muted-foreground"> — {formatBRL(mv.total_cost)}</span>}
                    </p>
                    {mv.notes && <p className="text-xs text-muted-foreground">{mv.notes}</p>}
                    <p className="text-xs text-muted-foreground">{formatDate(mv.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Modal>
    </>
  )
}
