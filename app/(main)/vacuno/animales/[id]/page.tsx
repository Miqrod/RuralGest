import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'
import { getAnimalDetail } from '@/modules/ganadero/animales/application/queries/getAnimalDetail'
import { getMachosDisponibles } from '@/modules/ganadero/animales/application/queries/getMachosDisponibles'
import { getTiposProductivosDisponibles } from '@/modules/ganadero/animales/application/queries/listarTiposProductivos'
import { AnimalHeader } from '@/modules/ganadero/animales/ui/ficha/AnimalHeader'
import { SeccionEstados } from '@/modules/ganadero/animales/ui/ficha/SeccionEstados'
import { SeccionOrigen } from '@/modules/ganadero/animales/ui/ficha/SeccionOrigen'
import { SeccionAcciones } from '@/modules/ganadero/animales/ui/ficha/SeccionAcciones'
import { SeccionEventos } from '@/modules/ganadero/animales/ui/ficha/SeccionEventos'
import { SeccionUsoProductivo } from '@/modules/ganadero/animales/ui/ficha/SeccionUsoProductivo'
import { SeccionHistorialReproductivo } from '@/modules/ganadero/reproductivo/ui/SeccionHistorialReproductivo'
import { SeccionCriasDependientes } from '@/modules/ganadero/reproductivo/ui/SeccionCriasDependientes'
import { getCicloAbiertoParaFicha } from '@/modules/ganadero/reproductivo/application/queries/getCicloAbiertoParaFicha'
import { getCriasParaDestete } from '@/modules/ganadero/reproductivo/application/queries/getCriasParaDestete'
import { tieneCiclosReproductivos } from '@/modules/ganadero/reproductivo/application/queries/tieneCiclosReproductivos'
import { getAvailableActions } from '@/modules/ganadero/animales/domain/availableActions'
import { listarDestinosReubicacion } from '@/modules/ganadero/instalaciones/application/queries/listarDestinosReubicacion'
import { getHistorialUbicacionesAnimal } from '@/modules/ganadero/instalaciones/application/queries/getHistorialUbicacionesAnimal'
import { AnimatedPageContent } from './AnimatedPageContent'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AnimalDetailPage({ params }: Props) {
  const { id } = await params
  const animal = await getAnimalDetail(id)

  if (!animal) notFound()

  const [machos, cicloAbierto, criasElegibles, tiposDisponibles, tieneHistorial, destinos] = await Promise.all([
    animal.es_reproductora ? getMachosDisponibles(animal.especie) : Promise.resolve([]),
    // Fetch del ciclo siempre que el animal tenga módulo reproductivo activo (estado != null).
    // Un animal con es_reproductora=false puede tener ciclo abierto si fue retirada de
    // reproducción durante un ciclo en curso — ese ciclo debe poder completarse.
    // Incluye fechaUltimoEvento en la misma query para evitar una segunda consulta serial.
    animal.estado_reproductivo !== null
      ? getCicloAbiertoParaFicha(animal.id)
      : Promise.resolve(null),
    // Crías elegibles para destete: independiente de es_reproductora.
    // La query filtra tipo_productivo='Cría' + estado_vinculo_materno='activo'; devuelve []
    // si no hay crías, por lo que es seguro llamarla siempre.
    getCriasParaDestete(animal.id),
    // Tipos disponibles para el drawer de cambio. Solo tiene sentido para animales vivos;
    // en vendidos/muertos el drawer no se monta, pero pasamos [] por coherencia.
    animal.estado_vital === 'vivo'
      ? getTiposProductivosDisponibles(animal.especie, animal.sexo)
      : Promise.resolve([]),
    // Necesario para mostrar el carrusel incluso cuando estado_reproductivo=null
    // (animal que dejó de ser reproductora pero tiene historial de ciclos).
    tieneCiclosReproductivos(animal.id),
    // Destinos disponibles para reubicación desde la ficha individual.
    animal.estado_vital === 'vivo' ? listarDestinosReubicacion() : Promise.resolve([]),
  ])

  const fechaUltimoEvento = cicloAbierto?.fechaUltimoEvento ?? null

  const acciones = getAvailableActions({
    estadoVital:         animal.estado_vital,
    estadoReproductivo:  animal.estado_reproductivo,
    tieneCicloAbierto:   cicloAbierto !== null,
    esReproductora:      animal.es_reproductora,
    tieneCriasElegibles: criasElegibles.length > 0,
  })

  // Server action inline — fetch lazy del historial de ubicaciones del animal.
  // Se pasa al cliente como prop y solo se ejecuta cuando el usuario abre el drawer.
  async function fetchHistorialUbicacion() {
    'use server'
    return getHistorialUbicacionesAnimal(id)
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-world">Ficha detalle animal</h1>
        <Link
          href="/vacuno/animales"
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors"
        >
          ← Volver a animales
        </Link>
      </div>
      <AnimatedPageContent>
        <AnimalHeader animal={animal} fetchHistorial={fetchHistorialUbicacion} />
        <SeccionAcciones
          animalId={animal.id}
          crotal={animal.crotal}
          nombre={animal.nombre}
          estadoVital={animal.estado_vital}
          esReproductora={animal.es_reproductora}
          estadoReproductivo={animal.estado_reproductivo}
          tieneCicloAbierto={cicloAbierto !== null}
          machos={machos}
          criasElegibles={criasElegibles}
          fechaUltimoEvento={fechaUltimoEvento}
          ubicacionActualId={animal.ubicacion_actual_id}
          ubicacionActualNombre={animal.ubicacion_actual_nombre}
          fechaUltimoMovimiento={animal.fecha_ultimo_cambio_ubicacion}
          destinos={destinos}
        />
        {(animal.estado_reproductivo !== null || tieneHistorial) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-1">
              <SeccionHistorialReproductivo
                animalId={animal.id}
                animalNombre={animal.nombre}
                madreCrotal={animal.crotal}
                fechaPrevistaParto={animal.fecha_prevista_parto}
                estadoVital={animal.estado_vital}
                fechaSalida={animal.fecha_salida}
                canMachorra={acciones.has('machorra')}
              />
              <SeccionCriasDependientes
                animalId={animal.id}
                madreCrotal={animal.crotal}
              />
            </div>
            <div className="flex flex-col gap-4">
              <SeccionUsoProductivo animal={animal} tiposDisponibles={tiposDisponibles} />
              <SeccionEstados animal={animal} numCriasActivas={criasElegibles.length} />
            </div>
            <SeccionOrigen animal={animal} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-4">
              <SeccionUsoProductivo animal={animal} tiposDisponibles={tiposDisponibles} />
              <SeccionEstados animal={animal} numCriasActivas={criasElegibles.length} />
            </div>
            <SeccionOrigen animal={animal} />
          </div>
        )}
        <SeccionEventos animalId={animal.id} />
      </AnimatedPageContent>
    </PageContainer>
  )
}
