'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/DataTable'
import { formatFecha } from '@/lib/format'
import type { AnimalListItem } from '@/modules/ganadero/animales/application/listarAnimales'

const columns: ColumnDef<AnimalListItem, unknown>[] = [
  {
    accessorKey: 'crotal',
    header: 'Crotal',
    cell: ({ getValue }) => getValue<string | null>() ?? <span className="text-ink-muted">—</span>,
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
  },
  {
    accessorKey: 'estado_reproductivo',
    header: 'Reproductivo',
    cell: ({ getValue }) => getValue<string | null>() ?? <span className="text-ink-muted">—</span>,
  },
  {
    accessorKey: 'estado_sanitario',
    header: 'Sanitario',
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
