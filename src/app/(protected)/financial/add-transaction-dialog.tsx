'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/submit-button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, parseCurrency } from '@/lib/utils'
import { createTransaction } from '@/app/financial/actions'

interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
}

interface AddTransactionDialogProps {
  categories: Category[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  initialType?: 'income' | 'expense'
}

export function AddTransactionDialog({ categories: allCategories, isOpen: externalIsOpen, onOpenChange, initialType }: AddTransactionDialogProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)

  const isControlled = typeof externalIsOpen !== 'undefined'
  const isOpen = isControlled ? externalIsOpen : internalIsOpen
  const setIsOpen = (open: boolean) => {
    if (isControlled) {
      onOpenChange?.(open)
    } else {
      setInternalIsOpen(open)
    }
  }

  const [type, setType] = useState<'income' | 'expense'>(initialType || 'expense')
  const [amount, setAmount] = useState('')
  const [categoryValue, setCategoryValue] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    if (initialType) {
      setType(initialType)
    }
  }, [initialType])

  const categories = allCategories.filter(c => c.type === type).map(c => c.name)

  const handleOpen = (newType: 'income' | 'expense') => {
    setType(newType)
    setAmount('')
    setCategoryValue('')
    setSelectedDate(new Date())
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

    // Set category from controlled state
    if (categoryValue) {
      formData.set('category', categoryValue)
    }

    // Set date from calendar
    if (selectedDate) {
      formData.set('record_date', selectedDate.toISOString().split('T')[0])
    }
    
    const result = await createTransaction(formData)
    
    if (result?.success) {
      setIsOpen(false)
      setAmount('')
      setCategoryValue('')
      setSelectedDate(new Date())
    } else if (result?.error) {
      alert(result.error)
    }
  }

  return (
    <>
      {!isControlled && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleOpen('income')} className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-500/10">
            <Plus className="mr-2 h-4 w-4" /> Receita Extra
          </Button>
          <Button variant="destructive" onClick={() => handleOpen('expense')}>
            <Plus className="mr-2 h-4 w-4" /> Nova Despesa
          </Button>
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={type === 'income' ? 'Registrar Receita Extra' : 'Registrar Despesa'}>
        <form action={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Categoria</span>
            <Select value={categoryValue} onValueChange={setCategoryValue}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Descrição</span>
            <Input id="description" name="description" placeholder={type === 'income' ? "Ex: Venda de produto" : "Ex: Conta de luz"} required />
          </div>
          
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Valor</span>
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

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Data</span>
            <DatePicker value={selectedDate} onChange={setSelectedDate} />
          </div>

          <div className="pt-4 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <SubmitButton variant={type === 'income' ? 'default' : 'destructive'} pendingText="Registrando...">
              {type === 'income' ? 'Registrar Receita' : 'Registrar Despesa'}
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  )
}
