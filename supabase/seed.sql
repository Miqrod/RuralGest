-- =============================================================================
-- SEED DE DESARROLLO — Vacuno (generado limpio, sin hacks de compatibilidad)
-- Solo para entorno local. NO ejecutar en producción.
-- Uso: supabase db reset
--
-- Escenario:
--
--   SEMENTALES (3)
--     · Lucero    (Morucho)  — semental principal
--     · Titán     (Limusín)  — semental secundario
--     · Centauro  (Charolés) — semental joven
--
--   MISCELÁNEOS
--     · Brutus   — macho engorde
--     · La Rubia — hembra vendida
--
--   EX-REPRODUCTORA
--     · Pastora  — fue reproductora (C1 vacía), cambio documentado con
--                  evento CAMBIO_TIPO_PRODUCTIVO + ciclo cierre_manual
--
--   REPRODUCTORAS (6) — cada una con escenario reproductivo distinto
--
--     · Fortuna   4 ciclos acumulados
--         C1: cubrición → parto → 2 crías destetadas (FC1-A, FC1-B)
--         C2: cubrición → aborto  (sin crías)
--         C3: cubrición → parto → 2 crías ACTIVAS + 1 nacida muerta
--         C4: vacía (actual, sin eventos)
--
--     · Esperanza 2 ciclos acumulados
--         C1: cubrición → parto → 1 cría destetada (EC1-A)
--         C2: cubrición → confirmación gestación  (gestante, sin parto aún)
--
--     · Carmen    3 ciclos acumulados
--         C1: cubrición → machorra  (ciclo cierra, nuevo ciclo abre)
--         C2: cubrición → parto → 1 cría destetada (CC2-A)
--         C3: cubrición  (cubierta, sin parto aún)
--
--     · Maravilla 2 ciclos acumulados
--         C1: cubrición → parto → 2 crías ACTIVAS + 1 nacida muerta
--         C2: vacía (actual, sin eventos)
--
--     · Nube      1 ciclo, vacía sin eventos (reciente)
--
--     · Rocío     1 ciclo, cubrición reciente (cubierta)
--
-- IDs fijos (referencias cruzadas):
--   Sementales:      aaaaaaaa-0001..0003
--   Reproductoras:   aaaaaaaa-1001..1006
--   Misceláneos:     aaaaaaaa-2001..2002
--   Ex-reproductora: aaaaaaaa-3001
--   Crías:           aaaaaaaa-[prefijo]-0000-0000-[N]
--   Ciclos:          cccccccc-[madre]-[ciclo]-0000-[N]
--   Eventos:         eeeeeeee-[animal]-[tipo]-[ciclo]-[N]
--     Tipos: 0001=CUBRICION 0002=PARTO 0003=ABORTO 0004=MACHORRA
--            0005=CONFIRMACION 0006=DESTETE-A 0007=DESTETE-B 0008=CAMBIO_TIPO
-- =============================================================================

-- =============================================================================
-- SEMENTALES
-- =============================================================================

INSERT INTO animal (
  id, especie, tipo_productivo_id, nombre, crotal, num_hierro,
  raza_id, fecha_nacimiento, sexo, es_reproductora, origen,
  estado_vital, estado_sanitario
) VALUES
  ('aaaaaaaa-0001-0000-0000-000000000001',
   'vacuno', 'cc000003-0000-0000-0000-000000000000',
   'Lucero', 'ES001234560001', 'S-01',
   'bb000001-0000-0000-0000-000000000000',
   '2018-03-12', 'macho', false, 'compra',
   'vivo', 'sano'),
  ('aaaaaaaa-0002-0000-0000-000000000002',
   'vacuno', 'cc000003-0000-0000-0000-000000000000',
   'Titán', 'ES001234560002', 'S-02',
   'bb000003-0000-0000-0000-000000000000',
   '2017-09-05', 'macho', false, 'compra',
   'vivo', 'sano'),
  ('aaaaaaaa-0003-0000-0000-000000000003',
   'vacuno', 'cc000003-0000-0000-0000-000000000000',
   'Centauro', 'ES001234560003', 'S-03',
   'bb000002-0000-0000-0000-000000000000',
   '2021-05-20', 'macho', false, 'compra',
   'vivo', 'sano')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- MISCELÁNEOS
-- =============================================================================

INSERT INTO animal (
  id, especie, tipo_productivo_id, nombre, crotal, num_hierro,
  raza_id, fecha_nacimiento, sexo, es_reproductora, origen,
  estado_vital, estado_sanitario
) VALUES
  ('aaaaaaaa-2001-0000-0000-000000000001',
   'vacuno', 'cc000004-0000-0000-0000-000000000000',
   'Brutus', 'ES001234562001', 'M-01',
   NULL,
   '2022-08-10', 'macho', false, 'compra',
   'vivo', 'sano')
