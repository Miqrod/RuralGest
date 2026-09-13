'use server'

import { revalidatePath } from 'next/cache'
import { crearInstalacion } from '@/modules/ganadero/instalaciones/application/actions/crearInstalacion'
import { actualizarInstalacion } from '@/modules/ganadero/instalaciones/application/actions/actualizarInstalacion'
import { activarInstalacion } from '@/modules/ganadero/instalaciones/application/actions/activarInstalacion'
import { desactivarInstalacion } from '@/modules/ganadero/instalaciones/application/actions/desactivarInstalacion'
import { configurarUsosInstalacion } from '@/modules/ganadero/instalaciones/application/actions/configurarUsosInstalacion'
import type {
  CrearInstalacionInput,
  ActualizarInstalacionInput,
  ConfigurarUsosInstalacionInput,
} from '@/modules/ganadero/instalaciones/domain/types'

const PATH = '/configuracion/instalaciones'

// Extrae el mensaje de error tanto de Error nativo como de PostgrestError (Supabase).
function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err)
    return String((err as { message: unknown }).message)
  return fallback
}

export async function submitCrearInstalacion(
  input: CrearInstalacionInput,
): Promise<{ error: string } | null> {
  try {
    await crearInstalacion(input)
    revalidatePath(PATH)
    return null
  } catch (err) {
    console.error('[submitCrearInstalacion]', err)
    return { error: extractMessage(err, 'Error al crear la instalación') }
  }
}

// Actualiza metadatos (nombre, tipo, observaciones) y usos (admite_animales, admite_stock)
// en secuencia. Si falla cualquiera, el error se devuelve al cliente.
export async function submitActualizarInstalacion(
  meta: ActualizarInstalacionInput,
  usos: ConfigurarUsosInstalacionInput,
): Promise<{ error: string } | null> {
  try {
    await actualizarInstalacion(meta)
    await configurarUsosInstalacion(usos)
    revalidatePath(PATH)
    return null
  } catch (err) {
    console.error('[submitActualizarInstalacion]', err)
    return { error: extractMessage(err, 'Error al actualizar la instalación') }
  }
}

export async function submitActivarInstalacion(
  id: string,
): Promise<{ error: string } | null> {
  try {
    await activarInstalacion(id)
    revalidatePath(PATH)
    return null
  } catch (err) {
    console.error('[submitActivarInstalacion]', err)
    return { error: extractMessage(err, 'Error al activar la instalación') }
  }
}

// La lógica de negocio (no desactivar si tiene animales) vive en desactivarInstalacion.
export async function submitDesactivarInstalacion(
  id: string,
): Promise<{ error: string } | null> {
  try {
    await desactivarInstalacion(id)
    revalidatePath(PATH)
    return null
  } catch (err) {
    console.error('[submitDesactivarInstalacion]', err)
    return { error: extractMessage(err, 'Error al desactivar la instalación') }
  }
}
