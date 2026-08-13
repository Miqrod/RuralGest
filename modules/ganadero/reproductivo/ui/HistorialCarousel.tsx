'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatFecha } from '@/lib/format'
import type { CicloHistorial, EventoHistorial, CriaResumen, CriaDesteteResumen } from '../application/queries/getHistorialReproductivo'
import type { ResultadoCiclo } from '../../shared/domain/types'
import { DrawerIdentificacion } from '@/modules/ganadero/animales/ui/identificacion/DrawerIdentificacion'

// ─── Badges ────────────────────────────────────────────────────────────────────

const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'

const RESULTADO_CONFIG: Record<ResultadoCiclo, { label: string; className: string }> = {
  parto:        { label: 'Parto',        className: 'bg-success-soft text-success' },
  aborto:       { label: 'Aborto',       className: 'bg-alert-soft text-alert' },
  venta:        { label: 'Venta',        className: 'bg-surface-alt text-ink-muted' },
  muerte:       { label: 'Muerte',       className: 'bg-alert-soft text-alert' },
  desconocido:  { label: 'Desconocido',  className: 'bg-surface-alt text-ink-muted' },
}

function ResultadoBadge({ resultado }: { resultado: ResultadoCiclo | null }) {
  if (!resultado) return <span className={cn(base, 'bg-blue-50 text-blue-600')}>Abierto</span>
  const { label, className } = RESULTADO_CONFIG[resultado]
  return <span className={cn(base, className)}>{label}</span>
}

function IdentificacionBadge({ estado }: { estado: 'pendiente' | 'completa' | null }) {
  if (!estado || estado === 'completa') return null
  return <span className={cn(base, 'bg-warning-soft text-warning')}>Pendiente</span>
}

const VITAL_BADGE: Record<string, { label: string; className: string }> = {
  vivo:    { label: 'Vivo',    className: 'bg-success-soft text-success' },
  vendido: { label: 'Vendido', className: 'bg-surface-alt text-ink-muted' },
  muerto:  { label: 'Muerto',  className: 'bg-alert-soft text-alert' },
}

function EstadoVitalCriaBadge({ estado, sexo }: { estado: string; sexo: string | null }) {
  const cfg = VITAL_BADGE[estado]
  if (!cfg) return null
  // Género para muerto/vendido
  const label = estado === 'muerto'
    ? (sexo === 'macho' ? 'Muerto' : 'Muerta')
    : estado === 'vendido'
      ? (sexo === 'macho' ? 'Vendido' : 'Vendida')
      : cfg.label
  return <span className={cn(base, cfg.className)}>{label}</span>
}

// ─── Evento: línea del timeline ─────────────────────────────────────────────────

const CODIGO_LABEL: Record<string, string> = {
  CUBRICION:             'Cubrición',
  CONFIRMACION_GESTACION: 'Confirmación gestación',
  PARTO:                 'Parto',
  DESTETE:               'Destete',
  ABORTO:                'Aborto',
}

const CUBRICION_TIPO_LABEL: Record<string, string> = {
  natural:       'Natural',
  inseminacion:  'Inseminación artificial',
}

const PARTO_TIPO_LABEL: Record<string, string> = {
  natural:   'Natural',
  asistido:  'Asistido',
}

const SEXO_SYMBOL: Record<string, string> = { macho: '♂', hembra: '♀' }

function CriaItem({
  cria,
  madreCrotal,
  onIdentificar,
}: {
  cria: CriaResumen
  madreCrotal: string | null
  onIdentificar: (cria: CriaResumen) => void
}) {
  const sexo   = cria.sexo ? (SEXO_SYMBOL[cria.sexo] ?? null) : null
  const base   = cria.nombre ?? cria.crotal ?? 'Sin identificar'
  const label  = sexo ? `${sexo} - ${base}` : base
  const viva = cria.estado_vital === 'vivo'
  const pendiente = viva && cria.estado_identificacion === 'pendiente'
  return (
    <li className="flex items-center gap-2 text-xs text-ink-muted">
      <span className="w-1 h-1 rounded-full bg-ink-muted/40 flex-shrink-0" />
      <Link
        href={`/vacuno/animales/${cria.id}`}
        className="hover:text-ink hover:underline transition-colors"
      >
        {label}
      </Link>
      {pendiente
        ? <IdentificacionBadge estado="pendiente" />
        : <EstadoVitalCriaBadge estado={cria.estado_vital} sexo={cria.sexo} />
      }
      {pendiente && (
        <button
          type="button"
          onClick={() => onIdentificar(cria)}
          className="ml-1 cursor-pointer text-warning underline underline-offset-2 hover:text-warning/80 transition-colors"
        >
          Identificar
        </button>
      )}
    </li>
  )
}

