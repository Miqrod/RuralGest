-- =============================================================================
-- Estado CUBIERTA y evento CONFIRMACION_GESTACION
--
-- Introduce la distinción entre "cubierta" (cubrición realizada, gestación no
-- confirmada) y "gestante" (gestación confirmada por diagnóstico ecográfico u
-- otro método).
--
-- Flujo reproductivo resultante:
--   CUBRICION → cubierta
--     ├── [opcional] CONFIRMACION_GESTACION → gestante
--     └── PARTO (desde cubierta o gestante, sin paso obligatorio por gestante)
--
-- La fecha_prevista_parto se calcula siempre desde la CUBRICION y no cambia
-- con la confirmación de gestación.
-- =============================================================================

-- 1. Añadir valor 'cubierta' al enum, entre 'vacia' y 'gestante'
ALTER TYPE estado_reproductivo_enum ADD VALUE IF NOT EXISTS 'cubierta' BEFORE 'gestante';

-- 2. Registrar el nuevo tipo de evento reproductivo
INSERT INTO tipo_evento (codigo, descripcion, tipo_tecnico, tipo_negocio, es_biologico, requiere_motivo, afecta_stock, afecta_animales, afecta_lotes)
VALUES (
  'CONFIRMACION_GESTACION',
  'Confirmación de gestación por diagnóstico (ecografía u otro método)',
  'BIOLOGICO',
  'reproductivo',
  true,
  false,
  false,
  true,
  false
);
