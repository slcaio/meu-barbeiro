import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockSetTheme = vi.fn()

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: mockSetTheme }),
}))

vi.mock('lucide-react', () => ({
  Sun: () => <svg data-testid="sun-icon" />,
  Moon: () => <svg data-testid="moon-icon" />,
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear()
  })

  it('renderiza botão com aria-label correto', async () => {
    const { ThemeToggle } = await import('./theme-toggle')
    render(<ThemeToggle />)
    expect(screen.getByLabelText('Alternar tema')).toBeInTheDocument()
  })

  it('renderiza ícones Sun e Moon', async () => {
    const { ThemeToggle } = await import('./theme-toggle')
    render(<ThemeToggle />)
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
  })

  it('alterna tema ao clicar', async () => {
    const user = userEvent.setup()
    const { ThemeToggle } = await import('./theme-toggle')
    render(<ThemeToggle />)

    await user.click(screen.getByLabelText('Alternar tema'))
    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })
})
