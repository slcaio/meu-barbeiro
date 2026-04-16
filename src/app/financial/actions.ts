'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().min(0.01, 'Valor deve ser positivo'),
  category: z.string().min(1, 'Categoria é obrigatória'),
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
    category: formData.get('category'),
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
      category: validation.data.category,
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

export async function getCommissionReport(params: {
  from: string
  to: string
  barberId?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) return { error: 'Barbearia não encontrada.' }

  // Fetch barbers for the barbershop
  const { data: barbers } = await supabase
    .from('barbers')
    .select('id, name, commission_percentage')
    .eq('barbershop_id', barbershop.id)
    .order('name')

  if (!barbers || barbers.length === 0) {
    return { data: { barbers: [], items: [], totals: { totalRevenue: 0, totalCommission: 0, totalAppointments: 0 } } }
  }

  // Fetch completed appointments with barber in the date range
  let query = supabase
    .from('appointments')
    .select('id, total_amount, appointment_date, client_name, barber_id, appointment_services(services(name))')
    .eq('barbershop_id', barbershop.id)
    .eq('status', 'completed')
    .eq('payment_status', 'paid')
    .not('barber_id', 'is', null)
    .gte('appointment_date', params.from)
    .lte('appointment_date', params.to)
    .order('appointment_date', { ascending: false })

  if (params.barberId) {
    query = query.eq('barber_id', params.barberId)
  }

  const { data: appointments, error } = await query

  if (error) {
    console.error('Error fetching commission report:', error)
    return { error: 'Erro ao gerar relatório.' }
  }

  // Build report grouped by barber
  const barberMap = new Map(barbers.map(b => [b.id, b]))

  type CommissionItem = {
    barberId: string
    barberName: string
    commissionPercentage: number
    totalAppointments: number
    totalRevenue: number
    commissionAmount: number
    appointments: {
      id: string
      date: string
      clientName: string
      serviceName: string
      amount: number
      commission: number
    }[]
  }

  const itemsMap = new Map<string, CommissionItem>()

  for (const apt of appointments || []) {
    const barber = barberMap.get(apt.barber_id!)
    if (!barber) continue

    if (!itemsMap.has(barber.id)) {
      itemsMap.set(barber.id, {
        barberId: barber.id,
        barberName: barber.name,
        commissionPercentage: barber.commission_percentage,
        totalAppointments: 0,
        totalRevenue: 0,
        commissionAmount: 0,
        appointments: [],
      })
    }

    const item = itemsMap.get(barber.id)!
    const commission = apt.total_amount * (barber.commission_percentage / 100)

    item.totalAppointments += 1
    item.totalRevenue += apt.total_amount
    item.commissionAmount += commission

    const serviceName = (apt as Record<string, unknown>).appointment_services
      ? ((apt as Record<string, unknown>).appointment_services as { services: { name: string } | null }[]).map(as => as.services?.name).filter(Boolean).join(', ') || 'Serviço'
      : 'Serviço'

    item.appointments.push({
      id: apt.id,
      date: apt.appointment_date,
      clientName: apt.client_name,
      serviceName,
      amount: apt.total_amount,
      commission,
    })
  }

  const items = Array.from(itemsMap.values()).sort((a, b) => a.barberName.localeCompare(b.barberName))

  const totals = {
    totalRevenue: items.reduce((sum, i) => sum + i.totalRevenue, 0),
    totalCommission: items.reduce((sum, i) => sum + i.commissionAmount, 0),
    totalAppointments: items.reduce((sum, i) => sum + i.totalAppointments, 0),
  }

  return {
    data: {
      barbers: barbers.map(b => ({ id: b.id, name: b.name })),
      items,
      totals,
    }
  }
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
