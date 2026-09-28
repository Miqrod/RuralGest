'use server'

import { revalidatePath } from 'next/cache'
import { saveExplotacion } from '@/modules/ganadero/explotacion/infrastructure/repository'
import type { ActualizarExplotacionInput } from '@/modules/ganadero/explotacion/domain/types'

const PATH = '/configuracion/explotacion'

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err)
    return String((err as { message: unknown }).message)
  return fallback
}

export async function submitActualizarExplotacion(
  input: ActualizarExplotacionInput,
): Promise<{ error: string } | null> {
  try {
    await saveExplotacion(input)
    revalidatePath(PATH)
    revalidatePath('/', 'layout') // refresca el logo en el sidebar
    return null
  } catch (err) {
    console.error('[submitActualizarExplotacion]', err)
    return { error: extractMessage(err, 'Error al guardar los datos de la explotación') }
  }
}
