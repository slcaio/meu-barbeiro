---
name: nextjs-performance
description: >
  Otimização de performance em aplicações Next.js (App Router).
  Use esta skill quando o usuário quiser: melhorar performance, reduzir bundle size, otimizar imagens,
  fontes, lazy loading, streaming, caching, Server Components, Client Components, prefetching,
  Core Web Vitals (LCP, FID, CLS, INP, TTFB), code splitting, tree shaking, análise de bundle,
  otimizar next.config, configurar headers de cache, ISR, SSG, SSR, PPR (Partial Prerendering),
  React Compiler, Turbopack, loading states, Suspense boundaries, medir performance com Web Vitals,
  ou qualquer tema de otimização junto com Next.js ou React.
  Também dispare quando o usuário mencionar "performance", "otimizar", "lento", "bundle", "LCP",
  "CLS", "INP", "TTFB", "Web Vitals", "lighthouse", "carregamento", "rendering", "cache",
  "lazy load", "dynamic import", "streaming", "Suspense", "loading.tsx", "prefetch"
  ou qualquer termo de performance junto com Next.js ou React.
---

# Next.js Performance — Guia Completo de Otimização

Guia abrangente de otimização de performance para Next.js 16+ com App Router, cobrindo desde configuração até padrões avançados de rendering.

---

## 1. Core Web Vitals — O Que Medir

Antes de otimizar, entenda **o que** medir. O Google usa Core Web Vitals como fator de ranking:

| Métrica | O Que Mede | Meta |
|---------|-----------|------|
| **LCP** (Largest Contentful Paint) | Tempo até o maior elemento visível carregar | < 2.5s |
| **INP** (Interaction to Next Paint) | Latência de interação do usuário | < 200ms |
| **CLS** (Cumulative Layout Shift) | Estabilidade visual (mudanças de layout) | < 0.1 |
| **TTFB** (Time to First Byte) | Tempo até o primeiro byte da resposta | < 800ms |
| **FCP** (First Contentful Paint) | Tempo até o primeiro conteúdo visível | < 1.8s |

### 1.1 Medindo Web Vitals no Next.js

```tsx
// src/app/layout.tsx — via useReportWebVitals
'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Enviar para analytics (ex: Google Analytics, Vercel Analytics)
    console.log(metric.name, metric.value)

    switch (metric.name) {
      case 'LCP':
        if (metric.value > 2500) console.warn('LCP alto:', metric.value)
        break
      case 'INP':
        if (metric.value > 200) console.warn('INP alto:', metric.value)
        break
      case 'CLS':
        if (metric.value > 0.1) console.warn('CLS alto:', metric.value)
        break
    }
  })

  return null
}
```

```tsx
// No layout.tsx (Server Component)
import { WebVitals } from './web-vitals'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <WebVitals />
        {children}
      </body>
    </html>
  )
}
```

---

## 2. Server Components vs Client Components

A decisão **mais impactante** para performance no App Router. Server Components são o padrão e **não enviam JavaScript para o cliente**.

### 2.1 Regra de Ouro

| Cenário | Usar |
|---------|------|
| Buscar dados | Server Component |
| Acessar backend/banco diretamente | Server Component |
| Renderizar conteúdo estático | Server Component |
| Lógica pesada de transformação de dados | Server Component |
| Interatividade (onClick, onChange, etc.) | Client Component |
| Hooks de estado (useState, useReducer) | Client Component |
| Hooks de efeito (useEffect) | Client Component |
| APIs do browser (localStorage, etc.) | Client Component |

### 2.2 Padrão: Mover `'use client'` para as Folhas

```
❌ RUIM — faz toda a árvore virar client
app/
  page.tsx ← 'use client' (tudo vira client bundle)

✅ BOM — só componentes interativos são client
app/
  page.tsx ← Server Component (busca dados, renderiza layout)
  components/
    interactive-filter.tsx ← 'use client' (só o filtro é client)
    static-list.tsx ← Server Component (renderiza lista)
```

### 2.3 Padrão: Composição Server + Client

```tsx
// app/dashboard/page.tsx — Server Component
import { getFinancialData } from '@/app/financial/actions'
import { FinancialChart } from './financial-chart' // Client Component

export default async function DashboardPage() {
  // Dados buscados no servidor — zero JS enviado ao client para buscar
  const data = await getFinancialData()

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Passa dados serializados para o Client Component */}
      <FinancialChart data={data} />
    </div>
  )
}
```

