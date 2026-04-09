import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFormData } from '@/__tests__/helpers'

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock next/navigation
const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: (...args: string[]) => {
    mockRedirect(...args)
    throw new Error('NEXT_REDIRECT')
  },
}))

// Mock supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    signOut: vi.fn(),
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('retorna erro com dados inválidos', async () => {
      const { login } = await import('./actions')
      const formData = createFormData({ email: 'invalid', password: '123' })
      const result = await login(null, formData)
      expect(result).toEqual({ error: 'Dados inválidos. Verifique seu email e senha.' })
    })

    it('retorna erro quando credenciais estão erradas', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        error: { message: 'Invalid login' },
      })
      const { login } = await import('./actions')
      const formData = createFormData({ email: 'user@test.com', password: '123456' })
      const result = await login(null, formData)
      expect(result).toEqual({ error: 'Erro ao fazer login. Verifique suas credenciais.' })
    })

    it('redireciona para /dashboard com login válido', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null })
      const { login } = await import('./actions')
      const formData = createFormData({ email: 'user@test.com', password: '123456' })
      
      await expect(login(null, formData)).rejects.toThrow('NEXT_REDIRECT')
      expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('signup', () => {
    it('retorna erro com dados inválidos', async () => {
      const { signup } = await import('./actions')
      const formData = createFormData({ email: 'invalid', password: '12', name: '' })
      const result = await signup(null, formData)
      expect(result).toEqual({ error: 'Dados inválidos. Verifique os campos preenchidos.' })
    })

    it('retorna sucesso ao criar conta', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({ error: null })
      const { signup } = await import('./actions')
      const formData = createFormData({
        email: 'new@test.com',
        password: '123456',
        name: 'Teste User',
      })
      const result = await signup(null, formData)
      expect(result).toEqual({
        success: 'Conta criada com sucesso! Verifique seu email para confirmar.',
      })
    })

    it('retorna erro quando Supabase falha', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        error: { message: 'Email taken' },
      })
      const { signup } = await import('./actions')
      const formData = createFormData({
        email: 'new@test.com',
        password: '123456',
        name: 'Teste User',
      })
      const result = await signup(null, formData)
      expect(result).toEqual({ error: 'Erro ao criar conta. Tente novamente mais tarde.' })
    })
  })

  describe('recoverPassword', () => {
    it('retorna erro com email inválido', async () => {
      const { recoverPassword } = await import('./actions')
      const formData = createFormData({ email: 'invalid' })
      const result = await recoverPassword(null, formData)
      expect(result).toEqual({ error: 'Email inválido.' })
    })

    it('retorna sucesso ao enviar email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })
      const { recoverPassword } = await import('./actions')
      const formData = createFormData({ email: 'user@test.com' })
      const result = await recoverPassword(null, formData)
      expect(result).toEqual({
        success: 'Email de recuperação enviado! Verifique sua caixa de entrada.',
      })
    })

    it('retorna erro quando Supabase falha', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Rate limited' },
      })
      const { recoverPassword } = await import('./actions')
      const formData = createFormData({ email: 'user@test.com' })
      const result = await recoverPassword(null, formData)
      expect(result).toEqual({
        error: 'Erro ao enviar email de recuperação. Tente novamente.',
      })
    })
  })

  describe('signout', () => {
    it('faz logout e redireciona', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })
      const { signout } = await import('./actions')
      await expect(signout()).rejects.toThrow('NEXT_REDIRECT')
      expect(mockRedirect).toHaveBeenCalledWith('/login')
    })
  })
})
