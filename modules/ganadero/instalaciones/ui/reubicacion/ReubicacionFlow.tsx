'use client'

import { useState, useTransition, useMemo, useRef, useEffect } from 'react'
import { parse } from 'date-fns'
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronUp, Info } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type {
  AnimalParaReubicar, InstalacionDestino, ModoReubicacion,
  RegistrarReubicacionAnimalesInput,
} from '../../domain/types'
import type { UUID } from '../../../../shared/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoToDate(iso: string): Date {
  // slice(0,10) normaliza tanto DATE ("2026-09-08") como TIMESTAMP con timezone
  return parse(iso.slice(0, 10), 'yyyy-MM-dd', new Date())
}

function formatFecha(iso: string | null): string {
  if (!iso) return '—'
  // slice(0,10) normaliza timestamps; T00:00:00 fuerza interpretación local no UTC
  return new Date(iso.slice(0, 10) + 'T00:00:00').toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function labelAnimal(a: AnimalParaReubicar): string {
  if (a.crotal && a.nombre) return `${a.crotal} · ${a.nombre}`
  return a.crotal ?? a.nombre ?? '(sin identificación)'
}

function labelSexo(sexo: string | null): string {
  if (sexo === 'macho') return 'M'
  if (sexo === 'hembra') return 'H'
  return '—'
}

// ── Tipos locales ─────────────────────────────────────────────────────────────

type SortCol = 'crotal' | 'nombre' | 'sexo' | 'tipo_productivo' | 'ubicacion' | 'fecha'

// ── Cabecera de columna ordenable ─────────────────────────────────────────────

function SortBtn({
  col, label, sortCol, sortDir, onSort, className,
}: {
  col: SortCol
  label: string
  sortCol: SortCol
  sortDir: 'asc' | 'desc'
  onSort: (col: SortCol) => void
  className?: string
}) {
  const active = sortCol === col
  const Icon = active && sortDir === 'desc' ? ChevronDown : ChevronUp
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-bold text-ink-muted uppercase tracking-wider',
        'hover:text-ink transition-colors cursor-pointer select-none',
        active && 'text-ink',
        className,
      )}
    >
      {label}
      <Icon className={cn('h-3 w-3 shrink-0', !active && 'opacity-30')} />
    </button>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  modo: ModoReubicacion
  // Pool de animales disponibles para este contexto (ya filtrados por la página).
  // Modo individual: array de 1 elemento (el animal de la ficha).
  // Modo location: animales de la instalación actual.
  // Modo pending: animales sin ubicación.
  // Modo global: todos los animales elegibles.
  animales: AnimalParaReubicar[]
  // Instalaciones elegibles: activo=true AND admite_animales=true.
  // Filtrado preventivo; el RPC vuelve a validar dentro de la transacción.
  destinos: InstalacionDestino[]
  onSuccess: () => void
  onCancel: () => void
  // Server action inyectado por el componente padre.
  // El módulo no importa de la capa app; la página pasa la acción como prop.
  submitReubicacion: (input: RegistrarReubicacionAnimalesInput) => Promise<{ error: string } | null>
  // Padding aplicado al wrapper del paso 2. Útil cuando el componente se monta
  // flush contra un borde (ej. ficha de instalación). En /instalaciones/reubicaciones
  // el contenedor padre ya aporta el padding, así que se omite.
  classNamePaso2?: string
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ReubicacionFlow({
  modo,
  animales,
  destinos,
  onSuccess,
  onCancel,
  submitReubicacion,
  classNamePaso2,
}: Props) {
  const [pending, startTransition] = useTransition()

  // Modo individual: arranca directamente en el paso 2 (selección implícita).
  const [paso, setPaso] = useState<1 | 2>(modo === 'individual' ? 2 : 1)

  // Selección de animales (paso 1).
  const [seleccionados, setSeleccionados] = useState<Set<UUID>>(() =>
    modo === 'individual' ? new Set(animales.map((a) => a.id)) : new Set(),
  )

  // Paso 2: destino y fecha (se resetean al volver al paso 1 y re-avanzar)
  const [destinoId, setDestinoId]      = useState('')
  const [fecha, setFecha]              = useState<string | undefined>(undefined)
  const [serverError, setServerError]  = useState<string | null>(null)

  // Búsqueda y filtros — solo modo global
  const [busqueda, setBusqueda]               = useState('')
  const [filtroUbicaciones, setFiltroUbicaciones] = useState<Set<string | null>>(new Set())
  const [filtroTipos, setFiltroTipos]         = useState<Set<string | null>>(new Set())

  // Ordenación de la tabla
  const [sortCol, setSortCol] = useState<SortCol>('crotal')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Panel expandible de animales seleccionados en paso 2
  const [resumenExpandido, setResumenExpandido] = useState(false)

  // Sombreado del separador sticky-left en paso 1: activo cuando hay scroll horizontal
  const paso1ScrollRef = useRef<HTMLDivElement>(null)
  const [paso1Scrolled, setPaso1Scrolled] = useState(false)
  useEffect(() => {
    const el = paso1ScrollRef.current
    if (!el) return
    const check = () => setPaso1Scrolled(el.scrollLeft > 0)
    check()
    el.addEventListener('scroll', check, { passive: true })
    return () => el.removeEventListener('scroll', check)
  }, [])

  // ── Derivados del paso 2 ──────────────────────────────────────────────────

  const animalesSeleccionados = useMemo(
    () => animales.filter((a) => seleccionados.has(a.id)),
    [animales, seleccionados],
  )

  const destinoSeleccionado = useMemo(
    () => destinos.find((d) => d.id === destinoId) ?? null,
    [destinos, destinoId],
  )

  // Animales cuya ubicación actual ya coincide con el destino → no participan.
  const animalesNoOp = useMemo(() => {
    if (!destinoId) return []
    return animalesSeleccionados.filter((a) => a.ubicacion_actual_id === destinoId)
  }, [animalesSeleccionados, destinoId])

  const animalesNoOpIds = useMemo(
    () => new Set(animalesNoOp.map((a) => a.id)),
    [animalesNoOp],
  )

  // Conjunto efectivo: los que realmente van a generar CAMBIO_UBICACION.
  const animalesEfectivos = useMemo(
    () => animalesSeleccionados.filter((a) => !animalesNoOpIds.has(a.id)),
    [animalesSeleccionados, animalesNoOpIds],
  )

  // Fecha mínima del datepicker: MAX(fecha_ultimo_cambio_ubicacion) de los efectivos.
  const minFechaStr = useMemo(() => {
    const fechas = animalesEfectivos
      .map((a) => a.fecha_ultimo_cambio_ubicacion)
      .filter((f): f is string => f !== null)
    if (fechas.length === 0) return null
    return fechas.reduce((max, f) => (f > max ? f : max))
  }, [animalesEfectivos])

  // Animal que impone la restricción de fecha (para el mensaje de aviso)
  const animalConFechaMinima = useMemo(() => {
    if (!minFechaStr) return null
    return animalesEfectivos.find((a) => a.fecha_ultimo_cambio_ubicacion === minFechaStr) ?? null
  }, [animalesEfectivos, minFechaStr])

  const minFecha = minFechaStr ? isoToDate(minFechaStr) : undefined
  const maxFecha = new Date()

  // ── Validaciones del paso 2 ───────────────────────────────────────────────

  const fechaInvalida =
    fecha !== undefined && minFechaStr !== null && fecha < minFechaStr

  const destinoEsUbicacionActualIndividual =
    modo === 'individual' &&
    destinoId !== '' &&
    (animalesSeleccionados[0]?.ubicacion_actual_id === destinoId)

  const puedeConfirmar =
    !pending &&
    destinoId !== '' &&
    fecha !== undefined &&
    !fechaInvalida &&
    !destinoEsUbicacionActualIndividual &&
    animalesEfectivos.length > 0

  // ── Handlers ──────────────────────────────────────────────────────────────

  function toggleAnimal(id: UUID) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleTodos(pool: AnimalParaReubicar[]) {
    const ids = pool.map((a) => a.id)
    const todosChecked = ids.every((id) => seleccionados.has(id))
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (todosChecked) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  function irAlPaso2() {
    // Reseteamos destino/fecha: la selección puede haber cambiado, lo que altera
    // el conjunto efectivo y por tanto el minFecha válido.
    setDestinoId('')
    setFecha(undefined)
    setServerError(null)
    setPaso(2)
  }

  function volverAlPaso1() {
    setPaso(1)
    setServerError(null)
  }

  function handleDestinoChange(val: string | null) {
    if (!val) return
    setDestinoId(val)
    // Al cambiar destino cambia el conjunto no-op y por tanto el minFecha.
    // Reseteamos la fecha para que el usuario la confirme con el nuevo mínimo.
    setFecha(undefined)
    setServerError(null)
  }

  function handleSubmit() {
    if (!puedeConfirmar) return
    setServerError(null)

    const input: RegistrarReubicacionAnimalesInput = {
      animal_ids:           animalesEfectivos.map((a) => a.id),
      ubicacion_destino_id: destinoId,
      fecha:                fecha!,
    }

    startTransition(async () => {
      const result = await submitReubicacion(input)
      if (result?.error) {
        setServerError(result.error)
      } else {
        onSuccess()
      }
    })
  }

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  // ── Valores únicos para chips de filtro (solo modo global) ────────────────

  const ubicacionesUnicas = useMemo(() => {
    if (modo !== 'global') return []
    const map = new Map<string | null, string | null>()
    for (const a of animales) {
      if (!map.has(a.ubicacion_actual_id)) {
        map.set(a.ubicacion_actual_id, a.ubicacion_actual_nombre)
      }
    }
    return [...map.entries()].sort(([aId, aName], [bId, bName]) => {
      if (aId === null) return 1   // "Sin ubicación" siempre al final
      if (bId === null) return -1
      return (aName ?? '').localeCompare(bName ?? '')
    })
  }, [animales, modo])

  const tiposUnicosProductivos = useMemo(() => {
    if (modo !== 'global') return []
    const set = new Set<string>()
    for (const a of animales) {
      if (a.tipo_productivo_nombre) set.add(a.tipo_productivo_nombre)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [animales, modo])

  function toggleFiltroUbicacion(id: string | null) {
    setFiltroUbicaciones((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleFiltroTipo(tipo: string) {
    setFiltroTipos((prev) => {
      const next = new Set(prev)
      next.has(tipo) ? next.delete(tipo) : next.add(tipo)
      return next
    })
  }

  // ── Paso 1: lista filtrada y ordenada ─────────────────────────────────────

  const animalesFiltrados = useMemo(() => {
    let pool = animales

    if (modo === 'global' && busqueda.trim()) {
      const q = busqueda.toLowerCase()
      pool = pool.filter(
        (a) =>
          a.crotal?.toLowerCase().includes(q) ||
          a.nombre?.toLowerCase().includes(q),
      )
    }

    if (modo === 'global' && filtroUbicaciones.size > 0) {
      pool = pool.filter((a) => filtroUbicaciones.has(a.ubicacion_actual_id))
    }

    if (modo === 'global' && filtroTipos.size > 0) {
      pool = pool.filter((a) => filtroTipos.has(a.tipo_productivo_nombre))
    }

    return [...pool].sort((a, b) => {
      let cmp = 0
      switch (sortCol) {
        case 'crotal':          cmp = (a.crotal ?? '').localeCompare(b.crotal ?? ''); break
        case 'nombre':          cmp = (a.nombre ?? '').localeCompare(b.nombre ?? ''); break
        case 'sexo':            cmp = (a.sexo ?? '').localeCompare(b.sexo ?? ''); break
        case 'tipo_productivo': cmp = (a.tipo_productivo_nombre ?? '').localeCompare(b.tipo_productivo_nombre ?? ''); break
        case 'ubicacion':       cmp = (a.ubicacion_actual_nombre ?? '').localeCompare(b.ubicacion_actual_nombre ?? ''); break
        case 'fecha':           cmp = (a.fecha_ultimo_cambio_ubicacion ?? '').localeCompare(b.fecha_ultimo_cambio_ubicacion ?? ''); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [animales, modo, busqueda, filtroUbicaciones, filtroTipos, sortCol, sortDir])

  const todosSeleccionados =
    animalesFiltrados.length > 0 &&
    animalesFiltrados.every((a) => seleccionados.has(a.id))

  const algunoSeleccionado =
    animalesFiltrados.some((a) => seleccionados.has(a.id))

  // ── Render paso 1 ────────────────────────────────────────────────────────

  if (paso === 1) {
    return (
      <div className="flex flex-col gap-4">

        {/* Búsqueda y filtros: solo en modo global */}
        {modo === 'global' && (
          <div className="flex flex-col gap-3">
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por crotal o nombre…"
            />

            {/* Chips de filtro por ubicación */}
            {ubicacionesUnicas.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {ubicacionesUnicas.map(([id, nombre]) => (
                  <button
                    key={id ?? '__sin_ubicacion__'}
                    type="button"
                    onClick={() => toggleFiltroUbicacion(id)}
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border transition-colors duration-150 cursor-pointer',
                      filtroUbicaciones.has(id)
                        ? 'bg-world text-white border-world'
                        : 'bg-surface-alt text-ink-muted hover:bg-surface-base border-divider/60',
                    )}
                  >
                    {nombre ?? 'Sin ubicación'}
                  </button>
                ))}
              </div>
            )}

            {/* Chips de filtro por tipo productivo */}
            {tiposUnicosProductivos.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {tiposUnicosProductivos.map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => toggleFiltroTipo(tipo)}
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border transition-colors duration-150 cursor-pointer',
                      filtroTipos.has(tipo)
                        ? 'bg-world text-white border-world'
                        : 'bg-surface-alt text-ink-muted hover:bg-surface-base border-divider/60',
                    )}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tabla de selección — <table> real: alineación de columnas garantizada por el
            algoritmo de tabla, sticky funciona nativamente en <th>/<td>.
            overflow-auto: scroll vertical (filas largas) + horizontal (columnas anchas). */}
        <div className="rounded-lg border border-divider overflow-hidden">
          <div ref={paso1ScrollRef} className="overflow-auto max-h-[60vh]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-alt border-b border-divider/50">
                  {/* Cabecera sticky-top + sticky-left (esquina): z-30 > z-20 de otras <th> sticky-top */}
                  <th
                    scope="col"
                    className={cn(
                      'sticky top-0 left-0 z-30 bg-surface-alt',
                      'px-4 py-4 text-left',
                      // Gradiente derecho: separador visual cuando hay contenido oculto a la izquierda
                      "after:content-[''] after:absolute after:top-0 after:bottom-0 after:left-full after:w-4",
                      'after:bg-gradient-to-r after:from-black/[.07] after:to-transparent after:pointer-events-none',
                      'after:transition-opacity after:duration-200',
                      paso1Scrolled ? 'after:opacity-100' : 'after:opacity-0',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={todosSeleccionados}
                        ref={(el) => {
                          if (el) el.indeterminate = algunoSeleccionado && !todosSeleccionados
                        }}
                        onChange={() => toggleTodos(animalesFiltrados)}
                        className="h-4 w-4 rounded border-divider cursor-pointer shrink-0 [accent-color:var(--color-world)]"
                      />
                      <SortBtn col="crotal" label="Animal" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    </div>
                  </th>
                  <th scope="col" className="sticky top-0 z-20 bg-surface-alt px-4 py-4 text-left">
                    <SortBtn col="tipo_productivo" label="Tipo productivo" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  {modo !== 'pending' && (
                    <th scope="col" className="sticky top-0 z-20 bg-surface-alt px-4 py-4 text-center">
                      <SortBtn col="sexo" label="Sexo" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="justify-center" />
                    </th>
                  )}
                  {modo === 'global' && (
                    <th scope="col" className="sticky top-0 z-20 bg-surface-alt px-4 py-4 text-left">
                      <SortBtn col="ubicacion" label="Ubicación actual" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    </th>
                  )}
                  {modo !== 'pending' && (
                    <th scope="col" className="sticky top-0 z-20 bg-surface-alt px-4 py-4 text-right">
                      <SortBtn col="fecha" label="Fecha último cambio" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="justify-end" />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/30">
                {animalesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={99} className="px-4 py-8 text-sm text-ink-muted text-center">
                      No se encontraron animales.
                    </td>
                  </tr>
                ) : (
                  animalesFiltrados.map((a) => (
                    // group: las celdas sticky reaccionan al hover de la fila
                    <tr
                      key={a.id}
                      onClick={() => toggleAnimal(a.id)}
                      className="hover:bg-surface-row-hover transition-colors cursor-pointer select-none group"
                    >
                      {/* Sticky-left: checkbox + Animal.
                          stopPropagation en el <input> (no en el <td>) evita doble-toggle al
                          hacer clic en el checkbox, pero permite que el clic en cualquier
                          otra parte de la celda burbujee hasta el <tr> y seleccione la fila. */}
                      <td
                        className={cn(
                          'sticky left-0 z-10 bg-canvas group-hover:bg-surface-row-hover transition-colors',
                          'px-4 py-3',
                          "after:content-[''] after:absolute after:top-0 after:bottom-0 after:left-full after:w-4",
                          'after:bg-gradient-to-r after:from-black/[.07] after:to-transparent after:pointer-events-none',
                          'after:transition-opacity after:duration-200',
                          paso1Scrolled ? 'after:opacity-100' : 'after:opacity-0',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={seleccionados.has(a.id)}
                            onChange={() => toggleAnimal(a.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 rounded border-divider cursor-pointer shrink-0 [accent-color:var(--color-world)]"
                          />
                          <div className="min-w-0">
                            <p className="text-sm text-ink">
                              <span className="font-medium">
                                {a.crotal ?? <span className="italic text-ink-muted">Sin crotal</span>}
                              </span>
                              {a.nombre && (
                                <span className="text-ink-muted"> · {a.nombre}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-muted whitespace-nowrap">
                        {a.tipo_productivo_nombre ?? '—'}
                      </td>
                      {modo !== 'pending' && (
                        <td className="px-4 py-3 text-xs text-ink-muted text-center">
                          {labelSexo(a.sexo)}
                        </td>
                      )}
                      {modo === 'global' && (
                        <td className="px-4 py-3 text-xs text-ink-muted whitespace-nowrap">
                          {a.ubicacion_actual_nombre ?? <span className="italic">Sin ubicación</span>}
                        </td>
                      )}
                      {modo !== 'pending' && (
                        <td className="px-4 py-3 text-xs text-ink-muted tabular-nums text-right whitespace-nowrap">
                          {formatFecha(a.fecha_ultimo_cambio_ubicacion)}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer persistente: siempre visible al estar fuera del scroll de la tabla */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-surface-alt border border-divider/60 rounded-xl shadow-sm">
          <span className="text-sm text-ink-muted">
            {seleccionados.size === 0
              ? 'Selecciona al menos un animal'
              : `${seleccionados.size} ${seleccionados.size === 1 ? 'animal seleccionado' : 'animales seleccionados'}`
            }
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={irAlPaso2}
              disabled={seleccionados.size === 0}
            >
              Reubicar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Render paso 2 ─────────────────────────────────────────────────────────

  // Nombre del destino seleccionado para mostrar en el trigger del Select.
  // SelectValue de Base UI muestra el value (UUID) en lugar del ItemText cuando el
  // portal del dropdown aún no está montado, así que lo resolvemos nosotros mismos.
  const destinoNombreActual = destinoId
    ? destinos.find((d) => d.id === destinoId)?.nombre ?? null
    : null

  return (
    <div className={cn('flex flex-col gap-5 [container-type:inline-size]', classNamePaso2)}>

      {/* Volver al paso 1 — no en modo individual (no existe paso 1) */}
      {modo !== 'individual' && (
        <button
          type="button"
          onClick={volverAlPaso1}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors self-start cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a la selección
        </button>
      )}

      {/* Modo individual: bloque informativo con ubicación y última fecha conocida.
          Modo multi-selección: resumen expandible de los animales seleccionados. */}
      {modo === 'individual' ? (
        (() => {
          const animal = animalesSeleccionados[0]
          return (
            <div className="rounded-lg border border-divider/60 bg-surface-alt/50 px-4 py-3 text-sm text-ink-muted">
              <span>Ubicación actual: </span>
              <span className="font-medium text-ink">
                {animal?.ubicacion_actual_nombre ?? <span className="italic">Sin ubicación</span>}
              </span>
              {animal?.fecha_ultimo_cambio_ubicacion && (
                <span className="tabular-nums">
                  {' '}(desde: {formatFecha(animal.fecha_ultimo_cambio_ubicacion)})
                </span>
              )}
            </div>
          )
        })()
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setResumenExpandido((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors self-start cursor-pointer"
          >
            <span>
              {animalesSeleccionados.length}{' '}
              {animalesSeleccionados.length === 1 ? 'animal seleccionado' : 'animales seleccionados'}
            </span>
            {resumenExpandido
              ? <ChevronUp className="h-4 w-4 shrink-0" />
              : <ChevronDown className="h-4 w-4 shrink-0" />
            }
          </button>

          {resumenExpandido && (
            <ul className="pl-5 flex flex-col gap-0.5">
              {animalesSeleccionados.map((a) => (
                <li key={a.id} className="text-xs text-ink-muted">
                  <span className="font-medium text-ink">{a.crotal ?? '—'}</span>
                  <span> · {a.nombre ?? <span className="italic">(sin nombre)</span>}</span>
                  {a.ubicacion_actual_nombre && <span> · {a.ubicacion_actual_nombre}</span>}
                  {a.fecha_ultimo_cambio_ubicacion && <span> · {formatFecha(a.fecha_ultimo_cambio_ubicacion)}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Fecha + Destino: 2 columnas cuando el contenedor lo permite, cada una con su aviso ── */}
      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 items-start">

        {/* ── Columna izquierda: siempre presente (DatePicker visible aunque animalesEfectivos === 0).
            Se oculta solo en modo individual cuando destino = ubicación actual, único caso
            en que mostrar una fecha no tiene ningún sentido. */}
        <div className="flex flex-col gap-2">
          {!destinoEsUbicacionActualIndividual && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">Fecha de reubicación</label>
                <DatePicker
                  value={fecha}
                  onChange={setFecha}
                  placeholder="Selecciona una fecha"
                  minDate={minFecha}
                  maxDate={maxFecha}
                />
              </div>

              {/* Aviso cuando la fecha cae por debajo del mínimo.
                  Ocurre si el usuario vuelve al paso 1, cambia la selección de animales,
                  y avanza con una fecha que ya no es válida para el nuevo conjunto. */}
              {fechaInvalida && animalConFechaMinima && (
                <div className={cn(
                  'rounded-lg border border-warning bg-warning-soft',
                  'px-3 py-2.5 flex items-start gap-2 text-sm text-warning',
                )}>
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">La fecha seleccionada ya no es válida.</p>
                    <p className="text-xs mt-0.5">
                      {labelAnimal(animalConFechaMinima)} tiene como último cambio de ubicación
                      el {formatFecha(animalConFechaMinima.fecha_ultimo_cambio_ubicacion)}.
                      Selecciona una fecha igual o posterior.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Columna derecha: Destino + desglose/avisos asociados ── */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Destino</label>
            <Select value={destinoId} onValueChange={handleDestinoChange}>
              <SelectTrigger className="w-full">
                <span className={cn(
                  'flex flex-1 text-left text-sm',
                  !destinoNombreActual && 'text-muted-foreground',
                )}>
                  {destinoNombreActual ?? 'Selecciona la instalación de destino'}
                </span>
              </SelectTrigger>
              <SelectContent>
                {destinos
                  // En modo individual excluimos la instalación actual del Select
                  .filter((d) => modo !== 'individual' || d.id !== animalesSeleccionados[0]?.ubicacion_actual_id)
                  .map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desglose efectivos / no-op — solo en multi-selección con destino elegido */}
          {destinoId && modo !== 'individual' && (
            <div className="rounded-lg border border-divider overflow-hidden text-sm">

              {animalesEfectivos.length > 0 && (
                <div className="px-4 py-3 flex flex-col gap-1.5">
                  <p className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                    <span aria-hidden>✓</span>
                    {animalesEfectivos.length}{' '}
                    {animalesEfectivos.length === 1 ? 'animal se reubicará' : 'animales se reubicarán'}
                  </p>
                  <ul className="pl-5 flex flex-col gap-0.5">
                    {animalesEfectivos.map((a) => (
                      <li key={a.id} className="text-xs text-ink-muted">
                        <span className="font-medium text-ink">{a.crotal ?? '—'}</span>
                        <span> · {a.nombre ?? <span className="italic">(sin nombre)</span>}</span>
                        {a.ubicacion_actual_nombre && destinoSeleccionado && (
                          <span className="text-ink-muted/70"> ({a.ubicacion_actual_nombre} → {destinoSeleccionado.nombre})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {animalesEfectivos.length > 0 && animalesNoOp.length > 0 && (
                <div className="h-px bg-divider/50" />
              )}

              {animalesNoOp.length > 0 && (
                <div className="px-4 py-3 flex flex-col gap-1.5 bg-surface-alt/50">
                  <p className="flex items-center gap-1.5 text-ink-muted">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    {animalesNoOp.length}{' '}
                    {animalesNoOp.length === 1 ? 'animal ya se encuentra' : 'animales ya se encuentran'}{' '}
                    en <span className="font-medium">{destinoSeleccionado?.nombre}</span>
                  </p>
                  <ul className="pl-5 flex flex-col gap-0.5">
                    {animalesNoOp.map((a) => (
                      <li key={a.id} className="text-xs text-ink-muted">
                        <span className="font-medium text-ink">{a.crotal ?? '—'}</span>
                        <span> · {a.nombre ?? <span className="italic">(sin nombre)</span>}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Caso extremo: todos son no-op */}
              {animalesEfectivos.length === 0 && (
                <div className="px-4 py-3 text-sm text-center text-ink-muted">
                  Todos los animales ya se encuentran en {destinoSeleccionado?.nombre}.
                  Selecciona un destino diferente.
                </div>
              )}
            </div>
          )}

          {/* Aviso modo individual: destino = ubicación actual (safety net) */}
          {destinoEsUbicacionActualIndividual && (
            <div className="rounded-lg border border-warning bg-warning-soft px-4 py-3 flex items-start gap-2.5 text-sm text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>El animal ya se encuentra en esta instalación. Selecciona una ubicación diferente.</span>
            </div>
          )}
        </div>

      </div>

      {/* Error del servidor */}
      {serverError && (
        <p role="alert" className="text-sm text-alert">{serverError}</p>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!puedeConfirmar}
        >
          {pending
            ? 'Reubicando…'
            : modo === 'individual'
              ? 'Confirmar reubicación'
              : `Reubicar ${animalesEfectivos.length} ${animalesEfectivos.length === 1 ? 'animal' : 'animales'}`
          }
        </Button>
      </div>
    </div>
  )
}
