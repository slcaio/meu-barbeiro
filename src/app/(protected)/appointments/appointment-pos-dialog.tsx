'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completeAppointmentWithTransaction } from '@/app/appointments/actions'
import { Loader2 } from 'lucide-react'
import { formatCurrency, parseCurrency } from '@/lib/utils'
import type { AppointmentWithRelations, PaymentMethodWithInstallments } from '@/types/database.types'

interface AppointmentPOSDialogProps {
  appointment: AppointmentWithRelations
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  action: 'complete' | 'cancel'
  paymentMethods: PaymentMethodWithInstallments[]
}

export function AppointmentPOSDialog({
  appointment,
  isOpen,
  onOpenChange,
  action,
  paymentMethods
}: AppointmentPOSDialogProps) {
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('')
  const [selectedInstallments, setSelectedInstallments] = useState<number>(1)

  useEffect(() => {
    if (isOpen && appointment) {
      setSelectedPaymentMethodId('')
      setSelectedInstallments(1)

      const serviceNames = appointment.appointment_services
        .map(as => as.services?.name)
        .filter(Boolean)
        .join(', ')
      const totalPrice = appointment.appointment_services.reduce((sum, as) => sum + as.price_at_time, 0)

      if (action === 'complete') {
        setAmount(formatCurrency(totalPrice.toFixed(2)))
        setDescription(`Serviços: ${serviceNames} - Cliente: ${appointment.client_name}`)
      } else {
        setAmount('R$ 0,00')
        setDescription(`Taxa de cancelamento - Serviços: ${serviceNames} - Cliente: ${appointment.client_name}`)
      }
    }
  }, [isOpen, appointment, action])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow user to clear input
    if (value === '') {
      setAmount('')
      return
    }
    
    // Only allow digits to be typed (and then we format)
    const numericValue = value.replace(/\D/g, '')
    const formatted = formatCurrency(numericValue)
    setAmount(formatted)
  }

  const handlePaymentMethodChange = (id: string) => {
    setSelectedPaymentMethodId(id)
    setSelectedInstallments(1) // Reset installments when changing method
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (action === 'complete' && !selectedPaymentMethodId) {
      alert('Selecione um método de pagamento.')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('appointment_id', appointment.id)
      formData.append('action', action)
      
      // Parse currency back to number string (e.g. 30.00)
      const rawAmount = parseCurrency(amount)
      formData.append('amount', rawAmount.toString())
      
      formData.append('description', description)

      if (selectedPaymentMethodId) {
        formData.append('payment_method_id', selectedPaymentMethodId)
      }

      formData.append('installments', selectedInstallments.toString())
      
      const result = await completeAppointmentWithTransaction(formData)

      if (result.error) {
        alert(result.error)
      } else {
        onOpenChange(false)
      }
    } catch (error) {
      console.error(error)
      alert('Ocorreu um erro ao processar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Determine selected method and its installment tiers
  const selectedMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethodId)
  const rawAmount = parseCurrency(amount)

  // Calculate fee based on installments
  let feeAmount = 0
  let feeLabel = ''
  if (selectedMethod && rawAmount > 0) {
    if (selectedInstallments > 1 && selectedMethod.supports_installments) {
      // Use installment-specific fee
      const tier = selectedMethod.payment_method_installments.find(
        t => t.installment_number === selectedInstallments
      )
      if (tier) {
        feeAmount = rawAmount * (tier.fee_percentage / 100)
        feeLabel = `${selectedMethod.name} ${selectedInstallments}x - ${tier.fee_percentage}%`
      }
    } else {
      // Use base fee (1x / à vista)
      if (selectedMethod.fee_type === 'percentage') {
        feeAmount = rawAmount * (selectedMethod.fee_value / 100)
      } else {
        feeAmount = selectedMethod.fee_value
      }
      if (feeAmount > 0) {
        feeLabel = `${selectedMethod.name} ${selectedMethod.fee_type === 'percentage' ? `${selectedMethod.fee_value}%` : `R$ ${selectedMethod.fee_value.toFixed(2)}`}`
      }
    }
  }
  const feeFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(feeAmount)

  // Build installment options for selected method
  const installmentOptions: { value: number; label: string; fee: number }[] = []
  if (selectedMethod?.supports_installments && rawAmount > 0) {
    // 1x option (base fee)
    const baseFee = selectedMethod.fee_type === 'percentage'
      ? rawAmount * (selectedMethod.fee_value / 100)
      : selectedMethod.fee_value
    installmentOptions.push({
      value: 1,
      label: `1x de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rawAmount)}${baseFee > 0 ? ` (taxa ${selectedMethod.fee_value}%)` : ' (sem taxa)'}`,
      fee: baseFee,
    })
    // Nx options from installment tiers
    const sortedTiers = [...selectedMethod.payment_method_installments].sort(
      (a, b) => a.installment_number - b.installment_number
    )
    for (const tier of sortedTiers) {
      const installmentValue = rawAmount / tier.installment_number
      installmentOptions.push({
        value: tier.installment_number,
        label: `${tier.installment_number}x de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(installmentValue)} (taxa ${tier.fee_percentage}%)`,
        fee: rawAmount * (tier.fee_percentage / 100),
      })
    }
  }

  const title = action === 'complete' ? 'Concluir Agendamento' : 'Cancelar Agendamento'
  const buttonText = action === 'complete' ? 'Concluir e Receber' : 'Confirmar Cancelamento'
  const buttonVariant = action === 'complete' ? 'default' : 'destructive'

  return (
    <Modal isOpen={isOpen} onClose={() => onOpenChange(false)} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-muted p-3 rounded-md mb-4 text-sm text-foreground/80">
            <p><strong>Cliente:</strong> {appointment?.client_name}</p>
            <p><strong>Serviços:</strong> {appointment?.appointment_services?.map(as => as.services?.name).filter(Boolean).join(', ')}</p>
            {action === 'complete' && (
               <p><strong>Preço Padrão:</strong> {formatCurrency(
                 (appointment?.appointment_services?.reduce((sum, as) => sum + as.price_at_time, 0) ?? 0).toFixed(2)
               )}</p>
            )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Valor da Transação</Label>
          <Input 
            id="amount" 
            value={amount}
            onChange={handleAmountChange}
            type="text" 
            inputMode="numeric"
            placeholder="R$ 0,00"
            required 
          />
          <p className="text-xs text-muted-foreground">
            {action === 'complete' 
              ? 'Você pode alterar o valor final cobrado.' 
              : 'Se houver taxa de cancelamento, informe o valor acima. Caso contrário, mantenha 0.'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição da Transação</Label>
          <Input 
            id="description" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required 
          />
        </div>

        {action === 'complete' && (
          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pagamento *</Label>
            <select
              id="payment_method"
              value={selectedPaymentMethodId}
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Selecione...</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}{pm.fee_value > 0 ? ` (${pm.fee_type === 'percentage' ? `${pm.fee_value}%` : `R$ ${pm.fee_value.toFixed(2)}`})` : ''}{pm.supports_installments ? ' • Parcelável' : ''}
                </option>
              ))}
            </select>
            {paymentMethods.length === 0 && (
              <p className="text-xs text-amber-600">
                Nenhum método de pagamento cadastrado. Cadastre em Configurações → Métodos de Pagamento.
              </p>
            )}
          </div>
        )}

        {action === 'complete' && selectedMethod?.supports_installments && installmentOptions.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="installments">Parcelas</Label>
            <select
              id="installments"
              value={selectedInstallments}
              onChange={(e) => setSelectedInstallments(Number(e.target.value))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {installmentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {action === 'complete' && selectedMethod && feeAmount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-md text-sm text-amber-600 dark:text-amber-400">
            <p><strong>Taxa ({feeLabel}):</strong> {feeFormatted}</p>
          </div>
        )}

        <div className="pt-4 flex justify-end space-x-2 border-t mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Voltar
          </Button>
          <Button type="submit" variant={buttonVariant} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {buttonText}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
