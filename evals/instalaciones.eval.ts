import { describe, it, expect } from 'vitest'

import {
  mapHistorialRow,
  mapInstalacionRowToListItem,
  mapAnimalEnInstalacionRow,
  mapCrearInstalacionToInsert,
  mapActualizarInstalacionToUpdate,
  mapReubicacionInputToRpcArgs,
} from '@/modules/ganadero/instalaciones/infrastructure/mapper'

// ── mapHistorialRow ───────────────────────────────────────────────────────────

describe('EVAL: Instalaciones — mapHistorialRow', () => {

  const baseRow = {
    id: 'evento-1',
    fecha: '2026-09-01',
    metadata_json: null,
    origen: null,
    destino: null,
  }

  it('extrae contexto desde metadata_json cuando existe', () => {
    // El contexto ('parto', 'compra', 'venta', 'muerte') no es columna propia
    // sino que viaja dentro del payload JSON del evento. Si se cambia la clave
    // en el RPC, el historial mostraría todos los cambios como "manuales" sin avisar.
    const result = mapHistorialRow({
      ...baseRow,
      metadata_json: { contexto: 'parto' },
      destino: { nombre: 'El rincón' },
    })
    expect(result.contexto).toBe('parto')
  })

  it('devuelve contexto null cuando metadata_json es null', () => {
    // Las reubicaciones manuales no generan metadata_json; null es el valor
    // esperado y la UI lo interpreta como "movimiento manual".
    const result = mapHistorialRow(baseRow)
    expect(result.contexto).toBeNull()
  })

  it('devuelve contexto null cuando metadata_json no tiene clave contexto', () => {
    // Otros eventos pueden llevar metadata_json con claves distintas.
    // El mapper no debe fallar ni inventar un contexto en ese caso.
    const result = mapHistorialRow({ ...baseRow, metadata_json: { otro: 'valor' } })
    expect(result.contexto).toBeNull()
  })

  it('origen null representa primera alta (sin ubicación previa)', () => {
    // Cuando un animal se ubica por primera vez no hay instalación de origen.
    // La UI muestra '—' en la columna Origen; no debe confundirse con un error.
    const result = mapHistorialRow({ ...baseRow, destino: { nombre: 'Valdelera' } })
    expect(result.instalacion_origen_nombre).toBeNull()
    expect(result.instalacion_destino_nombre).toBe('Valdelera')
  })

  it('destino null representa salida del sistema (venta o muerte)', () => {
    // El RPC de salida de animal genera un CAMBIO_UBICACION con destino null
    // para registrar que el animal abandonó su instalación. La UI muestra
    // 'Sin ubicación' en la columna Destino de ese evento.
    const result = mapHistorialRow({ ...baseRow, origen: { nombre: 'El rincón' } })
    expect(result.instalacion_origen_nombre).toBe('El rincón')
    expect(result.instalacion_destino_nombre).toBeNull()
  })

  it('mapea evento_id desde row.id', () => {
    // evento_id es la clave React del listado; si apuntase al campo incorrecto
    // se producirían duplicados o renders incorrectos en el historial.
    const result = mapHistorialRow({ ...baseRow, id: 'uuid-evento' })
    expect(result.evento_id).toBe('uuid-evento')
  })

})

// ── mapInstalacionRowToListItem ───────────────────────────────────────────────

describe('EVAL: Instalaciones — mapInstalacionRowToListItem', () => {

  const baseRow = {
    id: 'inst-1',
    nombre: 'Valdelera',
    tipo: 'cercado' as const,
    activo: true,
    admite_animales: true,
    admite_stock: false,
    coordenadas: { lat: 40.913857, lng: -6.204804 },
    observaciones: null,
    created_at: '2026-01-01T00:00:00Z',
    created_by: null,
    animal: [{ count: 3 }],
  }

  it('extrae num_animales del array de count Supabase', () => {
    // Supabase devuelve los agregados como array de objetos, no como escalar.
    // Leer `row.animal.count` directamente devolvería undefined.
    const result = mapInstalacionRowToListItem(baseRow)
    expect(result.num_animales).toBe(3)
  })

  it('devuelve 0 cuando animal es null (sin animales en instalación)', () => {
    // Supabase devuelve null en el join cuando no hay filas relacionadas,
    // no un array vacío. El operador ?. evita que el mapper explote en ese caso.
    const result = mapInstalacionRowToListItem({ ...baseRow, animal: null })
    expect(result.num_animales).toBe(0)
  })

  it('devuelve 0 cuando el array de count está vacío', () => {
    // Defensa adicional: si Supabase cambia y devuelve [] en vez de null,
    // el fallback ?? 0 debe seguir funcionando.
    const result = mapInstalacionRowToListItem({ ...baseRow, animal: [] })
    expect(result.num_animales).toBe(0)
  })

  it('coordenadas null es un valor válido (instalación sin ubicar en mapa)', () => {
    // No todas las instalaciones tienen coordenadas — el mapa no muestra marcador
    // para ellas. El mapper no debe convertir null en objeto vacío.
    const result = mapInstalacionRowToListItem({ ...baseRow, coordenadas: null })
    expect(result.coordenadas).toBeNull()
  })

})

