'use client'

import { useMemo, useCallback, useRef } from 'react'
import { startOfWeek, addDays, isSameDay, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarTimeGrid, HOUR_HEIGHT, START_HOUR, timeToY } from './calendar-time-grid'
import { CalendarEventBlock, type CalendarEvent } from './calendar-event'
import { useCalendarDnd } from './use-calendar-dnd'
import { cn } from '@/lib/utils'

interface WeekViewProps {
  date: Date
  events: CalendarEvent[]
  showBarber: boolean
  onEventClick: (event: CalendarEvent, position: { clientX: number; clientY: number }) => void
  onScheduleClick: (date: Date) => void
  onEventDrop: (eventId: string, newDate: Date) => void
}

/** Layout overlapping events within a single day column (same algorithm as day-view) */
function layoutEventsForDay(events: CalendarEvent[]): Array<CalendarEvent & { column: number; totalColumns: number }> {
  if (events.length === 0) return []

  const sorted = [...events].sort((a, b) => {
    const diff = a.startDate.getTime() - b.startDate.getTime()
    if (diff !== 0) return diff
    return b.durationMinutes - a.durationMinutes
  })

  const groups: CalendarEvent[][] = []
  let currentGroup: CalendarEvent[] = [sorted[0]]
  let groupEnd = sorted[0].endDate.getTime()

  for (let i = 1; i < sorted.length; i++) {
    const evt = sorted[i]
    if (evt.startDate.getTime() < groupEnd) {
      currentGroup.push(evt)
      groupEnd = Math.max(groupEnd, evt.endDate.getTime())
    } else {
      groups.push(currentGroup)
      currentGroup = [evt]
      groupEnd = evt.endDate.getTime()
    }
  }
  groups.push(currentGroup)

  const result: Array<CalendarEvent & { column: number; totalColumns: number }> = []
  for (const group of groups) {
    const columns: CalendarEvent[][] = []
    for (const evt of group) {
      let placed = false
      for (let col = 0; col < columns.length; col++) {
        const lastInCol = columns[col][columns[col].length - 1]
        if (lastInCol.endDate.getTime() <= evt.startDate.getTime()) {
          columns[col].push(evt)
          placed = true
          break
        }
      }
      if (!placed) columns.push([evt])
    }
    const totalColumns = columns.length
    for (let col = 0; col < columns.length; col++) {
      for (const evt of columns[col]) {
        result.push({ ...evt, column: col, totalColumns })
      }
    }
  }
  return result
}

export function WeekView({ date, events, showBarber, onEventClick, onScheduleClick, onEventDrop }: WeekViewProps) {
  const weekStart = useMemo(() => startOfWeek(date, { weekStartsOn: 1 }), [date])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  // Group events by day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const day of weekDays) {
      const key = day.toDateString()
      map.set(key, [])
    }
    for (const evt of events) {
      const key = evt.startDate.toDateString()
      const arr = map.get(key)
      if (arr) arr.push(evt)
    }
    return map
  }, [events, weekDays])

  const getDateForColumn = useCallback((eventId: string) => {
    const evt = events.find(e => e.id === eventId)
    return evt?.startDate ?? date
  }, [events, date])

  const { dragState, handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown, isTap } = useCalendarDnd({
    getDateForColumn,
    onDrop: onEventDrop,
  })

  // Prevents handleClick from firing on mobile after a tap on an appointment
  const tapHandledRef = useRef(false)

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>, dayDate: Date) => {
    if (tapHandledRef.current) {
      tapHandledRef.current = false
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const scrollTop = e.currentTarget.closest('[data-calendar-scroll]')?.scrollTop ?? 0
    const y = e.clientY - rect.top + scrollTop
    const totalMinutes = (y / HOUR_HEIGHT) * 60 + START_HOUR * 60
    const snapped = Math.round(totalMinutes / 15) * 15
    const hours = Math.floor(snapped / 60)
    const minutes = snapped % 60

    const clickedDate = new Date(dayDate)
    clickedDate.setHours(hours, minutes, 0, 0)
    onScheduleClick(clickedDate)
  }, [onScheduleClick])

  const today = new Date()

  const headers = (
    <>
      {weekDays.map((day) => {
        const isToday = isSameDay(day, today)
        return (
          <div key={day.toISOString()} className="flex-1 text-center py-2 border-l border-border">
            <span className="text-xs text-muted-foreground uppercase">
              {format(day, 'EEE', { locale: ptBR })}
            </span>
            <div
              className={cn(
                'text-sm font-semibold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto',
                isToday && 'bg-primary text-primary-foreground',
              )}
            >
              {format(day, 'd')}
            </div>
          </div>
        )
      })}
    </>
  )

  return (
    <CalendarTimeGrid headers={headers}>
      {weekDays.map((day) => {
        const dayKey = day.toDateString()
        const dayEvents = eventsByDay.get(dayKey) ?? []
        const laid = layoutEventsForDay(dayEvents)
        const isToday = isSameDay(day, today)

        return (
          <div
            key={dayKey}
            className={cn(
              'flex-1 relative border-l border-border',
              isToday && 'bg-primary/5',
            )}
            onClick={(e) => handleClick(e, day)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onKeyDown={handleKeyDown}
          >
            {laid.map((evt) => {
              const top = timeToY(evt.startDate.getHours(), evt.startDate.getMinutes())
              const height = Math.max(20, (evt.durationMinutes / 60) * HOUR_HEIGHT)
              const isDragging = dragState?.active && dragState.eventId === evt.id
              const dragOffset = isDragging ? dragState.deltaY : 0
              const width = `calc(${100 / evt.totalColumns}% - 1px)`
              const left = `calc(${(evt.column / evt.totalColumns) * 100}%)`

              return (
                <div
                  key={evt.id}
                  className="absolute"
                  style={{
                    top: top + dragOffset,
                    height,
                    width,
                    left,
                    zIndex: isDragging ? 50 : 10,
                    opacity: isDragging ? 0.85 : 1,
                    transition: isDragging ? 'none' : 'top 0.15s ease',
                  }}
                  onPointerDown={(e) => {
                    tapHandledRef.current = false
                    handlePointerDown(e, evt)
                  }}
                  onPointerUp={(e) => {
                    if (isTap(evt.id)) {
                      tapHandledRef.current = true
                      onEventClick(evt, { clientX: e.clientX, clientY: e.clientY })
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!evt.draggable) {
                      onEventClick(evt, { clientX: e.clientX, clientY: e.clientY })
                    }
                  }}
                >
                  <CalendarEventBlock
                    event={evt}
                    mode="week"
                    showBarber={showBarber}
                  />
                </div>
              )
            })}
          </div>
        )
      })}
    </CalendarTimeGrid>
  )
}
