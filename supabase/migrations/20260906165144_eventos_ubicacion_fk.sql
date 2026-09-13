-- =============================================================================
-- PRD014 — Instalaciones y Reubicación de Animales
-- Tarea 244: extender eventos con ubicacion_origen_id y ubicacion_destino_id
--
-- Son datos estructurales del evento CAMBIO_UBICACION — no van en metadata_json.
-- Nullable porque la gran mayoría de eventos no son CAMBIO_UBICACION.
-- FK apunta a instalacion.id (el PRD §9.2 referenciaba ubicacion.id por error).
-- =============================================================================

ALTER TABLE eventos
  ADD COLUMN ubicacion_origen_id  UUID NULL REFERENCES instalacion(id),
  ADD COLUMN ubicacion_destino_id UUID NULL REFERENCES instalacion(id);

CREATE INDEX idx_eventos_ubicacion_origen  ON eventos (ubicacion_origen_id)  WHERE ubicacion_origen_id  IS NOT NULL;
CREATE INDEX idx_eventos_ubicacion_destino ON eventos (ubicacion_destino_id) WHERE ubicacion_destino_id IS NOT NULL;
