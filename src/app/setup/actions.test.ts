import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFormData } from '@/__tests__/helpers'

const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: (...args: string[]) => {
    mockRedirect(...args)
    throw new Error('NEXT_REDIRECT')
  },
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
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
  return chain
}

describe('Setup Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createBarbershop', () => {
    it('retorna erro com dados inválidos', async () => {
      const { createBarbershop } = await import('./actions')
      const formData = createFormData({
        name: '',
        phone: '',
        street: '',
        number: '',
        city: '',
        state: '',
        zip: '',
      })
      const result = await createBarbershop(null, formData)
      expect(result).toEqual({ error: 'Por favor, verifique os dados preenchidos.' })
    })

    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { createBarbershop } = await import('./actions')
      const formData = createFormData({
        name: 'Barbearia Teste',
        phone: '11999999999',
        street: 'Rua das Flores, 100',
        number: '100',
        city: 'São Paulo',
        state: 'SP',
        zip: '01001-000',
      })
      const result = await createBarbershop(null, formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('cria barbearia com serviço e métodos de pagamento padrão e redireciona', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const barbershopData = { id: 'barbershop-1', name: 'Barbearia Teste' }
      const barbershopChain = mockChain(barbershopData)
      barbershopChain.insert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: barbershopData, error: null }),
        }),
      })

      const serviceChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }

      const paymentMethodsChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        if (table === 'services') return serviceChain
        if (table === 'payment_methods') return paymentMethodsChain
        return mockChain()
      })

      const { createBarbershop } = await import('./actions')
      const formData = createFormData({
        name: 'Barbearia Teste',
        phone: '11999999999',
        street: 'Rua das Flores, 100',
        number: '100',
        city: 'São Paulo',
        state: 'SP',
        zip: '01001-000',
      })

      await expect(createBarbershop(null, formData)).rejects.toThrow('NEXT_REDIRECT')
      expect(mockRedirect).toHaveBeenCalledWith('/dashboard')

      // Verifica que métodos de pagamento padrão foram inseridos
      expect(paymentMethodsChain.insert).toHaveBeenCalledTimes(1)
      const insertedMethods = paymentMethodsChain.insert.mock.calls[0][0] as Array<{ name: string; barbershop_id: string }>
      expect(insertedMethods).toHaveLength(4)
      expect(insertedMethods.map((m) => m.name)).toEqual([
        'Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito',
      ])
      expect(insertedMethods.every((m) => m.barbershop_id === 'barbershop-1')).toBe(true)
    })

    it('redireciona mesmo quando métodos de pagamento falham', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const barbershopData = { id: 'barbershop-1', name: 'Barbearia Teste' }
      const barbershopChain = mockChain(barbershopData)
      barbershopChain.insert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: barbershopData, error: null }),
        }),
      })

      const serviceChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }

      const paymentMethodsChain = {
        insert: vi.fn().mockResolvedValue({ error: { message: 'insert failed' } }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        if (table === 'services') return serviceChain
        if (table === 'payment_methods') return paymentMethodsChain
        return mockChain()
      })

      const { createBarbershop } = await import('./actions')
      const formData = createFormData({
        name: 'Barbearia Teste',
        phone: '11999999999',
        street: 'Rua das Flores, 100',
        number: '100',
        city: 'São Paulo',
        state: 'SP',
        zip: '01001-000',
      })

      // Não deve falhar o processo todo se payment_methods falhar
      await expect(createBarbershop(null, formData)).rejects.toThrow('NEXT_REDIRECT')
      expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
    })

    it('retorna erro quando inserção falha', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      const barbershopChain = mockChain()
      barbershopChain.insert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        }),
      })

      mockFrom.mockReturnValue(barbershopChain)

      const { createBarbershop } = await import('./actions')
      const formData = createFormData({
        name: 'Barbearia Teste',
        phone: '11999999999',
        street: 'Rua das Flores, 100',
        number: '100',
        city: 'São Paulo',
        state: 'SP',
        zip: '01001-000',
      })
      const result = await createBarbershop(null, formData)
      expect(result).toEqual({ error: 'Erro ao criar barbearia. Tente novamente.' })
    })
  })
})
