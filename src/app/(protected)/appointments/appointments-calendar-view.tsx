'use client'

import { useState, useCallback, useTransition, useMemo, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CreateAppointmentDialog } from './create-appointment-dialog'
import { AppointmentDetailsDialog } from './appointment-details-dialog'
import { updateAppointmentDate } from '@/app/appointments/actions'
import { schedulerConfig, CALENDAR_START_HOUR, CALENDAR_END_HOUR } from './scheduler-config'
import { useTheme } from 'next-themes'
import type { BryntumScheduler } from '@bryntum/scheduler-react'
import type { EventModel } from '@bryntum/scheduler'
import type { AppointmentWithRelations, ServiceOption, ClientOption, BarberOption, PaymentMethodWithInstallments } from '@/types/database.types'

// Bryntum CSS — structural + dark theme base (provides all component rendering)
import '@bryntum/scheduler/scheduler.css'
import '@bryntum/scheduler/svalbard-dark.css'

// Custom overrides — remaps Bryntum's neutral palette to our CSS variables for auto light/dark
import './scheduler-theme.css'

// Dynamic import — Bryntum is client-only (no SSR)
const SchedulerWrapper = dynamic(
  () => import('@/components/bryntum/scheduler-wrapper'),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center text-muted-foreground">Carregando agenda...</div> }
)

/** Escape HTML entities to prevent XSS in Bryntum HTML string renderers */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const NO_BARBER_RESOURCE_ID = '__no-barber__'

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

type ViewMode = 'day' | 'week'

interface AppointmentsCalendarViewProps {
  appointments: AppointmentWithRelations[]
  services: ServiceOption[]
  clients: ClientOption[]
  barbers: BarberOption[]
  paymentMethods: PaymentMethodWithInstallments[]
}

