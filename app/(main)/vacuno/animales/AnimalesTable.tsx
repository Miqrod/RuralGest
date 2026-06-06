'use client'

import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/DataTable'
import { formatFecha } from '@/lib/format'
import type { AnimalListItem } from '@/modules/ganadero/animales/application/listarAnimales'
import type { EstadoVital, EstadoReproductivo, EstadoSanitario } from '@/modules/ganadero/shared/domain/types'
import { EstadoVitalBadge, EstadoReproductivoBadge, EstadoSanitarioBadge } from '@/modules/ganadero/animales/ui/ficha/EstadosBadges'

const columns: ColumnDef<AnimalListItem, unknown>[] = [
  {
    accessorKey: 'crotal',
    header: 'Crotal',
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
    accessorKey: 'sexo',
    header: 'Sexo',
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
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
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumn="crotal"
      searchPlaceholder="Buscar por crotal..."
      pageSize={10}
    />
  )
}
