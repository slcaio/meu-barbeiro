'use client'

import { useState, useCallback, useTransition } from 'react'
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
  resource: any
  status: string
}

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar)

interface AppointmentsCalendarViewProps {
  appointments: any[]
  services: any[]
  clients: any[]
}

export function AppointmentsCalendarView({ appointments, services, clients }: AppointmentsCalendarViewProps) {
  console.log('Appointments received:', appointments)
  const [view, setView] = useState<View>(Views.DAY)
  const [date, setDate] = useState(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isPending, startTransition] = useTransition()

  // Transform appointments to events
  const events = appointments.map(apt => {
    const start = new Date(apt.appointment_date)
    // Calculate end time based on service duration
    const duration = apt.services?.duration_minutes || 30
    const end = new Date(start.getTime() + duration * 60000)
    
    return {
      id: apt.id,
      title: `${apt.client_name} - ${apt.services?.name}`,
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

  const onSelectEvent = useCallback((event: any) => {
    setSelectedEvent(event.resource)
    setIsDetailsOpen(true)
  }, [])

  const onEventDrop = useCallback(({ event, start, end }: any) => {
    // Optimistic update logic could go here, but for now relying on revalidation
    startTransition(async () => {
       const result = await updateAppointmentDate(event.id, start.toISOString())
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

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#3174ad'
    if (event.status === 'confirmed') backgroundColor = '#10B981' // green-500
    if (event.status === 'completed') backgroundColor = '#10B981' // green-500
    if (event.status === 'cancelled') backgroundColor = '#EF4444' // red-500
    if (event.status === 'scheduled') backgroundColor = '#3B82F6' // blue-500

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  const CustomToolbar = (toolbar: any) => {
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
        <span className="text-lg font-semibold capitalize whitespace-nowrap leading-relaxed">
          {format(date, view === Views.DAY ? "EEEE, d 'de' MMMM" : "MMMM yyyy", { locale: ptBR })}
        </span>
      )
    }

    return (
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <Button variant="outline" size="icon" onClick={goToBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToCurrent}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-4 truncate">{label()}</div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => toolbar.onView(Views.DAY)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              view === Views.DAY ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Dia
          </button>
          <button
            onClick={() => toolbar.onView(Views.WEEK)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              view === Views.WEEK ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Semana
          </button>
        </div>
      </div>
    )
  }

  const CustomEvent = ({ event }: any) => {
    return (
      <div className="flex flex-col h-full overflow-hidden leading-tight">
        <div className="text-xs font-semibold mb-0.5">
           {event.title.split(' - ')[0]}
        </div>
        <div className="text-[10px] opacity-90 truncate">
           {event.title.split(' - ')[1]}
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-140px)] min-h-[600px] bg-white p-6 rounded-xl shadow-sm border flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
         <h2 className="text-xl font-bold hidden">Calendário</h2>
         <CreateAppointmentDialog 
            services={services} 
            clients={clients} 
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
          }}
          views={[Views.DAY, Views.WEEK]}
          step={30}
          timeslots={2}
          eventPropGetter={eventStyleGetter}
          min={new Date(0, 0, 0, CALENDAR_START_HOUR, 0, 0)}
          max={new Date(0, 0, 0, CALENDAR_END_HOUR, 59, 59)}
        />
        
        <AppointmentDetailsDialog
          appointment={selectedEvent}
          isOpen={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        />
      </div>
    </div>
  )
}
