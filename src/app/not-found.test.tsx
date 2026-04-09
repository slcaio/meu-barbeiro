import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('lucide-react', () => ({
  AlertCircle: () => <svg data-testid="alert-icon" />,
}))

describe('Not Found Page', () => {
  it('renderiza título de página não encontrada', async () => {
    const NotFound = (await import('./not-found')).default
    render(<NotFound />)
    expect(screen.getByText('Página não encontrada')).toBeInTheDocument()
  })

  it('renderiza mensagem explicativa', async () => {
    const NotFound = (await import('./not-found')).default
    render(<NotFound />)
    expect(screen.getByText(/A página que você está procurando/)).toBeInTheDocument()
  })

  it('renderiza link para voltar ao início', async () => {
    const NotFound = (await import('./not-found')).default
    render(<NotFound />)
    expect(screen.getByText('Voltar ao Início')).toBeInTheDocument()
  })

  it('renderiza link para login', async () => {
    const NotFound = (await import('./not-found')).default
    render(<NotFound />)
    expect(screen.getByText('Fazer Login')).toBeInTheDocument()
  })

  it('links apontam para rotas corretas', async () => {
    const NotFound = (await import('./not-found')).default
    render(<NotFound />)
    
    const links = screen.getAllByRole('link')
    const hrefs = links.map(link => link.getAttribute('href'))
    
    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/login')
  })
})
