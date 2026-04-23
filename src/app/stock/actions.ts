'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// ============================================================
// Schemas
// ============================================================

const productSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional().or(z.literal('')),
  cost_price: z.coerce.number().min(0, 'Preço de custo deve ser ≥ 0'),
  sale_price: z.coerce.number().min(0.01, 'Preço de venda deve ser positivo'),
  initial_stock: z.coerce.number().int().min(0).default(0),
  min_stock: z.coerce.number().int().min(0).default(0),
  unit: z.enum(['un', 'ml', 'g', 'kg', 'L']).default('un'),
  commission_percentage: z.coerce.number().min(0).max(100).default(0),
})

const updateProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional().or(z.literal('')),
  cost_price: z.coerce.number().min(0, 'Preço de custo deve ser ≥ 0'),
  sale_price: z.coerce.number().min(0.01, 'Preço de venda deve ser positivo'),
  min_stock: z.coerce.number().int().min(0).default(0),
  unit: z.enum(['un', 'ml', 'g', 'kg', 'L']).default('un'),
  commission_percentage: z.coerce.number().min(0).max(100).default(0),
})

const stockEntrySchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1, 'Quantidade deve ser ≥ 1'),
  unit_cost: z.coerce.number().min(0, 'Custo unitário deve ser ≥ 0'),
  notes: z.string().optional().or(z.literal('')),
})

const stockSaleSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1, 'Quantidade deve ser ≥ 1'),
  unit_price: z.coerce.number().min(0.01, 'Preço unitário deve ser positivo'),
  payment_method_id: z.string().uuid().optional().or(z.literal('')),
  installments: z.coerce.number().int().min(1).default(1),
  barber_id: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

const adjustStockSchema = z.object({
  product_id: z.string().uuid(),
  new_quantity: z.coerce.number().int().min(0, 'Quantidade não pode ser negativa'),
  notes: z.string().min(3, 'Motivo do ajuste é obrigatório'),
})

// ============================================================
// Helper: extract storage path from a product photo URL
// ============================================================

function extractStoragePath(photoUrl: string): string | null {
  try {
    const url = new URL(photoUrl)
    const match = url.pathname.match(/\/product-photos\/(.+)/)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

// ============================================================
// Helper: get authenticated user + barbershop
// ============================================================

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, barbershop: null }

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return { supabase, user, barbershop }
}

// ============================================================
// GET — Products
// ============================================================

export async function getProducts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) throw new Error('Barbearia não encontrada')

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data
}

// ============================================================
// CREATE — Product
// ============================================================

export async function createProduct(formData: FormData) {
  const { supabase, user, barbershop } = await getAuthContext()
  if (!user) return { error: 'Usuário não autenticado.' }
  if (!barbershop) return { error: 'Barbearia não encontrada.' }

  const rawData = {
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    cost_price: formData.get('cost_price') ?? '0',
    sale_price: formData.get('sale_price'),
    initial_stock: formData.get('initial_stock') || '0',
    min_stock: formData.get('min_stock') || '0',
    unit: formData.get('unit') || 'un',
    commission_percentage: formData.get('commission_percentage') || '0',
  }

  const validation = productSchema.safeParse(rawData)
  if (!validation.success) return { error: 'Dados inválidos. Verifique os campos.' }

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      barbershop_id: barbershop.id,
      name: validation.data.name,
      description: validation.data.description || null,
      cost_price: validation.data.cost_price,
      sale_price: validation.data.sale_price,
      average_cost: validation.data.cost_price,
      photo_url: (formData.get('photo_url') as string) || null,
      current_stock: validation.data.initial_stock,
      min_stock: validation.data.min_stock,
      unit: validation.data.unit,
      commission_percentage: validation.data.commission_percentage,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Já existe um produto com este nome.' }
    console.error('Error creating product:', error)
    return { error: 'Erro ao cadastrar produto.' }
  }

  if (validation.data.initial_stock > 0 && product) {
    await supabase.from('stock_movements').insert({
      product_id: product.id,
      barbershop_id: barbershop.id,
      type: 'entry',
      quantity: validation.data.initial_stock,
      unit_cost: validation.data.cost_price,
      total_cost: validation.data.initial_stock * validation.data.cost_price,
      source: 'manual',
      financial_status: 'none',
      notes: 'Estoque inicial',
    })
  }

  revalidatePath('/stock')
  return { success: 'Produto cadastrado com sucesso!', productId: product.id }
}

// ============================================================
// UPDATE — Product
// ============================================================

