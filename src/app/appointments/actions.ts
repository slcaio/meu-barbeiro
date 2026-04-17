'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const appointmentSchema = z.object({
  client_name: z.string().min(2, 'Nome do cliente é obrigatório'),
  client_phone: z.string().nullish(),
  client_id: z.string().nullish(),
  is_new_client: z.string().nullish(),
  service_ids: z.string().min(1, 'Selecione ao menos um serviço'),
  barber_id: z.string().uuid().optional().or(z.literal('')),
  appointment_date: z.string().datetime(), // ISO string from frontend
  notes: z.string().nullish(),
})

const updateAppointmentSchema = appointmentSchema.extend({
  id: z.string().uuid('ID do agendamento inválido'),
})

export async function createAppointment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const rawData = {
    client_name: formData.get('client_name'),
    client_phone: formData.get('client_phone'),
    client_id: formData.get('client_id'),
    is_new_client: formData.get('is_new_client'),
    service_ids: formData.get('service_ids'),
    barber_id: formData.get('barber_id'),
    appointment_date: formData.get('appointment_date'),
    notes: formData.get('notes'),
  }

  const validation = appointmentSchema.safeParse(rawData)
  
  if (!validation.success) {
    console.error(validation.error)
    return { error: 'Dados inválidos. Verifique os campos.' }
  }

  // Parse service_ids JSON array
  let serviceIds: string[]
  try {
    serviceIds = JSON.parse(validation.data.service_ids)
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return { error: 'Selecione ao menos um serviço.' }
    }
  } catch {
    return { error: 'Dados de serviços inválidos.' }
  }

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) return { error: 'Barbearia não encontrada.' }

  // Handle New Client Creation
  let finalClientId = validation.data.client_id

  if (validation.data.is_new_client === 'true') {
    const { data: newClient, error: createClientError } = await supabase
      .from('clients')
      .insert({
        barbershop_id: barbershop.id,
        name: validation.data.client_name,
        phone: validation.data.client_phone || null,
      })
      .select('id')
      .single()

    if (createClientError) {
      console.error('Error creating new client:', createClientError)
      return { error: 'Erro ao criar novo cliente.' }
    }

    finalClientId = newClient.id
  }

  // Fetch all selected services with prices
  const { data: services } = await supabase
    .from('services')
    .select('id, price')
    .in('id', serviceIds)
    
  if (!services || services.length === 0) return { error: 'Serviços não encontrados.' }

  const totalAmount = services.reduce((sum, s) => sum + s.price, 0)

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      barbershop_id: barbershop.id,
      user_id: user.id,
      client_id: finalClientId || null,
      barber_id: validation.data.barber_id || null,
      client_name: validation.data.client_name,
      client_phone: validation.data.client_phone || '',
      appointment_date: validation.data.appointment_date,
      total_amount: totalAmount,
      notes: validation.data.notes || null,
      status: 'scheduled',
      payment_status: 'pending',
    })
    .select('id')
    .single()

  if (error || !appointment) {
    console.error('Error creating appointment:', error)
    return { error: 'Erro ao criar agendamento.' }
  }

  // Insert appointment_services junction rows
  const serviceRows = services.map(s => ({
    appointment_id: appointment.id,
    service_id: s.id,
    price_at_time: s.price,
  }))

  const { error: servicesError } = await supabase
    .from('appointment_services')
    .insert(serviceRows)

  if (servicesError) {
    console.error('Error inserting appointment services:', servicesError)
    return { error: 'Erro ao vincular serviços ao agendamento.' }
  }

  revalidatePath('/appointments')
  revalidatePath('/dashboard')
  return { success: 'Agendamento criado com sucesso!' }
}

