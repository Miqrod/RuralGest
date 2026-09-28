-- =============================================================================
-- PRD015 — Tablas explotacion y parametrizacion (Tarea 292)
--
-- explotacion: singleton que representa los datos de la explotación.
--   Una sola fila. Sistema single-tenant: no hay explotacion_id en tablas de dominio.
-- parametrizacion: parámetros configurables por código y especie.
--   Unicidad con dos índices parciales porque NULL != NULL en UNIQUE estándar de PG.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabla explotacion (singleton)
-- -----------------------------------------------------------------------------
CREATE TABLE explotacion (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre            TEXT        NOT NULL,
  nombre_comercial  TEXT        NULL,
  email             TEXT        NULL,
  telefono          TEXT        NULL,
  direccion         TEXT        NULL,
  codigo_postal     TEXT        NULL,
  municipio         TEXT        NULL,
  provincia         TEXT        NULL,
  pais              TEXT        NULL,
  latitud           DECIMAL     NULL,
  longitud          DECIMAL     NULL,
  logo_storage_path TEXT        NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE explotacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated" ON explotacion
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Única fila de la explotación
INSERT INTO explotacion (nombre) VALUES ('Hermanos Rodríguez');

-- -----------------------------------------------------------------------------
-- Enums para parametrizacion
-- -----------------------------------------------------------------------------
CREATE TYPE categoria_parametrizacion_enum AS ENUM (
  'REPRODUCTIVO',
  'FINANCIERO',
  'OPERATIVO'
);

CREATE TYPE tipo_valor_parametrizacion_enum AS ENUM (
  'INTEGER',
  'DECIMAL',
  'BOOLEAN',
  'TEXT',
  'DATE'
);

CREATE TYPE unidad_parametrizacion_enum AS ENUM (
  'DIAS',
  'EUROS',
  'PORCENTAJE',
  'KG',
  'UNIDADES'
);

-- -----------------------------------------------------------------------------
-- Tabla parametrizacion
-- -----------------------------------------------------------------------------
CREATE TABLE parametrizacion (
  id          UUID                            PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      TEXT                            NOT NULL,
  descripcion TEXT                            NOT NULL,
  -- valor siempre TEXT; tipo_valor indica cómo interpretarlo en la aplicación
  valor       TEXT                            NOT NULL,
  -- NULL = parámetro global (aplica a todas las especies)
  especie     especie_enum                    NULL,
  categoria   categoria_parametrizacion_enum  NOT NULL,
  tipo_valor  tipo_valor_parametrizacion_enum NOT NULL,
  unidad      unidad_parametrizacion_enum     NULL,
  created_at  TIMESTAMPTZ                     NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ                     NOT NULL DEFAULT now(),
  -- updated_at se actualiza explícitamente en la Server Action de escritura
  created_by  UUID                            NULL REFERENCES auth.users(id),
  updated_by  UUID                            NULL REFERENCES auth.users(id)
);

ALTER TABLE parametrizacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated" ON parametrizacion
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Unicidad (codigo, especie) con NULL-safe: dos índices parciales.
-- Un UNIQUE estándar no funciona porque en PG NULL != NULL,
-- lo que permitiría múltiples filas con mismo código y especie NULL.
CREATE UNIQUE INDEX uq_param_codigo_especie
  ON parametrizacion(codigo, especie)
  WHERE especie IS NOT NULL;

CREATE UNIQUE INDEX uq_param_codigo_sin_especie
  ON parametrizacion(codigo)
  WHERE especie IS NULL;

-- Seed: umbral de días para revisión reproductiva de vacuno
INSERT INTO parametrizacion (codigo, descripcion, valor, especie, categoria, tipo_valor, unidad)
VALUES (
  'umbral_revision_reproductiva_dias',
  'Días para sugerir revisión reproductiva',
  '240',
  'vacuno',
  'REPRODUCTIVO',
  'INTEGER',
  'DIAS'
);

-- Nota: la query de ubicación histórica join evento_animales + eventos.
-- Los índices existentes son suficientes:
--   idx_evento_animales_animal(animal_id) + PK eventos(id) + idx_eventos_fecha(fecha).
