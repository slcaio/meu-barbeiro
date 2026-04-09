'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePaymentMethod } from '@/app/payment-methods/actions'

interface PaymentMethod {
  id: string
  name: string
  fee_type: 'percentage' | 'fixed'
  fee_value: number
  is_active: boolean
}

interface EditPaymentMethodDialogProps {
  paymentMethod: PaymentMethod | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function EditPaymentMethodDialog({ paymentMethod, isOpen, onOpenChange }: EditPaymentMethodDialogProps) {
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (paymentMethod && isOpen) {
      setIsActive(paymentMethod.is_active)
    }
  }, [paymentMethod, isOpen])

  if (!paymentMethod) return null

  const handleSubmit = async (formData: FormData) => {
    formData.set('id', paymentMethod.id)
    formData.set('is_active', isActive.toString())

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
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="percentage">Percentual (%)</option>
              <option value="fixed">Valor Fixo (R$)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-fee_value">Valor da Taxa</Label>
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

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="edit-is-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
          />
          <Label htmlFor="edit-is-active" className="text-sm font-normal">
            Método ativo (disponível para seleção)
          </Label>
        </div>

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
