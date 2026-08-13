-- =============================================================================
-- SEED DE DESARROLLO — Vacuno
-- Solo para entorno local. NO ejecutar en producción.
-- Uso: supabase db reset
--
-- Escenario realista del módulo reproductivo:
--
--   SEMENTALES
--     · Lucero    (Morucho)   — semental principal
--     · Titán     (Limusín)   — semental secundario
--     · Centauro  (Charolés)  — semental joven
--
--   REPRODUCTORAS
--     · Fortuna   3 ciclos: C1+C2 cerrados (crías en Recría/FINALIZADO)
--                           C3 abierto — parto 2026-07-10, 2 crías Cría/ACTIVO
--     · Esperanza 2 ciclos: C1 cerrado
--                           C2 abierto — parto 2026-06-10, 2 crías Cría/ACTIVO
--     · Carmen    2 ciclos: C1 cerrado, C2 abierto (cubierta, sin parto aún)
--     · Maravilla 1 ciclo cerrado, actualmente vacía
--     · Nube      reproductora joven sin ciclos
--
--   MISCELÁNEOS
--     · Brutus: macho engorde
--     · La Rubia: hembra vendida
--
-- IDs fijos (para facilitar referencias cruzadas en tests y desarrollo):
--   Sementales:     aaaaaaaa-0001..0003
--   Reproductoras:  aaaaaaaa-1001..1005
--   Misceláneos:    aaaaaaaa-2001..2002
--   Crías:          aaaaaaaa-[madre][ciclo][letra] (ver comentarios inline)
--   Ciclos:         cccccccc-[madre][ciclo]
--   Eventos:        eeeeeeee-[madre][tipo][ciclo]
-- =============================================================================

-- =============================================================================
-- SEMENTALES
-- =============================================================================