export async function updateAppointment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const rawData = {
    id: formData.get('id'),
    client_name: formData.get('client_name'),
    client_phone: formData.get('client_phone'),
    client_id: formData.get('client_id'),
    is_new_client: formData.get('is_new_client'),
    service_ids: formData.get('service_ids'),
    barber_id: formData.get('barber_id'),
    appointment_date: formData.get('appointment_date'),
    notes: formData.get('notes'),
  }

  const validation = updateAppointmentSchema.safeParse(rawData)

  if (!validation.success) {
    console.error(validation.error)
    return { error: 'Dados inválidos. Verifique os campos.' }
  }

  // Parse service_ids JSON array
  let serviceIds: string[]
  try {
    serviceIds = JSON.parse(validation.data.service_ids)
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return { error: 'Selecione ao menos um serviço.' }
    }
  } catch {
    return { error: 'Dados de serviços inválidos.' }
  }

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) return { error: 'Barbearia não encontrada.' }

  // Handle New Client Creation
  let finalClientId = validation.data.client_id

  if (validation.data.is_new_client === 'true') {
    const { data: newClient, error: createClientError } = await supabase
      .from('clients')
      .insert({
        barbershop_id: barbershop.id,
        name: validation.data.client_name,
        phone: validation.data.client_phone || null,
      })
      .select('id')
      .single()

    if (createClientError) {
      console.error('Error creating new client:', createClientError)
      return { error: 'Erro ao criar novo cliente.' }
    }

    finalClientId = newClient.id
  }

  // Fetch all selected services with prices
  const { data: services } = await supabase
    .from('services')
    .select('id, price')
    .in('id', serviceIds)

  if (!services || services.length === 0) return { error: 'Serviços não encontrados.' }

  const totalAmount = services.reduce((sum, s) => sum + s.price, 0)

  // Update appointment row
  const { error: updateError } = await supabase
    .from('appointments')
    .update({
      client_id: finalClientId || null,
      barber_id: validation.data.barber_id || null,
      client_name: validation.data.client_name,
      client_phone: validation.data.client_phone || '',
      appointment_date: validation.data.appointment_date,
      total_amount: totalAmount,
      notes: validation.data.notes || null,
    })
    .eq('id', validation.data.id)

  if (updateError) {
    console.error('Error updating appointment:', updateError)
    return { error: 'Erro ao atualizar agendamento.' }
  }

  // Replace appointment_services: delete old, insert new
  await supabase
    .from('appointment_services')
    .delete()
    .eq('appointment_id', validation.data.id)

  const serviceRows = services.map(s => ({
    appointment_id: validation.data.id,
    service_id: s.id,
    price_at_time: s.price,
  }))

  const { error: servicesError } = await supabase
    .from('appointment_services')
    .insert(serviceRows)

  if (servicesError) {
    console.error('Error updating appointment services:', servicesError)
    return { error: 'Erro ao atualizar serviços do agendamento.' }
  }

  revalidatePath('/appointments')
  revalidatePath('/dashboard')
  return { success: 'Agendamento atualizado com sucesso!' }
}

export async function updateAppointmentStatus(id: string, status: 'confirmed' | 'completed' | 'cancelled') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('Error updating appointment status:', error)
    return { error: 'Erro ao atualizar status.' }
  }

  revalidatePath('/appointments')
  revalidatePath('/dashboard')
  return { success: 'Status atualizado com sucesso!' }
}

export async function updateAppointmentDate(id: string, newDate: string, barberId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const updateData: { appointment_date: string; barber_id?: string | null } = {
    appointment_date: newDate,
  }

  // If barberId is explicitly passed, update the barber assignment too
  if (barberId !== undefined) {
    updateData.barber_id = barberId || null
  }

  const { error } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating appointment date:', error)
    return { error: 'Erro ao atualizar data.' }
  }

  revalidatePath('/appointments')
  revalidatePath('/dashboard')
  return { success: 'Data atualizada com sucesso!' }
}

