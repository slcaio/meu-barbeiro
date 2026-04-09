import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, DollarSign, Clock, Scissors } from 'lucide-react'
import { KpiCard } from './kpi-card'

const RevenueChart = dynamic(() =>
  import('./revenue-chart').then((mod) => mod.RevenueChart)
)
const AppointmentsChart = dynamic(() =>
  import('./appointments-chart').then((mod) => mod.AppointmentsChart)
)
const QuickActions = dynamic(() =>
  import('./quick-actions').then((mod) => mod.QuickActions)
)

// --- Skeleton Components ---

function KpiSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-24 animate-pulse bg-muted rounded" />
                <div className="h-8 w-32 animate-pulse bg-muted rounded" />
              </div>
              <div className="h-12 w-12 animate-pulse bg-muted rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-40 animate-pulse bg-muted rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] animate-pulse bg-muted rounded-lg" />
      </CardContent>
    </Card>
  )
}

function RecentAppointmentsSkeleton() {
  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <div className="h-5 w-48 animate-pulse bg-muted rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="space-y-1.5">
                <div className="h-4 w-32 animate-pulse bg-muted rounded" />
                <div className="h-3 w-48 animate-pulse bg-muted rounded" />
              </div>
              <div className="h-6 w-20 animate-pulse bg-muted rounded-md" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActionsSkeleton() {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <div className="h-5 w-32 animate-pulse bg-muted rounded" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse bg-muted rounded-md" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// --- Data Fetching ---

async function getBarbershop() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) redirect('/setup/wizard')
  return barbershop
}

// --- Async Section Components ---

async function KpiSection({ barbershopId }: { barbershopId: string }) {
  const supabase = await createClient()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString()
  const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).toISOString()

  const [
    { count: appointmentsToday },
    { data: monthlyAppointments },
    { data: lastMonthAppointments },
    { count: activeBarbers },
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('barbershop_id', barbershopId)
      .gte('appointment_date', `${todayStr}T00:00:00`)
      .lte('appointment_date', `${todayStr}T23:59:59`),
    supabase
      .from('appointments')
      .select('total_amount')
      .eq('barbershop_id', barbershopId)
      .eq('payment_status', 'paid')
      .gte('appointment_date', firstDayOfMonth),
    supabase
      .from('appointments')
      .select('total_amount')
      .eq('barbershop_id', barbershopId)
      .eq('payment_status', 'paid')
      .gte('appointment_date', firstDayOfLastMonth)
      .lte('appointment_date', lastDayOfLastMonth),
    supabase
      .from('barbers')
      .select('*', { count: 'exact', head: true })
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true),
  ])

  const revenue = monthlyAppointments?.reduce((acc, curr) => acc + curr.total_amount, 0) || 0
  const lastMonthRevenue = lastMonthAppointments?.reduce((acc, curr) => acc + curr.total_amount, 0) || 0
  const revenueTrend = lastMonthRevenue > 0
    ? Math.round(((revenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : revenue > 0 ? 100 : 0

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Agendamentos Hoje"
        value={String(appointmentsToday || 0)}
        icon={Calendar}
        iconColor="text-blue-500"
      />
      <KpiCard
        title="Receita Mensal"
        value={formatCurrency(revenue)}
        icon={DollarSign}
        iconColor="text-emerald-500"
        trend={revenueTrend !== 0 ? { value: revenueTrend, label: 'vs mês anterior' } : undefined}
      />
      <KpiCard
        title="Barbeiros Ativos"
        value={String(activeBarbers || 0)}
        icon={Scissors}
        iconColor="text-purple-500"
      />
      <KpiCard
        title="Horas Trabalhadas"
        value="--"
        icon={Clock}
        iconColor="text-amber-500"
      />
    </div>
  )
}

async function RevenueChartSection({ barbershopId }: { barbershopId: string }) {
  const supabase = await createClient()
  const today = new Date()
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1)

  const { data: records } = await supabase
    .from('financial_records')
    .select('amount, type, record_date')
    .eq('barbershop_id', barbershopId)
    .gte('record_date', sixMonthsAgo.toISOString().split('T')[0])

  const monthMap = new Map<string, { receita: number; despesa: number }>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthMap.set(key, { receita: 0, despesa: 0 })
  }

  records?.forEach((r) => {
    const date = new Date(r.record_date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const entry = monthMap.get(key)
    if (entry) {
      if (r.type === 'income') entry.receita += r.amount
      else entry.despesa += r.amount
    }
  })

  const revenueChartData = Array.from(monthMap.entries()).map(([key, values]) => {
    const [year, month] = key.split('-')
    const d = new Date(Number(year), Number(month) - 1)
    const name = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
    return { name: name.charAt(0).toUpperCase() + name.slice(1), ...values }
  })

  return <RevenueChart data={revenueChartData} />
}

