-- =============================================================================
-- PRD014 — Instalaciones y Reubicación de Animales
-- Tarea 245: completar FK de animal.ubicacion_actual_id y lote.ubicacion_actual_id
--
-- Las columnas ya existen como UUID NULL desde la migración base.
-- Solo se añaden las restricciones de clave foránea hacia instalacion.
-- Las filas existentes con NULL no se ven afectadas.
-- =============================================================================

ALTER TABLE animal
  ADD CONSTRAINT animal_ubicacion_actual_id_fkey
  FOREIGN KEY (ubicacion_actual_id) REFERENCES instalacion(id);

ALTER TABLE lote
  ADD CONSTRAINT lote_ubicacion_actual_id_fkey
  FOREIGN KEY (ubicacion_actual_id) REFERENCES instalacion(id);