```tsx
// app/dashboard/financial-chart.tsx — Client Component (só interatividade)
'use client'

import { BarChart, Bar, ResponsiveContainer } from 'recharts'

export function FinancialChart({ data }: { data: FinancialRecord[] }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <Bar dataKey="amount" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

### 2.4 Evitar Serializar Dados Desnecessários

```tsx
// ❌ RUIM — envia todos os campos para o client
const appointments = await getAppointments()
return <AppointmentList data={appointments} />

// ✅ BOM — seleciona só o necessário
const appointments = await getAppointments()
const listData = appointments.map(({ id, client_name, appointment_date, status }) => ({
  id, client_name, appointment_date, status
}))
return <AppointmentList data={listData} />
```

---

## 3. Otimização de Imagens

### 3.1 Sempre Usar `next/image`

O componente `<Image>` do Next.js oferece:
- **Lazy loading automático** (só carrega ao entrar no viewport)
- **Formatos modernos** (WebP/AVIF automáticos)
- **Redimensionamento** sob demanda
- **Prevenção de CLS** (reserva espaço com width/height)

```tsx
import Image from 'next/image'

// ✅ Imagem local — width/height automáticos
import logoImg from '@/public/logo.png'

export function Logo() {
  return (
    <Image
      src={logoImg}
      alt="Meu Barbeiro"
      placeholder="blur" // blur-up enquanto carrega
      priority // para imagens above-the-fold (LCP)
    />
  )
}

// ✅ Imagem remota — width/height obrigatórios
export function Avatar({ url }: { url: string }) {
  return (
    <Image
      src={url}
      alt="Avatar"
      width={48}
      height={48}
      sizes="48px" // informa o tamanho real para otimizar srcset
    />
  )
}
```

### 3.2 Props Importantes para Performance

| Prop | Quando Usar | Impacto |
|------|------------|---------|
| `priority` | Imagens above-the-fold (hero, LCP) | Desativa lazy load, faz preload |
| `placeholder="blur"` | Qualquer imagem | Melhora CLS e UX percebida |
| `sizes` | Quando imagem não é 100% da viewport | Evita baixar imagem grande demais |
| `quality` | Quando imagem default é grande | Reduz tamanho (default: 75) |
| `loading="eager"` | Para above-the-fold quando `priority` não é possível | Carrega imediatamente |

### 3.3 Configurar Remote Patterns

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
    ],
    // Formatos modernos (padrão já inclui webp)
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
```

### 3.4 Usar `fill` para Imagens Responsivas

```tsx
// Quando não sabe width/height — container precisa ser position: relative
<div className="relative h-64 w-full">
  <Image
    src={barbershopCover}
    alt="Barbearia"
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />
</div>
```

---

## 4. Otimização de Fontes

### 4.1 Usar `next/font` (Self-Hosted Automático)

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // evita FOIT (flash of invisible text)
  // variable: '--font-inter', // para usar com Tailwind
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

### 4.2 Benefícios do `next/font`

- **Zero layout shift** — fontes são pré-carregadas e CSS `size-adjust` é calculado
- **Self-hosted** — sem requests para Google Fonts (melhor privacidade e performance)
- **Fontes variáveis** — prefira sempre (`Inter`, `Geist`, etc.) por menor tamanho de arquivo

### 4.3 Fonte Local

```tsx
import localFont from 'next/font/local'

const myFont = localFont({
  src: './fonts/CustomFont.woff2',
  display: 'swap',
  preload: true,
})
```

---

## 5. Lazy Loading e Code Splitting

### 5.1 `next/dynamic` — Componentes Client Lazy

```tsx
import dynamic from 'next/dynamic'

// Carrega componente apenas quando renderizado
const AppointmentCalendar = dynamic(
  () => import('./appointment-calendar'),
  {
    loading: () => <div className="h-96 animate-pulse bg-muted rounded-lg" />,
  }
)

// Desativa SSR para componentes que dependem de browser APIs
const MapComponent = dynamic(
  () => import('./map'),
  { ssr: false }
)

export default function AppointmentsPage() {
  return (
    <div>
      <h1>Agendamentos</h1>
      <AppointmentCalendar />
    </div>
  )
}
```