export async function updateProduct(formData: FormData) {
  const { supabase, user, barbershop } = await getAuthContext()
  if (!user) return { error: 'Usuário não autenticado.' }
  if (!barbershop) return { error: 'Barbearia não encontrada.' }

  const rawData = {
    id: formData.get('id'),
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    cost_price: formData.get('cost_price') ?? '0',
    sale_price: formData.get('sale_price'),
    min_stock: formData.get('min_stock') || '0',
    unit: formData.get('unit') || 'un',
    commission_percentage: formData.get('commission_percentage') || '0',
  }

  const validation = updateProductSchema.safeParse(rawData)
  if (!validation.success) return { error: 'Dados inválidos. Verifique os campos.' }

  // When removing the photo, also delete the file from storage
  const isRemovingPhoto = formData.has('photo_url') && !(formData.get('photo_url') as string)
  if (isRemovingPhoto) {
    const { data: current } = await supabase
      .from('products')
      .select('photo_url')
      .eq('id', validation.data.id)
      .eq('barbershop_id', barbershop.id)
      .single()
    if (current?.photo_url) {
      const oldPath = extractStoragePath(current.photo_url)
      if (oldPath) {
        await supabase.storage.from('product-photos').remove([oldPath])
      }
    }
  }

  const { error } = await supabase
    .from('products')
    .update({
      name: validation.data.name,
      description: validation.data.description || null,
      cost_price: validation.data.cost_price,
      sale_price: validation.data.sale_price,
      min_stock: validation.data.min_stock,
      unit: validation.data.unit,
      commission_percentage: validation.data.commission_percentage,
      ...(formData.has('photo_url') && { photo_url: (formData.get('photo_url') as string) || null }),
    })
    .eq('id', validation.data.id)
    .eq('barbershop_id', barbershop.id)

  if (error) {
    if (error.code === '23505') return { error: 'Já existe um produto com este nome.' }
    console.error('Error updating product:', error)
    return { error: 'Erro ao atualizar produto.' }
  }

  revalidatePath('/stock')
  return { success: 'Produto atualizado com sucesso!' }
}

// ============================================================
// DELETE — Product (soft/hard)
// ============================================================

export async function deleteProduct(productId: string) {
  const { supabase, user, barbershop } = await getAuthContext()
  if (!user) return { error: 'Usuário não autenticado.' }
  if (!barbershop) return { error: 'Barbearia não encontrada.' }

  const { count } = await supabase
    .from('stock_movements')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)

  if (count && count > 0) {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId)
      .eq('barbershop_id', barbershop.id)

    if (error) {
      console.error('Error soft-deleting product:', error)
      return { error: 'Erro ao desativar produto.' }
    }
  } else {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('barbershop_id', barbershop.id)

    if (error) {
      console.error('Error deleting product:', error)
      return { error: 'Erro ao excluir produto.' }
    }
  }

  revalidatePath('/stock')
  return { success: 'Produto excluído com sucesso!' }
}

// ============================================================
// REGISTER — Stock Entry (purchase)
// ============================================================

export async function registerStockEntry(formData: FormData) {
  const { supabase, user, barbershop } = await getAuthContext()
  if (!user) return { error: 'Usuário não autenticado.' }
  if (!barbershop) return { error: 'Barbearia não encontrada.' }

  const rawData = {
    product_id: formData.get('product_id'),
    quantity: formData.get('quantity'),
    unit_cost: formData.get('unit_cost'),
    notes: formData.get('notes') ?? '',
  }

  const validation = stockEntrySchema.safeParse(rawData)
  if (!validation.success) return { error: 'Dados inválidos. Verifique os campos.' }

  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', validation.data.product_id)
    .eq('barbershop_id', barbershop.id)
    .eq('is_active', true)
    .single()

  if (!product) return { error: 'Produto não encontrado.' }

  const { data: productStock } = await supabase
    .from('products')
    .select('current_stock, average_cost')
    .eq('id', validation.data.product_id)
    .eq('barbershop_id', barbershop.id)
    .single()

  const totalCost = validation.data.quantity * validation.data.unit_cost

  const { error: mvError } = await supabase.from('stock_movements').insert({
    product_id: validation.data.product_id,
    barbershop_id: barbershop.id,
    type: 'entry',
    quantity: validation.data.quantity,
    unit_cost: validation.data.unit_cost,
    total_cost: totalCost,
    source: 'purchase',
    financial_status: 'pending',
    notes: validation.data.notes || null,
  })

  if (mvError) {
    console.error('Error creating stock entry:', mvError)
    return { error: 'Erro ao registrar entrada.' }
  }

  await supabase.rpc('increment_stock', {
    p_product_id: validation.data.product_id,
    p_quantity: validation.data.quantity,
  })

  // Recalculate Weighted Average Cost (WAC)
  if (productStock) {
    const prevStock = productStock.current_stock
    const prevAvg = productStock.average_cost ?? 0
    const newStock = prevStock + validation.data.quantity
    const newAverageCost = newStock > 0
      ? (prevStock * prevAvg + validation.data.quantity * validation.data.unit_cost) / newStock
      : validation.data.unit_cost

    await supabase
      .from('products')
      .update({ average_cost: Math.round(newAverageCost * 100) / 100 })
      .eq('id', validation.data.product_id)
      .eq('barbershop_id', barbershop.id)
  }

  revalidatePath('/stock')
  return { success: 'Entrada registrada com sucesso!' }
}

