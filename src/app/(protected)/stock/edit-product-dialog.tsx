'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/submit-button'
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
import { updateProduct } from '@/app/stock/actions'
import type { Product } from '@/types/database.types'

interface EditProductDialogProps {
  product: Product
}

export function EditProductDialog({ product }: EditProductDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [costPrice, setCostPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [unit, setUnit] = useState(product.unit)

  const handleOpen = () => {
    setCostPrice(formatCurrency((product.cost_price * 100).toString()))
    setSalePrice(formatCurrency((product.sale_price * 100).toString()))
    setUnit(product.unit)
    setIsOpen(true)
  }

  const handleCurrencyChange = (
    setter: (val: string) => void,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    if (value === '') { setter(''); return }
    const numericValue = value.replace(/\D/g, '')
    setter(formatCurrency(numericValue))
  }

  const handleSubmit = async (formData: FormData) => {
    formData.set('id', product.id)
    formData.set('cost_price', parseCurrency(costPrice).toString())
    formData.set('sale_price', parseCurrency(salePrice).toString())
    formData.set('unit', unit)

    const result = await updateProduct(formData)

    if (result?.success) {
      setIsOpen(false)
    } else if (result?.error) {
      alert(result.error)
    }
  }

  return (
    <>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpen}>
        <Pencil className="h-4 w-4" />
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Editar Produto">
        <form action={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Nome *</span>
            <Input name="name" defaultValue={product.name} required minLength={2} />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Descrição</span>
            <Input name="description" defaultValue={product.description ?? ''} placeholder="Descrição opcional" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Preço de Custo</span>
              <Input
                value={costPrice}
                onChange={(e) => handleCurrencyChange(setCostPrice, e)}
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Preço de Venda *</span>
              <Input
                value={salePrice}
                onChange={(e) => handleCurrencyChange(setSalePrice, e)}
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Estoque Mínimo</span>
              <Input name="min_stock" type="number" min={0} defaultValue={product.min_stock} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Unidade</span>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="un">Unidade (un)</SelectItem>
                  <SelectItem value="ml">Mililitro (ml)</SelectItem>
                  <SelectItem value="g">Grama (g)</SelectItem>
                  <SelectItem value="kg">Quilograma (kg)</SelectItem>
                  <SelectItem value="L">Litro (L)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Comissão do barbeiro (%)</span>
            <Input
              name="commission_percentage"
              type="number"
              min={0}
              max={100}
              step={0.01}
              defaultValue={product.commission_percentage}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Percentual de comissão pago ao barbeiro na venda deste produto.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Estoque atual: <strong>{product.current_stock} {product.unit}</strong> — controlado pelas movimentações.
          </p>

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton pendingText="Salvando...">Salvar</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  )
}
