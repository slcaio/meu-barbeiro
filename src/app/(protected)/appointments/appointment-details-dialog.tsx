'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, X, User, Phone, Scissors, Calendar, FileText, Info } from 'lucide-react'
import { AppointmentPOSDialog } from './appointment-pos-dialog'

interface AppointmentDetailsDialogProps {
  appointment: any
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function AppointmentDetailsDialog({
  appointment,
  isOpen,
  onOpenChange,
}: AppointmentDetailsDialogProps) {
  const [posOpen, setPosOpen] = useState(false)
  const [posAction, setPosAction] = useState<'complete' | 'cancel'>('complete')

  if (!appointment) return null

  const handleStatusChange = (status: 'completed' | 'cancelled') => {
    setPosAction(status === 'completed' ? 'complete' : 'cancel')
    setPosOpen(true)
    onOpenChange(false)
  }

  const statusLabels: Record<string, string> = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  }

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={() => onOpenChange(false)} title="Detalhes do Agendamento">
        <div className="space-y-6">
          
          {/* Client Info Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{appointment.client_name}</h4>
                  <div className="flex items-center text-sm text-gray-500 gap-1">
                     <Phone className="h-3 w-3" />
                     <span>{appointment.client_phone || 'Sem telefone'}</span>
                  </div>
                </div>
             </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-4">
             <div className="flex items-start gap-3">
                <div className="mt-0.5 text-gray-400">
                   <Scissors className="h-5 w-5" />
                </div>
                <div>
                   <span className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Serviço</span>
                   <span className="text-gray-900 font-medium">{appointment.services?.name}</span>
                </div>
             </div>

             <div className="flex items-start gap-3">
                <div className="mt-0.5 text-gray-400">
                   <Calendar className="h-5 w-5" />
                </div>
                <div>
                   <span className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Data e Hora</span>
                   <span className="text-gray-900 font-medium capitalize">
                     {format(new Date(appointment.appointment_date), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                   </span>
                </div>
             </div>

             <div className="flex items-start gap-3">
                <div className="mt-0.5 text-gray-400">
                   <Info className="h-5 w-5" />
                </div>
                <div>
                   <span className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
                   <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${statusColors[appointment.status] || 'bg-gray-100 text-gray-800'}`}>
                     {statusLabels[appointment.status] || appointment.status}
                   </span>
                </div>
             </div>

             {appointment.notes && (
               <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-gray-400">
                     <FileText className="h-5 w-5" />
                  </div>
                  <div>
                     <span className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Observações</span>
                     <p className="text-gray-700 text-sm mt-0.5">{appointment.notes}</p>
                  </div>
               </div>
             )}
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t">
            <Button
              variant="outline"
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={() => handleStatusChange('cancelled')}
              disabled={appointment.status === 'cancelled'}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => handleStatusChange('completed')}
              disabled={appointment.status === 'completed'}
            >
              <Check className="mr-2 h-4 w-4" />
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
      />
    </>
  )
}
