import { describe, it, expect } from 'vitest'
import { addMonths, subMonths, subYears, format } from 'date-fns'

import { calcularPeriodo } from '@/modules/ganadero/reproductivo/domain/periodo'
import {
  calcularDistribucion,
} from '@/modules/ganadero/reproductivo/application/queries/getCurrentReproductiveSituation'
import {
  generarBuckets,
  calcularTasas,
  acumularEvento,
  metricsVacias,
} from '@/modules/ganadero/reproductivo/application/queries/getHistoricalReproductiveActivity'
import {
  clasificarFinalizada,
} from '@/modules/ganadero/reproductivo/application/queries/getDesenlacesCriasPeriodo'

// =============================================================================
// EVAL: Analítica reproductiva — lógica pura
//
// Módulos cubiertos:
//   A) calcularPeriodo    — rangos temporales por preset
//   B) calcularDistribucion — porcentajes por estado reproductivo
//   C) generarBuckets     — serie temporal mensual
//   D) calcularTasas      — tasas derivadas (gestación, fertilidad, aborto)
//   E) acumularEvento     — conteo de eventos y crías por tipo
//   F) clasificarFinalizada — clasificación de crías por metadata DESTETE
//
// Sin acceso a BD — toda la lógica es pura.
// =============================================================================

// ── A) calcularPeriodo ────────────────────────────────────────────────────────

describe('EVAL: calcularPeriodo — rangos por preset', () => {

  const HOY = new Date(2026, 8, 28) // 28 sep 2026 local
  const HASTA = '2026-09-28'

  it('ultimo_mes: desde = hoy - 1 mes', () => {
    // Verifica que el preset más corto genera el rango correcto.
    // La fecha "hasta" siempre es hoy; "desde" es exactamente 1 mes antes.
    const p = calcularPeriodo('ultimo_mes', HOY)
    expect(p.hasta).toBe(HASTA)
    expect(p.desde).toBe(format(subMonths(HOY, 1), 'yyyy-MM-dd'))
    expect(p.preset).toBe('ultimo_mes')
  })

  it('ultimo_trimestre: desde = hoy - 3 meses', () => {
    // El preset más habitual en ganadería extensiva (trimestre natural).
    const p = calcularPeriodo('ultimo_trimestre', HOY)
    expect(p.desde).toBe(format(subMonths(HOY, 3), 'yyyy-MM-dd'))
    expect(p.hasta).toBe(HASTA)
  })

  it('ultimo_semestre: desde = hoy - 6 meses', () => {
    // Cubre un ciclo reproductivo completo en vacuno (~9 meses gestación),
    // aunque no lo complete entero; útil para tendencias de cubrición→parto.
    const p = calcularPeriodo('ultimo_semestre', HOY)
    expect(p.desde).toBe(format(subMonths(HOY, 6), 'yyyy-MM-dd'))
  })

  it('ultimo_anio: desde = hoy - 1 año', () => {
    // Preset de máxima cobertura temporal disponible en el selector.
    const p = calcularPeriodo('ultimo_anio', HOY)
    expect(p.desde).toBe(format(subYears(HOY, 1), 'yyyy-MM-dd'))
  })

  it('preset se propaga al resultado', () => {
    // El campo preset es necesario para que el SelectorPeriodoNav marque
    // correctamente el botón activo en la UI.
    expect(calcularPeriodo('ultimo_trimestre', HOY).preset).toBe('ultimo_trimestre')
  })

  it('sin argumento hoy usa la fecha actual (smoke test)', () => {
    // Cuando se llama sin fecha, usa new Date() internamente.
    // Solo verifica que devuelve algo coherente sin lanzar.
    const p = calcularPeriodo('ultimo_mes')
    expect(p.desde).toBeTruthy()
    expect(p.hasta).toBeTruthy()
    expect(p.preset).toBe('ultimo_mes')
  })

})

// ── B) calcularDistribucion ───────────────────────────────────────────────────

