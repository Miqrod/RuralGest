-- =============================================================================
-- PRD014 — Instalaciones y Reubicación de Animales
-- Tarea 246: añadir 'self' a rol_evento_animal_enum
--
-- 'self': el evento se aplica al propio animal como objeto directo.
-- No expresa una relación con otro animal (a diferencia de 'madre' y 'cria').
-- Se usa en CAMBIO_UBICACION, VENTA, MUERTE.
-- Es valor interno — nunca se muestra al usuario.
-- ALTER TYPE ADD VALUE es seguro con filas existentes (no requiere DROP/CREATE).
-- =============================================================================

ALTER TYPE rol_evento_animal_enum ADD VALUE IF NOT EXISTS 'self';
