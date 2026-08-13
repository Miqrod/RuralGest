-- =============================================================================
-- Backfill: estado_vinculo_materno para animales existentes
--
-- Análisis previo (tarea 124) determinó tres grupos en datos existentes:
--
--   A) tipo_productivo = 'Cría' + vivo + madre_id IS NOT NULL
--      → evidencia suficiente de dependencia activa → ACTIVO
--
--   B) tipo_productivo = 'Recría' + madre_id IS NOT NULL
--      → evidencia de destete previo → FINALIZADO
--      (Recría implica haber pasado por destete; la dependencia ya terminó)
--
--   C) estado_vital IN ('muerto','vendido') + madre_id IS NOT NULL
--      → la dependencia ha terminado por definición → FINALIZADO
--
--   D) resto con madre_id IS NOT NULL → NULL conservador (sin información)
--   E) madre_id IS NULL → NULL (no aplica; no son crías o no se conoce madre)
--
-- Principio del PRD010 §4.3: no inventar retrospectivamente información
-- que nunca fue registrada. Solo se establecen valores cuando la evidencia
-- disponible (tipo_productivo, estado_vital, historial) lo justifica.
-- =============================================================================

-- A) Crías vivas con madre conocida → vínculo activo
UPDATE animal
SET estado_vinculo_materno = 'activo'
WHERE madre_id IS NOT NULL
  AND estado_vinculo_materno IS NULL
  AND estado_vital = 'vivo'
  AND tipo_productivo_id IN (
    SELECT id FROM tipo_productivo WHERE nombre = 'Cría'
  );

-- B+C) Animales destetados (Recría) o muertos/vendidos con madre conocida → vínculo finalizado
UPDATE animal
SET estado_vinculo_materno = 'finalizado'
WHERE madre_id IS NOT NULL
  AND estado_vinculo_materno IS NULL
  AND (
    tipo_productivo_id IN (
      SELECT id FROM tipo_productivo WHERE nombre IN ('Recría', 'Reproductora', 'Engorde', 'Cebo', 'Semental', 'Verraco')
    )
    OR estado_vital IN ('muerto', 'vendido')
  );

-- El resto permanece NULL (sin información suficiente para inferir estado).
