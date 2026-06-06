-- =============================================================================
-- RAZAS POR ESPECIE
-- =============================================================================
-- Catálogo de razas asociadas a cada especie.
-- Los animales referencian la raza con una FK nullable (ON DELETE RESTRICT).
-- La columna activa permite desactivar razas sin borrarlas cuando hay animales
-- que ya las referencian.
-- =============================================================================

CREATE TABLE raza (
  id      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre  TEXT    NOT NULL,
  especie especie_enum NOT NULL,
  activa  BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (nombre, especie)
);

INSERT INTO raza (id, nombre, especie) VALUES
  ('bb000001-0000-0000-0000-000000000000', 'Morucha',   'vacuno'),
  ('bb000002-0000-0000-0000-000000000000', 'Charolesa', 'vacuno'),
  ('bb000003-0000-0000-0000-000000000000', 'Limusina',  'vacuno'),
  ('bb000004-0000-0000-0000-000000000000', 'Cruzada',   'vacuno'),
  ('bb000005-0000-0000-0000-000000000000', 'Ibérico',   'porcino'),
  ('bb000006-0000-0000-0000-000000000000', 'Duroc',     'porcino');

ALTER TABLE animal
  ADD COLUMN raza_id UUID REFERENCES raza(id) ON DELETE RESTRICT;

ALTER TABLE raza ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated" ON raza FOR ALL TO authenticated USING (true) WITH CHECK (true);