function EventoRow({
  evento,
  madreCrotal,
  onIdentificar,
}: {
  evento: EventoHistorial
  madreCrotal: string | null
  onIdentificar: (cria: CriaResumen) => void
}) {
  const label = CODIGO_LABEL[evento.codigo] ?? evento.codigo
  const meta  = evento.metadata

  return (
    <div className="flex gap-3 py-2.5 border-b border-divider last:border-0">
      {/* Dot de timeline */}
      <div className="flex flex-col items-center pt-1 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-ink-muted/30 border border-ink-muted/40" />
        <span className="flex-1 w-px bg-divider mt-1" />
      </div>

      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-ink">{label}</span>
          <span className="text-xs text-ink-muted">{formatFecha(evento.fecha)}</span>
        </div>

        {/* CUBRICION */}
        {evento.codigo === 'CUBRICION' && !!meta && (
          <p className="text-xs text-ink-muted mt-0.5">
            {CUBRICION_TIPO_LABEL[meta.tipo_cubricion as string] ?? (meta.tipo_cubricion as string)}
            {meta.observaciones ? ` · ${meta.observaciones as string}` : ''}
          </p>
        )}

        {/* CONFIRMACION_GESTACION */}
        {evento.codigo === 'CONFIRMACION_GESTACION' && !!meta?.observaciones && (
          <p className="text-xs text-ink-muted mt-0.5">{meta.observaciones as string}</p>
        )}

        {/* PARTO */}
        {evento.codigo === 'PARTO' && evento.parto && (
          <div className="mt-0.5">
            <p className="text-xs text-ink-muted">
              {PARTO_TIPO_LABEL[evento.parto.tipo_parto] ?? evento.parto.tipo_parto}
              {' · '}
              {evento.parto.numero_nacidos === 1
                ? '1 nacido'
                : `${evento.parto.numero_nacidos} nacidos`}
              {evento.parto.numero_muertos > 0
                ? ` (${evento.parto.numero_vivos} vivos, ${evento.parto.numero_muertos} muertos)`
                : ''}
            </p>
            {evento.parto.crias.length > 0 && (
              <ul className="mt-1.5 space-y-1">
                {evento.parto.crias.map(cria => (
                  <CriaItem key={cria.id} cria={cria} madreCrotal={madreCrotal} onIdentificar={onIdentificar} />
                ))}
              </ul>
            )}
            {evento.parto.observaciones && (
              <p className="text-xs text-ink-muted/70 mt-1 italic">{evento.parto.observaciones}</p>
            )}
          </div>
        )}

        {/* DESTETE */}
        {evento.codigo === 'DESTETE' && evento.destete && evento.destete.crias.length > 0 && (
          <ul className="mt-1.5 space-y-1">
            {evento.destete.crias.map((cria: CriaDesteteResumen) => {
              const sexo  = cria.sexo ? (SEXO_SYMBOL[cria.sexo] ?? null) : null
              const base  = cria.crotal ?? cria.nombre ?? 'Sin identificar'
              const label = sexo ? `${sexo} - ${base}` : base
              return (
                <li key={cria.id} className="flex items-center gap-2 text-xs text-ink-muted">
                  <span className="w-1 h-1 rounded-full bg-ink-muted/40 flex-shrink-0" />
                  <Link
                    href={`/vacuno/animales/${cria.id}`}
                    className="hover:text-ink hover:underline transition-colors"
                  >
                    {label}
                  </Link>
                  <span className="text-ink-muted/60">{formatFecha(cria.fecha_destete)}</span>
                </li>
              )
            })}
          </ul>
        )}

        {/* ABORTO */}
        {evento.codigo === 'ABORTO' && !!meta?.observaciones && (
          <p className="text-xs text-ink-muted mt-0.5">{meta.observaciones as string}</p>
        )}
      </div>
    </div>
  )
}

