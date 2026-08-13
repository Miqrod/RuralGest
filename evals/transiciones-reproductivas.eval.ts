import { describe, it, expect } from 'vitest'
import { addDays, parseISO } from 'date-fns'

import {
  validarTransicionReproductiva,
  estadoPermiteEvento,
} from '@/modules/ganadero/reproductivo/domain/rules'
import { evalCycleRules } from '@/modules/ganadero/reproductivo/domain/rules/ReproductiveCycleRules'
import { buildSnapshot } from '@/modules/ganadero/reproductivo/domain/rules/ReproductiveProjection'
import type { ReproductiveContext } from '@/modules/ganadero/reproductivo/domain/types'

// =============================================================================
// EVAL: Transiciones reproductivas — cobertura completa de eventos
//
// confirmacion-gestacion.eval.ts ya cubre CONFIRMACION_GESTACION en detalle.
// Este archivo cubre los 4 eventos restantes:
//
//   CUBRICION             → estado destino: cubierta
//   PARTO                 → estado destino: lactante
//   DESTETE               → estado destino: vacia
//   ABORTO                → estado destino: vacia
//
// Para cada evento se verifica:
//   a) validarTransicionReproductiva: los orígenes válidos e inválidos
//   b) estadoPermiteEvento: la misma lógica en modo booleano (sin lanzar)
//   c) evalCycleRules: qué hace el ciclo reproductivo con el evento
//   d) buildSnapshot (CUBRICION y PARTO): la proyección de estado calculada
//
// Ningún test accede a la BD — toda la lógica es pura.
// =============================================================================

// ── Fixtures ─────────────────────────────────────────────────────────────────

const ANIMAL_VACIA: ReproductiveContext['animal'] = {
  id:                  'uuid-animal',
  especie:             'vacuno',
  es_reproductora:     true,
  estado_reproductivo: 'vacia',
}

const CICLO_ABIERTO: NonNullable<ReproductiveContext['cicloAbierto']> = {
  id:           'uuid-ciclo',
  animal_id:    'uuid-animal',
  numero_ciclo: 1,
  fecha_inicio: '2026-05-01',
  fecha_fin:    null,
  resultado:    null,
  created_at:   '2026-05-01T00:00:00Z',
  created_by:   null,
}

// ── CUBRICION ─────────────────────────────────────────────────────────────────

describe('EVAL: Transiciones — CUBRICION', () => {

  it('vacia → cubierta: primera cubrición del ciclo reproductivo', () => {
    // Estado inicial de la reproductora. La cubrición (monta o inseminación) abre
    // el ciclo y marca el inicio del cómputo de gestación.
    expect(validarTransicionReproductiva('CUBRICION', 'vacia')).toBe('cubierta')
  })

  it('cubierta → cubierta: cubrición repetida en el mismo ciclo (válido en extensivo)', () => {
    // En ganadería extensiva el toro permanece con el rebaño varias semanas.
    // Pueden registrarse múltiples cubriciones en el mismo ciclo; la proyección
    // usa siempre la última. La transición cubierta→cubierta es deliberadamente válida.
    expect(validarTransicionReproductiva('CUBRICION', 'cubierta')).toBe('cubierta')
  })

  it('gestante → lanza: no se puede cubrir un animal que ya está gestante', () => {
    // Una vez confirmada la gestación la reproductora no puede recibir cubrición
    // hasta que concluya el ciclo (parto o aborto). Esto protege la integridad del ciclo.
    expect(() => validarTransicionReproductiva('CUBRICION', 'gestante')).toThrow()
  })

  it('lactante → lanza: no se puede cubrir un animal que está amamantando', () => {
    // El destete debe producirse antes de iniciar un nuevo ciclo reproductivo.
    // Permitirlo daría lugar a ciclos solapados sin sentido biológico.
    expect(() => validarTransicionReproductiva('CUBRICION', 'lactante')).toThrow()
  })

})

// ── PARTO ─────────────────────────────────────────────────────────────────────

describe('EVAL: Transiciones — PARTO', () => {

  it('cubierta → lactante: parto sin confirmación de gestación previa (válido en extensivo)', () => {
    // En explotación extensiva muchos partos se registran sin haber pasado por
    // CONFIRMACION_GESTACION. El sistema permite llegar al parto directamente
    // desde cubierta para no bloquear al ganadero.
    expect(validarTransicionReproductiva('PARTO', 'cubierta')).toBe('lactante')
  })

  it('gestante → lactante: flujo completo con confirmación previa', () => {
    // Camino estándar: CUBRICION → CONFIRMACION_GESTACION → PARTO.
    // El parto cambia el estado a lactante y arranca el período de lactación.
    expect(validarTransicionReproductiva('PARTO', 'gestante')).toBe('lactante')
  })

  it('vacia → lanza: no puede parir sin haber sido cubierta', () => {
    // Registrar un parto en una vaca vacía sería una inconsistencia de datos grave.
    // La regla actúa como primera línea de defensa (el RPC añade una segunda con FOR UPDATE).
    expect(() => validarTransicionReproductiva('PARTO', 'vacia')).toThrow()
  })

  it('lactante → lanza: no puede parir estando en período de lactación', () => {
    // Biológicamente imposible y semánticamente incorrecto. Un doble parto sin
    // destete previo indicaría un error en el flujo de datos.
    expect(() => validarTransicionReproductiva('PARTO', 'lactante')).toThrow()
  })

})

