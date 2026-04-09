---
name: recharts
description: >
  Criar gráficos e visualizações de dados com Recharts em React/Next.js.
  Use esta skill quando o usuário quiser: criar gráficos de barras, linhas, áreas, pizza, radar, funil,
  scatter, treemap ou radial; customizar cores, tooltips, legendas, eixos, grids e labels dos gráficos;
  tornar gráficos responsivos; compor múltiplos gráficos; formatar dados para Recharts; animar transições;
  criar dashboards com visualizações; estilizar gráficos com Tailwind ou tema escuro.
  Também dispare quando o usuário mencionar "gráfico", "chart", "dashboard visual", "visualização de dados",
  "BarChart", "LineChart", "PieChart", "AreaChart", "Tooltip", "ResponsiveContainer", "recharts"
  ou qualquer termo de gráficos junto com React ou Next.js.
---

# Recharts — Guia Completo

Biblioteca de gráficos composable para React, construída sobre componentes SVG com API declarativa.

---

## 1. Instalação

```bash
npm install recharts
```

> Recharts tem `react` e `react-dom` como peer dependencies (já presentes no projeto).

---

## 2. Conceitos Fundamentais

### 2.1 Composição Declarativa

Recharts usa **composição de componentes** — cada parte do gráfico (eixos, tooltips, legendas, séries) é um componente React independente:

```tsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const data = [
  { name: 'Jan', receita: 4000, despesa: 2400 },
  { name: 'Fev', receita: 3000, despesa: 1398 },
  { name: 'Mar', receita: 2000, despesa: 9800 },
]

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="receita" fill="#8884d8" />
        <Bar dataKey="despesa" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

### 2.2 Estrutura de Dados

Recharts espera um **array de objetos** onde cada objeto é um ponto de dado:

```ts
// Formato básico
const data = [
  { name: 'Jan', valor: 400 },
  { name: 'Fev', valor: 300 },
]

// Múltiplas séries
const data = [
  { mes: 'Jan', corte: 45, barba: 30, combo: 20 },
  { mes: 'Fev', corte: 50, barba: 25, combo: 35 },
]

// Com dados aninhados (para Scatter, etc.)
const data = [
  { x: 100, y: 200, z: 300 },
  { x: 120, y: 100, z: 250 },
]
```

### 2.3 ResponsiveContainer (OBRIGATÓRIO)

**Sempre** envolva o gráfico com `ResponsiveContainer` para responsividade. Sem ele, o gráfico exige largura/altura fixas:

```tsx
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    {/* ... */}
  </BarChart>
</ResponsiveContainer>
```

> **Importante**: O elemento pai do `ResponsiveContainer` DEVE ter largura e altura definidas. Use `min-h-[300px]` ou `h-[350px]` no container pai com Tailwind.

---

## 3. Tipos de Gráficos

### 3.1 BarChart (Barras)

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Barras agrupadas (padrão)
<BarChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="corte" fill="#8884d8" />
  <Bar dataKey="barba" fill="#82ca9d" />
</BarChart>

// Barras empilhadas
<BarChart data={data}>
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="corte" stackId="a" fill="#8884d8" />
  <Bar dataKey="barba" stackId="a" fill="#82ca9d" />
</BarChart>

// Barras horizontais
<BarChart data={data} layout="vertical">
  <XAxis type="number" />
  <YAxis dataKey="name" type="category" />
  <Bar dataKey="valor" fill="#8884d8" />
</BarChart>
```

**Props principais do `<Bar>`**:

| Prop | Tipo | Descrição |
|------|------|-----------|
| `dataKey` | `string` | Chave do dado no objeto |
| `fill` | `string` | Cor de preenchimento |
| `stackId` | `string` | Agrupar barras empilhadas |
| `radius` | `[number, number, number, number]` | Borda arredondada `[topLeft, topRight, bottomRight, bottomLeft]` |
| `barSize` | `number` | Largura da barra em px |
| `maxBarSize` | `number` | Largura máxima |
| `label` | `boolean \| object \| ReactElement` | Label dentro/acima da barra |
| `activeBar` | `object \| ReactElement` | Estilo da barra ativa (hover) |

### 3.2 LineChart (Linhas)

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

<LineChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="receita" stroke="#8884d8" strokeWidth={2} />
  <Line type="monotone" dataKey="despesa" stroke="#82ca9d" strokeWidth={2} />
