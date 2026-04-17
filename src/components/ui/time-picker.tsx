'use client'

import { useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

function generateSlots(start = '06:00', end = '23:00', step = 15): string[] {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  const slots: string[] = []
  for (let m = startMin; m <= endMin; m += step) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
  }
  return slots
}

interface TimePickerProps {
  value?: string
  onChange?: (time: string) => void
  placeholder?: string
  className?: string
  start?: string
  end?: string
  step?: number
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'Selecione',
  className,
  start,
  end,
  step,
}: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  const slots = generateSlots(start, end, step)

  function handleSlotClick(slot: string) {
    setInputValue(slot)
    onChange?.(slot)
    setOpen(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value)
    if (e.target.value.match(/^\d{2}:\d{2}$/)) {
      onChange?.(e.target.value)
    }
  }

  function handleInputBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (e.target.value.match(/^\d{2}:\d{2}$/)) {
      onChange?.(e.target.value)
    }
  }

  const displayValue = value || inputValue

  return (
    <Popover open={open} onOpenChange={(o) => {
      setOpen(o)
      if (o) setTimeout(() => inputRef.current?.focus(), 50)
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !displayValue && 'text-muted-foreground',
            className,
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayValue || <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <input
          ref={inputRef}
          type="time"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="mb-2 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <div className="max-h-52 overflow-y-auto">
          {slots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => handleSlotClick(slot)}
              className={cn(
                'w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                displayValue === slot && 'bg-accent text-accent-foreground font-medium',
              )}
            >
              {slot}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