describe('EVAL: calcularDistribucion — porcentajes y orden canónico', () => {

  it('orden canónico siempre es vacia → cubierta → gestante', () => {
    // El orden de los datos en DB es arbitrario; la UI necesita el orden canónico
    // que refleja el avance del ciclo reproductivo (vacía = inicio, gestante = final).
    const { distribucion } = calcularDistribucion([
      { estado_reproductivo: 'gestante' },
      { estado_reproductivo: 'vacia' },
      { estado_reproductivo: 'cubierta' },
    ])
    expect(distribucion.map(d => d.estado)).toEqual(['vacia', 'cubierta', 'gestante'])
  })

  it('los 3 estados canónicos aparecen aunque alguno tenga 0 animales', () => {
    // La UI siempre renderiza las 3 cards de estado. Si un estado no tiene
    // animales debe aparecer con total=0, no desaparecer del resultado.
    const { distribucion } = calcularDistribucion([
      { estado_reproductivo: 'vacia' },
    ])
    expect(distribucion).toHaveLength(3)
    expect(distribucion.find(d => d.estado === 'cubierta')?.total).toBe(0)
    expect(distribucion.find(d => d.estado === 'gestante')?.total).toBe(0)
  })

  it('porcentaje redondeado a 1 decimal', () => {
    // 1 de 3 = 33.333... → debe mostrarse como 33.3, no 33 ni 33.33.
    // La fórmula es Math.round(ratio * 1000) / 10 para obtener exactamente 1 decimal.
    const { distribucion } = calcularDistribucion([
      { estado_reproductivo: 'vacia' },
      { estado_reproductivo: 'vacia' },
      { estado_reproductivo: 'cubierta' },
    ])
    expect(distribucion.find(d => d.estado === 'cubierta')?.porcentaje).toBe(33.3)
    expect(distribucion.find(d => d.estado === 'vacia')?.porcentaje).toBe(66.7)
  })

  it('porcentajes suman 100 cuando hay una sola categoría', () => {
    // Caso base: si todas las reproductoras están en el mismo estado,
    // ese estado debe mostrar exactamente 100%.
    const { distribucion } = calcularDistribucion([
      { estado_reproductivo: 'gestante' },
      { estado_reproductivo: 'gestante' },
    ])
    const suma = distribucion.reduce((acc, d) => acc + d.porcentaje, 0)
    expect(suma).toBe(100)
  })

  it('sin reproductoras: todos los porcentajes son 0', () => {
    // Si no hay datos aún (explotación nueva o sin reproductoras activas),
    // no debe lanzar división por cero ni devolver NaN.
    const { distribucion, totalReproductoras } = calcularDistribucion([])
    expect(totalReproductoras).toBe(0)
    expect(distribucion.every(d => d.porcentaje === 0)).toBe(true)
  })

  it('totalReproductoras es el número total de filas recibidas', () => {
    // totalReproductoras alimenta el contador grande en la cabecera de la sección.
    // Debe ser exactamente el número de animales devueltos por la query, sin filtros adicionales.
    const rows = Array.from({ length: 7 }, () => ({ estado_reproductivo: 'vacia' as const }))
    expect(calcularDistribucion(rows).totalReproductoras).toBe(7)
  })

})

// ── C) generarBuckets ─────────────────────────────────────────────────────────

describe('EVAL: generarBuckets — serie temporal mensual', () => {

  it('un solo mes: desde y hasta dentro del mismo mes → 1 bucket', () => {
    // El periodo puede empezar y terminar en el mismo mes (ej. "último mes" en un mes corto).
    // El bucket cubre siempre el mes completo, no solo el rango interior.
    const buckets = generarBuckets('2026-07-10', '2026-07-25')
    expect(buckets).toHaveLength(1)
    expect(buckets[0].desde).toBe('2026-07-01')
    expect(buckets[0].hasta).toBe('2026-07-31')
  })

  it('tres meses consecutivos → 3 buckets', () => {
    // Verifica que se generan buckets para cada mes entre desde y hasta, inclusive.
    // Cada bucket representa exactamente un mes natural completo.
    const buckets = generarBuckets('2026-07-01', '2026-09-30')
    expect(buckets).toHaveLength(3)
    expect(buckets[0].desde).toBe('2026-07-01')
    expect(buckets[2].desde).toBe('2026-09-01')
    expect(buckets[2].hasta).toBe('2026-09-30')
  })

  it('hasta en el mismo mes que desde → solo 1 bucket aunque no sea fin de mes', () => {
    // Confirma que la condición de fin de loop es startOfMonth(hasta), no hasta literal.
    // Sep 1 → Sep 28: startOfMonth de ambas es Sep 1, por tanto 1 solo bucket.
    const buckets = generarBuckets('2026-09-01', '2026-09-28')
    expect(buckets).toHaveLength(1)
  })

  it('bucket cubre siempre el mes completo (primer y último día)', () => {
    // Febrero no bisiesto: el hasta del bucket debe ser el 28, no el 29 ni el 30.
    // endOfMonth de date-fns calcula esto correctamente.
    const buckets = generarBuckets('2026-02-15', '2026-02-15')
    expect(buckets[0].desde).toBe('2026-02-01')
    expect(buckets[0].hasta).toBe('2026-02-28') // 2026 no es bisiesto
  })

  it('un año completo → 13 buckets (ene a ene inclusive)', () => {
    // sep 2025 → sep 2026: sep 25, oct 25, nov 25, dic 25, ene 26, feb 26,
    // mar 26, abr 26, may 26, jun 26, jul 26, ago 26, sep 26 = 13 meses.
    const buckets = generarBuckets('2025-09-01', '2026-09-28')
    expect(buckets).toHaveLength(13)
  })

})

