-- =============================================================================
-- rol_evento_animal_enum en evento_animales
--
-- El campo rol describe qué papel juega un animal en un evento.
-- Era TEXT libre — riesgo de corrupción silenciosa por typos o inconsistencia
-- de mayúsculas. Se convierte a enum para garantizar integridad a nivel de BD.
--
-- Valores actuales:
--   madre — hembra que recibe el evento reproductivo
--   cria  — animal nacido en un parto
--
-- Para añadir un valor futuro (ej. 'padre' cuando se trace genealogía por evento):
--   ALTER TYPE rol_evento_animal_enum ADD VALUE 'padre';
-- =============================================================================

CREATE TYPE rol_evento_animal_enum AS ENUM ('madre', 'cria');

-- USING convierte los valores TEXT existentes al nuevo tipo.
-- Los valores NULL permanecen NULL (la columna es nullable).
ALTER TABLE evento_animales
  ALTER COLUMN rol TYPE rol_evento_animal_enum
  USING rol::rol_evento_animal_enum;
