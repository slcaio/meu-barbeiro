'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTransaction } from '@/app/financial/actions'

export function AddTransactionDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<'income' | 'expense'>('expense')

  const handleSubmit = async (formData: FormData) => {
    formData.append('type', type)
    const result = await createTransaction(formData)
    
    if (result?.success) {
      setIsOpen(false)
    } else if (result?.error) {
      alert(result.error)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => { setType('income'); setIsOpen(true); }} className="text-green-600 border-green-200 hover:bg-green-50">
          <Plus className="mr-2 h-4 w-4" /> Receita Extra
        </Button>
        <Button variant="destructive" onClick={() => { setType('expense'); setIsOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nova Despesa
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={type === 'income' ? 'Registrar Receita Extra' : 'Registrar Despesa'}>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" name="description" placeholder={type === 'income' ? "Ex: Venda de produto" : "Ex: Conta de luz"} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
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