// ── D) calcularTasas ──────────────────────────────────────────────────────────

describe('EVAL: calcularTasas — tasas derivadas', () => {

  it('tasaGestacion = confirmaciones / cubriciones × 100 (1 decimal)', () => {
    // De cada 10 cubriciones, 7 llegaron a confirmación de gestación → 70%.
    // Es la tasa de "toma" o fertilización aparente del semental.
    const m = { ...metricsVacias(), cubriciones: 10, confirmaciones: 7 }
    const t = calcularTasas(m)
    expect(t.tasaGestacion).toBe(70)
  })

  it('tasaGestacion es null cuando no hay cubriciones', () => {
    // Si no hay cubriciones registradas, la tasa no tiene denominador válido.
    // Debe devolverse null para que la UI muestre "—" en lugar de 0%.
    const t = calcularTasas(metricsVacias())
    expect(t.tasaGestacion).toBeNull()
  })

  it('tasaFertilidad = partos / ciclosCerrados × 100', () => {
    // ciclosCerrados = partos + abortos + machorras.
    // De 10 ciclos cerrados (8 partos + 2 abortos), 8 terminaron en parto → 80%.
    const m = { ...metricsVacias(), partos: 8, abortos: 2 }
    const t = calcularTasas(m)
    expect(t.ciclosCerrados).toBe(10)
    expect(t.tasaFertilidad).toBe(80)
  })

  it('tasaAborto = abortos / ciclosCerrados × 100', () => {
    // Complemento de la tasa de fertilidad dentro de los ciclos con desenlace conocido.
    const m = { ...metricsVacias(), partos: 8, abortos: 2 }
    const t = calcularTasas(m)
    expect(t.tasaAborto).toBe(20)
  })

  it('tasaFertilidad y tasaAborto null cuando no hay ciclos cerrados', () => {
    // Si todas las cubriciones siguen abiertas (sin parto/aborto/machorra aún),
    // las tasas no tienen denominador → null en lugar de 0%.
    const m = { ...metricsVacias(), cubriciones: 5 }
    const t = calcularTasas(m)
    expect(t.tasaFertilidad).toBeNull()
    expect(t.tasaAborto).toBeNull()
  })

  it('machorra cuenta como ciclo cerrado para tasaFertilidad', () => {
    // La machorra cierra un ciclo sin parto — reduce la tasa de fertilidad.
    // 5 partos sobre 10 ciclos cerrados (5 partos + 5 machorras) = 50%.
    const m = { ...metricsVacias(), partos: 5, machorras: 5 }
    const t = calcularTasas(m)
    expect(t.ciclosCerrados).toBe(10)
    expect(t.tasaFertilidad).toBe(50)
  })

  it('tasaGestacion redondeada a 1 decimal', () => {
    // 1 confirmación sobre 3 cubriciones = 33.333...% → debe mostrarse como 33.3.
    const m = { ...metricsVacias(), cubriciones: 3, confirmaciones: 1 }
    expect(calcularTasas(m).tasaGestacion).toBe(33.3)
  })

})

// ── E) acumularEvento ─────────────────────────────────────────────────────────

