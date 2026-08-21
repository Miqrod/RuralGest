-- =============================================================================
-- Fix: registrar_compra_animal — crear ciclo reproductivo inicial para reproductoras
--
-- El RPC insertaba el animal con estado_reproductivo = 'vacia' cuando es reproductora,
-- pero nunca creaba el ciclo_reproductivo correspondiente. Cualquier evento reproductivo
-- posterior fallaba con "requiere un ciclo reproductivo existente".
--
-- Dos partes:
--   1. Backfill: crea el ciclo que falta en las reproductoras ya registradas.
--   2. Actualiza el RPC para que las compras futuras lo creen en la misma transacción.
-- =============================================================================

-- 1. Backfill: reproductoras vivas sin ciclo abierto
--    fecha_inicio = fecha del evento de creación del animal (la compra original).
--    numero_ciclo = 1 (primer ciclo; si ya tiene ciclos cerrados, toma el siguiente).
INSERT INTO ciclo_reproductivo (animal_id, numero_ciclo, fecha_inicio)
SELECT
  a.id,
  COALESCE(
    (SELECT MAX(cr.numero_ciclo) FROM ciclo_reproductivo cr WHERE cr.animal_id = a.id),
    0
  ) + 1,
  COALESCE(e.fecha, CURRENT_DATE)
FROM animal a
LEFT JOIN eventos e ON e.id = a.evento_creacion_id
WHERE a.es_reproductora     = true
  AND a.estado_vital        = 'vivo'
  AND a.estado_reproductivo IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ciclo_reproductivo cr
    WHERE cr.animal_id = a.id
      AND cr.fecha_fin IS NULL
  );

-- 2. Actualizar RPC: añadir INSERT en ciclo_reproductivo cuando es reproductora
CREATE OR REPLACE FUNCTION registrar_compra_animal(
  p_especie                   especie_enum,
  p_sexo                      sexo_enum,
  p_tipo_productivo_id        UUID,
  p_fecha_compra              DATE,
  p_crotal                    TEXT    DEFAULT NULL,
  p_num_hierro                TEXT    DEFAULT NULL,
  p_raza_id                   UUID    DEFAULT NULL,
  p_fecha_nacimiento          DATE    DEFAULT NULL,
  p_fecha_nacimiento_estimada DATE    DEFAULT NULL,
  p_lote_id                   UUID    DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tipo_evento_id  UUID;
  v_motivo_id       UUID;
  v_evento_id       UUID;
  v_animal_id       UUID;
  v_tp_nombre       TEXT;
  v_es_reproductora BOOLEAN;
BEGIN
  v_tipo_evento_id := _resolve_tipo_evento_id('ENTRADA');
  v_motivo_id      := _resolve_motivo_id('compra');

  SELECT nombre INTO v_tp_nombre FROM tipo_productivo WHERE id = p_tipo_productivo_id;
  v_es_reproductora := (p_sexo = 'hembra' AND v_tp_nombre = 'Reproductora');

  INSERT INTO eventos (tipo_evento_id, motivo_id, especie, fecha)
  VALUES (v_tipo_evento_id, v_motivo_id, p_especie, p_fecha_compra)
  RETURNING id INTO v_evento_id;

  INSERT INTO animal (
    especie, sexo, tipo_productivo_id,
    crotal, num_hierro, raza_id,
    fecha_nacimiento, fecha_nacimiento_estimada,
    lote_id,
    origen,
    evento_creacion_id, evento_origen_id,
    es_reproductora,
    estado_vital, estado_sanitario, estado_reproductivo
  ) VALUES (
    p_especie, p_sexo, p_tipo_productivo_id,
    p_crotal, p_num_hierro, p_raza_id,
    p_fecha_nacimiento, p_fecha_nacimiento_estimada,
    p_lote_id,
    'compra',
    v_evento_id, v_evento_id,
    v_es_reproductora,
    'vivo', 'sano',
    CASE WHEN v_es_reproductora THEN 'vacia'::estado_reproductivo_enum ELSE NULL END
  ) RETURNING id INTO v_animal_id;

  INSERT INTO evento_animales (evento_id, animal_id)
  VALUES (v_evento_id, v_animal_id);

  -- Ciclo reproductivo inicial: solo para reproductoras.
  -- Es siempre el primer ciclo (numero_ciclo = 1) porque el animal acaba de crearse.
  IF v_es_reproductora THEN
    INSERT INTO ciclo_reproductivo (animal_id, numero_ciclo, fecha_inicio)
    VALUES (v_animal_id, 1, p_fecha_compra);
  END IF;

  RETURN v_animal_id;
END;
$$;