ON CONFLICT (id) DO NOTHING;

-- La Rubia usa fecha_nacimiento_estimada (animal comprado sin documentación exacta)
INSERT INTO animal (
  id, especie, tipo_productivo_id, nombre, crotal,
  fecha_nacimiento_estimada, sexo, es_reproductora, origen,
  estado_vital, estado_sanitario
) VALUES
  ('aaaaaaaa-2002-0000-0000-000000000002',
   'vacuno', 'cc000004-0000-0000-0000-000000000000',
   'La Rubia', 'ES001234562002',
   '2020-01-01', 'hembra', false, 'compra',
   'vendido', 'sano')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- EX-REPRODUCTORA — Pastora
-- Reproductora que cambió a Engorde. El ciclo C1 se cerró con cierre_manual
-- y se registró el evento CAMBIO_TIPO_PRODUCTIVO (flow correcto, no legacy).
-- =============================================================================

INSERT INTO animal (
  id, especie, tipo_productivo_id, nombre, crotal, num_hierro,
  raza_id, fecha_nacimiento, sexo, es_reproductora, origen,
  estado_vital, estado_sanitario
) VALUES
  ('aaaaaaaa-3001-0000-0000-000000000001',
   'vacuno', 'cc000004-0000-0000-0000-000000000000',
   'Pastora', 'ES001234563001', 'H-07',
   'bb000001-0000-0000-0000-000000000000',
   '2020-06-10', 'hembra', false, 'compra',
   'vivo', 'sano')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- REPRODUCTORAS
-- =============================================================================

INSERT INTO animal (
  id, especie, tipo_productivo_id, nombre, crotal, num_hierro,
  raza_id, fecha_nacimiento, sexo, es_reproductora, origen,
  estado_vital, estado_reproductivo, estado_sanitario, fecha_prevista_parto
) VALUES
  -- Fortuna: 4 ciclos. Estado actual = vacía (C4 abierto sin eventos).
  ('aaaaaaaa-1001-0000-0000-000000000001',
   'vacuno', 'cc000002-0000-0000-0000-000000000000',
   'Fortuna', 'ES001234561001', 'H-01',
   'bb000001-0000-0000-0000-000000000000',
   '2019-05-20', 'hembra', true, 'compra',
   'vivo', 'vacia', 'sano', NULL),

  -- Esperanza: 2 ciclos. Estado actual = gestante (C2 abierto, con confirmación).
  ('aaaaaaaa-1002-0000-0000-000000000002',
   'vacuno', 'cc000002-0000-0000-0000-000000000000',
   'Esperanza', 'ES001234561002', 'H-02',
   'bb000003-0000-0000-0000-000000000000',
   '2020-07-12', 'hembra', true, 'interno',
   'vivo', 'gestante', 'sano', '2026-10-20'),

  -- Carmen: 3 ciclos. Estado actual = cubierta (C3 abierto con cubrición).
  ('aaaaaaaa-1003-0000-0000-000000000003',
   'vacuno', 'cc000002-0000-0000-0000-000000000000',
   'Carmen', 'ES001234561003', 'H-03',
   'bb000002-0000-0000-0000-000000000000',
   '2021-03-10', 'hembra', true, 'compra',
   'vivo', 'cubierta', 'sano', '2027-03-11'),

  -- Maravilla: 2 ciclos. Estado actual = vacía (C2 abierto, crías de C1 aún activas).
  ('aaaaaaaa-1004-0000-0000-000000000004',
   'vacuno', 'cc000002-0000-0000-0000-000000000000',
   'Maravilla', 'ES001234561004', 'H-04',
   'bb000004-0000-0000-0000-000000000000',
   '2022-01-15', 'hembra', true, 'interno',
   'vivo', 'vacia', 'sano', NULL),

  -- Nube: 1 ciclo, vacía sin eventos. Primera temporada reproductiva.
  ('aaaaaaaa-1005-0000-0000-000000000005',
   'vacuno', 'cc000002-0000-0000-0000-000000000000',
   'Nube', 'ES001234561005', 'H-05',
   'bb000001-0000-0000-0000-000000000000',
   '2023-04-08', 'hembra', true, 'interno',
   'vivo', 'vacia', 'sano', NULL),

  -- Rocío: nueva reproductora, 1 ciclo, cubrición reciente.
  ('aaaaaaaa-1006-0000-0000-000000000006',
   'vacuno', 'cc000002-0000-0000-0000-000000000000',
   'Rocío', 'ES001234561006', 'H-06',
   'bb000003-0000-0000-0000-000000000000',
   '2022-09-15', 'hembra', true, 'compra',
   'vivo', 'cubierta', 'sano', '2027-04-19')

ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- CICLOS REPRODUCTIVOS
-- =============================================================================

