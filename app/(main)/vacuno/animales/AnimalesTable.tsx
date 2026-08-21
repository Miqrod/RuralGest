'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/DataTable'
import { formatFecha } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { AnimalListItem } from '@/modules/ganadero/animales/application/queries/listarAnimales'
import type { EstadoVital, EstadoReproductivo, EstadoSanitario } from '@/modules/ganadero/shared/domain/types'
import { EstadoVitalBadge, EstadoReproductivoBadge, EstadoSanitarioBadge } from '@/modules/ganadero/animales/ui/ficha/EstadosBadges'

// Configuración visual de cada botón de filtro — mismos tokens que EstadoVitalBadge
const FILTROS: { estado: EstadoVital; label: string; activeClass: string }[] = [
  { estado: 'vivo',    label: 'Vivos',    activeClass: 'bg-success-soft text-success border-success/40 shadow-sm ring-1 ring-success/20' },
  { estado: 'vendido', label: 'Vendidos', activeClass: 'bg-stone-200 dark:bg-stone-600 text-stone-700 dark:text-stone-200 border-stone-400 dark:border-stone-400 shadow-sm ring-1 ring-stone-400/30' },
  { estado: 'muerto',  label: 'Muertos',  activeClass: 'bg-alert-soft text-alert border-alert/40 shadow-sm ring-1 ring-alert/20' },
]

const columns: ColumnDef<AnimalListItem, unknown>[] = [
  {
    accessorKey: 'crotal',
    header: 'Crotal',
    // Busca en crotal Y en nombre para que el buscador sirva como campo único
    filterFn: (row, _columnId, filterValue: string) => {
      const q = filterValue.toLowerCase()
      return (
        (row.original.crotal?.toLowerCase() ?? '').includes(q) ||
        (row.original.nombre?.toLowerCase() ?? '').includes(q)
      )
    },
    cell: ({ row, getValue }) => {
      const crotal = getValue<string | null>()
      return (
        <Link
          href={`/vacuno/animales/${row.original.id}`}
          className="font-medium text-world hover:underline underline-offset-2"
        >
          {crotal ?? <span className="text-ink-muted font-normal">Sin crotal</span>}
        </Link>
      )
    },
  },
  {
    accessorKey: 'nombre',
    header: 'Nombre',
    cell: ({ getValue }) => {
      const nombre = getValue<string | null>()
      return nombre ?? <span className="text-ink-muted">—</span>
    },
  },
  {
    accessorKey: 'sexo',
    header: 'Sexo',
  },
  {
    accessorKey: 'tipo_productivo_nombre',
    header: 'Tipo productivo',
    cell: ({ getValue }) => {
      const tipo = getValue<string | null>()
      return tipo ?? <span className="text-ink-muted">—</span>
    },
  },
  {
    accessorKey: 'raza_nombre',
    header: 'Raza',
    cell: ({ getValue }) => {
      const raza = getValue<string | null>()
      return raza ?? <span className="text-ink-muted">—</span>
    },
  },
  {
    id: 'fecha_nacimiento',
    header: 'F. Nacimiento',
    accessorFn: (row) => row.fecha_nacimiento ?? row.fecha_nacimiento_estimada,
    cell: ({ getValue }) => {
      const val = getValue<string | null>()
      return val ? formatFecha(val) : <span className="text-ink-muted">—</span>
    },
  },
  {
    accessorKey: 'estado_vital',
    header: 'Estado vital',
    cell: ({ getValue }) => <EstadoVitalBadge estado={getValue<EstadoVital>()} />,
  },
  {
    accessorKey: 'estado_reproductivo',
    header: 'Reproductivo',
    cell: ({ getValue }) => <EstadoReproductivoBadge estado={getValue<EstadoReproductivo | null>()} />,
  },
  {
    accessorKey: 'estado_sanitario',
    header: 'Sanitario',
    cell: ({ getValue }) => <EstadoSanitarioBadge estado={getValue<EstadoSanitario>()} />,
  },
  {
    accessorKey: 'origen',
    header: 'Origen',
  },
]

export function AnimalesTable({ data }: { data: AnimalListItem[] }) {
  // Por defecto solo vivos. El usuario activa/desactiva cada estado de forma independiente.
  const [estadosActivos, setEstadosActivos] = useState<Set<EstadoVital>>(new Set(['vivo']))

  const toggleEstado = (estado: EstadoVital) => {
    setEstadosActivos(prev => {
      const next = new Set(prev)
      if (next.has(estado)) next.delete(estado)
      else next.add(estado)
      return next
    })
  }

  const filteredData = data.filter(a => estadosActivos.has(a.estado_vital))

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Filtros de estado vital */}
      <div className="flex items-center gap-2 mb-4">
        {FILTROS.map(({ estado, label, activeClass }) => (
          <button
            key={estado}
            onClick={() => toggleEstado(estado)}
            className={cn(
              'px-3 py-1 rounded-full text-sm font-medium border transition-colors duration-150',
              estadosActivos.has(estado)
                ? activeClass
                : 'bg-transparent text-stone-400 dark:text-stone-600 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500',
            )}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-sm text-ink-muted">
          {filteredData.length} {filteredData.length === 1 ? 'animal' : 'animales'}
        </span>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        searchColumn="crotal"
        searchPlaceholder="Buscar por crotal o nombre..."
        pageSize={10}
      />
    </motion.div>
  )
}
