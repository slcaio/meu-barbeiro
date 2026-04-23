'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, X, User, Phone, Scissors, Calendar, FileText, Info, Pencil } from 'lucide-react'
import { AppointmentPOSDialog } from './appointment-pos-dialog'
import { EditAppointmentDialog } from './edit-appointment-dialog'
import { formatPhone } from '@/lib/utils'
import type { AppointmentWithRelations, PaymentMethodWithInstallments, ServiceOption, BarberOption, ProductOption } from '@/types/database.types'

interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
}

interface AppointmentDetailsDialogProps {
  appointment: AppointmentWithRelations
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  paymentMethods: PaymentMethodWithInstallments[]
  services: ServiceOption[]
  clients: Client[]
  barbers: BarberOption[]
  products: ProductOption[]
}

export function AppointmentDetailsDialog({
  appointment,
  isOpen,
  onOpenChange,
  paymentMethods,
  services,
  clients,
  barbers,
  products,
}: AppointmentDetailsDialogProps) {
  const [posOpen, setPosOpen] = useState(false)
  const [posAction, setPosAction] = useState<'complete' | 'cancel'>('complete')
  const [editOpen, setEditOpen] = useState(false)

  if (!appointment) return null

  const handleStatusChange = (status: 'completed' | 'cancelled') => {
    setPosAction(status === 'completed' ? 'complete' : 'cancel')
    setPosOpen(true)
    onOpenChange(false)
  }

  const handleEdit = () => {
    onOpenChange(false)
    setEditOpen(true)
  }

  const statusLabels: Record<string, string> = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  }

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    confirmed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={() => onOpenChange(false)} title="Detalhes do Agendamento">
        <div className="space-y-6">
          
          {/* Client Info Section */}
          <div className="bg-muted p-4 rounded-lg border border-border space-y-3">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{appointment.client_name}</h4>
                  <div className="flex items-center text-sm text-muted-foreground gap-1">
                     <Phone className="h-3 w-3" />
                     <span>{appointment.client_phone ? formatPhone(appointment.client_phone) : 'Sem telefone'}</span>
                  </div>
                </div>
             </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-4">
             <div className="flex items-start gap-3">
                <div className="mt-0.5 text-muted-foreground">
                   <Scissors className="h-5 w-5" />
                </div>
                <div>
                   <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                     {appointment.appointment_services.length > 1 ? 'Serviços' : 'Serviço'}
                   </span>
                   <div className="space-y-1">
                     {appointment.appointment_services.map((as) => (
                       <div key={as.service_id} className="text-foreground font-medium">
                         {as.services?.name}
                         <span className="text-sm text-muted-foreground ml-1">
                           ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(as.price_at_time)})
                         </span>
                       </div>
                     ))}
                   </div>
                   {appointment.barbers?.name && (
                     <span className="text-sm text-muted-foreground mt-1 block">Barbeiro: {appointment.barbers.name}</span>
                   )}
                </div>
             </div>

             <div className="flex items-start gap-3">
                <div className="mt-0.5 text-muted-foreground">
                   <Calendar className="h-5 w-5" />
                </div>
                <div>
                   <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Data e Hora</span>
                   <span className="text-foreground font-medium capitalize">
                     {format(new Date(appointment.appointment_date), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                   </span>
                </div>
             </div>

             <div className="flex items-start gap-3">
                <div className="mt-0.5 text-muted-foreground">
                   <Info className="h-5 w-5" />
                </div>
                <div>
                   <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</span>
                   <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${statusColors[appointment.status] || 'bg-muted text-muted-foreground'}`}>
                     {statusLabels[appointment.status] || appointment.status}
                   </span>
                   {appointment.batch_id && (
                     <p className="text-sm text-muted-foreground mt-2">
                       Este atendimento faz parte de um pacote mensal.
                       {appointment.payment_status === 'paid' ? ' Os serviços já foram quitados antecipadamente.' : ''}
                     </p>
                   )}
                </div>
             </div>

             {appointment.notes && (
               <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-muted-foreground">
                     <FileText className="h-5 w-5" />
                  </div>
                  <div>
                     <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Observações</span>
                     <p className="text-foreground/80 text-sm mt-0.5">{appointment.notes}</p>
                  </div>
               </div>
             )}
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t">
            <Button
              variant="outline"
              className="flex-1 px-2 gap-1 text-xs sm:text-sm sm:px-4 sm:gap-2"
              onClick={handleEdit}
            >
              <Pencil className="h-4 w-4 shrink-0" />
              Editar
            </Button>
            <Button
              variant="outline"
              className="flex-1 px-2 gap-1 text-xs sm:text-sm sm:px-4 sm:gap-2 text-red-600 hover:text-red-700 hover:bg-red-500/10 border-red-200 dark:border-red-500/20"
              onClick={() => handleStatusChange('cancelled')}
              disabled={appointment.status === 'cancelled'}
            >
              <X className="h-4 w-4 shrink-0" />
              Cancelar
            </Button>
            <Button
              className="flex-1 px-2 gap-1 text-xs sm:text-sm sm:px-4 sm:gap-2"
              onClick={() => handleStatusChange('completed')}
              disabled={appointment.status === 'completed'}
            >
              <Check className="h-4 w-4 shrink-0" />
              Concluir
            </Button>
          </div>
        </div>
      </Modal>

      <AppointmentPOSDialog
        appointment={appointment}
        isOpen={posOpen}
        onOpenChange={setPosOpen}
        action={posAction}
        paymentMethods={paymentMethods}
        products={products}
        barbers={barbers}
      />

      <EditAppointmentDialog
        appointment={appointment}
        services={services}
        clients={clients}
        barbers={barbers}
        isOpen={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
