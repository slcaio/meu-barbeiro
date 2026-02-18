import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { AppointmentList } from './appointment-list' // Client component for interactivity
import { CreateAppointmentDialog } from './create-appointment-dialog' // Client component for modal

async function getData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) redirect('/setup/wizard')

  // Get appointments for today onwards
  const today = new Date().toISOString()
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, services(name, duration_minutes)')
    .eq('barbershop_id', barbershop.id)
    .gte('appointment_date', today)
    .order('appointment_date', { ascending: true })

  // Get services for dropdown
  const { data: services } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes')
    .eq('barbershop_id', barbershop.id)
    .eq('is_active', true)

  return { appointments: appointments || [], services: services || [] }
}

export default async function AppointmentsPage() {
  const { appointments, services } = await getData()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie seus agendamentos e horários.
          </p>
        </div>
        <CreateAppointmentDialog services={services} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Agendamentos</CardTitle>
          <CardDescription>Lista de clientes agendados.</CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentList appointments={appointments} />
        </CardContent>
      </Card>
    </div>
  )
}
