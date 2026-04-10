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

describe('Financial Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createTransaction', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { createTransaction } = await import('./actions')
      const formData = createFormData({
        type: 'income',
        amount: '50',
        category: 'Serviço',
        record_date: '2026-04-08',
      })
      const result = await createTransaction(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('retorna erro com dados inválidos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const { createTransaction } = await import('./actions')
      const formData = createFormData({
        type: 'invalid-type',
        amount: '0',
        category: '',
        record_date: 'invalid-date',
      })
      const result = await createTransaction(formData)
      expect(result).toEqual({ error: 'Dados inválidos. Verifique os campos.' })
    })

    it('cria transação com sucesso', async () => {
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

      const { createTransaction } = await import('./actions')
      const formData = createFormData({
        type: 'income',
        amount: '50',
        category: 'Serviço',
        description: 'Corte de cabelo',
        record_date: '2026-04-08',
      })
      const result = await createTransaction(formData)
      expect(result).toEqual({ success: 'Transação registrada com sucesso!' })
    })

    it('retorna erro se barbearia não encontrada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const barbershopChain = mockChain(null, null)
      mockFrom.mockReturnValue(barbershopChain)

      const { createTransaction } = await import('./actions')
      const formData = createFormData({
        type: 'income',
        amount: '50',
        category: 'Serviço',
        description: '',
        record_date: '2026-04-08',
      })
      const result = await createTransaction(formData)
      expect(result).toEqual({ error: 'Barbearia não encontrada.' })
    })
  })

  describe('deleteTransaction', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { deleteTransaction } = await import('./actions')
      const result = await deleteTransaction('tx-1')
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('exclui transação com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const chain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      mockFrom.mockReturnValue(chain)

      const { deleteTransaction } = await import('./actions')
      const result = await deleteTransaction('tx-1')
      expect(result).toEqual({ success: 'Transação excluída com sucesso!' })
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

      const { deleteTransaction } = await import('./actions')
      const result = await deleteTransaction('tx-1')
      expect(result).toEqual({ error: 'Erro ao excluir transação.' })
    })
  })
})
