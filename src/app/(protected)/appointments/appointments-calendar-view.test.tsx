import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

vi.mock('@/app/appointments/actions', () => ({
  updateAppointmentDate: vi.fn(),
}))

vi.mock('@/components/ui/calendar', () => ({
  Calendar: () => <div>Calendário</div>,
}))

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  PopoverContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('./create-appointment-dialog', () => ({
  CreateAppointmentDialog: () => <button type="button">Novo Agendamento</button>,
}))

vi.mock('./create-monthly-appointments-dialog', () => ({
  CreateMonthlyAppointmentsDialog: () => <button type="button">Pacote Mensal</button>,
}))

vi.mock('./appointment-details-dialog', () => ({
  AppointmentDetailsDialog: () => null,
}))

vi.mock('./appointment-list', () => ({
  AppointmentList: () => <div>Lista de agendamentos</div>,
}))

vi.mock('./day-view', () => ({
  DayView: () => <div>Visão diária</div>,
}))

vi.mock('./week-view', () => ({
  WeekView: () => <div>Visão semanal</div>,
}))

vi.mock('./event-action-popover', () => ({
  EventActionPopover: () => null,
}))

describe('AppointmentsCalendarView', () => {
  it('mantém o pacote mensal agrupado com o filtro de barbeiro no toolbar mobile', async () => {
    const { AppointmentsCalendarView } = await import('./appointments-calendar-view')

    render(
      <AppointmentsCalendarView
        appointments={[]}
        services={[]}
        clients={[]}
        barbers={[]}
        paymentMethods={[]}
        products={[]}
      />
    )

    const filterGroup = screen.getByRole('group', { name: 'Filtro de barbeiro e pacote mensal' })
    expect(filterGroup.className).toContain('gap-1')
    expect(within(filterGroup).getByRole('button', { name: 'Pacote Mensal' })).toBeInTheDocument()
    expect(within(filterGroup).getByText('Todos os barbeiros')).toBeInTheDocument()

    const barberTrigger = within(filterGroup).getByText('Barbeiro').closest('div')
    expect(barberTrigger?.className).toContain('w-full')
    expect(barberTrigger?.className).toContain('px-2')

    const actionsGroup = screen.getByRole('group', { name: 'Novo agendamento e modo de visualização' })
    expect(within(actionsGroup).getByRole('button', { name: 'Novo Agendamento' })).toBeInTheDocument()
  })
})