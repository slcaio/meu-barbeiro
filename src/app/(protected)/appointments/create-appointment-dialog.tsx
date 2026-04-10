'use client'

import { useState, useEffect } from 'react'
import { Plus, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatPhone } from '@/lib/utils'
import { createAppointment } from '@/app/appointments/actions'
import { ClientSelector } from './client-selector'
import type { ServiceOption, BarberOption } from '@/types/database.types'

interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
}

const disablePastDates = (date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))

interface CreateAppointmentDialogProps {
  services: ServiceOption[]
  clients: Client[]
  barbers: BarberOption[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  initialDate?: Date
}

export function CreateAppointmentDialog({ services, clients, barbers, isOpen: externalIsOpen, onOpenChange, initialDate }: CreateAppointmentDialogProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  
  const isControlled = typeof externalIsOpen !== 'undefined'
  const isOpen = isControlled ? externalIsOpen : internalIsOpen
  const setIsOpen = (open: boolean) => {
    if (isControlled) {
      onOpenChange?.(open)
    } else {
      setInternalIsOpen(open)
    }
  }

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isNewClientMode, setIsNewClientMode] = useState(false)
  
  // Form state
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  
  // Select state
  const [serviceId, setServiceId] = useState('')
  const [barberId, setBarberId] = useState('')

  // Date and Time state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        setSelectedDate(initialDate)
        const hours = String(initialDate.getHours()).padStart(2, '0')
        const minutes = String(initialDate.getMinutes()).padStart(2, '0')
        setTimeStr(`${hours}:${minutes}`)
      } else {
        // Reset to defaults when opening without initialDate
        setSelectedDate(new Date())
        setTimeStr('')
      }
      setServiceId('')
      setBarberId('')
    }
  }, [isOpen, initialDate])

  useEffect(() => {
    if (selectedClient) {
      setClientName(selectedClient.name)
      setClientPhone(formatPhone(selectedClient.phone || ''))
    } else if (!isNewClientMode) {
      setClientName('')
      setClientPhone('')
    }
  }, [selectedClient, isNewClientMode])

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setIsNewClientMode(false)
  }

  const handleNewClient = () => {
    setSelectedClient(null)
    setIsNewClientMode(true)
    setClientName('')
    setClientPhone('')
  }

  const handleClearClient = () => {
    setSelectedClient(null)
    setIsNewClientMode(false)
    setClientName('')
    setClientPhone('')
  }

  // Custom form handling to close modal on success
  const handleSubmit = async (formData: FormData) => {
    // Combine date and time into a single ISO string
    if (selectedDate && timeStr) {
      const [hours, minutes] = timeStr.split(':')
      const dateTime = new Date(selectedDate)
      dateTime.setHours(Number(hours), Number(minutes), 0, 0)
      formData.set('appointment_date', dateTime.toISOString())
    }
    
    const result = await createAppointment(formData)
    if (result?.success) {
      setIsOpen(false)
      handleClearClient()
      setServiceId('')
      setBarberId('')
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
          
          {/* Client Selection Section */}
          <div className="space-y-4 border-b pb-4">
            {!selectedClient && !isNewClientMode ? (
              <ClientSelector 
                clients={clients} 
                onSelect={handleClientSelect}
                onNewClient={handleNewClient}
              />
            ) : (
              <div className="flex items-center justify-between bg-muted p-3 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {isNewClientMode ? 'Novo Cliente' : selectedClient?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isNewClientMode ? 'Preencha os dados abaixo' : (selectedClient?.phone ? formatPhone(selectedClient.phone) : 'Sem telefone')}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={handleClearClient}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <input type="hidden" name="client_id" value={selectedClient?.id || ''} />
          <input type="hidden" name="is_new_client" value={isNewClientMode ? 'true' : 'false'} />

          {(selectedClient || isNewClientMode) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="client_name">Nome do Cliente</Label>
                <Input 
                  id="client_name" 
                  name="client_name" 
                  required 
                  placeholder="Nome completo" 
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  readOnly={!!selectedClient}
                  className={selectedClient ? 'bg-muted' : ''}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client_phone">Telefone (Opcional)</Label>
                <Input 
                  id="client_phone" 
                  name="client_phone" 
                  placeholder="(00) 00000-0000" 
                  value={clientPhone}
                  onChange={(e) => setClientPhone(formatPhone(e.target.value))}
                  readOnly={!!selectedClient}
                  className={selectedClient ? 'bg-muted' : ''}
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Serviço</span>
            <Select name="service_id" required value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {barbers.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Barbeiro</span>
              <Select name="barber_id" value={barberId} onValueChange={setBarberId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar barbeiro (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {barbers.filter((b) => b.is_active).map((barber) => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Data</span>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                disabled={disablePastDates}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Hora</span>
              <TimePicker value={timeStr} onChange={setTimeStr} />
            </div>
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
