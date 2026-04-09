import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/login',
  useActionState: (action: any, initial: any) => [initial, vi.fn(), false],
}))

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useActionState: (action: any, initial: any) => [initial, vi.fn(), false],
    useTransition: () => [false, vi.fn()],
  }
})

vi.mock('@/app/auth/actions', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  recoverPassword: vi.fn(),
}))

describe('Login Page', () => {
  it('renderiza formulário de login', async () => {
    const LoginPage = (await import('./page')).default
    render(<LoginPage />)
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  it('renderiza link para cadastro', async () => {
    const LoginPage = (await import('./page')).default
    render(<LoginPage />)
    expect(screen.getByText('Cadastre-se')).toBeInTheDocument()
  })

  it('renderiza link para recuperação de senha', async () => {
    const LoginPage = (await import('./page')).default
    render(<LoginPage />)
    expect(screen.getByText('Esqueceu a senha?')).toBeInTheDocument()
  })

  it('campos de email e senha são obrigatórios', async () => {
    const LoginPage = (await import('./page')).default
    render(<LoginPage />)
    expect(screen.getByLabelText('Email')).toBeRequired()
    expect(screen.getByLabelText('Senha')).toBeRequired()
  })
})
