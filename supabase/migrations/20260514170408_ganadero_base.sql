-- =============================================================================
-- MIGRATION 001: Capa ganadera
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 3.1 EXTENSIONES + ENUMS
-- Los ENUMs van primero porque las tablas los referencian.
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Generales
CREATE TYPE especie_enum AS ENUM ('vacuno', 'porcino');
CREATE TYPE sexo_enum AS ENUM ('macho', 'hembra');
CREATE TYPE origen_animal_enum AS ENUM ('interno', 'compra');

-- Estados de animal
CREATE TYPE estado_vital_enum AS ENUM ('vivo', 'muerto', 'vendido');
CREATE TYPE estado_reproductivo_enum AS ENUM ('vacia', 'no_reproductiva', 'gestante', 'lactante');
CREATE TYPE estado_sanitario_enum AS ENUM ('sano', 'en_observacion', 'en_tratamiento', 'no_apto');

-- Lotes
CREATE TYPE estado_lote_enum AS ENUM ('activo', 'cerrado');
CREATE TYPE tipo_lote_enum AS ENUM ('camada', 'post_destete', 'engorde');

-- Movimientos
CREATE TYPE movimiento_estado_enum AS ENUM ('activo', 'cancelado');
CREATE TYPE tipo_base_movimiento_enum AS ENUM ('ENTRADA', 'SALIDA', 'MIXTO');

-- Eventos
CREATE TYPE tipo_tecnico_evento_enum AS ENUM ('STOCK', 'BIOLOGICO', 'OPERATIVO', 'SISTEMA');

-- Ciclo reproductivo
CREATE TYPE resultado_ciclo_enum AS ENUM ('parto', 'aborto', 'desconocido', 'venta', 'muerte');


-- -----------------------------------------------------------------------------
-- 3.2 LOTE + ANIMAL (sin FK circulares con eventos todavía)
-- lote va antes que animal porque animal.lote_id → lote.id
-- -----------------------------------------------------------------------------

CREATE TABLE lote (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  especie especie_enum NOT NULL,
  tipo_lote tipo_lote_enum NOT NULL,

  codigo_identificacion TEXT NULL,
  lote_origen_id UUID NULL REFERENCES lote(id),

  fecha_creacion DATE NOT NULL,
  fecha_cierre DATE NULL,

  cantidad_actual INTEGER NOT NULL DEFAULT 0
    CHECK (cantidad_actual >= 0),

  estado estado_lote_enum NOT NULL DEFAULT 'activo',
  estado_sanitario estado_sanitario_enum NOT NULL DEFAULT 'sano',

  ubicacion_actual_id UUID NULL,
  alimentacion TEXT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_by UUID NULL,

  CONSTRAINT chk_lote_fecha_cierre
    CHECK (fecha_cierre IS NULL OR fecha_cierre >= fecha_creacion)
);

CREATE INDEX idx_lote_especie ON lote(especie);
CREATE INDEX idx_lote_estado ON lote(estado);
CREATE INDEX idx_lote_tipo ON lote(tipo_lote);


CREATE TABLE animal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  especie especie_enum NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('normal', 'reproductor')),

  crotal TEXT UNIQUE NULL,
  num_hierro TEXT NULL,

  fecha_nacimiento DATE NULL,
  fecha_nacimiento_estimada DATE NULL,

  sexo sexo_enum NOT NULL,

  madre_id UUID NULL REFERENCES animal(id),
  padre_id UUID NULL REFERENCES animal(id),

  es_reproductora BOOLEAN NOT NULL DEFAULT false,
  origen origen_animal_enum NOT NULL,

  lote_id UUID NULL REFERENCES lote(id),
  lote_origen_id UUID NULL REFERENCES lote(id),

  -- FK a eventos se añaden al final (referencia circular)
  evento_creacion_id UUID NULL,
  evento_origen_id UUID NULL,

  estado_vital estado_vital_enum NOT NULL DEFAULT 'vivo',
  estado_reproductivo estado_reproductivo_enum NULL,
  estado_sanitario estado_sanitario_enum NOT NULL DEFAULT 'sano',

  ubicacion_actual_id UUID NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_by UUID NULL,

  CONSTRAINT chk_fecha_nacimiento
    CHECK (fecha_nacimiento IS NOT NULL OR fecha_nacimiento_estimada IS NOT NULL),

  CONSTRAINT chk_estado_reproductivo
    CHECK (
      (es_reproductora = false AND estado_reproductivo IS NULL)
      OR
      (es_reproductora = true)
    )
);

CREATE INDEX idx_animal_especie ON animal(especie);
CREATE INDEX idx_animal_lote ON animal(lote_id);
CREATE INDEX idx_animal_estado_vital ON animal(estado_vital);
CREATE INDEX idx_animal_sexo ON animal(sexo);


-- -----------------------------------------------------------------------------
-- 3.3 MOVIMIENTO + TIPO_EVENTO + MOTIVOS_MOVIMIENTO
-- Catálogos necesarios antes de crear la tabla eventos.
-- -----------------------------------------------------------------------------

