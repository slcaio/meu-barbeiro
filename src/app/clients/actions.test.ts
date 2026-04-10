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

describe('Clients Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getClients', () => {
    it('lança erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { getClients } = await import('./actions')
      await expect(getClients()).rejects.toThrow('User not authenticated')
    })

    it('lança erro se barbearia não encontrada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain(null, null)
      const clientsChain = mockChain()
      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return clientsChain
      })
      const { getClients } = await import('./actions')
      await expect(getClients()).rejects.toThrow('Barbershop not found')
    })

    it('retorna lista de clientes', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const clients = [
        { id: '1', name: 'João', phone: '11999999999' },
        { id: '2', name: 'Maria', phone: '11888888888' },
      ]
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const clientsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: clients, error: null }),
      }
      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return clientsChain
      })
      const { getClients } = await import('./actions')
      const result = await getClients()
      expect(result).toEqual(clients)
    })
  })

  describe('createNewClient', () => {
    it('retorna erro com dados inválidos', async () => {
      const { createNewClient } = await import('./actions')
      const formData = createFormData({ name: '', phone: '', email: 'invalid' })
      const result = await createNewClient(formData)
      expect(result).toHaveProperty('error')
    })

    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { createNewClient } = await import('./actions')
      const formData = createFormData({ name: 'João Silva', phone: '11999999999', email: '' })
      const result = await createNewClient(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado' })
    })

    it('cria cliente com sucesso', async () => {
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

      const { createNewClient } = await import('./actions')
      const formData = createFormData({
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@test.com',
      })
      const result = await createNewClient(formData)
      expect(result).toEqual({ success: 'Cliente criado com sucesso!' })
    })
  })

  describe('deleteClient', () => {
    it('exclui cliente com sucesso', async () => {
      const deleteChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      mockFrom.mockReturnValue(deleteChain)

      const { deleteClient } = await import('./actions')
      const result = await deleteClient('client-1')
      expect(result).toEqual({ success: 'Cliente excluído com sucesso!' })
    })

    it('retorna erro ao falhar exclusão', async () => {
      const deleteChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'FK constraint' } }),
      }
      mockFrom.mockReturnValue(deleteChain)

      const { deleteClient } = await import('./actions')
      const result = await deleteClient('client-1')
      expect(result).toEqual({ error: 'Erro ao excluir cliente.' })
    })
  })
})
