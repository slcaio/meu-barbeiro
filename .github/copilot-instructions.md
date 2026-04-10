# Meu Barbeiro — Project Guidelines

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
