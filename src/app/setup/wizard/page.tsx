'use client'

import { createBarbershop } from '@/app/setup/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useActionState, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const initialState = {
  error: null as string | null,
}

export default function SetupWizardPage() {
  const [state, formAction, isPending] = useActionState(createBarbershop, initialState)
  const router = useRouter()
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    zip: '',
    street: '',
    number: '',
    city: '',
    uf: '',
    phone: '',
  })

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 8) value = value.slice(0, 8)
    
    // Mask 00000-000
    if (value.length > 5) {
      value = value.replace(/^(\d{5})(\d)/, '$1-$2')
    }
    
    setFormData(prev => ({ ...prev, zip: value }))

    if (value.replace('-', '').length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${value.replace('-', '')}/json/`)
        const data = await response.json()
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro || '',
            city: data.localidade || '',
            uf: data.uf || '',
            zip: value
          }))
        }
      } catch (error) {
        console.error('Error fetching CEP:', error)
      }
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 11) value = value.slice(0, 11)
    
    // Mask (00) 00000-0000
    if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d)/g, '($1) $2')
    }
    if (value.length > 7) {
      if (value.replace(/\D/g, '').length === 11) {
        value = value.replace(/(\d{5})(\d{4})$/, '$1-$2')
      } else {
        value = value.replace(/(\d{4})(\d{4})$/, '$1-$2')
      }
    }
    
    setFormData(prev => ({ ...prev, phone: value }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'state') {
        setFormData(prev => ({ ...prev, uf: value.toUpperCase() }))
    } else {
        setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  useEffect(() => {
    // Check if user already has a barbershop
    const checkBarbershop = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (barbershop) {
        router.push('/dashboard')
      }
    }

    checkBarbershop()
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Configurar Barbearia</CardTitle>
          <CardDescription className="text-center">
            Vamos configurar o perfil da sua barbearia. Você poderá alterar isso depois.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Barbearia</Label>
              <Input id="name" name="name" placeholder="Ex: Barbearia do Silva" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input 
                id="phone" 
                name="phone" 
                placeholder="(00) 00000-0000" 
                value={formData.phone || ''}
                onChange={handlePhoneChange}
                required 
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="zip">CEP</Label>
                <Input 
                  id="zip" 
                  name="zip" 
                  placeholder="00000-000" 
                  value={formData.zip || ''}
                  onChange={handleZipChange}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado (UF)</Label>
                <Input 
                  id="state" 
                  name="state" 
                  placeholder="SP" 
                  maxLength={2} 
                  className="uppercase" 
                  value={formData.uf || ''}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input 
                id="city" 
                name="city" 
                placeholder="São Paulo" 
                value={formData.city || ''}
                onChange={handleChange}
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Endereço Completo</Label>
              <Input 
                id="street" 
                name="street" 
                placeholder="Rua das Flores" 
                value={formData.street || ''}
                onChange={handleChange}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input 
                id="number" 
                name="number" 
                placeholder="123" 
                value={formData.number || ''}
                onChange={handleChange}
                required 
              />
            </div>

            {state?.error && (
              <div className="text-sm text-red-500 text-center">{state.error}</div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" isLoading={isPending}>
              Concluir Configuração
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
