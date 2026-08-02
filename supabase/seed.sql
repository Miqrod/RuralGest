-- =============================================================================
-- SEED DE DESARROLLO — Animales vacuno de prueba
-- =============================================================================
-- Solo para entorno local. NO ejecutar en producción.
-- Uso: supabase db reset  (borra BD local, aplica migraciones, luego este seed)
--
-- Cubre todas las combinaciones relevantes de estado para desarrollo y testing:
-- sexos, estados vitales, estados reproductivos, estados sanitarios y orígenes.
-- =============================================================================

INSERT INTO animal (
  id,
  especie,
  tipo_productivo_id,
  crotal, num_hierro,
  raza_id,
  fecha_nacimiento,
  sexo,
  madre_id,
  es_reproductora, origen,
  estado_vital, estado_reproductivo, estado_sanitario
) VALUES

  -- 1. Estrella — reproductora, gestante, compra (Morucha)
  (
    'aaaaaaaa-0001-0000-0000-000000000001',
    'vacuno', 'cc000002-0000-0000-0000-000000000000', 'ES001234567890', 'H-01',
    'bb000001-0000-0000-0000-000000000000',
    '2020-03-15',
    'hembra',
    NULL,
    true, 'compra',
    'vivo', 'gestante', 'sano'
  ),

  -- 2. Carmela — reproductora, lactante (Charolesa)
  (
    'aaaaaaaa-0002-0000-0000-000000000002',
    'vacuno', 'cc000002-0000-0000-0000-000000000000', 'ES001234567891', 'H-02',
    'bb000002-0000-0000-0000-000000000000',
    '2019-06-20',
    'hembra',
    NULL,
    true, 'interno',
    'vivo', 'lactante', 'sano'
  ),

  -- 3. Blanca — reproductora, vacía (Limusina)
  (
    'aaaaaaaa-0003-0000-0000-000000000003',
    'vacuno', 'cc000002-0000-0000-0000-000000000000', 'ES001234567892', 'H-03',
    'bb000003-0000-0000-0000-000000000000',
    '2021-01-10',
    'hembra',
    NULL,
    true, 'interno',
    'vivo', 'vacia', 'sano'
  ),

  -- 4. Rosalía — hembra en recría (Cruzada)
  (
    'aaaaaaaa-0004-0000-0000-000000000004',
    'vacuno', 'cc000001-0000-0000-0000-000000000000', 'ES001234567893', NULL,
    'bb000004-0000-0000-0000-000000000000',
    '2022-05-08',
    'hembra',
    NULL,
    false, 'interno',
    'vivo', NULL, 'sano'
  ),

  -- 5. Torito — macho engorde, sin raza (cubre el caso NULL)
  (
    'aaaaaaaa-0005-0000-0000-000000000005',
    'vacuno', 'cc000004-0000-0000-0000-000000000000', 'ES001234567894', 'M-01',
    NULL,
    '2021-09-12',
    'macho',
    NULL,
    false, 'compra',
    'vivo', NULL, 'sano'
  ),

  -- 6. Becerro — cría de Carmela, recría, sin crotal ni raza
  (
    'aaaaaaaa-0006-0000-0000-000000000006',
    'vacuno', 'cc000001-0000-0000-0000-000000000000', NULL, NULL,
    NULL,
    '2026-02-15',
    'macho',
    'aaaaaaaa-0002-0000-0000-000000000002',  -- madre: Carmela
    false, 'interno',
    'vivo', NULL, 'sano'
  ),

  -- 7. La Negra — reproductora en tratamiento (Morucha)
  (
    'aaaaaaaa-0007-0000-0000-000000000007',
    'vacuno', 'cc000002-0000-0000-0000-000000000000', 'ES001234567895', 'H-04',
    'bb000001-0000-0000-0000-000000000000',
    '2020-11-30',
    'hembra',
    NULL,
    true, 'interno',
    'vivo', 'vacia', 'en_tratamiento'
  ),

  -- 8. Vendida — hembra engorde, ya no presente
  (
    'aaaaaaaa-0008-0000-0000-000000000008',
    'vacuno', 'cc000004-0000-0000-0000-000000000000', 'ES001234567896', NULL,
    NULL,
    '2018-04-25',
    'hembra',
    NULL,
    false, 'compra',
    'vendido', NULL, 'sano'
  ),

  -- 9. Finado — macho engorde, muerto
  (
    'aaaaaaaa-0009-0000-0000-000000000009',
    'vacuno', 'cc000004-0000-0000-0000-000000000000', 'ES001234567897', 'M-02',
    NULL,
    '2019-07-14',
    'macho',
    NULL,
    false, 'compra',
    'muerto', NULL, 'sano'
  ),

  -- 10. Manchas — hembra recría en observación (Cruzada)
  (
    'aaaaaaaa-0010-0000-0000-000000000010',
    'vacuno', 'cc000001-0000-0000-0000-000000000000', 'ES001234567898', NULL,
    'bb000004-0000-0000-0000-000000000000',
    '2023-02-18',
    'hembra',
    NULL,
    false, 'compra',
    'vivo', NULL, 'en_observacion'
  )

ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SEED PRD008 — Animales adicionales para probar confirmación de gestación
-- =============================================================================
-- 7 reproductoras en estado VACÍA  (confirmar gestación sin cubrición previa)
-- 6 reproductoras en estado CUBIERTA (confirmar gestación con cubrición previa)
-- =============================================================================

