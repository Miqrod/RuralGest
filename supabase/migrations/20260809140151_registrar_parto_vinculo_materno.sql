-- =============================================================================
-- registrar_parto: inicializar estado_vinculo_materno en el nacimiento
--
-- PRD010 introduce la dependencia funcional madre-cría. A partir de ahora
-- todo parto establece el vínculo de forma explícita:
--
--   Cría viva   → estado_vinculo_materno = 'activo'
--                 El sistema conoce que existe dependencia funcional.
--
--   Cría muerta → estado_vinculo_materno = 'finalizado'
--                 El sistema conoce que NUNCA existió dependencia funcional.
--                 (NULL sería "sin información"; FINALIZADO es conocimiento positivo.)
--
-- Ref: PRD010 §3.3, §19, Caso H
-- =============================================================================
CREATE OR REPLACE FUNCTION registrar_parto(
  p_animal_id           UUID,
  p_fecha               DATE,
  p_ciclo_id            UUID,
  p_numero_nacidos      INT,
  p_numero_vivos        INT,
  p_numero_muertos      INT,
  p_tipo_parto          tipo_parto_enum,
  p_estado_reproductivo estado_reproductivo_enum DEFAULT 'lactante',
  p_padre_id            UUID    DEFAULT NULL,
  p_raza_cria_id        UUID    DEFAULT NULL,
  p_observaciones       TEXT    DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tipo_evento_id     UUID;
  v_evento_id          UUID;
  v_especie            especie_enum;
  v_estado_vital       estado_vital_enum;
  v_crotal             TEXT;
  v_tipo_productivo_id UUID;
  v_cria_id            UUID;
  v_crias_ids          UUID[] := '{}';
BEGIN
  SELECT estado_vital, especie, crotal
  INTO v_estado_vital, v_especie, v_crotal
  FROM animal WHERE id = p_animal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Animal no encontrado: %', p_animal_id;
  END IF;

  IF v_estado_vital != 'vivo' THEN
    RAISE EXCEPTION 'El animal% no puede recibir eventos: estado_vital es "%"',
      CASE WHEN v_crotal IS NOT NULL THEN ' (crotal: ' || v_crotal || ')' ELSE '' END,
      v_estado_vital;
  END IF;

  -- Tipo productivo inicial para crías vivas: 'Cría' (→ 'Recría' al destete)
  SELECT id INTO v_tipo_productivo_id
  FROM tipo_productivo WHERE nombre = 'Cría' AND especie = v_especie LIMIT 1;

  v_tipo_evento_id := _resolve_tipo_evento_id('PARTO');

  INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
  VALUES (
    v_tipo_evento_id,
    v_especie,
    p_fecha,
    p_ciclo_id,
    jsonb_build_object(
      'tipo_parto',     p_tipo_parto,
      'numero_nacidos', p_numero_nacidos,
      'numero_vivos',   p_numero_vivos,
      'numero_muertos', p_numero_muertos,
      'observaciones',  p_observaciones
    )
  )
  RETURNING id INTO v_evento_id;

  INSERT INTO evento_parto (evento_id, numero_nacidos, numero_vivos, numero_muertos, tipo_parto, observaciones)
  VALUES (v_evento_id, p_numero_nacidos, p_numero_vivos, p_numero_muertos, p_tipo_parto, p_observaciones);

  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_animal_id, 'madre');

  -- Crías vivas: tipo_productivo = 'Cría', vínculo materno activo
  FOR v_cria_id IN
    SELECT gen_random_uuid() FROM generate_series(1, p_numero_vivos)
  LOOP
    INSERT INTO animal (
      id, especie, origen,
      madre_id, padre_id, raza_id,
      tipo_productivo_id, parto_evento_id, evento_creacion_id,
      fecha_nacimiento,
      estado_vital, estado_identificacion,
      estado_vinculo_materno
    )
    VALUES (
      v_cria_id, v_especie, 'interno',
      p_animal_id, p_padre_id, p_raza_cria_id,
      v_tipo_productivo_id, v_evento_id, v_evento_id,
      p_fecha,
      'vivo', 'pendiente',
      'activo'
    );

    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_evento_id, v_cria_id, 'cria');

    v_crias_ids := array_append(v_crias_ids, v_cria_id);
  END LOOP;

  -- Crías muertas: tipo_productivo = NULL, vínculo finalizado (nunca existió dependencia)
  FOR v_cria_id IN
    SELECT gen_random_uuid() FROM generate_series(1, p_numero_muertos)
  LOOP
    INSERT INTO animal (
      id, especie, origen,
      madre_id, padre_id, raza_id,
      tipo_productivo_id, parto_evento_id, evento_creacion_id,
      fecha_nacimiento,
      estado_vital,
      estado_vinculo_materno
    )
    VALUES (
      v_cria_id, v_especie, 'interno',
      p_animal_id, p_padre_id, p_raza_cria_id,
      NULL, v_evento_id, v_evento_id,
      p_fecha,
      'muerto',
      'finalizado'
    );

    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_evento_id, v_cria_id, 'cria');
  END LOOP;

  UPDATE animal
  SET estado_reproductivo  = p_estado_reproductivo,
      fecha_prevista_parto = NULL
  WHERE id = p_animal_id;

  RETURN jsonb_build_object(
    'eventoId',  v_evento_id,
    'criasIds',  v_crias_ids
  );
END;
$$;
