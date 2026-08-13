-- =============================================================================
-- Campos de identificación y parto en animal (PRD009 · tarea 104)
--
-- estado_identificacion: solo relevante para crías nacidas de un Parto.
--   NULL  → animal pre-existente o sin parto registrado (no aplica la lógica)
--   PENDIENTE → cría creada por el sistema al registrar el Parto, aún sin
--               crotal / hierro / fecha de nacimiento real asignados
--   COMPLETA  → todos los datos de identificación oficial ya han sido
--               informados (AnimalIdentificationRules lo evalúa)
--
-- parto_evento_id: FK al evento de Parto que originó a esta cría.
--   NULL para todos los animales que no nacieron de un Parto registrado en el
--   sistema (compras, nacimientos anteriores al módulo reproductivo, etc.).
--   Permite derivar el ciclo reproductivo de la madre sin duplicar el campo:
--     parto_evento_id → eventos.ciclo_id
-- =============================================================================

-- 1. Enum administrativo para el flujo de identificación de crías
CREATE TYPE estado_identificacion_enum AS ENUM ('pendiente', 'completa');

-- 2. Añadir campos a animal
ALTER TABLE animal
  ADD COLUMN estado_identificacion estado_identificacion_enum,
  ADD COLUMN parto_evento_id       UUID REFERENCES eventos(id);