export function AppointmentsCalendarView({ appointments, services, clients, barbers, paymentMethods }: AppointmentsCalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [date, setDate] = useState(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AppointmentWithRelations | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isPending, startTransition] = useTransition()
  const schedulerRef = useRef<BryntumScheduler>(null)
  const { resolvedTheme } = useTheme()

  // Force Bryntum to repaint when theme changes (CSS variables handle the actual colors)
  useEffect(() => {
    // Small delay so CSS variables from .dark class have been applied by the browser
    const timer = setTimeout(() => {
      const scheduler = schedulerRef.current?.instance
      if (scheduler && !scheduler.isDestroyed) {
        scheduler.element?.classList.remove('b-theme-svalbard-dark', 'b-theme-svalbard-light')
        scheduler.renderContents()
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [resolvedTheme])

  // Map barber IDs to colors
  const barberColorMap = useMemo(() => {
    const map = new Map<string, typeof BARBER_COLORS[number]>()
    barbers.forEach((barber, index) => {
      map.set(barber.id, BARBER_COLORS[index % BARBER_COLORS.length])
    })
    return map
  }, [barbers])

  // Transform barbers → Bryntum Resources
  const resources = useMemo(() => {
    const res = barbers.map((barber, index) => ({
      id: barber.id,
      name: barber.name,
      eventColor: BARBER_COLORS[index % BARBER_COLORS.length].bg,
    }))

    // Fallback resource for appointments without a barber
    const hasUnassigned = appointments.some(apt => !apt.barber_id)
    if (hasUnassigned || barbers.length === 0) {
      res.push({
        id: NO_BARBER_RESOURCE_ID,
        name: 'Sem barbeiro',
        eventColor: '#71717a',
      })
    }

    return res
  }, [barbers, appointments])

  // Transform appointments → Bryntum Events
  const events = useMemo(() => {
    return appointments.map(apt => {
      const startDate = new Date(apt.appointment_date)
      const duration = apt.services?.duration_minutes || 30
      const endDate = new Date(startDate.getTime() + duration * 60000)
      const barberId = apt.barber_id || NO_BARBER_RESOURCE_ID
      const barberColor = apt.barber_id ? barberColorMap.get(apt.barber_id) : null

      const isCancelled = apt.status === 'cancelled'
      const isCompleted = apt.status === 'completed'

      const eventCls = isCancelled
        ? 'event-cancelled'
        : isCompleted
          ? 'event-completed'
          : ''

      const bgColor = isCancelled ? '#71717a' : (barberColor?.bg ?? '#3174ad')
      const borderColor = isCancelled ? '#52525b' : (barberColor?.border ?? '#2563EB')

      return {
        id: apt.id,
        resourceId: barberId,
        name: `${apt.client_name} - ${apt.services?.name || 'Serviço'}`,
        startDate,
        endDate,
        eventColor: bgColor,
        style: `background:${bgColor};border-left:3px solid ${borderColor};`,
        cls: eventCls,
        // Custom data
        appointmentData: apt,
        clientName: apt.client_name,
        serviceName: apt.services?.name ?? '',
        barberName: apt.barbers?.name ?? '',
        clientPhone: apt.client_phone,
        status: apt.status,
        servicePrice: apt.services?.price,
        serviceDuration: apt.services?.duration_minutes,
        notes: apt.notes,
        draggable: !isCancelled && !isCompleted,
        resizable: false,
      }
    })
  }, [appointments, barberColorMap])

  // Calculate time span based on view mode and date
  const timeSpan = useMemo(() => {
    if (viewMode === 'day') {
      const start = startOfDay(date)
      start.setHours(CALENDAR_START_HOUR, 0, 0, 0)
      const end = startOfDay(date)
      end.setHours(CALENDAR_END_HOUR, 59, 59, 999)
      return { startDate: start, endDate: end }
    }
    const weekStart = startOfWeek(date, { locale: ptBR })
    weekStart.setHours(CALENDAR_START_HOUR, 0, 0, 0)
    const weekEnd = endOfWeek(date, { locale: ptBR })
    weekEnd.setHours(CALENDAR_END_HOUR, 59, 59, 999)
    return { startDate: weekStart, endDate: weekEnd }
  }, [viewMode, date])

  // Stable initial time span for Scheduler mount — never changes.
  // All subsequent navigation is handled atomically via setTimeSpan() below.
  const [initialTimeSpan] = useState(() => {
    const start = startOfDay(new Date())
    start.setHours(CALENDAR_START_HOUR, 0, 0, 0)
    const end = startOfDay(new Date())
    end.setHours(CALENDAR_END_HOUR, 59, 59, 999)
    return { startDate: start, endDate: end }
  })

  // Atomically update start/end dates to avoid Bryntum "start > end" race condition.
  // Passing startDate & endDate as separate dynamic props causes Bryntum to process
  // them individually, leading to a transient invalid range when navigating backward.
  useEffect(() => {
    const scheduler = schedulerRef.current?.instance
    if (scheduler && !scheduler.isDestroyed) {
      scheduler.setTimeSpan(timeSpan.startDate, timeSpan.endDate)
    }
  }, [timeSpan])

  // ── Navigation ──
  const goToPrev = useCallback(() => {
    setDate(prev => viewMode === 'day' ? subDays(prev, 1) : subDays(prev, 7))
  }, [viewMode])

  const goToNext = useCallback(() => {
    setDate(prev => viewMode === 'day' ? addDays(prev, 1) : addDays(prev, 7))
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
  const handleScheduleClick = useCallback(({ date: clickedDate }: { date: Date }) => {
    if (clickedDate) {
      setSelectedDate(clickedDate)
      setIsDialogOpen(true)
    }
  }, [])

  const handleEventClick = useCallback(({ eventRecord }: { eventRecord: EventModel }) => {
    const aptData = (eventRecord as unknown as Record<string, unknown>).appointmentData as AppointmentWithRelations | undefined
    if (aptData) {
      setSelectedEvent(aptData)
      setIsDetailsOpen(true)
    }
  }, [])

  const handleEventDrop = useCallback(({ eventRecords }: { eventRecords: EventModel[]; context: object }) => {
    const eventRecord = eventRecords[0] as unknown as Record<string, unknown>
    if (!eventRecord) return

    const eventId = eventRecord.id as string
    const newStartDate = eventRecord.startDate as Date
    const newResourceId = eventRecord.resourceId as string

    const originalApt = eventRecord.appointmentData as AppointmentWithRelations | undefined
    const originalBarberId = originalApt?.barber_id || NO_BARBER_RESOURCE_ID
    const barberChanged = newResourceId !== originalBarberId
    const newBarberId = newResourceId === NO_BARBER_RESOURCE_ID ? null : newResourceId

    startTransition(async () => {
      const result = await updateAppointmentDate(
        eventId,
        newStartDate.toISOString(),
        barberChanged ? (newBarberId ?? undefined) : undefined
      )
      if (result.error) {
        alert(result.error)
      }
    })
  }, [])

  const handleBeforeEventEdit = useCallback(() => {
    return false
  }, [])

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setTimeout(() => setSelectedDate(undefined), 300)
    }
  }

  // ── Event renderer (HTML string — Bryntum requires string, not JSX) ──
  const eventRenderer = useCallback(({ eventRecord }: { eventRecord: EventModel }) => {
    const data = eventRecord as unknown as Record<string, unknown>
    const clientName = escapeHtml((data.clientName as string) || '')
    const serviceName = escapeHtml((data.serviceName as string) || '')
    const barberName = escapeHtml((data.barberName as string) || '')
    const startDate = data.startDate as Date
    const endDate = data.endDate as Date

    const startTime = format(startDate, 'HH:mm')
    const endTime = format(endDate, 'HH:mm')

    return `<div class="event-content" style="display:flex;flex-direction:column;height:100%;overflow:hidden;line-height:1.2;padding:2px 4px;color:white;justify-content:center;gap:1px;">
      <span style="font-size:10px;opacity:0.75;">${startTime}\u2013${endTime}</span>
      <span style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${clientName}</span>
      <span style="font-size:10px;opacity:0.9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${serviceName}</span>
    </div>`
  }, [])

  // ── Date label ──
  const dateLabel = useMemo(() => {
    if (viewMode === 'day') {
      return format(date, "EEEE, d 'de' MMMM", { locale: ptBR })
    }
    return format(date, "MMMM yyyy", { locale: ptBR })
  }, [date, viewMode])

  // ── View preset configuration ──
  const viewPreset = useMemo(() => {
    if (viewMode === 'day') {
      return {
        base: 'hourAndDay',
        tickWidth: 120,
        timeResolution: { unit: 'minute' as const, increment: 30 },
        shiftIncrement: 1,
        shiftUnit: 'day' as const,
        headers: [
          { unit: 'day' as const, dateFormat: 'ddd DD/MM' },
          { unit: 'hour' as const, dateFormat: 'HH:mm' },
          { unit: 'minute' as const, increment: 30, dateFormat: 'mm' },
        ],
      }
    }
    return {
      base: 'hourAndDay',
      tickWidth: 200,
      timeResolution: { unit: 'minute' as const, increment: 30 },
      shiftIncrement: 1,
      shiftUnit: 'day' as const,
      headers: [
        { unit: 'day' as const, dateFormat: 'ddd DD/MM' },
        { unit: 'hour' as const, dateFormat: 'HH:mm' },
      ],
    }
  }, [viewMode])

  return (
    <div className="h-[calc(100vh-200px)] sm:h-[calc(100vh-140px)] min-h-[500px] sm:min-h-[600px] bg-card p-3 sm:p-6 rounded-xl shadow-sm border flex flex-col overflow-hidden">
      {/* Barber color legend */}
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

      {/* Toolbar */}

      <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
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
        <div className="flex items-center justify-between gap-2">
          {/* Create appointment dialog (controlled) */}
          <div className="flex-1">
            <CreateAppointmentDialog
              services={services}
              clients={clients}
              barbers={barbers}
              isOpen={isDialogOpen}
              onOpenChange={handleOpenChange}
              initialDate={selectedDate}
            />
          </div>

          {/* View mode toggle */}
          <div className="flex bg-muted p-1 rounded-lg shrink-0">
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
          </div>
        </div>
      </div>

      {/* Bryntum Scheduler */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-lg">
        <SchedulerWrapper
          schedulerRef={schedulerRef}
          {...schedulerConfig}
          resources={resources}
          events={events}
          startDate={initialTimeSpan.startDate}
          endDate={initialTimeSpan.endDate}
          viewPreset={viewPreset}
          eventRenderer={eventRenderer}
          onScheduleClick={handleScheduleClick}
          onEventClick={handleEventClick}
          onAfterEventDrop={handleEventDrop}
          onBeforeEventEdit={handleBeforeEventEdit}
        />
      </div>

      {/* Details dialog */}
      <AppointmentDetailsDialog
        appointment={selectedEvent!}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        paymentMethods={paymentMethods}
      />
    </div>
  )
}
