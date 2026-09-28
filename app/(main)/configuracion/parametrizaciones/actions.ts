'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/modules/shared/db'
import { saveParametrizacion } from '@/modules/ganadero/parametrizacion/infrastructure/repository'
import type { TipoValorParametrizacion } from '@/modules/ganadero/parametrizacion/domain/types'

const PATH = '/configuracion/parametrizaciones'

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err)
    return String((err as { message: unknown }).message)
  return fallback
}

// Valida que el valor sea compatible con el tipo_valor del parámetro
function validarValor(valor: string, tipo: TipoValorParametrizacion): string | null {
  const v = valor.trim()
  if (v === '') return 'El valor no puede estar vacío'
  switch (tipo) {
    case 'INTEGER': {
      const n = Number(v)
      if (!Number.isInteger(n) || isNaN(n)) return 'El valor debe ser un número entero'
      return null
    }
    case 'DECIMAL': {
      if (isNaN(Number(v))) return 'El valor debe ser un número'
      return null
    }
    case 'BOOLEAN': {
      if (v !== 'true' && v !== 'false') return 'El valor debe ser "true" o "false"'
      return null
    }
    case 'TEXT':
      return null
    case 'DATE': {
      if (isNaN(new Date(v).getTime())) return 'El valor debe ser una fecha válida (YYYY-MM-DD)'
      return null
    }
  }
}

export async function actualizarParametrizacion(
  id: string,
  valor: string,
): Promise<{ error: string } | null> {
  try {
    // Leer el tipo_valor actual desde BD para validar — los metadatos del parámetro son inmutables
    const supabase = await createServerClient()
    const { data, error: fetchError } = await supabase
      .from('parametrizacion')
      .select('tipo_valor')
      .eq('id', id)
      .single()
    if (fetchError || !data) throw fetchError ?? new Error('Parámetro no encontrado')

    const validationError = validarValor(valor, data.tipo_valor as TipoValorParametrizacion)
    if (validationError) return { error: validationError }

    await saveParametrizacion(id, valor.trim())
    revalidatePath(PATH)
    return null
  } catch (err) {
    console.error('[actualizarParametrizacion]', err)
    return { error: extractMessage(err, 'Error al guardar el parámetro') }
  }
}