// ============================================================
// REGISTER — Stock Sale
// ============================================================

export async function registerStockSale(formData: FormData) {
  const { supabase, user, barbershop } = await getAuthContext()
  if (!user) return { error: 'Usuário não autenticado.' }
  if (!barbershop) return { error: 'Barbearia não encontrada.' }

  const rawData = {
    product_id: formData.get('product_id'),
    quantity: formData.get('quantity'),
    unit_price: formData.get('unit_price'),
    payment_method_id: formData.get('payment_method_id') ?? '',
    installments: formData.get('installments') ?? '1',
    barber_id: formData.get('barber_id') ?? '',
    notes: formData.get('notes') ?? '',
  }

  const validation = stockSaleSchema.safeParse(rawData)
  if (!validation.success) return { error: 'Dados inválidos. Verifique os campos.' }

  const { data: product } = await supabase
    .from('products')
    .select('id, name, current_stock, commission_percentage')
    .eq('id', validation.data.product_id)
    .eq('barbershop_id', barbershop.id)
    .eq('is_active', true)
    .single()

  if (!product) return { error: 'Produto não encontrado.' }
  if (product.current_stock < validation.data.quantity) {
    return { error: `Estoque insuficiente. Disponível: ${product.current_stock} un.` }
  }

  const totalAmount = validation.data.quantity * validation.data.unit_price

  // 1. Create stock movement
  const barberId = validation.data.barber_id || null
  const { data: movement, error: mvError } = await supabase
    .from('stock_movements')
    .insert({
      product_id: validation.data.product_id,
      barbershop_id: barbershop.id,
      type: 'exit',
      quantity: validation.data.quantity,
      unit_cost: validation.data.unit_price,
      total_cost: totalAmount,
      source: 'sale',
      financial_status: 'none',
      barber_id: barberId,
      notes: validation.data.notes || null,
    })
    .select()
    .single()

  if (mvError || !movement) {
    console.error('Error creating stock sale movement:', mvError)
    return { error: 'Erro ao registrar venda.' }
  }

  // 2. Decrement stock
  await supabase.rpc('increment_stock', {
    p_product_id: validation.data.product_id,
    p_quantity: -validation.data.quantity,
  })

  // 3. Create financial record (income)
  const paymentMethodId = validation.data.payment_method_id || null
  const { data: record, error: finError } = await supabase
    .from('financial_records')
    .insert({
      barbershop_id: barbershop.id,
      type: 'income',
      amount: totalAmount,
      category: 'Produto',
      description: `Venda: ${product.name} x${validation.data.quantity}`,
      stock_movement_id: movement.id,
      payment_method_id: paymentMethodId,
    })
    .select()
    .single()

  if (finError || !record) {
    // Rollback: re-increment stock + delete movement
    await supabase.rpc('increment_stock', {
      p_product_id: validation.data.product_id,
      p_quantity: validation.data.quantity,
    })
    await supabase.from('stock_movements').delete().eq('id', movement.id)
    console.error('Error creating financial record for sale:', finError)
    return { error: 'Erro ao registrar receita da venda.' }
  }

  // 4. Cross-link movement → financial record
  await supabase
    .from('stock_movements')
    .update({ reference_id: record.id })
    .eq('id', movement.id)

  // 5. Handle payment method fee (installments)
  const installments = validation.data.installments
  if (paymentMethodId) {
    const { data: paymentMethod } = await supabase
      .from('payment_methods')
      .select('name, fee_type, fee_value, supports_installments')
      .eq('id', paymentMethodId)
      .single()

    if (paymentMethod) {
      let feeAmount = 0
      let feeDescription = ''

      if (installments > 1 && paymentMethod.supports_installments) {
        const { data: installmentTier } = await supabase
          .from('payment_method_installments')
          .select('fee_percentage')
          .eq('payment_method_id', paymentMethodId)
          .eq('installment_number', installments)
          .single()

        if (installmentTier && installmentTier.fee_percentage > 0) {
          feeAmount = totalAmount * (installmentTier.fee_percentage / 100)
          feeDescription = `Taxa ${paymentMethod.name} ${installments}x - ${installmentTier.fee_percentage}%`
        }
      } else {
        if (paymentMethod.fee_type === 'percentage' && paymentMethod.fee_value > 0) {
          feeAmount = totalAmount * (paymentMethod.fee_value / 100)
          feeDescription = `Taxa ${paymentMethod.name} - ${paymentMethod.fee_value}%`
        } else if (paymentMethod.fee_type === 'fixed' && paymentMethod.fee_value > 0) {
          feeAmount = paymentMethod.fee_value
          feeDescription = `Taxa ${paymentMethod.name} - R$ ${paymentMethod.fee_value.toFixed(2)}`
        }
      }

      if (feeAmount > 0) {
        await supabase.from('financial_records').insert({
          barbershop_id: barbershop.id,
          type: 'expense',
          amount: feeAmount,
          category: 'Taxa de Pagamento',
          description: feeDescription,
          payment_method_id: paymentMethodId,
        })
      }
    }
  }

  // 6. Handle barber commission on product sale
  if (barberId && product.commission_percentage > 0) {
    const { data: barber } = await supabase
      .from('barbers')
      .select('name')
      .eq('id', barberId)
      .single()

    if (barber) {
      const commissionAmount = totalAmount * (product.commission_percentage / 100)
      if (commissionAmount > 0) {
        await supabase.from('financial_records').insert({
          barbershop_id: barbershop.id,
          type: 'expense',
          amount: commissionAmount,
          category: 'Comissão',
          description: `Comissão ${barber.name} - Produto ${product.name} ${product.commission_percentage}%`,
          record_date: new Date().toISOString().split('T')[0],
        })
      }
    }
  }

  revalidatePath('/stock')
  revalidatePath('/financial')
  revalidatePath('/dashboard')
  return { success: 'Venda registrada com sucesso!' }
}

