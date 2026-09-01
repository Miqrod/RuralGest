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

// Convierte ISODate o ISOTimestamp a Date local, sin conversión UTC.
// Toma solo los primeros 10 caracteres (YYYY-MM-DD) para ser robusto frente a
// columnas TIMESTAMP que Supabase devuelve como '2026-07-15T10:30:00+00:00'.
export function isoStringToDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatFechaLarga(date: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}
