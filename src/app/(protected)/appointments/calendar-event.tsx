'use client'

import { memo } from 'react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export interface CalendarEvent {
  id: string
  clientName: string
  serviceName: string
  barberName: string
  startDate: Date
  endDate: Date
  durationMinutes: number
  status: string
  bgColor: string
  borderColor: string
  draggable: boolean
}

interface CalendarEventBlockProps {
  event: CalendarEvent
  mode: 'day' | 'week'
  showBarber: boolean
}

export const CalendarEventBlock = memo(function CalendarEventBlock({
  event,
  mode,
  showBarber,
}: CalendarEventBlockProps) {
  const isCancelled = event.status === 'cancelled'
  const isCompleted = event.status === 'completed'

  return (
    <div
      className={cn(
        'absolute inset-x-0 mx-0.5 rounded-md cursor-pointer select-none overflow-hidden',
        'shadow-sm hover:shadow-md transition-shadow',
        'border-l-[3px]',
        isCancelled && 'opacity-50',
        isCompleted && 'opacity-70',
      )}
      style={{
        backgroundColor: event.bgColor,
        borderLeftColor: event.borderColor,
      }}
    >
      {mode === 'day' ? (
        <DayContent event={event} showBarber={showBarber} isCancelled={isCancelled} />
      ) : (
        <WeekContent event={event} />
      )}
    </div>
  )
})

function DayContent({ event, showBarber, isCancelled }: { event: CalendarEvent; showBarber: boolean; isCancelled: boolean }) {
  const startTime = format(event.startDate, 'HH:mm')
  const endTime = format(event.endDate, 'HH:mm')

  return (
    <div className="flex items-center h-full overflow-hidden px-1.5 py-0.5 text-white gap-1.5">
      <span className="text-[10px] opacity-75 whitespace-nowrap shrink-0">
        {startTime}–{endTime}
      </span>
      <span className={cn('text-xs font-semibold truncate shrink', isCancelled && 'line-through')}>
        {event.clientName}
      </span>
      <span className="text-[10px] opacity-85 truncate shrink-[2]">
        · {event.serviceName}
      </span>
      {showBarber && event.barberName && (
        <span className="text-[9px] opacity-70 whitespace-nowrap shrink-0">
          · {event.barberName}
        </span>
      )}
    </div>
  )
}

function WeekContent({ event }: { event: CalendarEvent }) {
  const startTime = format(event.startDate, 'HH:mm')

  return (
    <div className="flex items-center h-full overflow-hidden px-1 py-0.5 text-white gap-1">
      <span className="text-[9px] opacity-80 whitespace-nowrap shrink-0">
        {startTime}
      </span>
      <span className="text-[10px] font-semibold truncate shrink">
        {event.clientName}
      </span>
    </div>
  )
}
