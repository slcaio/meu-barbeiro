import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('lucide-react', () => ({
  Scissors: () => <svg data-testid="scissors-icon" />,
}))

describe('Landing Page', () => {
  it('renderiza título principal', async () => {
    const LandingPage = (await import('./page')).default
    render(<LandingPage />)
    expect(screen.getByText(/Gerencie sua barbearia/)).toBeInTheDocument()
  })

  it('renderiza nome da marca', async () => {
    const LandingPage = (await import('./page')).default
    render(<LandingPage />)
    expect(screen.getByText('Meu Barbeiro')).toBeInTheDocument()
  })

  it('renderiza link para login', async () => {
    const LandingPage = (await import('./page')).default
    render(<LandingPage />)
    const loginLinks = screen.getAllByText('Entrar')
    expect(loginLinks.length).toBeGreaterThan(0)
  })

  it('renderiza link para cadastro', async () => {
    const LandingPage = (await import('./page')).default
    render(<LandingPage />)
    const registerLinks = screen.getAllByText(/Cadastrar|Começar Agora/)
    expect(registerLinks.length).toBeGreaterThan(0)
  })

  it('renderiza descrição do produto', async () => {
    const LandingPage = (await import('./page')).default
    render(<LandingPage />)
    expect(screen.getByText(/Agendamentos, controle financeiro/)).toBeInTheDocument()
  })

  it('renderiza footer com copyright', async () => {
    const LandingPage = (await import('./page')).default
    render(<LandingPage />)
    expect(screen.getByText(/Meu Barbeiro. Todos os direitos reservados/)).toBeInTheDocument()
  })

  it('links apontam para rotas corretas', async () => {
    const LandingPage = (await import('./page')).default
    render(<LandingPage />)
    
    const links = screen.getAllByRole('link')
    const hrefs = links.map(link => link.getAttribute('href'))
    
    expect(hrefs).toContain('/login')
    expect(hrefs).toContain('/register')
  })
})
