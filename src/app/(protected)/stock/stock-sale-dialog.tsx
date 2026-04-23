'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Loader2 } from 'lucide-react'
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
import type { Product, PaymentMethodWithInstallments, BarberOption } from '@/types/database.types'

interface StockSaleDialogProps {
  products: Product[]
  paymentMethods: PaymentMethodWithInstallments[]
  barbers: BarberOption[]
  preselectedProductId?: string
  variant?: 'button' | 'icon'
}

export function StockSaleDialog({
  products,
  paymentMethods,
  barbers,
  preselectedProductId,
  variant = 'button',
}: StockSaleDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [productId, setProductId] = useState(preselectedProductId ?? '')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [selectedInstallments, setSelectedInstallments] = useState<number>(1)
  const [barberId, setBarberId] = useState('')

  const selectedProduct = products.find(p => p.id === productId)
  const selectedMethod = paymentMethods.find(pm => pm.id === paymentMethodId)
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

  const handlePaymentMethodChange = (id: string) => {
    setPaymentMethodId(id)
    setSelectedInstallments(1)
  }

  const handleOpen = () => {
    setProductId(preselectedProductId ?? '')
    setQuantity('')
    setUnitPrice('')
    setPaymentMethodId('')
    setSelectedInstallments(1)
    setBarberId('')
    setIsOpen(true)
  }

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    formData.set('product_id', productId)
    formData.set('quantity', quantity)
    formData.set('unit_price', numericUnitPrice.toString())
    formData.set('payment_method_id', paymentMethodId)
    formData.set('installments', selectedInstallments.toString())
    formData.set('barber_id', barberId === 'none' ? '' : barberId)

    const result = await registerStockSale(formData)

    if (result?.success) {
      setIsOpen(false)
      setProductId('')
      setQuantity('')
      setUnitPrice('')
      setPaymentMethodId('')
      setSelectedInstallments(1)
      setBarberId('')
    } else if (result?.error) {
      alert(result.error)
    }
    setIsLoading(false)
  }

  const maxQuantity = selectedProduct?.current_stock ?? 0

  // Build installment options for selected method
  const installmentOptions: { value: number; label: string; fee: number }[] = []
  if (selectedMethod?.supports_installments && total > 0) {
    const baseFee = selectedMethod.fee_type === 'percentage'
      ? total * (selectedMethod.fee_value / 100)
      : selectedMethod.fee_value
    installmentOptions.push({
      value: 1,
      label: `1x de ${formatBRL(total)}${baseFee > 0 ? ` (taxa ${selectedMethod.fee_value}%)` : ' (sem taxa)'}`,
      fee: baseFee,
    })
    const sortedTiers = [...selectedMethod.payment_method_installments].sort(
      (a, b) => a.installment_number - b.installment_number
    )
    for (const tier of sortedTiers) {
      const installmentValue = total / tier.installment_number
      installmentOptions.push({
        value: tier.installment_number,
        label: `${tier.installment_number}x de ${formatBRL(installmentValue)} (taxa ${tier.fee_percentage}%)`,
        fee: total * (tier.fee_percentage / 100),
      })
    }
  }

  // Calculate fee based on installments
  let feeAmount = 0
  let feeLabel = ''
  if (selectedMethod && total > 0) {
    if (selectedInstallments > 1 && selectedMethod.supports_installments) {
      const tier = selectedMethod.payment_method_installments.find(
        t => t.installment_number === selectedInstallments
      )
      if (tier) {
        feeAmount = total * (tier.fee_percentage / 100)
        feeLabel = `${selectedMethod.name} ${selectedInstallments}x - ${tier.fee_percentage}%`
      }
    } else {
      if (selectedMethod.fee_type === 'percentage') {
        feeAmount = total * (selectedMethod.fee_value / 100)
      } else {
        feeAmount = selectedMethod.fee_value
      }
      if (feeAmount > 0) {
        feeLabel = `${selectedMethod.name} ${selectedMethod.fee_type === 'percentage' ? `${selectedMethod.fee_value}%` : `R$ ${selectedMethod.fee_value.toFixed(2)}`}`
      }
    }
  }

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
            <Select value={paymentMethodId} onValueChange={handlePaymentMethodChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id}>
                    {pm.name}{pm.fee_value > 0 ? ` (${pm.fee_type === 'percentage' ? `${pm.fee_value}%` : `R$ ${pm.fee_value.toFixed(2)}`})` : ''}{pm.supports_installments ? ' • Parcelável' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMethod?.supports_installments && installmentOptions.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Parcelas</span>
              <select
                value={selectedInstallments}
                onChange={(e) => setSelectedInstallments(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {installmentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedMethod && feeAmount > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-md text-sm text-amber-600 dark:text-amber-400">
              <p><strong>Taxa ({feeLabel}):</strong> {formatBRL(feeAmount)}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Observações</span>
            <Input name="notes" placeholder="Observações (opcional)" />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Barbeiro (comissão)</span>
            <Select value={barberId} onValueChange={setBarberId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Nenhum (sem comissão)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {barbers.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProduct && selectedProduct.commission_percentage > 0 && barberId && (
              <span className="text-xs text-muted-foreground">
                Comissão: {selectedProduct.commission_percentage}% sobre o valor da venda
              </span>
            )}
          </div>

          <div className="pt-4 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !productId || numericQuantity < 1 || numericQuantity > maxQuantity}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...</>
              ) : 'Registrar Venda'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
