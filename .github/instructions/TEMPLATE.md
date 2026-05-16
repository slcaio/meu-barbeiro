# Design System — Meu Barbeiro

Referência visual para manter a consistência ao criar novos módulos e páginas.
Inspirado no DashDarkX (Material UI), adaptado para Tailwind CSS + Shadcn/ui.

---

## Paleta de Cores

### Light Mode
| Variável | Valor | Uso |
|----------|-------|-----|
| `--background` | `#f8fafc` | Fundo da página |
| `--card` | `#ffffff` | Cards, containers |
| `--primary` | `#2563eb` | Botões, links, destaques (Blue-600) |
| `--primary-foreground` | `#ffffff` | Texto sobre primary |
| `--secondary` | `#f1f5f9` | Botões secondary, fundos suaves |
| `--muted` | `#f1f5f9` | Fundos neutros |
| `--muted-foreground` | `#64748b` | Texto secundário (Slate-500) |
| `--accent` | `#eff6ff` | Hover states, linhas ativas |
| `--destructive` | `#ef4444` | Erros, ações destrutivas |
| `--border` | `#e2e8f0` | Bordas, divisores |

### Dark Mode
| Variável | Valor | Uso |
|----------|-------|-----|
| `--background` | `#0a1628` | Fundo navy profundo |
| `--card` | `#111d35` | Cards elevados |
| `--primary` | `#3b82f6` | Botões, links (Blue-500) |
| `--secondary` | `#1a2844` | Fundos elevados |
| `--muted` | `#1a2844` | Fundos neutros |
| `--muted-foreground` | `#94a3b8` | Texto secundário |
| `--accent` | `#1e3a5f` | Hover, seleção ativa |
| `--border` | `rgba(255,255,255,0.08)` | Bordas sutis |
| `--sidebar` | `#0d1a30` | Fundo do sidebar (mais profundo que background) |

### Cores de Status
| Cor | Classe Tailwind | Uso |
|-----|-----------------|-----|
| Emerald | `text-emerald-500`, `bg-emerald-500/10` | Sucesso, receitas, positivo |
| Red | `text-red-500`, `bg-red-500/10` | Erro, despesas, negativo |
| Blue | `text-blue-500`, `bg-blue-500/10` | Info, agendamentos, primary |
| Amber | `text-amber-500`, `bg-amber-500/10` | Alertas, pendente |
| Purple | `text-purple-500`, `bg-purple-500/10` | Barbeiros, clientes |
| Cyan | `text-cyan-500`, `bg-cyan-500/10` | Secundário, negócio |

### Cores de Gráficos
| Variável | Light | Dark | Uso |
|----------|-------|------|-----|
| `--chart-1` | `#2563eb` | `#3b82f6` | Série principal (azul) |
| `--chart-2` | `#06b6d4` | `#22d3ee` | Série secundária (cyan) |
| `--chart-3` | `#10b981` | `#34d399` | Receita (verde) |
| `--chart-4` | `#f59e0b` | `#fbbf24` | Alerta (amarelo) |
| `--chart-5` | `#ef4444` | `#f87171` | Despesa (vermelho) |

---

## Tipografia

- **Fonte principal**: Geist Sans (via `next/font/google`)
- **Fonte mono**: Geist Mono
- **Hierarquia de títulos**:
  - Página: `text-2xl sm:text-3xl font-bold tracking-tight`
  - Card título: `text-base font-semibold`
  - KPI valor: `text-2xl font-bold tracking-tight`
  - Label/caption: `text-sm font-medium text-muted-foreground`
  - Body: `text-sm` (14px padrão)
  - Caption pequeno: `text-xs` (12px)

---

## Componentes Padrão

### KPI Card
```tsx
<Card className="relative overflow-hidden">
  <CardContent className="p-5">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{título}</p>
        <p className="text-2xl font-bold tracking-tight">{valor}</p>
        {/* Rate chip opcional */}
        <span className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="h-3 w-3" /> +12%
        </span>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-{cor}-500/10">
        <Icon className="h-6 w-6 text-{cor}-500" />
      </div>
    </div>
  </CardContent>
</Card>
```

### Status Badge
```tsx
<span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
  Confirmado
</span>
```
Variações: `emerald` (confirmado), `blue` (agendado), `red` (cancelado), `amber` (pendente)

### Summary Card (Financeiro)
```tsx
<Card className="relative overflow-hidden">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">{título}</CardTitle>
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-{cor}-500/10">
      <Icon className="h-5 w-5 text-{cor}-500" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-xl sm:text-2xl font-bold text-{cor}-600 dark:text-{cor}-400">
      {valor}
    </div>
  </CardContent>
</Card>
```

