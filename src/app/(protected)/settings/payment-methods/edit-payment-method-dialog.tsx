'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePaymentMethod } from '@/app/payment-methods/actions'

const MAX_INSTALLMENTS = 12

interface InstallmentTier {
  installment_number: number
  fee_percentage: number
}

interface PaymentMethod {
  id: string
  name: string
  fee_type: 'percentage' | 'fixed'
  fee_value: number
  supports_installments: boolean
  is_active: boolean
  payment_method_installments?: InstallmentTier[]
}

interface EditPaymentMethodDialogProps {
  paymentMethod: PaymentMethod | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function EditPaymentMethodDialog({ paymentMethod, isOpen, onOpenChange }: EditPaymentMethodDialogProps) {
  const [isActive, setIsActive] = useState(true)
  const [supportsInstallments, setSupportsInstallments] = useState(false)
  const [installmentFees, setInstallmentFees] = useState<Record<number, string>>({})

  useEffect(() => {
    if (paymentMethod && isOpen) {
      setIsActive(paymentMethod.is_active)
      setSupportsInstallments(paymentMethod.supports_installments)

      // Pre-fill installment fees from existing data
      const fees: Record<number, string> = {}
      if (paymentMethod.payment_method_installments) {
        for (const tier of paymentMethod.payment_method_installments) {
          fees[tier.installment_number] = tier.fee_percentage.toString()
        }
      }
      setInstallmentFees(fees)
    }
  }, [paymentMethod, isOpen])

  if (!paymentMethod) return null

  const handleInstallmentFeeChange = (num: number, value: string) => {
    setInstallmentFees((prev) => ({ ...prev, [num]: value }))
  }

  const handleSubmit = async (formData: FormData) => {
    formData.set('id', paymentMethod.id)
    formData.set('is_active', isActive.toString())
    formData.set('supports_installments', supportsInstallments.toString())

    if (supportsInstallments) {
      const installments = Object.entries(installmentFees)
        .filter(([, val]) => val !== '' && Number(val) >= 0)
        .map(([num, val]) => ({
          installment_number: Number(num),
          fee_percentage: Number(val),
        }))
      formData.set('installments_json', JSON.stringify(installments))
    }

    const result = await updatePaymentMethod(formData)
    if (result?.success) {
      onOpenChange(false)
    } else if (result?.error) {
      alert(result.error)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => onOpenChange(false)} title="Editar Método de Pagamento">
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Nome *</Label>
          <Input id="edit-name" name="name" defaultValue={paymentMethod.name} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-fee_type">Tipo de Taxa</Label>
            <select
              id="edit-fee_type"
              name="fee_type"
              defaultValue={paymentMethod.fee_type}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors hover:border-ring/50 dark:hover:bg-input/50"
            >
              <option value="percentage">Percentual (%)</option>
              <option value="fixed">Valor Fixo (R$)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-fee_value">Taxa à Vista (1x)</Label>
            <Input
              id="edit-fee_value"
              name="fee_value"
              type="number"
              min="0"
              step="0.01"
              defaultValue={paymentMethod.fee_value}
              placeholder="0"
            />
          </div>
        </div>

        <label
          htmlFor="edit-supports-installments"
          className="flex items-center gap-3 rounded-lg border border-input p-3 cursor-pointer transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
        >
          <input
            type="checkbox"
            id="edit-supports-installments"
            checked={supportsInstallments}
            onChange={(e) => setSupportsInstallments(e.target.checked)}
            className="h-4 w-4 shrink-0 rounded border-input accent-primary focus:ring-ring"
          />
          <span className="text-sm">
            Aceita parcelamento (até 12x)
          </span>
        </label>

        {supportsInstallments && (
          <div className="space-y-3 border rounded-md p-4 bg-muted/50">
            <p className="text-sm font-medium">Taxas por parcela</p>
            <p className="text-xs text-muted-foreground">
              Informe a taxa percentual para cada número de parcelas. Deixe em branco as que não deseja oferecer.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: MAX_INSTALLMENTS - 1 }, (_, i) => i + 2).map((num) => (
                <div key={num} className="flex items-center gap-2">
                  <span className="text-sm font-medium w-8 shrink-0">{num}x</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="%"
                    value={installmentFees[num] ?? ''}
                    onChange={(e) => handleInstallmentFeeChange(num, e.target.value)}
                    className="h-9"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <label
          htmlFor="edit-is-active"
          className="flex items-center gap-3 rounded-lg border border-input p-3 cursor-pointer transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
        >
          <input
            type="checkbox"
            id="edit-is-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 shrink-0 rounded border-input accent-primary focus:ring-ring"
          />
          <span className="text-sm">
            Método ativo (disponível para seleção)
          </span>
        </label>

        <div className="pt-4 flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  )
}
