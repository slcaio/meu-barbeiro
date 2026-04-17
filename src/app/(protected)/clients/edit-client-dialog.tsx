'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/submit-button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateClient } from '@/app/clients/actions'
import { formatPhone, formatCPF } from '@/lib/utils'
import { Database } from '@/types/database.types'

type Client = Database['public']['Tables']['clients']['Row']

interface EditClientDialogProps {
  client: Client | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function EditClientDialog({ client, isOpen, onOpenChange }: EditClientDialogProps) {
  const [phone, setPhone] = useState('')
  const [cpf, setCpf] = useState('')

  useEffect(() => {
    if (client && isOpen) {
      setPhone(client.phone ? formatPhone(client.phone) : '')
      setCpf(client.cpf ? formatCPF(client.cpf) : '')
    }
  }, [client, isOpen])

  if (!client) return null

  const handleSubmit = async (formData: FormData) => {
    formData.set('id', client.id)

    const result = await updateClient(formData)
    if (result?.success) {
      onOpenChange(false)
    } else if (result?.error) {
      alert(result.error)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => onOpenChange(false)} title="Editar Cliente">
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Nome *</Label>
          <Input id="edit-name" name="name" defaultValue={client.name} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-phone">Celular</Label>
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
            defaultValue={client.email || ''}
            placeholder="cliente@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-cpf">CPF</Label>
          <Input
            id="edit-cpf"
            name="cpf"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
          />
        </div>

        <div className="pt-4 flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <SubmitButton pendingText="Salvando...">Salvar</SubmitButton>
        </div>
      </form>
    </Modal>
  )
}
