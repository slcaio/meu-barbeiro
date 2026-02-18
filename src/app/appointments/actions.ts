'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const appointmentSchema = z.object({
  client_name: z.string().min(2, 'Nome do cliente é obrigatório'),
  client_phone: z.string().min(8, 'Telefone do cliente é obrigatório'),
  service_id: z.string().uuid('Serviço inválido'),
  appointment_date: z.string().datetime(), // ISO string from frontend
  notes: z.string().optional(),
})

export async function createAppointment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const rawData = {
    client_name: formData.get('client_name'),
    client_phone: formData.get('client_phone'),
    service_id: formData.get('service_id'),
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
      client_name: validation.data.client_name,
      client_phone: validation.data.client_phone,
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
