import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import { AddTransactionDialog } from './add-transaction-dialog'
import { TransactionList } from './transaction-list'
import { FinancialFilters } from './financial-filters'
import { CommissionReportDialog } from './commission-report-dialog'
import { StatementReportDialog } from './statement-report-dialog'
import { CategoryChart } from './category-chart'
import { TrendChart } from './trend-chart'

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

  // Fetch categories from categories table
  const { data: dbCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .order('name')

  // Fetch distinct categories already used in financial_records
  const { data: usedRecords } = await supabase
    .from('financial_records')
    .select('category, type')
    .eq('barbershop_id', barbershop.id)

  // Merge: start with categories table entries, then add any used categories not yet in the table
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
    .select('*, payment_methods(name)')
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
      source: 'manual' as const,
      paymentMethodName: (t as any).payment_methods?.name || null,
    })) || []
  // Group transactions by category for pie charts
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

  // Trend data: group by day for the period
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
    summary: {
      totalIncome,
      expenses,
      netProfit
    },
    transactions: allTransactions,
    categories: mergedCategories,
    incomeCategoryData,
    expenseCategoryData,
    trendData,
  }
}

export default async function FinancialPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams
  const { summary, transactions, categories, incomeCategoryData, expenseCategoryData, trendData } = await getFinancialData(searchParams)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie suas receitas e despesas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CommissionReportDialog />
          <StatementReportDialog transactions={transactions} summary={summary} />
          <AddTransactionDialog categories={categories} />
        </div>
      </div>

      <FinancialFilters categories={categories} />

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary.totalIncome)}
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(summary.expenses)}
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold ${summary.netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(summary.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Resultado do mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
        <TrendChart data={trendData} />
        <CategoryChart data={incomeCategoryData} type="income" />
        <CategoryChart data={expenseCategoryData} type="expense" />
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Extrato Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionList transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  )
}
