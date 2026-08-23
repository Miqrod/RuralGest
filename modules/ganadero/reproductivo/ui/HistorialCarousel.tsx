'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatFecha } from '@/lib/format'
import type { CicloHistorial, EventoHistorial, CriaResumen, CriaDesteteResumen } from '../application/queries/getHistorialReproductivo'
import type { ResultadoCiclo, EstadoVital } from '../../shared/domain/types'
import type { ISODate } from '@/modules/shared/types'
import { DrawerIdentificacion } from '@/modules/ganadero/animales/ui/identificacion/DrawerIdentificacion'

// ─── Badges ────────────────────────────────────────────────────────────────────

const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'

const RESULTADO_CONFIG: Record<ResultadoCiclo, { label: string; className: string }> = {
  parto:        { label: 'Parto',         className: 'bg-success-soft text-success'  },
  aborto:       { label: 'Aborto',        className: 'bg-alert-soft text-alert'      },
  machorra:     { label: 'Machorra',      className: 'bg-surface-alt text-ink-muted' },
  cierre_manual:{ label: 'Cierre manual', className: 'bg-surface-alt text-ink-muted' },
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
  CAMBIO_TIPO_PRODUCTIVO: 'Paso a no reproductora',
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
  const label        = CODIGO_LABEL[evento.codigo] ?? evento.codigo
  const meta         = evento.metadata
  const esCambioTipo = evento.codigo === 'CAMBIO_TIPO_PRODUCTIVO'

  return (
    <div className="flex gap-3 py-2.5 border-b border-divider last:border-0">
      {/* Dot de timeline */}
      <div className="flex flex-col items-center pt-1 flex-shrink-0">
        <span className={cn(
          'w-2 h-2 rounded-full border',
          esCambioTipo
            ? 'bg-alert/40 border-alert/60'
            : 'bg-ink-muted/30 border-ink-muted/40',
        )} />
        <span className="flex-1 w-px bg-divider mt-1" />
      </div>

      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-baseline gap-2">
          <span className={cn('text-sm font-medium', esCambioTipo ? 'text-alert' : 'text-ink')}>{label}</span>
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

// ─── Entrada sintética de cierre manual ─────────────────────────────────────────
// Cuando un ciclo se cerró por cambio de tipo productivo (resultado='cierre_manual'),
// se inyecta una entrada sintética con la fecha del cierre para que aparezca ordenada
// cronológicamente junto al resto de eventos del ciclo.
// Importante: si hubiera eventos posteriores al cierre (ej. gestante → parto tardío),
// la entrada se insertaría en la posición temporal correcta, NO siempre al final.

type EntradaCiclo =
  | { tipo: 'real';          evento: EventoHistorial }
  | { tipo: 'cierre_manual'; fecha: string }

function buildEntradasOrdenadas(
  ciclo: CicloHistorial,
): EntradaCiclo[] {
  const entradas: EntradaCiclo[] = agruparDestetes(ciclo.eventos)
    .map(ev => ({ tipo: 'real' as const, evento: ev }))

  // Entrada sintética de cierre_manual solo para ciclos antiguos sin evento real vinculado.
  // Los ciclos creados con la nueva versión del RPC tienen ya el evento CAMBIO_TIPO_PRODUCTIVO
  // ligado al ciclo (ciclo_id), por lo que EventoRow lo renderiza directamente.
  const tieneEventoCambioTipo = ciclo.eventos.some(e => e.codigo === 'CAMBIO_TIPO_PRODUCTIVO')
  if (ciclo.resultado === 'cierre_manual' && ciclo.fecha_fin && !tieneEventoCambioTipo) {
    entradas.push({ tipo: 'cierre_manual' as const, fecha: ciclo.fecha_fin })
    // Ordenar por fecha para mantener la cronología del timeline
    entradas.sort((a, b) => {
      const fa = a.tipo === 'real' ? a.evento.fecha : a.fecha
      const fb = b.tipo === 'real' ? b.evento.fecha : b.fecha
      return fa <= fb ? -1 : 1
    })
  }

  return entradas
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
  ciclos:             CicloHistorial[]
  madreCrotal:        string | null
  fechaPrevistaParto: string | null
  // Necesarios para la anotación contextual en animales vendidos/fallecidos
  estadoVital:        EstadoVital
  fechaSalida:        ISODate | null
}

export function HistorialCarousel({ ciclos, madreCrotal, fechaPrevistaParto, estadoVital, fechaSalida }: Props) {
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
        {/* Ciclo más reciente (menor idx). Muestra "Actual" cuando ya estamos en el más reciente. */}
        <button
          onClick={() => setIdx(i => i - 1)}
          disabled={idx === 0}
          className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink disabled:opacity-50 disabled:cursor-default transition-colors min-w-[80px]"
          aria-label={idx > 0 ? `Ir a Ciclo ${ciclos[idx - 1].numero_ciclo}` : 'Ciclo actual'}
        >
          {idx === 0
            ? 'Actual'
            : <><span>{'<<'}</span> C{ciclos[idx - 1].numero_ciclo}</>
          }
        </button>

        <div className="text-center">
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-surface-alt text-ink-muted">
            Ciclo {ciclo.numero_ciclo}
          </span>
          {ciclos.length > 1 && (
            <span className="block text-xs text-ink-muted mt-0.5">{idx + 1} de {ciclos.length}</span>
          )}
        </div>

        {/* Ciclo anterior (mayor idx). Invisible cuando ya estamos en el más antiguo. */}
        <button
          onClick={() => setIdx(i => i + 1)}
          disabled={idx === ciclos.length - 1}
          className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink disabled:opacity-0 disabled:cursor-default transition-colors min-w-[80px] justify-end"
          aria-label={idx < ciclos.length - 1 ? `Ir a Ciclo ${ciclos[idx + 1].numero_ciclo}` : undefined}
        >
          C{ciclos[idx + 1]?.numero_ciclo ?? ''} {'>>'}
        </button>
      </div>

      {/* Cabecera del ciclo */}
      <div className="flex items-center justify-between py-2 border-b border-divider mb-1">
        <div>
          <span className="text-xs text-ink-muted">
            {formatFecha(ciclo.fecha_inicio)}
            {ciclo.fecha_fin ? ` – ${formatFecha(ciclo.fecha_fin)}` : ''}
          </span>
          {/* Fecha prevista solo visible en el ciclo abierto actual de un animal vivo */}
          {idx === 0 && !ciclo.fecha_fin && fechaPrevistaParto && estadoVital === 'vivo' && (
            <p className="text-xs text-ink-muted mt-0.5">
              Parto previsto: <span className="font-medium text-ink">{formatFecha(fechaPrevistaParto)}</span>
            </p>
          )}
          {/* Anotación contextual: ciclo abierto en animal vendido o fallecido.
              El ciclo quedó sin cerrar porque la salida ya no cierra ciclos propios.
              fechaSalida se usa como referencia temporal de la historia reproductiva. */}
          {!ciclo.fecha_fin && !ciclo.resultado && estadoVital !== 'vivo' && (
            <p className="text-xs text-alert mt-0.5">
              Animal {estadoVital === 'vendido' ? 'vendido' : 'fallecido'} · Historia reproductiva finalizada
              {fechaSalida ? ` · ${formatFecha(fechaSalida)}` : ''}
            </p>
          )}
        </div>
        <ResultadoBadge resultado={ciclo.resultado} />
      </div>

      {/* Eventos del ciclo — incluye entrada sintética de cierre manual si aplica */}
      {(() => {
        const entradas = buildEntradasOrdenadas(ciclo)
        if (entradas.length === 0) {
          return <p className="text-sm text-ink-muted py-3">Sin eventos registrados en este ciclo.</p>
        }
        return (
          <div>
            {entradas.map((entrada, i) => {
              if (entrada.tipo === 'real') {
                return (
                  <EventoRow
                    key={entrada.evento.id}
                    evento={entrada.evento}
                    madreCrotal={madreCrotal}
                    onIdentificar={setCriaSeleccionada}
                  />
                )
              }
              // Entrada sintética: mismo layout que EventoRow pero con texto en rojo
              return (
                <div key={`cierre-manual-${i}`} className="flex gap-3 py-2.5 border-b border-divider last:border-0">
                  <div className="flex flex-col items-center pt-1 flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-alert/40 border border-alert/60" />
                    <span className="flex-1 w-px bg-divider mt-1" />
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-alert">Paso a no reproductora</span>
                      <span className="text-xs text-ink-muted">{formatFecha(entrada.fecha)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

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
