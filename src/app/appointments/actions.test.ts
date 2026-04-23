import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFormData } from '@/__tests__/helpers'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const mockFrom = vi.fn()
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: mockFrom,
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

function mockChain(data: unknown = null, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
  return chain
}

describe('Appointments Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createAppointment', () => {
    it('retorna erro se usuário não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { createAppointment } = await import('./actions')
      const formData = createFormData({ client_name: 'João' })
      const result = await createAppointment(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('retorna erro com dados inválidos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const { createAppointment } = await import('./actions')
      const formData = createFormData({ client_name: '', service_ids: '' })
      const result = await createAppointment(formData)
      expect(result).toEqual({ error: 'Dados inválidos. Verifique os campos.' })
    })

    it('retorna erro se barbearia não encontrada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const barbershopChain = mockChain(null, null)
      const servicesChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: [{ id: '550e8400-e29b-41d4-a716-446655440000', price: 50 }], error: null }),
      }
      
      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        if (table === 'services') return servicesChain
        return mockChain()
      })

      const { createAppointment } = await import('./actions')
      const formData = createFormData({
        client_name: 'João Silva',
        service_ids: JSON.stringify(['550e8400-e29b-41d4-a716-446655440000']),
        barber_id: '',
        appointment_date: '2026-04-10T10:00:00.000Z',
      })
      const result = await createAppointment(formData)
      expect(result).toEqual({ error: 'Barbearia não encontrada.' })
    })

    it('cria agendamento com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const servicesChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: [{ id: '550e8400-e29b-41d4-a716-446655440000', price: 50 }], error: null }),
      }
      const appointmentInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'apt-new' }, error: null }),
      }
      const appointmentServicesChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        if (table === 'services') return servicesChain
        if (table === 'appointments') return appointmentInsertChain
        if (table === 'appointment_services') return appointmentServicesChain
        return mockChain()
      })

      const { createAppointment } = await import('./actions')
      const formData = createFormData({
        client_name: 'João Silva',
        service_ids: JSON.stringify(['550e8400-e29b-41d4-a716-446655440000']),
        barber_id: '',
        appointment_date: '2026-04-10T10:00:00.000Z',
      })
      const result = await createAppointment(formData)
      expect(result).toEqual({ success: 'Agendamento criado com sucesso!' })
      expect(appointmentServicesChain.insert).toHaveBeenCalledWith([
        { appointment_id: 'apt-new', service_id: '550e8400-e29b-41d4-a716-446655440000', price_at_time: 50 },
      ])
    })
  })

  describe('updateAppointment', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { updateAppointment } = await import('./actions')
      const formData = createFormData({
        id: '550e8400-e29b-41d4-a716-446655440000',
        client_name: 'João',
        service_ids: JSON.stringify(['550e8400-e29b-41d4-a716-446655440000']),
        appointment_date: '2026-04-10T10:00:00.000Z',
      })
      const result = await updateAppointment(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('retorna erro com dados inválidos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const { updateAppointment } = await import('./actions')
      const formData = createFormData({ id: 'invalid', client_name: '' })
      const result = await updateAppointment(formData)
      expect(result).toEqual({ error: 'Dados inválidos. Verifique os campos.' })
    })

    it('atualiza agendamento com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const servicesChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: [
          { id: 'svc-1', price: 50 },
          { id: 'svc-2', price: 30 },
        ], error: null }),
      }
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      const deleteChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      const insertChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }

      let appointmentCallCount = 0
      let appointmentServicesCallCount = 0
      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        if (table === 'services') return servicesChain
        if (table === 'appointments') return updateChain
        if (table === 'appointment_services') {
          appointmentServicesCallCount++
          if (appointmentServicesCallCount === 1) return deleteChain
          return insertChain
        }
        return mockChain()
      })

      const { updateAppointment } = await import('./actions')
      const formData = createFormData({
        id: '550e8400-e29b-41d4-a716-446655440000',
        client_name: 'João Silva',
        service_ids: JSON.stringify(['svc-1', 'svc-2']),
        barber_id: '',
        appointment_date: '2026-04-15T14:00:00.000Z',
      })
      const result = await updateAppointment(formData)
      expect(result).toEqual({ success: 'Agendamento atualizado com sucesso!' })
      expect(insertChain.insert).toHaveBeenCalledWith([
        { appointment_id: '550e8400-e29b-41d4-a716-446655440000', service_id: 'svc-1', price_at_time: 50 },
        { appointment_id: '550e8400-e29b-41d4-a716-446655440000', service_id: 'svc-2', price_at_time: 30 },
      ])
    })
  })

  describe('createMonthlyAppointments', () => {
    it('retorna erro se usuário não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { createMonthlyAppointments } = await import('./actions')
      const formData = createFormData({ client_name: 'João' })
      const result = await createMonthlyAppointments(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('retorna erro com dados inválidos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const { createMonthlyAppointments } = await import('./actions')
      const formData = createFormData({ client_name: '', service_ids: '' })
      const result = await createMonthlyAppointments(formData)
      expect(result).toEqual({ error: 'Dados inválidos. Verifique os campos.' })
    })

    it('retorna erro se barbearia não encontrada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const barbershopChain = mockChain(null, null)

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return mockChain()
      })

      const { createMonthlyAppointments } = await import('./actions')
      const formData = createFormData({
        client_name: 'João Silva',
        service_ids: JSON.stringify(['550e8400-e29b-41d4-a716-446655440000']),
        barber_id: '',
        appointment_date: '2026-04-07T10:00:00.000Z',
        payment_method_id: '550e8400-e29b-41d4-a716-446655440001',
        installments: '1',
      })
      const result = await createMonthlyAppointments(formData)
      expect(result).toEqual({ error: 'Barbearia não encontrada.' })
    })

    it('retorna erro quando desconto excede o total do pacote', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const servicesChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [{ id: 'svc-1', name: 'Corte', price: 50 }],
          error: null,
        }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        if (table === 'services') return servicesChain
        return mockChain()
      })

      const { createMonthlyAppointments } = await import('./actions')
      const formData = createFormData({
        client_name: 'João Silva',
        service_ids: JSON.stringify(['svc-1']),
        barber_id: '',
        appointment_date: '2026-04-07T10:00:00.000Z',
        payment_method_id: '550e8400-e29b-41d4-a716-446655440001',
        installments: '1',
        package_discount_amount: '250',
      })

      const result = await createMonthlyAppointments(formData)
      expect(result).toEqual({ error: 'O desconto não pode ser maior que o valor total do pacote.' })
    })

    it('cria pacote mensal com sucesso e um único recebimento', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const servicesChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [{ id: 'svc-1', name: 'Corte', price: 50 }],
          error: null,
        }),
      }
      const appointmentsInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [
            { id: 'apt-1', appointment_date: '2026-04-07T10:00:00.000Z' },
            { id: 'apt-2', appointment_date: '2026-04-14T10:00:00.000Z' },
            { id: 'apt-3', appointment_date: '2026-04-21T10:00:00.000Z' },
            { id: 'apt-4', appointment_date: '2026-04-28T10:00:00.000Z' },
          ],
          error: null,
        }),
      }
      const appointmentServicesChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
      const financialInsertChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
      const paymentMethodChain = mockChain({
        name: 'Dinheiro',
        fee_type: 'percentage',
        fee_value: 0,
        supports_installments: false,
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        if (table === 'services') return servicesChain
        if (table === 'appointments') return appointmentsInsertChain
        if (table === 'appointment_services') return appointmentServicesChain
        if (table === 'financial_records') return financialInsertChain
        if (table === 'payment_methods') return paymentMethodChain
        return mockChain()
      })

      const { createMonthlyAppointments } = await import('./actions')
      const formData = createFormData({
        client_name: 'João Silva',
        service_ids: JSON.stringify(['svc-1']),
        barber_id: '',
        appointment_date: '2026-04-07T10:00:00.000Z',
        payment_method_id: '550e8400-e29b-41d4-a716-446655440001',
        installments: '1',
        package_discount_amount: '20',
      })
      const result = await createMonthlyAppointments(formData)

      expect(result).toEqual({ success: 'Pacote mensal criado com sucesso! 4 agendamentos foram adicionados.' })
      expect(appointmentsInsertChain.insert).toHaveBeenCalledTimes(1)

      const insertedAppointments = appointmentsInsertChain.insert.mock.calls[0][0] as Array<Record<string, unknown>>
      expect(insertedAppointments).toHaveLength(4)
      expect(new Set(insertedAppointments.map((row) => row.batch_id))).toHaveProperty('size', 1)
      expect(insertedAppointments.every((row) => row.payment_status === 'paid')).toBe(true)
      expect(insertedAppointments.map((row) => row.total_amount)).toEqual([45, 45, 45, 45])

      expect(appointmentServicesChain.insert).toHaveBeenCalledWith([
        { appointment_id: 'apt-1', service_id: 'svc-1', price_at_time: 50 },
        { appointment_id: 'apt-2', service_id: 'svc-1', price_at_time: 50 },
        { appointment_id: 'apt-3', service_id: 'svc-1', price_at_time: 50 },
        { appointment_id: 'apt-4', service_id: 'svc-1', price_at_time: 50 },
      ])
      expect(financialInsertChain.insert).toHaveBeenCalledTimes(1)
      expect(financialInsertChain.insert).toHaveBeenCalledWith({
        barbershop_id: 'barbershop-1',
        type: 'income',
        amount: 180,
        category: 'Serviço',
        description: 'Pacote mensal: Corte - Cliente: João Silva (4 agendamentos) • Desconto: R$ 20,00',
        payment_method_id: '550e8400-e29b-41d4-a716-446655440001',
        record_date: expect.any(String),
      })
    })
  })

  describe('updateAppointmentStatus', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { updateAppointmentStatus } = await import('./actions')
      const result = await updateAppointmentStatus('apt-1', 'completed')
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('atualiza status com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      
      const chain = mockChain()
      chain.update = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })
      mockFrom.mockReturnValue(chain)

      const { updateAppointmentStatus } = await import('./actions')
      const result = await updateAppointmentStatus('apt-1', 'completed')
      expect(result).toEqual({ success: 'Status atualizado com sucesso!' })
    })
  })

  describe('updateAppointmentDate', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { updateAppointmentDate } = await import('./actions')
      const result = await updateAppointmentDate('apt-1', '2026-04-15T10:00:00Z')
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('atualiza data com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      
      const chain = mockChain()
      chain.update = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })
      mockFrom.mockReturnValue(chain)

      const { updateAppointmentDate } = await import('./actions')
      const result = await updateAppointmentDate('apt-1', '2026-04-15T10:00:00Z')
      expect(result).toEqual({ success: 'Data atualizada com sucesso!' })
    })

    it('atualiza data e barbeiro com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const eqMock = vi.fn().mockResolvedValue({ error: null })
      const chain = mockChain()
      chain.update = vi.fn().mockReturnValue({ eq: eqMock })
      mockFrom.mockReturnValue(chain)

      const { updateAppointmentDate } = await import('./actions')
      const result = await updateAppointmentDate('apt-1', '2026-04-15T10:00:00Z', 'barber-uuid')
      expect(result).toEqual({ success: 'Data atualizada com sucesso!' })
      expect(chain.update).toHaveBeenCalledWith({
        appointment_date: '2026-04-15T10:00:00Z',
        barber_id: 'barber-uuid',
      })
    })
  })

  describe('completeAppointmentWithTransaction', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { completeAppointmentWithTransaction } = await import('./actions')
      const formData = createFormData({
        appointment_id: 'apt-1',
        action: 'complete',
        amount: '50',
        description: 'Corte',
      })
      const result = await completeAppointmentWithTransaction(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('retorna erro com dados incompletos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const { completeAppointmentWithTransaction } = await import('./actions')
      const formData = createFormData({})
      const result = await completeAppointmentWithTransaction(formData)
      expect(result).toEqual({ error: 'Dados incompletos.' })
    })

    it('completa agendamento com método de pagamento e registra taxa percentual', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const appointmentLookupChain = mockChain({
        barber_id: null,
        batch_id: null,
        payment_status: 'pending',
        payment_method_id: null,
        installments: 1,
        total_amount: 100,
      })
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const insertChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
      const paymentMethodChain = mockChain({ name: 'Cartão de Crédito', fee_type: 'percentage', fee_value: 3, supports_installments: false })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'appointments') {
          if (appointmentLookupChain.single.mock.calls.length === 0) return appointmentLookupChain
          return updateChain
        }
        if (table === 'barbershops') return barbershopChain
        if (table === 'financial_records') return insertChain
        if (table === 'payment_methods') return paymentMethodChain
        return mockChain()
      })

      const { completeAppointmentWithTransaction } = await import('./actions')
      const formData = createFormData({
        appointment_id: 'apt-1',
        action: 'complete',
        amount: '100',
        description: 'Serviço: Corte - Cliente: João',
        payment_method_id: 'pm-credit',
      })
      const result = await completeAppointmentWithTransaction(formData)
      expect(result).toEqual({ success: 'Operação realizada com sucesso!' })

      // Verify financial_records insert was called (income + fee expense)
      expect(insertChain.insert).toHaveBeenCalledTimes(2)
    })

    it('completa agendamento com método sem taxa (Dinheiro)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const appointmentLookupChain = mockChain({
        barber_id: null,
        batch_id: null,
        payment_status: 'pending',
        payment_method_id: null,
        installments: 1,
        total_amount: 50,
      })
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const insertChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
      const paymentMethodChain = mockChain({ name: 'Dinheiro', fee_type: 'percentage', fee_value: 0, supports_installments: false })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'appointments') {
          if (appointmentLookupChain.single.mock.calls.length === 0) return appointmentLookupChain
          return updateChain
        }
        if (table === 'barbershops') return barbershopChain
        if (table === 'financial_records') return insertChain
        if (table === 'payment_methods') return paymentMethodChain
        return mockChain()
      })

      const { completeAppointmentWithTransaction } = await import('./actions')
      const formData = createFormData({
        appointment_id: 'apt-1',
        action: 'complete',
        amount: '50',
        description: 'Serviço: Corte',
        payment_method_id: 'pm-cash',
      })
      const result = await completeAppointmentWithTransaction(formData)
      expect(result).toEqual({ success: 'Operação realizada com sucesso!' })

      // Only income record, no fee expense (fee_value is 0)
      expect(insertChain.insert).toHaveBeenCalledTimes(1)
    })

    it('completa agendamento com taxa fixa', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const appointmentLookupChain = mockChain({
        barber_id: null,
        batch_id: null,
        payment_status: 'pending',
        payment_method_id: null,
        installments: 1,
        total_amount: 50,
      })
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const insertChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
      const paymentMethodChain = mockChain({ name: 'Taxa Fixa', fee_type: 'fixed', fee_value: 2.5, supports_installments: false })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'appointments') {
          if (appointmentLookupChain.single.mock.calls.length === 0) return appointmentLookupChain
          return updateChain
        }
        if (table === 'barbershops') return barbershopChain
        if (table === 'financial_records') return insertChain
        if (table === 'payment_methods') return paymentMethodChain
        return mockChain()
      })

      const { completeAppointmentWithTransaction } = await import('./actions')
      const formData = createFormData({
        appointment_id: 'apt-1',
        action: 'complete',
        amount: '50',
        description: 'Serviço: Corte',
        payment_method_id: 'pm-fixed',
      })
      const result = await completeAppointmentWithTransaction(formData)
      expect(result).toEqual({ success: 'Operação realizada com sucesso!' })

      // Income + fee expense
      expect(insertChain.insert).toHaveBeenCalledTimes(2)
    })

    it('cancela agendamento sem exigir método de pagamento', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const appointmentLookupChain = mockChain({
        barber_id: null,
        batch_id: null,
        payment_status: 'pending',
        payment_method_id: null,
        installments: 1,
        total_amount: 0,
      })
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'appointments') {
          if (appointmentLookupChain.single.mock.calls.length === 0) return appointmentLookupChain
          return updateChain
        }
        if (table === 'barbershops') return mockChain({ id: 'barbershop-1' })
        return mockChain()
      })

      const { completeAppointmentWithTransaction } = await import('./actions')
      const formData = createFormData({
        appointment_id: 'apt-1',
        action: 'cancel',
        amount: '0',
        description: 'Cancelamento sem taxa',
      })
      const result = await completeAppointmentWithTransaction(formData)
      expect(result).toEqual({ success: 'Operação realizada com sucesso!' })
    })

    it('cancela o restante do pacote mensal quando solicitado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const appointmentLookupChain = mockChain({
        barber_id: null,
        batch_id: 'batch-1',
        payment_status: 'paid',
        payment_method_id: 'pm-credit',
        installments: 1,
        total_amount: 100,
      })
      const neqMock = vi.fn().mockResolvedValue({ error: null })
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          neq: neqMock,
        }),
      }
      const barbershopChain = mockChain({ id: 'barbershop-1' })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'appointments') {
          if (appointmentLookupChain.single.mock.calls.length === 0) return appointmentLookupChain
          return updateChain
        }
        if (table === 'barbershops') return barbershopChain
        return mockChain()
      })

      const { completeAppointmentWithTransaction } = await import('./actions')
      const formData = createFormData({
        appointment_id: 'apt-1',
        action: 'cancel',
        amount: '0',
        description: 'Cancelamento do pacote',
        cancel_scope: 'batch',
      })

      const result = await completeAppointmentWithTransaction(formData)

      expect(result).toEqual({ success: 'Operação realizada com sucesso!' })
      expect(updateChain.eq).toHaveBeenCalledWith('batch_id', 'batch-1')
      expect(neqMock).toHaveBeenCalledWith('status', 'completed')
    })

    it('completa agendamento com taxa e comissão de barbeiro', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const appointmentLookupChain = mockChain({
        barber_id: 'barber-1',
        batch_id: null,
        payment_status: 'pending',
        payment_method_id: null,
        installments: 1,
        total_amount: 100,
      })
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const insertChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
      const paymentMethodChain = mockChain({ name: 'Crédito', fee_type: 'percentage', fee_value: 3, supports_installments: false })
      const barberChain = mockChain({ commission_percentage: 30, name: 'Carlos' })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'appointments') {
          if (appointmentLookupChain.single.mock.calls.length === 0) return appointmentLookupChain
          return updateChain
        }
        if (table === 'barbershops') return barbershopChain
        if (table === 'financial_records') return insertChain
        if (table === 'payment_methods') return paymentMethodChain
        if (table === 'barbers') return barberChain
        return mockChain()
      })

      const { completeAppointmentWithTransaction } = await import('./actions')
      const formData = createFormData({
        appointment_id: 'apt-1',
        action: 'complete',
        amount: '100',
        description: 'Serviço: Corte',
        payment_method_id: 'pm-credit',
      })
      const result = await completeAppointmentWithTransaction(formData)
      expect(result).toEqual({ success: 'Operação realizada com sucesso!' })

      // Income + fee expense + commission expense = 3 inserts
      expect(insertChain.insert).toHaveBeenCalledTimes(3)
    })

    it('completa agendamento com parcelamento e taxa por parcela', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const appointmentLookupChain = mockChain({
        barber_id: null,
        batch_id: null,
        payment_status: 'pending',
        payment_method_id: null,
        installments: 1,
        total_amount: 100,
      })
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const insertChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
      const paymentMethodChain = mockChain({ name: 'Cartão de Crédito', fee_type: 'percentage', fee_value: 3, supports_installments: true })
      const installmentTierChain = mockChain({ fee_percentage: 7 })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'appointments') {
          if (appointmentLookupChain.single.mock.calls.length === 0) return appointmentLookupChain
          return updateChain
        }
        if (table === 'barbershops') return barbershopChain
        if (table === 'financial_records') return insertChain
        if (table === 'payment_methods') return paymentMethodChain
        if (table === 'payment_method_installments') return installmentTierChain
        return mockChain()
      })

      const { completeAppointmentWithTransaction } = await import('./actions')
      const formData = createFormData({
        appointment_id: 'apt-1',
        action: 'complete',
        amount: '100',
        description: 'Serviço: Corte - Cliente: João',
        payment_method_id: 'pm-credit',
        installments: '3',
      })
      const result = await completeAppointmentWithTransaction(formData)
      expect(result).toEqual({ success: 'Operação realizada com sucesso!' })

      // Income + fee expense (7% of 100 = R$7) = 2 inserts
      expect(insertChain.insert).toHaveBeenCalledTimes(2)
    })

    it('conclui agendamento pré-pago sem duplicar receita de serviços', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const appointmentLookupChain = mockChain({
        barber_id: 'barber-1',
        batch_id: 'batch-1',
        payment_status: 'paid',
        payment_method_id: 'pm-credit',
        installments: 1,
        total_amount: 100,
      })
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const insertChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
      const barberChain = mockChain({ commission_percentage: 30, name: 'Carlos' })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'appointments') {
          if (appointmentLookupChain.single.mock.calls.length === 0) return appointmentLookupChain
          return updateChain
        }
        if (table === 'barbershops') return barbershopChain
        if (table === 'financial_records') return insertChain
        if (table === 'barbers') return barberChain
        return mockChain()
      })

      const { completeAppointmentWithTransaction } = await import('./actions')
      const formData = createFormData({
        appointment_id: 'apt-1',
        action: 'complete',
        amount: '100',
        description: 'Serviço: Corte',
      })

      const result = await completeAppointmentWithTransaction(formData)

      expect(result).toEqual({ success: 'Operação realizada com sucesso!' })
      expect(insertChain.insert).toHaveBeenCalledTimes(1)
      expect(insertChain.insert).toHaveBeenCalledWith({
        barbershop_id: 'barbershop-1',
        type: 'expense',
        amount: 30,
        category: 'Comissão',
        description: 'Comissão Carlos - Serviços 30%',
        record_date: expect.any(String),
      })
    })
  })
})