### 5.2 Quando Usar Lazy Loading

| Cenário | Usar? |
|---------|-------|
| Componente pesado abaixo do fold | ✅ Sim |
| Modal/Dialog (aberto por interação) | ✅ Sim |
| Gráficos/Charts (recharts, etc.) | ✅ Sim |
| Componentes com browser-only APIs | ✅ Sim (`ssr: false`) |
| Componentes críticos (header, hero) | ❌ Não |
| Componentes leves/pequenos | ❌ Não (overhead do dynamic) |

### 5.3 Lazy Loading de Bibliotecas

```tsx
'use client'

import { useState } from 'react'

export function SearchInput() {
  const [results, setResults] = useState([])

  return (
    <input
      type="text"
      placeholder="Buscar..."
      onChange={async (e) => {
        const { value } = e.currentTarget
        // Carrega fuse.js apenas quando o usuário digita
        const Fuse = (await import('fuse.js')).default
        const fuse = new Fuse(items, { keys: ['name'] })
        setResults(fuse.search(value))
      }}
    />
  )
}
```

### 5.4 Named Exports com Dynamic Import

```tsx
const Hello = dynamic(() =>
  import('../components/hello').then((mod) => mod.Hello)
)
```

---

## 6. Streaming e Suspense

### 6.1 `loading.tsx` — Loading State por Rota

```tsx
// app/(protected)/appointments/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse bg-muted rounded" />
      <div className="h-64 animate-pulse bg-muted rounded-lg" />
    </div>
  )
}
```

> **O Next.js usa `loading.tsx` como Suspense boundary automático.** Isso permite streaming: o layout é enviado imediatamente e o conteúdo da página é streamed quando pronto.

### 6.2 Suspense Granular

```tsx
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Cada seção carrega independentemente */}
      <Suspense fallback={<CardSkeleton />}>
        <RevenueCard />
      </Suspense>
      <Suspense fallback={<CardSkeleton />}>
        <AppointmentsCard />
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />
      </Suspense>
      <Suspense fallback={<ListSkeleton />}>
        <RecentAppointments />
      </Suspense>
    </div>
  )
}
```

> **Streaming permite que partes rápidas da UI apareçam primeiro**, sem bloquear por dados lentos. Cada boundary independente faz fetch paralelo.

### 6.3 Skeleton Components

```tsx
function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6 space-y-3">
      <div className="h-4 w-24 animate-pulse bg-muted rounded" />
      <div className="h-8 w-32 animate-pulse bg-muted rounded" />
    </div>
  )
}
```

---

## 7. Caching e Revalidação

### 7.1 `use cache` Directive (Next.js 16+)

```tsx
// Cacheia o resultado de uma função
async function getServices(barbershopId: string) {
  'use cache'
  const supabase = await createClient()
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('barbershop_id', barbershopId)
  return data
}
```

### 7.2 Revalidação com `revalidatePath` e `revalidateTag`

```tsx
// Em Server Actions — após mutação, invalida cache
'use server'

import { revalidatePath } from 'next/cache'

export async function createAppointment(formData: FormData) {
  // ... criar agendamento no banco
  revalidatePath('/appointments') // Invalida cache da página
}
```

```tsx
// Revalidação por tag — mais granular
import { revalidateTag } from 'next/cache'

export async function updateService(id: string, data: ServiceData) {
  // ... atualizar serviço
  revalidateTag('services') // Invalida todos os caches com essa tag
}
```

### 7.3 ISR (Incremental Static Regeneration)

```tsx
// Gera página estática e revalida a cada 60 segundos
// app/barbershop/[id]/page.tsx
export const revalidate = 60

export default async function BarbershopPage({ params }: { params: { id: string } }) {
  const barbershop = await getBarbershop(params.id)
  return <BarbershopProfile data={barbershop} />
}
```

### 7.4 `generateStaticParams` para Pré-Gerar Páginas

```tsx
// Gera páginas estáticas no build time
export async function generateStaticParams() {
  const barbershops = await getAllBarbershops()
  return barbershops.map((shop) => ({ id: shop.id }))
}
```

---

## 8. Configuração do `next.config.ts`

