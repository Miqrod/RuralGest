-- =============================================================================
-- registrar_parto
--
-- Atomiza el flujo completo de parto en una única transacción:
--   SELECT FOR UPDATE (madre) → INSERT eventos → INSERT evento_parto
--   → INSERT animal × numero_vivos → INSERT animal × numero_muertos
--   → INSERT evento_animales (madre + crías) → UPDATE animal (madre)
--
-- El ciclo reproductivo permanece ABIERTO — solo se cierra en el Destete.
--
-- Crías vivas:   estado_identificacion = 'pendiente' (workflow de identificación activo)
-- Crías muertas: estado_identificacion = NULL        (no aplica identificación)
-- Todas las crías reciben fecha_nacimiento = p_fecha y origen = 'interno'.
--
-- Devuelve JSONB: { "eventoId": UUID, "criasIds": [UUID, ...] }
-- criasIds solo incluye las crías vivas (las que entran en el workflow de identificación).
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
  -- Anti-concurrencia: bloquear la madre antes de cualquier escritura
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

  -- Tipo productivo inicial de todas las crías
  SELECT id INTO v_tipo_productivo_id
  FROM tipo_productivo WHERE nombre = 'Recría' LIMIT 1;

  v_tipo_evento_id := _resolve_tipo_evento_id('PARTO');

  -- 1. Evento: fuente de verdad del sistema
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

  -- 2. Detalle especializado del parto (1:1 con eventos)
  INSERT INTO evento_parto (evento_id, numero_nacidos, numero_vivos, numero_muertos, tipo_parto, observaciones)
  VALUES (v_evento_id, p_numero_nacidos, p_numero_vivos, p_numero_muertos, p_tipo_parto, p_observaciones);

  -- 3. Asociación evento ↔ madre
  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_animal_id, 'madre');

  -- 4. Una entidad Animal por cada cría viva
  --    parto_evento_id: FK al evento que originó a la cría (trazabilidad madre ↔ hijos)
  FOR v_cria_id IN
    SELECT gen_random_uuid() FROM generate_series(1, p_numero_vivos)
  LOOP
    INSERT INTO animal (
      id, especie, origen,
      madre_id, padre_id, raza_id,
      tipo_productivo_id, parto_evento_id, evento_creacion_id,
      fecha_nacimiento,
      estado_vital, estado_identificacion
    )
    VALUES (
      v_cria_id, v_especie, 'interno',
      p_animal_id, p_padre_id, p_raza_cria_id,
      v_tipo_productivo_id, v_evento_id, v_evento_id,
      p_fecha,
      'vivo', 'pendiente'
    );

    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_evento_id, v_cria_id, 'cria');

    v_crias_ids := array_append(v_crias_ids, v_cria_id);
  END LOOP;

  -- 5. Una entidad Animal por cada cría nacida muerta
  --    Se registran para estadísticas de productividad — sin workflow de identificación
  FOR v_cria_id IN
    SELECT gen_random_uuid() FROM generate_series(1, p_numero_muertos)
  LOOP
    INSERT INTO animal (
      id, especie, origen,
      madre_id, padre_id, raza_id,
      tipo_productivo_id, parto_evento_id, evento_creacion_id,
      fecha_nacimiento,
      estado_vital
    )
    VALUES (
      v_cria_id, v_especie, 'interno',
      p_animal_id, p_padre_id, p_raza_cria_id,
      v_tipo_productivo_id, v_evento_id, v_evento_id,
      p_fecha,
      'muerto'
    );

    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_evento_id, v_cria_id, 'cria');
  END LOOP;

  -- 6. Actualizar snapshot de la madre: DESPUÉS del evento, nunca antes
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
