import type { Animal, CrearAnimalInput } from './types'
import type { EstadoReproductivo, Sexo } from '../../shared/domain/types'

// ─── Reglas del tipo productivo ───────────────────────────────────────────────
//
// Ciclo de vida (decisiones 2026-11-07):
//
//   Parto → Cría → (destete, automático) → Recría → (decisión) → Reproductora / Semental / Engorde
//                                                                 (porcino: Verraco = Semental, Cebo = Engorde)
//
//   · Cría: la asigna el parto y solo la abandona el destete (→ Recría). No admite cambios manuales.
//   · Recría: fase de transición tras el destete. Nunca es destino manual: no se vuelve a Recría.
//   · Reproductora / Semental / Engorde: cambios manuales libres entre ellos, respetando el sexo
//     (reactivación incluida: Engorde → Reproductora).
//
// Fuente de verdad: los RPC cambiar_tipo_productivo y registrar_compra_animal
// (migration 20261107000000). Esta copia existe para que la UI pueda explicar el
// bloqueo antes de enviar. Mantener los mensajes alineados con el SQL.

// Tipos productivos ligados al sexo del animal (vacuno y porcino).
// Verraco es el equivalente porcino de Semental.
const SEXO_REQUERIDO_POR_TIPO: Record<string, 'macho' | 'hembra'> = {
  Reproductora: 'hembra',
  Semental:     'macho',
  Verraco:      'macho',
}

export function sexoRequeridoParaTipo(tipoNombre: string): 'macho' | 'hembra' | null {
  return SEXO_REQUERIDO_POR_TIPO[tipoNombre] ?? null
}

// Coherencia sexo ↔ tipo, común a cambio de tipo y compra. Con sexo NULL se bloquea
// pidiendo identificar el sexo, en lugar de asignar un tipo cuyo significado depende
// de un dato desconocido. `accion` completa la frase del mensaje de sexo NULL.
function validarSexoParaTipo(sexo: Sexo, tipoNombre: string, accion: string): string | null {
  const requerido = sexoRequeridoParaTipo(tipoNombre)
  if (!requerido) return null
  if (sexo === null) {
    return `Indica el sexo del animal antes de ${accion} ${tipoNombre}.`
  }
  if (sexo !== requerido) {
    return `El tipo ${tipoNombre} solo puede asignarse a ${requerido === 'hembra' ? 'hembras' : 'machos'}.`
  }
  return null
}

// Origen de un cambio manual: una Cría no admite cambios (su único cambio lo hace el destete).
// Devuelve el mensaje de bloqueo o null si el animal puede cambiar de tipo.
export function validarTipoProductivoOrigen(tipoActualNombre: string | null): string | null {
  if (tipoActualNombre === 'Cría') {
    return 'Una Cría solo cambia de tipo productivo mediante el destete.'
  }
  return null
}

// Destino de un cambio manual. Devuelve el mensaje de bloqueo o null si es válido.
//   · 'Cría' nunca es destino: solo la asigna el parto.
//   · 'Recría' nunca es destino: es la fase posterior al destete, no se vuelve a ella.
//   · Tipos ligados al sexo: sexo identificado y coincidente.
export function validarTipoProductivoDestino(sexo: Sexo, tipoNombre: string): string | null {
  if (tipoNombre === 'Cría') {
    return 'El tipo Cría solo se asigna al nacer; no puede elegirse en un cambio de tipo productivo.'
  }
  if (tipoNombre === 'Recría') {
    return 'Recría es la fase posterior al destete; no puede elegirse en un cambio de tipo productivo.'
  }
  return validarSexoParaTipo(sexo, tipoNombre, 'cambiar su tipo productivo a')
}

// Tipo de entrada de un animal comprado. Igual que el destino de un cambio, salvo que
// Recría SÍ es válida: es el tipo con el que entra un animal de recría comprado.
// Cría no: un animal comprado no tiene madre ni vínculo en la explotación, nunca podría
// destetarse y quedaría como Cría para siempre.
export function validarTipoProductivoEntrada(sexo: Sexo, tipoNombre: string): string | null {
  if (tipoNombre === 'Cría') {
    return 'El tipo Cría solo se asigna al nacer; un animal comprado no puede entrar como Cría.'
  }
  return validarSexoParaTipo(sexo, tipoNombre, 'asignarle el tipo productivo')
}

export function assertFechaNacimientoPresente(
  input: Pick<CrearAnimalInput, 'fecha_nacimiento' | 'fecha_nacimiento_estimada'>,
) {
  if (!input.fecha_nacimiento && !input.fecha_nacimiento_estimada) {
    throw new Error('Se requiere fecha_nacimiento o fecha_nacimiento_estimada')
  }
}

export function assertEstadoReproductivoCoherente(
  es_reproductora: boolean,
  estado_reproductivo: string | null,
) {
  if (!es_reproductora && estado_reproductivo !== null) {
    throw new Error('Un animal no reproductor no puede tener estado_reproductivo')
  }
}

// Primera línea de defensa antes del RPC: valida contra el snapshot en memoria,
// sin roundtrip a BD. El RPC añade una segunda validación con FOR UPDATE dentro
// de la transacción para cubrir condiciones de carrera.
export function assertAnimalPuedeSalir(animal: Pick<Animal, 'estado_vital' | 'crotal'>) {
  if (animal.estado_vital !== 'vivo') {
    const identificador = animal.crotal ? ` (crotal: ${animal.crotal})` : ''
    throw new Error(
      `El animal${identificador} no puede salir: estado_vital actual es "${animal.estado_vital}"`,
    )
  }
}

// Mensaje contextual del drawer de cambio de tipo según el estado reproductivo al
// salir de Reproductora. Espejo UX de las reglas del RPC cambiar_tipo_productivo.
//
//   gestante → bloqueo total: el cambio no está permitido. El mensaje explica por qué.
//   cubierta → aviso + confirmación obligatoria: el ciclo se cerrará y la cubrición
//              quedará sin desenlace (pérdida de información irreversible).
//   vacia    → aviso informativo: el ciclo se cerrará.
//
// El drawer usa tipo 'bloqueo' para mostrar solo el mensaje con un botón de cerrar.
export function getMensajeCambioTipoProductivo(
  tipoNuevoNombre: string | undefined,
  tipoActualNombre: string | null,
  estadoReproductivo: EstadoReproductivo | null,
): { texto: string; tipo: 'bloqueo' | 'aviso' } | null {
  const esSalidaDeReproductora =
    tipoActualNombre === 'Reproductora' && tipoNuevoNombre !== 'Reproductora'

  // Gestante se muestra aunque no haya tipo seleccionado aún: el bloqueo es absoluto.
  if (tipoActualNombre === 'Reproductora' && estadoReproductivo === 'gestante') {
    return {
      tipo: 'bloqueo',
      texto: 'No es posible cambiar el tipo productivo durante una gestación en curso. Registra el parto o aborto del ciclo actual para poder realizar este cambio.',
    }
  }

  if (!esSalidaDeReproductora || !estadoReproductivo) return null

  if (estadoReproductivo === 'cubierta') {
    return {
      tipo: 'aviso',
      texto: 'Este animal tiene una cubrición registrada. Al cambiar de tipo, el ciclo se cerrará y la cubrición quedará sin desenlace.',
    }
  }
  if (estadoReproductivo === 'vacia') {
    return {
      tipo: 'aviso',
      texto: 'Este animal tiene un ciclo abierto en estado vacía. Al cambiar de tipo, el ciclo se cerrará.',
    }
  }
  return null
}