INSERT INTO ciclo_reproductivo (id, animal_id, numero_ciclo, fecha_inicio, fecha_fin, resultado)
VALUES
  -- ── Fortuna ──────────────────────────────────────────────────────────────────
  -- C1: cerrado tras destete del último vínculo (FC1-B, 2023-06-15)
  ('cccccccc-1001-0001-0000-000000000001',
   'aaaaaaaa-1001-0000-0000-000000000001', 1, '2022-04-01', '2023-06-15', 'parto'),
  -- C2: abierto en parto C1 (2023-01-10), cerrado por aborto
  ('cccccccc-1001-0002-0000-000000000002',
   'aaaaaaaa-1001-0000-0000-000000000001', 2, '2023-01-10', '2024-01-20', 'aborto'),
  -- C3: abierto en aborto C2 (2024-01-20), resultado='parto', abierto (crías activas)
  ('cccccccc-1001-0003-0000-000000000003',
   'aaaaaaaa-1001-0000-0000-000000000001', 3, '2024-01-20', NULL, 'parto'),
  -- C4: abierto en parto C3 (2025-05-10), vacía sin eventos
  ('cccccccc-1001-0004-0000-000000000004',
   'aaaaaaaa-1001-0000-0000-000000000001', 4, '2025-05-10', NULL, NULL),

  -- ── Esperanza ────────────────────────────────────────────────────────────────
  -- C1: cerrado tras destete (EC1-A, 2023-07-15)
  ('cccccccc-1002-0001-0000-000000000001',
   'aaaaaaaa-1002-0000-0000-000000000002', 1, '2022-06-01', '2023-07-15', 'parto'),
  -- C2: abierto en parto C1 (2023-03-12), gestante (cubrición + confirmación)
  ('cccccccc-1002-0002-0000-000000000002',
   'aaaaaaaa-1002-0000-0000-000000000002', 2, '2023-03-12', NULL, NULL),

  -- ── Carmen ───────────────────────────────────────────────────────────────────
  -- C1: cerrado por machorra — RPC abre C2 en la misma fecha
  ('cccccccc-1003-0001-0000-000000000001',
   'aaaaaaaa-1003-0000-0000-000000000003', 1, '2023-06-01', '2023-12-01', 'machorra'),
  -- C2: cerrado tras destete (CC2-A, 2025-05-10)
  ('cccccccc-1003-0002-0000-000000000002',
   'aaaaaaaa-1003-0000-0000-000000000003', 2, '2023-12-01', '2025-05-10', 'parto'),
  -- C3: abierto en parto C2 (2024-12-15), cubierta (cubrición 2026-06-01)
  ('cccccccc-1003-0003-0000-000000000003',
   'aaaaaaaa-1003-0000-0000-000000000003', 3, '2024-12-15', NULL, NULL),

  -- ── Maravilla ────────────────────────────────────────────────────────────────
  -- C1: resultado='parto', abierto (crías activas pendientes de destete)
  ('cccccccc-1004-0001-0000-000000000001',
   'aaaaaaaa-1004-0000-0000-000000000004', 1, '2025-06-01', NULL, 'parto'),
  -- C2: abierto en parto C1 (2026-03-10), vacía sin eventos
  ('cccccccc-1004-0002-0000-000000000002',
   'aaaaaaaa-1004-0000-0000-000000000004', 2, '2026-03-10', NULL, NULL),

  -- ── Nube ─────────────────────────────────────────────────────────────────────
  -- C1: primer ciclo, vacía sin eventos
  ('cccccccc-1005-0001-0000-000000000001',
   'aaaaaaaa-1005-0000-0000-000000000005', 1, '2024-04-08', NULL, NULL),

  -- ── Rocío ────────────────────────────────────────────────────────────────────
  -- C1: cubrición 2026-07-10, cubierta
  ('cccccccc-1006-0001-0000-000000000001',
   'aaaaaaaa-1006-0000-0000-000000000006', 1, '2026-07-01', NULL, NULL),

  -- ── Pastora ──────────────────────────────────────────────────────────────────
  -- C1: cerrado con cierre_manual al cambiar tipo (2024-06-01)
  ('cccccccc-3001-0001-0000-000000000001',
   'aaaaaaaa-3001-0000-0000-000000000001', 1, '2023-03-01', '2024-06-01', 'cierre_manual')

ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- EVENTOS
-- Tipos:
--   0001 CUBRICION · 0002 PARTO · 0003 ABORTO · 0004 MACHORRA
--   0005 CONFIRMACION_GESTACION · 0006 DESTETE-A · 0007 DESTETE-B
--   0008 CAMBIO_TIPO_PRODUCTIVO
-- =============================================================================

