-- =============================================================================
-- PRD014 — Instalaciones y Reubicación de Animales
-- Tarea 243: enum tipo_instalacion_enum + tabla instalacion
--
-- La entidad instalacion representa un espacio físico de la explotación.
-- admite_animales y admite_stock son configuración explícita — no datos derivados.
-- La proyección animal.ubicacion_actual_id apuntará a esta tabla (FK en tarea 245).
-- =============================================================================

CREATE TYPE tipo_instalacion_enum AS ENUM (
  'corral',
  'nave',
  'prado',
  'cercado',
  'almacen',
  'otro'
);

CREATE TABLE instalacion (
  id              UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          TEXT                 NOT NULL,
  tipo            tipo_instalacion_enum NOT NULL,
  activo          BOOLEAN              NOT NULL DEFAULT true,
  -- admite_animales: si puede usarse como destino de nuevas ubicaciones de animales
  admite_animales BOOLEAN              NOT NULL DEFAULT true,
  -- admite_stock: si puede almacenar stock físico (paja, pienso, medicamentos…)
  admite_stock    BOOLEAN              NOT NULL DEFAULT false,
  coordenadas     JSONB                NULL,       -- formato {lat, lng}
  observaciones   TEXT                 NULL,
  created_at      TIMESTAMPTZ          NOT NULL DEFAULT now(),
  created_by      UUID                 NULL REFERENCES auth.users(id)
);

ALTER TABLE instalacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated" ON instalacion
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