// ── mapAnimalEnInstalacionRow ─────────────────────────────────────────────────

describe('EVAL: Instalaciones — mapAnimalEnInstalacionRow', () => {

  const baseAnimal = {
    id: 'animal-1',
    crotal: 'ES001',
    nombre: 'Lucero',
    especie: 'vacuno',
    sexo: 'macho',
    tipo_productivo: { nombre: 'Semental' },
  }

  it('extrae tipo_productivo_nombre desde el join', () => {
    // El nombre del tipo productivo viene de una tabla relacionada; un join roto
    // devuelve null en lugar de un error, con lo que el bug pasaría desapercibido.
    const result = mapAnimalEnInstalacionRow(baseAnimal, '2026-09-01')
    expect(result.tipo_productivo_nombre).toBe('Semental')
  })

  it('devuelve null cuando no hay tipo_productivo (cría sin tipo asignado)', () => {
    // Las crías recién nacidas pueden no tener tipo productivo asignado todavía.
    // El mapper debe tolerarlo sin lanzar excepción.
    const result = mapAnimalEnInstalacionRow({ ...baseAnimal, tipo_productivo: null }, '2026-09-01')
    expect(result.tipo_productivo_nombre).toBeNull()
  })

  it('crotal null es válido (animal sin identificar)', () => {
    // Los animales pueden carecer de crotal antes de la identificación oficial.
    // La UI muestra 'Sin crotal' en ese caso; null no debe romperse en el mapper.
    const result = mapAnimalEnInstalacionRow({ ...baseAnimal, crotal: null }, '2026-09-01')
    expect(result.crotal).toBeNull()
  })

  it('propaga la fecha_ubicacion pasada como segundo argumento', () => {
    // La fecha de ubicación no está en la fila del animal sino en el evento
    // CAMBIO_UBICACION. Se pasa como argumento separado porque el join que
    // trae los datos del animal no incluye la fecha del movimiento.
    const result = mapAnimalEnInstalacionRow(baseAnimal, '2026-07-15')
    expect(result.fecha_ubicacion).toBe('2026-07-15')
  })

})

// ── mapCrearInstalacionToInsert ───────────────────────────────────────────────

describe('EVAL: Instalaciones — mapCrearInstalacionToInsert', () => {

  it('aplica trim al nombre', () => {
    // El nombre de la instalación se muestra en listas y mapas; espacios
    // sobrantes provocarían inconsistencias visuales y duplicados aparentes.
    const result = mapCrearInstalacionToInsert({ nombre: '  Corral  ', tipo: 'corral' })
    expect(result.nombre).toBe('Corral')
  })

  it('admite_animales por defecto es true', () => {
    // La mayoría de instalaciones se crean para alojar animales; el default
    // true evita que el usuario olvide activar la opción en el caso habitual.
    const result = mapCrearInstalacionToInsert({ nombre: 'X', tipo: 'cercado' })
    expect(result.admite_animales).toBe(true)
  })

  it('admite_stock por defecto es false', () => {
    // El stock de materiales (paja, pienso) es la excepción, no la norma.
    // Invierte el default respecto a admite_animales para reflejar esa realidad.
    const result = mapCrearInstalacionToInsert({ nombre: 'X', tipo: 'cercado' })
    expect(result.admite_stock).toBe(false)
  })

  it('respeta overrides explícitos de admite_animales y admite_stock', () => {
    // Un almacén o pajar pasa admite_animales:false y admite_stock:true;
    // el mapper no debe forzar los defaults si el usuario los cambió.
    const result = mapCrearInstalacionToInsert({
      nombre: 'Pajar', tipo: 'almacen',
      admite_animales: false, admite_stock: true,
    })
    expect(result.admite_animales).toBe(false)
    expect(result.admite_stock).toBe(true)
  })

  it('coordenadas null cuando no se pasan', () => {
    // Las coordenadas son opcionales en la creación. Si el usuario no las fija
    // en el mapa, la instalación se guarda sin ellas y no aparece en el mapa.
    const result = mapCrearInstalacionToInsert({ nombre: 'X', tipo: 'otro' })
    expect(result.coordenadas).toBeNull()
  })

  it('propaga coordenadas cuando se pasan', () => {
    // Verifica que el objeto {lat, lng} llega intacto a la capa de persistencia
    // sin ser transformado ni serializado a string.
    const coords = { lat: 40.91, lng: -6.20 }
    const result = mapCrearInstalacionToInsert({ nombre: 'X', tipo: 'cercado', coordenadas: coords })
    expect(result.coordenadas).toEqual(coords)
  })

})

