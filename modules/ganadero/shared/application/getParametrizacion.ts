import { createServerClient } from '../../../shared/db'
import type { TipoValorParametrizacion } from '../../parametrizacion/domain/types'

export interface ParametrizacionResult {
  valor:      string
  tipo_valor: TipoValorParametrizacion
}

/**
 * Devuelve el parámetro por (codigo, especie).
 * Especie NULL significa parámetro global (aplica a todas las especies).
 * Usa IS NOT DISTINCT FROM implícito: especie undefined/null → .is('especie', null).
 */
export async function getParametrizacion(
  codigo:   string,
  especie?: string | null,
): Promise<ParametrizacionResult | null> {
  const supabase = await createServerClient()

  let query = supabase
    .from('parametrizacion')
    .select('valor, tipo_valor')
    .eq('codigo', codigo)

  // NULL-safe: especie null/undefined → IS NULL; valor presente → =
  if (especie != null) {
    // Cast necesario: el SDK espera el tipo enum exacto ('vacuno' | 'porcino' | ...);
    // el helper es genérico y el caller garantiza que el valor es válido en BD.
    query = query.eq('especie', especie as 'vacuno' | 'porcino')
  } else {
    query = query.is('especie', null)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    valor:      data.valor,
    tipo_valor: data.tipo_valor as TipoValorParametrizacion,
  }
}
