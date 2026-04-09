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
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
  return chain
}

describe('Barbers Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getBarbers', () => {
    it('lança erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { getBarbers } = await import('./actions')
      await expect(getBarbers()).rejects.toThrow('Não autenticado')
    })

    it('lança erro se barbearia não encontrada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain(null, null)
      mockFrom.mockReturnValue(barbershopChain)
      const { getBarbers } = await import('./actions')
      await expect(getBarbers()).rejects.toThrow('Barbearia não encontrada')
    })

    it('retorna lista de barbeiros', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbers = [
        { id: '1', name: 'Carlos', role: 'barber' },
        { id: '2', name: 'Pedro', role: 'senior_barber' },
      ]
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const barbersChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: barbers, error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return barbersChain
      })

      const { getBarbers } = await import('./actions')
      const result = await getBarbers()
      expect(result).toEqual(barbers)
    })
  })

  describe('createBarber', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { createBarber } = await import('./actions')
      const formData = createFormData({ name: 'Carlos' })
      const result = await createBarber(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('retorna erro com dados inválidos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const { createBarber } = await import('./actions')
      const formData = createFormData({ name: '' })
      const result = await createBarber(formData)
      expect(result).toEqual({ error: 'Dados inválidos. Verifique os campos.' })
    })

    it('cria barbeiro com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const insertChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return insertChain
      })

      const { createBarber } = await import('./actions')
      const formData = createFormData({
        name: 'Carlos Silva',
        phone: '11999999999',
        email: 'carlos@test.com',
        role: 'barber',
        commission_percentage: '30',
        notes: '',
      })
      const result = await createBarber(formData)
      expect(result).toEqual({ success: 'Barbeiro cadastrado com sucesso!' })
    })
  })

  describe('updateBarber', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { updateBarber } = await import('./actions')
      const formData = createFormData({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Carlos',
      })
      const result = await updateBarber(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('atualiza barbeiro com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      mockFrom.mockReturnValue(chain)

      const { updateBarber } = await import('./actions')
      const formData = createFormData({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Carlos Silva Atualizado',
        phone: '',
        email: '',
        role: 'senior_barber',
        commission_percentage: '40',
        notes: '',
        is_active: 'true',
      })
      const result = await updateBarber(formData)
      expect(result).toEqual({ success: 'Barbeiro atualizado com sucesso!' })
    })
  })

  describe('deleteBarber', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { deleteBarber } = await import('./actions')
      const result = await deleteBarber('barber-1')
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('exclui barbeiro com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const chain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      mockFrom.mockReturnValue(chain)

      const { deleteBarber } = await import('./actions')
      const result = await deleteBarber('barber-1')
      expect(result).toEqual({ success: 'Barbeiro excluído com sucesso!' })
    })

    it('retorna erro ao falhar exclusão', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const chain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'FK constraint' } }),
      }
      mockFrom.mockReturnValue(chain)

      const { deleteBarber } = await import('./actions')
      const result = await deleteBarber('barber-1')
      expect(result).toEqual({ error: 'Erro ao excluir barbeiro.' })
    })
  })
})