### Settings Module Card
```tsx
<Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer group">
  <CardHeader>
    <div className="flex items-center space-x-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-{cor}-500/10">
        <Icon className="h-5 w-5 text-{cor}-500" />
      </div>
      <CardTitle className="text-base group-hover:text-primary transition-colors">{título}</CardTitle>
    </div>
    <CardDescription className="pl-[52px]">{descrição}</CardDescription>
  </CardHeader>
</Card>
```

---

## Layout

### Sidebar
- Largura: `w-[280px]`
- Background: `bg-sidebar` (mais profundo que page background)
- Borda: `border-r border-sidebar-border`
- Logo: ícone em `rounded-lg bg-primary` + texto `text-lg font-bold`
- Nav item ativo: `bg-sidebar-accent text-sidebar-primary shadow-sm` + dot indicator
- Nav item inativo: `text-sidebar-foreground/60 hover:bg-sidebar-accent/50`
- Mobile: drawer com backdrop `bg-black/50 backdrop-blur-sm`

### Page Header
- Título: `text-2xl sm:text-3xl font-bold tracking-tight`
- Subtítulo: `text-muted-foreground`
- Actions: `flex flex-wrap gap-2` alinhados à direita em `sm:`

### Grid de Cards
- KPIs: `grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Charts: `grid gap-4 grid-cols-1 lg:grid-cols-2`
- Settings: `grid gap-4 md:grid-cols-2 lg:grid-cols-3`
- Mixed (7-col): `grid gap-4 grid-cols-1 lg:grid-cols-7` com `lg:col-span-4` e `lg:col-span-3`

---

## Gráficos (Recharts)

### Padrão de Configuração
```tsx
<ResponsiveContainer width="100%" height="100%">
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
    <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
    <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent)', opacity: 0.5 }} />
    <Bar dataKey="valor" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={40} />
  </BarChart>
</ResponsiveContainer>
```

### Custom Tooltip
```tsx
<div className="rounded-lg border bg-card px-3 py-2 shadow-lg">
  <p className="text-sm font-medium text-card-foreground">{label}</p>
  <p className="text-xs" style={{ color }}>
    {formattedValue}
  </p>
</div>
```

### Container
- Altura fixa: `h-[300px]` como wrapper do `ResponsiveContainer`
- Cores via CSS variables: `var(--chart-1)` a `var(--chart-5)`
- Fontes dos eixos: `fontSize: 12`, `fill: 'var(--muted-foreground)'`
- Grid: apenas horizontal (`vertical={false}`), cor `var(--border)`

### Donut Chart (PieChart)
- Inner radius: 60, Outer: 90, Padding angle: 3
- Legend: `iconType="circle"`, `iconSize={8}`

---

## Espaçamento

- Seções de página: `space-y-6` (24px)
- Gap entre cards: `gap-4` (16px)
- Padding de card: `p-5` (KPI) ou `p-6` (padrão Shadcn)
- Padding da main: `p-4 sm:p-6 md:p-8`
- Border radius de card: `rounded-xl` (override do `rounded-lg` padrão)
- Border radius de ícone container: `rounded-xl`

---

## Sombras e Efeitos

- Card padrão: `shadow-sm` (Shadcn default)
- Card hover: `hover:shadow-md`
- Auth card: `shadow-lg`
- Tooltip: `shadow-lg`
- Mobile header: `backdrop-blur-md bg-background/80`
- Mobile backdrop: `bg-black/50 backdrop-blur-sm`
- Transições: `transition-all duration-200`

---

## Auth Pages

- Container: `flex min-h-screen items-center justify-center bg-background`
- Card: `w-full max-w-md shadow-lg`
- Logo: ícone centralizado em `rounded-xl bg-primary/10` acima do título
- Links: `text-primary hover:text-primary/80 transition-colors`
- Erros: `text-sm text-destructive text-center`
- Sucesso: `text-sm text-emerald-600 dark:text-emerald-400 text-center`

---

## Convenções Gerais

1. **Nunca use cores hardcoded** (`bg-gray-50`, `text-gray-900`, `bg-white`) — use variáveis de tema
2. **Ícone container padrão**: `h-10 w-10 rounded-xl bg-{cor}-500/10` com ícone `h-5 w-5 text-{cor}-500`
3. **KPI ícone container**: `h-12 w-12` (maior)
4. **Dark mode**: use `dark:text-{cor}-400` para texto colorido (mais claro)
5. **Transparências de status**: sempre `bg-{cor}-500/10` (10% opacity)
6. **Cards são sempre `'use client'`** quando contêm interatividade; charts são sempre client components
7. **Formatação de moeda**: `new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
