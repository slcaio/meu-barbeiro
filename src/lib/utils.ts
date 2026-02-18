import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatPhone = (value: string) => {
  if (!value) return ""
  
  // Remove all non-digit characters
  const numbers = value.replace(/\D/g, "")
  
  // Limit to 11 digits
  const truncated = numbers.slice(0, 11)
  
  if (truncated.length <= 2) return truncated
  if (truncated.length <= 6) return `(${truncated.slice(0, 2)}) ${truncated.slice(2)}`
  if (truncated.length <= 10) return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 6)}-${truncated.slice(6)}`
  return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 7)}-${truncated.slice(7)}`
}
