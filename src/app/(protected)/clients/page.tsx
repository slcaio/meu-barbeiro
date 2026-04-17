import { getClients } from '@/app/clients/actions'
import { ClientList } from './client-list'
import { CreateClientDialog } from './create-client-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, AlertCircle } from 'lucide-react'

export default async function ClientsPage() {
  const clients = await getClients()
  const totalClients = clients.length
  const incompleteCount = clients.filter(c => !c.cpf && !c.email).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie sua base de clientes.
          </p>
        </div>
        <CreateClientDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dados Incompletos</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incompleteCount}</div>
            <p className="text-xs text-muted-foreground mt-1">sem CPF ou email</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientList clients={clients} />
        </CardContent>
      </Card>
    </div>
  )
}