// ============================================================
// SETTLE — Pending Entry (creates expense)
// ============================================================

export async function settleStockEntry(movementId: string) {
  const { supabase, user, barbershop } = await getAuthContext()
  if (!user) return { error: 'Usuário não autenticado.' }
  if (!barbershop) return { error: 'Barbearia não encontrada.' }

  const { data: movement } = await supabase
    .from('stock_movements')
    .select('id, product_id, quantity, total_cost, financial_status')
    .eq('id', movementId)
    .eq('barbershop_id', barbershop.id)
    .eq('financial_status', 'pending')
    .single()

  if (!movement) return { error: 'Movimentação não encontrada ou já liquidada.' }

  const { data: product } = await supabase
    .from('products')
    .select('name')
    .eq('id', movement.product_id)
    .single()

  const productName = product?.name ?? 'Produto'

  const { data: record, error: finError } = await supabase
    .from('financial_records')
    .insert({
      barbershop_id: barbershop.id,
      type: 'expense',
      amount: movement.total_cost ?? 0,
      category: 'Produtos',
      description: `Compra: ${productName} x${movement.quantity}`,
      stock_movement_id: movement.id,
    })
    .select()
    .single()

  if (finError || !record) {
    console.error('Error settling stock entry:', finError)
    return { error: 'Erro ao liquidar entrada.' }
  }

  await supabase
    .from('stock_movements')
    .update({ financial_status: 'settled', reference_id: record.id })
    .eq('id', movement.id)

  revalidatePath('/stock')
  revalidatePath('/financial')
  return { success: 'Entrada liquidada com sucesso!' }
}

// ============================================================
// GET — Pending Entries
// ============================================================

