export type Especie = 'vacuno' | 'porcino'
export type Sexo = 'macho' | 'hembra' | null
export type OrigenAnimal = 'interno' | 'compra'
export type EstadoVital = 'vivo' | 'muerto' | 'vendido'
export type EstadoReproductivo = 'vacia' | 'cubierta' | 'gestante' | 'lactante'
export type EstadoSanitario = 'sano' | 'en_observacion' | 'en_tratamiento' | 'no_apto'
export type EstadoLote = 'activo' | 'cerrado'
export type TipoLote = 'camada' | 'post_destete' | 'engorde'
export type TipoTecnicoEvento = 'STOCK' | 'BIOLOGICO' | 'OPERATIVO' | 'SISTEMA'
// 'destete' no es un resultado — es el mecanismo que cierra el ciclo.
// Cuando el ciclo cierra por destete, resultado = 'parto' (hubo un nacimiento).
// La información del destete queda en tipo_evento = DESTETE.
export type ResultadoCiclo = 'parto' | 'aborto' | 'desconocido' | 'venta' | 'muerte'
export type MovimientoEstado = 'activo' | 'cancelado'
export type TipoBaseMovimiento = 'ENTRADA' | 'SALIDA' | 'MIXTO'
export type EstadoIdentificacion = 'pendiente' | 'completa'
// NULL = sin información suficiente (histórico); distinto de madre_id que es genealogía permanente
export type EstadoVinculoMaterno = 'activo' | 'finalizado'
