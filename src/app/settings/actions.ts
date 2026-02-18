'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const serviceSchema = z.object({
  name: z.string().min(2, 'Nome do serviço deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Preço deve ser positivo'),
  duration_minutes: z.coerce.number().min(5, 'Duração mínima de 5 minutos'),
})

export async function createService(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const rawData = {
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    duration_minutes: formData.get('duration_minutes'),
  }

  const validation = serviceSchema.safeParse(rawData)
  if (!validation.success) {
    return { error: 'Dados inválidos. Verifique os campos preenchidos.' }
  }

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) return { error: 'Barbearia não encontrada.' }

  const { error } = await supabase
    .from('services')
    .insert({
      barbershop_id: barbershop.id,
      name: validation.data.name,
      description: validation.data.description || null,
      price: validation.data.price,
      duration_minutes: validation.data.duration_minutes,
    })

  if (error) {
    console.error('Error creating service:', error)
    return { error: 'Erro ao criar serviço.' }
  }

  revalidatePath('/settings/services')
  return { success: 'Serviço criado com sucesso!' }
}

export async function deleteService(serviceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  // Verify ownership via RLS policy implicitly, but good to be safe if complex logic
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId)

  if (error) {
    console.error('Error deleting service:', error)
    return { error: 'Erro ao excluir serviço.' }
  }

  revalidatePath('/settings/services')
  return { success: 'Serviço excluído com sucesso!' }
}
