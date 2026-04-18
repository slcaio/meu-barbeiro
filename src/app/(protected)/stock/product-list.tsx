'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Search, ShoppingCart, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EditProductDialog } from './edit-product-dialog'
import { StockHistoryDialog } from './stock-history-dialog'
import { StockSaleDialog } from './stock-sale-dialog'
import { deleteProduct } from '@/app/stock/actions'
import { cn } from '@/lib/utils'
import type { Product, PaymentMethodWithInstallments, BarberOption } from '@/types/database.types'

type ActiveFilter = 'all' | 'low_stock'

interface ProductListProps {
  products: Product[]
  paymentMethods: PaymentMethodWithInstallments[]
  barbers: BarberOption[]
}

export function ProductList({ products, paymentMethods, barbers }: ProductListProps) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const lowStockCount = products.filter(p => p.min_stock > 0 && p.current_stock < p.min_stock).length

  const filtered = products.filter(p => {
    if (activeFilter === 'low_stock' && !(p.min_stock > 0 && p.current_stock < p.min_stock)) return false
    return p.name.toLowerCase().includes(search.toLowerCase())
  })

  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const handleDelete = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    setDeletingId(productId)
    const result = await deleteProduct(productId)
    if (result?.error) alert(result.error)
    setDeletingId(null)
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">Nenhum produto cadastrado</h3>
        <p className="text-sm text-muted-foreground">Cadastre seu primeiro produto para começar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex rounded-md border overflow-hidden shrink-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              activeFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            )}
          >
            Todos
            <span className={cn(
              'ml-2 rounded-full px-1.5 py-0.5 text-xs',
              activeFilter === 'all'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-muted-foreground/20 text-muted-foreground'
            )}>
              {products.length}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter('low_stock')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-l',
              activeFilter === 'low_stock'
                ? 'bg-red-500 text-white'
                : 'bg-background text-muted-foreground hover:bg-muted'
            )}
          >
            Estoque baixo
            <span className={cn(
              'ml-2 rounded-full px-1.5 py-0.5 text-xs',
              activeFilter === 'low_stock'
                ? 'bg-white/20 text-white'
                : 'bg-red-500/10 text-red-600'
            )}>
              {lowStockCount}
            </span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-2 font-medium">Nome</th>
              <th className="text-right py-3 px-2 font-medium hidden sm:table-cell">Custo Médio</th>
              <th className="text-right py-3 px-2 font-medium">Preço Venda</th>
              <th className="text-center py-3 px-2 font-medium">Estoque</th>
              <th className="text-center py-3 px-2 font-medium hidden md:table-cell">Mín.</th>
              <th className="text-center py-3 px-2 font-medium hidden lg:table-cell">Unidade</th>
              <th className="text-right py-3 px-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  {activeFilter === 'low_stock'
                    ? 'Nenhum produto com estoque abaixo do mínimo.'
                    : `Nenhum produto encontrado para "${search}".`}
                </td>
              </tr>
            ) : (
            filtered.map((product) => {
              const isLow = product.min_stock > 0 && product.current_stock < product.min_stock
              const isWarning = product.min_stock > 0 && product.current_stock < product.min_stock * 1.5 && !isLow

              return (
                <tr key={product.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        {product.photo_url ? (
                          <Image
                            src={product.photo_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <span className="text-sm font-bold text-muted-foreground">
                            {product.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">{product.name}</span>
                        {product.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{product.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 hidden sm:table-cell text-muted-foreground">
                    {formatBRL(product.average_cost)}
                  </td>
                  <td className="text-right py-3 px-2 font-medium">
                    {formatBRL(product.sale_price)}
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                      isLow && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                      isWarning && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                      !isLow && !isWarning && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                    )}>
                      {product.current_stock}
                    </span>
                  </td>
                  <td className="text-center py-3 px-2 hidden md:table-cell text-muted-foreground">
                    {product.min_stock}
                  </td>
                  <td className="text-center py-3 px-2 hidden lg:table-cell text-muted-foreground">
                    {product.unit}
                  </td>
                  <td className="text-right py-3 px-2">
                    <div className="flex items-center justify-end gap-1">
                      <EditProductDialog product={product} />
                      <StockHistoryDialog product={product} />
                      <StockSaleDialog
                        products={[product]}
                        paymentMethods={paymentMethods}
                        barbers={barbers}
                        preselectedProductId={product.id}
                        variant="icon"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            }))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
