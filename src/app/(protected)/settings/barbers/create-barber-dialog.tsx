'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/submit-button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { createBarber } from '@/app/barbers/actions'
import { formatPhone } from '@/lib/utils'

export function CreateBarberDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [phone, setPhone] = useState('')

  const handleSubmit = async (formData: FormData) => {
    const result = await createBarber(formData)
    if (result?.success) {
      setIsOpen(false)
      setPhone('')
    } else if (result?.error) {
      alert(result.error)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Novo Barbeiro
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Novo Barbeiro">
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" name="name" placeholder="Nome completo" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="email@exemplo.com" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <select
                id="role"
                name="role"
                defaultValue="barber"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="barber">Barbeiro</option>
                <option value="senior_barber">Sênior</option>
                <option value="trainee">Aprendiz</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission_percentage">Comissão (%)</Label>
              <Input
                id="commission_percentage"
                name="commission_percentage"
                type="number"
                min="0"
                max="100"
                step="1"
                defaultValue="0"
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Input id="notes" name="notes" placeholder="Observações sobre o barbeiro..." />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton pendingText="Cadastrando...">Cadastrar</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  )
}
