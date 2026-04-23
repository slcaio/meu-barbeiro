import { getStockPageData } from '@/app/stock/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, AlertTriangle, Clock, DollarSign, TrendingUp } from 'lucide-react'
import { ProductList } from './product-list'
import { PendingEntriesSection } from './pending-entries-section'
import { CreateProductDialog } from './create-product-dialog'
import { StockEntryDialog } from './stock-entry-dialog'
import { StockSaleDialog } from './stock-sale-dialog'
import type { PaymentMethodWithInstallments } from '@/types/database.types'

export default async function StockPage() {
  const { products, pendingEntries, paymentMethods, barbers, lowStockCount, totalStockValue, totalSaleValue } = await getStockPageData()

  const typedPaymentMethods = paymentMethods as unknown as PaymentMethodWithInstallments[]

  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Estoque</h1>
          <p className="text-muted-foreground">Gerencie seus produtos e movimentações.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CreateProductDialog />
          <StockEntryDialog products={products} />
          <StockSaleDialog products={products} paymentMethods={typedPaymentMethods} barbers={barbers ?? []} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <Package className="h-4 w-4 text-blue-500" />
              </div>
              <span className="flex-1 text-sm text-muted-foreground">Total de produtos</span>
              <span className="text-sm font-semibold">{products.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <span className="flex-1 text-sm text-muted-foreground">Estoque baixo</span>
              <span className={`text-sm font-semibold ${lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                {lowStockCount}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <span className="flex-1 text-sm text-muted-foreground">Entradas pendentes</span>
              <span className={`text-sm font-semibold ${pendingEntries.length > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                {pendingEntries.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(totalStockValue)}</div>
            <p className="text-xs text-muted-foreground">custo médio ponderado</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor a Preço de Venda</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <TrendingUp className="h-5 w-5 text-violet-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{formatBRL(totalSaleValue)}</div>
            <p className="text-xs text-muted-foreground">preço de venda total</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductList products={products} paymentMethods={typedPaymentMethods} barbers={barbers ?? []} />
        </CardContent>
      </Card>

      {pendingEntries.length > 0 && (
        <PendingEntriesSection entries={pendingEntries} />
      )}
    </div>
  )
}
