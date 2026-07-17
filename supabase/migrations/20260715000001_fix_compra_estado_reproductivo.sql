-- =============================================================================
-- Fix: registrar_compra_animal — estado_reproductivo inicial para reproductoras
--
-- El RPC original insertaba estado_reproductivo = NULL siempre, independientemente
-- de si el animal es reproductora. Según la arquitectura del dominio:
--   es_reproductora = true  → estado_reproductivo = 'vacia'  (módulo activo, sin gestación)
--   es_reproductora = false → estado_reproductivo = NULL     (módulo no aplica)
-- =============================================================================
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

  RETURN v_animal_id;
END;
$$;
