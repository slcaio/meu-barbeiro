import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProducts, getPendingEntries } from '@/app/stock/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, AlertTriangle, Clock, DollarSign, TrendingUp } from 'lucide-react'
import { ProductList } from './product-list'
import { PendingEntriesSection } from './pending-entries-section'
import { CreateProductDialog } from './create-product-dialog'
import { StockEntryDialog } from './stock-entry-dialog'
import { StockSaleDialog } from './stock-sale-dialog'
import type { PaymentMethodWithInstallments } from '@/types/database.types'

export default async function StockPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) redirect('/setup/wizard')

  const products = await getProducts()
  const pendingEntries = await getPendingEntries()

  const { data: paymentMethods } = await supabase
    .from('payment_methods')
    .select('id, name, fee_type, fee_value, supports_installments, payment_method_installments(installment_number, fee_percentage)')
    .eq('barbershop_id', barbershop.id)
    .eq('is_active', true)
    .order('name')

  const typedPaymentMethods = (paymentMethods ?? []) as unknown as PaymentMethodWithInstallments[]

  const lowStockCount = products.filter(p => p.min_stock > 0 && p.current_stock < p.min_stock).length
  const totalStockValue = products.reduce((sum, p) => sum + (p.cost_price * p.current_stock), 0)
  const totalSaleValue = products.reduce((sum, p) => sum + (p.sale_price * p.current_stock), 0)

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
          <StockSaleDialog products={products} paymentMethods={typedPaymentMethods} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produtos</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">produto(s) abaixo do mínimo</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas Pendentes</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingEntries.length}</div>
            <p className="text-xs text-muted-foreground">aguardando liquidação</p>
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
            <p className="text-xs text-muted-foreground">custo total</p>
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
          <ProductList products={products} paymentMethods={typedPaymentMethods} />
        </CardContent>
      </Card>

      {pendingEntries.length > 0 && (
        <PendingEntriesSection entries={pendingEntries} />
      )}
    </div>
  )
}
