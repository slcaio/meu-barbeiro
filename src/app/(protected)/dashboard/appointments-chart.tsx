'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface AppointmentsChartProps {
  data: Array<{
    name: string
    total: number
  }>
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-sm font-medium text-card-foreground">{label}</p>
      <p className="text-xs" style={{ color: payload[0].color }}>
        {payload[0].value} agendamento{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

export function AppointmentsChart({ data }: AppointmentsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Agendamentos por Dia</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} 
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent)', opacity: 0.5 }} />
              <Bar 
                dataKey="total" 
                name="Agendamentos" 
                fill="var(--chart-2)" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
