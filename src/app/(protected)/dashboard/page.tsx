import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, DollarSign, Users, Clock } from 'lucide-react'

async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get barbershop
  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) {
    redirect('/setup/wizard')
  }

  // Get stats
  const today = new Date().toISOString().split('T')[0]
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  // Appointments today
  const { count: appointmentsToday } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('barbershop_id', barbershop.id)
    .gte('appointment_date', `${today}T00:00:00`)
    .lte('appointment_date', `${today}T23:59:59`)

  // Revenue this month (using appointments for now, should ideally be from financial_records or paid appointments)
  const { data: monthlyAppointments } = await supabase
    .from('appointments')
    .select('total_amount')
    .eq('barbershop_id', barbershop.id)
    .eq('payment_status', 'paid')
    .gte('appointment_date', firstDayOfMonth)

  const revenue = monthlyAppointments?.reduce((acc, curr) => acc + curr.total_amount, 0) || 0

  // Recent appointments
  const { data: recentAppointments } = await supabase
    .from('appointments')
    .select('*, services(name, price)')
    .eq('barbershop_id', barbershop.id)
    .order('appointment_date', { ascending: true })
    .gte('appointment_date', new Date().toISOString())
    .limit(5)

  return {
    barbershop,
    stats: {
      appointmentsToday: appointmentsToday || 0,
      revenue,
      activeServices: 0, // Placeholder
    },
    recentAppointments: recentAppointments || []
  }
}

export default async function DashboardPage() {
  const { barbershop, stats, recentAppointments } = await getDashboardData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo à {barbershop.name}. Aqui está o resumo do seu dia.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appointmentsToday}</div>
            <p className="text-xs text-muted-foreground">
              Para hoje
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>
        {/* Placeholders for other stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              +0% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Trabalhadas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Appointments */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum agendamento próximo.</p>
            ) : (
              <div className="space-y-4">
                {recentAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{apt.client_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {/* @ts-ignore - Supabase types join issue, verify later */}
                        {apt.services?.name} • {new Date(apt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        apt.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {apt.status === 'scheduled' ? 'Agendado' : 
                         apt.status === 'confirmed' ? 'Confirmado' : apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Placeholder for Quick Actions or other widgets */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
             <p className="text-sm text-muted-foreground">Em breve: Agendar novo cliente, Registrar despesa, etc.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
