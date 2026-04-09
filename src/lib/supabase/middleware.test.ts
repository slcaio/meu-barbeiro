import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockGetUser = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}))

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost'))
}

describe('Supabase Middleware - updateSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
  })

  it('redireciona /dashboard para /login se não autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { updateSession } = await import('./middleware')

    const req = makeRequest('/dashboard')
    const res = await updateSession(req)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('redireciona /setup para /login se não autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { updateSession } = await import('./middleware')

    const req = makeRequest('/setup/wizard')
    const res = await updateSession(req)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('redireciona /login para /dashboard se autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    const { updateSession } = await import('./middleware')

    const req = makeRequest('/login')
    const res = await updateSession(req)
    expect(res.headers.get('location')).toContain('/dashboard')
  })

  it('redireciona /register para /dashboard se autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    const { updateSession } = await import('./middleware')

    const req = makeRequest('/register')
    const res = await updateSession(req)
    expect(res.headers.get('location')).toContain('/dashboard')
  })

  it('permite acesso a rotas públicas', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { updateSession } = await import('./middleware')

    const req = makeRequest('/about')
    const res = await updateSession(req)
    expect(res.headers.get('location')).toBeNull()
  })

  it('permite acesso ao dashboard quando autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    const { updateSession } = await import('./middleware')

    const req = makeRequest('/dashboard')
    const res = await updateSession(req)
    expect(res.headers.get('location')).toBeNull()
  })
})