// ── DESTETE ───────────────────────────────────────────────────────────────────

describe('EVAL: Transiciones — DESTETE', () => {

  it('lactante → vacia: destete completa el ciclo reproductivo', () => {
    // El destete es el evento que libera a la madre: cierra el vínculo materno
    // con cada cría y, cuando no quedan crías activas, devuelve la madre a estado vacia.
    // Es la transición final del ciclo y el único origen válido de DESTETE.
    expect(validarTransicionReproductiva('DESTETE', 'lactante')).toBe('vacia')
  })

  it('cubierta → lanza: el destete no tiene sentido si no hay lactación activa', () => {
    // Protege contra usos incorrectos del formulario. Si el estado no es lactante,
    // el ganadero ha tomado un camino equivocado en la UI.
    expect(() => validarTransicionReproductiva('DESTETE', 'cubierta')).toThrow()
  })

  it('vacia → lanza: no puede destetar sin haber parido', () => {
    // Una reproductora vacía no tiene crías que destetar. Este caso detectaría
    // un bug en la navegación o en la carga de datos de la ficha.
    expect(() => validarTransicionReproductiva('DESTETE', 'vacia')).toThrow()
  })

})

// ── ABORTO ────────────────────────────────────────────────────────────────────

describe('EVAL: Transiciones — ABORTO', () => {

  it('cubierta → vacia: aborto tras cubrición sin confirmación gestacional', () => {
    // El aborto puede ocurrir en cualquier momento tras la cubrición.
    // No es necesario haber confirmado la gestación para registrar la pérdida.
    expect(validarTransicionReproductiva('ABORTO', 'cubierta')).toBe('vacia')
  })

  it('gestante → vacia: aborto después de confirmación gestacional', () => {
    // Más habitual clínicamente (aborto tardío). El ciclo se cierra y la madre
    // vuelve a estado vacia lista para un nuevo ciclo.
    expect(validarTransicionReproductiva('ABORTO', 'gestante')).toBe('vacia')
  })

  it('lactante → lanza: no se puede registrar aborto durante la lactación', () => {
    // Si ya hubo parto (y por tanto está lactante), el ciclo progresó más allá
    // del punto donde un aborto tendría sentido. Indicaría error en la secuencia de eventos.
    expect(() => validarTransicionReproductiva('ABORTO', 'lactante')).toThrow()
  })

  it('vacia → lanza: no puede abortar sin estar cubierta o gestante', () => {
    // Una reproductora vacía no tiene gestación en curso. Registrar un aborto
    // desde este estado indicaría un error de flujo o datos duplicados.
    expect(() => validarTransicionReproductiva('ABORTO', 'vacia')).toThrow()
  })

})

// ── estadoPermiteEvento — tabla completa ─────────────────────────────────────
// Versión booleana de validarTransicionReproductiva.
// Usada por EligibilityRules para componer múltiples condiciones sin lanzar excepciones.

