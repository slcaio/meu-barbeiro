'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createNewClient } from '@/app/clients/actions'

export function CreateClientDialog() {
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    const result = await createNewClient(formData)
    if (result.success) {
      setIsOpen(false)
    } else {
      alert(JSON.stringify(result.error))
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Novo Cliente
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Novo Cliente">
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cliente *</Label>
            <Input id="name" name="name" required placeholder="Nome completo" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Celular</Label>
            <Input id="phone" name="phone" placeholder="(00) 00000-0000" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="cliente@email.com" />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
