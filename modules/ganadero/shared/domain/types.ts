export type Especie = 'vacuno' | 'porcino'
export type Sexo = 'macho' | 'hembra' | null
export type OrigenAnimal = 'interno' | 'compra'
export type EstadoVital = 'vivo' | 'muerto' | 'vendido'
export type EstadoReproductivo = 'vacia' | 'cubierta' | 'gestante'
export type EstadoSanitario = 'sano' | 'en_observacion' | 'en_tratamiento' | 'no_apto'
export type EstadoLote = 'activo' | 'cerrado'
export type TipoLote = 'camada' | 'post_destete' | 'engorde'
export type TipoTecnicoEvento = 'STOCK' | 'BIOLOGICO' | 'OPERATIVO' | 'SISTEMA'
// Desenlace reproductivo de un ciclo.
// 'venta' y 'muerte' no son resultados reproductivos: son hechos del animal, no del ciclo.
// 'desconocido' y TIMEOUT quedan obsoletos.
export type ResultadoCiclo = 'parto' | 'aborto' | 'machorra' | 'cierre_manual'
export type MovimientoEstado = 'activo' | 'cancelado'
export type TipoBaseMovimiento = 'ENTRADA' | 'SALIDA' | 'MIXTO'
export type EstadoIdentificacion = 'pendiente' | 'completa'
// NULL = sin información suficiente (histórico); distinto de madre_id que es genealogía permanente
export type EstadoVinculoMaterno = 'activo' | 'finalizado'
