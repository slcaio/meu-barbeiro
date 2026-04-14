'use client'

import { useState } from 'react'
import { Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { settleStockEntry } from '@/app/stock/actions'
import { cn } from '@/lib/utils'

interface PendingEntry {
  id: string
  product_id: string
  quantity: number
  unit_cost: number | null
  total_cost: number | null
  created_at: string
  products: { name: string } | null
}

interface PendingEntriesSectionProps {
  entries: PendingEntry[]
}

export function PendingEntriesSection({ entries }: PendingEntriesSectionProps) {
  const [settlingId, setSettlingId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  const handleSettle = async (movementId: string) => {
    if (!confirm('Deseja liquidar esta entrada? Uma despesa será criada no financeiro.')) return
    setSettlingId(movementId)
    const result = await settleStockEntry(movementId)
    if (result?.error) alert(result.error)
    setSettlingId(null)
  }

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Clock className="h-4 w-4 text-amber-500" />
            Entradas Pendentes
            <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
              {entries.length}
            </span>
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {collapsed ? 'Expandir' : 'Recolher'}
          </span>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent>
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-4 rounded-lg border p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {entry.products?.name ?? 'Produto'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.quantity} un × {entry.unit_cost != null ? formatBRL(entry.unit_cost) : '—'} = {' '}
                    <strong>{entry.total_cost != null ? formatBRL(entry.total_cost) : '—'}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    'shrink-0',
                    'text-amber-600 border-amber-200 hover:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                  )}
                  disabled={settlingId === entry.id}
                  onClick={() => handleSettle(entry.id)}
                >
                  <CheckCircle className="mr-1 h-3.5 w-3.5" />
                  {settlingId === entry.id ? 'Liquidando...' : 'Liquidar'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