INSERT INTO eventos (id, tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
SELECT ev.id::uuid,
       (SELECT id FROM tipo_evento WHERE codigo = ev.codigo),
       ev.especie::especie_enum,
       ev.fecha::date,
       ev.ciclo_id::uuid,
       ev.meta::jsonb
FROM (VALUES

  -- ── Fortuna C1 ─────────────────────────────────────────────────────────────
  ('eeeeeeee-f001-0001-0001-000000000001', 'CUBRICION', 'vacuno', '2022-04-01',
   'cccccccc-1001-0001-0000-000000000001',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0001-0000-0000-000000000001"}'),
  ('eeeeeeee-f001-0002-0001-000000000001', 'PARTO', 'vacuno', '2023-01-10',
   'cccccccc-1001-0001-0000-000000000001',
   '{"tipo_parto":"natural","numero_nacidos":2,"numero_vivos":2,"numero_muertos":0}'),
  -- DESTETE FC1-A (2023-06-10) — ciclo C1 aún abierto (FC1-B sigue activo)
  ('eeeeeeee-f001-0006-0001-000000000001', 'DESTETE', 'vacuno', '2023-06-10',
   'cccccccc-1001-0001-0000-000000000001',
   '{}'),
  -- DESTETE FC1-B (2023-06-15) — último vínculo, cierra ciclo C1
  ('eeeeeeee-f001-0007-0001-000000000001', 'DESTETE', 'vacuno', '2023-06-15',
   'cccccccc-1001-0001-0000-000000000001',
   '{}'),

  -- ── Fortuna C2 ─────────────────────────────────────────────────────────────
  ('eeeeeeee-f001-0001-0002-000000000001', 'CUBRICION', 'vacuno', '2023-07-01',
   'cccccccc-1001-0002-0000-000000000002',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0002-0000-0000-000000000002"}'),
  ('eeeeeeee-f001-0003-0002-000000000001', 'ABORTO', 'vacuno', '2024-01-20',
   'cccccccc-1001-0002-0000-000000000002',
   '{}'),

  -- ── Fortuna C3 ─────────────────────────────────────────────────────────────
  ('eeeeeeee-f001-0001-0003-000000000001', 'CUBRICION', 'vacuno', '2024-08-01',
   'cccccccc-1001-0003-0000-000000000003',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0001-0000-0000-000000000001"}'),
  ('eeeeeeee-f001-0002-0003-000000000001', 'PARTO', 'vacuno', '2025-05-10',
   'cccccccc-1001-0003-0000-000000000003',
   '{"tipo_parto":"natural","numero_nacidos":3,"numero_vivos":2,"numero_muertos":1}'),

  -- ── Esperanza C1 ───────────────────────────────────────────────────────────
  ('eeeeeeee-e002-0001-0001-000000000001', 'CUBRICION', 'vacuno', '2022-06-01',
   'cccccccc-1002-0001-0000-000000000001',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0002-0000-0000-000000000002"}'),
  ('eeeeeeee-e002-0002-0001-000000000001', 'PARTO', 'vacuno', '2023-03-12',
   'cccccccc-1002-0001-0000-000000000001',
   '{"tipo_parto":"natural","numero_nacidos":1,"numero_vivos":1,"numero_muertos":0}'),
  -- DESTETE EC1-A (2023-07-15) — único vínculo, cierra ciclo C1
  ('eeeeeeee-e002-0006-0001-000000000001', 'DESTETE', 'vacuno', '2023-07-15',
   'cccccccc-1002-0001-0000-000000000001',
   '{}'),

  -- ── Esperanza C2 ───────────────────────────────────────────────────────────
  ('eeeeeeee-e002-0001-0002-000000000001', 'CUBRICION', 'vacuno', '2026-01-10',
   'cccccccc-1002-0002-0000-000000000002',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0002-0000-0000-000000000002"}'),
  -- Confirmación gestación → estado gestante, fecha_prevista_parto=2026-10-20
  ('eeeeeeee-e002-0005-0002-000000000001', 'CONFIRMACION_GESTACION', 'vacuno', '2026-03-15',
   'cccccccc-1002-0002-0000-000000000002',
   '{"semanas_gestacion":10}'),

  -- ── Carmen C1 ──────────────────────────────────────────────────────────────
  ('eeeeeeee-c003-0001-0001-000000000001', 'CUBRICION', 'vacuno', '2023-06-01',
   'cccccccc-1003-0001-0000-000000000001',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0003-0000-0000-000000000003"}'),
  -- Machorra cierra C1 y abre C2 (machorra no genera crías)
  ('eeeeeeee-c003-0004-0001-000000000001', 'MACHORRA', 'vacuno', '2023-12-01',
   'cccccccc-1003-0001-0000-000000000001',
   '{}'),

  -- ── Carmen C2 ──────────────────────────────────────────────────────────────
  ('eeeeeeee-c003-0001-0002-000000000001', 'CUBRICION', 'vacuno', '2024-03-01',
   'cccccccc-1003-0002-0000-000000000002',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0001-0000-0000-000000000001"}'),
  ('eeeeeeee-c003-0002-0002-000000000001', 'PARTO', 'vacuno', '2024-12-15',
   'cccccccc-1003-0002-0000-000000000002',
   '{"tipo_parto":"natural","numero_nacidos":1,"numero_vivos":1,"numero_muertos":0}'),
  -- DESTETE CC2-A (2025-05-10) — único vínculo, cierra ciclo C2
  ('eeeeeeee-c003-0006-0002-000000000001', 'DESTETE', 'vacuno', '2025-05-10',
   'cccccccc-1003-0002-0000-000000000002',
   '{}'),

  -- ── Carmen C3 ──────────────────────────────────────────────────────────────
  ('eeeeeeee-c003-0001-0003-000000000001', 'CUBRICION', 'vacuno', '2026-06-01',
   'cccccccc-1003-0003-0000-000000000003',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0003-0000-0000-000000000003"}'),

  -- ── Maravilla C1 ───────────────────────────────────────────────────────────
  ('eeeeeeee-4004-0001-0001-000000000001', 'CUBRICION', 'vacuno', '2025-06-01',
   'cccccccc-1004-0001-0000-000000000001',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0001-0000-0000-000000000001"}'),
  ('eeeeeeee-4004-0002-0001-000000000001', 'PARTO', 'vacuno', '2026-03-10',
   'cccccccc-1004-0001-0000-000000000001',
   '{"tipo_parto":"asistido","numero_nacidos":3,"numero_vivos":2,"numero_muertos":1}'),

  -- ── Rocío C1 ───────────────────────────────────────────────────────────────
  ('eeeeeeee-d006-0001-0001-000000000001', 'CUBRICION', 'vacuno', '2026-07-10',
   'cccccccc-1006-0001-0000-000000000001',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0002-0000-0000-000000000002"}'),

  -- ── Pastora C1 ─────────────────────────────────────────────────────────────
  -- Cambio a Engorde (vacía sin cubrición → cierre_manual documentado)
  ('eeeeeeee-3001-0008-0001-000000000001', 'CAMBIO_TIPO_PRODUCTIVO', 'vacuno', '2024-06-01',
   'cccccccc-3001-0001-0000-000000000001',
   '{"tipo_anterior":"Reproductora","tipo_nuevo":"Engorde"}')

) AS ev(id, codigo, especie, fecha, ciclo_id, meta)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- DETALLE DE PARTOS (evento_parto)
-- =============================================================================

INSERT INTO evento_parto (evento_id, numero_nacidos, numero_vivos, numero_muertos, tipo_parto, observaciones)
VALUES
  ('eeeeeeee-f001-0002-0001-000000000001', 2, 2, 0, 'natural',  NULL),
  ('eeeeeeee-f001-0002-0003-000000000001', 3, 2, 1, 'natural',  NULL),
  ('eeeeeeee-e002-0002-0001-000000000001', 1, 1, 0, 'natural',  NULL),
  ('eeeeeeee-c003-0002-0002-000000000001', 1, 1, 0, 'natural',  NULL),
  ('eeeeeeee-4004-0002-0001-000000000001', 3, 2, 1, 'asistido', NULL)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- CRÍAS HISTÓRICAS — Recría, vínculo FINALIZADO
-- Ciclos origen: Fortuna C1, Esperanza C1, Carmen C2.
-- Cada cría tiene evento DESTETE registrado en la tabla eventos (ver arriba).
-- =============================================================================

INSERT INTO animal (
  id, especie, tipo_productivo_id, crotal,
  raza_id, padre_id, madre_id,
  fecha_nacimiento, sexo, es_reproductora, origen,
  estado_vital, estado_identificacion, estado_vinculo_materno,
  parto_evento_id, evento_creacion_id
) VALUES

  -- ── Fortuna C1 — parto 2023-01-10, padre: Lucero ───────────────────────────
  -- FC1-A: hembra, destetada 2023-06-10
  ('aaaaaaaa-f1a0-0000-0000-000000000001',
   'vacuno', 'cc000001-0000-0000-0000-000000000000', 'ES001234569101',
   'bb000001-0000-0000-0000-000000000000',
   'aaaaaaaa-0001-0000-0000-000000000001',
   'aaaaaaaa-1001-0000-0000-000000000001',
   '2023-01-10', 'hembra', false, 'interno',
   'vivo', 'completa', 'finalizado',
   'eeeeeeee-f001-0002-0001-000000000001',
   'eeeeeeee-f001-0002-0001-000000000001'),
  -- FC1-B: macho, destetado 2023-06-15 (última cría → cierra C1)
  ('aaaaaaaa-f1b0-0000-0000-000000000002',
   'vacuno', 'cc000001-0000-0000-0000-000000000000', 'ES001234569102',
   'bb000001-0000-0000-0000-000000000000',
   'aaaaaaaa-0001-0000-0000-000000000001',
   'aaaaaaaa-1001-0000-0000-000000000001',
   '2023-01-10', 'macho', false, 'interno',
   'vivo', 'completa', 'finalizado',
   'eeeeeeee-f001-0002-0001-000000000001',
   'eeeeeeee-f001-0002-0001-000000000001'),

  -- ── Esperanza C1 — parto 2023-03-12, padre: Titán ─────────────────────────
  -- EC1-A: macho, destetado 2023-07-15 (único → cierra C1)
  ('aaaaaaaa-e1a0-0000-0000-000000000001',
   'vacuno', 'cc000001-0000-0000-0000-000000000000', 'ES001234569301',
   'bb000003-0000-0000-0000-000000000000',
   'aaaaaaaa-0002-0000-0000-000000000002',
   'aaaaaaaa-1002-0000-0000-000000000002',
   '2023-03-12', 'macho', false, 'interno',
   'vivo', 'completa', 'finalizado',
   'eeeeeeee-e002-0002-0001-000000000001',
   'eeeeeeee-e002-0002-0001-000000000001'),

  -- ── Carmen C2 — parto 2024-12-15, padre: Lucero ───────────────────────────
  -- CC2-A: hembra, destetada 2025-05-10 (única → cierra C2)
  ('aaaaaaaa-c2a0-0000-0000-000000000001',
   'vacuno', 'cc000001-0000-0000-0000-000000000000', 'ES001234569401',
   'bb000001-0000-0000-0000-000000000000',
   'aaaaaaaa-0001-0000-0000-000000000001',
   'aaaaaaaa-1003-0000-0000-000000000003',
   '2024-12-15', 'hembra', false, 'interno',
   'vivo', 'completa', 'finalizado',
   'eeeeeeee-c003-0002-0002-000000000001',
   'eeeeeeee-c003-0002-0002-000000000001')

ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- CRÍAS ACTUALES — Cría, vínculo ACTIVO
-- Ciclos origen: Fortuna C3, Maravilla C1.
-- Estos ciclos tienen resultado='parto' y fecha_fin=NULL (abiertos hasta destete).
-- =============================================================================

INSERT INTO animal (
  id, especie, tipo_productivo_id, crotal,
  raza_id, padre_id, madre_id,
  fecha_nacimiento, sexo, es_reproductora, origen,
  estado_vital, estado_identificacion, estado_vinculo_materno,
  parto_evento_id, evento_creacion_id
)
SELECT
  a.id::uuid,
  'vacuno',
  (SELECT id FROM tipo_productivo WHERE nombre = 'Cría' AND especie = 'vacuno'),
  a.crotal,
  a.raza_id::uuid,
  a.padre_id::uuid,
  a.madre_id::uuid,
  a.fecha_nacimiento::date,
  a.sexo::sexo_enum,
  false,
  'interno',
  'vivo'::estado_vital_enum,
  a.identificacion::estado_identificacion_enum,
  'activo'::vinculo_materno_enum,
  a.parto_evento_id::uuid,
  a.parto_evento_id::uuid
FROM (VALUES
  -- ── Fortuna C3 — parto 2025-05-10, padre: Lucero ───────────────────────────
  -- FC3-A: hembra, identificada
  ('aaaaaaaa-f3a0-0000-0000-000000000001', 'ES001234569601',
   'bb000001-0000-0000-0000-000000000000',
   'aaaaaaaa-0001-0000-0000-000000000001',
   'aaaaaaaa-1001-0000-0000-000000000001',
   '2025-05-10', 'hembra', 'completa',
   'eeeeeeee-f001-0002-0003-000000000001'),
  -- FC3-B: macho, sin identificar aún
  ('aaaaaaaa-f3b0-0000-0000-000000000002', NULL,
   'bb000001-0000-0000-0000-000000000000',
   'aaaaaaaa-0001-0000-0000-000000000001',
   'aaaaaaaa-1001-0000-0000-000000000001',
   '2025-05-10', 'macho', 'pendiente',
   'eeeeeeee-f001-0002-0003-000000000001'),

  -- ── Maravilla C1 — parto 2026-03-10, padre: Lucero ─────────────────────────
  -- MC1-A: macho, sin identificar aún
  ('aaaaaaaa-41a0-0000-0000-000000000001', NULL,
   'bb000001-0000-0000-0000-000000000000',
   'aaaaaaaa-0001-0000-0000-000000000001',
   'aaaaaaaa-1004-0000-0000-000000000004',
   '2026-03-10', 'macho', 'pendiente',
   'eeeeeeee-4004-0002-0001-000000000001'),
  -- MC1-B: hembra, sin identificar aún
  ('aaaaaaaa-41b0-0000-0000-000000000002', NULL,
   'bb000001-0000-0000-0000-000000000000',
   'aaaaaaaa-0001-0000-0000-000000000001',
   'aaaaaaaa-1004-0000-0000-000000000004',
   '2026-03-10', 'hembra', 'pendiente',
   'eeeeeeee-4004-0002-0001-000000000001')

) AS a(id, crotal, raza_id, padre_id, madre_id, fecha_nacimiento, sexo, identificacion, parto_evento_id)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- CRÍAS MUERTAS — nacidas muertas, vínculo FINALIZADO
-- =============================================================================

INSERT INTO animal (
  id, especie, tipo_productivo_id, crotal,
  raza_id, padre_id, madre_id,
  fecha_nacimiento, sexo, es_reproductora, origen,
  estado_vital, estado_vinculo_materno,
  parto_evento_id, evento_creacion_id
) VALUES
  -- Fortuna C3: 1 nacida muerta (padre: Lucero)
  ('aaaaaaaa-f3c0-0000-0000-000000000003',
   'vacuno', NULL, NULL,
   'bb000001-0000-0000-0000-000000000000',
   'aaaaaaaa-0001-0000-0000-000000000001',
   'aaaaaaaa-1001-0000-0000-000000000001',
   '2025-05-10', NULL, false, 'interno',
   'muerto', 'finalizado',
   'eeeeeeee-f001-0002-0003-000000000001',
   'eeeeeeee-f001-0002-0003-000000000001'),
  -- Maravilla C1: 1 nacida muerta (padre: Lucero)
  ('aaaaaaaa-41c0-0000-0000-000000000003',
   'vacuno', NULL, NULL,
   'bb000001-0000-0000-0000-000000000000',
   'aaaaaaaa-0001-0000-0000-000000000001',
   'aaaaaaaa-1004-0000-0000-000000000004',
   '2026-03-10', NULL, false, 'interno',
   'muerto', 'finalizado',
   'eeeeeeee-4004-0002-0001-000000000001',
   'eeeeeeee-4004-0002-0001-000000000001')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- ASOCIACIONES EVENTO ↔ ANIMAL (evento_animales)
-- =============================================================================

INSERT INTO evento_animales (evento_id, animal_id, rol)
VALUES
  -- ── Fortuna C1 ─────────────────────────────────────────────────────────────
  ('eeeeeeee-f001-0001-0001-000000000001', 'aaaaaaaa-1001-0000-0000-000000000001', 'madre'),
  ('eeeeeeee-f001-0002-0001-000000000001', 'aaaaaaaa-1001-0000-0000-000000000001', 'madre'),
  ('eeeeeeee-f001-0002-0001-000000000001', 'aaaaaaaa-f1a0-0000-0000-000000000001', 'cria'),
  ('eeeeeeee-f001-0002-0001-000000000001', 'aaaaaaaa-f1b0-0000-0000-000000000002', 'cria'),
  -- DESTETE FC1-A: cría + madre
  ('eeeeeeee-f001-0006-0001-000000000001', 'aaaaaaaa-f1a0-0000-0000-000000000001', 'cria'),
  ('eeeeeeee-f001-0006-0001-000000000001', 'aaaaaaaa-1001-0000-0000-000000000001', 'madre'),
  -- DESTETE FC1-B: cría + madre
  ('eeeeeeee-f001-0007-0001-000000000001', 'aaaaaaaa-f1b0-0000-0000-000000000002', 'cria'),
  ('eeeeeeee-f001-0007-0001-000000000001', 'aaaaaaaa-1001-0000-0000-000000000001', 'madre'),

  -- ── Fortuna C2 ─────────────────────────────────────────────────────────────
  ('eeeeeeee-f001-0001-0002-000000000001', 'aaaaaaaa-1001-0000-0000-000000000001', 'madre'),
  ('eeeeeeee-f001-0003-0002-000000000001', 'aaaaaaaa-1001-0000-0000-000000000001', 'madre'),

  -- ── Fortuna C3 ─────────────────────────────────────────────────────────────
  ('eeeeeeee-f001-0001-0003-000000000001', 'aaaaaaaa-1001-0000-0000-000000000001', 'madre'),
  ('eeeeeeee-f001-0002-0003-000000000001', 'aaaaaaaa-1001-0000-0000-000000000001', 'madre'),
  ('eeeeeeee-f001-0002-0003-000000000001', 'aaaaaaaa-f3a0-0000-0000-000000000001', 'cria'),
  ('eeeeeeee-f001-0002-0003-000000000001', 'aaaaaaaa-f3b0-0000-0000-000000000002', 'cria'),
  ('eeeeeeee-f001-0002-0003-000000000001', 'aaaaaaaa-f3c0-0000-0000-000000000003', 'cria'),

  -- ── Esperanza C1 ───────────────────────────────────────────────────────────
  ('eeeeeeee-e002-0001-0001-000000000001', 'aaaaaaaa-1002-0000-0000-000000000002', 'madre'),
  ('eeeeeeee-e002-0002-0001-000000000001', 'aaaaaaaa-1002-0000-0000-000000000002', 'madre'),
  ('eeeeeeee-e002-0002-0001-000000000001', 'aaaaaaaa-e1a0-0000-0000-000000000001', 'cria'),
  -- DESTETE EC1-A: cría + madre
  ('eeeeeeee-e002-0006-0001-000000000001', 'aaaaaaaa-e1a0-0000-0000-000000000001', 'cria'),
  ('eeeeeeee-e002-0006-0001-000000000001', 'aaaaaaaa-1002-0000-0000-000000000002', 'madre'),

  -- ── Esperanza C2 ───────────────────────────────────────────────────────────
  ('eeeeeeee-e002-0001-0002-000000000001', 'aaaaaaaa-1002-0000-0000-000000000002', 'madre'),
  ('eeeeeeee-e002-0005-0002-000000000001', 'aaaaaaaa-1002-0000-0000-000000000002', 'madre'),

  -- ── Carmen C1 ──────────────────────────────────────────────────────────────
  ('eeeeeeee-c003-0001-0001-000000000001', 'aaaaaaaa-1003-0000-0000-000000000003', 'madre'),
  ('eeeeeeee-c003-0004-0001-000000000001', 'aaaaaaaa-1003-0000-0000-000000000003', 'madre'),

  -- ── Carmen C2 ──────────────────────────────────────────────────────────────
  ('eeeeeeee-c003-0001-0002-000000000001', 'aaaaaaaa-1003-0000-0000-000000000003', 'madre'),
  ('eeeeeeee-c003-0002-0002-000000000001', 'aaaaaaaa-1003-0000-0000-000000000003', 'madre'),
  ('eeeeeeee-c003-0002-0002-000000000001', 'aaaaaaaa-c2a0-0000-0000-000000000001', 'cria'),
  -- DESTETE CC2-A: cría + madre
  ('eeeeeeee-c003-0006-0002-000000000001', 'aaaaaaaa-c2a0-0000-0000-000000000001', 'cria'),
  ('eeeeeeee-c003-0006-0002-000000000001', 'aaaaaaaa-1003-0000-0000-000000000003', 'madre'),

  -- ── Carmen C3 ──────────────────────────────────────────────────────────────
  ('eeeeeeee-c003-0001-0003-000000000001', 'aaaaaaaa-1003-0000-0000-000000000003', 'madre'),

  -- ── Maravilla C1 ───────────────────────────────────────────────────────────
  ('eeeeeeee-4004-0001-0001-000000000001', 'aaaaaaaa-1004-0000-0000-000000000004', 'madre'),
  ('eeeeeeee-4004-0002-0001-000000000001', 'aaaaaaaa-1004-0000-0000-000000000004', 'madre'),
  ('eeeeeeee-4004-0002-0001-000000000001', 'aaaaaaaa-41a0-0000-0000-000000000001', 'cria'),
  ('eeeeeeee-4004-0002-0001-000000000001', 'aaaaaaaa-41b0-0000-0000-000000000002', 'cria'),
  ('eeeeeeee-4004-0002-0001-000000000001', 'aaaaaaaa-41c0-0000-0000-000000000003', 'cria'),

  -- ── Rocío C1 ───────────────────────────────────────────────────────────────
  ('eeeeeeee-d006-0001-0001-000000000001', 'aaaaaaaa-1006-0000-0000-000000000006', 'madre'),

  -- ── Pastora C1 ─────────────────────────────────────────────────────────────
  ('eeeeeeee-3001-0008-0001-000000000001', 'aaaaaaaa-3001-0000-0000-000000000001', 'madre')

ON CONFLICT DO NOTHING;
