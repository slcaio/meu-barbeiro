import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockExchangeCode = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: mockExchangeCode,
      },
    })
  ),
}))

describe('Auth Callback Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redireciona para /dashboard com código válido', async () => {
    mockExchangeCode.mockResolvedValue({ error: null })
    const { GET } = await import('./route')

    const request = new Request('http://localhost/auth/callback?code=valid-code')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/dashboard')
  })

  it('redireciona para path customizado via next param', async () => {
    mockExchangeCode.mockResolvedValue({ error: null })
    const { GET } = await import('./route')

    const request = new Request('http://localhost/auth/callback?code=valid-code&next=/settings')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/settings')
  })

  it('redireciona para erro se code está ausente', async () => {
    const { GET } = await import('./route')

    const request = new Request('http://localhost/auth/callback')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/auth/auth-code-error')
  })

  it('redireciona para erro se exchange falhar', async () => {
    mockExchangeCode.mockResolvedValue({ error: { message: 'Invalid code' } })
    const { GET } = await import('./route')

    const request = new Request('http://localhost/auth/callback?code=invalid-code')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/auth/auth-code-error')
  })
})
