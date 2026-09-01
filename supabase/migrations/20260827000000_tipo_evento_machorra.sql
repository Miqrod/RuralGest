-- Registra MACHORRA como tipo de evento reproductivo en el catálogo.
-- Sin este registro, _resolve_tipo_evento_id('MACHORRA') devuelve NULL
-- y el RPC registrar_machorra fallaría en runtime.
--
-- Todo lo demás ya está preparado desde migraciones anteriores:
--   resultado_ciclo_enum incluye 'machorra'
--   ciclo_reproductivo.fecha_fin es nullable
--   eventos.ciclo_id es nullable (soporta asignación histórica)
--   animal.es_reproductora, estado_reproductivo, fecha_prevista_parto existen
INSERT INTO tipo_evento (codigo, descripcion, tipo_tecnico, tipo_negocio, es_biologico, requiere_motivo, afecta_stock, afecta_animales, afecta_lotes)
SELECT 'MACHORRA', 'Registro de hembra como machorra: oportunidad reproductiva sin resultado satisfactorio', 'BIOLOGICO', 'reproductivo', true, false, false, true, false
WHERE NOT EXISTS (SELECT 1 FROM tipo_evento WHERE codigo = 'MACHORRA');
