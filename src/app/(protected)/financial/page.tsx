import { getFinancialPageData, type SearchParams } from '@/app/financial/actions'
import { AddTransactionDialog } from './add-transaction-dialog'
import { TransactionSection } from './transaction-section'
import { CommissionReportDialog } from './commission-report-dialog'
import { CategoryChart } from './category-chart'
import { TrendChart } from './trend-chart'

export default async function FinancialPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams
  const { transactions, categories, incomeCategoryData, expenseCategoryData, trendData } = await getFinancialPageData(searchParams)

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
          <AddTransactionDialog categories={categories} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
        <TrendChart data={trendData} />
        <CategoryChart data={incomeCategoryData} type="income" />
        <CategoryChart data={expenseCategoryData} type="expense" />
      </div>

      {/* Transaction List with Search & Pagination */}
      <TransactionSection transactions={transactions} categories={categories} />
    </div>
  )
}
