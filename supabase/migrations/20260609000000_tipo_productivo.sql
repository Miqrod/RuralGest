-- =============================================================================
-- Catálogo tipo_productivo + refactor animal.tipo → tipo_productivo_id
-- =============================================================================
-- Reemplaza el campo animal.tipo ('normal' | 'reproductor') por una FK a un
-- catálogo por especie, siguiendo el mismo patrón que la tabla raza.
-- =============================================================================

CREATE TABLE tipo_productivo (
  id      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre  TEXT    NOT NULL,
  especie especie_enum NOT NULL,
  activa  BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (nombre, especie)
);

INSERT INTO tipo_productivo (id, nombre, especie) VALUES
  -- vacuno
  ('cc000001-0000-0000-0000-000000000000', 'Recría',       'vacuno'),
  ('cc000002-0000-0000-0000-000000000000', 'Reproductora', 'vacuno'),
  ('cc000003-0000-0000-0000-000000000000', 'Semental',     'vacuno'),
  ('cc000004-0000-0000-0000-000000000000', 'Engorde',      'vacuno'),
  -- porcino
  ('cc000005-0000-0000-0000-000000000000', 'Recría',       'porcino'),
  ('cc000006-0000-0000-0000-000000000000', 'Reproductora', 'porcino'),
  ('cc000007-0000-0000-0000-000000000000', 'Cebo',         'porcino'),
  ('cc000008-0000-0000-0000-000000000000', 'Verraco',      'porcino');

ALTER TABLE animal
  DROP COLUMN tipo,
  ADD COLUMN tipo_productivo_id UUID REFERENCES tipo_productivo(id) ON DELETE RESTRICT;

ALTER TABLE tipo_productivo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated" ON tipo_productivo
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
