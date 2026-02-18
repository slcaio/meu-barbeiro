import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import { AddTransactionDialog } from './add-transaction-dialog'
import { TransactionList } from './transaction-list'

async function getFinancialData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) redirect('/setup/wizard')

  // Get current month range
  const date = new Date()
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString()

  // 1. Get Income from Paid Appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, total_amount, appointment_date, client_name, services(name)')
    .eq('barbershop_id', barbershop.id)
    .eq('payment_status', 'paid')
    .gte('appointment_date', firstDay)
    .lte('appointment_date', lastDay)
    .order('appointment_date', { ascending: false })

  // 2. Get Manual Transactions (Income/Expense)
  const { data: transactions } = await supabase
    .from('financial_records')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .gte('record_date', firstDay)
    .lte('record_date', lastDay)
    .order('record_date', { ascending: false })

  // Calculate totals
  const appointmentIncome = appointments?.reduce((sum, apt) => sum + apt.total_amount, 0) || 0
  
  const manualIncome = transactions
    ?.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) || 0

  const expenses = transactions
    ?.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0) || 0

  const totalIncome = appointmentIncome + manualIncome
  const netProfit = totalIncome - expenses

  // Combine for list view
  const allTransactions = [
    ...(appointments?.map(apt => ({
      id: apt.id,
      type: 'income' as const,
      amount: apt.total_amount,
      description: `${apt.client_name} - ${apt.services?.name || 'Serviço'}`,
      date: apt.appointment_date,
      source: 'appointment' as const
    })) || []),
    ...(transactions?.map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description || 'Sem descrição',
      date: t.record_date,
      source: 'manual' as const
    })) || [])
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return {
    summary: {
      totalIncome,
      expenses,
      netProfit
    },
    transactions: allTransactions
  }
}

export default async function FinancialPage() {
  const { summary, transactions } = await getFinancialData()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Resumo financeiro do mês atual.
          </p>
        </div>
        <AddTransactionDialog />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              +0% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.expenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              +0% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Resultado do mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Extrato Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionList transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  )
}
