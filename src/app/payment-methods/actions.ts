'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const paymentMethodSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  fee_type: z.enum(['percentage', 'fixed']).default('percentage'),
  fee_value: z.coerce.number().min(0, 'Taxa não pode ser negativa').default(0),
})

const updatePaymentMethodSchema = paymentMethodSchema.extend({
  id: z.string().uuid(),
  is_active: z.coerce.boolean().default(true),
})

export async function getPaymentMethods() {
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
    .from('payment_methods')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .order('name')

  if (error) throw error
  return data
}

export async function createPaymentMethod(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const rawData = {
    name: formData.get('name'),
    fee_type: formData.get('fee_type') || 'percentage',
    fee_value: formData.get('fee_value') || '0',
  }

  const validation = paymentMethodSchema.safeParse(rawData)
  if (!validation.success) {
    return { error: 'Dados inválidos. Verifique os campos.' }
  }

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) return { error: 'Barbearia não encontrada.' }

  const { error } = await supabase
    .from('payment_methods')
    .insert({
      barbershop_id: barbershop.id,
      name: validation.data.name,
      fee_type: validation.data.fee_type,
      fee_value: validation.data.fee_value,
    })

  if (error) {
    console.error('Error creating payment method:', error)
    return { error: 'Erro ao cadastrar método de pagamento.' }
  }

  revalidatePath('/settings/payment-methods')
  revalidatePath('/appointments')
  return { success: 'Método de pagamento cadastrado com sucesso!' }
}

export async function updatePaymentMethod(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const rawData = {
    id: formData.get('id'),
    name: formData.get('name'),
    fee_type: formData.get('fee_type') || 'percentage',
    fee_value: formData.get('fee_value') || '0',
    is_active: formData.get('is_active') === 'true',
  }

  const validation = updatePaymentMethodSchema.safeParse(rawData)
  if (!validation.success) {
    return { error: 'Dados inválidos. Verifique os campos.' }
  }

  const { error } = await supabase
    .from('payment_methods')
    .update({
      name: validation.data.name,
      fee_type: validation.data.fee_type,
      fee_value: validation.data.fee_value,
      is_active: validation.data.is_active,
    })
    .eq('id', validation.data.id)

  if (error) {
    console.error('Error updating payment method:', error)
    return { error: 'Erro ao atualizar método de pagamento.' }
  }

  revalidatePath('/settings/payment-methods')
  revalidatePath('/appointments')
  return { success: 'Método de pagamento atualizado com sucesso!' }
}

export async function deletePaymentMethod(paymentMethodId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('id', paymentMethodId)

  if (error) {
    console.error('Error deleting payment method:', error)
    return { error: 'Erro ao excluir método de pagamento. Pode estar sendo usado em agendamentos.' }
  }

  revalidatePath('/settings/payment-methods')
  revalidatePath('/appointments')
  return { success: 'Método de pagamento excluído com sucesso!' }
}
