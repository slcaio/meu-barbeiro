import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import { AddTransactionDialog } from './add-transaction-dialog'
import { TransactionList } from './transaction-list'
import { FinancialFilters } from './financial-filters'

type SearchParams = {
  from?: string
  to?: string
  type?: string
  category?: string
  period?: string
}

async function getFinancialData(searchParams: SearchParams) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) redirect('/setup/wizard')

  // Date Filtering
  const date = new Date()
  let firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
  let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString()

  if (searchParams.from && searchParams.to) {
    firstDay = searchParams.from
    lastDay = searchParams.to
  }

  // Base Query
  let query = supabase
    .from('financial_records')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .gte('record_date', firstDay)
    .lte('record_date', lastDay)
    .order('record_date', { ascending: false })

  // Apply filters
  if (searchParams.type && searchParams.type !== 'all') {
    if (searchParams.type === 'income' || searchParams.type === 'expense') {
      query = query.eq('type', searchParams.type)
    }
  }

  if (searchParams.category && searchParams.category !== 'all') {
    query = query.eq('category', searchParams.category)
  }

  // Execute Query
  const { data: transactions } = await query

  // Calculate totals (ALWAYS from the filtered set to reflect what user sees)
  // OR: Should totals always reflect the PERIOD regardless of type/category filter?
  // Usually, "Revenue Total" card implies TOTAL revenue for the period.
  // But if I filter by "Expense", showing "Revenue Total" might be confusing or just 0.
  // Let's make totals reflect the current filtered view for consistency.
  
  const totalIncome = transactions
    ?.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) || 0

  const expenses = transactions
    ?.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0) || 0

  const netProfit = totalIncome - expenses

  // List view
  const allTransactions = transactions?.map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description || 'Sem descrição',
      category: t.category || 'Outros',
      date: t.record_date,
      source: 'manual' as const
    })) || []
    
  return {
    summary: {
      totalIncome,
      expenses,
      netProfit
    },
    transactions: allTransactions
  }
}

export default async function FinancialPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams
  const { summary, transactions } = await getFinancialData(searchParams)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie suas receitas e despesas.
          </p>
        </div>
        <AddTransactionDialog />
      </div>

      <FinancialFilters />

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
