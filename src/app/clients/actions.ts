'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const clientSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
})

export async function getClients() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) {
    throw new Error('Barbershop not found')
  }

  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .order('name')

  if (error) {
    console.error('Error fetching clients:', JSON.stringify(error, null, 2))
    return []
  }

  return clients
}

export async function createNewClient(formData: FormData) {
  const supabase = await createClient()
  
  const rawData = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
  }

  const validation = clientSchema.safeParse(rawData)

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) {
    return { error: 'Barbearia não encontrada' }
  }

  const { error } = await supabase
    .from('clients')
    .insert({
      barbershop_id: barbershop.id,
      name: validation.data.name,
      phone: validation.data.phone || null,
      email: validation.data.email || null,
    })

  if (error) {
    console.error('Error creating client:', error)
    return { error: 'Erro ao criar cliente.' }
  }

  revalidatePath('/clients')
  revalidatePath('/appointments')
  return { success: 'Cliente criado com sucesso!' }
}

export async function deleteClient(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting client:', error)
    return { error: 'Erro ao excluir cliente.' }
  }

  revalidatePath('/clients')
  return { success: 'Cliente excluído com sucesso!' }
}
