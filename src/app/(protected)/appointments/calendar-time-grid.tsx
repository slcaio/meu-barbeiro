'use client'

import { useEffect, useRef, type ReactNode, type MouseEvent } from 'react'

export const HOUR_HEIGHT = 60
export const START_HOUR = 6
export const END_HOUR = 23
const TOTAL_HOURS = END_HOUR - START_HOUR
const SNAP_MINUTES = 15

interface CalendarTimeGridProps {
  /** Column headers (rendered above the time grid) */
  headers?: ReactNode
  /** Day columns to render inside the grid */
  children: ReactNode
  /** Called when user double-clicks an empty area — receives the calculated Date */
  onDoubleClick?: (date: Date, columnDate: Date) => void
}

/** Convert a Y offset (px) inside the grid to hours + minutes (snapped to SNAP_MINUTES) */
export function yToTime(y: number): { hours: number; minutes: number } {
  const totalMinutes = (y / HOUR_HEIGHT) * 60 + START_HOUR * 60
  const snapped = Math.round(totalMinutes / SNAP_MINUTES) * SNAP_MINUTES
  const hours = Math.floor(snapped / 60)
  const minutes = snapped % 60
  return { hours: Math.max(START_HOUR, Math.min(END_HOUR, hours)), minutes }
}

/** Convert hours + minutes to Y offset (px) */
export function timeToY(hours: number, minutes: number): number {
  return (hours - START_HOUR) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT
}

export function CalendarTimeGrid({ headers, children, onDoubleClick }: CalendarTimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Scroll to current hour on mount
  useEffect(() => {
    if (!scrollRef.current) return
    const now = new Date()
    const currentHour = now.getHours()
    if (currentHour >= START_HOUR && currentHour <= END_HOUR) {
      const y = timeToY(currentHour, 0) - HOUR_HEIGHT // 1 hour above current time
      scrollRef.current.scrollTop = Math.max(0, y)
    }
  }, [])

  // Time labels for the axis
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Column headers (day names, dates, etc.) */}
      {headers && (
        <div className="flex border-b border-border shrink-0">
          {/* Time axis spacer */}
          <div className="w-14 shrink-0" />
          {headers}
        </div>
      )}

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div ref={gridRef} className="flex relative" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
          {/* Time axis */}
          <div className="w-14 shrink-0 relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute w-full pr-2 text-right"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT - 6 }}
              >
                <span className="text-[11px] text-muted-foreground">
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns container */}
          <div className="flex-1 relative flex">
            {/* Hour lines */}
            {hours.map((hour) => (
              <div key={`line-${hour}`}>
                {/* Full hour line */}
                <div
                  className="absolute left-0 right-0 border-t border-border"
                  style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                />
                {/* Half hour line */}
                <div
                  className="absolute left-0 right-0 border-t border-border/40 border-dashed"
                  style={{ top: (hour - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                />
              </div>
            ))}

            {/* Current time indicator */}
            <CurrentTimeIndicator />

            {/* Day columns (absolutely positioned events inside) */}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function CurrentTimeIndicator() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function update() {
      if (!ref.current) return
      const now = new Date()
      const h = now.getHours()
      const m = now.getMinutes()
      if (h < START_HOUR || h >= END_HOUR) {
        ref.current.style.display = 'none'
        return
      }
      ref.current.style.display = 'block'
      ref.current.style.top = `${timeToY(h, m)}px`
    }
    update()
    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div ref={ref} className="absolute left-0 right-0 z-30 pointer-events-none flex items-center">
      <div className="w-2 h-2 rounded-full bg-destructive -ml-1" />
      <div className="flex-1 h-[2px] bg-destructive" />
    </div>
  )
}