### 8.1 Configurações de Performance

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // React Compiler — otimiza re-renders automaticamente
  reactCompiler: true,

  // Otimizar imports de pacotes grandes (tree-shake automático)
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@radix-ui/react-icons',
    ],
  },

  // Imagens
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  // Remover header X-Powered-By (segurança + bytes)
  poweredByHeader: false,

  // Habilitar compressão gzip (desativar se CDN já comprime)
  // compress: true, // padrão é true
}

export default nextConfig
```

### 8.2 `optimizePackageImports` — Quando Usar

Pacotes com **muitas exportações** (icon libraries, date-fns, lodash). O Next.js já otimiza automaticamente:
- `lucide-react`
- `date-fns`
- `@radix-ui/*`
- `recharts`
- `react-hook-form`
- `@tanstack/react-query`

Adicione pacotes grandes que não estejam na lista padrão.

### 8.3 React Compiler

O **React Compiler** (já habilitado no projeto) elimina a necessidade de `useMemo`, `useCallback` e `React.memo` manuais na maioria dos casos:

```tsx
// ❌ ANTES — memo manual
const MemoizedList = React.memo(({ items }) => {
  const sorted = useMemo(() => items.sort(...), [items])
  return sorted.map(...)
})

// ✅ DEPOIS (com React Compiler) — código limpo, compilador otimiza
function List({ items }) {
  const sorted = items.sort(...)
  return sorted.map(...)
}
```

---

## 9. Prefetching e Navegação

### 9.1 `<Link>` com Prefetch Automático

```tsx
import Link from 'next/link'

// Next.js faz prefetch automático de rotas que aparecem no viewport
<Link href="/appointments">Agendamentos</Link>

// Desabilitar prefetch para rotas raramente acessadas
<Link href="/settings" prefetch={false}>Configurações</Link>
```

### 9.2 Prefetch Programático

```tsx
'use client'

import { useRouter } from 'next/navigation'

export function AppointmentRow({ id }: { id: string }) {
  const router = useRouter()

  return (
    <div
      onMouseEnter={() => router.prefetch(`/appointments/${id}`)}
      onClick={() => router.push(`/appointments/${id}`)}
    >
      {/* ... */}
    </div>
  )
}
```

### 9.3 `<Form>` Component para Prefetch de Página de Resultado

```tsx
import Form from 'next/form'

// Prefetch automático da página de destino + navegação client-side
export function SearchForm() {
  return (
    <Form action="/search">
      <input name="q" placeholder="Buscar cliente..." />
      <button type="submit">Buscar</button>
    </Form>
  )
}
```

---

## 10. Otimização de Bundle

### 10.1 Analisar Bundle

```bash
# Turbopack Bundle Analyzer (Next.js 16.1+)
npx next experimental-analyze

# Salvar resultado para comparação
npx next experimental-analyze --output
```

### 10.2 Mover Lógica Pesada para Server Components

```tsx
// ❌ RUIM — biblioteca de highlight vai para o bundle do client
'use client'
import Highlight from 'prism-react-renderer'

// ✅ BOM — highlight roda no servidor, client recebe só HTML
// (Server Component — sem 'use client')
import { codeToHtml } from 'shiki'

export default async function CodeBlock({ code }: { code: string }) {
  const html = await codeToHtml(code, { lang: 'tsx', theme: 'github-dark' })
  return <pre><code dangerouslySetInnerHTML={{ __html: html }} /></pre>
}
```

### 10.3 Importações Seletivas

```tsx
// ❌ RUIM — importa tudo
import { format, parseISO, addDays, subDays, startOfMonth, endOfMonth } from 'date-fns'

// ✅ BOM — com optimizePackageImports o Next.js faz tree-shake
// (já configurado para date-fns automaticamente)
import { format, parseISO } from 'date-fns' // Só importe o que usar

// ❌ RUIM — ícone genérico importa tudo
import * as Icons from 'lucide-react'