CREATE TABLE movimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  tipo_movimiento TEXT NOT NULL,
  fecha TIMESTAMP NOT NULL,
  descripcion TEXT NULL,
  usuario_id UUID NULL,

  estado movimiento_estado_enum NOT NULL DEFAULT 'activo',

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by UUID NULL
);

CREATE INDEX idx_movimiento_fecha ON movimiento(fecha);
CREATE INDEX idx_movimiento_estado ON movimiento(estado);


CREATE TABLE tipo_evento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  codigo TEXT NOT NULL UNIQUE,
  descripcion TEXT NOT NULL,

  tipo_tecnico tipo_tecnico_evento_enum NOT NULL,
  tipo_negocio TEXT NOT NULL,

  es_biologico BOOLEAN NOT NULL DEFAULT false,
  requiere_motivo BOOLEAN NOT NULL DEFAULT false,
  afecta_stock BOOLEAN NOT NULL DEFAULT false,
  afecta_animales BOOLEAN NOT NULL DEFAULT false,
  afecta_lotes BOOLEAN NOT NULL DEFAULT false,

  activo BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by UUID NULL
);

CREATE INDEX idx_tipo_evento_codigo ON tipo_evento(codigo);


CREATE TABLE motivos_movimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nombre TEXT NOT NULL UNIQUE,
  tipo_base tipo_base_movimiento_enum NOT NULL,
  descripcion TEXT NULL,

  es_monetizable BOOLEAN NOT NULL DEFAULT false,
  tipo_economico TEXT NOT NULL
    CHECK (tipo_economico IN ('ingreso', 'gasto', 'ninguno')),

  activo BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by UUID NULL
);


-- -----------------------------------------------------------------------------
-- 3.4 CICLO_REPRODUCTIVO
-- Depende de animal. Agrupa eventos reproductivos de una hembra.
-- -----------------------------------------------------------------------------

CREATE TABLE ciclo_reproductivo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  animal_id UUID NOT NULL REFERENCES animal(id),

  numero_ciclo INTEGER NOT NULL CHECK (numero_ciclo > 0),

  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NULL,

  resultado resultado_ciclo_enum NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by UUID NULL,

  CONSTRAINT uq_ciclo_numero UNIQUE (animal_id, numero_ciclo),
  CONSTRAINT chk_fechas_ciclo
    CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE INDEX idx_ciclo_animal ON ciclo_reproductivo(animal_id);
CREATE INDEX idx_ciclo_resultado ON ciclo_reproductivo(resultado);


-- -----------------------------------------------------------------------------
-- 3.5 EVENTOS (tabla central del sistema)
-- Depende de: tipo_evento, motivos_movimiento, movimiento, ciclo_reproductivo.
-- evento_referencia_id es auto-referencial: permite trazabilidad de compensaciones.
-- -----------------------------------------------------------------------------

CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  tipo_evento_id UUID NOT NULL REFERENCES tipo_evento(id),
  motivo_id UUID NULL REFERENCES motivos_movimiento(id),
  movimiento_id UUID NULL REFERENCES movimiento(id),

  -- Apunta al evento que originó este (útil para compensaciones futuras)
  evento_referencia_id UUID NULL REFERENCES eventos(id),

  fecha TIMESTAMP NOT NULL,
  especie especie_enum NOT NULL,

  ciclo_id UUID NULL REFERENCES ciclo_reproductivo(id),

  metadata_json JSONB NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by UUID NULL
);

CREATE INDEX idx_eventos_fecha ON eventos(fecha);
CREATE INDEX idx_eventos_tipo ON eventos(tipo_evento_id);
CREATE INDEX idx_eventos_movimiento ON eventos(movimiento_id);
CREATE INDEX idx_eventos_ciclo ON eventos(ciclo_id);


-- -----------------------------------------------------------------------------
-- 3.6 EVENTO_ANIMALES + EVENTO_LOTES
-- Tablas de relación N:M entre eventos y entidades físicas.
-- ON DELETE CASCADE: si se elimina un evento, sus relaciones se limpian.
-- -----------------------------------------------------------------------------

CREATE TABLE evento_animales (
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES animal(id),
  rol TEXT NULL,  -- madre, macho, hijo, etc.

  PRIMARY KEY (evento_id, animal_id)
);

CREATE INDEX idx_evento_animales_animal ON evento_animales(animal_id);


CREATE TABLE evento_lotes (
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  lote_id UUID NOT NULL REFERENCES lote(id),
  lote_origen_id UUID NULL REFERENCES lote(id),
  rol TEXT NOT NULL,   -- origen | destino | sujeto | afectado
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),

  PRIMARY KEY (evento_id, lote_id, rol)
);

CREATE INDEX idx_evento_lotes_lote ON evento_lotes(lote_id);


-- -----------------------------------------------------------------------------
-- 3.7 ALTER TABLE ANIMAL — Cierra las FK circulares con eventos
-- Se hace al final porque eventos no existía cuando se creó animal.
-- -----------------------------------------------------------------------------

ALTER TABLE animal
  ADD CONSTRAINT fk_animal_evento_creacion
    FOREIGN KEY (evento_creacion_id) REFERENCES eventos(id);

ALTER TABLE animal
  ADD CONSTRAINT fk_animal_evento_origen
    FOREIGN KEY (evento_origen_id) REFERENCES eventos(id);
