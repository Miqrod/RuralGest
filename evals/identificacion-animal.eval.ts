import { describe, it, expect } from 'vitest'

import {
  assertEstadoReproductivoCoherente,
} from '@/modules/ganadero/animales/domain/rules'
import {
  evaluarIdentificacion,
  buildIdentificationStatus,
} from '@/modules/ganadero/animales/domain/IdentificationRules'

// =============================================================================
// EVAL: Identificación y coherencia reproductora del animal
//
// Cubre dos conceptos de dominio separados que viven en el módulo 'animales':
//
//   1. Coherencia reproductora: la regla es_reproductora ↔ estado_reproductivo.
//      Un animal de engorde o recría (es_reproductora=false) NO puede tener
//      estado_reproductivo asignado. Son semánticamente incompatibles.
//
//   2. Identificación: un animal recién nacido pasa por el estado 'pendiente'
//      hasta que el ganadero informa su crotal y sexo. La lógica es pura:
//      opera sobre el snapshot en memoria, sin acceso a la BD.
// =============================================================================

// ── assertEstadoReproductivoCoherente ─────────────────────────────────────────

describe('EVAL: Animal — coherencia reproductora', () => {

  it('no reproductora + estado_reproductivo null → válido (caso base de engorde/recría)', () => {
    // Un animal de engorde o recría siempre debe tener estado_reproductivo=null.
    // Este es el camino feliz: el sistema no debe interferir con estos animales.
    expect(() => assertEstadoReproductivoCoherente(false, null)).not.toThrow()
  })

  it('reproductora + estado vacia → válido (estado inicial tras conversión a Reproductora)', () => {
    // Cuando el ganadero cambia el tipo productivo de una hembra a "Reproductora",
    // el RPC le asigna estado_reproductivo='vacia'. Esta combinación debe ser aceptada.
    expect(() => assertEstadoReproductivoCoherente(true, 'vacia')).not.toThrow()
  })

  it('reproductora + estado null → válido (la regla no bloquea reproductoras sin estado aún asignado)', () => {
    // La función solo prohíbe la combinación (no_reproductora, estado_no_null).
    // Una reproductora con estado null es transitoriamente posible antes de que el RPC
    // complete la asignación; la regla no debe bloquear este caso.
    expect(() => assertEstadoReproductivoCoherente(true, null)).not.toThrow()
  })

  it('no reproductora + estado vacia → incoherente, lanza', () => {
    // Violación principal: un toro, ternero de engorde o recría no puede tener
    // estado_reproductivo. Si esto ocurre en BD es un bug de integridad de datos.
    expect(() => assertEstadoReproductivoCoherente(false, 'vacia'))
      .toThrow(/no puede tener estado_reproductivo/)
  })

  it('no reproductora + estado cubierta → incoherente, lanza (mismo invariante con otro estado)', () => {
    // Verifica que la regla se aplica a cualquier estado no-null, no solo a 'vacia'.
    // Un animal no-reproductor no puede estar "cubierto", "gestante", etc.
    expect(() => assertEstadoReproductivoCoherente(false, 'cubierta'))
      .toThrow(/no puede tener estado_reproductivo/)
  })

})

// ── evaluarIdentificacion ─────────────────────────────────────────────────────

describe('EVAL: Animal — evaluarIdentificacion', () => {

  it('crotal y sexo presentes → completa, sin criterios faltantes', () => {
    // Caso feliz: el ganadero ha informado todos los datos obligatorios.
    // La función debe confirmar que no faltan criterios.
    const result = evaluarIdentificacion({ crotal: 'ES001234560001', sexo: 'hembra' })
    expect(result.completa).toBe(true)
    expect(result.criteriosFaltantes).toHaveLength(0)
  })

  it('sin crotal → pendiente; crotal aparece en criteriosFaltantes', () => {
    // El crotal es el identificador único del animal en el campo (obligatorio por ley en España).
    // Sin él el animal no puede trazarse ante un control sanitario o una venta.
    const result = evaluarIdentificacion({ crotal: null, sexo: 'hembra' })
    expect(result.completa).toBe(false)
    expect(result.criteriosFaltantes).toContain('crotal')
  })

  it('crotal de solo espacios en blanco → pendiente (equivale a sin crotal)', () => {
    // Edge case del campo de texto: el ganadero puede escribir espacios por error.
    // La regla aplica trim() para que "   " no se considere un crotal válido.
    // Sin este test, podría entrar un crotal fantasma que supera la validación vacía.
    const result = evaluarIdentificacion({ crotal: '   ', sexo: 'macho' })
    expect(result.completa).toBe(false)
    expect(result.criteriosFaltantes).toContain('crotal')
  })

  it('sin sexo → pendiente; sexo aparece en criteriosFaltantes', () => {
    // En ganadería extensiva el sexo puede desconocerse al nacimiento (camadas grandes,
    // partos nocturnos). El animal se registra como sexo=null y se identifica después.
    const result = evaluarIdentificacion({ crotal: 'ES001234560001', sexo: null })
    expect(result.completa).toBe(false)
    expect(result.criteriosFaltantes).toContain('sexo')
  })

  it('sin crotal ni sexo → pendiente; ambos criterios aparecen en la lista', () => {
    // Verifica que la función no hace "short-circuit" al encontrar el primer criterio
    // faltante. La UI necesita la lista completa para mostrar todos los avisos al ganadero.
    const result = evaluarIdentificacion({ crotal: null, sexo: null })
    expect(result.completa).toBe(false)
    expect(result.criteriosFaltantes).toContain('crotal')
    expect(result.criteriosFaltantes).toContain('sexo')
    expect(result.criteriosFaltantes).toHaveLength(2)
  })

})

// ── buildIdentificationStatus ─────────────────────────────────────────────────

describe('EVAL: Animal — buildIdentificationStatus', () => {

  it('datos completos → estado "completa" y array de criterios vacío', () => {
    // buildIdentificationStatus es el wrapper que la UI y el dashboard consumen.
    // Cuando la identificación es completa, el estado debe ser 'completa' (no null, no true).
    const status = buildIdentificationStatus({ crotal: 'ES001234560001', sexo: 'macho' })
    expect(status.estado).toBe('completa')
    expect(status.criteriosFaltantes).toHaveLength(0)
  })

  it('falta crotal → estado "pendiente" con crotal en criteriosFaltantes', () => {
    // El estado 'pendiente' dispara el badge visual en la ficha del animal
    // y el contador en el dashboard. Debe incluir qué falta para guiar al ganadero.
    const status = buildIdentificationStatus({ crotal: null, sexo: 'hembra' })
    expect(status.estado).toBe('pendiente')
    expect(status.criteriosFaltantes).toContain('crotal')
  })

  it('falta sexo → estado "pendiente" con sexo en criteriosFaltantes', () => {
    // Mismo invariante que el anterior pero verificando el otro criterio.
    // buildIdentificationStatus debe delegar en evaluarIdentificacion sin duplicar lógica.
    const status = buildIdentificationStatus({ crotal: 'ES001234560001', sexo: null })
    expect(status.estado).toBe('pendiente')
    expect(status.criteriosFaltantes).toContain('sexo')
  })

})
