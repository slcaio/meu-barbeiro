'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Trash2, Pencil } from 'lucide-react'
import { deletePaymentMethod } from '@/app/payment-methods/actions'
import { CreatePaymentMethodDialog } from './create-payment-method-dialog'
import { EditPaymentMethodDialog } from './edit-payment-method-dialog'

interface PaymentMethod {
  id: string
  barbershop_id: string
  name: string
  fee_type: 'percentage' | 'fixed'
  fee_value: number
  is_active: boolean
  created_at: string
  updated_at: string
}

function formatFee(feeType: string, feeValue: number) {
  if (feeValue === 0) return 'Sem taxa'
  if (feeType === 'percentage') return `${feeValue}%`
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(feeValue)
}

export function PaymentMethodList({ paymentMethods }: { paymentMethods: PaymentMethod[] }) {
  const [search, setSearch] = useState('')
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod | null>(null)
  const [isPending, startTransition] = useTransition()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const filteredMethods = paymentMethods.filter(pm =>
    pm.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deletePaymentMethod(id)
      if (result.error) {
        alert(result.error)
      }
      setConfirmDeleteId(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar método..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <CreatePaymentMethodDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pagamento ({filteredMethods.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMethods.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {paymentMethods.length === 0
                ? 'Nenhum método de pagamento cadastrado. Adicione seu primeiro método!'
                : 'Nenhum método encontrado com esse nome.'}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 last:border-0 last:pb-0 gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                      {pm.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{pm.name}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          pm.fee_value > 0
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {formatFee(pm.fee_type, pm.fee_value)}
                        </span>
                        {!pm.is_active && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400">
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pm.fee_type === 'percentage' ? 'Taxa percentual' : 'Taxa fixa'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {confirmDeleteId === pm.id ? (
                      <>
                        <span className="text-sm text-red-600">Confirmar exclusão?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(pm.id)}
                          disabled={isPending}
                        >
                          Sim
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={isPending}
                        >
                          Não
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditPaymentMethod(pm)}
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => setConfirmDeleteId(pm.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EditPaymentMethodDialog
        paymentMethod={editPaymentMethod}
        isOpen={!!editPaymentMethod}
        onOpenChange={(open) => { if (!open) setEditPaymentMethod(null) }}
      />
    </div>
  )
}
