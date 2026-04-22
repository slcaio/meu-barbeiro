import { getAppointmentsPageData } from '@/app/appointments/actions'
import { AppointmentsCalendarView } from './appointments-calendar-view'

export default async function AppointmentsPage() {
  const { appointments, services, clients, barbers, paymentMethods, products } = await getAppointmentsPageData()

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
        products={products}
      />
    </div>
  )
}
