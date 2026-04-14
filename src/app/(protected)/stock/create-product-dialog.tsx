'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
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
import { createProduct } from '@/app/stock/actions'

export function CreateProductDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [costPrice, setCostPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [unit, setUnit] = useState('un')

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
    formData.set('cost_price', parseCurrency(costPrice).toString())
    formData.set('sale_price', parseCurrency(salePrice).toString())
    formData.set('unit', unit)

    const result = await createProduct(formData)

    if (result?.success) {
      setIsOpen(false)
      setCostPrice('')
      setSalePrice('')
      setUnit('un')
    } else if (result?.error) {
      alert(result.error)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Novo Produto
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Novo Produto">
        <form action={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Nome *</span>
            <Input name="name" placeholder="Ex: Pomada Modeladora" required minLength={2} />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Descrição</span>
            <Input name="description" placeholder="Descrição opcional" />
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
              <span className="text-sm font-medium">Estoque Inicial</span>
              <Input name="initial_stock" type="number" min={0} defaultValue={0} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Estoque Mínimo</span>
              <Input name="min_stock" type="number" min={0} defaultValue={0} />
            </div>
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

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Cadastrar</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