</LineChart>
```

**Props principais do `<Line>`**:

| Prop | Tipo | Descrição |
|------|------|-----------|
| `type` | `string` | Tipo da curva: `monotone`, `linear`, `basis`, `step`, `stepBefore`, `stepAfter`, `natural` |
| `dataKey` | `string` | Chave do dado |
| `stroke` | `string` | Cor da linha |
| `strokeWidth` | `number` | Espessura da linha |
| `strokeDasharray` | `string` | Linha tracejada: `"5 5"` |
| `dot` | `boolean \| object \| ReactElement` | Pontos nos dados |
| `activeDot` | `object \| ReactElement` | Ponto ativo (hover) |
| `connectNulls` | `boolean` | Conectar gaps de dados `null` |

### 3.3 AreaChart (Área)

```tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

<AreaChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Area type="monotone" dataKey="valor" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
</AreaChart>

// Áreas empilhadas
<AreaChart data={data}>
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Area type="monotone" dataKey="corte" stackId="1" stroke="#8884d8" fill="#8884d8" />
  <Area type="monotone" dataKey="barba" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
</AreaChart>
```

**Props adicionais do `<Area>`**:

| Prop | Tipo | Descrição |
|------|------|-----------|
| `fill` | `string` | Cor do preenchimento |
| `fillOpacity` | `number` | Opacidade: `0` a `1` |
| `baseValue` | `number \| 'dataMin' \| 'dataMax'` | Valor base da área |

### 3.4 PieChart (Pizza / Rosca)

```tsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Corte', value: 400 },
  { name: 'Barba', value: 300 },
  { name: 'Combo', value: 200 },
  { name: 'Outros', value: 100 },
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

