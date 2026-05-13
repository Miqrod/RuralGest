'use client'

import { flexRender, type ColumnDef } from '@tanstack/react-table'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown } from 'lucide-react'

import { useDataTable } from '@/hooks/useDataTable'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function getPaginationRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const delta = 1
  const left = current - delta
  const right = current + delta

  const pages: (number | '...')[] = []

  pages.push(1)
  if (left > 2) pages.push('...')
  for (let i = Math.max(2, left); i <= Math.min(total - 1, right); i++) pages.push(i)
  if (right < total - 1) pages.push('...')
  pages.push(total)

  return pages
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  searchColumn?: string
  searchPlaceholder?: string
  pageSize?: number
}

export function DataTable<TData>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = 'Buscar...',
  pageSize = 10,
}: DataTableProps<TData>) {
  const table = useDataTable({ data, columns, pageSize })

  const { pageIndex, pageSize: ps } = table.getState().pagination
  const filteredCount = table.getFilteredRowModel().rows.length
  const from = filteredCount === 0 ? 0 : pageIndex * ps + 1
  const to = Math.min((pageIndex + 1) * ps, filteredCount)

  return (
    <div className="flex flex-col gap-4">
      {searchColumn && (
        <Input
          placeholder={searchPlaceholder}
          value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn(searchColumn)?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
      )}

      <div className="bg-canvas rounded-xl shadow-sm border border-divider/30 overflow-hidden">
        <Table>
          <TableHeader className="bg-stone-200/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-stone-100">
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const canSort = header.column.getCanSort()
                  return (
                    <TableHead
                      key={header.id}
                      className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider"
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            'flex items-center gap-1',
                            canSort && 'cursor-pointer select-none hover:text-ink transition-colors',
                          )}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            sorted === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : sorted === 'desc' ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />
                            )
                          )}
                        </button>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-stone-100 hover:bg-stone-50/50 transition-colors"
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-4 text-sm text-ink">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-sm text-ink-muted"
                >
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="px-6 py-3 flex items-center justify-between bg-stone-200/50 border-t border-stone-100">
          <span className="text-xs text-ink-muted font-medium">
            {filteredCount === 0
              ? 'Sin resultados'
              : `Mostrando ${from}–${to} de ${filteredCount}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-muted hover:bg-canvas transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPaginationRange(pageIndex + 1, table.getPageCount()).map((page, i) =>
              page === '...' ? (
                <span key={`ellipsis-${i}`} className="text-ink-muted px-1 text-xs">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => table.setPageIndex(page - 1)}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors',
                    page === pageIndex + 1
                      ? 'bg-world text-white shadow-sm'
                      : 'text-ink-muted hover:bg-canvas',
                  )}
                >
                  {page}
                </button>
              ),
            )}

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-muted hover:bg-canvas transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
