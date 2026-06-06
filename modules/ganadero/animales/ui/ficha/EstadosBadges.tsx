import { cn } from '@/lib/utils'
import type {
  EstadoVital,
  EstadoReproductivo,
  EstadoSanitario,
} from '@/modules/ganadero/shared/domain/types'

const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'

// ─── Estado Vital ─────────────────────────────────────────────────────────────

const VITAL_CONFIG: Record<EstadoVital, { label: string; className: string }> = {
  vivo:    { label: 'Vivo',    className: 'bg-success-soft text-success' },
  muerto:  { label: 'Muerto',  className: 'bg-alert-soft text-alert' },
  vendido: { label: 'Vendido', className: 'bg-surface-alt text-ink-muted' },
}

export function EstadoVitalBadge({
  estado,
  className,
}: {
  estado: EstadoVital
  className?: string
}) {
  const { label, className: colorClass } = VITAL_CONFIG[estado]
  return <span className={cn(base, colorClass, className)}>{label}</span>
}

// ─── Estado Reproductivo ──────────────────────────────────────────────────────

const REPRODUCTIVO_CONFIG: Record<EstadoReproductivo, { label: string; className: string }> = {
  gestante:         { label: 'Gestante',        className: 'bg-warning-soft text-warning' },
  lactante:         { label: 'Lactante',         className: 'bg-success-soft text-success' },
  vacia:            { label: 'Vacía',            className: 'bg-surface-alt text-ink-muted' },
  no_reproductiva:  { label: 'No reproductiva',  className: 'bg-surface-alt text-ink-muted' },
}

export function EstadoReproductivoBadge({
  estado,
  className,
}: {
  estado: EstadoReproductivo | null
  className?: string
}) {
  if (!estado) return <span className={cn(base, 'bg-surface-alt text-ink-muted', className)}>—</span>
  const { label, className: colorClass } = REPRODUCTIVO_CONFIG[estado]
  return <span className={cn(base, colorClass, className)}>{label}</span>
}

// ─── Estado Sanitario ─────────────────────────────────────────────────────────

const SANITARIO_CONFIG: Record<EstadoSanitario, { label: string; className: string }> = {
  sano:            { label: 'Sano',             className: 'bg-success-soft text-success' },
  en_observacion:  { label: 'En observación',   className: 'bg-warning-soft text-warning' },
  en_tratamiento:  { label: 'En tratamiento',   className: 'bg-alert-soft text-alert' },
  no_apto:         { label: 'No apto',          className: 'bg-alert-soft text-alert' },
}

export function EstadoSanitarioBadge({
  estado,
  className,
}: {
  estado: EstadoSanitario
  className?: string
}) {
  const { label, className: colorClass } = SANITARIO_CONFIG[estado]
  return <span className={cn(base, colorClass, className)}>{label}</span>
}