// Pizza
<PieChart>
  <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
    {data.map((_, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
  <Tooltip />
  <Legend />
</PieChart>

// Rosca (Donut)
<PieChart>
  <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5}>
    {data.map((_, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
  <Tooltip />
</PieChart>
```

**Props principais do `<Pie>`**:

| Prop | Tipo | Descrição |
|------|------|-----------|
| `dataKey` | `string` | Chave do valor |
| `cx`, `cy` | `string \| number` | Centro: `"50%"` ou `150` |
| `innerRadius` | `number` | Raio interno (0 = pizza cheia, >0 = rosca) |
| `outerRadius` | `number` | Raio externo |
| `paddingAngle` | `number` | Espaço entre fatias |
| `startAngle`, `endAngle` | `number` | Ângulo de início/fim |
| `label` | `boolean \| function \| ReactElement` | Labels nas fatias |

### 3.5 RadarChart (Radar)

```tsx
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'

const data = [
  { skill: 'Corte', A: 120, B: 110 },
  { skill: 'Barba', A: 98, B: 130 },
  { skill: 'Coloração', A: 86, B: 130 },
  { skill: 'Alisamento', A: 99, B: 100 },
  { skill: 'Hidratação', A: 85, B: 90 },
]

<RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
  <PolarGrid />
  <PolarAngleAxis dataKey="skill" />
  <PolarRadiusAxis />
  <Radar name="Barbeiro A" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
  <Radar name="Barbeiro B" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
</RadarChart>
```

### 3.6 RadialBarChart (Barras Radiais)

```tsx
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Corte', value: 80, fill: '#8884d8' },
  { name: 'Barba', value: 60, fill: '#83a6ed' },
  { name: 'Combo', value: 45, fill: '#8dd1e1' },
]

<RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={10} data={data}>
  <RadialBar minAngle={15} background clockWise dataKey="value" />
  <Legend />
</RadialBarChart>
```

### 3.7 ComposedChart (Gráfico Composto)

Combina barras, linhas e áreas no mesmo gráfico:

```tsx
import { ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

<ComposedChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Area type="monotone" dataKey="meta" fill="#8884d8" stroke="#8884d8" fillOpacity={0.15} />
  <Bar dataKey="realizado" fill="#82ca9d" />
  <Line type="monotone" dataKey="media" stroke="#ff7300" />
</ComposedChart>
```

### 3.8 ScatterChart (Dispersão)

```tsx
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

<ScatterChart>
  <CartesianGrid />
  <XAxis type="number" dataKey="duracao" name="Duração (min)" />
  <YAxis type="number" dataKey="preco" name="Preço (R$)" />
  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
  <Scatter name="Serviços" data={data} fill="#8884d8" />
</ScatterChart>
```

### 3.9 FunnelChart (Funil)

```tsx
import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Visitas', value: 400, fill: '#8884d8' },
  { name: 'Agendamentos', value: 300, fill: '#83a6ed' },
  { name: 'Confirmados', value: 200, fill: '#8dd1e1' },
  { name: 'Concluídos', value: 150, fill: '#82ca9d' },
]

<FunnelChart>
  <Tooltip />
  <Funnel dataKey="value" data={data} isAnimationActive>
    <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
  </Funnel>
</FunnelChart>
```

### 3.10 Treemap

```tsx
import { Treemap, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Cortes', size: 400, children: [
    { name: 'Degradê', size: 200 },
    { name: 'Social', size: 120 },
    { name: 'Navalhado', size: 80 },
  ]},
  { name: 'Barba', size: 250 },
]

<Treemap data={data} dataKey="size" aspectRatio={4 / 3} stroke="#fff" fill="#8884d8" />
```

---

## 4. Componentes de Suporte

### 4.1 XAxis / YAxis

```tsx
<XAxis
  dataKey="name"               // Chave dos dados
  type="category"              // "category" | "number"
  tick={{ fontSize: 12 }}      // Estilo dos ticks
  tickFormatter={(v) => `R$${v}`} // Formatar valores
  angle={-45}                  // Rotação dos labels
  textAnchor="end"             // Âncora do texto rotacionado
  interval={0}                 // Mostrar todos os ticks (0) ou auto ("preserveStartEnd")
  hide={false}                 // Esconder eixo
  axisLine={false}             // Remover linha do eixo
  tickLine={false}             // Remover tick marks
  stroke="#888888"             // Cor do eixo
  padding={{ left: 10, right: 10 }} // Padding interno
/>

<YAxis
  tickFormatter={(v) => `R$ ${v.toLocaleString('pt-BR')}`}
  width={80}                   // Largura reservada para labels
  domain={[0, 'dataMax + 100']} // Domínio: [min, max]
  allowDecimals={false}
/>
```

### 4.2 CartesianGrid

```tsx
<CartesianGrid
  strokeDasharray="3 3"       // Linha tracejada
  stroke="#e0e0e0"             // Cor da grade
  horizontal={true}            // Linhas horizontais
  vertical={false}             // Sem linhas verticais
/>
```

### 4.3 Tooltip

```tsx
// Tooltip padrão
<Tooltip />

// Tooltip customizado
<Tooltip
  formatter={(value: number, name: string) => [`R$ ${value.toFixed(2)}`, name]}
  labelFormatter={(label) => `Mês: ${label}`}
  contentStyle={{
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '14px',
  }}
  labelStyle={{ fontWeight: 'bold' }}
  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
  wrapperStyle={{ zIndex: 100 }}
/>

// Tooltip totalmente custom via componente
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md">
      <p className="font-semibold">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: R$ {entry.value.toFixed(2)}
        </p>
      ))}
    </div>
  )
}

<Tooltip content={<CustomTooltip />} />
```

### 4.4 Legend

```tsx
<Legend
  verticalAlign="top"          // "top" | "middle" | "bottom"
  align="right"                // "left" | "center" | "right"
  iconType="circle"            // "line" | "square" | "rect" | "circle" | "cross" | "diamond" | "star" | "triangle" | "wye"
  iconSize={10}
  wrapperStyle={{ paddingTop: 10 }}
  formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
/>
```

### 4.5 ReferenceLine / ReferenceArea / ReferenceDot

```tsx
import { ReferenceLine, ReferenceArea, ReferenceDot } from 'recharts'

// Linha de referência (meta, média, etc.)
<ReferenceLine y={5000} stroke="red" strokeDasharray="3 3" label="Meta" />
<ReferenceLine x="Mar" stroke="blue" />

// Área destacada
<ReferenceArea x1="Fev" x2="Abr" y1={0} y2={8000} stroke="red" strokeOpacity={0.3} fill="red" fillOpacity={0.1} />

// Ponto de referência
<ReferenceDot x="Mar" y={5000} r={5} fill="red" stroke="none" />
```

### 4.6 Brush (Seleção de Faixa)

```tsx
import { Brush } from 'recharts'

