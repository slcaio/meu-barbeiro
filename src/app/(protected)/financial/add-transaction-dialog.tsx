'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTransaction } from '@/app/financial/actions'
import { formatCurrency, parseCurrency } from '@/lib/utils'

export function AddTransactionDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')

  const INCOME_CATEGORIES = ['Serviço', 'Produto', 'Outros']
  const EXPENSE_CATEGORIES = ['Aluguel', 'Contas (Água/Luz/Internet)', 'Impostos', 'Produtos', 'Salário', 'Manutenção', 'Marketing', 'Outros']

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const handleOpen = (newType: 'income' | 'expense') => {
    setType(newType)
    setAmount('')
    setIsOpen(true)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '') {
      setAmount('')
      return
    }
    const numericValue = value.replace(/\D/g, '')
    const formatted = formatCurrency(numericValue)
    setAmount(formatted)
  }

  const handleSubmit = async (formData: FormData) => {
    formData.append('type', type)
    
    // Parse amount from "R$ 10,00" to "10.00"
    const rawAmount = parseCurrency(amount)
    formData.set('amount', rawAmount.toString())
    
    const result = await createTransaction(formData)
    
    if (result?.success) {
      setIsOpen(false)
      setAmount('')
    } else if (result?.error) {
      alert(result.error)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => handleOpen('income')} className="text-green-600 border-green-200 hover:bg-green-50">
          <Plus className="mr-2 h-4 w-4" /> Receita Extra
        </Button>
        <Button variant="destructive" onClick={() => handleOpen('expense')}>
          <Plus className="mr-2 h-4 w-4" /> Nova Despesa
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={type === 'income' ? 'Registrar Receita Extra' : 'Registrar Despesa'}>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <select
              id="category"
              name="category"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" name="description" placeholder={type === 'income' ? "Ex: Venda de produto" : "Ex: Conta de luz"} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input 
              id="amount" 
              name="amount" 
              value={amount}
              onChange={handleAmountChange}
              type="text" 
              inputMode="numeric"
              placeholder="R$ 0,00" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="record_date">Data</Label>
            <Input 
              id="record_date" 
              name="record_date" 
              type="date" 
              required 
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" variant={type === 'income' ? 'default' : 'destructive'}>
              {type === 'income' ? 'Registrar Receita' : 'Registrar Despesa'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
