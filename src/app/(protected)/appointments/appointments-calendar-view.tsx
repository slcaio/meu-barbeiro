'use client'

import { useState, useCallback, useTransition, useMemo, type MouseEvent } from 'react'
import { format, addDays, subDays, addWeeks, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreateAppointmentDialog } from './create-appointment-dialog'
import { AppointmentDetailsDialog } from './appointment-details-dialog'
import { AppointmentList } from './appointment-list'
import { DayView } from './day-view'
import { WeekView } from './week-view'
import { EventActionPopover } from './event-action-popover'
import { updateAppointmentDate } from '@/app/appointments/actions'
import type { CalendarEvent } from './calendar-event'
import type { AppointmentWithRelations, ServiceOption, ClientOption, BarberOption, PaymentMethodWithInstallments, ProductOption } from '@/types/database.types'

const BARBER_COLORS = [
  { bg: '#3B82F6', border: '#2563EB', label: 'blue' },
  { bg: '#8B5CF6', border: '#7C3AED', label: 'violet' },
  { bg: '#F59E0B', border: '#D97706', label: 'amber' },
  { bg: '#EC4899', border: '#DB2777', label: 'pink' },
  { bg: '#14B8A6', border: '#0D9488', label: 'teal' },
  { bg: '#F97316', border: '#EA580C', label: 'orange' },
  { bg: '#06B6D4', border: '#0891B2', label: 'cyan' },
  { bg: '#84CC16', border: '#65A30D', label: 'lime' },
  { bg: '#E11D48', border: '#BE123C', label: 'rose' },
  { bg: '#6366F1', border: '#4F46E5', label: 'indigo' },
]

type ViewMode = 'day' | 'week' | 'list'

interface AppointmentsCalendarViewProps {
  appointments: AppointmentWithRelations[]
  services: ServiceOption[]
  clients: ClientOption[]
  barbers: BarberOption[]
  paymentMethods: PaymentMethodWithInstallments[]
  products: ProductOption[]
}

