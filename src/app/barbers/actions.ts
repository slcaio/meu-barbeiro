'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const barberSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  role: z.enum(['barber', 'senior_barber', 'trainee']).default('barber'),
  commission_percentage: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().optional().or(z.literal('')),
})

const updateBarberSchema = barberSchema.extend({
  id: z.string().uuid(),
  is_active: z.coerce.boolean().default(true),
})

export async function getBarbers() {
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
    .from('barbers')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .order('name')

  if (error) throw error
  return data
}

export async function createBarber(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const rawData = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    role: formData.get('role') || 'barber',
    commission_percentage: formData.get('commission_percentage') || '0',
    notes: formData.get('notes'),
  }

  const validation = barberSchema.safeParse(rawData)
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
    .from('barbers')
    .insert({
      barbershop_id: barbershop.id,
      name: validation.data.name,
      phone: validation.data.phone || null,
      email: validation.data.email || null,
      role: validation.data.role,
      commission_percentage: validation.data.commission_percentage,
      notes: validation.data.notes || null,
    })

  if (error) {
    console.error('Error creating barber:', error)
    return { error: 'Erro ao cadastrar barbeiro.' }
  }

  revalidatePath('/settings/barbers')
  return { success: 'Barbeiro cadastrado com sucesso!' }
}

export async function updateBarber(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const rawData = {
    id: formData.get('id'),
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    role: formData.get('role') || 'barber',
    commission_percentage: formData.get('commission_percentage') || '0',
    notes: formData.get('notes'),
    is_active: formData.get('is_active') === 'true',
  }

  const validation = updateBarberSchema.safeParse(rawData)
  if (!validation.success) {
    return { error: 'Dados inválidos. Verifique os campos.' }
  }

  const { error } = await supabase
    .from('barbers')
    .update({
      name: validation.data.name,
      phone: validation.data.phone || null,
      email: validation.data.email || null,
      role: validation.data.role,
      commission_percentage: validation.data.commission_percentage,
      notes: validation.data.notes || null,
      is_active: validation.data.is_active,
    })
    .eq('id', validation.data.id)

  if (error) {
    console.error('Error updating barber:', error)
    return { error: 'Erro ao atualizar barbeiro.' }
  }

  revalidatePath('/settings/barbers')
  revalidatePath('/appointments')
  return { success: 'Barbeiro atualizado com sucesso!' }
}

export async function deleteBarber(barberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const { error } = await supabase
    .from('barbers')
    .delete()
    .eq('id', barberId)

  if (error) {
    console.error('Error deleting barber:', error)
    return { error: 'Erro ao excluir barbeiro.' }
  }

  revalidatePath('/settings/barbers')
  revalidatePath('/appointments')
  return { success: 'Barbeiro excluído com sucesso!' }
}
