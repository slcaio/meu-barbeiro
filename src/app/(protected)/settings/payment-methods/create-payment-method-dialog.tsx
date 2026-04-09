'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { createPaymentMethod } from '@/app/payment-methods/actions'

export function CreatePaymentMethodDialog() {
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    const result = await createPaymentMethod(formData)
    if (result?.success) {
      setIsOpen(false)
    } else if (result?.error) {
      alert(result.error)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Novo Método
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Novo Método de Pagamento">
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" name="name" placeholder="Ex: Cartão de Crédito" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fee_type">Tipo de Taxa</Label>
              <select
                id="fee_type"
                name="fee_type"
                defaultValue="percentage"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="percentage">Percentual (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee_value">Valor da Taxa</Label>
              <Input
                id="fee_value"
                name="fee_value"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                placeholder="0"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Cadastrar</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