// Permite o usuário selecionar uma faixa de dados (zoom)
<Brush dataKey="name" height={30} stroke="#8884d8" />
```

### 4.7 Label / LabelList

```tsx
import { LabelList } from 'recharts'

<Bar dataKey="valor" fill="#8884d8">
  <LabelList dataKey="valor" position="top" formatter={(v: number) => `R$${v}`} />
</Bar>

// Posições: "top" | "bottom" | "left" | "right" | "center" | "inside" | "outside"
//           "insideLeft" | "insideRight" | "insideTop" | "insideBottom"
```

---

## 5. Customização Avançada

### 5.1 Cores com CSS Variables (Shadcn/Tailwind)

Integração com o sistema de cores do Shadcn/ui:

```tsx
// Definir cores via CSS custom properties
const chartColors = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted))',
  destructive: 'hsl(var(--destructive))',
}

// Paleta de cores para séries de dados
const CHART_PALETTE = [
  'hsl(var(--chart-1, 220 70% 50%))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
]
```

Para definir variáveis de cor no CSS (compatível com tema claro/escuro):

```css
/* globals.css */
@layer base {
  :root {
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
  .dark {
    --chart-1: 220 70% 70%;
    --chart-2: 160 60% 65%;
    --chart-3: 30 80% 65%;
    --chart-4: 280 65% 70%;
    --chart-5: 340 75% 65%;
  }
}
```

### 5.2 Gradientes

```tsx
<defs>
  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
  </linearGradient>
  <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
  </linearGradient>
</defs>
<Area dataKey="receita" stroke="#8884d8" fill="url(#colorReceita)" />
<Area dataKey="despesa" stroke="#82ca9d" fill="url(#colorDespesa)" />
```

### 5.3 Formatação de Datas no Eixo X

```tsx
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const data = [
  { date: '2026-01-01', valor: 400 },
  { date: '2026-02-01', valor: 300 },
]

<XAxis
  dataKey="date"
  tickFormatter={(value) => format(parseISO(value), 'MMM/yy', { locale: ptBR })}
/>
```

### 5.4 Formatação de Moeda (BRL)

```tsx
const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

<YAxis tickFormatter={formatBRL} />
<Tooltip formatter={(value: number) => [formatBRL(value), 'Receita']} />
```

### 5.5 Barras com Cantos Arredondados

```tsx
<Bar dataKey="valor" fill="#8884d8" radius={[4, 4, 0, 0]} />
```

### 5.6 Animações

```tsx
// Controlar animação
<Bar
  dataKey="valor"
  fill="#8884d8"
  isAnimationActive={true}       // Habilitar/desabilitar
  animationBegin={0}             // Delay em ms
  animationDuration={1500}       // Duração em ms
  animationEasing="ease-in-out"  // "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear"
/>

// Desabilitar animação para SSR ou testes
<Bar dataKey="valor" isAnimationActive={false} />
```

### 5.7 Shapes Customizados

```tsx
// Barra com shape custom
const CustomBar = (props: any) => {
  const { x, y, width, height, fill } = props
  return (
    <rect x={x} y={y} width={width} height={height} fill={fill} rx={8} ry={8} />
  )
}

<Bar dataKey="valor" shape={<CustomBar />} />

// Dot custom para LineChart
const CustomDot = (props: any) => {
  const { cx, cy, value } = props
  if (value > 1000) {
    return <circle cx={cx} cy={cy} r={6} fill="red" stroke="none" />
  }
  return <circle cx={cx} cy={cy} r={4} fill="#8884d8" stroke="none" />
}

<Line dataKey="valor" dot={<CustomDot />} />
```

### 5.8 Múltiplos Eixos Y

```tsx
<YAxis yAxisId="left" tickFormatter={(v) => `R$${v}`} />
<YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} />

<Bar yAxisId="left" dataKey="receita" fill="#8884d8" />
<Line yAxisId="right" dataKey="crescimento" stroke="#ff7300" />
```

### 5.9 Label Customizado no PieChart

```tsx
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

<Pie data={data} dataKey="value" label={renderCustomLabel} labelLine={false} />
```

---

## 6. Padrões para o Projeto (Next.js + Shadcn/ui)

### 6.1 Componente de Gráfico Reutilizável

```tsx
'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'

interface ChartData {
  label: string
  value: number
}

