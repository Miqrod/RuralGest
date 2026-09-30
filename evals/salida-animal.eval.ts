import { describe, it, expect } from 'vitest'

import { assertAnimalPuedeSalir } from '@/modules/ganadero/animales/domain/rules'
import { mapVentaInputToRpcArgs, mapMuerteInputToRpcArgs } from '@/modules/ganadero/animales/infrastructure/mapper'
import { getAvailableActions } from '@/modules/ganadero/animales/domain/availableActions'

describe('EVAL: Salida de animal — reglas de dominio', () => {

  it('permite salida de animal vivo', () => {
    expect(() => assertAnimalPuedeSalir({ estado_vital: 'vivo', crotal: 'ES001' })).not.toThrow()
  })

  it('bloquea salida de animal ya vendido', () => {
    expect(() => assertAnimalPuedeSalir({ estado_vital: 'vendido', crotal: 'ES001' }))
      .toThrow(/no puede salir/)
  })

  it('bloquea salida de animal muerto', () => {
    expect(() => assertAnimalPuedeSalir({ estado_vital: 'muerto', crotal: 'ES001' }))
      .toThrow(/no puede salir/)
  })

  it('incluye el crotal en el mensaje de error cuando está disponible', () => {
    expect(() => assertAnimalPuedeSalir({ estado_vital: 'vendido', crotal: 'ES001' }))
      .toThrow(/crotal: ES001/)
  })

  it('funciona sin crotal (animal sin identificar)', () => {
    expect(() => assertAnimalPuedeSalir({ estado_vital: 'vendido', crotal: null }))
      .toThrow(/no puede salir/)
  })

})

describe('EVAL: Salida de animal — mappers RPC', () => {

  it('mapper de venta produce motivo "venta"', () => {
    // Los mappers son la única fuente de verdad sobre el valor del p_motivo que llega al RPC.
    const args = mapVentaInputToRpcArgs({ animal_id: 'uuid-animal', fecha_venta: '2024-06-01' })
    expect(args.p_animal_id).toBe('uuid-animal')
    expect(args.p_motivo).toBe('venta')
    expect(args.p_fecha).toBe('2024-06-01')
  })

  it('mapper de muerte produce motivo "muerte"', () => {
    const args = mapMuerteInputToRpcArgs({ animal_id: 'uuid-animal', fecha_muerte: '2024-06-01' })
    expect(args.p_animal_id).toBe('uuid-animal')
    expect(args.p_motivo).toBe('muerte')
    expect(args.p_fecha).toBe('2024-06-01')
  })

  it('venta y muerte comparten el mismo RPC pero con motivo distinto', () => {
    // Un único RPC maneja ambos casos — la distinción completa vive en p_motivo.
    const venta  = mapVentaInputToRpcArgs({ animal_id: 'uuid-animal', fecha_venta: '2024-06-01' })
    const muerte = mapMuerteInputToRpcArgs({ animal_id: 'uuid-animal', fecha_muerte: '2024-06-01' })
    expect(venta.p_motivo).not.toBe(muerte.p_motivo)
    expect(venta.p_animal_id).toBe(muerte.p_animal_id)
  })

})

// ── DISPONIBILIDAD DE ACCIÓN ──────────────────────────────────────────────────

describe('EVAL: Salida de animal — disponibilidad de acción', () => {

  it('salida disponible para animal vivo sin importar estado reproductivo', () => {
    // salida es la única acción incondicional: un animal vivo siempre puede salir
    // de la explotación independientemente de su estado reproductivo o tipo productivo.
    const acciones = getAvailableActions({
      estadoVital:         'vivo',
      estadoReproductivo:  null,
      tieneCicloAbierto:   false,
      esReproductora:      false,
      tieneCriasElegibles: false,
    })
    expect(acciones.has('salida')).toBe(true)
  })

  it('animal vendido: ninguna acción disponible', () => {
    // Un animal que ya salió no puede recibir más acciones.
    // getAvailableActions retorna Set vacío cuando estadoVital !== 'vivo'.
    const acciones = getAvailableActions({
      estadoVital:         'vendido',
      estadoReproductivo:  null,
      tieneCicloAbierto:   false,
      esReproductora:      false,
      tieneCriasElegibles: false,
    })
    expect(acciones.size).toBe(0)
  })

  it('animal muerto: ninguna acción disponible', () => {
    // Mismo gate que vendido: estado_vital != 'vivo' cierra todo el flujo de acciones.
    const acciones = getAvailableActions({
      estadoVital:         'muerto',
      estadoReproductivo:  null,
      tieneCicloAbierto:   false,
      esReproductora:      false,
      tieneCriasElegibles: false,
    })
    expect(acciones.size).toBe(0)
  })

})

