import { describe, expect, it } from 'vitest'

import { buildMonthlyAppointmentPreviewDates } from './monthly-appointment-utils'

describe('buildMonthlyAppointmentPreviewDates', () => {
  it('gera ocorrências semanais por um mês com limite de 4 cortes', () => {
    const dates = buildMonthlyAppointmentPreviewDates(new Date(2026, 3, 7), '10:00')

    expect(dates).toHaveLength(4)
    expect(dates.map((date) => ({
      month: date.getMonth(),
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
    }))).toEqual([
      { month: 3, day: 7, hour: 10, minute: 0 },
      { month: 3, day: 14, hour: 10, minute: 0 },
      { month: 3, day: 21, hour: 10, minute: 0 },
      { month: 3, day: 28, hour: 10, minute: 0 },
    ])
  })

  it('retorna vazio quando horário está ausente', () => {
    expect(buildMonthlyAppointmentPreviewDates(new Date(2026, 3, 7), '')).toEqual([])
  })
})