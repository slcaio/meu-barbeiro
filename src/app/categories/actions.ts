'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome muito longo'),
  type: z.enum(['income', 'expense']),
})

export async function getCategories() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) return []

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .order('name')

  return categories || []
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const rawData = {
    name: formData.get('name'),
    type: formData.get('type'),
  }

  const validation = categorySchema.safeParse(rawData)
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
    .from('categories')
    .insert({
      barbershop_id: barbershop.id,
      name: validation.data.name,
      type: validation.data.type,
    })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Já existe uma categoria com esse nome para esse tipo.' }
    }
    console.error('Error creating category:', error)
    return { error: 'Erro ao criar categoria.' }
  }

  revalidatePath('/financial')
  revalidatePath('/settings/categories')
  return { success: 'Categoria criada com sucesso!' }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting category:', error)
    return { error: 'Erro ao excluir categoria.' }
  }

  revalidatePath('/financial')
  revalidatePath('/settings/categories')
  return { success: 'Categoria excluída com sucesso!' }
}
