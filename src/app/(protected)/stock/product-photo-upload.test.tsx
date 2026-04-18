import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; fill?: boolean; sizes?: string; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

const mockObjectUrl = 'blob:http://localhost/mock-photo'

describe('ProductPhotoUpload', () => {
  const onFileSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockObjectUrl)
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza area de upload com icone de camera quando sem foto', async () => {
    const { ProductPhotoUpload } = await import('./product-photo-upload')
    render(<ProductPhotoUpload onFileSelect={onFileSelect} />)
    expect(screen.getByLabelText('Selecionar foto do produto')).toBeInTheDocument()
    expect(screen.getByText('Adicionar foto')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renderiza preview quando currentPhotoUrl e fornecido', async () => {
    const { ProductPhotoUpload } = await import('./product-photo-upload')
    render(<ProductPhotoUpload currentPhotoUrl="https://example.com/photo.jpg" onFileSelect={onFileSelect} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
    expect(screen.getByText('Trocar foto')).toBeInTheDocument()
    expect(screen.getByLabelText('Remover foto')).toBeInTheDocument()
  })

  it('chama onFileSelect com file ao selecionar arquivo valido', async () => {
    const { ProductPhotoUpload } = await import('./product-photo-upload')
    render(<ProductPhotoUpload onFileSelect={onFileSelect} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    fireEvent.change(input)
    expect(onFileSelect).toHaveBeenCalledWith(file)
  })

  it('exibe erro para tipo de arquivo invalido', async () => {
    const { ProductPhotoUpload } = await import('./product-photo-upload')
    render(<ProductPhotoUpload onFileSelect={onFileSelect} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'photo.gif', { type: 'image/gif' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    fireEvent.change(input)
    expect(screen.getByText('Formato inválido. Use JPEG, PNG ou WebP.')).toBeInTheDocument()
    expect(onFileSelect).not.toHaveBeenCalled()
  })

  it('exibe erro para arquivo acima de 2MB', async () => {
    const { ProductPhotoUpload } = await import('./product-photo-upload')
    render(<ProductPhotoUpload onFileSelect={onFileSelect} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const bigFile = new File(['x'.repeat(3 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [bigFile], configurable: true })
    fireEvent.change(input)
    expect(screen.getByText('Imagem deve ter no máximo 2MB.')).toBeInTheDocument()
    expect(onFileSelect).not.toHaveBeenCalled()
  })

  it('botao remover chama onFileSelect(null) e remove preview', async () => {
    const user = userEvent.setup()
    const { ProductPhotoUpload } = await import('./product-photo-upload')
    render(<ProductPhotoUpload currentPhotoUrl="https://example.com/photo.jpg" onFileSelect={onFileSelect} />)
    const removeBtn = screen.getByLabelText('Remover foto')
    await user.click(removeBtn)
    expect(onFileSelect).toHaveBeenCalledWith(null)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('Adicionar foto')).toBeInTheDocument()
  })
})
