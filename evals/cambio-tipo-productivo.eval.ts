import { describe, it, expect } from 'vitest'

import {
  validarTipoProductivoDestino,
  validarTipoProductivoOrigen,
  validarTipoProductivoEntrada,
  sexoRequeridoParaTipo,
  getMensajeCambioTipoProductivo,
} from '@/modules/ganadero/animales/domain/rules'
import { tipoEntradaSinteticaCierre } from '@/modules/ganadero/reproductivo/domain/rules'
import { generarHitosNuevoCiclo } from '@/modules/ganadero/animales/application/queries/listarEventosDeAnimal'

// Espejo TS de las reglas de los RPC cambiar_tipo_productivo y registrar_compra_animal
// (migrations 20261104000000 y 20261107000000). Si una regla cambia en SQL, debe cambiar aquí también.

describe('EVAL: Cambio de tipo productivo — Cría nunca es destino manual', () => {

  it.each(['hembra', 'macho', null] as const)('bloquea Cría para sexo %s', (sexo) => {
    expect(validarTipoProductivoDestino(sexo, 'Cría')).toMatch(/solo se asigna al nacer/)
  })

})

describe('EVAL: Cambio de tipo productivo — tipos ligados al sexo', () => {

  it('Reproductora requiere hembra; Semental y Verraco requieren macho', () => {
    expect(sexoRequeridoParaTipo('Reproductora')).toBe('hembra')
    expect(sexoRequeridoParaTipo('Semental')).toBe('macho')
    expect(sexoRequeridoParaTipo('Verraco')).toBe('macho')
  })

  it.each(['Engorde', 'Cebo'])('%s no depende del sexo', (tipo) => {
    expect(sexoRequeridoParaTipo(tipo)).toBeNull()
    expect(validarTipoProductivoDestino('hembra', tipo)).toBeNull()
    expect(validarTipoProductivoDestino('macho', tipo)).toBeNull()
    expect(validarTipoProductivoDestino(null, tipo)).toBeNull()
  })

  it('permite combinaciones coherentes', () => {
    expect(validarTipoProductivoDestino('hembra', 'Reproductora')).toBeNull()
    expect(validarTipoProductivoDestino('macho', 'Semental')).toBeNull()
    expect(validarTipoProductivoDestino('macho', 'Verraco')).toBeNull()
  })

  it('bloquea macho → Reproductora', () => {
    expect(validarTipoProductivoDestino('macho', 'Reproductora')).toMatch(/solo puede asignarse a hembras/)
  })

  it.each(['Semental', 'Verraco'])('bloquea hembra → %s', (tipo) => {
    expect(validarTipoProductivoDestino('hembra', tipo)).toMatch(/solo puede asignarse a machos/)
  })

})

describe('EVAL: Cambio de tipo productivo — sexo sin identificar', () => {

  it.each(['Reproductora', 'Semental', 'Verraco'])(
    'con sexo NULL bloquea %s pidiendo indicar el sexo',
    (tipo) => {
      const msg = validarTipoProductivoDestino(null, tipo)
      expect(msg).toMatch(/Indica el sexo del animal/)
      expect(msg).toContain(tipo)
    },
  )

})

// ── Mensaje del drawer según estado reproductivo (§5 del flujo) ──────────────

describe('EVAL: Cambio de tipo productivo — mensaje contextual del drawer', () => {

  it('gestante: bloqueo absoluto, incluso sin tipo seleccionado', () => {
    expect(getMensajeCambioTipoProductivo(undefined, 'Reproductora', 'gestante')?.tipo).toBe('bloqueo')
    expect(getMensajeCambioTipoProductivo('Engorde', 'Reproductora', 'gestante')?.tipo).toBe('bloqueo')
  })

  it('cubierta saliendo de Reproductora: aviso de cubrición sin desenlace', () => {
    const m = getMensajeCambioTipoProductivo('Engorde', 'Reproductora', 'cubierta')
    expect(m?.tipo).toBe('aviso')
    expect(m?.texto).toMatch(/cubrición quedará sin desenlace/)
  })

  it('vacía saliendo de Reproductora: aviso de cierre de ciclo', () => {
    const m = getMensajeCambioTipoProductivo('Engorde', 'Reproductora', 'vacia')
    expect(m?.tipo).toBe('aviso')
    expect(m?.texto).toMatch(/el ciclo se cerrará/)
  })

  it('sin mensaje cuando no se sale de Reproductora', () => {
    expect(getMensajeCambioTipoProductivo('Engorde', 'Recría', null)).toBeNull()
    expect(getMensajeCambioTipoProductivo('Reproductora', 'Recría', null)).toBeNull()
  })

  it('sin mensaje al salir de Reproductora sin estado reproductivo (sin ciclo abierto)', () => {
    expect(getMensajeCambioTipoProductivo('Engorde', 'Reproductora', null)).toBeNull()
  })

})

// ── Entrada sintética de cierre en el carrusel (§9.3 del flujo) ──────────────

