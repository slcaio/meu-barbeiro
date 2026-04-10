import { describe, it, expect } from 'vitest'
import { cn, formatPhone, formatCurrency, parseCurrency } from './utils'

describe('cn', () => {
  it('combina classes simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolve conflitos do Tailwind', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('lida com valores falsy', () => {
    expect(cn('foo', undefined, null, false, 'bar')).toBe('foo bar')
  })

  it('retorna string vazia sem argumentos', () => {
    expect(cn()).toBe('')
  })
})

describe('formatPhone', () => {
  it('retorna vazio para valor vazio', () => {
    expect(formatPhone('')).toBe('')
  })

  it('formata DDD parcial (2 dígitos)', () => {
    expect(formatPhone('11')).toBe('(11')
  })

  it('formata DDD + início (até 6 dígitos)', () => {
    expect(formatPhone('11987')).toBe('(11) 987')
  })

  it('formata telefone fixo (10 dígitos)', () => {
    expect(formatPhone('1134567890')).toBe('(11) 3456-7890')
  })

  it('formata celular (11 dígitos)', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321')
  })

  it('remove caracteres não numéricos', () => {
    expect(formatPhone('(11) 98765-4321')).toBe('(11) 98765-4321')
  })

  it('limita a 11 dígitos', () => {
    expect(formatPhone('119876543210000')).toBe('(11) 98765-4321')
  })
})

describe('formatCurrency', () => {
  it('retorna vazio para valor vazio', () => {
    expect(formatCurrency('')).toBe('')
  })

  it('formata número inteiro como centavos', () => {
    const result = formatCurrency('5000')
    expect(result).toContain('50,00')
  })

  it('formata string numérica', () => {
    const result = formatCurrency('10000')
    expect(result).toContain('100,00')
  })

  it('formata valor number', () => {
    const result = formatCurrency(3000)
    expect(result).toContain('30,00')
  })

  it('remove não-dígitos antes de formatar', () => {
    const result = formatCurrency('R$ 50,00')
    expect(result).toContain('50,00')
  })
})

describe('parseCurrency', () => {
  it('retorna 0 para valor vazio', () => {
    expect(parseCurrency('')).toBe(0)
  })

  it('converte string formatada para número', () => {
    expect(parseCurrency('R$ 50,00')).toBe(50)
  })

  it('converte string com dígitos puros', () => {
    expect(parseCurrency('5000')).toBe(50)
  })
})
