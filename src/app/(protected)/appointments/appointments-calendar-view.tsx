'use client'

import { useState, useCallback, useTransition, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CreateAppointmentDialog } from './create-appointment-dialog'
import { AppointmentDetailsDialog } from './appointment-details-dialog'
import { updateAppointmentDate } from '@/app/appointments/actions'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AppointmentWithRelations, ServiceOption, ClientOption, BarberOption, PaymentMethodWithInstallments } from '@/types/database.types'

const locales = {
  'pt-BR': ptBR,
}

const CALENDAR_START_HOUR = 6
const CALENDAR_END_HOUR = 23 // 23:59 end of day

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: AppointmentWithRelations
  status: string
}

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar)

const BARBER_COLORS = [
  { bg: '#3B82F6', border: '#2563EB', label: 'blue' },    // blue
  { bg: '#8B5CF6', border: '#7C3AED', label: 'violet' },  // violet
  { bg: '#F59E0B', border: '#D97706', label: 'amber' },   // amber
  { bg: '#EC4899', border: '#DB2777', label: 'pink' },     // pink
  { bg: '#14B8A6', border: '#0D9488', label: 'teal' },     // teal
  { bg: '#F97316', border: '#EA580C', label: 'orange' },   // orange
  { bg: '#06B6D4', border: '#0891B2', label: 'cyan' },     // cyan
  { bg: '#84CC16', border: '#65A30D', label: 'lime' },     // lime
  { bg: '#E11D48', border: '#BE123C', label: 'rose' },     // rose
  { bg: '#6366F1', border: '#4F46E5', label: 'indigo' },   // indigo
]

interface AppointmentsCalendarViewProps {
  appointments: AppointmentWithRelations[]
  services: ServiceOption[]
  clients: ClientOption[]
  barbers: BarberOption[]
  paymentMethods: PaymentMethodWithInstallments[]
}

