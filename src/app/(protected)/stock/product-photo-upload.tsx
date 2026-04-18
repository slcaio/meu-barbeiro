'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_DIMENSION = 1200
const JPEG_QUALITY = 0.85
const MAX_SIZE_BYTES = 2 * 1024 * 1024

function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas não suportado')); return }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Falha ao comprimir imagem')); return }
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '.jpg'),
            { type: 'image/jpeg' }
          )
          resolve(compressed)
        },
        'image/jpeg',
        JPEG_QUALITY
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Falha ao carregar imagem'))
    }

    img.src = url
  })
}

interface ProductPhotoUploadProps {
  currentPhotoUrl?: string | null
  onFileSelect: (file: File | null) => void
}

export function ProductPhotoUpload({ currentPhotoUrl, onFileSelect }: ProductPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl ?? null)
  const [error, setError] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setError(null)
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Formato inválido. Selecione uma imagem.')
      e.target.value = ''
      return
    }

    setCompressing(true)
    try {
      const compressed = await compressImage(file)

      if (compressed.size > MAX_SIZE_BYTES) {
        setError('Imagem muito grande mesmo após compressão. Tente outra foto.')
        e.target.value = ''
        return
      }

      const objectUrl = URL.createObjectURL(compressed)
      setPreview(objectUrl)
      onFileSelect(compressed)
    } catch {
      setError('Não foi possível processar a imagem. Tente outra foto.')
      e.target.value = ''
    } finally {
      setCompressing(false)
    }
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
          {compressing ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : preview ? (
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
          <p className="text-xs text-muted-foreground">Qualquer formato de imagem • comprimido automaticamente</p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  )
}
