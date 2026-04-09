'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TimePickerProps {
  value?: string
  onChange?: (time: string) => void
  placeholder?: string
  className?: string
  start?: string
  end?: string
  step?: number
}

function generateTimeSlots(start: string, end: string, step: number): string[] {
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  const count = Math.floor((endMinutes - startMinutes) / step) + 1

  return Array.from({ length: count }, (_, i) => {
    const total = startMinutes + i * step
    const hours = String(Math.floor(total / 60)).padStart(2, '0')
    const minutes = String(total % 60).padStart(2, '0')
    return `${hours}:${minutes}`
  })
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'Selecione',
  className,
  start = '07:00',
  end = '21:00',
  step = 30,
}: TimePickerProps) {
  const slots = generateTimeSlots(start, end, step)

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? 'w-full'}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {slots.map((slot) => (
          <SelectItem key={slot} value={slot}>
            {slot}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
