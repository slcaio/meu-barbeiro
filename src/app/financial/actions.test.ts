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
      const existingChain = mockChain({ id: 'tx-1', stock_movement_id: null, is_cogs: false })
      const deleteChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      let call = 0
      mockFrom.mockImplementation(() => {
        call += 1
        return call === 1 ? existingChain : deleteChain
      })

      const { deleteTransaction } = await import('./actions')
      const result = await deleteTransaction('tx-1')
      expect(result).toEqual({ success: 'Transação excluída com sucesso!' })
    })

    it('bloqueia exclusão de registro de CMV', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const existingChain = mockChain({ id: 'tx-1', stock_movement_id: 'mv-1', is_cogs: true })
      mockFrom.mockReturnValue(existingChain)

      const { deleteTransaction } = await import('./actions')
      const result = await deleteTransaction('tx-1')
      expect(result).toEqual({
        error: 'Transações vinculadas a vendas ou custo de produto não podem ser excluídas aqui.',
      })
    })

    it('retorna erro ao falhar exclusão', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const existingChain = mockChain({ id: 'tx-1', stock_movement_id: null, is_cogs: false })
      const deleteChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
      }
      let call = 0
      mockFrom.mockImplementation(() => {
        call += 1
        return call === 1 ? existingChain : deleteChain
      })

      const { deleteTransaction } = await import('./actions')
      const result = await deleteTransaction('tx-1')
      expect(result).toEqual({ error: 'Erro ao excluir transação.' })
    })
  })

  describe('updateTransaction', () => {
    const validInput = () =>
      createFormData({
        id: '11111111-1111-4111-8111-111111111111',
        type: 'expense',
        amount: '100',
        category: 'Outros',
        description: 'Atualizado',
        record_date: '2026-04-08',
      })

    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { updateTransaction } = await import('./actions')
      const result = await updateTransaction(validInput())
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('retorna erro com dados inválidos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
      const { updateTransaction } = await import('./actions')
      const formData = createFormData({
        id: 'invalid-uuid',
        type: 'income',
        amount: '0',
        category: '',
        record_date: 'bad',
      })
      const result = await updateTransaction(formData)
      expect(result).toEqual({ error: 'Dados inválidos. Verifique os campos.' })
    })

    it('retorna erro se barbearia não encontrada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
      const barbershopChain = mockChain(null)
      mockFrom.mockReturnValue(barbershopChain)
      const { updateTransaction } = await import('./actions')
      const result = await updateTransaction(validInput())
      expect(result).toEqual({ error: 'Barbearia não encontrada.' })
    })

    it('bloqueia edição de CMV / venda', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const existingChain = mockChain({
        id: '11111111-1111-4111-8111-111111111111',
        stock_movement_id: 'mv-1',
        is_cogs: true,
        barbershop_id: 'barbershop-1',
      })
      let call = 0
      mockFrom.mockImplementation(() => {
        call += 1
        return call === 1 ? barbershopChain : existingChain
      })
      const { updateTransaction } = await import('./actions')
      const result = await updateTransaction(validInput())
      expect(result).toEqual({
        error: 'Transações vinculadas a vendas ou custo de produto não podem ser editadas.',
      })
    })

    it('atualiza transação manual com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const existingChain = mockChain({
        id: '11111111-1111-4111-8111-111111111111',
        stock_movement_id: null,
        is_cogs: false,
        barbershop_id: 'barbershop-1',
      })
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      let call = 0
      mockFrom.mockImplementation(() => {
        call += 1
        if (call === 1) return barbershopChain
        if (call === 2) return existingChain
        return updateChain
      })
      const { updateTransaction } = await import('./actions')
      const result = await updateTransaction(validInput())
      expect(result).toEqual({ success: 'Transação atualizada com sucesso!' })
    })
  })

  describe('getFinancialPageData', () => {
    it('separa COGS da despesa e calcula lucro líquido = receita - despesa - custo', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })

      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const categoriesChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [] }),
      }
      const usedRecordsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [] }),
      }
      const records = [
        { id: '1', type: 'income', amount: 200, description: 'Venda', category: 'Produto', record_date: '2026-04-08', is_cogs: false, stock_movement_id: 'mv-1' },
        { id: '2', type: 'expense', amount: 60, description: 'Custo', category: 'Custo de Produto', record_date: '2026-04-08', is_cogs: true, stock_movement_id: 'mv-1' },
        { id: '3', type: 'expense', amount: 30, description: 'Conta de luz', category: 'Outros', record_date: '2026-04-08', is_cogs: false, stock_movement_id: null },
      ]
      const transactionsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: records }),
      }

      let call = 0
      mockFrom.mockImplementation(() => {
        call += 1
        if (call === 1) return barbershopChain
        if (call === 2) return categoriesChain
        if (call === 3) return usedRecordsChain
        return transactionsChain
      })

      const { getFinancialPageData } = await import('./actions')
      const result = await getFinancialPageData({})

      expect(result.summary.totalIncome).toBe(200)
      expect(result.summary.expenses).toBe(30)
      expect(result.summary.cogs).toBe(60)
      expect(result.summary.netProfit).toBe(110)
      // COGS must not appear in expense breakdown chart
      expect(result.expenseCategoryData.find(c => c.name === 'Custo de Produto')).toBeUndefined()
      expect(result.expenseCategoryData.find(c => c.name === 'Outros')?.value).toBe(30)
    })
  })
})