INSERT INTO animal (
  id, especie, tipo_productivo_id, nombre, crotal, num_hierro,
  raza_id, fecha_nacimiento, sexo, es_reproductora, origen,
  estado_vital, estado_reproductivo, estado_sanitario, fecha_prevista_parto
) VALUES

  -- ── VACÍAS (sin cubrición previa) ────────────────────────────────────────

  -- 11. Margarita — Charolesa, compra 2021
  (
    'aaaaaaaa-0011-0000-0000-000000000011',
    'vacuno', 'cc000002-0000-0000-0000-000000000000', 'Margarita', 'ES001234567811', 'H-11',
    'bb000002-0000-0000-0000-000000000000',
    '2021-03-10', 'hembra', true, 'compra',
    'vivo', 'vacia', 'sano', NULL
  ),
  -- 12. Tormenta — Morucha, compra 2020
  (
    'aaaaaaaa-0012-0000-0000-000000000012',
    'vacuno', 'cc000002-0000-0000-0000-000000000000', 'Tormenta', 'ES001234567812', 'H-12',
    'bb000001-0000-0000-0000-000000000000',
    '2020-08-22', 'hembra', true, 'compra',
    'vivo', 'vacia', 'sano', NULL
  ),
  -- 13. Pastora — Cruzada, interna 2019
  (
    'aaaaaaaa-0013-0000-0000-000000000013',
    'vacuno', 'cc000002-0000-0000-0000-000000000000', 'Pastora', 'ES001234567813', 'H-13',
    'bb000004-0000-0000-0000-000000000000',
    '2019-11-05', 'hembra', true, 'interno',
    'vivo', 'vacia', 'sano', NULL
  ),
  -- 14. Violeta — Limusina, compra 2022
  (
    'aaaaaaaa-0014-0000-0000-000000000014',
    'vacuno', 'cc000002-0000-0000-0000-000000000000', 'Violeta', 'ES001234567814', 'H-14',
    'bb000003-0000-0000-0000-000000000000',
    '2022-01-15', 'hembra', true, 'compra',
    'vivo', 'vacia', 'sano', NULL
  ),
  -- 15. Esmeralda — Charolesa, interna 2020
  (
    'aaaaaaaa-0015-0000-0000-000000000015',
    'vacuno', 'cc000002-0000-0000-0000-000000000000', 'Esmeralda', 'ES001234567815', 'H-15',
    'bb000002-0000-0000-0000-000000000000',
    '2020-06-08', 'hembra', true, 'interno',
    'vivo', 'vacia', 'sano', NULL
  ),
  -- 16. Duquesa — Morucha, compra 2021
  (
    'aaaaaaaa-0016-0000-0000-000000000016',
    'vacuno', 'cc000002-0000-0000-0000-000000000000', 'Duquesa', 'ES001234567816', 'H-16',
    'bb000001-0000-0000-0000-000000000000',
    '2021-09-20', 'hembra', true, 'compra',
    'vivo', 'vacia', 'sano', NULL
  ),
  -- 17. Paloma — Cruzada, interna 2019
  (
    'aaaaaaaa-0017-0000-0000-000000000017',
    'vacuno', 'cc000002-0000-0000-0000-000000000000', 'Paloma', 'ES001234567817', 'H-17',
    'bb000004-0000-0000-0000-000000000000',
    '2019-04-25', 'hembra', true, 'interno',
    'vivo', 'vacia', 'sano', NULL
  ),

  -- ── CUBIERTAS (con cubrición previa registrada) ───────────────────────────
  -- parto vacuno = cubrición + 283 días

  -- 18. Romera — Limusina — cubrición 2026-05-15 → parto 2027-02-22
  (
    'aaaaaaaa-0018-0000-0000-000000000018',
    'vacuno', 'cc000002-0000-0000-0000-000000000000', 'Romera', 'ES001234567818', 'H-18',
    'bb000003-0000-0000-0000-000000000000',
    '2020-05-18', 'hembra', true, 'compra',
    'vivo', 'cubierta', 'sano', '2027-02-22'
  ),
  -- 19. Canela — Morucha — cubrición 2026-04-01 → parto 2027-01-09
  (
    'aaaaaaaa-0019-0000-0000-000000000019',
    'vacuno', 'cc000002-0000-0000-0000-000000000000', 'Canela', 'ES001234567819', 'H-19',
    'bb000001-0000-0000-0000-000000000000',
    '2021-07-30', 'hembra', true, 'interno',
    'vivo', 'cubierta', 'sano', '2027-01-09'
  ),
  -- 20. Minerva — Charolesa — cubrición 2026-06-10 → parto 2027-03-20
  (
    'aaaaaaaa-0020-0000-0000-000000000020',
    'vacuno', 'cc000002-0000-0000-0000-000000000000', 'Minerva', 'ES001234567820', 'H-20',
    'bb000002-0000-0000-0000-000000000000',
    '2019-04-14', 'hembra', true, 'compra',
    'vivo', 'cubierta', 'sano', '2027-03-20'
  ),
  -- 21. Aurora — Cruzada — cubrición 2026-03-20 → parto 2026-12-28
  (
    'aaaaaaaa-0021-0000-0000-000000000021',
    'vacuno', 'cc000002-0000-0000-0000-000000000000', 'Aurora', 'ES001234567821', 'H-21',
    'bb000004-0000-0000-0000-000000000000',
    '2020-12-01', 'hembra', true, 'compra',
    'vivo', 'cubierta', 'sano', '2026-12-28'
  ),
  -- 22. Reina — Limusina — cubrición 2026-07-01 → parto 2027-04-09
  (
    'aaaaaaaa-0022-0000-0000-000000000022',
    'vacuno', 'cc000002-0000-0000-0000-000000000000', 'Reina', 'ES001234567822', 'H-22',
    'bb000003-0000-0000-0000-000000000000',
    '2021-02-14', 'hembra', true, 'interno',
    'vivo', 'cubierta', 'sano', '2027-04-09'
  ),
  -- 23. Sirena — Morucha — cubrición 2026-02-10 → parto 2026-11-20
  (
    'aaaaaaaa-0023-0000-0000-000000000023',
    'vacuno', 'cc000002-0000-0000-0000-000000000000', 'Sirena', 'ES001234567823', 'H-23',
    'bb000001-0000-0000-0000-000000000000',
    '2018-09-09', 'hembra', true, 'compra',
    'vivo', 'cubierta', 'sano', '2026-11-20'
  )

