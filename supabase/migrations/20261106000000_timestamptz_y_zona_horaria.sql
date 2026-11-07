-- ─────────────────────────────────────────────────────────────────────────────
-- Instantes como TIMESTAMPTZ + zona horaria de la explotación (Europe/Madrid)
--
-- Problema:
--   La BD funcionaba en UTC. CURRENT_DATE devolvía el día UTC, no el de la
--   explotación. Entre la medianoche local y la medianoche UTC:
--     · 7 RPCs rechazaban la fecha de hoy como "futura" (p_fecha > CURRENT_DATE):
--       registrar_parto, registrar_aborto, registrar_cubricion,
--       registrar_confirmacion_gestacion, registrar_destete, registrar_destete_lote,
--       registrar_reubicacion_animales.
--     · 3 RPCs registraban el hecho con el día anterior (fecha = CURRENT_DATE):
--       cambiar_tipo_productivo, registrar_machorra, registrar_machorra_animales.
--
-- Solución (decisión 2026-11-06, opción A):
--   1. Convertir a TIMESTAMPTZ todas las columnas que guardan instantes
--      (created_at / updated_at). Con TIMESTAMP sin zona, now() se guarda como hora
--      de reloj de la sesión: cambiar la zona de la BD mezclaría filas UTC y locales
--      y el orden se volvería ambiguo en la hora repetida del cambio de horario.
--      Con TIMESTAMPTZ se guarda el instante absoluto, independiente de la sesión.
--   2. Fijar la zona horaria de la BD a Europe/Madrid. CURRENT_DATE pasa a ser el
--      día de la explotación en TODOS los RPCs, presentes y futuros, sin redefinirlos.
--
-- Conversión: USING col AT TIME ZONE 'UTC' — los valores existentes se insertaron
-- con la sesión en UTC, así que se reinterpretan como instantes UTC (sin desplazar).
--
-- Fuera de alcance (a propósito):
--   · eventos.fecha y movimiento.fecha (TIMESTAMP): guardan fechas de negocio a
--     medianoche, insertadas desde DATE. DATE→TIMESTAMP no depende de la zona.
--   · Las 5 columnas que ya eran TIMESTAMPTZ (explotacion, instalacion, parametrizacion).
--
-- Revisión previa: ninguna función de public usa now()/clock_timestamp/timestamp en
-- su cuerpo; solo registrar_reubicacion_animales lee created_at (ORDER BY, válido con
-- TIMESTAMPTZ). Sin vistas, triggers, políticas RLS ni CHECKs sobre estas columnas.
-- Ningún rol tiene override de TimeZone, así que la zona aplica también a PostgREST.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Instantes → TIMESTAMPTZ ───────────────────────────────────────────────
-- Los DEFAULT (now(), clock_timestamp()) se conservan: ambos devuelven TIMESTAMPTZ.

ALTER TABLE animal
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE lote
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE ciclo_reproductivo    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE eventos               ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE tipo_evento           ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE motivos_movimiento    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE movimiento            ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE documentos            ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE tercero               ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE categoria_financiera  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE factura               ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE factura_linea         ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE factura_linea_detalle ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE transaccion           ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE venta                 ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE venta_linea           ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- ── 2. Zona horaria de la explotación ────────────────────────────────────────
-- current_database() en lugar de 'postgres' literal: no depende del nombre de la BD.
-- Aplica a las sesiones NUEVAS (PostgREST, RPCs, seed tras el reset).
DO $$
BEGIN
  EXECUTE format('ALTER DATABASE %I SET timezone TO %L', current_database(), 'Europe/Madrid');
END $$;