describe('EVAL: acumularEvento — conteo por tipo de evento', () => {

  it('CUBRICION incrementa cubriciones', () => {
    // acumularEvento muta el objeto MetricasReproductivas directamente.
    // Verifica que cada tipo de evento solo toca su contador correspondiente.
    const m = metricsVacias()
    acumularEvento(m, 'CUBRICION', null)
    expect(m.cubriciones).toBe(1)
  })

  it('CONFIRMACION_GESTACION incrementa confirmaciones', () => {
    const m = metricsVacias()
    acumularEvento(m, 'CONFIRMACION_GESTACION', null)
    expect(m.confirmaciones).toBe(1)
  })

  it('PARTO sin evento_parto incrementa partos pero no crías', () => {
    // Si el PARTO no tiene datos de crías en evento_parto (registro incompleto),
    // el parto se cuenta igualmente pero las métricas de crías quedan a 0.
    const m = metricsVacias()
    acumularEvento(m, 'PARTO', null)
    expect(m.partos).toBe(1)
    expect(m.criasNacidas).toBe(0)
  })

  it('PARTO con evento_parto acumula las crías', () => {
    // El parto tenía 2 nacidos, 1 vivo y 1 muerto. Los tres contadores de crías
    // deben acumularse además del contador de partos.
    const m = metricsVacias()
    acumularEvento(m, 'PARTO', { numero_nacidos: 2, numero_vivos: 1, numero_muertos: 1 })
    expect(m.partos).toBe(1)
    expect(m.criasNacidas).toBe(2)
    expect(m.criasVivas).toBe(1)
    expect(m.criasMuertas).toBe(1)
  })

  it('varios partos acumulan crías correctamente', () => {
    // Dos partos en el mismo bucket deben sumar sus crías.
    const m = metricsVacias()
    acumularEvento(m, 'PARTO', { numero_nacidos: 1, numero_vivos: 1, numero_muertos: 0 })
    acumularEvento(m, 'PARTO', { numero_nacidos: 2, numero_vivos: 2, numero_muertos: 0 })
    expect(m.partos).toBe(2)
    expect(m.criasNacidas).toBe(3)
  })

  it('ABORTO incrementa abortos', () => {
    const m = metricsVacias()
    acumularEvento(m, 'ABORTO', null)
    expect(m.abortos).toBe(1)
  })

  it('MACHORRA incrementa machorras', () => {
    const m = metricsVacias()
    acumularEvento(m, 'MACHORRA', null)
    expect(m.machorras).toBe(1)
  })

  it('cada tipo de evento solo incrementa su contador, no los demás', () => {
    // Regresión: verifica que acumularEvento no tiene efectos colaterales
    // en contadores distintos al del evento procesado.
    const m = metricsVacias()
    acumularEvento(m, 'CUBRICION', null)
    expect(m.confirmaciones).toBe(0)
    expect(m.partos).toBe(0)
    expect(m.abortos).toBe(0)
    expect(m.machorras).toBe(0)
  })

})

// ── F) clasificarFinalizada ───────────────────────────────────────────────────

describe('EVAL: clasificarFinalizada — clasificación de crías por metadata DESTETE', () => {

  it('undefined → nacida_muerta (sin evento DESTETE en el mapa)', () => {
    // undefined significa que la cría no aparece en destetoMap porque nunca
    // tuvo un evento DESTETE. Esto identifica a las nacidas muertas: su vínculo
    // materno se cierra en el momento del parto sin necesidad de DESTETE.
    expect(clasificarFinalizada(undefined)).toBe('nacida_muerta')
  })

  it('null → destete_natural (evento DESTETE existe pero sin metadata especial)', () => {
    // null significa que el evento DESTETE existe pero su metadata_json es NULL en BD.
    // El ganadero lo registró explícitamente → es un destete natural voluntario.
    expect(clasificarFinalizada(null)).toBe('destete_natural')
  })

  it('objeto vacío → destete_natural', () => {
    // {} también es destete explícito del ganadero: el evento existe,
    // el metadata no contiene ningún campo especial que indique otra causa.
    expect(clasificarFinalizada({})).toBe('destete_natural')
  })

  it('cierre_por_salida: true → destete_forzado (madre murió o fue vendida)', () => {
    // El campo cierre_por_salida se escribe automáticamente cuando la madre
    // registra una salida (muerte o venta) con vínculos activos pendientes.
    // La cría sobrevivió pero se destetó de manera forzada.
    expect(clasificarFinalizada({ cierre_por_salida: true })).toBe('destete_forzado')
  })

  it('cierre_por_cria: "muerte" → muerte_antes_destete', () => {
    // La cría murió antes de completar el periodo de lactancia.
    // Su vínculo se cierra automáticamente con este metadata al registrar la muerte.
    expect(clasificarFinalizada({ cierre_por_cria: 'muerte' })).toBe('muerte_antes_destete')
  })

  it('cierre_por_cria: "venta" → vendida_antes_destete', () => {
    // La cría fue vendida mientras el vínculo materno seguía activo.
    // Es una salida anticipada: el destete nunca llegó a registrarse.
    expect(clasificarFinalizada({ cierre_por_cria: 'venta' })).toBe('vendida_antes_destete')
  })

  it('prioridad: cierre_por_salida tiene prioridad sobre cierre_por_cria', () => {
    // Si ambos campos coexisten (no debería ocurrir en datos normales), el
    // primer if de la función gana: cierre_por_salida se evalúa antes.
    // Documenta el comportamiento real, no la intención de negocio.
    expect(
      clasificarFinalizada({ cierre_por_salida: true, cierre_por_cria: 'muerte' })
    ).toBe('destete_forzado')
  })

  it('campo irrelevante en metadata → destete_natural', () => {
    // Datos del futuro o de extensiones desconocidas no deben romper la clasificación.
    // El fallback siempre es destete_natural (el ganadero registró el destete).
    expect(clasificarFinalizada({ otro_campo: 'valor' })).toBe('destete_natural')
  })

})
