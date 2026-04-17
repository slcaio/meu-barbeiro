'use client'

import { useState, useEffect } from 'react'
import { X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/submit-button'
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
import { updateAppointment } from '@/app/appointments/actions'
import { ClientSelector } from './client-selector'
import { ServiceMultiSelect } from './service-multi-select'
import type { AppointmentWithRelations, ServiceOption, BarberOption } from '@/types/database.types'

interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
}

const disablePastDates = (date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))

interface EditAppointmentDialogProps {
  appointment: AppointmentWithRelations
  services: ServiceOption[]
  clients: Client[]
  barbers: BarberOption[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function EditAppointmentDialog({ appointment, services, clients, barbers, isOpen, onOpenChange }: EditAppointmentDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={() => onOpenChange(false)} title="Editar Agendamento">
      {isOpen && (
        <EditAppointmentFormContent
          appointment={appointment}
          services={services}
          clients={clients}
          barbers={barbers}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Modal>
  )
}

function EditAppointmentFormContent({ appointment, services, clients, barbers, onClose }: {
  appointment: AppointmentWithRelations
  services: ServiceOption[]
  clients: Client[]
  barbers: BarberOption[]
  onClose: () => void
}) {
  // Pre-populate client state
  const existingClient = appointment.client_id
    ? clients.find(c => c.id === appointment.client_id) || null
    : null

  const [selectedClient, setSelectedClient] = useState<Client | null>(existingClient)
  const [isNewClientMode, setIsNewClientMode] = useState(false)

  const [clientName, setClientName] = useState(appointment.client_name)
  const [clientPhone, setClientPhone] = useState(appointment.client_phone ? formatPhone(appointment.client_phone) : '')

  // Pre-populate services from appointment_services
  const [serviceIds, setServiceIds] = useState<string[]>(
    appointment.appointment_services.map(as => as.service_id)
  )
  const [barberId, setBarberId] = useState(appointment.barber_id ?? '')

  // Pre-populate date/time from appointment_date
  const appointmentDate = new Date(appointment.appointment_date)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(appointmentDate)
  const [timeStr, setTimeStr] = useState(
    `${String(appointmentDate.getHours()).padStart(2, '0')}:${String(appointmentDate.getMinutes()).padStart(2, '0')}`
  )
  const [notes, setNotes] = useState(appointment.notes || '')

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

  const handleSubmit = async (formData: FormData) => {
    if (selectedDate && timeStr) {
      const [hours, minutes] = timeStr.split(':')
      const dateTime = new Date(selectedDate)
      dateTime.setHours(Number(hours), Number(minutes), 0, 0)
      formData.set('appointment_date', dateTime.toISOString())
    }

    const result = await updateAppointment(formData)
    if (result?.success) {
      onClose()
    } else if (result?.error) {
      alert(result.error)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="id" value={appointment.id} />
      <input type="hidden" name="client_id" value={selectedClient?.id || ''} />
      <input type="hidden" name="is_new_client" value={isNewClientMode ? 'true' : 'false'} />
      <input type="hidden" name="service_ids" value={JSON.stringify(serviceIds)} />

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
            <Button size="sm" variant="ghost" onClick={handleClearClient} type="button">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {(selectedClient || isNewClientMode) && (
        <>
          <div className="space-y-2">
            <Label htmlFor="edit_client_name">Nome do Cliente</Label>
            <Input
              id="edit_client_name"
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
            <Label htmlFor="edit_client_phone">Telefone (Opcional)</Label>
            <Input
              id="edit_client_phone"
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

      {/* If no client section visible, still send names as hidden */}
      {!selectedClient && !isNewClientMode && (
        <>
          <input type="hidden" name="client_name" value={appointment.client_name} />
          <input type="hidden" name="client_phone" value={appointment.client_phone} />
        </>
      )}

      <ServiceMultiSelect
        services={services}
        selectedIds={serviceIds}
        onChange={setServiceIds}
      />

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
        <Label htmlFor="edit_notes">Observações (Opcional)</Label>
        <Input
          id="edit_notes"
          name="notes"
          placeholder="Ex: Cliente novo, corte específico..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="pt-4 flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <SubmitButton pendingText="Salvando...">Salvar Alterações</SubmitButton>
      </div>
    </form>
  )
}
