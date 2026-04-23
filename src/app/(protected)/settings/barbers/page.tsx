import { getBarbers } from '@/app/barbers/actions'
import { BarberList } from './barber-list'

export default async function BarbersPage() {
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
