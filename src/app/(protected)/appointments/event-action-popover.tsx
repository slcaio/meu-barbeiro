'use client'

import { useEffect, useRef } from 'react'
import { Eye, CalendarPlus } from 'lucide-react'

interface EventActionPopoverProps {
  x: number
  y: number
  onViewDetails: () => void
  onNewAppointment: () => void
  onClose: () => void
}

export function EventActionPopover({
  x,
  y,
  onViewDetails,
  onNewAppointment,
  onClose,
}: EventActionPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Adjust position so the popover stays within the viewport
  const adjustedX = Math.min(x, window.innerWidth - 200)
  const adjustedY = Math.min(y, window.innerHeight - 100)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Use a tiny delay so the same click that opened it doesn't immediately close it
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Invisible backdrop to capture outside clicks */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        ref={ref}
        className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-1 min-w-[200px]"
        style={{ top: adjustedY, left: adjustedX }}
      >
        <button
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left"
          onClick={() => { onClose(); onViewDetails() }}
        >
          <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
          Abrir agendamento
        </button>
        <button
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left"
          onClick={() => { onClose(); onNewAppointment() }}
        >
          <CalendarPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
          Agendar neste horário
        </button>
      </div>
    </>
  )
}
