---
name: vitest-nextjs
description: >
  Configure, write, and run tests with Vitest in a Next.js fullstack project (App Router or Pages Router).
  Use this skill whenever the user wants to: set up Vitest in a Next.js project, write unit or integration
  tests for React components, Server Actions, API Routes, middleware, hooks, or utility functions,
  mock Next.js internals (router, navigation, headers, cookies), configure coverage reports, or fix
  test failures in a Next.js + Vitest environment. Also trigger when the user mentions "test", "spec",
  "coverage", "mock", "vi.fn", "renderizando componente no teste", or any testing-related term
  alongside Next.js, React, or fullstack context — even if they don't use the word "Vitest" explicitly.
---

# Vitest no Next.js Fullstack

Guia completo para configurar e escrever testes com Vitest em projetos Next.js (App Router e Pages Router), cobrindo frontend, backend e casos de borda fullstack.

---

## 1. Instalação

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
# Extras recomendados
npm install -D @vitest/coverage-v8 @vitest/ui msw
```

---

## 2. Configuração (`vitest.config.ts`)

### App Router (recomendado)

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: ['node_modules', '.next', 'vitest.config.ts', 'vitest.setup.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

### Setup global (`vitest.setup.ts`)

```ts
// vitest.setup.ts
import '@testing-library/jest-dom'
```

### `tsconfig.json` — garantir paths corretos

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Scripts no `package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## 3. Mocking do Next.js

### `next/navigation` (App Router)

```ts
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/mocked-path',
  useSearchParams: () => new URLSearchParams('?tab=home'),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))
```

### `next/router` (Pages Router)

```ts
vi.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    isReady: true,
  }),
}))
```

### `next/headers` (Server Components / Server Actions)

```ts
vi.mock('next/headers', () => ({
  headers: () => new Headers({ authorization: 'Bearer token123' }),
  cookies: () => ({
    get: (key: string) => ({ name: key, value: 'mock-value' }),
    set: vi.fn(),
    delete: vi.fn(),
    has: (key: string) => true,
  }),
}))
```

### `next/image`

```ts
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}))
```

### `next/link`

```ts
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))
```

---

## 4. Testando Componentes React

### Componente simples

```tsx
// components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renderiza com label correto', () => {
    render(<Button label="Enviar" />)
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument()
  })

  it('chama onClick ao clicar', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button label="Enviar" onClick={handleClick} />)
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Componente com contexto / Provider

```tsx
import { render } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <SessionProvider session={null}>
      {ui}
    </SessionProvider>
  )
}
```

### Componente com `useRouter`

```tsx
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

it('navega ao clicar no link', async () => {
  const user = userEvent.setup()
  render(<NavItem href="/dashboard" label="Dashboard" />)
  await user.click(screen.getByText('Dashboard'))
  // verifica comportamento esperado
})
```

---

## 5. Testando Server Actions

Server Actions são funções async puras — teste-as diretamente, sem render:

```ts
// actions/createPost.test.ts
import { createPost } from './createPost'
import { db } from '@/lib/db'

vi.mock('@/lib/db', () => ({
  db: {
    post: {
      create: vi.fn().mockResolvedValue({ id: '1', title: 'Test Post' }),
    },
  },
}))

vi.mock('next/headers', () => ({
  cookies: () => ({ get: () => ({ value: 'user-session' }) }),
}))

describe('createPost', () => {
  it('cria post e retorna dados', async () => {
    const result = await createPost({ title: 'Test Post', content: 'Conteúdo' })
    expect(db.post.create).toHaveBeenCalledWith({
      data: { title: 'Test Post', content: 'Conteúdo' },
    })
    expect(result).toEqual({ id: '1', title: 'Test Post' })
  })

  it('lança erro se title estiver vazio', async () => {
    await expect(createPost({ title: '', content: '' })).rejects.toThrow('Title obrigatório')
  })
})
```

---

## 6. Testando API Routes

### App Router (`route.ts`)

```ts
// app/api/users/route.test.ts
import { GET, POST } from './route'
import { NextRequest } from 'next/server'

describe('GET /api/users', () => {
  it('retorna lista de usuários', async () => {
    const req = new NextRequest('http://localhost/api/users')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
  })
})