export async function completeAppointmentWithTransaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const appointmentId = formData.get('appointment_id') as string
  const action = formData.get('action') as 'complete' | 'cancel'
  const amount = Number(formData.get('amount'))
  const description = formData.get('description') as string
  const paymentMethodId = formData.get('payment_method_id') as string | null
  const installments = Number(formData.get('installments') || '1')
  const productsJson = formData.get('products_json') as string | null

  if (!appointmentId || !action) {
    return { error: 'Dados incompletos.' }
  }

  // Parse products if provided
  type ProductItem = { product_id: string; quantity: number; price_at_time: number; barber_id?: string }
  let productItems: ProductItem[] = []
  if (productsJson) {
    try {
      const parsed = JSON.parse(productsJson)
      if (Array.isArray(parsed)) {
        productItems = parsed.filter(
          (p: ProductItem) => p.product_id && p.quantity > 0 && p.price_at_time >= 0
        )
      }
    } catch {
      return { error: 'Dados de produtos inválidos.' }
    }
  }

  const productsTotal = productItems.reduce((sum, p) => sum + p.quantity * p.price_at_time, 0)
  const servicesAmount = amount // amount from form = services total
  const grandTotal = servicesAmount + productsTotal

  // Determine status
  const status = action === 'complete' ? 'completed' : 'cancelled'
  
  const updateData: {
    status: 'completed' | 'cancelled';
    total_amount?: number;
    payment_status?: 'paid' | 'pending' | 'refunded' | 'partial';
    payment_method_id?: string | null;
    installments?: number;
  } = { status }
  
  if (action === 'complete') {
    updateData.total_amount = grandTotal
    updateData.payment_status = 'paid'
    updateData.installments = installments
    if (paymentMethodId) {
      updateData.payment_method_id = paymentMethodId
    }
  } else if (action === 'cancel') {
     if (amount > 0) {
        updateData.total_amount = amount
        updateData.payment_status = 'paid' 
     }
  }

  const { error: updateError } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', appointmentId)

  if (updateError) {
    console.error('Error updating appointment:', updateError)
    return { error: 'Erro ao atualizar agendamento.' }
  }

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) return { error: 'Barbearia não encontrada.' }

  const recordDate = new Date().toISOString().split('T')[0]

  // --- Service income ---
  if (servicesAmount > 0) {
    const { error: transactionError } = await supabase
      .from('financial_records')
      .insert({
        barbershop_id: barbershop.id,
        type: 'income',
        amount: servicesAmount,
        category: action === 'complete' ? 'Serviço' : 'Outros',
        description: description,
        payment_method_id: paymentMethodId || null,
        record_date: recordDate,
      })

    if (transactionError) {
      console.error('Error creating service transaction:', transactionError)
      return { error: 'Agendamento atualizado, mas erro ao criar transação de serviços.' }
    }
  }

  // --- Product processing ---
  if (action === 'complete' && productItems.length > 0) {
    for (const item of productItems) {
      // Validate stock
      const { data: product } = await supabase
        .from('products')
        .select('id, name, current_stock, commission_percentage')
        .eq('id', item.product_id)
        .eq('barbershop_id', barbershop.id)
        .single()

      if (!product) continue
      if (product.current_stock < item.quantity) {
        return { error: `Estoque insuficiente para ${product.name}. Disponível: ${product.current_stock} un.` }
      }

      const itemTotal = item.quantity * item.price_at_time

      // Create stock movement (exit)
      const { data: movement } = await supabase
        .from('stock_movements')
        .insert({
          product_id: item.product_id,
          barbershop_id: barbershop.id,
          type: 'exit',
          quantity: item.quantity,
          unit_cost: item.price_at_time,
          total_cost: itemTotal,
          source: 'sale',
          financial_status: 'none',
          barber_id: item.barber_id || null,
          notes: `Venda via agendamento ${appointmentId}`,
        })
        .select('id')
        .single()

      // Decrement stock
      await supabase.rpc('increment_stock', {
        p_product_id: item.product_id,
        p_quantity: -item.quantity,
      })

      // Create product income record
      const { data: record } = await supabase
        .from('financial_records')
        .insert({
          barbershop_id: barbershop.id,
          type: 'income',
          amount: itemTotal,
          category: 'Produto',
          description: `Venda: ${product.name} x${item.quantity}`,
          stock_movement_id: movement?.id || null,
          payment_method_id: paymentMethodId || null,
          record_date: recordDate,
        })
        .select('id')
        .single()

      // Cross-link movement → financial record
      if (movement && record) {
        await supabase
          .from('stock_movements')
          .update({ reference_id: record.id })
          .eq('id', movement.id)
      }

      // Product commission (per product, per barber)
      if (item.barber_id && product.commission_percentage > 0) {
        const { data: barber } = await supabase
          .from('barbers')
          .select('name')
          .eq('id', item.barber_id)
          .single()

        if (barber) {
          const commissionAmount = itemTotal * (product.commission_percentage / 100)
          if (commissionAmount > 0) {
            await supabase.from('financial_records').insert({
              barbershop_id: barbershop.id,
              type: 'expense',
              amount: commissionAmount,
              category: 'Comissão',
              description: `Comissão ${barber.name} - Produto ${product.name} ${product.commission_percentage}%`,
              record_date: recordDate,
            })
          }
        }
      }
    }

    // Insert appointment_products junction rows
    const productRows = productItems.map(p => ({
      appointment_id: appointmentId,
      product_id: p.product_id,
      quantity: p.quantity,
      price_at_time: p.price_at_time,
      barber_id: p.barber_id || null,
    }))

    await supabase.from('appointment_products').insert(productRows)
  }

  // --- Payment method fee (on grand total) ---
  if (action === 'complete' && paymentMethodId && grandTotal > 0) {
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
          feeAmount = grandTotal * (installmentTier.fee_percentage / 100)
          feeDescription = `Taxa ${paymentMethod.name} ${installments}x - ${installmentTier.fee_percentage}%`
        }
      } else if (paymentMethod.fee_value > 0) {
        feeAmount = paymentMethod.fee_type === 'percentage'
          ? grandTotal * (paymentMethod.fee_value / 100)
          : paymentMethod.fee_value
        feeDescription = `Taxa ${paymentMethod.name} - ${paymentMethod.fee_type === 'percentage' ? `${paymentMethod.fee_value}%` : `R$ ${paymentMethod.fee_value.toFixed(2)}`}`
      }

      if (feeAmount > 0) {
        await supabase.from('financial_records').insert({
          barbershop_id: barbershop.id,
          type: 'expense',
          amount: feeAmount,
          category: 'Taxa de Pagamento',
          description: feeDescription,
          payment_method_id: paymentMethodId,
          record_date: recordDate,
        })
      }
    }
  }

  // --- Barber commission on services ---
  if (action === 'complete' && servicesAmount > 0) {
    const { data: appointment } = await supabase
      .from('appointments')
      .select('barber_id')
      .eq('id', appointmentId)
      .single()

    if (appointment?.barber_id) {
      const { data: barber } = await supabase
        .from('barbers')
        .select('commission_percentage, name')
        .eq('id', appointment.barber_id)
        .single()

      if (barber && barber.commission_percentage > 0) {
        const commissionAmount = servicesAmount * (barber.commission_percentage / 100)

        await supabase.from('financial_records').insert({
          barbershop_id: barbershop.id,
          type: 'expense',
          amount: commissionAmount,
          category: 'Comissão',
          description: `Comissão ${barber.name} - Serviços ${barber.commission_percentage}%`,
          record_date: recordDate,
        })
      }
    }
  }

  revalidatePath('/appointments')
  revalidatePath('/dashboard')
  revalidatePath('/financial')
  revalidatePath('/stock')
  
  return { success: 'Operação realizada com sucesso!' }
}
