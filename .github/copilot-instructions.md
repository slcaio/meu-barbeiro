# Meu Barbeiro — Project Guidelines

> **PRIORIDADE ABSOLUTA**
> 1. **Toda lógica de backend (queries, mutações, auth) vai em `src/app/[module]/actions.ts`** — nunca em `page.tsx` ou componentes.
> 2. **Todo código novo deve ter testes** — crie ou atualize o arquivo `actions.test.ts` (ou `.test.tsx`) correspondente.

## Architecture

SaaS de gerenciamento de barbearias. Multi-tenant (cada user tem 1 barbershop).

- **Stack**: Next.js 16 (App Router), React 19, TypeScript strict, Supabase (PostgreSQL + Auth), Tailwind CSS 4, Shadcn/ui
- **Path alias**: `@/*` → `./src/*`
- **Route groups**: `(auth)/` público, `(protected)/` requer login, `/setup/wizard` onboarding
- **Server Actions**: `src/app/[module]/actions.ts` — ficam fora dos route groups
- **UI compartilhada**: `src/components/ui/` (Shadcn). Componentes de 1 módulo ficam colocados na pasta da página
- **Tipos do banco**: `src/types/database.types.ts` (gerado pelo Supabase CLI)

## Build and Test

```bash
npm run dev          # Dev server
npm run build        # Production build
npm test             # Vitest watch mode
npm run test:run     # Vitest single run
npm run test:coverage # Coverage report
npm run lint         # ESLint 9 flat config
```

## Code Style

- TypeScript strict — **nunca use `any`**, prefira tipos de `database.types.ts` ou `unknown`
- Mensagens de erro para o usuário em **português**
- Comentários e nomes de variáveis/funções em **inglês**
- Server Components por padrão; apenas `'use client'` quando necessário (state, events, hooks)
- Use `cn()` de `@/lib/utils` para merge de classes Tailwind
- Formatação: `formatPhone()`, `formatCurrency()`, `parseCurrency()` de `@/lib/utils`

## Conventions

### ⚠️ Regra de Ouro: Backend sempre em `actions.ts`

**Nunca coloque lógica de backend em `page.tsx` ou componentes.** Toda query ao banco, verificação de auth e lógica de negócio pertence em `src/app/[module]/actions.ts`.

**❌ Errado — query em page.tsx:**
```typescript
// src/app/(protected)/appointments/page.tsx
async function getData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // ... queries aqui
}
export default async function Page() {
  const data = await getData()
}
```

**✅ Correto — query em actions.ts, page só importa:**
```typescript
// src/app/appointments/actions.ts
export async function getAppointmentsPageData() {
  const supabase = await createClient()
  // ... toda a lógica aqui
  return { appointments, services, clients }
}

// src/app/(protected)/appointments/page.tsx
import { getAppointmentsPageData } from '@/app/appointments/actions'
export default async function Page() {
  const data = await getAppointmentsPageData()
}
```

Funções de leitura (queries) em `actions.ts` seguem o mesmo padrão de auth/barbershop, mas **não precisam de Zod nem `revalidatePath`**:

```typescript
export async function getModulePageData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: barbershop } = await supabase
    .from('barbershops').select('id').eq('user_id', user.id).single()
  if (!barbershop) redirect('/setup/wizard')

  const { data } = await supabase.from('table')...
  return { data: data || [] }
}
```

### ⚠️ Regra de Ouro: Sempre escreva testes

**Todo código novo (action, componente, utilitário) deve ter um teste correspondente.** Crie ou atualize o arquivo `*.test.ts` / `*.test.tsx` no mesmo diretório ou em `src/__tests__/`.

**Estrutura obrigatória de testes para actions:**
```typescript
// src/app/[module]/actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '@/tests/helpers'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

describe('myAction', () => {
  // Ordem obrigatória:
  it('returns error when user is not authenticated')   // 1. auth error
  it('returns error when input is invalid')            // 2. validation error
  it('returns error when barbershop not found')        // 3. business logic error
  it('returns success with valid data')                // 4. success
})
```

### Server Actions Pattern

Toda server action segue esta sequência obrigatória:

```typescript
'use server'
export async function myAction(formData: FormData) {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  // 2. Zod validation
  const parsed = schema.safeParse({ /* campos */ })
  if (!parsed.success) return { error: 'Dados inválidos.' }

  // 3. Fetch barbershop context (multi-tenant)
  const { data: barbershop } = await supabase
    .from('barbershops').select('id').eq('user_id', user.id).single()
  if (!barbershop) return { error: 'Barbearia não encontrada.' }

  // 4. DB operation com error handling
  const { error } = await supabase.from('table').insert({ ... })
  if (error) { console.error(error); return { error: 'Mensagem amigável.' } }

  // 5. Revalidate affected paths
  revalidatePath('/affected-route')

  // 6. Return success
  return { success: true }
}
```

### Testing Pattern

- **Framework**: Vitest + React Testing Library
- Helpers em `src/__tests__/helpers.ts`: `createMockSupabaseClient()`, `createFormData()`
- Mock Supabase com `vi.mock()` usando chain pattern (`.from().select().eq()...`)
- Mock `revalidatePath` de `next/cache`
- Ordem dos testes: auth error → validation error → business logic error → success
- Componentes: import dinâmico `(await import('./component')).default` após mocks

### Page Pattern (Protected)

```typescript
// Server Component (default)
// 1. createClient() + auth check → redirect('/login')
// 2. Fetch data server-side
// 3. Render com <Suspense fallback={<Skeleton />}>
// 4. Use dynamic() para componentes pesados (charts)
```

### Component Extraction Rule

- Usado em 2+ módulos → `src/components/ui/`
- Usado em 1 módulo → colocado na pasta da página

## Database

- **RLS ativo**: toda tabela filtra por `barbershop_id` + `user_id`
- Supabase client-side: `createBrowserClient()` de `@/lib/supabase/client`
- Supabase server-side: `createClient()` de `@/lib/supabase/server`
- Tabelas: users, barbershops, services, appointments, clients, financial_records, payment_methods, categories, barbers
- Migrations em `supabase/migrations/`

## Common Pitfalls

- Esquecer `revalidatePath()` após mutações → dados stale no cache
- Esquecer auth check como primeira linha em server actions
- Importar módulos client em arquivos `'use server'`
- Não validar input com Zod antes de operações no banco
- Colocar lógica de negócio em componentes — manter em server actions

## Reference Docs

- Detalhes completos de arquitetura, banco e CRUD: ver [.github/instructions/project.instructions.md](.github/instructions/project.instructions.md)
- Template para criação de features: ver [.github/instructions/TEMPLATE.md](.github/instructions/TEMPLATE.md)
- Features documentadas: `BARBEIRO_FEATURE.md`, `CATEGORIES_FEATURE.md`, `PAYMENT_METHOD_FEATURE.md` em `.github/instructions/`
