'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const appointmentSchema = z.object({
  client_name: z.string().min(2, 'Nome do cliente é obrigatório'),
  client_phone: z.string().nullish(),
  client_id: z.string().nullish(),
  is_new_client: z.string().nullish(),
  service_id: z.string().uuid('Serviço inválido'),
  barber_id: z.string().uuid().optional().or(z.literal('')),
  appointment_date: z.string().datetime(), // ISO string from frontend
  notes: z.string().nullish(),
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
    service_id: formData.get('service_id'),
    barber_id: formData.get('barber_id'),
    appointment_date: formData.get('appointment_date'), // Expecting ISO string or similar
    notes: formData.get('notes'),
  }

  // Need to handle date parsing carefully if it comes from native input
  // but let's assume the frontend sends a proper ISO string or we parse it
  
  const validation = appointmentSchema.safeParse(rawData)
  
  if (!validation.success) {
    console.error(validation.error)
    return { error: 'Dados inválidos. Verifique os campos.' }
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

  // Get service price for total_amount
  const { data: service } = await supabase
    .from('services')
    .select('price')
    .eq('id', validation.data.service_id)
    .single()
    
  if (!service) return { error: 'Serviço não encontrado.' }

  const { error } = await supabase
    .from('appointments')
    .insert({
      barbershop_id: barbershop.id,
      service_id: validation.data.service_id,
      user_id: user.id,
      client_id: finalClientId || null,
      barber_id: validation.data.barber_id || null,
      client_name: validation.data.client_name,
      client_phone: validation.data.client_phone || '',
      appointment_date: validation.data.appointment_date,
      total_amount: service.price,
      notes: validation.data.notes || null,
      status: 'scheduled',
      payment_status: 'pending',
    })

  if (error) {
    console.error('Error creating appointment:', error)
    return { error: 'Erro ao criar agendamento.' }
  }

  revalidatePath('/appointments')
  revalidatePath('/dashboard')
  return { success: 'Agendamento criado com sucesso!' }
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

  if (!appointmentId || !action) {
    return { error: 'Dados incompletos.' }
  }

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
    updateData.total_amount = amount
    updateData.payment_status = 'paid'
    updateData.installments = installments
    if (paymentMethodId) {
      updateData.payment_method_id = paymentMethodId
    }
  } else if (action === 'cancel') {
     if (amount > 0) {
        updateData.total_amount = amount // Cancellation fee
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

  // Create financial record if amount > 0
  if (amount > 0) {
      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!barbershop) return { error: 'Barbearia não encontrada.' }

      const { error: transactionError } = await supabase
        .from('financial_records')
        .insert({
          barbershop_id: barbershop.id,
          type: 'income',
          amount: amount,
          category: action === 'complete' ? 'Serviço' : 'Outros',
          description: description,
          payment_method_id: paymentMethodId || null,
          record_date: new Date().toISOString().split('T')[0],
        })

      if (transactionError) {
        console.error('Error creating transaction:', transactionError)
        return { error: 'Agendamento atualizado, mas erro ao criar transação financeira.' }
      }

      // Register payment method fee if applicable
      if (action === 'complete' && paymentMethodId) {
        const { data: paymentMethod } = await supabase
          .from('payment_methods')
          .select('name, fee_type, fee_value, supports_installments')
          .eq('id', paymentMethodId)
          .single()

        if (paymentMethod) {
          let feeAmount = 0
          let feeDescription = ''

          if (installments > 1 && paymentMethod.supports_installments) {
            // Use installment-specific fee from payment_method_installments
            const { data: installmentTier } = await supabase
              .from('payment_method_installments')
              .select('fee_percentage')
              .eq('payment_method_id', paymentMethodId)
              .eq('installment_number', installments)
              .single()

            if (installmentTier && installmentTier.fee_percentage > 0) {
              feeAmount = amount * (installmentTier.fee_percentage / 100)
              feeDescription = `Taxa ${paymentMethod.name} ${installments}x - ${installmentTier.fee_percentage}%`
            }
          } else if (paymentMethod.fee_value > 0) {
            // Use base fee (1x / à vista)
            feeAmount = paymentMethod.fee_type === 'percentage'
              ? amount * (paymentMethod.fee_value / 100)
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
              record_date: new Date().toISOString().split('T')[0],
            })
          }
        }
      }

      // Register barber commission if applicable
      if (action === 'complete') {
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
            const commissionAmount = amount * (barber.commission_percentage / 100)

            await supabase.from('financial_records').insert({
              barbershop_id: barbershop.id,
              type: 'expense',
              amount: commissionAmount,
              category: 'Comissão',
              description: `Comissão ${barber.name} - ${barber.commission_percentage}%`,
              record_date: new Date().toISOString().split('T')[0],
            })
          }
        }
      }
  }

  revalidatePath('/appointments')
  revalidatePath('/dashboard')
  revalidatePath('/financial')
  
  return { success: 'Operação realizada com sucesso!' }
}
