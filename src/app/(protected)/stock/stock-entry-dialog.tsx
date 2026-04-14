'use client'

import { useState } from 'react'
import { PackagePlus } from 'lucide-react'
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
import { registerStockEntry } from '@/app/stock/actions'
import type { Product } from '@/types/database.types'

interface StockEntryDialogProps {
  products: Product[]
}

export function StockEntryDialog({ products }: StockEntryDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')

  const numericQuantity = parseInt(quantity) || 0
  const numericUnitCost = parseCurrency(unitCost)
  const total = numericQuantity * numericUnitCost

  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '') { setUnitCost(''); return }
    const numericValue = value.replace(/\D/g, '')
    setUnitCost(formatCurrency(numericValue))
  }

  const handleSubmit = async (formData: FormData) => {
    formData.set('product_id', productId)
    formData.set('quantity', quantity)
    formData.set('unit_cost', numericUnitCost.toString())

    const result = await registerStockEntry(formData)

    if (result?.success) {
      setIsOpen(false)
      setProductId('')
      setQuantity('')
      setUnitCost('')
    } else if (result?.error) {
      alert(result.error)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <PackagePlus className="mr-2 h-4 w-4" /> Registrar Entrada
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Registrar Entrada de Estoque">
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
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Custo Unitário *</span>
              <Input
                value={unitCost}
                onChange={handleCurrencyChange}
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                required
              />
            </div>
          </div>

          {total > 0 && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold">{formatBRL(total)}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Observações</span>
            <Input name="notes" placeholder="Ex: Compra no fornecedor X" />
          </div>

          <p className="text-xs text-muted-foreground">
            A entrada ficará com status &quot;Pendente&quot; até ser liquidada no financeiro.
          </p>

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!productId || numericQuantity < 1}>
              Registrar Entrada
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
