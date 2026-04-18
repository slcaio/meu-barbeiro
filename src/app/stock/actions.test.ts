import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFormData } from '@/__tests__/helpers'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const mockFrom = vi.fn()
const mockRpc = vi.fn()
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: mockFrom,
  rpc: mockRpc,
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

// Creates a chain where chaining resolves via thenable (supports multiple .eq() calls)
function mockThenableChain(resolveValue: unknown = { error: null }) {
  const chain: Record<string, unknown> = {
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    then: (resolve: (val: unknown) => void) => resolve(resolveValue),
  }
  ;(chain.update as ReturnType<typeof vi.fn>).mockReturnValue(chain)
  ;(chain.delete as ReturnType<typeof vi.fn>).mockReturnValue(chain)
  ;(chain.eq as ReturnType<typeof vi.fn>).mockReturnValue(chain)
  return chain
}

describe('Stock Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ error: null })
  })

  // ============================================================
  // getProducts
  // ============================================================

  describe('getProducts', () => {
    it('lança erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { getProducts } = await import('./actions')
      await expect(getProducts()).rejects.toThrow('Não autenticado')
    })

    it('lança erro se barbearia não encontrada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain(null, null)
      mockFrom.mockReturnValue(barbershopChain)
      const { getProducts } = await import('./actions')
      await expect(getProducts()).rejects.toThrow('Barbearia não encontrada')
    })

    it('retorna lista de produtos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const products = [
        { id: '1', name: 'Pomada', sale_price: 35, current_stock: 10 },
        { id: '2', name: 'Shampoo', sale_price: 25, current_stock: 5 },
      ]
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const productsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: products, error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return productsChain
      })

      const { getProducts } = await import('./actions')
      const result = await getProducts()
      expect(result).toEqual(products)
    })
  })

  // ============================================================
  // createProduct
  // ============================================================

  describe('createProduct', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { createProduct } = await import('./actions')
      const formData = createFormData({ name: 'Pomada', sale_price: '35' })
      const result = await createProduct(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('retorna erro com dados inválidos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      mockFrom.mockReturnValue(barbershopChain)

      const { createProduct } = await import('./actions')
      const formData = createFormData({ name: '', sale_price: '0' })
      const result = await createProduct(formData)
      expect(result).toEqual({ error: 'Dados inválidos. Verifique os campos.' })
    })

    it('cria produto com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'product-1' }, error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return insertChain
      })

      const { createProduct } = await import('./actions')
      const formData = createFormData({
        name: 'Pomada Modeladora',
        description: 'Pomada forte',
        cost_price: '15',
        sale_price: '35',
        initial_stock: '0',
        min_stock: '5',
        unit: 'un',
      })
      const result = await createProduct(formData)
      expect(result).toEqual({ success: 'Produto cadastrado com sucesso!', productId: 'product-1' })
    })

    it('retorna erro de nome duplicado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: '23505' } }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return insertChain
      })

      const { createProduct } = await import('./actions')
      const formData = createFormData({
        name: 'Pomada Modeladora',
        cost_price: '15',
        sale_price: '35',
      })
      const result = await createProduct(formData)
      expect(result).toEqual({ error: 'Já existe um produto com este nome.' })
    })
  })

  // ============================================================
  // updateProduct
  // ============================================================

  describe('updateProduct', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { updateProduct } = await import('./actions')
      const formData = createFormData({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Pomada',
        sale_price: '35',
      })
      const result = await updateProduct(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('atualiza produto com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const updateChain = mockThenableChain({ error: null })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return updateChain
      })

      const { updateProduct } = await import('./actions')
      const formData = createFormData({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Pomada Atualizada',
        description: '',
        cost_price: '18',
        sale_price: '40',
        min_stock: '3',
        unit: 'un',
      })
      const result = await updateProduct(formData)
      expect(result).toEqual({ success: 'Produto atualizado com sucesso!' })
    })
  })

  // ============================================================
  // deleteProduct
  // ============================================================

  describe('deleteProduct', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { deleteProduct } = await import('./actions')
      const result = await deleteProduct('product-1')
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('soft delete quando tem movimentações', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const countChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 3 }),
      }
      const updateChain = mockThenableChain({ error: null })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        if (table === 'stock_movements') return countChain
        return updateChain
      })

      const { deleteProduct } = await import('./actions')
      const result = await deleteProduct('product-1')
      expect(result).toEqual({ success: 'Produto excluído com sucesso!' })
    })

    it('hard delete quando não tem movimentações', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const countChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 0 }),
      }
      const deleteChain = mockThenableChain({ error: null })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        if (table === 'stock_movements') return countChain
        return deleteChain
      })

      const { deleteProduct } = await import('./actions')
      const result = await deleteProduct('product-1')
      expect(result).toEqual({ success: 'Produto excluído com sucesso!' })
    })
  })

  // ============================================================
  // registerStockEntry
  // ============================================================

  describe('registerStockEntry', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { registerStockEntry } = await import('./actions')
      const formData = createFormData({
        product_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: '10',
        unit_cost: '15',
      })
      const result = await registerStockEntry(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('registra entrada com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })

      // First products query: checks product existence (returns { id })
      const productExistChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'product-1' }, error: null }),
      }
      // Second products query: fetches current_stock + average_cost for WAC recalculation
      const productStockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { current_stock: 5, average_cost: 10 },
          error: null,
        }),
      }
      // Third products call: update average_cost
      const productUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }

      const insertChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }

      let productCallCount = 0
      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        if (table === 'products') {
          productCallCount++
          if (productCallCount === 1) return productExistChain
          if (productCallCount === 2) return productStockChain
          return productUpdateChain
        }
        return insertChain
      })

      const { registerStockEntry } = await import('./actions')
      const formData = createFormData({
        product_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: '10',
        unit_cost: '15',
        notes: 'Compra no fornecedor',
      })
      const result = await registerStockEntry(formData)
      expect(result).toEqual({ success: 'Entrada registrada com sucesso!' })
    })

    it('calcula custo médio ponderado corretamente ao registrar entrada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const productExistChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'product-1' }, error: null }),
      }
      // 50 un @ R$10 já existentes → novo CMP com 30 un @ R$12
      // esperado: (50*10 + 30*12) / 80 = 860/80 = 10.75
      const productStockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { current_stock: 50, average_cost: 10 },
          error: null,
        }),
      }
      const updateFn = vi.fn().mockReturnThis()
      const eqFn = vi.fn().mockReturnThis()
      const productUpdateChain = { update: updateFn, eq: eqFn }

      const insertChain = { insert: vi.fn().mockResolvedValue({ error: null }) }

      let productCallCount = 0
      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        if (table === 'products') {
          productCallCount++
          if (productCallCount === 1) return productExistChain
          if (productCallCount === 2) return productStockChain
          return productUpdateChain
        }
        return insertChain
      })

      const { registerStockEntry } = await import('./actions')
      const formData = createFormData({
        product_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: '30',
        unit_cost: '12',
      })
      await registerStockEntry(formData)

      expect(updateFn).toHaveBeenCalledWith({ average_cost: 10.75 })
    })
  })

  // ============================================================
  // registerStockSale
  // ============================================================

  describe('registerStockSale', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { registerStockSale } = await import('./actions')
      const formData = createFormData({
        product_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: '2',
        unit_price: '35',
      })
      const result = await registerStockSale(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('retorna erro com estoque insuficiente', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const productChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'product-1', name: 'Pomada', current_stock: 1 },
          error: null,
        }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return productChain
      })

      const { registerStockSale } = await import('./actions')
      const formData = createFormData({
        product_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: '5',
        unit_price: '35',
      })
      const result = await registerStockSale(formData)
      expect(result).toEqual({ error: 'Estoque insuficiente. Disponível: 1 un.' })
    })

    it('registra venda com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const productChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'product-1', name: 'Pomada', current_stock: 10 },
          error: null,
        }),
      }
      const movementInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'movement-1' }, error: null }),
      }
      const finInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'fin-1' }, error: null }),
      }
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }

      let fromCallCount = 0
      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        if (table === 'products') return productChain
        if (table === 'stock_movements') {
          fromCallCount++
          if (fromCallCount <= 1) return movementInsertChain
          return updateChain
        }
        if (table === 'financial_records') return finInsertChain
        return mockChain()
      })

      const { registerStockSale } = await import('./actions')
      const formData = createFormData({
        product_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: '2',
        unit_price: '35',
      })
      const result = await registerStockSale(formData)
      expect(result).toEqual({ success: 'Venda registrada com sucesso!' })
    })
  })

  // ============================================================
  // settleStockEntry
  // ============================================================

  describe('settleStockEntry', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { settleStockEntry } = await import('./actions')
      const result = await settleStockEntry('movement-1')
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('retorna erro se já liquidada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const movementChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return movementChain
      })

      const { settleStockEntry } = await import('./actions')
      const result = await settleStockEntry('movement-1')
      expect(result).toEqual({ error: 'Movimentação não encontrada ou já liquidada.' })
    })

    it('liquida entrada com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const movementChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'movement-1', product_id: 'product-1', quantity: 10, total_cost: 150, financial_status: 'pending' },
          error: null,
        }),
      }
      const productChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { name: 'Pomada' }, error: null }),
      }
      const finInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'fin-1' }, error: null }),
      }
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }

      let movementCalls = 0
      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        if (table === 'stock_movements') {
          movementCalls++
          if (movementCalls <= 1) return movementChain
          return updateChain
        }
        if (table === 'products') return productChain
        if (table === 'financial_records') return finInsertChain
        return mockChain()
      })

      const { settleStockEntry } = await import('./actions')
      const result = await settleStockEntry('movement-1')
      expect(result).toEqual({ success: 'Entrada liquidada com sucesso!' })
    })
  })

  // ============================================================
  // adjustStock
  // ============================================================

  describe('adjustStock', () => {
    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { adjustStock } = await import('./actions')
      const formData = createFormData({
        product_id: '550e8400-e29b-41d4-a716-446655440000',
        new_quantity: '10',
        notes: 'Ajuste de inventário',
      })
      const result = await adjustStock(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('retorna erro sem notas (motivo)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      mockFrom.mockReturnValue(barbershopChain)

      const { adjustStock } = await import('./actions')
      const formData = createFormData({
        product_id: '550e8400-e29b-41d4-a716-446655440000',
        new_quantity: '10',
        notes: 'ab',
      })
      const result = await adjustStock(formData)
      expect(result.error).toBeDefined()
    })

    it('retorna erro se estoque já está neste valor', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const productChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'product-1', current_stock: 10 },
          error: null,
        }),
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        return productChain
      })

      const { adjustStock } = await import('./actions')
      const formData = createFormData({
        product_id: '550e8400-e29b-41d4-a716-446655440000',
        new_quantity: '10',
        notes: 'Contagem de inventário',
      })
      const result = await adjustStock(formData)
      expect(result).toEqual({ error: 'Estoque já está neste valor.' })
    })

    it('ajusta estoque com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      const barbershopChain = mockChain({ id: 'barbershop-1' })
      const productChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'product-1', current_stock: 10 },
          error: null,
        }),
      }
      const insertChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
      const updateChain = mockThenableChain({ error: null })

      let productCalls = 0
      mockFrom.mockImplementation((table: string) => {
        if (table === 'barbershops') return barbershopChain
        if (table === 'products') {
          productCalls++
          if (productCalls <= 1) return productChain
          return updateChain
        }
        if (table === 'stock_movements') return insertChain
        return mockChain()
      })

      const { adjustStock } = await import('./actions')
      const formData = createFormData({
        product_id: '550e8400-e29b-41d4-a716-446655440000',
        new_quantity: '15',
        notes: 'Contagem de inventário',
      })
      const result = await adjustStock(formData)
      expect(result).toEqual({ success: 'Estoque ajustado com sucesso!' })
    })
  })

  // ============================================================
  // uploadProductPhoto
  // ============================================================

  describe('uploadProductPhoto', () => {
    const makeFile = (type = 'image/jpeg', size = 1024) => {
      const file = new File(['x'.repeat(size)], 'photo.jpg', { type })
      return file
    }

    it('retorna erro se não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      const { uploadProductPhoto } = await import('./actions')
      const formData = createFormData({ product_id: '550e8400-e29b-41d4-a716-446655440000' })
      formData.set('file', makeFile())
      const result = await uploadProductPhoto(formData)
      expect(result).toEqual({ error: 'Usuário não autenticado.' })
    })

    it('retorna erro para formato inválido', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      const barbershopChain = mockChain({ id: 'bs-1' })
      mockFrom.mockReturnValue(barbershopChain)
      const { uploadProductPhoto } = await import('./actions')
      const formData = createFormData({ product_id: '550e8400-e29b-41d4-a716-446655440000' })
      formData.set('file', makeFile('image/gif'))
      const result = await uploadProductPhoto(formData)
      expect(result).toEqual({ error: 'Formato inválido. Use JPEG, PNG ou WebP.' })
    })

    it('retorna erro para arquivo acima de 2MB', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      const barbershopChain = mockChain({ id: 'bs-1' })
      mockFrom.mockReturnValue(barbershopChain)
      const { uploadProductPhoto } = await import('./actions')
      const formData = createFormData({ product_id: '550e8400-e29b-41d4-a716-446655440000' })
      formData.set('file', makeFile('image/jpeg', 3 * 1024 * 1024))
      const result = await uploadProductPhoto(formData)
      expect(result).toEqual({ error: 'Imagem deve ter no máximo 2MB.' })
    })

    it('retorna erro se produto não encontrado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      const barbershopChain = mockChain({ id: 'bs-1' })
      const productChain = mockChain(null)
      let fromCount = 0
      mockFrom.mockImplementation(() => {
        fromCount++
        return fromCount === 1 ? barbershopChain : productChain
      })
      const { uploadProductPhoto } = await import('./actions')
      const formData = createFormData({ product_id: '550e8400-e29b-41d4-a716-446655440000' })
      formData.set('file', makeFile())
      const result = await uploadProductPhoto(formData)
      expect(result).toEqual({ error: 'Produto não encontrado.' })
    })

    it('retorna erro se upload falhar', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      const barbershopChain = mockChain({ id: 'bs-1' })
      const productChain = mockChain({ id: 'product-1' })
      let fromCount = 0
      mockFrom.mockImplementation(() => {
        fromCount++
        return fromCount === 1 ? barbershopChain : productChain
      })
      const storageMock = {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ error: { message: 'Storage error' } }),
          getPublicUrl: vi.fn(),
        }),
      }
      ;(mockSupabase as unknown as Record<string, unknown>).storage = storageMock
      const { uploadProductPhoto } = await import('./actions')
      const formData = createFormData({ product_id: '550e8400-e29b-41d4-a716-446655440000' })
      formData.set('file', makeFile())
      const result = await uploadProductPhoto(formData)
      expect(result).toEqual({ error: 'Erro ao fazer upload da foto.' })
    })

    it('faz upload e atualiza photo_url com sucesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      const barbershopChain = mockChain({ id: 'bs-1' })
      const productChain = mockChain({ id: 'product-1' })
      const finalEqChain = { eq: vi.fn().mockResolvedValue({ error: null }) }
      const updateChain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnValue(finalEqChain) }
      let fromCount = 0
      mockFrom.mockImplementation((table: string) => {
        fromCount++
        if (fromCount === 1) return barbershopChain
        if (fromCount === 2) return productChain
        if (table === 'products') return updateChain
        return mockChain()
      })
      const publicUrl = 'https://example.supabase.co/storage/v1/object/public/product-photos/bs-1/product-1.jpg'
      const storageMock = {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl } }),
        }),
      }
      ;(mockSupabase as unknown as Record<string, unknown>).storage = storageMock
      const { uploadProductPhoto } = await import('./actions')
      const formData = createFormData({ product_id: '550e8400-e29b-41d4-a716-446655440000' })
      formData.set('file', makeFile())
      const result = await uploadProductPhoto(formData)
      expect(result).toEqual({ success: true, url: publicUrl })
    })
  })
})
