import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockGetUser = vi.fn()
const mockGetClaims = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      getClaims: mockGetClaims,
    },
  })),
}))

function makeRequest(url: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(new URL(url, 'http://localhost'))
  Object.entries(cookies).forEach(([name, value]) => req.cookies.set(name, value))
  return req
}

/** Helper: getClaims fails → getUser returns authenticated user */
function mockAuthenticatedViaClaims(userId = 'user-123') {
  mockGetClaims.mockResolvedValue({ data: { claims: { sub: userId } }, error: null })
}

/** Helper: getClaims fails → getUser falls back (expired JWT path) */
function mockClaimsError() {
  mockGetClaims.mockResolvedValue({ data: null, error: new Error('JWT expired') })
}

describe('Supabase Middleware - updateSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    // Default: getClaims succeeds with no user (unauthenticated)
    mockGetClaims.mockResolvedValue({ data: { claims: null }, error: null })
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
  })

  it('redireciona /dashboard para /login se não autenticado', async () => {
    const { updateSession } = await import('./middleware')

    const req = makeRequest('/dashboard')
    const res = await updateSession(req)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('redireciona /setup para /login se não autenticado', async () => {
    const { updateSession } = await import('./middleware')

    const req = makeRequest('/setup/wizard')
    const res = await updateSession(req)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('redireciona /login para /dashboard se autenticado via getClaims', async () => {
    mockAuthenticatedViaClaims()
    const { updateSession } = await import('./middleware')

    const req = makeRequest('/login')
    const res = await updateSession(req)
    expect(res.headers.get('location')).toContain('/dashboard')
  })

  it('redireciona /register para /dashboard se autenticado via getClaims', async () => {
    mockAuthenticatedViaClaims()
    const { updateSession } = await import('./middleware')

    const req = makeRequest('/register')
    const res = await updateSession(req)
    expect(res.headers.get('location')).toContain('/dashboard')
  })

  it('permite acesso a /auth/callback quando não autenticado', async () => {
    const { updateSession } = await import('./middleware')

    const req = makeRequest('/auth/callback')
    const res = await updateSession(req)
    expect(res.headers.get('location')).toBeNull()
  })

  it('permite acesso ao dashboard quando autenticado', async () => {
    mockAuthenticatedViaClaims()
    const { updateSession } = await import('./middleware')

    const req = makeRequest('/dashboard')
    const res = await updateSession(req)
    expect(res.headers.get('location')).toBeNull()
  })

  describe('JWT expirado', () => {
    it('redireciona rota protegida para /login e remove cookies sb-* quando JWT expirado', async () => {
      mockClaimsError()
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('JWT expired'),
      })
      const { updateSession } = await import('./middleware')

      const req = makeRequest('/dashboard', { 'sb-access-token': 'expired', 'sb-refresh-token': 'old' })
      const res = await updateSession(req)

      expect(res.headers.get('location')).toContain('/login')
      expect(res.cookies.get('sb-access-token')?.value).toBeFalsy()
      expect(res.cookies.get('sb-refresh-token')?.value).toBeFalsy()
    })

    it('não redireciona /login quando JWT expirado mas limpa cookies sb-*', async () => {
      mockClaimsError()
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('JWT expired'),
      })
      const { updateSession } = await import('./middleware')

      const req = makeRequest('/login', { 'sb-access-token': 'expired' })
      const res = await updateSession(req)

      expect(res.headers.get('location')).toBeNull()
      expect(res.cookies.get('sb-access-token')?.value).toBeFalsy()
    })

    it('redireciona /recovery para /login e limpa cookies quando JWT expirado (rota pública)', async () => {
      mockClaimsError()
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('JWT expired'),
      })
      const { updateSession } = await import('./middleware')

      // /recovery is a public route — should not redirect, just clear cookies
      const req = makeRequest('/recovery', { 'sb-access-token': 'expired' })
      const res = await updateSession(req)

      expect(res.headers.get('location')).toBeNull()
    })
  })
})