// ✅ BOM — import nomeado
import { Calendar, Clock, User } from 'lucide-react'
```

### 10.4 `serverExternalPackages` — Excluir do Bundle

```ts
// next.config.ts — pacotes que só rodam no servidor
const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp', 'bcrypt'],
}
```

---

## 11. Middleware Otimizado

```ts
// src/middleware.ts — manter LEVE
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // ⚡ Middleware roda no Edge — cada ms conta
  // Evitar lógica pesada, regex complexas, ou chamadas a APIs externas

  // Matcher já filtra — middleware só executa para rotas relevantes
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Excluir arquivos estáticos e API routes internos
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Dicas para Middleware performático:**
- Use `matcher` para limitar rotas (evita executar em cada request)
- Evite `fetch()` dentro do middleware (adiciona latência)
- Não importe bibliotecas pesadas
- Prefer `NextResponse.next()` (pass-through) quando possível

---

## 12. Metadata e SEO

### 12.1 Metadata Estática

```tsx
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Meu Barbeiro',
    default: 'Meu Barbeiro',
  },
  description: 'Plataforma de gerenciamento de barbearias',
  metadataBase: new URL('https://meubarbeiro.com'),
}
```

### 12.2 Metadata Dinâmica

```tsx
// app/barbershop/[id]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({ params }): Promise<Metadata> {
  const barbershop = await getBarbershop(params.id)
  return {
    title: barbershop.name,
    description: `Barbearia ${barbershop.name} - Agende seu horário`,
    openGraph: {
      title: barbershop.name,
      images: [barbershop.coverImage],
    },
  }
}
```

---

## 13. Scripts de Terceiros

```tsx
import Script from 'next/script'

// Carregar após a página ser interativa
<Script src="https://analytics.example.com/script.js" strategy="afterInteractive" />

// Carregar quando o browser estiver idle
<Script src="https://chat-widget.example.com/widget.js" strategy="lazyOnload" />

// Script inline executado antes de qualquer coisa (raro)
<Script id="theme-detector" strategy="beforeInteractive">
  {`document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)`}
</Script>
```

| Strategy | Quando Carrega | Exemplo |
|----------|---------------|---------|
| `beforeInteractive` | Antes de hidratar | Detector de tema, polyfills |
| `afterInteractive` | Logo após hidratar (padrão) | Analytics, tag managers |
| `lazyOnload` | Durante idle time | Chat widgets, social embeds |
| `worker` | Em Web Worker (experimental) | Scripts pesados |

---

## 14. CSS Performance

### 14.1 Tailwind CSS — Já Otimizado

Tailwind com purge automático gera CSS mínimo. Nenhuma ação extra necessária.

### 14.2 Evitar CSS-in-JS no Servidor

CSS-in-JS (styled-components, emotion) exige runtime JS. Prefira Tailwind ou CSS Modules que são zero-runtime.

### 14.3 Inline CSS (Experimental)

```ts
// next.config.ts — inlines CSS critical no HTML
const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true, // Reduz round-trips para CSS
  },
}
```

---

## 15. Checklist de Produção

### Build & Deploy
- [ ] Rodar `next build` e verificar warnings
- [ ] Analisar bundle com `next experimental-analyze`
- [ ] Verificar que `reactCompiler: true` está ativo
- [ ] Configurar `poweredByHeader: false`
- [ ] Configurar `images.formats` com AVIF + WebP

### Componentes
- [ ] Server Components como padrão (sem `'use client'` desnecessário)
- [ ] `'use client'` apenas nas folhas da árvore
- [ ] Lazy load componentes pesados e abaixo do fold
- [ ] Skeletons/loading states em todas as rotas protegidas
- [ ] `<Image>` em vez de `<img>` para todas as imagens
- [ ] `priority` em imagens LCP (hero, above-the-fold)
- [ ] `sizes` prop em todas as `<Image>` responsivas

### Fontes
- [ ] Usar `next/font` (Google ou local)
- [ ] `display: 'swap'` para evitar FOIT
- [ ] Fontes variáveis quando disponível

### Dados
- [ ] Caching com `use cache` ou `revalidate`
- [ ] `revalidatePath`/`revalidateTag` após mutações
- [ ] Suspense boundaries para streaming paralelo
- [ ] Selecionar apenas colunas necessárias nas queries
- [ ] Evitar waterfalls: fetch em paralelo com `Promise.all`

### Navegação
- [ ] `<Link>` em vez de `<a>` para navegação interna
- [ ] `prefetch={false}` em links raramente acessados
- [ ] `<Form>` para formulários de busca/filtro