export function AppointmentsCalendarView({ appointments, services, clients, barbers, paymentMethods }: AppointmentsCalendarViewProps) {
  const [view, setView] = useState<View>(Views.DAY)
  const [date, setDate] = useState(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AppointmentWithRelations | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isPending, startTransition] = useTransition()
  const [filterBarberId, setFilterBarberId] = useState<string>('')

  // Map barber IDs to colors
  const barberColorMap = useMemo(() => {
    const map = new Map<string, typeof BARBER_COLORS[number]>()
    barbers.forEach((barber, index) => {
      map.set(barber.id, BARBER_COLORS[index % BARBER_COLORS.length])
    })
    return map
  }, [barbers])

  // Transform appointments to events (filtered by barber)
  const filteredAppointments = filterBarberId
    ? appointments.filter(apt => apt.barber_id === filterBarberId)
    : appointments

  const events = filteredAppointments.map(apt => {
    const start = new Date(apt.appointment_date)
    // Calculate end time based on service duration
    const duration = apt.services?.duration_minutes || 30
    const end = new Date(start.getTime() + duration * 60000)
    
    return {
      id: apt.id,
      title: `${apt.client_name} - ${apt.services?.name}${apt.barbers?.name ? ` (${apt.barbers.name})` : ''}`,
      start,
      end,
      resource: apt,
      status: apt.status
    }
  })

  const onSelectSlot = useCallback(({ start }: { start: Date }) => {
    setSelectedDate(start)
    setIsDialogOpen(true)
  }, [])

  const onSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event.resource)
    setIsDetailsOpen(true)
  }, [])

  const onEventDrop = useCallback(({ event, start }: { event: CalendarEvent; start: string | Date }) => {
    // Optimistic update logic could go here, but for now relying on revalidation
    startTransition(async () => {
       const newDate = typeof start === 'string' ? start : start.toISOString()
       const result = await updateAppointmentDate(event.id, newDate)
       if (result.error) {
         alert(result.error)
       }
    })
  }, [])

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      // Small delay to allow animation to finish or just clear it immediately
      // If we clear immediately, the modal might see undefined date while closing
      // But CreateAppointmentDialog handles isOpen && !initialDate case
      setTimeout(() => setSelectedDate(undefined), 300)
    }
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    const barberId = event.resource.barber_id
    const barberColor = barberId ? barberColorMap.get(barberId) : null
    const backgroundColor = barberColor?.bg ?? '#3174ad'
    const borderColor = barberColor?.border ?? '#2563a3'

    const isCancelled = event.status === 'cancelled'
    const isCompleted = event.status === 'completed'

    return {
      style: {
        backgroundColor: isCancelled ? '#71717a' : backgroundColor,
        borderRadius: '4px',
        opacity: isCancelled ? 0.5 : isCompleted ? 0.7 : 0.9,
        color: 'white',
        borderTop: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        borderLeft: `3px solid ${isCancelled ? '#52525b' : borderColor}`,
        display: 'block',
        textDecoration: isCancelled ? 'line-through' : 'none',
        overflow: 'hidden',
      }
    }
  }

  const CustomToolbar = (toolbar: { date: Date; onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void; onView: (view: View) => void }) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV')
    }
    const goToNext = () => {
      toolbar.onNavigate('NEXT')
    }
    const goToCurrent = () => {
      toolbar.onNavigate('TODAY')
    }

    const label = () => {
      const date = toolbar.date
      return (
        <span className="text-sm sm:text-lg font-semibold capitalize leading-relaxed truncate">
          {format(date, view === Views.DAY ? "EEEE, d 'de' MMMM" : "MMMM yyyy", { locale: ptBR })}
        </span>
      )
    }

    return (
      <div className="flex flex-col gap-3 mb-4 px-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={goToBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="h-8 px-2 sm:h-9 sm:px-3 text-sm" onClick={goToCurrent}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-w-0 flex-1 text-right sm:text-left sm:ml-2">{label()}</div>
        </div>

        <div className="flex items-center justify-between gap-2">
          {barbers.length > 0 && (
            <select
              value={filterBarberId}
              onChange={(e) => setFilterBarberId(e.target.value)}
              className="h-8 sm:h-9 flex-1 sm:flex-none rounded-md border border-input bg-background px-2 sm:px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Todos os barbeiros</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>{barber.name}</option>
              ))}
            </select>
          )}

          <div className="flex bg-muted p-1 rounded-lg shrink-0">
            <button
              onClick={() => toolbar.onView(Views.DAY)}
              className={`px-2 sm:px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                view === Views.DAY ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => toolbar.onView(Views.WEEK)}
              className={`px-2 sm:px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                view === Views.WEEK ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Semana
            </button>
          </div>
        </div>
      </div>
    )
  }

  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
    const clientName = event.resource.client_name
    const serviceName = event.resource.services?.name ?? ''
    const barberName = event.resource.barbers?.name ?? ''
    const startTime = format(event.start, 'HH:mm')
    const endTime = format(event.end, 'HH:mm')

    return (
      <div className="flex flex-col h-full overflow-hidden leading-tight px-1 py-0.5">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-[10px] opacity-75 shrink-0">{startTime}–{endTime}</span>
          <span className="text-xs font-semibold truncate">{clientName}</span>
        </div>
        <div className="text-[10px] opacity-90 truncate">
          {serviceName}{barberName ? ` · ${barberName}` : ''}
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-200px)] sm:h-[calc(100vh-140px)] min-h-[500px] sm:min-h-[600px] bg-card p-3 sm:p-6 rounded-xl shadow-sm border flex flex-col overflow-hidden">
      {barbers.length > 0 && (
        <div className="flex items-center gap-3 mb-2 flex-shrink-0 flex-wrap">
          {barbers.map((barber, index) => {
            const color = BARBER_COLORS[index % BARBER_COLORS.length]
            return (
              <div key={barber.id} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: color.bg }}
                />
                <span className="text-xs text-muted-foreground">{barber.name}</span>
              </div>
            )
          })}
        </div>
      )}
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
         <h2 className="text-xl font-bold hidden">Calendário</h2>
         <CreateAppointmentDialog 
            services={services} 
            clients={clients}
            barbers={barbers}
            isOpen={isDialogOpen}
            onOpenChange={handleOpenChange}
            initialDate={selectedDate}
         />
      </div>
      <div className="flex-1 calendar-container min-h-0 overflow-hidden">
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          selectable
          onSelectSlot={onSelectSlot}
          onSelectEvent={onSelectEvent}
          onEventDrop={onEventDrop}
          resizable={false}
          culture="pt-BR"
          components={{
            toolbar: CustomToolbar,
            event: CustomEvent
          }}
          formats={{
             dayFormat: (date, culture, localizer) => 
               localizer?.format(date, 'dd EEEE', culture) ?? '',
             weekdayFormat: (date, culture, localizer) =>
                localizer?.format(date, 'EEE', culture) ?? '',
             eventTimeRangeFormat: () => null,
          }}
          views={[Views.DAY, Views.WEEK]}
          step={30}
          timeslots={2}
          eventPropGetter={eventStyleGetter}
          min={new Date(0, 0, 0, CALENDAR_START_HOUR, 0, 0)}
          max={new Date(0, 0, 0, CALENDAR_END_HOUR, 59, 59)}
        />
        
        <AppointmentDetailsDialog
          appointment={selectedEvent!}
          isOpen={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          paymentMethods={paymentMethods}
        />
      </div>
    </div>
  )
}