// ─── Agrupamiento de DESTETE ────────────────────────────────────────────────────
// Todos los eventos DESTETE de un ciclo se muestran como una sola fila.
// La fecha del título es la del último destete (cuando la madre quedó libre).
// Cada cría conserva su fecha individual en la lista.
function agruparDestetes(eventos: EventoHistorial[]): EventoHistorial[] {
  const destetes = eventos.filter(e => e.codigo === 'DESTETE')
  if (destetes.length <= 1) return eventos

  // El último destete por fecha es el que "cierra" la etapa — su fecha es la del título
  const ultimo = destetes.reduce((latest, e) => e.fecha >= latest.fecha ? e : latest, destetes[0])
  const criasMerged = destetes.flatMap(e => e.destete?.crias ?? [])
  const merged: EventoHistorial = { ...ultimo, destete: { crias: criasMerged } }

  // Sustituir todos los DESTETE individuales por el único entry fusionado (en la posición del último)
  let inserted = false
  return eventos.flatMap(e => {
    if (e.codigo !== 'DESTETE') return [e]
    if (e.id === ultimo.id && !inserted) { inserted = true; return [merged] }
    return []
  })
}

// ─── Carousel ───────────────────────────────────────────────────────────────────

interface Props {
  ciclos: CicloHistorial[]
  madreCrotal: string | null
  fechaPrevistaParto: string | null
}

export function HistorialCarousel({ ciclos, madreCrotal, fechaPrevistaParto }: Props) {
  const router = useRouter()
  // ciclos[0] es el más reciente (query devuelve ORDER BY numero_ciclo DESC)
  const [idx, setIdx] = useState(0)
  // Cría seleccionada para identificar; null = drawer cerrado
  const [criaSeleccionada, setCriaSeleccionada] = useState<CriaResumen | null>(null)
  const ciclo = ciclos[idx]

  return (
    <div>
      {/* Navegación entre ciclos */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIdx(i => i - 1)}
          disabled={idx === 0}
          className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Ciclo más reciente"
        >
          ← Más reciente
        </button>

        <div className="text-center">
          <span className="text-sm font-semibold text-ink">Ciclo {ciclo.numero_ciclo}</span>
          {ciclos.length > 1 && (
            <span className="block text-xs text-ink-muted">{idx + 1} de {ciclos.length}</span>
          )}
        </div>

        <button
          onClick={() => setIdx(i => i + 1)}
          disabled={idx === ciclos.length - 1}
          className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Ciclo anterior"
        >
          Anterior →
        </button>
      </div>

      {/* Cabecera del ciclo */}
      <div className="flex items-center justify-between py-2 border-b border-divider mb-1">
        <div>
          <span className="text-xs text-ink-muted">
            {formatFecha(ciclo.fecha_inicio)}
            {ciclo.fecha_fin ? ` – ${formatFecha(ciclo.fecha_fin)}` : ''}
          </span>
          {/* Fecha prevista solo visible en el ciclo abierto actual */}
          {idx === 0 && !ciclo.fecha_fin && fechaPrevistaParto && (
            <p className="text-xs text-ink-muted mt-0.5">
              Parto previsto: <span className="font-medium text-ink">{formatFecha(fechaPrevistaParto)}</span>
            </p>
          )}
        </div>
        <ResultadoBadge resultado={ciclo.resultado} />
      </div>

      {/* Eventos del ciclo — los DESTETE del mismo día se agrupan en una sola fila */}
      {ciclo.eventos.length === 0 ? (
        <p className="text-sm text-ink-muted py-3">Sin eventos registrados en este ciclo.</p>
      ) : (
        <div>
          {agruparDestetes(ciclo.eventos).map(ev => (
            <EventoRow
              key={ev.id}
              evento={ev}
              madreCrotal={madreCrotal}
              onIdentificar={setCriaSeleccionada}
            />
          ))}
        </div>
      )}

      {/* Drawer de identificación — se monta una sola vez, se controla por criaSeleccionada */}
      {criaSeleccionada && (
        <DrawerIdentificacion
          animalId={criaSeleccionada.id}
          crotal={criaSeleccionada.crotal}
          sexo={criaSeleccionada.sexo}
          estado_identificacion={criaSeleccionada.estado_identificacion}
          fecha_nacimiento={criaSeleccionada.fecha_nacimiento}
          madre_crotal={madreCrotal}
          padre_crotal={criaSeleccionada.padre_crotal}
          raza_nombre={criaSeleccionada.raza_nombre}
          estado_vital="vivo"
          open={criaSeleccionada !== null}
          onOpenChange={(open) => { if (!open) setCriaSeleccionada(null) }}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