INSERT INTO animal (
  id, especie, tipo_productivo_id, nombre, crotal, num_hierro,
  raza_id, fecha_nacimiento, sexo, es_reproductora, origen,
  estado_vital, estado_sanitario
) VALUES
  -- Lucero: morucho, semental principal
  (
    'aaaaaaaa-0001-0000-0000-000000000001',
    'vacuno', 'cc000003-0000-0000-0000-000000000000',
    'Lucero', 'ES001234560001', 'S-01',
    'bb000001-0000-0000-0000-000000000000',
    '2018-03-12', 'macho', false, 'compra',
    'vivo', 'sano'
  ),
  -- Titán: limusín, semental secundario
  (
    'aaaaaaaa-0002-0000-0000-000000000002',
    'vacuno', 'cc000003-0000-0000-0000-000000000000',
    'Titán', 'ES001234560002', 'S-02',
    'bb000003-0000-0000-0000-000000000000',
    '2017-09-05', 'macho', false, 'compra',
    'vivo', 'sano'
  ),
  -- Centauro: charolés, semental joven
  (
    'aaaaaaaa-0003-0000-0000-000000000003',
    'vacuno', 'cc000003-0000-0000-0000-000000000000',
    'Centauro', 'ES001234560003', 'S-03',
    'bb000002-0000-0000-0000-000000000000',
    '2021-05-20', 'macho', false, 'compra',
    'vivo', 'sano'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- REPRODUCTORAS
-- =============================================================================

INSERT INTO animal (
  id, especie, tipo_productivo_id, nombre, crotal, num_hierro,
  raza_id, fecha_nacimiento, sexo, es_reproductora, origen,
  estado_vital, estado_reproductivo, estado_sanitario, fecha_prevista_parto
) VALUES
  -- Fortuna: morucha, 3 ciclos, actualmente lactante (C3 abierto, crías sin destetar)
  (
    'aaaaaaaa-1001-0000-0000-000000000001',
    'vacuno', 'cc000002-0000-0000-0000-000000000000',
    'Fortuna', 'ES001234561001', 'H-01',
    'bb000001-0000-0000-0000-000000000000',
    '2019-05-20', 'hembra', true, 'compra',
    'vivo', 'lactante', 'sano', NULL
  ),
  -- Esperanza: limusina, 2 ciclos, actualmente lactante (C2 abierto, crías sin destetar)
  (
    'aaaaaaaa-1002-0000-0000-000000000002',
    'vacuno', 'cc000002-0000-0000-0000-000000000000',
    'Esperanza', 'ES001234561002', 'H-02',
    'bb000003-0000-0000-0000-000000000000',
    '2020-07-12', 'hembra', true, 'interno',
    'vivo', 'lactante', 'sano', NULL
  ),
  -- Carmen: charolesa, 2 ciclos, actualmente cubierta (C2 abierto, sin parto aún)
  (
    'aaaaaaaa-1003-0000-0000-000000000003',
    'vacuno', 'cc000002-0000-0000-0000-000000000000',
    'Carmen', 'ES001234561003', 'H-03',
    'bb000002-0000-0000-0000-000000000000',
    '2021-03-10', 'hembra', true, 'compra',
    'vivo', 'cubierta', 'sano', '2027-03-25'
  ),
  -- Maravilla: cruzada, 1 ciclo histórico, actualmente vacía
  (
    'aaaaaaaa-1004-0000-0000-000000000004',
    'vacuno', 'cc000002-0000-0000-0000-000000000000',
    'Maravilla', 'ES001234561004', 'H-04',
    'bb000004-0000-0000-0000-000000000000',
    '2022-01-15', 'hembra', true, 'interno',
    'vivo', 'vacia', 'sano', NULL
  ),
  -- Nube: morucha joven, sin ciclos todavía, vacía
  (
    'aaaaaaaa-1005-0000-0000-000000000005',
    'vacuno', 'cc000002-0000-0000-0000-000000000000',
    'Nube', 'ES001234561005', 'H-05',
    'bb000001-0000-0000-0000-000000000000',
    '2023-04-08', 'hembra', true, 'interno',
    'vivo', 'vacia', 'sano', NULL
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- CICLOS REPRODUCTIVOS
-- =============================================================================

INSERT INTO ciclo_reproductivo (id, animal_id, numero_ciclo, fecha_inicio, fecha_fin, resultado)
VALUES
  -- Fortuna C1: 2022-04-01 → 2023-03-15 (cerrado tras destete)
  ('cccccccc-1001-0001-0000-000000000001', 'aaaaaaaa-1001-0000-0000-000000000001', 1, '2022-04-01', '2023-03-15', 'parto'),
  -- Fortuna C2: 2023-07-01 → 2024-09-01 (cerrado tras destete)
  ('cccccccc-1001-0002-0000-000000000002', 'aaaaaaaa-1001-0000-0000-000000000001', 2, '2023-07-01', '2024-09-01', 'parto'),
  -- Fortuna C3: 2025-10-01 → abierto (lactante, crías sin destetar)
  ('cccccccc-1001-0003-0000-000000000003', 'aaaaaaaa-1001-0000-0000-000000000001', 3, '2025-10-01', NULL, NULL),

  -- Esperanza C1: 2022-06-01 → 2023-07-01 (cerrado)
  ('cccccccc-1002-0001-0000-000000000001', 'aaaaaaaa-1002-0000-0000-000000000002', 1, '2022-06-01', '2023-07-01', 'parto'),
  -- Esperanza C2: 2025-09-01 → abierto (lactante)
  ('cccccccc-1002-0002-0000-000000000002', 'aaaaaaaa-1002-0000-0000-000000000002', 2, '2025-09-01', NULL, NULL),

  -- Carmen C1: 2023-06-01 → 2024-07-01 (cerrado)
  ('cccccccc-1003-0001-0000-000000000001', 'aaaaaaaa-1003-0000-0000-000000000003', 1, '2023-06-01', '2024-07-01', 'parto'),
  -- Carmen C2: 2026-06-15 → abierto (cubierta, sin parto)
  ('cccccccc-1003-0002-0000-000000000002', 'aaaaaaaa-1003-0000-0000-000000000003', 2, '2026-06-15', NULL, NULL),

  -- Maravilla C1: 2024-03-01 → 2025-04-01 (cerrado)
  ('cccccccc-1004-0001-0000-000000000001', 'aaaaaaaa-1004-0000-0000-000000000004', 1, '2024-03-01', '2025-04-01', 'parto')

ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- EVENTOS
-- =============================================================================

INSERT INTO eventos (id, tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
SELECT ev.id::uuid,
       (SELECT id FROM tipo_evento WHERE codigo = ev.codigo),
       ev.especie::especie_enum,
       ev.fecha::date,
       ev.ciclo_id::uuid,
       ev.meta::jsonb
FROM (VALUES
  -- ── Fortuna C1 ────────────────────────────────────────────────────────────
  -- Cubrición 2022-04-01 con Lucero
  ('eeeeeeee-f001-0001-0001-000000000001', 'CUBRICION', 'vacuno', '2022-04-01',
   'cccccccc-1001-0001-0000-000000000001',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0001-0000-0000-000000000001"}'),
  -- Parto 2023-01-10: 2 vivos, 0 muertos
  ('eeeeeeee-f001-0002-0001-000000000001', 'PARTO', 'vacuno', '2023-01-10',
   'cccccccc-1001-0001-0000-000000000001',
   '{"tipo_parto":"natural","numero_nacidos":2,"numero_vivos":2,"numero_muertos":0}'),

  -- ── Fortuna C2 ────────────────────────────────────────────────────────────
  -- Cubrición 2023-07-01 con Titán
  ('eeeeeeee-f001-0001-0002-000000000001', 'CUBRICION', 'vacuno', '2023-07-01',
   'cccccccc-1001-0002-0000-000000000002',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0002-0000-0000-000000000002"}'),
  -- Parto 2024-04-10: 2 vivos, 1 muerto
  ('eeeeeeee-f001-0002-0002-000000000001', 'PARTO', 'vacuno', '2024-04-10',
   'cccccccc-1001-0002-0000-000000000002',
   '{"tipo_parto":"natural","numero_nacidos":3,"numero_vivos":2,"numero_muertos":1}'),

  -- ── Fortuna C3 ────────────────────────────────────────────────────────────
  -- Cubrición 2025-10-01 con Lucero
  ('eeeeeeee-f001-0001-0003-000000000001', 'CUBRICION', 'vacuno', '2025-10-01',
   'cccccccc-1001-0003-0000-000000000003',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0001-0000-0000-000000000001"}'),
  -- Parto 2026-07-10: 2 vivos, 1 muerto
  ('eeeeeeee-f001-0002-0003-000000000001', 'PARTO', 'vacuno', '2026-07-10',
   'cccccccc-1001-0003-0000-000000000003',
   '{"tipo_parto":"natural","numero_nacidos":3,"numero_vivos":2,"numero_muertos":1}'),

  -- ── Esperanza C1 ──────────────────────────────────────────────────────────
  -- Cubrición 2022-06-01 con Titán
  ('eeeeeeee-e002-0001-0001-000000000001', 'CUBRICION', 'vacuno', '2022-06-01',
   'cccccccc-1002-0001-0000-000000000001',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0002-0000-0000-000000000002"}'),
  -- Parto 2023-03-12: 1 vivo, 0 muertos
  ('eeeeeeee-e002-0002-0001-000000000001', 'PARTO', 'vacuno', '2023-03-12',
   'cccccccc-1002-0001-0000-000000000001',
   '{"tipo_parto":"natural","numero_nacidos":1,"numero_vivos":1,"numero_muertos":0}'),

  -- ── Esperanza C2 ──────────────────────────────────────────────────────────
  -- Cubrición 2025-09-01 con Titán
  ('eeeeeeee-e002-0001-0002-000000000001', 'CUBRICION', 'vacuno', '2025-09-01',
   'cccccccc-1002-0002-0000-000000000002',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0002-0000-0000-000000000002"}'),
  -- Parto 2026-06-10: 2 vivos, 0 muertos
  ('eeeeeeee-e002-0002-0002-000000000001', 'PARTO', 'vacuno', '2026-06-10',
   'cccccccc-1002-0002-0000-000000000002',
   '{"tipo_parto":"asistido","numero_nacidos":2,"numero_vivos":2,"numero_muertos":0}'),

  -- ── Carmen C1 ─────────────────────────────────────────────────────────────
  -- Cubrición 2023-06-01 con Centauro
  ('eeeeeeee-c003-0001-0001-000000000001', 'CUBRICION', 'vacuno', '2023-06-01',
   'cccccccc-1003-0001-0000-000000000001',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0003-0000-0000-000000000003"}'),
  -- Parto 2024-03-11: 1 vivo, 0 muertos
  ('eeeeeeee-c003-0002-0001-000000000001', 'PARTO', 'vacuno', '2024-03-11',
   'cccccccc-1003-0001-0000-000000000001',
   '{"tipo_parto":"natural","numero_nacidos":1,"numero_vivos":1,"numero_muertos":0}'),

  -- ── Carmen C2 ─────────────────────────────────────────────────────────────
  -- Cubrición 2026-06-15 con Centauro (sin parto aún)
  ('eeeeeeee-c003-0001-0002-000000000001', 'CUBRICION', 'vacuno', '2026-06-15',
   'cccccccc-1003-0002-0000-000000000002',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0003-0000-0000-000000000003"}'),

  -- ── Maravilla C1 ──────────────────────────────────────────────────────────
  -- Cubrición 2024-03-01 con Lucero
  ('eeeeeeee-4004-0001-0001-000000000001', 'CUBRICION', 'vacuno', '2024-03-01',
   'cccccccc-1004-0001-0000-000000000001',
   '{"tipo_cubricion":"natural","macho_id":"aaaaaaaa-0001-0000-0000-000000000001"}'),
  -- Parto 2024-12-10: 1 vivo, 0 muertos
  ('eeeeeeee-4004-0002-0001-000000000001', 'PARTO', 'vacuno', '2024-12-10',
   'cccccccc-1004-0001-0000-000000000001',
   '{"tipo_parto":"natural","numero_nacidos":1,"numero_vivos":1,"numero_muertos":0}')

) AS ev(id, codigo, especie, fecha, ciclo_id, meta)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- DETALLE DE PARTOS (evento_parto)
-- =============================================================================

INSERT INTO evento_parto (evento_id, numero_nacidos, numero_vivos, numero_muertos, tipo_parto, observaciones)
VALUES
  ('eeeeeeee-f001-0002-0001-000000000001', 2, 2, 0, 'natural',  NULL),
  ('eeeeeeee-f001-0002-0002-000000000001', 3, 2, 1, 'natural',  'Una cría nació muerta'),
  ('eeeeeeee-f001-0002-0003-000000000001', 3, 2, 1, 'natural',  NULL),
  ('eeeeeeee-e002-0002-0001-000000000001', 1, 1, 0, 'natural',  NULL),
  ('eeeeeeee-e002-0002-0002-000000000001', 2, 2, 0, 'asistido', NULL),
  ('eeeeeeee-c003-0002-0001-000000000001', 1, 1, 0, 'natural',  NULL),
  ('eeeeeeee-4004-0002-0001-000000000001', 1, 1, 0, 'natural',  NULL)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- CRÍAS — CICLOS HISTÓRICOS (Recría, vínculo FINALIZADO)
-- =============================================================================
-- Estas crías nacieron antes de PRD010. Se insertan directamente con el estado
-- correcto derivado de la evidencia disponible (tipo_productivo + estado_vital).

INSERT INTO animal (
  id, especie, tipo_productivo_id, crotal,
  raza_id, padre_id, madre_id,
  fecha_nacimiento, sexo, es_reproductora, origen,
  estado_vital, estado_identificacion, estado_vinculo_materno,
  parto_evento_id, evento_creacion_id
) VALUES

  -- ── Fortuna C1 — parto 2023-01-10, padre: Lucero ──────────────────────────
  -- FC1-A: hembra, Recría, identificada, vínculo finalizado (destetada)
  (
    'aaaaaaaa-f1a0-0000-0000-000000000001',
    'vacuno', 'cc000001-0000-0000-0000-000000000000', 'ES001234569101',
    'bb000001-0000-0000-0000-000000000000',
    'aaaaaaaa-0001-0000-0000-000000000001',
    'aaaaaaaa-1001-0000-0000-000000000001',
    '2023-01-10', 'hembra', false, 'interno',
    'vivo', 'completa', 'finalizado',
    'eeeeeeee-f001-0002-0001-000000000001', 'eeeeeeee-f001-0002-0001-000000000001'
  ),
  -- FC1-B: macho, Recría, identificado, vínculo finalizado
  (
    'aaaaaaaa-f1b0-0000-0000-000000000002',
    'vacuno', 'cc000001-0000-0000-0000-000000000000', 'ES001234569102',
    'bb000001-0000-0000-0000-000000000000',
    'aaaaaaaa-0001-0000-0000-000000000001',
    'aaaaaaaa-1001-0000-0000-000000000001',
    '2023-01-10', 'macho', false, 'interno',
    'vivo', 'completa', 'finalizado',
    'eeeeeeee-f001-0002-0001-000000000001', 'eeeeeeee-f001-0002-0001-000000000001'
  ),

  -- ── Fortuna C2 — parto 2024-04-10, padre: Titán ───────────────────────────
  -- FC2-A: hembra, Recría, identificada, vínculo finalizado
  (
    'aaaaaaaa-f2a0-0000-0000-000000000001',
    'vacuno', 'cc000001-0000-0000-0000-000000000000', 'ES001234569201',
    'bb000003-0000-0000-0000-000000000000',
    'aaaaaaaa-0002-0000-0000-000000000002',
    'aaaaaaaa-1001-0000-0000-000000000001',
    '2024-04-10', 'hembra', false, 'interno',
    'vivo', 'completa', 'finalizado',
    'eeeeeeee-f001-0002-0002-000000000001', 'eeeeeeee-f001-0002-0002-000000000001'
  ),
  -- FC2-B: macho, Recría, identificado, vínculo finalizado
  (
    'aaaaaaaa-f2b0-0000-0000-000000000002',
    'vacuno', 'cc000001-0000-0000-0000-000000000000', 'ES001234569202',
    'bb000003-0000-0000-0000-000000000000',
    'aaaaaaaa-0002-0000-0000-000000000002',
    'aaaaaaaa-1001-0000-0000-000000000001',
    '2024-04-10', 'macho', false, 'interno',
    'vivo', 'completa', 'finalizado',
    'eeeeeeee-f001-0002-0002-000000000001', 'eeeeeeee-f001-0002-0002-000000000001'
  ),
  -- FC2-C: muerta (nacida muerta), tipo_productivo=NULL, vínculo finalizado
  (
    'aaaaaaaa-f2c0-0000-0000-000000000003',
    'vacuno', NULL, NULL,
    'bb000003-0000-0000-0000-000000000000',
    'aaaaaaaa-0002-0000-0000-000000000002',
    'aaaaaaaa-1001-0000-0000-000000000001',
    '2024-04-10', NULL, false, 'interno',
    'muerto', NULL, 'finalizado',
    'eeeeeeee-f001-0002-0002-000000000001', 'eeeeeeee-f001-0002-0002-000000000001'
  ),

  -- ── Esperanza C1 — parto 2023-03-12, padre: Titán ─────────────────────────
  -- EC1-A: macho, Recría, identificado, vínculo finalizado
  (
    'aaaaaaaa-e1a0-0000-0000-000000000001',
    'vacuno', 'cc000001-0000-0000-0000-000000000000', 'ES001234569301',
    'bb000003-0000-0000-0000-000000000000',
    'aaaaaaaa-0002-0000-0000-000000000002',
    'aaaaaaaa-1002-0000-0000-000000000002',
    '2023-03-12', 'macho', false, 'interno',
    'vivo', 'completa', 'finalizado',
    'eeeeeeee-e002-0002-0001-000000000001', 'eeeeeeee-e002-0002-0001-000000000001'
  ),

  -- ── Carmen C1 — parto 2024-03-11, padre: Centauro ─────────────────────────
  -- CC1-A: hembra, Recría, identificada, vínculo finalizado
  (
    'aaaaaaaa-c1a0-0000-0000-000000000001',
    'vacuno', 'cc000001-0000-0000-0000-000000000000', 'ES001234569401',
    'bb000002-0000-0000-0000-000000000000',
    'aaaaaaaa-0003-0000-0000-000000000003',
    'aaaaaaaa-1003-0000-0000-000000000003',
    '2024-03-11', 'hembra', false, 'interno',
    'vivo', 'completa', 'finalizado',
    'eeeeeeee-c003-0002-0001-000000000001', 'eeeeeeee-c003-0002-0001-000000000001'
  ),

  -- ── Maravilla C1 — parto 2024-12-10, padre: Lucero ────────────────────────
  -- MC1-A: macho, Recría, identificado, vínculo finalizado
  (
    'aaaaaaaa-41a0-0000-0000-000000000001',
    'vacuno', 'cc000001-0000-0000-0000-000000000000', 'ES001234569501',
    'bb000001-0000-0000-0000-000000000000',
    'aaaaaaaa-0001-0000-0000-000000000001',
    'aaaaaaaa-1004-0000-0000-000000000004',
    '2024-12-10', 'macho', false, 'interno',
    'vivo', 'completa', 'finalizado',
    'eeeeeeee-4004-0002-0001-000000000001', 'eeeeeeee-4004-0002-0001-000000000001'
  )

ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- CRÍAS — CICLO ACTUAL (Cría, vínculo ACTIVO, algunas sin identificar)
-- =============================================================================
-- Crías nacidas recientemente, aún lactantes. El sistema conoce su dependencia.
-- Algunas tienen identificación pendiente (crotal/hierro no asignados aún).

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
  -- ── Fortuna C3 — parto 2026-07-10, padre: Lucero ──────────────────────────
  -- FC3-A: hembra, identificada (crotal asignado)
  ('aaaaaaaa-f3a0-0000-0000-000000000001', 'ES001234569601',
   'bb000001-0000-0000-0000-000000000000',
   'aaaaaaaa-0001-0000-0000-000000000001',
   'aaaaaaaa-1001-0000-0000-000000000001',
   '2026-07-10', 'hembra', 'completa',
   'eeeeeeee-f001-0002-0003-000000000001'),
  -- FC3-B: macho, sin identificar (aún no tiene crotal)
  ('aaaaaaaa-f3b0-0000-0000-000000000002', NULL,
   'bb000001-0000-0000-0000-000000000000',
   'aaaaaaaa-0001-0000-0000-000000000001',
   'aaaaaaaa-1001-0000-0000-000000000001',
   '2026-07-10', 'macho', 'pendiente',
   'eeeeeeee-f001-0002-0003-000000000001'),

  -- ── Esperanza C2 — parto 2026-06-10, padre: Titán ─────────────────────────
  -- EC2-A: hembra, sin identificar
  ('aaaaaaaa-e2a0-0000-0000-000000000001', NULL,
   'bb000003-0000-0000-0000-000000000000',
   'aaaaaaaa-0002-0000-0000-000000000002',
   'aaaaaaaa-1002-0000-0000-000000000002',
   '2026-06-10', 'hembra', 'pendiente',
   'eeeeeeee-e002-0002-0002-000000000001'),
  -- EC2-B: macho, sin identificar
  ('aaaaaaaa-e2b0-0000-0000-000000000002', NULL,
   'bb000003-0000-0000-0000-000000000000',
   'aaaaaaaa-0002-0000-0000-000000000002',
   'aaaaaaaa-1002-0000-0000-000000000002',
   '2026-06-10', 'macho', 'pendiente',
   'eeeeeeee-e002-0002-0002-000000000001')

) AS a(id, crotal, raza_id, padre_id, madre_id, fecha_nacimiento, sexo, identificacion, parto_evento_id)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- CRÍAS MUERTAS — CICLO ACTUAL (tipo_productivo=NULL, vínculo FINALIZADO)
-- =============================================================================

INSERT INTO animal (
  id, especie, tipo_productivo_id, crotal,
  raza_id, padre_id, madre_id,
  fecha_nacimiento, sexo, es_reproductora, origen,
  estado_vital, estado_vinculo_materno,
  parto_evento_id, evento_creacion_id
) VALUES
  -- Fortuna C3: 1 nacida muerta (padre: Lucero)
  (
    'aaaaaaaa-f3c0-0000-0000-000000000003',
    'vacuno', NULL, NULL,
    'bb000001-0000-0000-0000-000000000000',
    'aaaaaaaa-0001-0000-0000-000000000001',
    'aaaaaaaa-1001-0000-0000-000000000001',
    '2026-07-10', NULL, false, 'interno',
    'muerto', 'finalizado',
    'eeeeeeee-f001-0002-0003-000000000001', 'eeeeeeee-f001-0002-0003-000000000001'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- ASOCIACIONES EVENTO ↔ ANIMAL
-- =============================================================================

INSERT INTO evento_animales (evento_id, animal_id, rol)
VALUES
  -- ── Fortuna C1 ────────────────────────────────────────────────────────────
  ('eeeeeeee-f001-0001-0001-000000000001', 'aaaaaaaa-1001-0000-0000-000000000001', 'madre'),
  ('eeeeeeee-f001-0002-0001-000000000001', 'aaaaaaaa-1001-0000-0000-000000000001', 'madre'),
  ('eeeeeeee-f001-0002-0001-000000000001', 'aaaaaaaa-f1a0-0000-0000-000000000001', 'cria'),
  ('eeeeeeee-f001-0002-0001-000000000001', 'aaaaaaaa-f1b0-0000-0000-000000000002', 'cria'),

  -- ── Fortuna C2 ────────────────────────────────────────────────────────────
  ('eeeeeeee-f001-0001-0002-000000000001', 'aaaaaaaa-1001-0000-0000-000000000001', 'madre'),
  ('eeeeeeee-f001-0002-0002-000000000001', 'aaaaaaaa-1001-0000-0000-000000000001', 'madre'),
  ('eeeeeeee-f001-0002-0002-000000000001', 'aaaaaaaa-f2a0-0000-0000-000000000001', 'cria'),
  ('eeeeeeee-f001-0002-0002-000000000001', 'aaaaaaaa-f2b0-0000-0000-000000000002', 'cria'),
  ('eeeeeeee-f001-0002-0002-000000000001', 'aaaaaaaa-f2c0-0000-0000-000000000003', 'cria'),

  -- ── Fortuna C3 ────────────────────────────────────────────────────────────
  ('eeeeeeee-f001-0001-0003-000000000001', 'aaaaaaaa-1001-0000-0000-000000000001', 'madre'),
  ('eeeeeeee-f001-0002-0003-000000000001', 'aaaaaaaa-1001-0000-0000-000000000001', 'madre'),
  ('eeeeeeee-f001-0002-0003-000000000001', 'aaaaaaaa-f3a0-0000-0000-000000000001', 'cria'),
  ('eeeeeeee-f001-0002-0003-000000000001', 'aaaaaaaa-f3b0-0000-0000-000000000002', 'cria'),
  ('eeeeeeee-f001-0002-0003-000000000001', 'aaaaaaaa-f3c0-0000-0000-000000000003', 'cria'),

  -- ── Esperanza C1 ──────────────────────────────────────────────────────────
  ('eeeeeeee-e002-0001-0001-000000000001', 'aaaaaaaa-1002-0000-0000-000000000002', 'madre'),
  ('eeeeeeee-e002-0002-0001-000000000001', 'aaaaaaaa-1002-0000-0000-000000000002', 'madre'),
  ('eeeeeeee-e002-0002-0001-000000000001', 'aaaaaaaa-e1a0-0000-0000-000000000001', 'cria'),

  -- ── Esperanza C2 ──────────────────────────────────────────────────────────
  ('eeeeeeee-e002-0001-0002-000000000001', 'aaaaaaaa-1002-0000-0000-000000000002', 'madre'),
  ('eeeeeeee-e002-0002-0002-000000000001', 'aaaaaaaa-1002-0000-0000-000000000002', 'madre'),
  ('eeeeeeee-e002-0002-0002-000000000001', 'aaaaaaaa-e2a0-0000-0000-000000000001', 'cria'),
  ('eeeeeeee-e002-0002-0002-000000000001', 'aaaaaaaa-e2b0-0000-0000-000000000002', 'cria'),

  -- ── Carmen C1 ─────────────────────────────────────────────────────────────
  ('eeeeeeee-c003-0001-0001-000000000001', 'aaaaaaaa-1003-0000-0000-000000000003', 'madre'),
  ('eeeeeeee-c003-0002-0001-000000000001', 'aaaaaaaa-1003-0000-0000-000000000003', 'madre'),
  ('eeeeeeee-c003-0002-0001-000000000001', 'aaaaaaaa-c1a0-0000-0000-000000000001', 'cria'),

  -- ── Carmen C2 ─────────────────────────────────────────────────────────────
  ('eeeeeeee-c003-0001-0002-000000000001', 'aaaaaaaa-1003-0000-0000-000000000003', 'madre'),

  -- ── Maravilla C1 ──────────────────────────────────────────────────────────
  ('eeeeeeee-4004-0001-0001-000000000001', 'aaaaaaaa-1004-0000-0000-000000000004', 'madre'),
  ('eeeeeeee-4004-0002-0001-000000000001', 'aaaaaaaa-1004-0000-0000-000000000004', 'madre'),
  ('eeeeeeee-4004-0002-0001-000000000001', 'aaaaaaaa-41a0-0000-0000-000000000001', 'cria')

ON CONFLICT DO NOTHING;

-- =============================================================================
-- MISCELÁNEOS
-- =============================================================================

INSERT INTO animal (
  id, especie, tipo_productivo_id, nombre, crotal, num_hierro,
  raza_id, fecha_nacimiento, sexo, es_reproductora, origen,
  estado_vital, estado_sanitario
) VALUES
  -- Brutus: macho en engorde, compra
  (
    'aaaaaaaa-2001-0000-0000-000000000001',
    'vacuno', 'cc000004-0000-0000-0000-000000000000',
    'Brutus', 'ES001234562001', 'M-01',
    NULL,
    '2022-08-10', 'macho', false, 'compra',
    'vivo', 'sano'
  )
ON CONFLICT (id) DO NOTHING;

-- La Rubia: hembra vendida (fecha_nacimiento_estimada para evitar constraint)
INSERT INTO animal (
  id, especie, tipo_productivo_id, nombre, crotal,
  fecha_nacimiento_estimada, sexo, es_reproductora, origen,
  estado_vital, estado_sanitario
) VALUES
  (
    'aaaaaaaa-2002-0000-0000-000000000002',
    'vacuno', 'cc000004-0000-0000-0000-000000000000',
    'La Rubia', 'ES001234562002',
    '2020-01-01', 'hembra', false, 'compra',
    'vendido', 'sano'
  )
ON CONFLICT (id) DO NOTHING;
