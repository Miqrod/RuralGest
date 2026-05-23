-- =============================================================================
-- MIGRATION 003: Seed de datos de catálogo
-- tipo_evento, motivos_movimiento, categoria_financiera
-- Estos son datos estructurales del sistema, no datos de usuario.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- TIPO_EVENTO (11 registros)
-- Define qué puede ocurrir en el sistema y cómo se comporta cada evento.
-- -----------------------------------------------------------------------------

INSERT INTO tipo_evento (codigo, descripcion, tipo_tecnico, tipo_negocio, es_biologico, requiere_motivo, afecta_stock, afecta_animales, afecta_lotes) VALUES
  ('PARTO',             'Parto de una hembra reproductora',              'BIOLOGICO', 'reproductivo', true,  false, false, true,  false),
  ('ABORTO',            'Aborto durante la gestación',                   'BIOLOGICO', 'reproductivo', true,  false, false, true,  false),
  ('CUBRICION',         'Cubrición de una hembra reproductora',          'BIOLOGICO', 'reproductivo', true,  false, false, true,  false),
  ('DESTETE',           'Destete de la camada',                          'BIOLOGICO', 'reproductivo', true,  false, true,  true,  true),
  ('CAMBIO_UBICACION',  'Cambio de ubicación de un animal o lote',       'OPERATIVO', 'ubicacion',    false, false, false, true,  true),
  ('SANITARIO',         'Evento sanitario (tratamiento, observación…)',   'OPERATIVO', 'sanitario',    false, false, false, true,  true),
  ('ENTRADA',           'Entrada de animales o stock en un lote',        'STOCK',     'movimientos',  false, true,  true,  true,  true),
  ('SALIDA',            'Salida de animales o stock de un lote',         'STOCK',     'movimientos',  false, true,  true,  true,  true),
  ('CREACION_LOTE',     'Creación de un nuevo lote',                     'SISTEMA',   'gestion',      false, false, false, false, true),
  ('AJUSTE',            'Ajuste de stock por regularización o error',    'STOCK',     'gestion',      false, true,  true,  false, true),
  ('SELECCION_REPROD',  'Selección de un animal como reproductor',       'OPERATIVO', 'gestion',      false, false, true,  true,  true);


-- -----------------------------------------------------------------------------
-- MOTIVOS_MOVIMIENTO (10 registros)
-- Define el "por qué" de los eventos de stock (ENTRADA, SALIDA, AJUSTE).
-- es_monetizable activa la lógica económica en el backend.
-- -----------------------------------------------------------------------------

INSERT INTO motivos_movimiento (nombre, tipo_base, descripcion, es_monetizable, tipo_economico) VALUES
  ('compra',                'ENTRADA', 'Entrada externa de animales',          true,  'gasto'),
  ('venta',                 'SALIDA',  'Salida comercial de animales',          true,  'ingreso'),
  ('muerte',                'SALIDA',  'Baja por muerte',                       false, 'ninguno'),
  ('adopcion',              'MIXTO',   'Movimiento entre camadas',              false, 'ninguno'),
  ('paso_engorde',          'MIXTO',   'Paso de post-destete a engorde',        false, 'ninguno'),
  ('reagrupacion',          'MIXTO',   'Reagrupación entre lotes de engorde',   false, 'ninguno'),
  ('destete',               'MIXTO',   'Movimiento interno generado en destete', false, 'ninguno'),
  ('seleccion_reproductor', 'SALIDA',  'Extracción de un animal de un lote como reproductor', false, 'ninguno'),
  ('ajuste_regularizacion', 'MIXTO',   'Corrección por conteo real',            false, 'ninguno'),
  ('ajuste_error',          'MIXTO',   'Corrección de error operativo',         false, 'ninguno');


-- -----------------------------------------------------------------------------
-- CATEGORIA_FINANCIERA (16 registros)
-- Árbol jerárquico: primero las raíces, luego los niveles.
-- Los IDs son fijos para poder referenciarlos en los parent_id siguientes.
-- -----------------------------------------------------------------------------

-- Raíces
INSERT INTO categoria_financiera (id, nombre, tipo, parent_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Gastos',   'gasto',   NULL),
  ('00000000-0000-0000-0000-000000000002', 'Ingresos', 'ingreso', NULL);

-- Nivel 1 — Gastos
INSERT INTO categoria_financiera (id, nombre, tipo, parent_id) VALUES
  ('00000000-0000-0000-0000-000000000010', 'Alimentación',  'gasto', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000011', 'Veterinario',   'gasto', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000012', 'Mantenimiento', 'gasto', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000013', 'Combustible',   'gasto', '00000000-0000-0000-0000-000000000001');

-- Nivel 1 — Ingresos
INSERT INTO categoria_financiera (id, nombre, tipo, parent_id) VALUES
  ('00000000-0000-0000-0000-000000000020', 'Venta de animales', 'ingreso', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000021', 'Subvenciones',      'ingreso', '00000000-0000-0000-0000-000000000002');

-- Nivel 2 — Alimentación
INSERT INTO categoria_financiera (id, nombre, tipo, parent_id) VALUES
  ('00000000-0000-0000-0000-000000000030', 'Pienso',   'gasto', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000031', 'Forraje',  'gasto', '00000000-0000-0000-0000-000000000010');

-- Nivel 2 — Veterinario
INSERT INTO categoria_financiera (id, nombre, tipo, parent_id) VALUES
  ('00000000-0000-0000-0000-000000000032', 'Medicamentos',          'gasto', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000033', 'Servicios veterinarios','gasto', '00000000-0000-0000-0000-000000000011');

-- Nivel 2 — Mantenimiento
INSERT INTO categoria_financiera (id, nombre, tipo, parent_id) VALUES
  ('00000000-0000-0000-0000-000000000034', 'Reparaciones', 'gasto', '00000000-0000-0000-0000-000000000012'),
  ('00000000-0000-0000-0000-000000000035', 'Material',     'gasto', '00000000-0000-0000-0000-000000000012');
