'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completeAppointmentWithTransaction } from '@/app/appointments/actions'
import { Loader2 } from 'lucide-react'
import { formatCurrency, parseCurrency } from '@/lib/utils'

interface AppointmentPOSDialogProps {
  appointment: any
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  action: 'complete' | 'cancel'
}

export function AppointmentPOSDialog({
  appointment,
  isOpen,
  onOpenChange,
  action
}: AppointmentPOSDialogProps) {
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && appointment) {
      if (action === 'complete') {
        // Convert number to formatted string
        const price = appointment.services?.price || 0
        setAmount(formatCurrency(price.toFixed(2)))
        setDescription(`Serviço: ${appointment.services?.name} - Cliente: ${appointment.client_name}`)
      } else {
        setAmount('R$ 0,00')
        setDescription(`Taxa de cancelamento - Serviço: ${appointment.services?.name} - Cliente: ${appointment.client_name}`)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('appointment_id', appointment.id)
      formData.append('action', action)
      
      // Parse currency back to number string (e.g. 30.00)
      const rawAmount = parseCurrency(amount)
      formData.append('amount', rawAmount.toString())
      
      formData.append('description', description)
      formData.append('payment_method', 'money') // Default to money for now, could be expanded later
      
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

  const title = action === 'complete' ? 'Concluir Agendamento' : 'Cancelar Agendamento'
  const buttonText = action === 'complete' ? 'Concluir e Receber' : 'Confirmar Cancelamento'
  const buttonVariant = action === 'complete' ? 'default' : 'destructive'

  return (
    <Modal isOpen={isOpen} onClose={() => onOpenChange(false)} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-md mb-4 text-sm text-gray-700">
            <p><strong>Cliente:</strong> {appointment?.client_name}</p>
            <p><strong>Serviço:</strong> {appointment?.services?.name}</p>
            {action === 'complete' && (
               <p><strong>Preço Padrão:</strong> {appointment?.services?.price ? formatCurrency(appointment.services.price.toFixed(2)) : 'R$ 0,00'}</p>
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
          <p className="text-xs text-gray-500">
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
