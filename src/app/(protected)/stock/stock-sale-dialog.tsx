'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, parseCurrency } from '@/lib/utils'
import { registerStockSale } from '@/app/stock/actions'
import type { Product, PaymentMethod } from '@/types/database.types'

interface StockSaleDialogProps {
  products: Product[]
  paymentMethods: PaymentMethod[]
  preselectedProductId?: string
  variant?: 'button' | 'icon'
}

export function StockSaleDialog({
  products,
  paymentMethods,
  preselectedProductId,
  variant = 'button',
}: StockSaleDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [productId, setProductId] = useState(preselectedProductId ?? '')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')

  const selectedProduct = products.find(p => p.id === productId)
  const numericQuantity = parseInt(quantity) || 0
  const numericUnitPrice = parseCurrency(unitPrice)
  const total = numericQuantity * numericUnitPrice

  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  useEffect(() => {
    if (productId && selectedProduct) {
      setUnitPrice(formatCurrency((selectedProduct.sale_price * 100).toString()))
    }
  }, [productId, selectedProduct])

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '') { setUnitPrice(''); return }
    const numericValue = value.replace(/\D/g, '')
    setUnitPrice(formatCurrency(numericValue))
  }

  const handleOpen = () => {
    setProductId(preselectedProductId ?? '')
    setQuantity('')
    setUnitPrice('')
    setPaymentMethodId('')
    setIsOpen(true)
  }

  const handleSubmit = async (formData: FormData) => {
    formData.set('product_id', productId)
    formData.set('quantity', quantity)
    formData.set('unit_price', numericUnitPrice.toString())
    formData.set('payment_method_id', paymentMethodId)

    const result = await registerStockSale(formData)

    if (result?.success) {
      setIsOpen(false)
      setProductId('')
      setQuantity('')
      setUnitPrice('')
      setPaymentMethodId('')
    } else if (result?.error) {
      alert(result.error)
    }
  }

  const maxQuantity = selectedProduct?.current_stock ?? 0

  return (
    <>
      {variant === 'icon' ? (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={handleOpen}>
          <ShoppingCart className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant="outline" onClick={handleOpen} className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-500/10">
          <ShoppingCart className="mr-2 h-4 w-4" /> Registrar Venda
        </Button>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Registrar Venda de Produto">
        <form action={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Produto *</span>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} (estoque: {p.current_stock} {p.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Quantidade *</span>
              <Input
                type="number"
                min={1}
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
              />
              {selectedProduct && (
                <span className="text-xs text-muted-foreground">
                  Disponível: {selectedProduct.current_stock} {selectedProduct.unit}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Preço Unitário *</span>
              <Input
                value={unitPrice}
                onChange={handleCurrencyChange}
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                required
              />
            </div>
          </div>

          {total > 0 && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3 text-sm">
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatBRL(total)}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Método de Pagamento</span>
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id}>
                    {pm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Observações</span>
            <Input name="notes" placeholder="Observações (opcional)" />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!productId || numericQuantity < 1 || numericQuantity > maxQuantity}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Registrar Venda
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
