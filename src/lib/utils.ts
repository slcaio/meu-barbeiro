import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhone(value: string) {
  if (!value) return ""
  
  // Remove non-numeric characters and limit to 11 digits
  let numbers = value.replace(/\D/g, "").slice(0, 11)
  
  // Format based on length
  if (numbers.length <= 2) {
    return numbers.length > 0 ? `(${numbers}` : numbers
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  } else if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
  } else {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
  }
}

export const formatCurrency = (value: string | number) => {
  if (!value) return ''
  
  // Remove non-digits
  const numericValue = value.toString().replace(/\D/g, '')
  
  // Convert to decimal (cents)
  const floatValue = parseFloat(numericValue) / 100
  
  if (isNaN(floatValue)) return ''
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(floatValue)
}

export const parseCurrency = (value: string) => {
  if (!value) return 0
  const digits = value.replace(/\D/g, '')
  return parseFloat(digits) / 100
}

export function formatCPF(value: string) {
  if (!value) return ''

  const numbers = value.replace(/\D/g, '').slice(0, 11)

  if (numbers.length <= 3) return numbers
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`
}
