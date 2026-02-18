'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAppointment } from '@/app/appointments/actions'

export function CreateAppointmentDialog({ services }: { services: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Custom form handling to close modal on success
  const handleSubmit = async (formData: FormData) => {
    // We need to format the date-time to ISO string because HTML datetime-local value is not ISO
    const dateTimeLocal = formData.get('datetime') as string
    if (dateTimeLocal) {
      formData.set('appointment_date', new Date(dateTimeLocal).toISOString())
    }
    
    const result = await createAppointment(formData)
    if (result?.success) {
      setIsOpen(false)
    } else if (result?.error) {
      alert(result.error) // Simple alert for error
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Novo Agendamento">
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_name">Nome do Cliente</Label>
            <Input id="client_name" name="client_name" required placeholder="Nome completo" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="client_phone">Telefone</Label>
            <Input id="client_phone" name="client_phone" required placeholder="(00) 00000-0000" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_id">Serviço</Label>
            <select 
              id="service_id" 
              name="service_id" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Selecione um serviço</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="datetime">Data e Hora</Label>
            <Input 
              id="datetime" 
              name="datetime" 
              type="datetime-local" 
              required 
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (Opcional)</Label>
            <Input id="notes" name="notes" placeholder="Ex: Cliente novo, corte específico..." />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit">Agendar</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