describe('EVAL: estadoPermiteEvento — matriz de estados y eventos', () => {

  // CUBRICION ─────────────────────────────────────────────────────────────────
  it('CUBRICION desde vacia → permitido (primer monta del ciclo)', () => {
    expect(estadoPermiteEvento('vacia', 'CUBRICION')).toBe(true)
  })
  it('CUBRICION desde cubierta → permitido (monta repetida en el mismo ciclo)', () => {
    expect(estadoPermiteEvento('cubierta', 'CUBRICION')).toBe(true)
  })
  it('CUBRICION desde gestante → denegado (ya está gestante)', () => {
    expect(estadoPermiteEvento('gestante', 'CUBRICION')).toBe(false)
  })
  it('CUBRICION desde lactante → denegado (debe destetar antes de reiniciar ciclo)', () => {
    expect(estadoPermiteEvento('lactante', 'CUBRICION')).toBe(false)
  })

  // PARTO ─────────────────────────────────────────────────────────────────────
  it('PARTO desde cubierta → permitido (parto sin confirmación, típico en extensivo)', () => {
    expect(estadoPermiteEvento('cubierta', 'PARTO')).toBe(true)
  })
  it('PARTO desde gestante → permitido (flujo completo con confirmación previa)', () => {
    expect(estadoPermiteEvento('gestante', 'PARTO')).toBe(true)
  })
  it('PARTO desde vacia → denegado (no puede parir sin haber sido cubierta)', () => {
    expect(estadoPermiteEvento('vacia', 'PARTO')).toBe(false)
  })
  it('PARTO desde lactante → denegado (no puede parir estando en lactación)', () => {
    expect(estadoPermiteEvento('lactante', 'PARTO')).toBe(false)
  })

  // DESTETE ───────────────────────────────────────────────────────────────────
  it('DESTETE desde lactante → permitido (único estado válido para destetar)', () => {
    expect(estadoPermiteEvento('lactante', 'DESTETE')).toBe(true)
  })
  it('DESTETE desde vacia → denegado (no hay crías que destetar)', () => {
    expect(estadoPermiteEvento('vacia', 'DESTETE')).toBe(false)
  })
  it('DESTETE desde cubierta → denegado (aún no ha parido)', () => {
    expect(estadoPermiteEvento('cubierta', 'DESTETE')).toBe(false)
  })

  // ABORTO ────────────────────────────────────────────────────────────────────
  it('ABORTO desde cubierta → permitido (pérdida antes de confirmación)', () => {
    expect(estadoPermiteEvento('cubierta', 'ABORTO')).toBe(true)
  })
  it('ABORTO desde gestante → permitido (aborto tardío)', () => {
    expect(estadoPermiteEvento('gestante', 'ABORTO')).toBe(true)
  })
  it('ABORTO desde lactante → denegado (ya parió; el ciclo avanzó más allá del aborto)', () => {
    expect(estadoPermiteEvento('lactante', 'ABORTO')).toBe(false)
  })

  // null ──────────────────────────────────────────────────────────────────────
  it('estado null → deniega todos los eventos (el módulo reproductivo no aplica a este animal)', () => {
    // null significa es_reproductora=false. Ningún evento reproductivo es válido para estos animales.
    // Separación crítica de dominio: null ≠ 'vacia'.
    expect(estadoPermiteEvento(null, 'CUBRICION')).toBe(false)
    expect(estadoPermiteEvento(null, 'PARTO')).toBe(false)
    expect(estadoPermiteEvento(null, 'DESTETE')).toBe(false)
  })

})

// ── evalCycleRules — CUBRICION ────────────────────────────────────────────────

describe('EVAL: ReproductiveCycleRules — CUBRICION', () => {

  it('sin ciclo abierto → acción "crear" (primera cubrición, arranca el ciclo)', () => {
    // Si no existe ciclo abierto, el Use Case debe crear uno nuevo.
    // cicloId=null porque el id real lo asignará el RPC en la transacción.
    const ctx: ReproductiveContext = {
      animal:           ANIMAL_VACIA,
      cicloAbierto:     null,
      eventoSolicitado: 'CUBRICION',
      fechaEvento:      '2026-07-01',
    }
    const decision = evalCycleRules(ctx)
    expect(decision.accion).toBe('crear')
    expect(decision.cicloId).toBeNull()
  })

  it('con ciclo abierto → acción "reutilizar" (cubrición repetida, no abre nuevo ciclo)', () => {
    // Si ya existe ciclo abierto es que ya hubo una cubrición previa.
    // La nueva cubrición se registra en el mismo ciclo y actualiza la proyección.
    const ctx: ReproductiveContext = {
      animal:           { ...ANIMAL_VACIA, estado_reproductivo: 'cubierta' },
      cicloAbierto:     CICLO_ABIERTO,
      eventoSolicitado: 'CUBRICION',
      fechaEvento:      '2026-07-15',
    }
    const decision = evalCycleRules(ctx)
    expect(decision.accion).toBe('reutilizar')
    expect(decision.cicloId).toBe('uuid-ciclo')
  })

})

// ── evalCycleRules — PARTO ────────────────────────────────────────────────────

