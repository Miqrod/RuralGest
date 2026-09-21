'use client'

import { flexRender, type ColumnDef, type RowData } from '@tanstack/react-table'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown } from 'lucide-react'

// Extensión del tipo meta de columna para soporte de alineación
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'center' | 'right'
    // Ancla la columna al borde izquierdo del scroll. El offset left se calcula
    // sumando los getSize() de las columnas sticky anteriores.
    // 'right' ancla al borde derecho (para columnas de acciones al final).
    sticky?: boolean | 'right'
  }
}

import { useRef, useState, useEffect } from 'react'
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
  getRowClassName?: (row: TData) => string | undefined
  // Fondo de las celdas sticky cuando la fila tiene un color especial.
  // Debe ser sólido (sin transparencia) para que no se vea el contenido al hacer scroll.
  getRowStickyClassName?: (row: TData) => string | undefined
}

export function DataTable<TData>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = 'Buscar...',
  pageSize = 10,
  getRowClassName,
  getRowStickyClassName,
}: DataTableProps<TData>) {
  const table = useDataTable({ data, columns, pageSize })

  const { pageIndex, pageSize: ps } = table.getState().pagination
  const filteredCount = table.getFilteredRowModel().rows.length
  const from = filteredCount === 0 ? 0 : pageIndex * ps + 1
  const to = Math.min((pageIndex + 1) * ps, filteredCount)

  // Detecta scroll horizontal para mostrar/ocultar los gradientes de columnas sticky.
  // isScrolled: hay contenido a la izquierda oculto por columnas sticky-left.
  // hasRightScroll: hay contenido a la derecha oculto por columnas sticky-right.
  const tableWrapperRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [hasRightScroll, setHasRightScroll] = useState(false)
  useEffect(() => {
    const scrollEl = tableWrapperRef.current?.querySelector('[data-slot="table-container"]') as HTMLElement | null
    if (!scrollEl) return
    const checkScroll = () => {
      setIsScrolled(scrollEl.scrollLeft > 0)
      setHasRightScroll(scrollEl.scrollLeft < scrollEl.scrollWidth - scrollEl.clientWidth - 1)
    }
    checkScroll() // estado inicial: detecta si la tabla ya desborda antes del primer scroll
    scrollEl.addEventListener('scroll', checkScroll, { passive: true })
    return () => scrollEl.removeEventListener('scroll', checkScroll)
  }, [])

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

      <div ref={tableWrapperRef} className="bg-canvas rounded-xl shadow-sm border border-divider/30 overflow-hidden">
        <Table>
          <TableHeader className="bg-surface-alt">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-divider/30">
                {headerGroup.headers.map((header, headerIdx) => {
                  const sorted         = header.column.getIsSorted()
                  const canSort        = header.column.getCanSort()
                  const stickyMeta     = header.column.columnDef.meta?.sticky
                  // Diferenciamos explícitamente sticky-left (true) de sticky-right ('right')
                  const isSticky       = stickyMeta === true
                  const isStickyRight  = stickyMeta === 'right'

                  // Última columna sticky-left: recibe gradiente derecho como separador
                  const isLastSticky      = isSticky && headerGroup.headers[headerIdx + 1]?.column.columnDef.meta?.sticky !== true
                  // Primera columna sticky-right: recibe gradiente izquierdo como separador
                  const isFirstStickyRight = isStickyRight && headerGroup.headers[headerIdx - 1]?.column.columnDef.meta?.sticky !== 'right'

                  // Acumula el ancho de las columnas sticky-left anteriores
                  let stickyLeft = 0
                  if (isSticky) {
                    for (let i = 0; i < headerIdx; i++) {
                      if (headerGroup.headers[i].column.columnDef.meta?.sticky === true) {
                        stickyLeft += headerGroup.headers[i].column.getSize()
                      }
                    }
                  }

                  // Acumula el ancho de las columnas sticky-right posteriores
                  let stickyRight = 0
                  if (isStickyRight) {
                    for (let i = headerIdx + 1; i < headerGroup.headers.length; i++) {
                      if (headerGroup.headers[i].column.columnDef.meta?.sticky === 'right') {
                        stickyRight += headerGroup.headers[i].column.getSize()
                      }
                    }
                  }

                  // minWidth solo si el tamaño fue definido explícitamente — permite auto-sizing
                  const headerExplicitSize = header.column.columnDef.size

                  return (
                    <TableHead
                      key={header.id}
                      // left/right son valores dinámicos de posicionamiento — inline style justificado
                      style={
                        isSticky      ? { left: stickyLeft, ...(headerExplicitSize !== undefined ? { minWidth: headerExplicitSize } : {}) } :
                        isStickyRight ? { right: stickyRight, ...(headerExplicitSize !== undefined ? { minWidth: headerExplicitSize } : {}) } :
                        undefined
                      }
                      className={cn(
                        'px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider',
                        // Sticky: fondo sólido + z-index explícito para cubrir columnas que pasan por debajo
                        (isSticky || isStickyRight) && 'sticky z-20 bg-surface-alt',
                        // No-sticky: relative+z-0 los hace participar en el sistema z-index,
                        // garantizando que pierden frente a z-20 de las columnas sticky
                        !isSticky && !isStickyRight && 'relative z-0',
                        // Gradiente derecho via ::after — separador de la última columna sticky-left
                        isLastSticky && cn(
                          "after:content-[''] after:absolute after:top-0 after:bottom-0 after:left-full after:w-4 after:bg-gradient-to-r after:from-black/[.07] after:to-transparent after:pointer-events-none after:transition-opacity after:duration-200",
                          isScrolled ? 'after:opacity-100' : 'after:opacity-0',
                        ),
                        // Gradiente izquierdo via ::after con right-full — separador de la primera columna sticky-right.
                        // Usamos ::after (no ::before) porque after:right-full usa el mismo mecanismo ya probado.
                        // No hay conflicto: isLastSticky y isFirstStickyRight son mutuamente excluyentes.
                        isFirstStickyRight && cn(
                          "after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-full after:w-4 after:bg-gradient-to-r after:from-transparent after:to-black/[.07] after:pointer-events-none after:transition-opacity after:duration-200",
                          hasRightScroll ? 'after:opacity-100' : 'after:opacity-0',
                        ),
                        header.column.columnDef.meta?.align === 'center' && 'text-center',
                        header.column.columnDef.meta?.align === 'right' && 'text-right',
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            'flex items-center gap-1 dark:text-ink dark:hover:text-ink-muted',
                            canSort && 'cursor-pointer select-none hover:text-ink transition-colors',
                            header.column.columnDef.meta?.align === 'center' && 'w-full justify-center',
                            header.column.columnDef.meta?.align === 'right' && 'w-full justify-end',
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
                // group permite que las celdas sticky reaccionen al hover de la fila
                <TableRow
                  key={row.id}
                  className={cn('group border-divider/30 hover:bg-surface-row-hover transition-colors', getRowClassName?.(row.original))}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                >
                  {row.getVisibleCells().map((cell, cellIdx) => {
                    const stickyMeta      = cell.column.columnDef.meta?.sticky
                    const cells           = row.getVisibleCells()
                    const isSticky        = stickyMeta === true
                    const isStickyRight   = stickyMeta === 'right'

                    const isLastSticky       = isSticky && cells[cellIdx + 1]?.column.columnDef.meta?.sticky !== true
                    const isFirstStickyRight = isStickyRight && cells[cellIdx - 1]?.column.columnDef.meta?.sticky !== 'right'

                    let stickyLeft = 0
                    if (isSticky) {
                      for (let i = 0; i < cellIdx; i++) {
                        if (cells[i].column.columnDef.meta?.sticky === true) {
                          stickyLeft += cells[i].column.getSize()
                        }
                      }
                    }

                    let stickyRight = 0
                    if (isStickyRight) {
                      for (let i = cellIdx + 1; i < cells.length; i++) {
                        if (cells[i].column.columnDef.meta?.sticky === 'right') {
                          stickyRight += cells[i].column.getSize()
                        }
                      }
                    }

                    const cellExplicitSize = cell.column.columnDef.size
                    // Si el caller pasa getRowStickyClassName, ese string controla también el hover
                    // (debe incluir group-hover:* si quiere hover personalizado).
                    // Si no, usamos el default: fondo blanco + hover gris estándar.
                    const stickyRowBg = getRowStickyClassName?.(row.original)
                      ?? 'bg-canvas group-hover:bg-surface-row-hover'

                    return (
                      <TableCell
                        key={cell.id}
                        style={
                          isSticky      ? { left: stickyLeft,  ...(cellExplicitSize !== undefined ? { minWidth: cellExplicitSize } : {}) } :
                          isStickyRight ? { right: stickyRight, ...(cellExplicitSize !== undefined ? { minWidth: cellExplicitSize } : {}) } :
                          undefined
                        }
                        className={cn(
                          'px-6 py-4 text-sm text-ink',
                          // Columnas sticky: fondo controlado por stickyRowBg (rest + hover).
                          // El caller es responsable de incluir el hover si quiere comportamiento especial.
                          (isSticky || isStickyRight) && cn('sticky z-10 transition-colors', stickyRowBg),
                          !isSticky && !isStickyRight && 'relative z-0',
                          isLastSticky && cn(
                            "after:content-[''] after:absolute after:top-0 after:bottom-0 after:left-full after:w-4 after:bg-gradient-to-r after:from-black/[.07] after:to-transparent after:pointer-events-none after:transition-opacity after:duration-200",
                            isScrolled ? 'after:opacity-100' : 'after:opacity-0',
                          ),
                          isFirstStickyRight && cn(
                            "after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-full after:w-4 after:bg-gradient-to-r after:from-transparent after:to-black/[.07] after:pointer-events-none after:transition-opacity after:duration-200",
                            hasRightScroll ? 'after:opacity-100' : 'after:opacity-0',
                          ),
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
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

        <div className="px-6 py-3 flex items-center justify-between bg-surface-alt border-t border-divider/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-ink-muted dark:text-ink">Filas</span>
              <select
                value={ps}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value))
                  table.setPageIndex(0)
                }}
                className="rounded-md border border-divider bg-canvas px-2 py-0.5 text-xs font-medium text-ink cursor-pointer focus:outline-none focus:ring-1 focus:ring-world/50"
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-ink-muted dark:text-ink font-medium">
              {filteredCount === 0
                ? 'Sin resultados'
                : `Mostrando ${from}–${to} de ${filteredCount}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-muted dark:text-ink hover:bg-canvas transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPaginationRange(pageIndex + 1, table.getPageCount()).map((page, i) =>
              page === '...' ? (
                <span key={`ellipsis-${i}`} className="text-ink-muted dark:text-ink px-1 text-xs">
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
                      : 'text-ink-muted dark:text-ink hover:bg-canvas',
                  )}
                >
                  {page}
                </button>
              ),
            )}

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-muted dark:text-ink hover:bg-canvas transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
