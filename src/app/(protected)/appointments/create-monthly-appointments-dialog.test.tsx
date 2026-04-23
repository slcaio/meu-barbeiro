import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const createMonthlyAppointmentsMock = vi.fn()

vi.mock('@/app/appointments/actions', () => ({
  createMonthlyAppointments: createMonthlyAppointmentsMock,
}))

vi.mock('./client-selector', () => ({
  ClientSelector: ({ onSelect }: { onSelect: (client: { id: string; name: string; phone: string | null; email: string | null }) => void }) => (
    <button
      type="button"
      onClick={() => onSelect({ id: 'client-1', name: 'João', phone: null, email: null })}
    >
      Selecionar cliente
    </button>
  ),
}))

vi.mock('./service-multi-select', () => ({
  ServiceMultiSelect: ({ onChange }: { onChange: (ids: string[]) => void }) => (
    <button type="button" onClick={() => onChange(['svc-1'])}>
      Selecionar serviço
    </button>
  ),
}))

vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({ onChange }: { onChange?: (date: Date | undefined) => void }) => (
    <button type="button" onClick={() => onChange?.(new Date(2026, 3, 7))}>
      Definir data
    </button>
  ),
}))

vi.mock('@/components/ui/time-picker', () => ({
  TimePicker: ({ value, onChange }: { value?: string; onChange?: (time: string) => void }) => (
    <input
      aria-label="Hora"
      value={value || ''}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}))

describe('CreateMonthlyAppointmentsDialog', () => {
  beforeEach(() => {
    createMonthlyAppointmentsMock.mockReset()
    createMonthlyAppointmentsMock.mockResolvedValue({ success: 'Pacote mensal criado com sucesso!' })
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('gera resumo do pacote e envia o formulário', async () => {
    const user = userEvent.setup()
    const { CreateMonthlyAppointmentsDialog } = await import('./create-monthly-appointments-dialog')

    render(
      <CreateMonthlyAppointmentsDialog
        services={[{ id: 'svc-1', name: 'Corte', price: 50, duration_minutes: 30 }]}
        clients={[{ id: 'client-1', name: 'João', phone: null, email: null }]}
        barbers={[]}
        paymentMethods={[
          {
            id: 'pm-cash',
            name: 'Dinheiro',
            fee_type: 'percentage',
            fee_value: 0,
            supports_installments: false,
            payment_method_installments: [],
          },
        ]}
      />
    )

    const trigger = screen.getByRole('button', { name: /pacote mensal/i })
    expect(trigger.className).toContain('px-2.5')
    expect(trigger.className).toContain('text-xs')

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Selecionar cliente' }))
    await user.click(screen.getByRole('button', { name: 'Selecionar serviço' }))
    await user.click(screen.getByRole('button', { name: 'Definir data' }))
    await user.type(screen.getByLabelText('Hora'), '10:00')
    await user.type(screen.getByLabelText('Desconto no pacote (Opcional)'), '2000')
    await user.selectOptions(screen.getByLabelText('Método de Pagamento *'), 'pm-cash')

    expect(screen.getByText('Total do pacote')).toBeInTheDocument()
    expect(screen.getAllByText(/R\$\s*180,00/).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Criar Pacote Mensal' }))

    await waitFor(() => {
      expect(createMonthlyAppointmentsMock).toHaveBeenCalledTimes(1)
    })

    const submittedFormData = createMonthlyAppointmentsMock.mock.calls[0][0] as FormData
    expect(submittedFormData.get('client_id')).toBe('client-1')
    expect(submittedFormData.get('service_ids')).toBe(JSON.stringify(['svc-1']))
    expect(submittedFormData.get('payment_method_id')).toBe('pm-cash')
    expect(submittedFormData.get('installments')).toBe('1')
    expect(submittedFormData.get('package_discount_amount')).toBe('20')
  })
})