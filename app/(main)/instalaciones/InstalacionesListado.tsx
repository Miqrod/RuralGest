'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion } from 'framer-motion'

// Client Component → dynamic con ssr:false permitido directamente aquí
const MapaInstalaciones = dynamic(
  () => import('@/modules/ganadero/instalaciones/ui/mapa/MapaInstalaciones'),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="text-sm text-ink-muted">Cargando mapa…</span>
      </div>
    ),
  }
)
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/DataTable'
import type { InstalacionListItem } from '@/modules/ganadero/instalaciones/domain/types'
import type { TipoInstalacion } from '@/modules/ganadero/shared/domain/types'

const TIPO_LABELS: Record<TipoInstalacion, string> = {
  corral:  'Corral',
  nave:    'Nave',
  prado:   'Prado',
  cercado: 'Cercado',
  almacen: 'Almacén',
  otro:    'Otro',
}

const columns: ColumnDef<InstalacionListItem, unknown>[] = [
  {
    accessorKey: 'nombre',
    header: 'Instalación',
    cell: ({ row, getValue }) => (
      <Link
        href={`/instalaciones/${row.original.id}`}
        className="font-medium text-world hover:underline underline-offset-2"
      >
        {getValue<string>()}
      </Link>
    ),
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ getValue }) => TIPO_LABELS[getValue<TipoInstalacion>()],
  },
  {
    accessorKey: 'num_animales',
    header: 'Animales',
    cell: ({ getValue }) => (
      <span className="tabular-nums">{getValue<number>()}</span>
    ),
  },
  {
    id: 'usos',
    header: 'Usos',
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.admite_animales && (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            Animales
          </span>
        )}
        {row.original.admite_stock && (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            Stock
          </span>
        )}
        {!row.original.admite_animales && !row.original.admite_stock && (
          <span className="text-xs text-ink-muted">—</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'activo',
    header: 'Estado',
    cell: ({ getValue }) =>
      getValue<boolean>() ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Activa
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Inactiva
        </span>
      ),
  },
]

interface Props {
  data: InstalacionListItem[]
}

export function InstalacionesListado({ data }: Props) {
  return (
    <div>
      {/* Mapa — altura en style para evitar dependencia del JIT de Tailwind */}
      <div style={{ height: '360px', marginBottom: '2rem' }} className="rounded-xl overflow-hidden border border-divider shadow-sm">
        <MapaInstalaciones instalaciones={data} />
      </div>

      {/* Tabla con animación de entrada */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="sm:w-8/12 sm:mx-auto 2xl:w-full"
      >
        <DataTable
          columns={columns}
          data={data}
          pageSize={10}
          getRowClassName={(row) => !row.activo ? 'bg-alert-soft/50 hover:bg-alert-soft/70' : undefined}
        />
      </motion.div>
    </div>
  )
}
