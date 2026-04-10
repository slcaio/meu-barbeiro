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

describe('Payment Methods Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPaymentMethods', () => {
    it('lança erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { getPaymentMethods } = await import('./actions')
      await expect(getPaymentMethods()).rejects.toThrow('Não autenticado')
    })

    it('lança erro se barbearia não encontrada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain(null, null)
      mockFrom.mockReturnValue(barbershopChain)
      const { getPaymentMethods } = await import('./actions')
      await expect(getPaymentMethods()).rejects.toThrow('Barbearia não encontrada')
    })

    it('retorna lista de métodos de pagamento', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const methods = [
        { id: '1', name: 'Dinheiro', fee_type: 'percentage', fee_value: 0 },
        { id: '2', name: 'Cartão de Crédito', fee_type: 'percentage', fee_value: 3 },
      ]
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const methodsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: methods, error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return methodsChain
      })

      const { getPaymentMethods } = await import('./actions')
      const result = await getPaymentMethods()
      expect(result).toEqual(methods)
    })
  })

  describe('createPaymentMethod', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { createPaymentMethod } = await import('./actions')
      const formData = createFormData({ name: 'Pix' })
      const result = await createPaymentMethod(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('retorna erro com dados inválidos (nome curto)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const { createPaymentMethod } = await import('./actions')
      const formData = createFormData({ name: '' })
      const result = await createPaymentMethod(formData)
      expect(result).toEqual({ error: 'Dados inválidos. Verifique os campos.' })
    })

    it('retorna erro se barbearia não encontrada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain(null, null)
      mockFrom.mockReturnValue(barbershopChain)

      const { createPaymentMethod } = await import('./actions')
      const formData = createFormData({
        name: 'Pix',
        fee_type: 'percentage',
        fee_value: '0',
      })
      const result = await createPaymentMethod(formData)
      expect(result).toEqual({ error: 'Barbearia não encontrada.' })
    })

    it('cria método de pagamento com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'new-pm-1' }, error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return insertChain
      })

      const { createPaymentMethod } = await import('./actions')
      const formData = createFormData({
        name: 'Cartão de Crédito',
        fee_type: 'percentage',
        fee_value: '3',
      })
      const result = await createPaymentMethod(formData)
      expect(result).toEqual({ success: 'Método de pagamento cadastrado com sucesso!' })
    })

    it('cria método com taxa fixa', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'new-pm-2' }, error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return insertChain
      })

      const { createPaymentMethod } = await import('./actions')
      const formData = createFormData({
        name: 'Taxa Fixa Teste',
        fee_type: 'fixed',
        fee_value: '2.50',
      })
      const result = await createPaymentMethod(formData)
      expect(result).toEqual({ success: 'Método de pagamento cadastrado com sucesso!' })
    })

    it('cria método com parcelamento e taxas por parcela', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'new-pm-3' }, error: null }),
      }
      const installmentsInsertChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        if (table === 'payment_method_installments') return installmentsInsertChain
        return insertChain
      })

      const { createPaymentMethod } = await import('./actions')
      const installments = JSON.stringify([
        { installment_number: 2, fee_percentage: 4.5 },
        { installment_number: 3, fee_percentage: 6.0 },
      ])
      const formData = createFormData({
        name: 'Cartão Crédito Parcelas',
        fee_type: 'percentage',
        fee_value: '3',
        supports_installments: 'true',
        installments_json: installments,
      })
      const result = await createPaymentMethod(formData)
      expect(result).toEqual({ success: 'Método de pagamento cadastrado com sucesso!' })
      expect(installmentsInsertChain.insert).toHaveBeenCalledWith([
        { payment_method_id: 'new-pm-3', installment_number: 2, fee_percentage: 4.5 },
        { payment_method_id: 'new-pm-3', installment_number: 3, fee_percentage: 6.0 },
      ])
    })

    it('retorna erro ao falhar inserção no banco', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return insertChain
      })

      const { createPaymentMethod } = await import('./actions')
      const formData = createFormData({
        name: 'Pix',
        fee_type: 'percentage',
        fee_value: '0',
      })
      const result = await createPaymentMethod(formData)
      expect(result).toEqual({ error: 'Erro ao cadastrar método de pagamento.' })
    })
  })

  describe('updatePaymentMethod', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { updatePaymentMethod } = await import('./actions')
      const formData = createFormData({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Pix',
      })
      const result = await updatePaymentMethod(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('retorna erro com dados inválidos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const { updatePaymentMethod } = await import('./actions')
      const formData = createFormData({
        id: 'invalid-uuid',
        name: 'P',
      })
      const result = await updatePaymentMethod(formData)
      expect(result).toEqual({ error: 'Dados inválidos. Verifique os campos.' })
    })

    it('atualiza método com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      const deleteInstallmentsChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'payment_method_installments') return deleteInstallmentsChain
        return updateChain
      })

      const { updatePaymentMethod } = await import('./actions')
      const formData = createFormData({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Cartão Crédito Atualizado',
        fee_type: 'percentage',
        fee_value: '5',
        is_active: 'true',
      })
      const result = await updatePaymentMethod(formData)
      expect(result).toEqual({ success: 'Método de pagamento atualizado com sucesso!' })
    })

    it('desativa método de pagamento', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      const deleteInstallmentsChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'payment_method_installments') return deleteInstallmentsChain
        return updateChain
      })

      const { updatePaymentMethod } = await import('./actions')
      const formData = createFormData({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Cartão Crédito',
        fee_type: 'percentage',
        fee_value: '3',
        is_active: 'false',
      })
      const result = await updatePaymentMethod(formData)
      expect(result).toEqual({ success: 'Método de pagamento atualizado com sucesso!' })
    })

    it('atualiza método com parcelamento e substitui taxas', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      const deleteInstallmentsChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      const insertInstallmentsChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'payment_method_installments') {
          // First call is delete, subsequent is insert
          if (deleteInstallmentsChain.delete.mock.calls.length === 0) {
            return deleteInstallmentsChain
          }
          return insertInstallmentsChain
        }
        return updateChain
      })

      const { updatePaymentMethod } = await import('./actions')
      const installments = JSON.stringify([
        { installment_number: 2, fee_percentage: 5 },
        { installment_number: 3, fee_percentage: 7 },
      ])
      const formData = createFormData({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Cartão Crédito Parcelas',
        fee_type: 'percentage',
        fee_value: '3',
        is_active: 'true',
        supports_installments: 'true',
        installments_json: installments,
      })
      const result = await updatePaymentMethod(formData)
      expect(result).toEqual({ success: 'Método de pagamento atualizado com sucesso!' })
      expect(insertInstallmentsChain.insert).toHaveBeenCalledWith([
        { payment_method_id: '550e8400-e29b-41d4-a716-446655440000', installment_number: 2, fee_percentage: 5 },
        { payment_method_id: '550e8400-e29b-41d4-a716-446655440000', installment_number: 3, fee_percentage: 7 },
      ])
    })

    it('retorna erro ao falhar atualização', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
      }
      mockFrom.mockReturnValue(chain)

      const { updatePaymentMethod } = await import('./actions')
      const formData = createFormData({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Pix',
        fee_type: 'percentage',
        fee_value: '0',
        is_active: 'true',
      })
      const result = await updatePaymentMethod(formData)
      expect(result).toEqual({ error: 'Erro ao atualizar método de pagamento.' })
    })
  })

  describe('deletePaymentMethod', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { deletePaymentMethod } = await import('./actions')
      const result = await deletePaymentMethod('pm-1')
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('exclui método com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const chain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      mockFrom.mockReturnValue(chain)

      const { deletePaymentMethod } = await import('./actions')
      const result = await deletePaymentMethod('pm-1')
      expect(result).toEqual({ success: 'Método de pagamento excluído com sucesso!' })
    })

    it('retorna erro ao falhar exclusão (FK constraint)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const chain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'FK constraint' } }),
      }
      mockFrom.mockReturnValue(chain)

      const { deletePaymentMethod } = await import('./actions')
      const result = await deletePaymentMethod('pm-1')
      expect(result).toEqual({ error: 'Erro ao excluir método de pagamento. Pode estar sendo usado em agendamentos.' })
    })
  })
})