async function AppointmentsChartSection({ barbershopId }: { barbershopId: string }) {
  const supabase = await createClient()
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  const startStr = startOfWeek.toISOString().split('T')[0]
  const endStr = endOfWeek.toISOString().split('T')[0]

  const { data: weekAppointments } = await supabase
    .from('appointments')
    .select('appointment_date')
    .eq('barbershop_id', barbershopId)
    .gte('appointment_date', `${startStr}T00:00:00`)
    .lte('appointment_date', `${endStr}T23:59:59`)

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const dayCounts = new Array(7).fill(0)
  weekAppointments?.forEach((apt) => {
    const day = new Date(apt.appointment_date).getDay()
    dayCounts[day]++
  })

  const appointmentsChartData = dayNames.map((name, i) => ({ name, total: dayCounts[i] }))

  return <AppointmentsChart data={appointmentsChartData} />
}

async function RecentAppointmentsSection({ barbershopId }: { barbershopId: string }) {
  const supabase = await createClient()
  const { data: recentAppointments } = await supabase
    .from('appointments')
    .select('*, services(name, price), barbers(name)')
    .eq('barbershop_id', barbershopId)
    .order('appointment_date', { ascending: true })
    .gte('appointment_date', new Date().toISOString())
    .limit(5)

  const appointments = recentAppointments || []

  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Próximos Agendamentos</CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhum agendamento próximo.</p>
        ) : (
          <div className="space-y-0 divide-y divide-border">
            {appointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium leading-none">{apt.client_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {apt.services?.name}{apt.barbers?.name ? ` • ${apt.barbers.name}` : ''} • {new Date(apt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                  apt.status === 'confirmed' 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : apt.status === 'scheduled' 
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {apt.status === 'scheduled' ? 'Agendado' : 
                   apt.status === 'confirmed' ? 'Confirmado' : apt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

async function QuickActionsSection({ barbershopId }: { barbershopId: string }) {
  const supabase = await createClient()

  const [
    { data: services },
    { data: clients },
    { data: barbers },
    { data: categories },
  ] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, price, duration_minutes')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true),
    supabase
      .from('clients')
      .select('id, name, phone, email')
      .eq('barbershop_id', barbershopId)
      .order('name'),
    supabase
      .from('barbers')
      .select('id, name, is_active')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('categories')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .order('name'),
  ])

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <QuickActions
          services={services || []}
          clients={clients || []}
          barbers={barbers || []}
          categories={categories || []}
        />
      </CardContent>
    </Card>
  )
}

// --- Main Page ---

export default async function DashboardPage() {
  const barbershop = await getBarbershop()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo à {barbershop.name}. Aqui está o resumo do seu dia.
        </p>
      </div>

      <Suspense fallback={<KpiSkeleton />}>
        <KpiSection barbershopId={barbershop.id} />
      </Suspense>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChartSection barbershopId={barbershop.id} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <AppointmentsChartSection barbershopId={barbershop.id} />
        </Suspense>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Suspense fallback={<RecentAppointmentsSkeleton />}>
          <RecentAppointmentsSection barbershopId={barbershop.id} />
        </Suspense>
        <Suspense fallback={<QuickActionsSkeleton />}>
          <QuickActionsSection barbershopId={barbershop.id} />
        </Suspense>
      </div>
    </div>
  )
}
