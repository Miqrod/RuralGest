const LOCALE = 'es-ES'

export function formatPeso(kg: number): string {
  return `${kg.toLocaleString(LOCALE)} kg`
}

export function formatMoneda(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatFecha(date: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatFechaLarga(date: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}
