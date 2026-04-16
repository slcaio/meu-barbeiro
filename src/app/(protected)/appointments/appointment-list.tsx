'use client'

import { Button } from '@/components/ui/button'
import { updateAppointmentStatus } from '@/app/appointments/actions'
import { Check, X, Clock } from 'lucide-react'
import { useTransition, useState } from 'react'
import { AppointmentPOSDialog } from './appointment-pos-dialog'
import type { AppointmentWithRelations, PaymentMethodWithInstallments } from '@/types/database.types'

export function AppointmentList({ appointments, paymentMethods = [] }: { appointments: AppointmentWithRelations[]; paymentMethods?: PaymentMethodWithInstallments[] }) {
  const [isPending, startTransition] = useTransition()
  const [posOpen, setPosOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null)
  const [posAction, setPosAction] = useState<'complete' | 'cancel'>('complete')

  const handleStatusUpdate = (apt: AppointmentWithRelations, status: 'confirmed' | 'completed' | 'cancelled') => {
    if (status === 'completed' || status === 'cancelled') {
      setSelectedAppointment(apt)
      setPosAction(status === 'completed' ? 'complete' : 'cancel')
      setPosOpen(true)
      return
    }

    startTransition(async () => {
      await updateAppointmentStatus(apt.id, status)
    })
  }

  if (appointments.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nenhum agendamento encontrado.</p>
  }

  return (
    <div className="space-y-4">
      {appointments.map((apt) => (
        <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 last:border-0 last:pb-0 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-lg">{apt.client_name}</p>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                apt.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                apt.status === 'scheduled' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                apt.status === 'completed' ? 'bg-muted text-muted-foreground' :
                'bg-red-500/10 text-red-600 dark:text-red-400'
              }`}>
                {apt.status === 'scheduled' ? 'Agendado' : 
                 apt.status === 'confirmed' ? 'Confirmado' : 
                 apt.status === 'completed' ? 'Concluído' : 'Cancelado'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(apt.appointment_date).toLocaleDateString('pt-BR')} às {new Date(apt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-sm text-muted-foreground">
              {apt.appointment_services.map(as => as.services?.name).filter(Boolean).join(', ')} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(apt.total_amount)}
            </p>
            {apt.notes && <p className="text-xs text-muted-foreground/70 mt-1 italic">"{apt.notes}"</p>}
          </div>
          
          <div className="flex items-center gap-2">
            {apt.status === 'scheduled' && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-green-600 hover:text-green-700 hover:bg-emerald-500/10"
                  onClick={() => handleStatusUpdate(apt, 'confirmed')}
                  disabled={isPending}
                >
                  <Check className="h-4 w-4 mr-1" /> Confirmar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                  onClick={() => handleStatusUpdate(apt, 'cancelled')}
                  disabled={isPending}
                >
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
              </>
            )}
            {apt.status === 'confirmed' && (
              <Button 
                size="sm" 
                variant="outline" 
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => handleStatusUpdate(apt, 'completed')}
                disabled={isPending}
              >
                <Clock className="h-4 w-4 mr-1" /> Concluir
              </Button>
            )}
          </div>
        </div>
      ))}
      <AppointmentPOSDialog 
        appointment={selectedAppointment!}
        isOpen={posOpen}
        onOpenChange={setPosOpen}
        action={posAction}
        paymentMethods={paymentMethods}
      />
    </div>
  )
}