describe('POST /api/users', () => {
  it('cria usuário com dados válidos', async () => {
    const req = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ name: 'João', email: 'joao@email.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})
```

### Pages Router (`pages/api/`)

```ts
import { createMocks } from 'node-mocks-http'
import handler from './users'

it('GET retorna usuários', async () => {
  const { req, res } = createMocks({ method: 'GET' })
  await handler(req, res)
  expect(res._getStatusCode()).toBe(200)
})
```

> Instale `node-mocks-http` para Pages Router: `npm install -D node-mocks-http`

---

## 7. Testando Middleware

```ts
// middleware.test.ts
import { middleware } from './middleware'
import { NextRequest } from 'next/server'

function makeRequest(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(url, 'http://localhost'), { headers })
}

describe('middleware', () => {
  it('redireciona para /login se não autenticado', async () => {
    const req = makeRequest('/dashboard')
    const res = await middleware(req)
    expect(res?.headers.get('location')).toContain('/login')
  })

  it('permite acesso com token válido', async () => {
    const req = makeRequest('/dashboard', { cookie: 'session=valid-token' })
    const res = await middleware(req)
    expect(res?.status).not.toBe(302)
  })
})
```

---

## 8. Testando Hooks Customizados

```ts
// hooks/useCounter.test.ts
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('inicializa com valor padrão', () => {
    const { result } = renderHook(() => useCounter(0))
    expect(result.current.count).toBe(0)
  })

  it('incrementa o contador', () => {
    const { result } = renderHook(() => useCounter(0))
    act(() => result.current.increment())
    expect(result.current.count).toBe(1)
  })
})
```

---

## 9. Mocking de Módulos Externos

### Fetch / API calls com MSW

```ts
// vitest.setup.ts (adicionar)
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const server = setupServer(
  http.get('/api/users', () => HttpResponse.json([{ id: 1, name: 'João' }])),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Banco de dados (Prisma)

```ts
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn().mockResolvedValue([{ id: '1', name: 'João' }]),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}))
```

### Variáveis de ambiente

```ts
// No início do arquivo de teste ou no setup
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')
vi.stubEnv('NEXTAUTH_SECRET', 'test-secret')
```

---

## 10. Padrões e Boas Práticas

### Estrutura de arquivos

```
app/
  dashboard/
    page.tsx
    page.test.tsx          ← colocar próximo ao arquivo
components/
  Button/
    Button.tsx
    Button.test.tsx
lib/
  utils.ts
  utils.test.ts
__tests__/                 ← ou centralizar aqui (opcional)
  integration/
```

### Convenções

| Situação | Recomendação |
|---|---|
| Teste unitário puro | `vi.fn()`, sem render |
| Componente com estado | `@testing-library/react` + `userEvent` |
| Server Action | Importar e chamar diretamente |
| API Route | `new NextRequest(...)` |
| Dados externos | MSW ou `vi.mock` |
| Env vars | `vi.stubEnv()` |

### Evitar

- ❌ Testar implementação interna (detalhes de estado, refs)
- ❌ `getByTestId` — prefira `getByRole`, `getByLabelText`, `getByText`
- ❌ `setTimeout` real — use `vi.useFakeTimers()`
- ❌ Importar `.env` diretamente — use `vi.stubEnv`

---

## 11. Solução de Problemas Comuns

### `Cannot find module 'next/navigation'`
→ Adicione o mock no arquivo de teste ou no `vitest.setup.ts`.

### `ReferenceError: Request is not defined`
→ Adicione ao `vitest.config.ts`:
```ts
test: {
  environment: 'edge-runtime', // ou use node + fetch polyfill
}
```
Ou instale `@edge-runtime/vm` e configure `environmentMatchGlobs`.

### `Error: useRouter must be used inside a Router`
→ Mock `next/navigation` ou `next/router` antes do render.

### Componente Server (RSC) não renderiza
→ RSCs não têm suporte direto no jsdom. Teste a lógica de negócio separadamente (funções, Server Actions) e use testes E2E (Playwright) para fluxos visuais.

### `SyntaxError` em módulos ESM
→ Adicione ao `vitest.config.ts`:
```ts
test: {
  transformMode: { web: [/\.[jt]sx?$/] },
}
```
Ou force transformação:
```ts
server: {
  deps: { inline: ['nome-do-pacote'] }
}
```

---

## 12. Coverage

```bash
# Gerar relatório
npm run test:coverage

# Abrir relatório HTML
open coverage/index.html
```

Meta sugerida para projetos Next.js:
- **Funções utilitárias / lib**: ≥ 90%
- **Server Actions**: ≥ 80%
- **Componentes UI**: ≥ 70%
- **API Routes**: ≥ 75%

Configure thresholds no `vitest.config.ts`:
```ts
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 60,
  }
}
```
