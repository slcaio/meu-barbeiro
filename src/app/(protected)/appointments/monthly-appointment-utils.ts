import { addMonths, addWeeks } from 'date-fns'

const MAX_MONTHLY_CUTS = 4

export function buildMonthlyAppointmentPreviewDates(baseDate?: Date, timeValue?: string) {
  if (!baseDate || !timeValue) {
    return []
  }

  const [hours, minutes] = timeValue.split(':').map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return []
  }

  const dates: Date[] = []
  let currentDate = new Date(baseDate)
  currentDate.setHours(hours, minutes, 0, 0)

  const recurrenceEnd = addMonths(currentDate, 1)

  while (currentDate < recurrenceEnd && dates.length < MAX_MONTHLY_CUTS) {
    dates.push(new Date(currentDate))
    currentDate = addWeeks(currentDate, 1)
  }

  return dates
}