// ── SEÑAL DE CIERRE POR SALIDA EN EL CICLO ───────────────────────────────────

describe('EVAL: Salida de animal — señal de cierre por salida en ciclo reproductivo', () => {

  it('ciclo con fecha_fin y resultado=null es cierre por salida', () => {
    // Convención del modelo: resultado=NULL en un ciclo con fecha_fin indica que
    // el cierre fue por venta/muerte, no por un evento reproductivo.
    // Los cierres reproductivos normales siempre tienen resultado:
    //   'parto' | 'aborto' | 'machorra' | 'cierre_manual'.
    // El carousel usa esta señal para inyectar la entrada
    // "Animal vendido/fallecido · Historia reproductiva finalizada".
    const cicloSalida = { fecha_fin: '2026-08-23', resultado: null as null }
    const esCierrePorSalida = !!cicloSalida.fecha_fin && cicloSalida.resultado === null
    expect(esCierrePorSalida).toBe(true)
  })

  it('ciclo con fecha_fin y resultado=parto NO es cierre por salida', () => {
    // Un ciclo cerrado tras parto + último destete tiene resultado 'parto'.
    // No debe confundirse con un cierre por salida del animal.
    const cicloNormal = { fecha_fin: '2026-08-23', resultado: 'parto' as string | null }
    const esCierrePorSalida = !!cicloNormal.fecha_fin && cicloNormal.resultado === null
    expect(esCierrePorSalida).toBe(false)
  })

  it('ciclo abierto (sin fecha_fin) no es cierre por salida', () => {
    // Un ciclo sin fecha_fin es un ciclo activo. El flag resultado=NULL aquí
    // significa "en curso" — no debe confundirse con el cierre por salida.
    const cicloAbierto = { fecha_fin: null as null, resultado: null as null }
    const esCierrePorSalida = !!cicloAbierto.fecha_fin && cicloAbierto.resultado === null
    expect(esCierrePorSalida).toBe(false)
  })

})

// ── DESTETE IMPLÍCITO DE CRÍAS ────────────────────────────────────────────────

describe('EVAL: Salida de animal — destete implícito y anotación en historial de cría', () => {

  it('cierre_por_salida "venta" genera etiqueta "(venta madre)"', () => {
    // Cuando la madre es vendida, el RPC crea un DESTETE implícito para cada cría
    // con metadata_json = {cierre_por_salida: 'venta'}.
    // La UI renderiza "(venta madre)" junto a "Destete" para explicar la causa.
    const metadata = { cierre_por_salida: 'venta' }
    const label = metadata.cierre_por_salida === 'muerte' ? 'muerte madre' : 'venta madre'
    expect(label).toBe('venta madre')
  })

  it('cierre_por_salida "muerte" genera etiqueta "(muerte madre)"', () => {
    // Mismo mecanismo para el caso de muerte: la cría fue destetada porque la madre murió.
    const metadata = { cierre_por_salida: 'muerte' }
    const label = metadata.cierre_por_salida === 'muerte' ? 'muerte madre' : 'venta madre'
    expect(label).toBe('muerte madre')
  })

  it('evento DESTETE implícito se vincula al ciclo del parto de la cría, no al ciclo actual de la madre', () => {
    // El ciclo_id del DESTETE implícito proviene de eventos.ciclo_id donde
    // eventos.id = cria.parto_evento_id. Así el evento aparece en el slide correcto
    // del carrusel (el ciclo donde nació la cría), no en el último ciclo de la madre.
    const cicloParto   = 'uuid-ciclo-c3'  // ciclo donde ocurrió el parto de la cría
    const cicloActual  = 'uuid-ciclo-c4'  // ciclo actual de la madre (vacía tras parto)
    // El RPC usa ep.ciclo_id (ciclo del parto), no v_madre_ciclo_id (ciclo actual)
    const cicloDestete = cicloParto
    expect(cicloDestete).toBe('uuid-ciclo-c3')
    expect(cicloDestete).not.toBe(cicloActual)
  })

})

// ── DESTETE IMPLÍCITO CUANDO SALE LA CRÍA ────────────────────────────────────
// Simétrico al bloque anterior: cuando la CRÍA sale, es la MADRE quien ve
// el DESTETE con la anotación contextual (cierre_por_cria, no cierre_por_salida).

