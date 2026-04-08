import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getBarbers } from '@/app/barbers/actions'
import { BarberList } from './barber-list'

export default async function BarbersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) redirect('/setup/wizard')

  const barbers = await getBarbers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
        <p className="text-muted-foreground">
          Gerencie os barbeiros da sua barbearia.
        </p>
      </div>

      <BarberList barbers={barbers} />
    </div>
  )
}
