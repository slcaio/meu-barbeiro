import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'
import { createService, deleteService, getServices } from '@/app/settings/actions'
import { SubmitButton } from '@/components/ui/submit-button'
export default async function ServicesPage() {
  const services = await getServices()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
        <p className="text-muted-foreground">
          Gerencie os serviços que sua barbearia oferece.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Service Form */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Serviço</CardTitle>
            <CardDescription>Preencha os dados para criar um novo serviço.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={async (formData) => {
              'use server'
              await createService(formData)
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Serviço</Label>
                <Input id="name" name="name" placeholder="Ex: Corte Degrade" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Input id="description" name="description" placeholder="Detalhes do serviço" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input id="price" name="price" type="number" min="0" step="0.01" placeholder="30.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">Duração (min)</Label>
                  <Input id="duration_minutes" name="duration_minutes" type="number" min="5" step="5" placeholder="30" required />
                </div>
              </div>
              <SubmitButton className="w-full" pendingText="Adicionando...">Adicionar Serviço</SubmitButton>
            </form>
          </CardContent>
        </Card>

        {/* List Services */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços Existentes</CardTitle>
            <CardDescription>Lista de todos os serviços cadastrados.</CardDescription>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum serviço cadastrado.</p>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)} • {service.duration_minutes} min
                      </p>
                    </div>
                    <form action={async () => {
                      'use server'
                      await deleteService(service.id)
                    }}>
                      <SubmitButton variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" />
                      </SubmitButton>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
