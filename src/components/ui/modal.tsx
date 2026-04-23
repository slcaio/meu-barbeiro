'use client'

import * as React from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          {/* Modal content */}
          <div className="relative rounded-lg bg-background border border-border shadow-lg">
            {/* Modal header */}
            <div className="flex items-start justify-between rounded-t border-b border-border p-4">
              <h3 className="text-xl font-semibold text-foreground">
                {title}
              </h3>
              <button
                type="button"
                className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close modal</span>
              </button>
            </div>
            {/* Modal body */}
            <div className="p-6 space-y-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
