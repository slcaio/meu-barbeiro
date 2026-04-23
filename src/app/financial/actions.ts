'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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

  // Fetch all barbers (including inactive, they may have historical commissions)
  const { data: barbers } = await supabase
    .from('barbers')
    .select('id, name, commission_percentage')
    .eq('barbershop_id', barbershop.id)
    .order('name')

  if (!barbers || barbers.length === 0) {
    return { data: { barbers: [], items: [], totals: { totalRevenue: 0, totalCommission: 0, totalAppointments: 0 } } }
  }

  const fromDate = params.from.split('T')[0]
  const toDate = params.to.split('T')[0]

  // 1) Fetch completed+paid appointments with barber in range (for service revenue details)
  let aptQuery = supabase
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
    aptQuery = aptQuery.eq('barber_id', params.barberId)
  }

  // 2) Fetch actual commission records from financial_records (source of truth)
  const { data: commissionRecords } = await supabase
    .from('financial_records')
    .select('id, amount, description, record_date')
    .eq('barbershop_id', barbershop.id)
    .eq('type', 'expense')
    .eq('category', 'Comissão')
    .gte('record_date', fromDate)
    .lte('record_date', toDate)

  const { data: appointments, error } = await aptQuery

  if (error) {
    console.error('Error fetching commission report:', error)
    return { error: 'Erro ao gerar relatório.' }
  }

  // Build barber lookup
  const barberMap = new Map(barbers.map(b => [b.id, b]))
  const barberByName = new Map(barbers.map(b => [b.name, b]))

  type CommissionEntry = {
    id: string
    date: string
    description: string
    amount: number
    commission: number
    type: 'service' | 'product'
  }

  type CommissionItem = {
    barberId: string
    barberName: string
    commissionPercentage: number
    totalAppointments: number
    totalRevenue: number
    commissionAmount: number
    appointments: CommissionEntry[]
  }

  const itemsMap = new Map<string, CommissionItem>()

  function getOrCreateItem(barberId: string, barberName: string, commissionPct: number): CommissionItem {
    if (!itemsMap.has(barberId)) {
      itemsMap.set(barberId, {
        barberId,
        barberName,
        commissionPercentage: commissionPct,
        totalAppointments: 0,
        totalRevenue: 0,
        commissionAmount: 0,
        appointments: [],
      })
    }
    return itemsMap.get(barberId)!
  }

  // Track commission amounts from actual records per barber
  const barberServiceCommission = new Map<string, number>()
  const barberProductEntries = new Map<string, CommissionEntry[]>()

  // Parse commission records to separate service vs product commissions
  for (const rec of commissionRecords || []) {
    const desc = rec.description || ''
    // Pattern: "Comissão {barberName} - Serviços X%" or "Comissão {barberName} - Produto {name} X%"
    const match = desc.match(/^Comissão (.+?) - (.+)$/)
    if (!match) continue

    const barberName = match[1]
    const detail = match[2]
    const barber = barberByName.get(barberName)
    if (!barber) continue

    // If filtering by barberId, skip others
    if (params.barberId && barber.id !== params.barberId) continue

    const isProduct = detail.startsWith('Produto')

    if (isProduct) {
      if (!barberProductEntries.has(barber.id)) {
        barberProductEntries.set(barber.id, [])
      }
      barberProductEntries.get(barber.id)!.push({
        id: rec.id,
        date: rec.record_date,
        description: detail,
        amount: 0,
        commission: rec.amount,
        type: 'product',
      })
    } else {
      // Service commission — accumulate (will be used to override recalculated values)
      barberServiceCommission.set(barber.id, (barberServiceCommission.get(barber.id) || 0) + rec.amount)
    }
  }

  // Process appointments for service details
  for (const apt of appointments || []) {
    const barber = barberMap.get(apt.barber_id!)
    if (!barber) continue

    const item = getOrCreateItem(barber.id, barber.name, barber.commission_percentage)

    // Use actual service commission from financial_records if available
    const serviceCommission = apt.total_amount * (barber.commission_percentage / 100)

    item.totalAppointments += 1
    item.totalRevenue += apt.total_amount

    const serviceName = (apt as Record<string, unknown>).appointment_services
      ? ((apt as Record<string, unknown>).appointment_services as { services: { name: string } | null }[]).map(as => as.services?.name).filter(Boolean).join(', ') || 'Serviço'
      : 'Serviço'

    item.appointments.push({
      id: apt.id,
      date: apt.appointment_date,
      description: `${serviceName} - ${apt.client_name}`,
      amount: apt.total_amount,
      commission: serviceCommission,
      type: 'service',
    })
  }

  // Use actual service commission totals from financial_records as source of truth
  for (const [barberId, actualTotal] of barberServiceCommission) {
    const barber = barberMap.get(barberId)
    if (!barber) continue
    const item = getOrCreateItem(barber.id, barber.name, barber.commission_percentage)
    item.commissionAmount = actualTotal
  }

  // For barbers with appointments but no financial_records commission (fallback to calculated)
  for (const item of itemsMap.values()) {
    if (!barberServiceCommission.has(item.barberId) && item.appointments.length > 0) {
      item.commissionAmount = item.appointments
        .filter(a => a.type === 'service')
        .reduce((sum, a) => sum + a.commission, 0)
    }
  }

  // Add product commission entries
  for (const [barberId, entries] of barberProductEntries) {
    const barber = barberMap.get(barberId)
    if (!barber) continue
    const item = getOrCreateItem(barber.id, barber.name, barber.commission_percentage)

    for (const entry of entries) {
      item.commissionAmount += entry.commission
      item.appointments.push(entry)
    }
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

export type SearchParams = {
  from?: string
  to?: string
  type?: string
  category?: string
  period?: string
}

export async function getFinancialPageData(searchParams: SearchParams) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) redirect('/setup/wizard')

  const { data: dbCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .order('name')

  const { data: usedRecords } = await supabase
    .from('financial_records')
    .select('category, type')
    .eq('barbershop_id', barbershop.id)

  const categorySet = new Set((dbCategories || []).map(c => `${c.name}::${c.type}`))
  const mergedCategories = [...(dbCategories || [])]

  if (usedRecords) {
    for (const record of usedRecords) {
      const key = `${record.category}::${record.type}`
      if (!categorySet.has(key)) {
        categorySet.add(key)
        mergedCategories.push({
          id: `used-${record.category}-${record.type}`,
          barbershop_id: barbershop.id,
          name: record.category,
          type: record.type as 'income' | 'expense',
          created_at: '',
        })
      }
    }
  }

  mergedCategories.sort((a, b) => a.name.localeCompare(b.name))

  const date = new Date()
  let firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
  let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString()

  if (searchParams.from && searchParams.to) {
    firstDay = searchParams.from
    lastDay = searchParams.to
  }

  let query = supabase
    .from('financial_records')
    .select('*, payment_methods(name)')
    .eq('barbershop_id', barbershop.id)
    .gte('record_date', firstDay)
    .lte('record_date', lastDay)
    .order('record_date', { ascending: false })

  if (searchParams.type && searchParams.type !== 'all') {
    if (searchParams.type === 'income' || searchParams.type === 'expense') {
      query = query.eq('type', searchParams.type)
    }
  }

  if (searchParams.category && searchParams.category !== 'all') {
    query = query.eq('category', searchParams.category)
  }

  const { data: transactions } = await query

  const totalIncome = transactions
    ?.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) || 0

  const expenses = transactions
    ?.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0) || 0

  const netProfit = totalIncome - expenses

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allTransactions = transactions?.map(t => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    description: t.description || 'Sem descrição',
    category: t.category || 'Outros',
    date: t.record_date,
    source: 'manual' as const,
    paymentMethodName: (t as any).payment_methods?.name || null,
  })) || []

  const incomeByCategory: Record<string, number> = {}
  const expenseByCategory: Record<string, number> = {}
  allTransactions.forEach(t => {
    if (t.type === 'income') {
      incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount
    } else {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount
    }
  })

  const incomeCategoryData = Object.entries(incomeByCategory).map(([name, value]) => ({ name, value }))
  const expenseCategoryData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }))

  const trendMap: Record<string, { receita: number; despesa: number }> = {}
  allTransactions.forEach(t => {
    const day = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    if (!trendMap[day]) trendMap[day] = { receita: 0, despesa: 0 }
    if (t.type === 'income') trendMap[day].receita += t.amount
    else trendMap[day].despesa += t.amount
  })
  const trendData = Object.entries(trendMap)
    .sort(([a], [b]) => {
      const [dA, mA] = a.split('/').map(Number)
      const [dB, mB] = b.split('/').map(Number)
      return mA !== mB ? mA - mB : dA - dB
    })
    .map(([name, v]) => ({ name, ...v }))

  return {
    summary: { totalIncome, expenses, netProfit },
    transactions: allTransactions,
    categories: mergedCategories,
    incomeCategoryData,
    expenseCategoryData,
    trendData,
  }
}