ON CONFLICT (id) DO NOTHING;

-- Ciclos reproductivos para las 6 animales en CUBIERTA
INSERT INTO ciclo_reproductivo (id, animal_id, numero_ciclo, fecha_inicio)
VALUES
  ('cccccccc-0018-0000-0000-000000000018', 'aaaaaaaa-0018-0000-0000-000000000018', 1, '2026-05-15'),
  ('cccccccc-0019-0000-0000-000000000019', 'aaaaaaaa-0019-0000-0000-000000000019', 1, '2026-04-01'),
  ('cccccccc-0020-0000-0000-000000000020', 'aaaaaaaa-0020-0000-0000-000000000020', 1, '2026-06-10'),
  ('cccccccc-0021-0000-0000-000000000021', 'aaaaaaaa-0021-0000-0000-000000000021', 1, '2026-03-20'),
  ('cccccccc-0022-0000-0000-000000000022', 'aaaaaaaa-0022-0000-0000-000000000022', 1, '2026-07-01'),
  ('cccccccc-0023-0000-0000-000000000023', 'aaaaaaaa-0023-0000-0000-000000000023', 1, '2026-02-10')
ON CONFLICT (id) DO NOTHING;

-- Eventos CUBRICION (tipo_evento_id resuelto por subquery para evitar UUID hardcodeado)
INSERT INTO eventos (id, tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
SELECT
  ev.id::uuid, (SELECT id FROM tipo_evento WHERE codigo = 'CUBRICION'),
  ev.especie::especie_enum, ev.fecha::date, ev.ciclo_id::uuid, ev.meta::jsonb
FROM (VALUES
  ('eeeeeeee-0018-0000-0000-000000000018', 'vacuno', '2026-05-15', 'cccccccc-0018-0000-0000-000000000018', '{"tipo_cubricion":"natural"}'),
  ('eeeeeeee-0019-0000-0000-000000000019', 'vacuno', '2026-04-01', 'cccccccc-0019-0000-0000-000000000019', '{"tipo_cubricion":"inseminacion"}'),
  ('eeeeeeee-0020-0000-0000-000000000020', 'vacuno', '2026-06-10', 'cccccccc-0020-0000-0000-000000000020', '{"tipo_cubricion":"natural"}'),
  ('eeeeeeee-0021-0000-0000-000000000021', 'vacuno', '2026-03-20', 'cccccccc-0021-0000-0000-000000000021', '{"tipo_cubricion":"inseminacion"}'),
  ('eeeeeeee-0022-0000-0000-000000000022', 'vacuno', '2026-07-01', 'cccccccc-0022-0000-0000-000000000022', '{"tipo_cubricion":"natural"}'),
  ('eeeeeeee-0023-0000-0000-000000000023', 'vacuno', '2026-02-10', 'cccccccc-0023-0000-0000-000000000023', '{"tipo_cubricion":"natural"}')
) AS ev(id, especie, fecha, ciclo_id, meta)
ON CONFLICT (id) DO NOTHING;

-- Asociaciones evento ↔ animal
INSERT INTO evento_animales (evento_id, animal_id, rol)
VALUES
  ('eeeeeeee-0018-0000-0000-000000000018', 'aaaaaaaa-0018-0000-0000-000000000018', 'madre'),
  ('eeeeeeee-0019-0000-0000-000000000019', 'aaaaaaaa-0019-0000-0000-000000000019', 'madre'),
  ('eeeeeeee-0020-0000-0000-000000000020', 'aaaaaaaa-0020-0000-0000-000000000020', 'madre'),
  ('eeeeeeee-0021-0000-0000-000000000021', 'aaaaaaaa-0021-0000-0000-000000000021', 'madre'),
  ('eeeeeeee-0022-0000-0000-000000000022', 'aaaaaaaa-0022-0000-0000-000000000022', 'madre'),
  ('eeeeeeee-0023-0000-0000-000000000023', 'aaaaaaaa-0023-0000-0000-000000000023', 'madre')
ON CONFLICT DO NOTHING;
