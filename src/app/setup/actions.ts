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

  // Create default payment methods
  const { error: paymentMethodsError } = await supabase
    .from('payment_methods')
    .insert([
      { barbershop_id: barbershop.id, name: 'Dinheiro', fee_type: 'percentage', fee_value: 0 },
      { barbershop_id: barbershop.id, name: 'Pix', fee_type: 'percentage', fee_value: 0 },
      { barbershop_id: barbershop.id, name: 'Cartão de Crédito', fee_type: 'percentage', fee_value: 3 },
      { barbershop_id: barbershop.id, name: 'Cartão de Débito', fee_type: 'percentage', fee_value: 1.5 },
    ])

  if (paymentMethodsError) {
    console.error('Error creating default payment methods:', paymentMethodsError)
  }

  // Create default categories
  const defaultCategories: { barbershop_id: string; name: string; type: 'income' | 'expense' }[] = [
    { barbershop_id: barbershop.id, name: 'Serviço', type: 'income' },
    { barbershop_id: barbershop.id, name: 'Produto', type: 'income' },
    { barbershop_id: barbershop.id, name: 'Outros', type: 'income' },
    { barbershop_id: barbershop.id, name: 'Aluguel', type: 'expense' },
    { barbershop_id: barbershop.id, name: 'Contas (Água/Luz/Internet)', type: 'expense' },
    { barbershop_id: barbershop.id, name: 'Impostos', type: 'expense' },
    { barbershop_id: barbershop.id, name: 'Produtos', type: 'expense' },
    { barbershop_id: barbershop.id, name: 'Salário', type: 'expense' },
    { barbershop_id: barbershop.id, name: 'Manutenção', type: 'expense' },
    { barbershop_id: barbershop.id, name: 'Marketing', type: 'expense' },
    { barbershop_id: barbershop.id, name: 'Comissão', type: 'expense' },
    { barbershop_id: barbershop.id, name: 'Outros', type: 'expense' },
  ]

  const { error: categoriesError } = await supabase
    .from('categories')
    .insert(defaultCategories)

  if (categoriesError) {
    console.error('Error creating default categories:', categoriesError)
  }

  redirect('/dashboard')
}
