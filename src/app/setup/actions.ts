'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const barbershopSchema = z.object({
  name: z.string().min(2, 'Nome da barbearia deve ter pelo menos 2 caracteres'),
  street: z.string().min(5, 'Endereço deve ser válido'),
  city: z.string().min(2, 'Cidade deve ser válida'),
  state: z.string().length(2, 'Estado deve ter 2 letras (UF)'),
  zip: z.string().min(8, 'CEP inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  number: z.string().min(1, 'Número é obrigatório'),
})

export async function createBarbershop(prevState: any, formData: FormData) {
  const rawData = {
    name: formData.get('name') as string,
    phone: formData.get('phone') as string,
    street: formData.get('street') as string,
    number: formData.get('number') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    zip: formData.get('zip') as string,
  }

  const validation = barbershopSchema.safeParse(rawData)

  if (!validation.success) {
    return { error: 'Por favor, verifique os dados preenchidos.' }
  }

  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Usuário não autenticado.' }
  }

  const address = {
    street: rawData.street,
    city: rawData.city,
    state: rawData.state,
    zip: rawData.zip,
  }

  // Insert barbershop
  const { data: barbershop, error } = await supabase
    .from('barbershops')
    .insert({
      user_id: user.id,
      name: rawData.name as string,
      phone: rawData.phone as string,
      address_number: rawData.number as string,
      address,
      // operating_hours uses default value from DB schema
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating barbershop:', error)
    return { error: 'Erro ao criar barbearia. Tente novamente.' }
  }

  // Create a default service to get them started
  const { error: serviceError } = await supabase
    .from('services')
    .insert({
      barbershop_id: barbershop.id,
      name: 'Corte de Cabelo',
      description: 'Corte tradicional ou moderno',
      price: 30.00,
      duration_minutes: 30,
    })

  if (serviceError) {
    console.error('Error creating default service:', serviceError)
    // Don't fail the whole process if service creation fails, just log it
  }

  redirect('/dashboard')
}