export function AppointmentsCalendarView({ appointments, services, clients, barbers, paymentMethods, products }: AppointmentsCalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [date, setDate] = useState(new Date())
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AppointmentWithRelations | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedBarberId, setSelectedBarberId] = useState<string | undefined>(undefined)
  const [eventPopover, setEventPopover] = useState<{ apt: AppointmentWithRelations; x: number; y: number } | null>(null)
  const [, startTransition] = useTransition()

  // Map barber IDs to colors
  const barberColorMap = useMemo(() => {
    const map = new Map<string, typeof BARBER_COLORS[number]>()
    barbers.forEach((barber, index) => {
      map.set(barber.id, BARBER_COLORS[index % BARBER_COLORS.length])
    })
    return map
  }, [barbers])

  // Filter appointments by selected barber
  const filteredAppointments = useMemo(() => {
    if (selectedBarberFilter === 'all') return appointments
    return appointments.filter(apt => apt.barber_id === selectedBarberFilter)
  }, [appointments, selectedBarberFilter])

  // Transform appointments → CalendarEvent objects
  const events: CalendarEvent[] = useMemo(() => {
    return filteredAppointments.map(apt => {
      const startDate = new Date(apt.appointment_date)
      const durationMinutes = apt.appointment_services.reduce((sum, as) => sum + (as.services?.duration_minutes || 0), 0) || 30
      const endDate = new Date(startDate.getTime() + durationMinutes * 60_000)
      const barberColor = apt.barber_id ? barberColorMap.get(apt.barber_id) : null

      const isCancelled = apt.status === 'cancelled'
      const isCompleted = apt.status === 'completed'

      const bgColor = isCancelled ? '#71717a' : isCompleted ? '#22c55e' : (barberColor?.bg ?? '#3B82F6')
      const borderColor = isCancelled ? '#52525b' : isCompleted ? '#16a34a' : (barberColor?.border ?? '#2563EB')

      const serviceNames = apt.appointment_services
        .map(as => as.services?.name)
        .filter(Boolean)
        .join(', ')

      return {
        id: apt.id,
        clientName: apt.client_name,
        serviceName: serviceNames || 'Serviço',
        barberName: apt.barbers?.name ?? '',
        startDate,
        endDate,
        durationMinutes,
        status: apt.status,
        bgColor,
        borderColor,
        draggable: !isCancelled && !isCompleted,
      }
    })
  }, [filteredAppointments, barberColorMap])

  // Build a lookup map from event ID → appointment data (for click handler)
  const appointmentMap = useMemo(() => {
    const map = new Map<string, AppointmentWithRelations>()
    for (const apt of filteredAppointments) {
      map.set(apt.id, apt)
    }
    return map
  }, [filteredAppointments])

  // ── Navigation ──
  const goToPrev = useCallback(() => {
    setDate(prev => {
      if (viewMode === 'day') return subDays(prev, 1)
      return subWeeks(prev, 1)
    })
  }, [viewMode])

  const goToNext = useCallback(() => {
    setDate(prev => {
      if (viewMode === 'day') return addDays(prev, 1)
      return addWeeks(prev, 1)
    })
  }, [viewMode])

  const goToToday = useCallback(() => {
    setDate(new Date())
  }, [])

  const handleCalendarSelect = useCallback((selectedDay: Date | undefined) => {
    if (selectedDay) {
      setDate(selectedDay)
      setViewMode('day')
    }
  }, [])

  // ── Event handlers ──
  const handleScheduleClick = useCallback((clickedDate: Date) => {
    setSelectedDate(clickedDate)
    setSelectedBarberId(selectedBarberFilter !== 'all' ? selectedBarberFilter : undefined)
    setIsDialogOpen(true)
  }, [selectedBarberFilter])

  const handleEventClick = useCallback((event: CalendarEvent, mouseEvent: MouseEvent<HTMLElement>) => {
    const apt = appointmentMap.get(event.id)
    if (apt) {
      setEventPopover({ apt, x: mouseEvent.clientX, y: mouseEvent.clientY })
    }
  }, [appointmentMap])

  const handleEventDrop = useCallback((eventId: string, newDate: Date) => {
    startTransition(async () => {
      const result = await updateAppointmentDate(eventId, newDate.toISOString())
      if (result.error) {
        alert(result.error)
      }
    })
  }, [])

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setTimeout(() => {
        setSelectedDate(undefined)
        setSelectedBarberId(undefined)
      }, 300)
    }
  }

  const handlePopoverViewDetails = useCallback(() => {
    if (eventPopover) {
      setSelectedEvent(eventPopover.apt)
      setIsDetailsOpen(true)
      setEventPopover(null)
    }
  }, [eventPopover])

  const handlePopoverNewAppointment = useCallback(() => {
    if (eventPopover) {
      const aptDate = new Date(eventPopover.apt.appointment_date)
      setSelectedDate(aptDate)
      setSelectedBarberId(eventPopover.apt.barber_id ?? undefined)
      setIsDialogOpen(true)
      setEventPopover(null)
    }
  }, [eventPopover])

  // ── Date label ──
  const dateLabel = useMemo(() => {
    if (viewMode === 'day') {
      return format(date, "EEEE, d 'de' MMMM", { locale: ptBR })
    }
    return format(date, "MMMM yyyy", { locale: ptBR })
  }, [date, viewMode])

  const showBarber = selectedBarberFilter === 'all'

  return (
    <div className="isolate h-[calc(100vh-200px)] sm:h-[calc(100vh-140px)] min-h-[500px] sm:min-h-[600px] bg-card p-3 sm:p-6 rounded-xl shadow-sm border flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
        {/* Row 1: Navigation + Date label */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={goToPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="h-8 px-2 sm:h-9 sm:px-3 text-sm" onClick={goToToday}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleCalendarSelect}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="min-w-0 flex-1 text-right sm:text-left sm:ml-2">
            <span className="text-sm sm:text-lg font-semibold capitalize leading-relaxed truncate">
              {dateLabel}
            </span>
          </div>
        </div>

        {/* Row 2: Barber select + Create button + View toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Barber filter */}
          <div className="flex-1 min-w-[160px] sm:flex-none sm:w-[200px]">
            <Select value={selectedBarberFilter} onValueChange={setSelectedBarberFilter}>
              <SelectTrigger className="h-8 sm:h-9 text-sm">
                <User className="h-3.5 w-3.5 mr-1.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Barbeiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os barbeiros</SelectItem>
                {barbers.map((barber, index) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: BARBER_COLORS[index % BARBER_COLORS.length].bg }}
                      />
                      {barber.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Create appointment dialog (controlled) */}
          <div className="flex-1 sm:flex-none">
            <CreateAppointmentDialog
              services={services}
              clients={clients}
              barbers={barbers}
              isOpen={isDialogOpen}
              onOpenChange={handleOpenChange}
              initialDate={selectedDate}
              initialBarberId={selectedBarberId}
            />
          </div>

          {/* View mode toggle */}
          <div className="flex bg-muted p-1 rounded-lg shrink-0 ml-auto">
            <button
              onClick={() => setViewMode('day')}
              className={`px-2 sm:px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'day' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-2 sm:px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'week' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 sm:px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Barber color legend (only when "Todos" is selected and there are barbers) */}
      {selectedBarberFilter === 'all' && barbers.length > 0 && (
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

      {/* Calendar Views */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-border bg-card">
        {viewMode === 'day' && (
          <DayView
            date={date}
            events={events}
            showBarber={showBarber}
            onEventClick={handleEventClick}
            onScheduleClick={handleScheduleClick}
            onEventDrop={handleEventDrop}
          />
        )}
        {viewMode === 'week' && (
          <WeekView
            date={date}
            events={events}
            showBarber={showBarber}
            onEventClick={handleEventClick}
            onScheduleClick={handleScheduleClick}
            onEventDrop={handleEventDrop}
          />
        )}
        {viewMode === 'list' && (
          <div className="h-full overflow-y-auto p-4">
            <AppointmentList
              appointments={filteredAppointments}
              paymentMethods={paymentMethods}
              products={products}
              barbers={barbers}
              weekDate={date}
            />
          </div>
        )}
      </div>

      {/* Details dialog */}
      <AppointmentDetailsDialog
        appointment={selectedEvent!}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        paymentMethods={paymentMethods}
        services={services}
        clients={clients}
        barbers={barbers}
        products={products}
      />

      {/* Event action popover */}
      {eventPopover && (
        <EventActionPopover
          x={eventPopover.x}
          y={eventPopover.y}
          onViewDetails={handlePopoverViewDetails}
          onNewAppointment={handlePopoverNewAppointment}
          onClose={() => setEventPopover(null)}
        />
      )}
    </div>
  )
}
