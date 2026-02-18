'use client'

import { Button } from '@/components/ui/button'
import { updateAppointmentStatus } from '@/app/appointments/actions'
import { Check, X, Clock } from 'lucide-react'
import { useTransition } from 'react'

export function AppointmentList({ appointments }: { appointments: any[] }) {
  const [isPending, startTransition] = useTransition()

  const handleStatusUpdate = (id: string, status: 'confirmed' | 'completed' | 'cancelled') => {
    startTransition(async () => {
      await updateAppointmentStatus(id, status)
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
                apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                apt.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                apt.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {apt.status === 'scheduled' ? 'Agendado' : 
                 apt.status === 'confirmed' ? 'Confirmado' : 
                 apt.status === 'completed' ? 'Concluído' : 'Cancelado'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(apt.appointment_date).toLocaleDateString('pt-BR')} às {new Date(apt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-sm text-gray-500">
              {apt.services?.name} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(apt.total_amount)}
            </p>
            {apt.notes && <p className="text-xs text-gray-400 mt-1 italic">"{apt.notes}"</p>}
          </div>
          
          <div className="flex items-center gap-2">
            {apt.status === 'scheduled' && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                  disabled={isPending}
                >
                  <Check className="h-4 w-4 mr-1" /> Confirmar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
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
                className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                onClick={() => handleStatusUpdate(apt.id, 'completed')}
                disabled={isPending}
              >
                <Clock className="h-4 w-4 mr-1" /> Concluir
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
