-- =============================================================================
-- MIGRATION 002: Capa financiera
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 4.1 CATEGORIA_FINANCIERA
-- Árbol jerárquico: parent_id NULL = categoría raíz.
-- Va primero porque venta y transaccion la referencian.
-- -----------------------------------------------------------------------------

CREATE TABLE categoria_financiera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),

  -- Auto-referencial: permite construir árbol de categorías
  parent_id UUID NULL REFERENCES categoria_financiera(id),

  activo BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_categoria_financiera_tipo ON categoria_financiera(tipo);
CREATE INDEX idx_categoria_financiera_parent ON categoria_financiera(parent_id);


-- -----------------------------------------------------------------------------
-- 4.2 TERCERO
-- Cualquier persona o empresa con relación económica.
-- Va antes que venta, factura y transaccion porque todas la referencian.
-- -----------------------------------------------------------------------------

CREATE TABLE tercero (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('cliente', 'proveedor', 'mixto')),

  activo BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_tercero_tipo ON tercero(tipo);


-- -----------------------------------------------------------------------------
-- 4.3 VENTA
-- El acuerdo comercial. No es dinero ni documento — es el "trato".
-- Estado evoluciona: abierta → parcial → facturada.
-- Regla crítica (se aplica en backend): si tiene transacciones, no se puede editar.
-- -----------------------------------------------------------------------------

CREATE TABLE venta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  cliente_id UUID NOT NULL REFERENCES tercero(id),
  categoria_id UUID NOT NULL REFERENCES categoria_financiera(id),

  fecha DATE NOT NULL,

  -- Estado refleja la situación de facturación de la venta
  estado TEXT NOT NULL DEFAULT 'abierta'
    CHECK (estado IN ('abierta', 'parcial', 'facturada')),

  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_venta_cliente ON venta(cliente_id);
CREATE INDEX idx_venta_estado ON venta(estado);
CREATE INDEX idx_venta_fecha ON venta(fecha);


-- -----------------------------------------------------------------------------
-- 4.4 VENTA_LINEA (pieza más importante del sistema financiero)
-- Conecta EVENTOS (realidad física) con VENTA (operación comercial).
-- Es el puente GANADERO ↔ FINANCIERO.
-- chk_tipo_entidad garantiza exclusividad: animal_id XOR lote_id.
-- -----------------------------------------------------------------------------

CREATE TABLE venta_linea (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  venta_id UUID NOT NULL REFERENCES venta(id),
  evento_id UUID NOT NULL REFERENCES eventos(id),

  -- Define qué se está vendiendo
  tipo TEXT NOT NULL CHECK (tipo IN ('animal', 'lote')),
  animal_id UUID NULL REFERENCES animal(id),
  lote_id UUID NULL REFERENCES lote(id),

  cantidad INTEGER NOT NULL CHECK (cantidad > 0),

  created_at TIMESTAMP NOT NULL DEFAULT now(),

  -- Garantiza que tipo y entidad son coherentes: nunca ambos ni ninguno
  CONSTRAINT chk_tipo_entidad CHECK (
    (tipo = 'animal' AND animal_id IS NOT NULL AND lote_id IS NULL)
    OR
    (tipo = 'lote'   AND lote_id IS NOT NULL   AND animal_id IS NULL)
  )
);

CREATE INDEX idx_venta_linea_venta ON venta_linea(venta_id);
CREATE INDEX idx_venta_linea_evento ON venta_linea(evento_id);


-- -----------------------------------------------------------------------------
-- 4.5 FACTURA
-- Documento externo: llega del matadero, del proveedor de pienso, etc.
-- Minimalista: el detalle económico vive en factura_linea y transaccion.
-- -----------------------------------------------------------------------------

CREATE TABLE factura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  tercero_id UUID NOT NULL REFERENCES tercero(id),

  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),

  fecha DATE NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_factura_tercero ON factura(tercero_id);
CREATE INDEX idx_factura_tipo ON factura(tipo);
CREATE INDEX idx_factura_fecha ON factura(fecha);


