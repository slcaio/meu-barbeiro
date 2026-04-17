'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/submit-button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { createPaymentMethod } from '@/app/payment-methods/actions'

const MAX_INSTALLMENTS = 12

export function CreatePaymentMethodDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [supportsInstallments, setSupportsInstallments] = useState(false)
  const [installmentFees, setInstallmentFees] = useState<Record<number, string>>({})

  const handleInstallmentFeeChange = (num: number, value: string) => {
    setInstallmentFees((prev) => ({ ...prev, [num]: value }))
  }

  const handleSubmit = async (formData: FormData) => {
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

    const result = await createPaymentMethod(formData)
    if (result?.success) {
      setIsOpen(false)
      setSupportsInstallments(false)
      setInstallmentFees({})
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors hover:border-ring/50 dark:hover:bg-input/50"
              >
                <option value="percentage">Percentual (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee_value">Taxa à Vista (1x)</Label>
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

          <label
            htmlFor="supports-installments"
            className="flex items-center gap-3 rounded-lg border border-input p-3 cursor-pointer transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <input
              type="checkbox"
              id="supports-installments"
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
                    %
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton pendingText="Cadastrando...">Cadastrar</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  )
}
