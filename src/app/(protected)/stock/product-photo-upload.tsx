'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 2 * 1024 * 1024

interface ProductPhotoUploadProps {
  currentPhotoUrl?: string | null
  onFileSelect: (file: File | null) => void
}

export function ProductPhotoUpload({ currentPhotoUrl, onFileSelect }: ProductPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl ?? null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setError(null)
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Formato inválido. Use JPEG, PNG ou WebP.')
      e.target.value = ''
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Imagem deve ter no máximo 2MB.')
      e.target.value = ''
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    onFileSelect(file)
  }

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    onFileSelect(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Foto do produto</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed transition-colors',
            preview
              ? 'border-transparent'
              : 'border-muted-foreground/25 bg-muted/40 hover:border-muted-foreground/50 hover:bg-muted/60'
          )}
          aria-label="Selecionar foto do produto"
        >
          {preview ? (
            <Image
              src={preview}
              alt="Preview do produto"
              fill
              className="rounded-xl object-cover"
              sizes="80px"
            />
          ) : (
            <Camera className="h-7 w-7 text-muted-foreground/50" />
          )}
        </button>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              {preview ? 'Trocar foto' : 'Adicionar foto'}
            </button>
            {preview && (
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1 text-sm text-destructive underline-offset-2 hover:underline"
                aria-label="Remover foto"
              >
                <X className="h-3.5 w-3.5" />
                Remover
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">JPEG, PNG ou WebP • máx. 2MB</p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  )
}
