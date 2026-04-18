'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { HOUR_HEIGHT, START_HOUR, END_HOUR } from './calendar-time-grid'
import type { CalendarEvent } from './calendar-event'

const SNAP_MINUTES = 15
const SNAP_PX = (SNAP_MINUTES / 60) * HOUR_HEIGHT

interface DragState {
  eventId: string
  /** Original Y position when drag started */
  startY: number
  /** Current delta Y from start */
  deltaY: number
  /** Whether a meaningful move has started (past threshold) */
  active: boolean
}

interface UseCalendarDndOptions {
  /** Current reference date (for building the new Date) */
  getDateForColumn: (eventId: string) => Date
  onDrop: (eventId: string, newDate: Date) => void
}

export function useCalendarDnd({ getDateForColumn, onDrop }: UseCalendarDndOptions) {
  const [dragState, setDragState] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const scrollContainerRef = useRef<HTMLElement | null>(null)

  // Keep ref in sync for event handlers that read it
  useEffect(() => {
    dragRef.current = dragState
  }, [dragState])

  const handlePointerDown = useCallback((e: React.PointerEvent, event: CalendarEvent) => {
    if (!event.draggable) return
    e.preventDefault()
    e.stopPropagation()

    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)

    // Find the scroll container (for scroll offset compensation)
    const scrollEl = el.closest('[data-calendar-scroll]') as HTMLElement | null
    scrollContainerRef.current = scrollEl

    const state: DragState = {
      eventId: event.id,
      startY: e.clientY + (scrollEl?.scrollTop ?? 0),
      deltaY: 0,
      active: false,
    }
    setDragState(state)
    dragRef.current = state
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const current = dragRef.current
    if (!current) return

    const scrollTop = scrollContainerRef.current?.scrollTop ?? 0
    const rawDelta = (e.clientY + scrollTop) - current.startY
    // Snap to SNAP_MINUTES intervals
    const snappedDelta = Math.round(rawDelta / SNAP_PX) * SNAP_PX
    const isActive = current.active || Math.abs(rawDelta) > 4

    const updated: DragState = { ...current, deltaY: snappedDelta, active: isActive }
    setDragState(updated)
    dragRef.current = updated
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const current = dragRef.current
    if (!current) return

    if (current.active && current.deltaY !== 0) {
      const columnDate = getDateForColumn(current.eventId)
      // Calculate new time from the delta
      const deltaMinutes = Math.round((current.deltaY / HOUR_HEIGHT) * 60)
      const snappedMinutes = Math.round(deltaMinutes / SNAP_MINUTES) * SNAP_MINUTES
      const newDate = new Date(columnDate.getTime() + snappedMinutes * 60_000)

      // Clamp to valid hours
      const h = newDate.getHours()
      if (h >= START_HOUR && h < END_HOUR) {
        onDrop(current.eventId, newDate)
      }
    }

    setDragState(null)
    dragRef.current = null
  }, [getDateForColumn, onDrop])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && dragRef.current) {
      setDragState(null)
      dragRef.current = null
    }
  }, [])

  return {
    dragState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown,
  }
}