// ── mapActualizarInstalacionToUpdate ──────────────────────────────────────────

describe('EVAL: Instalaciones — mapActualizarInstalacionToUpdate (partial update)', () => {

  it('solo incluye los campos definidos en el input', () => {
    // Si el mapper incluyese campos undefined, Supabase los interpreta como null
    // y borraría valores existentes en la base de datos silenciosamente.
    // El partial update debe tocar únicamente lo que el usuario modificó.
    const result = mapActualizarInstalacionToUpdate({ id: 'inst-1', nombre: 'Nuevo nombre' })
    expect(result).toEqual({ nombre: 'Nuevo nombre' })
    expect('tipo' in result).toBe(false)
    expect('coordenadas' in result).toBe(false)
  })

  it('devuelve objeto vacío cuando no hay campos a actualizar', () => {
    // Caso límite: el usuario abre el drawer y cierra sin modificar nada.
    // Un objeto vacío permite que la acción decida si hacer la llamada o no.
    const result = mapActualizarInstalacionToUpdate({ id: 'inst-1' })
    expect(result).toEqual({})
  })

  it('coordenadas null es un valor válido para limpiar coordenadas existentes', () => {
    // El usuario puede querer eliminar las coordenadas de una instalación
    // (e.g., la posición era incorrecta y prefiere dejarlo sin mapa por ahora).
    // null explícito debe distinguirse de undefined (campo no tocado).
    const result = mapActualizarInstalacionToUpdate({ id: 'inst-1', coordenadas: null })
    expect(result.coordenadas).toBeNull()
    expect('coordenadas' in result).toBe(true)
  })

  it('aplica trim al nombre en actualización', () => {
    // El mismo riesgo que en creación: espacios sobrantes quedarían en base
    // de datos si el trim solo estuviese en el mapper de creación.
    const result = mapActualizarInstalacionToUpdate({ id: 'inst-1', nombre: '  El rincón  ' })
    expect(result.nombre).toBe('El rincón')
  })

})

// ── mapReubicacionInputToRpcArgs ──────────────────────────────────────────────

describe('EVAL: Instalaciones — mapReubicacionInputToRpcArgs', () => {

  const input = {
    animal_ids: ['uuid-a1', 'uuid-a2'],
    ubicacion_destino_id: 'uuid-dest',
    fecha: '2026-09-01',
  }

  it('mapea animal_ids a p_animal_ids', () => {
    // El RPC espera el prefijo p_ en todos sus parámetros. Si el mapper enviase
    // animal_ids sin prefijo, Postgres ignoraría el argumento sin lanzar error
    // y ningún animal quedaría reubicado.
    const result = mapReubicacionInputToRpcArgs(input)
    expect(result.p_animal_ids).toEqual(['uuid-a1', 'uuid-a2'])
  })

  it('mapea ubicacion_destino_id a p_ubicacion_destino_id', () => {
    // Mismo riesgo que con p_animal_ids: un nombre de parámetro incorrecto
    // provocaría que el RPC usase null como destino sin devolver error.
    const result = mapReubicacionInputToRpcArgs(input)
    expect(result.p_ubicacion_destino_id).toBe('uuid-dest')
  })

  it('mapea fecha a p_fecha', () => {
    const result = mapReubicacionInputToRpcArgs(input)
    expect(result.p_fecha).toBe('2026-09-01')
  })

  it('funciona con un solo animal (array unitario)', () => {
    // El RPC acepta un único animal como array de un elemento; el flujo individual
    // de la ficha pasa siempre un array con el id del animal actual.
    const result = mapReubicacionInputToRpcArgs({ ...input, animal_ids: ['uuid-solo'] })
    expect(result.p_animal_ids).toHaveLength(1)
    expect(result.p_animal_ids[0]).toBe('uuid-solo')
  })

})
