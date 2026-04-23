'use client'

import { useMemo, useCallback, useRef } from 'react'
import { isSameDay } from 'date-fns'
import { CalendarTimeGrid, HOUR_HEIGHT, START_HOUR, timeToY } from './calendar-time-grid'
import { CalendarEventBlock, type CalendarEvent } from './calendar-event'
import { useCalendarDnd } from './use-calendar-dnd'

interface DayViewProps {
  date: Date
  events: CalendarEvent[]
  showBarber: boolean
  onEventClick: (event: CalendarEvent, position: { clientX: number; clientY: number }) => void
  onScheduleClick: (date: Date) => void
  onEventDrop: (eventId: string, newDate: Date) => void
}

/** Detect overlapping event groups and assign column layout */
function layoutEvents(events: CalendarEvent[]): Array<CalendarEvent & { column: number; totalColumns: number }> {
  if (events.length === 0) return []

  // Sort by start time, then by duration (longer first)
  const sorted = [...events].sort((a, b) => {
    const diff = a.startDate.getTime() - b.startDate.getTime()
    if (diff !== 0) return diff
    return b.durationMinutes - a.durationMinutes
  })

  // Find overlapping groups
  const groups: CalendarEvent[][] = []
  let currentGroup: CalendarEvent[] = [sorted[0]]
  let groupEnd = sorted[0].endDate.getTime()

  for (let i = 1; i < sorted.length; i++) {
    const evt = sorted[i]
    if (evt.startDate.getTime() < groupEnd) {
      // Overlaps with current group
      currentGroup.push(evt)
      groupEnd = Math.max(groupEnd, evt.endDate.getTime())
    } else {
      groups.push(currentGroup)
      currentGroup = [evt]
      groupEnd = evt.endDate.getTime()
    }
  }
  groups.push(currentGroup)

  // Assign columns within each group
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
      if (!placed) {
        columns.push([evt])
      }
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

export function DayView({ date, events, showBarber, onEventClick, onScheduleClick, onEventDrop }: DayViewProps) {
  // Filter to only events on the selected day
  const dayEvents = useMemo(() => events.filter(evt => isSameDay(evt.startDate, date)), [events, date])

  const getDateForColumn = useCallback((eventId: string) => {
    const evt = dayEvents.find(e => e.id === eventId)
    return evt?.startDate ?? date
  }, [dayEvents, date])

  const { dragState, handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown, isTap } = useCalendarDnd({
    getDateForColumn,
    onDrop: onEventDrop,
  })

  // Prevents handleClick from firing on mobile after a tap on an appointment
  const tapHandledRef = useRef(false)

  const laid = useMemo(() => layoutEvents(dayEvents), [dayEvents])

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
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

    const clickedDate = new Date(date)
    clickedDate.setHours(hours, minutes, 0, 0)
    onScheduleClick(clickedDate)
  }, [date, onScheduleClick])

  return (
    <CalendarTimeGrid>
      {/* Single day column */}
      <div
        className="flex-1 relative border-l border-border"
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
        data-calendar-scroll=""
      >
        {laid.map((evt) => {
          const top = timeToY(evt.startDate.getHours(), evt.startDate.getMinutes())
          const height = Math.max(20, (evt.durationMinutes / 60) * HOUR_HEIGHT)
          const isDragging = dragState?.active && dragState.eventId === evt.id
          const dragOffset = isDragging ? dragState.deltaY : 0
          const width = `calc(${100 / evt.totalColumns}% - 2px)`
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
                // isTap checks dragRef synchronously — works on mobile where click may not fire
                if (isTap(evt.id)) {
                  tapHandledRef.current = true
                  onEventClick(evt, { clientX: e.clientX, clientY: e.clientY })
                }
                // Do NOT stopPropagation — column's handlePointerUp must still run for DnD cleanup
              }}
              onClick={(e) => {
                e.stopPropagation() // always prevent column's handleClick
                // Non-draggable events have no pointer capture, so click fires normally
                if (!evt.draggable) {
                  onEventClick(evt, { clientX: e.clientX, clientY: e.clientY })
                }
                // Draggable events: already handled in onPointerUp above
              }}
            >
              <CalendarEventBlock
                event={evt}
                mode="day"
                showBarber={showBarber}
              />
            </div>
          )
        })}
      </div>
    </CalendarTimeGrid>
  )
}
