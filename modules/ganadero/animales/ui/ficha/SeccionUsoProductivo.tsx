'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FichaSection } from './FichaSection'
import { DrawerCambioTipoProductivo } from './DrawerCambioTipoProductivo'
import type { AnimalDetail } from '@/modules/ganadero/animales/application/queries/getAnimalDetail'
import type { TipoProductivoOption } from '@/modules/ganadero/animales/application/queries/listarTiposProductivos'
import { validarTipoProductivoOrigen } from '@/modules/ganadero/animales/domain/rules'

interface Props {
  animal:           AnimalDetail
  tiposDisponibles: TipoProductivoOption[]
}

// Tarjeta de uso productivo con lápiz de edición.
// El lápiz solo aparece cuando el animal está vivo y su tipo admite cambios manuales:
//   · vendido/muerto → informativo;
//   · Cría → informativo, con una nota: su único cambio (→ Recría) lo hace el destete.
// El RPC cambiar_tipo_productivo rechaza igualmente ambos casos.
export function SeccionUsoProductivo({ animal, tiposDisponibles }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const bloqueoOrigen = validarTipoProductivoOrigen(animal.tipo_productivo_nombre)
  const puedeEditar = animal.estado_vital === 'vivo' && bloqueoOrigen === null

  // Excluir el tipo actual de la lista: el ganadero solo elige entre los demás.
  // Los nombres de tipo son únicos dentro de una especie, por lo que filtrar por nombre es seguro.
  const opciones = tiposDisponibles.filter(t => t.nombre !== animal.tipo_productivo_nombre)

  return (
    <>
      <FichaSection
        title="Uso productivo"
        action={
          puedeEditar ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setDrawerOpen(true)}
              aria-label="Cambiar tipo productivo"
              className="cursor-pointer bg-surface-alt border border-divider/60 shadow-sm text-ink-muted hover:bg-surface-base hover:shadow"
            >
              <Pencil className="size-3.5" />
            </Button>
          ) : undefined
        }
      >
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm text-ink-muted">Tipo productivo</span>
          <span className="text-sm text-ink">
            {animal.tipo_productivo_nombre ?? '—'}
          </span>
        </div>
        {/* Cría viva: explica por qué no hay lápiz */}
        {animal.estado_vital === 'vivo' && bloqueoOrigen && (
          <p className="text-xs text-ink-muted pb-2">
            Pasará a Recría al registrar su destete.
          </p>
        )}
      </FichaSection>

      {/* Drawer de cambio de tipo: solo montado cuando el animal puede editarse */}
      {puedeEditar && (
        <DrawerCambioTipoProductivo
          animalId={animal.id}
          sexo={animal.sexo}
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
