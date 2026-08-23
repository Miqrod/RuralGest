'use server'

import { revalidatePath } from 'next/cache'
import { registrarVentaAnimal } from '@/modules/ganadero/animales/application/actions/registrarVentaAnimal'
import { registrarMuerteAnimal } from '@/modules/ganadero/animales/application/actions/registrarMuerteAnimal'
import { registrarCubricion } from '@/modules/ganadero/reproductivo/application/actions/registrarCubricion'
import { confirmarGestacion } from '@/modules/ganadero/reproductivo/application/actions/confirmarGestacion'
import { identificarAnimal } from '@/modules/ganadero/animales/application/identificarAnimal'
import { registrarParto } from '@/modules/ganadero/reproductivo/application/actions/registrarParto'
import { registrarDestete } from '@/modules/ganadero/reproductivo/application/actions/registrarDestete'
import { registrarAborto } from '@/modules/ganadero/reproductivo/application/actions/registrarAborto'
import { cambiarTipoProductivo } from '@/modules/ganadero/animales/application/actions/cambiarTipoProductivo'
import type { TipoCubricion, RegistrarPartoInput, RegistrarPartoResult, RegistrarDesteteResult } from '@/modules/ganadero/reproductivo/domain/types'
import type { AnimalIdentificationStatus } from '@/modules/ganadero/animales/domain/IdentificationRules'

// Extrae el mensaje de error tanto de Error nativo como de PostgrestError (Supabase),
// que no hereda de Error y por tanto no pasa instanceof.
function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err)
    return String((err as { message: unknown }).message)
  return fallback
}

// Tras éxito: revalidatePath invalida el caché del Server Component de la ficha,
// de forma que el router.refresh() del cliente recibirá datos actualizados.
export async function submitVentaAnimal(
  animalId: string,
  fecha: string,
): Promise<{ error: string } | null> {
  try {
    await registrarVentaAnimal({ animal_id: animalId, fecha_venta: fecha })
    revalidatePath(`/vacuno/animales/${animalId}`)
    return null
  } catch (err) {
    console.error('[submitVentaAnimal]', err)
    return { error: extractMessage(err, 'Error al registrar la venta') }
  }
}

export async function submitMuerteAnimal(
  animalId: string,
  fecha: string,
): Promise<{ error: string } | null> {
  try {
    await registrarMuerteAnimal({ animal_id: animalId, fecha_muerte: fecha })
    revalidatePath(`/vacuno/animales/${animalId}`)
    return null
  } catch (err) {
    console.error('[submitMuerteAnimal]', err)
    return { error: extractMessage(err, 'Error al registrar la muerte') }
  }
}

export async function submitConfirmacionGestacion(
  animalId: string,
  fechaConfirmacion: string,
  mesesGestacionEstimados?: number,
  padreId?: string,
  observaciones?: string,
): Promise<{ error: string } | null> {
  try {
    await confirmarGestacion({
      animal_id:                  animalId,
      fecha_confirmacion:         fechaConfirmacion,
      meses_gestacion_estimados:  mesesGestacionEstimados,
      padre_id:                   padreId ?? null,
      observaciones,
    })
    revalidatePath(`/vacuno/animales/${animalId}`)
    return null
  } catch (err) {
    console.error('[submitConfirmacionGestacion]', err)
    return { error: extractMessage(err, 'Error al confirmar la gestación') }
  }
}

export async function submitIdentificarAnimal(
  animalId: string,
  datos: { crotal?: string; sexo?: 'macho' | 'hembra'; num_hierro?: string; nombre?: string },
): Promise<{ status: AnimalIdentificationStatus } | { error: string }> {
  try {
    const status = await identificarAnimal({ animal_id: animalId, ...datos })
    revalidatePath(`/vacuno/animales/${animalId}`)
    return { status }
  } catch (err) {
    console.error('[submitIdentificarAnimal]', err)
    return { error: extractMessage(err, 'Error al identificar el animal') }
  }
}

export async function submitRegistrarParto(
  animalId: string,
  datos: Omit<RegistrarPartoInput, 'animal_id'>,
): Promise<{ result: RegistrarPartoResult } | { error: string }> {
  try {
    const result = await registrarParto({ animal_id: animalId, ...datos })
    revalidatePath(`/vacuno/animales/${animalId}`)
    return { result }
  } catch (err) {
    console.error('[submitRegistrarParto]', err)
    return { error: extractMessage(err, 'Error al registrar el parto') }
  }
}

export async function submitRegistrarDestete(
  criaId: string,
  madreId: string,
  fecha: string,
  observaciones?: string,
): Promise<{ result: RegistrarDesteteResult } | { error: string }> {
  try {
    const result = await registrarDestete({ cria_id: criaId, fecha, observaciones })
    // Revalidar ambas fichas: la cría cambia de tipo y vínculo, la madre puede cambiar de estado reproductivo
    revalidatePath(`/vacuno/animales/${criaId}`)
    revalidatePath(`/vacuno/animales/${madreId}`)
    return { result }
  } catch (err) {
    console.error('[submitRegistrarDestete]', err)
    return { error: extractMessage(err, 'Error al registrar el destete') }
  }
}

export async function submitCambiarTipoProductivo(
  animalId: string,
  nuevoTipoProductivoId: string,
): Promise<{ error: string } | null> {
  try {
    await cambiarTipoProductivo({
      animal_id:              animalId,
      nuevo_tipo_productivo_id: nuevoTipoProductivoId,
    })
    revalidatePath(`/vacuno/animales/${animalId}`)
    return null
  } catch (err) {
    console.error('[submitCambiarTipoProductivo]', err)
    return { error: extractMessage(err, 'Error al cambiar el tipo productivo') }
  }
}

export async function submitRegistrarAborto(
  animalId: string,
  fecha: string,
  observaciones?: string,
): Promise<{ error: string } | null> {
  try {
    await registrarAborto({ animal_id: animalId, fecha_aborto: fecha, observaciones })
    revalidatePath(`/vacuno/animales/${animalId}`)
    return null
  } catch (err) {
    console.error('[submitRegistrarAborto]', err)
    return { error: extractMessage(err, 'Error al registrar el aborto') }
  }
}

export async function submitCubricionAnimal(
  animalId: string,
  fechaCubricion: string,
  tipoCubricion: TipoCubricion,
  machoId?: string,
  observaciones?: string,
): Promise<{ error: string } | null> {
  try {
    await registrarCubricion({
      animal_id:       animalId,
      fecha_cubricion: fechaCubricion,
      tipo_cubricion:  tipoCubricion,
      macho_id:        machoId,
      observaciones,
    })
    revalidatePath(`/vacuno/animales/${animalId}`)
    return null
  } catch (err) {
    console.error('[submitCubricionAnimal]', err)
    return { error: extractMessage(err, 'Error al registrar la cubrición') }
  }
}