interface SimpleBarChartProps {
  title: string
  description?: string
  data: ChartData[]
  color?: string
  valueFormatter?: (value: number) => string
}

export function SimpleBarChart({
  title,
  description,
  data,
  color = 'hsl(var(--primary))',
  valueFormatter = (v) => v.toLocaleString('pt-BR'),
}: SimpleBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                tickFormatter={valueFormatter}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                width={80}
              />
              <Tooltip
                formatter={(value: number) => [valueFormatter(value)]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--popover-foreground))',
                }}
              />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 6.2 Uso com Server Components + Client Boundary

Gráficos Recharts precisam de `'use client'` pois dependem de DOM/SVG:

```tsx
// app/(protected)/dashboard/page.tsx (Server Component)
import { getMonthlyRevenue } from '@/src/app/financial/actions'
import { RevenueChart } from './revenue-chart'

export default async function DashboardPage() {
  const revenue = await getMonthlyRevenue()
  return <RevenueChart data={revenue} />
}

// app/(protected)/dashboard/revenue-chart.tsx (Client Component)
'use client'

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'

export function RevenueChart({ data }: { data: { mes: string; valor: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <XAxis dataKey="mes" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="valor" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
```

### 6.3 Estado Vazio

```tsx
export function ChartEmpty({ message = 'Sem dados para exibir' }: { message?: string }) {
  return (
    <div className="flex h-[350px] items-center justify-center text-muted-foreground">
      <p>{message}</p>
    </div>
  )
}

// Uso
export function RevenueChart({ data }: { data: DataPoint[] }) {
  if (!data.length) return <ChartEmpty message="Nenhuma receita registrada" />

  return (
    <ResponsiveContainer width="100%" height={350}>
      {/* ... */}
    </ResponsiveContainer>
  )
}
```

---

## 7. Dicas e Cuidados

### ❌ Erros Comuns

1. **Gráfico não aparece**: Faltou `ResponsiveContainer` ou o pai não tem altura definida
2. **Gráfico com tamanho 0x0**: O container pai precisa de `width` e `height` — adicione `h-[300px]` ao wrapper
3. **SSR Error**: Recharts precisa de `'use client'` — não renderiza em Server Components
4. **Tipo errado no eixo**: Quando usar dados numéricos no XAxis, defina `type="number"`
5. **Labels cortados**: Aumente `margin` do chart: `<BarChart margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>`
6. **Tooltip z-index**: Adicione `wrapperStyle={{ zIndex: 100 }}` no Tooltip

### ✅ Boas Práticas

1. **Sempre** use `ResponsiveContainer` com `width="100%"` e `height` numérico ou `"100%"` (com pai dimensionado)
2. **Sempre** adicione `'use client'` no topo de componentes com Recharts
3. Formate valores monetários com `toLocaleString('pt-BR')` ou `Intl.NumberFormat`
4. Use `CartesianGrid strokeDasharray="3 3"` para grades sutis
5. Use `tickLine={false}` e `axisLine={false}` para visual limpo (estilo Shadcn)
6. Defina `margin` no gráfico para evitar cortes: `margin={{ top: 5, right: 30, left: 20, bottom: 5 }}`
7. Para gráficos com muitos dados (>50 pontos), desabilite animação: `isAnimationActive={false}`
8. Para testes, desabilite animação para evitar flakiness

### 📐 Margins do Chart Container

```tsx
<BarChart
  data={data}
  margin={{
    top: 5,     // Espaço para labels acima das barras
    right: 30,  // Espaço direito
    left: 20,   // Espaço para YAxis labels
    bottom: 5,  // Espaço para XAxis labels
  }}
>
```

---

## 8. Referência Rápida de Imports

```tsx
// Gráficos
import {
  BarChart, LineChart, AreaChart, PieChart, RadarChart,
  ScatterChart, ComposedChart, RadialBarChart, FunnelChart, Treemap,
} from 'recharts'

// Séries de dados
import { Bar, Line, Area, Pie, Radar, Scatter, Funnel, RadialBar } from 'recharts'

// Eixos e grades
import { XAxis, YAxis, CartesianGrid, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'

// Utilitários
import {
  Tooltip, Legend, ResponsiveContainer, Cell, Brush,
  ReferenceLine, ReferenceArea, ReferenceDot, LabelList,
} from 'recharts'
```
