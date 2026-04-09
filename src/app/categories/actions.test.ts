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
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
  return chain
}

describe('Categories Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCategories', () => {
    it('retorna array vazio se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { getCategories } = await import('./actions')
      const result = await getCategories()
      expect(result).toEqual([])
    })

    it('retorna array vazio se barbearia não encontrada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const barbershopChain = mockChain(null, null)
      mockFrom.mockReturnValue(barbershopChain)

      const { getCategories } = await import('./actions')
      const result = await getCategories()
      expect(result).toEqual([])
    })

    it('retorna categorias com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const categories = [
        { id: '1', barbershop_id: 'b1', name: 'Serviço', type: 'income', created_at: '2026-01-01' },
        { id: '2', barbershop_id: 'b1', name: 'Aluguel', type: 'expense', created_at: '2026-01-01' },
      ]

      const barbershopChain = mockChain({ id: 'b1' })
      const categoriesChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: categories }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return categoriesChain
      })

      const { getCategories } = await import('./actions')
      const result = await getCategories()
      expect(result).toEqual(categories)
    })
  })

  describe('createCategory', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { createCategory } = await import('./actions')
      const formData = createFormData({ name: 'Transporte', type: 'expense' })
      const result = await createCategory(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('retorna erro com dados inválidos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const { createCategory } = await import('./actions')
      const formData = createFormData({ name: '', type: 'invalid' })
      const result = await createCategory(formData)
      expect(result).toEqual({ error: 'Dados inválidos. Verifique os campos.' })
    })

    it('retorna erro se barbearia não encontrada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const barbershopChain = mockChain(null, null)
      mockFrom.mockReturnValue(barbershopChain)

      const { createCategory } = await import('./actions')
      const formData = createFormData({ name: 'Transporte', type: 'expense' })
      const result = await createCategory(formData)
      expect(result).toEqual({ error: 'Barbearia não encontrada.' })
    })

    it('cria categoria com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const insertChain: any = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return insertChain
      })

      const { createCategory } = await import('./actions')
      const formData = createFormData({ name: 'Transporte', type: 'expense' })
      const result = await createCategory(formData)
      expect(result).toEqual({ success: 'Categoria criada com sucesso!' })
    })

    it('retorna erro para categoria duplicada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const insertChain: any = {
        insert: vi.fn().mockResolvedValue({ error: { code: '23505' } }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return insertChain
      })

      const { createCategory } = await import('./actions')
      const formData = createFormData({ name: 'Serviço', type: 'income' })
      const result = await createCategory(formData)
      expect(result).toEqual({ error: 'Já existe uma categoria com esse nome para esse tipo.' })
    })
  })

  describe('deleteCategory', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { deleteCategory } = await import('./actions')
      const result = await deleteCategory('cat-1')
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('exclui categoria com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const deleteChain: any = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }

      mockFrom.mockReturnValue(deleteChain)

      const { deleteCategory } = await import('./actions')
      const result = await deleteCategory('cat-1')
      expect(result).toEqual({ success: 'Categoria excluída com sucesso!' })
    })

    it('retorna erro ao falhar exclusão', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const deleteChain: any = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'db error' } }),
      }

      mockFrom.mockReturnValue(deleteChain)

      const { deleteCategory } = await import('./actions')
      const result = await deleteCategory('cat-1')
      expect(result).toEqual({ error: 'Erro ao excluir categoria.' })
    })
  })
})
