'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().min(0.01, 'Valor deve ser positivo'),
  description: z.string().optional(),
  record_date: z.string().date(), // YYYY-MM-DD
})

export async function createTransaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const rawData = {
    type: formData.get('type'),
    amount: formData.get('amount'),
    description: formData.get('description'),
    record_date: formData.get('record_date'),
  }

  const validation = transactionSchema.safeParse(rawData)

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
    .from('financial_records')
    .insert({
      barbershop_id: barbershop.id,
      type: validation.data.type,
      amount: validation.data.amount,
      description: validation.data.description || null,
      record_date: validation.data.record_date,
    })

  if (error) {
    console.error('Error creating transaction:', error)
    return { error: 'Erro ao registrar transação.' }
  }

  revalidatePath('/financial')
  revalidatePath('/dashboard')
  return { success: 'Transação registrada com sucesso!' }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const { error } = await supabase
    .from('financial_records')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting transaction:', error)
    return { error: 'Erro ao excluir transação.' }
  }

  revalidatePath('/financial')
  revalidatePath('/dashboard')
  return { success: 'Transação excluída com sucesso!' }
}
