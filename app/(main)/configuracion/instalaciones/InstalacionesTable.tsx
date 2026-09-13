'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Pencil, PowerOff, Zap } from 'lucide-react'
import { type ColumnDef } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DataTable } from '@/components/data-table/DataTable'
import { DrawerInstalacion } from './DrawerInstalacion'
import { submitActivarInstalacion, submitDesactivarInstalacion } from './actions'
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

interface Props {
  data: InstalacionListItem[]
}

export function InstalacionesTable({ data }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<InstalacionListItem | undefined>(undefined)
  const [desactivarTarget, setDesactivarTarget] = useState<InstalacionListItem | null>(null)

  function openCreate() {
    setEditTarget(undefined)
    setFormOpen(true)
  }

  function openEdit(instalacion: InstalacionListItem) {
    setEditTarget(instalacion)
    setFormOpen(true)
  }

  function handleActivar(instalacion: InstalacionListItem) {
    startTransition(async () => {
      const result = await submitActivarInstalacion(instalacion.id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`"${instalacion.nombre}" activada`)
        router.refresh()
      }
    })
  }

  function handleDesactivarConfirmed() {
    if (!desactivarTarget) return
    const target = desactivarTarget
    setDesactivarTarget(null)
    startTransition(async () => {
      const result = await submitDesactivarInstalacion(target.id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`"${target.nombre}" desactivada`)
        router.refresh()
      }
    })
  }

  // Columnas definidas dentro del componente para capturar los callbacks por closure
  const columns = useMemo<ColumnDef<InstalacionListItem, unknown>[]>(() => [
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>()}</span>
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
            <span className="text-xs text-ink-muted">Sin usos</span>
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
    {
      id: 'acciones',
      header: 'Acciones',
      enableSorting: false,
      meta: { align: 'center' as const },
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openEdit(item)}
              title="Editar"
              className="cursor-pointer bg-surface-alt border border-divider/60 shadow-sm text-ink-muted hover:bg-surface-base hover:shadow"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {item.activo ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDesactivarTarget(item)}
                disabled={pending}
                title="Desactivar"
                className="cursor-pointer bg-surface-alt border border-divider/60 shadow-sm text-ink-muted hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
              >
                <PowerOff className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleActivar(item)}
                disabled={pending}
                title="Activar"
                className="cursor-pointer bg-surface-alt border border-divider/60 shadow-sm text-ink-muted hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:border-emerald-800"
              >
                <Zap className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [pending])

  return (
    <>
      {/* Cabecera: título + botón — estáticos, sin animación */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-world">Instalaciones</h1>
          <p className="text-sm text-ink-muted mt-1">
            Gestión de instalaciones: crear, editar, activar y configurar usos admitidos.
          </p>
        </div>
        <Button onClick={openCreate} className="h-auto py-3 px-8 shrink-0">
          Nueva instalación
        </Button>
      </div>

      {/* Contenido con animación de entrada */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <DataTable
          columns={columns}
          data={data}
          pageSize={10}
          getRowClassName={(row) => !row.activo ? 'bg-alert-soft/50 hover:bg-alert-soft/70' : undefined}
        />
      </motion.div>

      {/* Drawer de creación/edición */}
      <DrawerInstalacion
        open={formOpen}
        onOpenChange={setFormOpen}
        instalacion={editTarget}
      />

      {/* Confirmación de desactivación */}
      <AlertDialog
        open={desactivarTarget !== null}
        onOpenChange={(o) => !o && setDesactivarTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar instalación?</AlertDialogTitle>
            <AlertDialogDescription>
              {desactivarTarget && (
                <>
                  Se desactivará <strong>&ldquo;{desactivarTarget.nombre}&rdquo;</strong>.
                  No podrá usarse como destino de reubicación mientras esté inactiva.
                  Si tiene animales asignados, la operación será rechazada.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDesactivarConfirmed}
              disabled={pending}
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