export async function getPendingEntries() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) throw new Error('Barbearia não encontrada')

  const { data, error } = await supabase
    .from('stock_movements')
    .select('*, products(name)')
    .eq('barbershop_id', barbershop.id)
    .eq('financial_status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ============================================================
// GET — Low Stock Products
// ============================================================

export async function getLowStockProducts() {
  const products = await getProducts()
  return products.filter(p => p.min_stock > 0 && p.current_stock < p.min_stock)
}

// ============================================================
// ADJUST — Stock (inventory correction)
// ============================================================

export async function adjustStock(formData: FormData) {
  const { supabase, user, barbershop } = await getAuthContext()
  if (!user) return { error: 'Usuário não autenticado.' }
  if (!barbershop) return { error: 'Barbearia não encontrada.' }

  const rawData = {
    product_id: formData.get('product_id'),
    new_quantity: formData.get('new_quantity'),
    notes: formData.get('notes') ?? '',
  }

  const validation = adjustStockSchema.safeParse(rawData)
  if (!validation.success) return { error: 'Dados inválidos. Motivo do ajuste é obrigatório (mín. 3 caracteres).' }

  const { data: product } = await supabase
    .from('products')
    .select('id, current_stock')
    .eq('id', validation.data.product_id)
    .eq('barbershop_id', barbershop.id)
    .single()

  if (!product) return { error: 'Produto não encontrado.' }

  const diff = validation.data.new_quantity - product.current_stock
  if (diff === 0) return { error: 'Estoque já está neste valor.' }

  await supabase.from('stock_movements').insert({
    product_id: validation.data.product_id,
    barbershop_id: barbershop.id,
    type: 'adjustment',
    quantity: Math.abs(diff),
    source: 'adjustment',
    financial_status: 'none',
    notes: validation.data.notes,
  })

  await supabase
    .from('products')
    .update({ current_stock: validation.data.new_quantity })
    .eq('id', validation.data.product_id)
    .eq('barbershop_id', barbershop.id)

  revalidatePath('/stock')
  return { success: 'Estoque ajustado com sucesso!' }
}

// ============================================================
// GET — Stock Movements (history for a product)
// ============================================================

export async function getStockMovements(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) throw new Error('Barbearia não encontrada')

  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('product_id', productId)
    .eq('barbershop_id', barbershop.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ============================================================
// UPLOAD — Product Photo
// ============================================================

export async function uploadProductPhoto(formData: FormData) {
  const { supabase, user, barbershop } = await getAuthContext()
  if (!user) return { error: 'Usuário não autenticado.' }
  if (!barbershop) return { error: 'Barbearia não encontrada.' }

  const productId = formData.get('product_id') as string | null
  const file = formData.get('file') as File | null

  if (!productId) return { error: 'ID do produto é obrigatório.' }
  if (!file || file.size === 0) return { error: 'Arquivo não enviado.' }

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'Formato inválido. Use JPEG, PNG ou WebP.' }
  }
  if (file.size > 2 * 1024 * 1024) {
    return { error: 'Imagem deve ter no máximo 2MB.' }
  }

  const { data: product } = await supabase
    .from('products')
    .select('id, photo_url')
    .eq('id', productId)
    .eq('barbershop_id', barbershop.id)
    .single()

  if (!product) return { error: 'Produto não encontrado.' }

  // Delete old photo from storage to avoid stale cache
  if (product.photo_url) {
    const oldPath = extractStoragePath(product.photo_url)
    if (oldPath) {
      await supabase.storage.from('product-photos').remove([oldPath])
    }
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const uniqueId = crypto.randomUUID()
  const storagePath = `${barbershop.id}/${productId}_${uniqueId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('product-photos')
    .upload(storagePath, file, { contentType: file.type })

  if (uploadError) {
    console.error('Error uploading product photo:', uploadError)
    return { error: 'Erro ao fazer upload da foto.' }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('product-photos')
    .getPublicUrl(storagePath)

  const { error: updateError } = await supabase
    .from('products')
    .update({ photo_url: publicUrl })
    .eq('id', productId)
    .eq('barbershop_id', barbershop.id)

  if (updateError) {
    console.error('Error updating product photo_url:', updateError)
    return { error: 'Erro ao salvar URL da foto.' }
  }

  revalidatePath('/stock')
  return { success: true, url: publicUrl }
}

export async function getStockPageData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) redirect('/setup/wizard')

  const [products, pendingEntries] = await Promise.all([
    getProducts(),
    getPendingEntries(),
  ])

  const { data: paymentMethods } = await supabase
    .from('payment_methods')
    .select('id, name, fee_type, fee_value, supports_installments, payment_method_installments(installment_number, fee_percentage)')
    .eq('barbershop_id', barbershop.id)
    .eq('is_active', true)
    .order('name')

  const { data: barbers } = await supabase
    .from('barbers')
    .select('id, name, is_active')
    .eq('barbershop_id', barbershop.id)
    .eq('is_active', true)
    .order('name')

  const lowStockCount = products.filter(p => p.min_stock > 0 && p.current_stock < p.min_stock).length
  const totalStockValue = products.reduce((sum, p) => sum + (p.average_cost * p.current_stock), 0)
  const totalSaleValue = products.reduce((sum, p) => sum + (p.sale_price * p.current_stock), 0)

  return {
    products,
    pendingEntries,
    paymentMethods: paymentMethods ?? [],
    barbers: barbers ?? [],
    lowStockCount,
    totalStockValue,
    totalSaleValue,
  }
}
