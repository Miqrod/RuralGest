'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { FichaSection } from './FichaSection'
import { DrawerCambioTipoProductivo } from './DrawerCambioTipoProductivo'
import type { AnimalDetail } from '@/modules/ganadero/animales/application/queries/getAnimalDetail'
import type { TipoProductivoOption } from '@/modules/ganadero/animales/application/queries/listarTiposProductivos'

interface Props {
  animal:           AnimalDetail
  tiposDisponibles: TipoProductivoOption[]
}

// Tarjeta de uso productivo con lápiz de edición.
// El lápiz solo aparece cuando el animal está vivo; en vendido/muerto es informativo.
export function SeccionUsoProductivo({ animal, tiposDisponibles }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const puedeEditar = animal.estado_vital === 'vivo'

  // Excluir el tipo actual de la lista: el ganadero solo elige entre los demás.
  // Los nombres de tipo son únicos dentro de una especie, por lo que filtrar por nombre es seguro.
  const opciones = tiposDisponibles.filter(t => t.nombre !== animal.tipo_productivo_nombre)

  return (
    <>
      <FichaSection
        title="Uso productivo"
        action={
          puedeEditar ? (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="text-ink-muted hover:text-ink transition-colors"
              aria-label="Cambiar tipo productivo"
            >
              <Pencil className="size-3.5" />
            </button>
          ) : undefined
        }
      >
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm text-ink-muted">Tipo productivo</span>
          <span className="text-sm text-ink">
            {animal.tipo_productivo_nombre ?? '—'}
          </span>
        </div>
      </FichaSection>

      {/* Drawer de cambio de tipo: solo montado cuando el animal puede editarse */}
      {puedeEditar && (
        <DrawerCambioTipoProductivo
          animalId={animal.id}
          tipoActualNombre={animal.tipo_productivo_nombre}
          estadoReproductivo={animal.estado_reproductivo}
          tiposDisponibles={opciones}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      )}
    </>
  )
}