-- -----------------------------------------------------------------------------
-- 4.6 FACTURA_LINEA + FACTURA_LINEA_DETALLE
-- Dos niveles de granularidad dentro de una factura.
-- factura_linea: nivel agregado (lo que ves en la factura).
-- factura_linea_detalle: nivel animal a animal, cuando viene desglosado.
-- -----------------------------------------------------------------------------

CREATE TABLE factura_linea (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  factura_id UUID NOT NULL REFERENCES factura(id),

  -- Nullable: gastos sin venta previa (pienso, veterinario, etc.)
  venta_linea_id UUID NULL REFERENCES venta_linea(id),

  total_kg NUMERIC NULL,
  total_importe NUMERIC NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_factura_linea_factura ON factura_linea(factura_id);
CREATE INDEX idx_factura_linea_venta_linea ON factura_linea(venta_linea_id);


CREATE TABLE factura_linea_detalle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  factura_linea_id UUID NOT NULL REFERENCES factura_linea(id),

  peso NUMERIC NULL,
  precio_unitario NUMERIC NULL,

  -- Datos flexibles por línea: sexo, categoría, canal, etc.
  metadata JSONB NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_factura_linea_detalle_linea ON factura_linea_detalle(factura_linea_id);


-- -----------------------------------------------------------------------------
-- 4.7 TRANSACCION
-- El movimiento económico real. Inmutable por diseño (backend lo garantiza).
-- chk_origen_relaciones codifica en DB las reglas de coherencia por origen:
--   prevision → requiere venta_id
--   factura   → requiere factura_id
--   manual    → no requiere ninguno
-- importe >= 0 siempre: la dirección del dinero la da el campo tipo.
-- tercero_id y categoria_id SIEMPRE informados para facilitar reporting.
-- -----------------------------------------------------------------------------

CREATE TABLE transaccion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  origen TEXT NOT NULL CHECK (origen IN ('prevision', 'factura', 'manual')),

  -- Relaciones opcionales según origen
  venta_id UUID NULL REFERENCES venta(id),
  factura_id UUID NULL REFERENCES factura(id),

  -- Siempre informados: permiten reporting directo sin joins
  tercero_id UUID NOT NULL REFERENCES tercero(id),
  categoria_id UUID NOT NULL REFERENCES categoria_financiera(id),

  importe NUMERIC NOT NULL CHECK (importe >= 0),
  fecha DATE NOT NULL,

  -- Obligatorio: hace legible cada movimiento en listados
  descripcion TEXT NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now(),

  -- Coherencia entre origen y relaciones
  CONSTRAINT chk_origen_relaciones CHECK (
    (origen = 'prevision' AND venta_id IS NOT NULL AND factura_id IS NULL)
    OR
    (origen = 'factura'   AND factura_id IS NOT NULL)
    OR
    (origen = 'manual')
  )
);

CREATE INDEX idx_transaccion_tipo ON transaccion(tipo);
CREATE INDEX idx_transaccion_origen ON transaccion(origen);
CREATE INDEX idx_transaccion_fecha ON transaccion(fecha);
CREATE INDEX idx_transaccion_tercero ON transaccion(tercero_id);
CREATE INDEX idx_transaccion_categoria ON transaccion(categoria_id);


-- -----------------------------------------------------------------------------
-- 4.8 DOCUMENTOS
-- Tabla polimórfica: se asocia a cualquier entidad via entidad_tipo + entidad_id.
-- No tiene FK para mantener el desacoplamiento. entidad_tipo limita los valores.
-- -----------------------------------------------------------------------------

CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  tipo TEXT NOT NULL CHECK (tipo IN ('factura', 'ticket', 'imagen', 'documento')),

  url TEXT NOT NULL,

  entidad_tipo TEXT NOT NULL
    CHECK (entidad_tipo IN ('animal', 'lote', 'evento', 'transaccion', 'factura')),
  entidad_id UUID NOT NULL,

  descripcion TEXT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_documentos_entidad ON documentos(entidad_tipo, entidad_id);
