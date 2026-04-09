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
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
  return chain
}

describe('Settings Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createService', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { createService } = await import('./actions')
      const formData = createFormData({
        name: 'Corte',
        price: '30',
        duration_minutes: '30',
      })
      const result = await createService(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('retorna erro com dados inválidos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const { createService } = await import('./actions')
      const formData = createFormData({
        name: '',
        price: '-1',
        duration_minutes: '2',
      })
      const result = await createService(formData)
      expect(result).toEqual({ error: 'Dados inválidos. Verifique os campos preenchidos.' })
    })

    it('cria serviço com sucesso', async () => {
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

      const { createService } = await import('./actions')
      const formData = createFormData({
        name: 'Corte de Cabelo',
        description: 'Corte moderno',
        price: '30',
        duration_minutes: '30',
      })
      const result = await createService(formData)
      expect(result).toEqual({ success: 'Serviço criado com sucesso!' })
    })

    it('retorna erro se barbearia não encontrada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain(null, null)
      mockFrom.mockReturnValue(barbershopChain)

      const { createService } = await import('./actions')
      const formData = createFormData({
        name: 'Corte de Cabelo',
        description: '',
        price: '30',
        duration_minutes: '30',
      })
      const result = await createService(formData)
      expect(result).toEqual({ error: 'Barbearia não encontrada.' })
    })
  })

  describe('deleteService', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { deleteService } = await import('./actions')
      const result = await deleteService('service-1')
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('exclui serviço com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const chain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      mockFrom.mockReturnValue(chain)

      const { deleteService } = await import('./actions')
      const result = await deleteService('service-1')
      expect(result).toEqual({ success: 'Serviço excluído com sucesso!' })
    })

    it('retorna erro ao falhar exclusão', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const chain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
      }
      mockFrom.mockReturnValue(chain)

      const { deleteService } = await import('./actions')
      const result = await deleteService('service-1')
      expect(result).toEqual({ error: 'Erro ao excluir serviço.' })
    })
  })
})
