'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateBarber } from '@/app/barbers/actions'
import { formatPhone } from '@/lib/utils'

interface Barber {
  id: string
  name: string
  phone: string | null
  email: string | null
  role: string
  commission_percentage: number
  is_active: boolean
  notes: string | null
}

interface EditBarberDialogProps {
  barber: Barber | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function EditBarberDialog({ barber, isOpen, onOpenChange }: EditBarberDialogProps) {
  const [phone, setPhone] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (barber && isOpen) {
      setPhone(barber.phone ? formatPhone(barber.phone) : '')
      setIsActive(barber.is_active)
    }
  }, [barber, isOpen])

  if (!barber) return null

  const handleSubmit = async (formData: FormData) => {
    formData.set('id', barber.id)
    formData.set('is_active', isActive.toString())

    const result = await updateBarber(formData)
    if (result?.success) {
      onOpenChange(false)
    } else if (result?.error) {
      alert(result.error)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => onOpenChange(false)} title="Editar Barbeiro">
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Nome *</Label>
          <Input id="edit-name" name="name" defaultValue={barber.name} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-phone">Telefone</Label>
          <Input
            id="edit-phone"
            name="phone"
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-email">Email</Label>
          <Input
            id="edit-email"
            name="email"
            type="email"
            defaultValue={barber.email || ''}
            placeholder="email@exemplo.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-role">Função</Label>
            <select
              id="edit-role"
              name="role"
              defaultValue={barber.role}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="barber">Barbeiro</option>
              <option value="senior_barber">Sênior</option>
              <option value="trainee">Aprendiz</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-commission">Comissão (%)</Label>
            <Input
              id="edit-commission"
              name="commission_percentage"
              type="number"
              min="0"
              max="100"
              step="1"
              defaultValue={barber.commission_percentage}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-notes">Observações</Label>
          <Input
            id="edit-notes"
            name="notes"
            defaultValue={barber.notes || ''}
            placeholder="Observações sobre o barbeiro..."
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="edit-is-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
          />
          <Label htmlFor="edit-is-active" className="text-sm font-normal">
            Barbeiro ativo (aparece na agenda)
          </Label>
        </div>

        <div className="pt-4 flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  )
}
