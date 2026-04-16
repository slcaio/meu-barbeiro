'use client'

import { useFormStatus } from 'react-dom'
import { Button, type buttonVariants } from './button'
import type { VariantProps } from 'class-variance-authority'

interface SubmitButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  pendingText?: string
}

export function SubmitButton({ children, pendingText, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" isLoading={pending} disabled={pending} {...props}>
      {pending && pendingText ? pendingText : children}
    </Button>
  )
}
