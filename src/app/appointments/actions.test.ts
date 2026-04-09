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

function mockChain(data: any = null, error: any = null) {
  const chain: any = {
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
      const formData = createFormData({ client_name: '', service_id: 'invalid' })
      const result = await createAppointment(formData)
      expect(result).toEqual({ error: 'Dados inválidos. Verifique os campos.' })
    })

    it('retorna erro se barbearia não encontrada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const barbershopChain = mockChain(null, null)
      const serviceChain = mockChain({ price: 50 })
      
      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        if (table === 'services') return serviceChain
        return mockChain()
      })

      const { createAppointment } = await import('./actions')
      const formData = createFormData({
        client_name: 'João Silva',
        service_id: '550e8400-e29b-41d4-a716-446655440000',
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
      const serviceChain = mockChain({ price: 50 })
      const insertChain = mockChain()
      insertChain.insert = vi.fn().mockResolvedValue({ error: null })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        if (table === 'services') return serviceChain
        if (table === 'appointments') return insertChain
        return mockChain()
      })

      const { createAppointment } = await import('./actions')
      const formData = createFormData({
        client_name: 'João Silva',
        service_id: '550e8400-e29b-41d4-a716-446655440000',
        barber_id: '',
        appointment_date: '2026-04-10T10:00:00.000Z',
      })
      const result = await createAppointment(formData)
      expect(result).toEqual({ success: 'Agendamento criado com sucesso!' })
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
  })
})
