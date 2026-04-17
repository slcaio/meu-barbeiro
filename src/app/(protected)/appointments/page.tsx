import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppointmentsCalendarView } from './appointments-calendar-view'

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

  // Get appointments with service and barber joins
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, appointment_services(service_id, price_at_time, services(id, name, duration_minutes, price)), barbers(id, name)')
    .eq('barbershop_id', barbershop.id)
    .order('appointment_date', { ascending: true })

  // Get services for dropdown
  const { data: services } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes')
    .eq('barbershop_id', barbershop.id)
    .eq('is_active', true)

  // Get clients for dropdown
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, phone, email')
    .eq('barbershop_id', barbershop.id)
    .order('name')

  // Get active barbers for dropdown
  const { data: barbers } = await supabase
    .from('barbers')
    .select('id, name, is_active')
    .eq('barbershop_id', barbershop.id)
    .eq('is_active', true)
    .order('name')

  // Get active payment methods for POS dialog (with installment tiers)
  const { data: paymentMethods } = await supabase
    .from('payment_methods')
    .select('id, name, fee_type, fee_value, supports_installments, payment_method_installments(installment_number, fee_percentage)')
    .eq('barbershop_id', barbershop.id)
    .eq('is_active', true)
    .order('name')

  return { 
    appointments: appointments || [], 
    services: services || [], 
    clients: clients || [],
    barbers: barbers || [],
    paymentMethods: paymentMethods || [],
  }
}

export default async function AppointmentsPage() {
  const { appointments, services, clients, barbers, paymentMethods } = await getData()

  return (
    <div className="space-y-6 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie seus agendamentos e horários.
          </p>
        </div>
      </div>

      <AppointmentsCalendarView 
        appointments={appointments} 
        services={services} 
        clients={clients}
        barbers={barbers}
        paymentMethods={paymentMethods}
      />
    </div>
  )
}
