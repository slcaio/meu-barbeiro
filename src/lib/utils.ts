import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhone(value: string) {
  if (!value) return ""
  
  // Remove non-numeric characters
  const numbers = value.replace(/\D/g, "")
  
  // Format as (XX) XXXXX-XXXX or (XX) XXXX-XXXX
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
  } else {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
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