describe('EVAL: ReproductiveCycleRules — PARTO', () => {

  it('con ciclo abierto → acción "reutilizar" (el parto ocurre dentro del ciclo vigente)', () => {
    // El parto no crea ni cierra el ciclo por sí mismo; simplemente ocurre dentro de él.
    // El ciclo se cierra más tarde, cuando todas las crías son destetadas (PRD010).
    const ctx: ReproductiveContext = {
      animal:           { ...ANIMAL_VACIA, estado_reproductivo: 'gestante' },
      cicloAbierto:     CICLO_ABIERTO,
      eventoSolicitado: 'PARTO',
      fechaEvento:      '2026-10-01',
    }
    const decision = evalCycleRules(ctx)
    expect(decision.accion).toBe('reutilizar')
    expect(decision.cicloId).toBe('uuid-ciclo')
  })

  it('sin ciclo abierto → lanza (el parto sin ciclo previo indica corrupción de datos)', () => {
    // EligibilityRules garantiza que el estado sea cubierta/gestante antes de llegar aquí,
    // lo que implica que siempre existe un ciclo abierto. Si no lo hay, algo falló antes.
    const ctx: ReproductiveContext = {
      animal:           { ...ANIMAL_VACIA, estado_reproductivo: 'gestante' },
      cicloAbierto:     null,
      eventoSolicitado: 'PARTO',
      fechaEvento:      '2026-10-01',
    }
    expect(() => evalCycleRules(ctx)).toThrow(/PARTO requiere un ciclo/)
  })

})

// ── buildSnapshot — CUBRICION ─────────────────────────────────────────────────

describe('EVAL: ReproductiveProjection — buildSnapshot CUBRICION', () => {

  it('vacuno: estado → cubierta y fechaPrevistaParto = fechaEvento + 283 días', () => {
    // La cubrición es el evento que dispara el cálculo de fecha prevista de parto.
    // Para vacuno la duración media de gestación es 283 días (rango real: 270-290).
    // Esta fecha se persiste en animal.fecha_prevista_parto para el widget KPI.
    const ctx: ReproductiveContext = {
      animal:           ANIMAL_VACIA,
      cicloAbierto:     null,
      eventoSolicitado: 'CUBRICION',
      fechaEvento:      '2026-07-01',
    }
    const snapshot = buildSnapshot(ctx, null)
    expect(snapshot.estadoReproductivo).toBe('cubierta')
    const esperada = addDays(parseISO('2026-07-01'), 283).toISOString().split('T')[0]
    expect(snapshot.fechaPrevistaParto).toBe(esperada)
    // diasRestantes se calcula contra new Date() — solo verificamos que no es null
    expect(snapshot.diasRestantes).not.toBeNull()
  })

  it('porcino: fechaPrevistaParto = fechaEvento + 114 días (regla 3-3-3: 3 meses + 3 semanas + 3 días)', () => {
    // Para cerdas la duración de gestación es 114 días, conocida como "la regla de los tres treses".
    // El cálculo debe usar la especie del animal, no un valor hardcodeado global.
    const ctx: ReproductiveContext = {
      animal:           { ...ANIMAL_VACIA, especie: 'porcino' },
      cicloAbierto:     null,
      eventoSolicitado: 'CUBRICION',
      fechaEvento:      '2026-07-01',
    }
    const snapshot = buildSnapshot(ctx, null)
    const esperada = addDays(parseISO('2026-07-01'), 114).toISOString().split('T')[0]
    expect(snapshot.fechaPrevistaParto).toBe(esperada)
  })

  it('cicloActivoId se propaga al snapshot tal cual lo recibe', () => {
    // El Use Case llama a buildSnapshot con el id del ciclo ya resuelto.
    // La función no debe modificarlo; lo propaga transparentemente al snapshot.
    const ctx: ReproductiveContext = {
      animal:           { ...ANIMAL_VACIA, estado_reproductivo: 'cubierta' },
      cicloAbierto:     CICLO_ABIERTO,
      eventoSolicitado: 'CUBRICION',
      fechaEvento:      '2026-07-15',
    }
    const snapshot = buildSnapshot(ctx, 'uuid-ciclo')
    expect(snapshot.cicloActivoId).toBe('uuid-ciclo')
  })

})

// ── buildSnapshot — PARTO ─────────────────────────────────────────────────────

describe('EVAL: ReproductiveProjection — buildSnapshot PARTO', () => {

  it('gestante → lactante; fechaPrevistaParto es null (el RPC limpia el campo en BD)', () => {
    // El parto no recalcula la fecha prevista: esa fecha ya cumplió su propósito.
    // Devolver null aquí es correcto; el RPC se encarga de limpiar la columna en la BD
    // para que el widget KPI deje de mostrar la cuenta atrás.
    const ctx: ReproductiveContext = {
      animal:           { ...ANIMAL_VACIA, estado_reproductivo: 'gestante' },
      cicloAbierto:     CICLO_ABIERTO,
      eventoSolicitado: 'PARTO',
      fechaEvento:      '2026-10-01',
    }
    const snapshot = buildSnapshot(ctx, 'uuid-ciclo')
    expect(snapshot.estadoReproductivo).toBe('lactante')
    expect(snapshot.fechaPrevistaParto).toBeNull()
    expect(snapshot.diasRestantes).toBeNull()
  })

})
