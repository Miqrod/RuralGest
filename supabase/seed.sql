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
  especie, tipo,
  crotal, num_hierro,
  raza_id,
  fecha_nacimiento,
  sexo,
  madre_id,
  es_reproductora, origen,
  estado_vital, estado_reproductivo, estado_sanitario
) VALUES

  -- 1. Estrella — hembra reproductora, gestante, compra (Morucha)
  (
    'aaaaaaaa-0001-0000-0000-000000000001',
    'vacuno', 'reproductor', 'ES001234567890', 'H-01',
    'bb000001-0000-0000-0000-000000000000',
    '2020-03-15',
    'hembra',
    NULL,
    true, 'compra',
    'vivo', 'gestante', 'sano'
  ),

  -- 2. Carmela — hembra reproductora, lactante (Charolesa)
  (
    'aaaaaaaa-0002-0000-0000-000000000002',
    'vacuno', 'reproductor', 'ES001234567891', 'H-02',
    'bb000002-0000-0000-0000-000000000000',
    '2019-06-20',
    'hembra',
    NULL,
    true, 'interno',
    'vivo', 'lactante', 'sano'
  ),

  -- 3. Blanca — hembra reproductora, vacía (Limusina)
  (
    'aaaaaaaa-0003-0000-0000-000000000003',
    'vacuno', 'reproductor', 'ES001234567892', 'H-03',
    'bb000003-0000-0000-0000-000000000000',
    '2021-01-10',
    'hembra',
    NULL,
    true, 'interno',
    'vivo', 'vacia', 'sano'
  ),

  -- 4. Rosalía — hembra normal (Cruzada)
  (
    'aaaaaaaa-0004-0000-0000-000000000004',
    'vacuno', 'normal', 'ES001234567893', NULL,
    'bb000004-0000-0000-0000-000000000000',
    '2022-05-08',
    'hembra',
    NULL,
    false, 'interno',
    'vivo', NULL, 'sano'
  ),

  -- 5. Torito — macho, sin raza asignada (cubre el caso NULL)
  (
    'aaaaaaaa-0005-0000-0000-000000000005',
    'vacuno', 'normal', 'ES001234567894', 'M-01',
    NULL,
    '2021-09-12',
    'macho',
    NULL,
    false, 'compra',
    'vivo', NULL, 'sano'
  ),

  -- 6. Becerro — cría de Carmela, sin crotal ni raza
  (
    'aaaaaaaa-0006-0000-0000-000000000006',
    'vacuno', 'normal', NULL, NULL,
    NULL,
    '2026-02-15',
    'macho',
    'aaaaaaaa-0002-0000-0000-000000000002',  -- madre: Carmela
    false, 'interno',
    'vivo', NULL, 'sano'
  ),

  -- 7. La Negra — hembra reproductora en tratamiento (Morucha)
  (
    'aaaaaaaa-0007-0000-0000-000000000007',
    'vacuno', 'reproductor', 'ES001234567895', 'H-04',
    'bb000001-0000-0000-0000-000000000000',
    '2020-11-30',
    'hembra',
    NULL,
    true, 'interno',
    'vivo', 'vacia', 'en_tratamiento'
  ),

  -- 8. Vendida — hembra ya no presente en la explotación
  (
    'aaaaaaaa-0008-0000-0000-000000000008',
    'vacuno', 'normal', 'ES001234567896', NULL,
    NULL,
    '2018-04-25',
    'hembra',
    NULL,
    false, 'compra',
    'vendido', NULL, 'sano'
  ),

  -- 9. Finado — macho muerto
  (
    'aaaaaaaa-0009-0000-0000-000000000009',
    'vacuno', 'normal', 'ES001234567897', 'M-02',
    NULL,
    '2019-07-14',
    'macho',
    NULL,
    false, 'compra',
    'muerto', NULL, 'sano'
  ),

  -- 10. Manchas — hembra en observación (Cruzada)
  (
    'aaaaaaaa-0010-0000-0000-000000000010',
    'vacuno', 'normal', 'ES001234567898', NULL,
    'bb000004-0000-0000-0000-000000000000',
    '2023-02-18',
    'hembra',
    NULL,
    false, 'compra',
    'vivo', NULL, 'en_observacion'
  )

ON CONFLICT (id) DO NOTHING;