### Bundle
- [ ] Imports nomeados (não `import *`)
- [ ] `optimizePackageImports` para bibliotecas grandes
- [ ] `serverExternalPackages` para pacotes server-only
- [ ] Scripts de terceiros com `strategy="lazyOnload"`

### Middleware
- [ ] `matcher` configurado para excluir estáticos
- [ ] Zero fetch/chamadas externas no middleware
- [ ] Lógica mínima e rápida

---

## 16. Anti-Padrões Comuns

### 16.1 Client Component na Raiz

```tsx
// ❌ Torna TODA a árvore um Client Component
// app/layout.tsx
'use client' // NUNCA faça isso no layout raiz
```

### 16.2 Fetch no Client Component

```tsx
// ❌ — useEffect + fetch = waterfall, sem streaming, sem cache
'use client'
useEffect(() => {
  fetch('/api/appointments').then(...)
}, [])

// ✅ — Buscar no Server Component e passar como prop
// Ou usar React Query com prefetch no servidor
```

### 16.3 Imagens sem Dimensões

```tsx
// ❌ — Causa CLS (layout shift)
<img src="/banner.jpg" />

// ✅ — Reserva espaço, zero CLS
<Image src="/banner.jpg" alt="Banner" width={1200} height={400} />
```

### 16.4 Waterfalls de Dados

```tsx
// ❌ — Sequencial (waterfall)
const user = await getUser()
const appointments = await getAppointments(user.id)
const services = await getServices(user.barbershopId)

// ✅ — Paralelo
const user = await getUser()
const [appointments, services] = await Promise.all([
  getAppointments(user.id),
  getServices(user.barbershopId),
])
```

### 16.5 Dependências Pesadas no Client

```tsx
// ❌ — date-fns inteiro no bundle do client
'use client'
import { format, parse, add, sub, differenceInDays, ... } from 'date-fns'

// ✅ — Formatar no servidor, enviar string pronta
// Server Component
const formattedDate = format(appointment.date, "dd/MM/yyyy 'às' HH:mm")
return <AppointmentCard date={formattedDate} />
```

---

## 17. Padrões Avançados

### 17.1 Parallel Routes para Dashboards

```
app/(protected)/dashboard/
  layout.tsx
  page.tsx
  @revenue/page.tsx      ← Carrega em paralelo
  @appointments/page.tsx ← Carrega em paralelo
  @clients/page.tsx      ← Carrega em paralelo
```

```tsx
// layout.tsx — renderiza slots em paralelo
export default function DashboardLayout({
  children,
  revenue,
  appointments,
  clients,
}: {
  children: React.ReactNode
  revenue: React.ReactNode
  appointments: React.ReactNode
  clients: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {revenue}
      {appointments}
      {clients}
      {children}
    </div>
  )
}
```

### 17.2 Partial Prerendering (PPR) — Experimental

PPR combina shell estática com conteúdo dinâmico streamed:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
}
```

```tsx
// O shell estático é servido do CDN instantaneamente
// Partes dinâmicas (dentro de Suspense) são streamed
export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1> {/* Estático — servido do CDN */}
      <Suspense fallback={<Skeleton />}>
        <DynamicContent /> {/* Dinâmico — streamed */}
      </Suspense>
    </div>
  )
}
```

### 17.3 View Transitions (Next.js 16+)

```ts
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
}
```

```tsx
'use client'

import { unstable_ViewTransition as ViewTransition } from 'react'

export function PageTransition({ children }: { children: React.ReactNode }) {
  return <ViewTransition>{children}</ViewTransition>
}
```

---

## 18. Ferramentas de Diagnóstico

| Ferramenta | O Que Analisa |
|-----------|--------------|
| `next experimental-analyze` | Tamanho dos bundles com treemap interativo |
| Chrome DevTools → Performance | Runtime performance, INP, long tasks |
| Chrome DevTools → Lighthouse | Core Web Vitals, acessibilidade, SEO |
| `useReportWebVitals` | Métricas reais dos usuários (RUM) |
| Vercel Analytics | Web Vitals em produção |
| Vercel Speed Insights | Performance real por rota |
| `React DevTools Profiler` | Re-renders desnecessários |

```bash
# Gerar build report detalhado
NEXT_TELEMETRY_DEBUG=1 npx next build

# Analisar bundle
npx next experimental-analyze
npx next experimental-analyze --output
```
