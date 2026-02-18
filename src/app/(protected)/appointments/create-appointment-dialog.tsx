'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Plus, X, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAppointment } from '@/app/appointments/actions'
import { ClientSelector } from './client-selector'

interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
}

const getTodayStr = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface CreateAppointmentDialogProps {
  services: any[]
  clients: any[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  initialDate?: Date
}

export function CreateAppointmentDialog({ services, clients, isOpen: externalIsOpen, onOpenChange, initialDate }: CreateAppointmentDialogProps) {
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
  
  // Date and Time state
  const [dateStr, setDateStr] = useState(getTodayStr())
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        const year = initialDate.getFullYear()
        const month = String(initialDate.getMonth() + 1).padStart(2, '0')
        const day = String(initialDate.getDate()).padStart(2, '0')
        setDateStr(`${year}-${month}-${day}`)
        
        const hours = String(initialDate.getHours()).padStart(2, '0')
        const minutes = String(initialDate.getMinutes()).padStart(2, '0')
        setTimeStr(`${hours}:${minutes}`)
      } else {
        // Reset to defaults when opening without initialDate
        setDateStr(getTodayStr())
        setTimeStr('')
      }
    }
  }, [isOpen, initialDate])

  useEffect(() => {
    if (selectedClient) {
      setClientName(selectedClient.name)
      setClientPhone(selectedClient.phone || '')
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
    // Combine date and time inputs into a single ISO string
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    
    if (date && time) {
      const dateTime = new Date(`${date}T${time}`)
      formData.set('appointment_date', dateTime.toISOString())
    }
    
    const result = await createAppointment(formData)
    if (result?.success) {
      setIsOpen(false)
      handleClearClient()
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
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {isNewClientMode ? 'Novo Cliente' : selectedClient?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isNewClientMode ? 'Preencha os dados abaixo' : selectedClient?.phone || 'Sem telefone'}
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
                  className={selectedClient ? 'bg-gray-100' : ''}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client_phone">Telefone (Opcional)</Label>
                <Input 
                  id="client_phone" 
                  name="client_phone" 
                  placeholder="(00) 00000-0000" 
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  readOnly={!!selectedClient}
                  className={selectedClient ? 'bg-gray-100' : ''}
                />
              </div>
            </>
          )}

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input 
                id="date" 
                name="date" 
                type="date" 
                required 
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                min={getTodayStr()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <Input 
                id="time" 
                name="time" 
                type="time" 
                required 
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
              />
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