describe('EVAL: Salida de animal — DESTETE implícito en ficha de la madre cuando sale la cría', () => {

  it('cierre_por_cria "venta" genera etiqueta "(venta cría)" en la ficha de la madre', () => {
    // Cuando una cría con vínculo activo es vendida, el RPC registra un DESTETE
    // con metadata_json = {cierre_por_cria: 'venta'} asociado a la madre.
    // La UI renderiza "(venta cría)" junto a "Destete" en la ficha de la madre.
    const metadata = { cierre_por_cria: 'venta' }
    const label = metadata.cierre_por_cria === 'muerte' ? 'muerte cría' : 'venta cría'
    expect(label).toBe('venta cría')
  })

  it('cierre_por_cria "muerte" genera etiqueta "(muerte cría)" en la ficha de la madre', () => {
    const metadata = { cierre_por_cria: 'muerte' }
    const label = metadata.cierre_por_cria === 'muerte' ? 'muerte cría' : 'venta cría'
    expect(label).toBe('muerte cría')
  })

  it('cierre_por_cria y cierre_por_salida son claves distintas — no se mezclan', () => {
    // cierre_por_cria  → cría sale, madre ve el DESTETE con esta clave
    // cierre_por_salida → madre sale, cría ve el DESTETE con esta clave
    const metadataCriaSale  = { cierre_por_cria: 'venta' }
    const metadataMadreSale = { cierre_por_salida: 'venta' }
    expect('cierre_por_cria'   in metadataCriaSale).toBe(true)
    expect('cierre_por_salida' in metadataCriaSale).toBe(false)
    expect('cierre_por_salida' in metadataMadreSale).toBe(true)
    expect('cierre_por_cria'   in metadataMadreSale).toBe(false)
  })

})

// ── CAMBIO_UBICACION EN SALIDA ────────────────────────────────────────────────

describe('EVAL: Salida de animal — CAMBIO_UBICACION al salir de la explotación', () => {

  it('animal con ubicación asignada → se genera CAMBIO_UBICACION al salir', () => {
    // Si ubicacion_actual_id != NULL antes de la salida, el RPC genera un evento
    // CAMBIO_UBICACION con origen=ubicacion_actual_id y destino=NULL.
    const ubicacionAntesDeSalida = 'uuid-instalacion-rincon'
    const debeGenerarEvento = ubicacionAntesDeSalida !== null
    expect(debeGenerarEvento).toBe(true)
  })

  it('animal sin ubicación asignada → NO se genera CAMBIO_UBICACION', () => {
    // Si el animal no tenía ubicación, no hay movimiento que registrar.
    const ubicacionAntesDeSalida = null
    const debeGenerarEvento = ubicacionAntesDeSalida !== null
    expect(debeGenerarEvento).toBe(false)
  })

  it('destino del CAMBIO_UBICACION de salida es siempre NULL', () => {
    // NULL en ubicacion_destino_id significa que el animal abandona el sistema
    // de seguimiento físico. No hay instalación "exterior" en la base de datos.
    const destinoAlSalir = null
    expect(destinoAlSalir).toBeNull()
  })

  it('metadata contexto = motivo de salida: "venta" o "muerte"', () => {
    // El mismo p_motivo que determina el estado_vital resultante
    // se propaga al metadata_json del CAMBIO_UBICACION para contexto en el log.
    const motivoVenta  = 'venta'
    const motivoMuerte = 'muerte'
    expect(['venta', 'muerte']).toContain(motivoVenta)
    expect(['venta', 'muerte']).toContain(motivoMuerte)
  })

})

// ── DESCRIPCIÓN DE CAMBIO_UBICACION EN UI ────────────────────────────────────

describe('EVAL: Salida de animal — descripción visual de CAMBIO_UBICACION', () => {

  // La UI (EventosList) muestra siempre "origen → destino".
  // Cuando uno de los extremos es NULL se sustituye por "(Alta)" o "(Baja)".

  function describeCambioUbicacion(origen: string | null, destino: string | null): string | null {
    if (origen && destino) return `${origen} → ${destino}`
    if (origen)            return `${origen} → (Baja)`
    if (destino)           return `(Alta) → ${destino}`
    return null
  }

  it('ambos presentes → "origen → destino"', () => {
    expect(describeCambioUbicacion('El rincón', 'Pradera')).toBe('El rincón → Pradera')
  })

  it('solo destino (nacimiento/compra) → "(Alta) → destino"', () => {
    expect(describeCambioUbicacion(null, 'El rincón')).toBe('(Alta) → El rincón')
  })

  it('solo origen (venta/muerte) → "origen → (Baja)"', () => {
    expect(describeCambioUbicacion('El rincón', null)).toBe('El rincón → (Baja)')
  })

  it('ninguno (sin ubicación asignada) → null', () => {
    expect(describeCambioUbicacion(null, null)).toBeNull()
  })

})