describe('EVAL: Cambio de tipo productivo — entrada sintética de cierre en el carrusel', () => {

  const cambio = { codigo: 'CAMBIO_TIPO_PRODUCTIVO' }
  const cubricion = { codigo: 'CUBRICION' }

  it('ciclo cierre_manual legado (sin evento): inyecta cierre_manual', () => {
    expect(tipoEntradaSinteticaCierre(
      { fecha_fin: '2024-06-01', resultado: 'cierre_manual', eventos: [cubricion] }, 'vivo',
    )).toBe('cierre_manual')
  })

  it('ciclo cierre_manual con evento CAMBIO_TIPO_PRODUCTIVO real: no duplica', () => {
    expect(tipoEntradaSinteticaCierre(
      { fecha_fin: '2024-06-01', resultado: 'cierre_manual', eventos: [cubricion, cambio] }, 'vivo',
    )).toBeNull()
  })

  it('ciclo cerrado por salida (resultado NULL) de animal vendido/muerto: salida', () => {
    const ciclo = { fecha_fin: '2026-08-23', resultado: null, eventos: [cubricion] }
    expect(tipoEntradaSinteticaCierre(ciclo, 'vendido')).toBe('salida')
    expect(tipoEntradaSinteticaCierre(ciclo, 'muerto')).toBe('salida')
  })

  it('ciclo abierto o cerrado con desenlace reproductivo: sin entrada', () => {
    expect(tipoEntradaSinteticaCierre({ fecha_fin: null, resultado: null, eventos: [] }, 'vivo')).toBeNull()
    expect(tipoEntradaSinteticaCierre({ fecha_fin: '2026-05-01', resultado: 'parto', eventos: [] }, 'vivo')).toBeNull()
  })

})

// ── Hito "Nuevo ciclo" en el historial: también para C1 (decisión 2026-11-07) ─

describe('EVAL: Cambio de tipo productivo — hito Nuevo ciclo incluye C1', () => {

  const ciclo = (n: number, fecha: string) => ({
    id: `c${n}`, numero_ciclo: n, fecha_inicio: fecha, created_at: `${fecha}T10:00:00.000001+01:00`,
  })

  it('C1 creado al pasar a Reproductora genera su hito (antes se omitía)', () => {
    const hitos = generarHitosNuevoCiclo([ciclo(1, '2026-11-06')])
    expect(hitos).toHaveLength(1)
    expect(hitos[0]).toMatchObject({ virtual: true, tipo_codigo: 'NUEVO_CICLO', ciclo_numero: 1, fecha: '2026-11-06' })
  })

  it('un hito por ciclo, con id sintético (nunca UUID de la BD)', () => {
    const hitos = generarHitosNuevoCiclo([ciclo(1, '2023-03-01'), ciclo(2, '2026-11-06')])
    expect(hitos.map(h => h.ciclo_numero)).toEqual([1, 2])
    expect(hitos.map(h => h.id)).toEqual(['virtual-ciclo-c1', 'virtual-ciclo-c2'])
  })

  it('animal sin ciclos: sin hitos', () => {
    expect(generarHitosNuevoCiclo([])).toEqual([])
  })

})

// ── Transiciones del ciclo de vida: Cría y Recría (decisión 2026-11-07) ──────
//
//   Parto → Cría → (destete) → Recría → Reproductora / Semental / Engorde (Verraco / Cebo)

describe('EVAL: Cambio de tipo productivo — Recría no es destino manual', () => {

  it.each(['hembra', 'macho', null] as const)('bloquea → Recría para sexo %s', (sexo) => {
    expect(validarTipoProductivoDestino(sexo, 'Recría')).toMatch(/fase posterior al destete/)
  })

  it('desde Reproductora / Semental / Engorde no se vuelve a Recría', () => {
    // El origen no importa: la regla es del destino
    for (const sexo of ['hembra', 'macho'] as const) {
      expect(validarTipoProductivoDestino(sexo, 'Recría')).not.toBeNull()
    }
  })

  it('reactivación permitida: Engorde → Reproductora (hembra) / Semental (macho)', () => {
    expect(validarTipoProductivoOrigen('Engorde')).toBeNull()
    expect(validarTipoProductivoDestino('hembra', 'Reproductora')).toBeNull()
    expect(validarTipoProductivoDestino('macho', 'Semental')).toBeNull()
  })

  it('porcino: Cebo equivale a Engorde y Verraco a Semental', () => {
    expect(validarTipoProductivoDestino('hembra', 'Cebo')).toBeNull()
    expect(validarTipoProductivoDestino('macho', 'Verraco')).toBeNull()
    expect(validarTipoProductivoDestino('hembra', 'Verraco')).toMatch(/solo puede asignarse a machos/)
  })

})

describe('EVAL: Cambio de tipo productivo — Cría no admite cambios manuales', () => {

  it('origen Cría: bloqueado (su único cambio lo hace el destete)', () => {
    expect(validarTipoProductivoOrigen('Cría')).toMatch(/mediante el destete/)
  })

  it.each(['Recría', 'Reproductora', 'Semental', 'Engorde', 'Verraco', 'Cebo', null])(
    'origen %s: permitido', (tipo) => {
      expect(validarTipoProductivoOrigen(tipo)).toBeNull()
    },
  )

})

describe('EVAL: Compra — tipo productivo de entrada', () => {

  it('Recría SÍ es un tipo de entrada válido (animal de recría comprado)', () => {
    expect(validarTipoProductivoEntrada('hembra', 'Recría')).toBeNull()
    expect(validarTipoProductivoEntrada('macho', 'Recría')).toBeNull()
  })

  it('Cría no es tipo de entrada: nunca podría destetarse', () => {
    expect(validarTipoProductivoEntrada('hembra', 'Cría')).toMatch(/no puede entrar como Cría/)
  })

  it('coherencia sexo ↔ tipo también en la compra', () => {
    expect(validarTipoProductivoEntrada('hembra', 'Reproductora')).toBeNull()
    expect(validarTipoProductivoEntrada('macho', 'Semental')).toBeNull()
    expect(validarTipoProductivoEntrada('macho', 'Reproductora')).toMatch(/solo puede asignarse a hembras/)
    expect(validarTipoProductivoEntrada('hembra', 'Semental')).toMatch(/solo puede asignarse a machos/)
    expect(validarTipoProductivoEntrada(null, 'Reproductora')).toMatch(/Indica el sexo del animal antes de asignarle el tipo productivo Reproductora/)
  })

})
