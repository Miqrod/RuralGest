-- =============================================================================
-- PRD014 — Instalaciones y Reubicación de Animales
-- Tarea 248: extender registrar_parto con CAMBIO_UBICACION inicial de crías vivas
--
-- Por cada cría viva:
--   1. Hereda la ubicación actual de la madre (puede ser NULL)
--   2. Se genera un CAMBIO_UBICACION NULL → ubicacion_madre (o NULL → NULL)
--   3. Se actualiza animal.ubicacion_actual_id
-- Las crías nacidas muertas NO reciben CAMBIO_UBICACION.
-- Firma sin cambios: compatible hacia atrás.
-- =============================================================================
CREATE OR REPLACE FUNCTION registrar_parto(
  p_animal_id      UUID,
  p_fecha          DATE,
  p_ciclo_id       UUID,
  p_numero_nacidos INT,
  p_numero_vivos   INT,
  p_numero_muertos INT,
  p_tipo_parto     tipo_parto_enum,
  p_padre_id       UUID    DEFAULT NULL,
  p_raza_cria_id   UUID    DEFAULT NULL,
  p_observaciones  TEXT    DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_animal               RECORD;
  v_ciclo_animal_id      UUID;
  v_tipo_evento_id       UUID;
  v_tipo_cambio_ubic_id  UUID;
  v_evento_id            UUID;
  v_cambio_ubic_id       UUID;
  v_tp_id_cria           UUID;
  v_cria_id              UUID;
  v_crias_ids            UUID[] := '{}';
  v_nuevo_ciclo_num      INT;
BEGIN
  -- ── 1. Cargar y bloquear el animal ────────────────────────────────────────
  SELECT id, estado_vital, especie, crotal, es_reproductora, estado_reproductivo,
         ubicacion_actual_id
  INTO v_animal
  FROM animal
  WHERE id = p_animal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Animal no encontrado: %', p_animal_id;
  END IF;

  -- ── 2. Validar estado vital ───────────────────────────────────────────────
  IF v_animal.estado_vital != 'vivo' THEN
    RAISE EXCEPTION 'El animal% no puede recibir eventos: estado_vital es "%"',
      CASE WHEN v_animal.crotal IS NOT NULL THEN ' (crotal: ' || v_animal.crotal || ')' ELSE '' END,
      v_animal.estado_vital;
  END IF;

  -- ── 3. Revalidar estado reproductivo ─────────────────────────────────────
  IF v_animal.estado_reproductivo IS NULL OR
     v_animal.estado_reproductivo NOT IN ('cubierta', 'gestante') THEN
    RAISE EXCEPTION 'Estado reproductivo inválido para parto: %. Solo se permite desde cubierta o gestante.',
      COALESCE(v_animal.estado_reproductivo::text, 'NULL');
  END IF;

  -- ── 4. Validar fecha ──────────────────────────────────────────────────────
  IF p_fecha > CURRENT_DATE THEN
    RAISE EXCEPTION 'La fecha del parto no puede ser futura: %', p_fecha;
  END IF;

  -- ── 5. Validar que el ciclo pertenece al animal y está abierto ────────────
  SELECT animal_id INTO v_ciclo_animal_id
  FROM ciclo_reproductivo
  WHERE id = p_ciclo_id
    AND fecha_fin IS NULL
  FOR UPDATE;

  IF v_ciclo_animal_id IS NULL THEN
    RAISE EXCEPTION 'El ciclo % no existe o no está abierto', p_ciclo_id;
  END IF;

  IF v_ciclo_animal_id != p_animal_id THEN
    RAISE EXCEPTION 'El ciclo % no pertenece al animal %', p_ciclo_id, p_animal_id;
  END IF;

  -- ── 6. Validar coherencia temporal ────────────────────────────────────────
  IF EXISTS (
    SELECT 1
    FROM eventos
    WHERE ciclo_id = p_ciclo_id
      AND fecha > p_fecha
  ) THEN
    RAISE EXCEPTION 'La fecha del parto (%) es anterior al último evento del ciclo', p_fecha;
  END IF;

  -- ── 7. Tipo productivo inicial para crías vivas ───────────────────────────
  SELECT id INTO v_tp_id_cria
  FROM tipo_productivo
  WHERE nombre = 'Cría' AND especie = v_animal.especie
  LIMIT 1;

  v_tipo_evento_id      := _resolve_tipo_evento_id('PARTO');
  v_tipo_cambio_ubic_id := _resolve_tipo_evento_id('CAMBIO_UBICACION');

  -- ── 8. Crear evento PARTO ─────────────────────────────────────────────────
  INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
  VALUES (
    v_tipo_evento_id, v_animal.especie, p_fecha, p_ciclo_id,
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

  -- ── 9. Crear crías vivas ──────────────────────────────────────────────────
  FOR v_cria_id IN
    SELECT gen_random_uuid() FROM generate_series(1, p_numero_vivos)
  LOOP
    INSERT INTO animal (
      id, especie, origen,
      madre_id, padre_id, raza_id,
      tipo_productivo_id, parto_evento_id, evento_creacion_id,
      fecha_nacimiento,
      estado_vital, estado_identificacion, estado_vinculo_materno
    )
    VALUES (
      v_cria_id, v_animal.especie, 'interno',
      p_animal_id, p_padre_id, p_raza_cria_id,
      v_tp_id_cria, v_evento_id, v_evento_id,
      p_fecha,
      'vivo', 'pendiente', 'activo'
    );

    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_evento_id, v_cria_id, 'cria');

    -- CAMBIO_UBICACION inicial: NULL → ubicacion_madre (o NULL → NULL)
    -- Se genera siempre, incluso cuando la madre no tiene ubicación asignada.
    INSERT INTO eventos (
      tipo_evento_id, especie, fecha,
      ubicacion_origen_id, ubicacion_destino_id,
      metadata_json
    )
    VALUES (
      v_tipo_cambio_ubic_id, v_animal.especie, p_fecha,
      NULL,                        -- origen siempre NULL: la cría acaba de nacer
      v_animal.ubicacion_actual_id, -- destino = ubicación de la madre (puede ser NULL)
      '{"contexto": "parto"}'
    )
    RETURNING id INTO v_cambio_ubic_id;

    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_cambio_ubic_id, v_cria_id, 'self');

    UPDATE animal
    SET ubicacion_actual_id = v_animal.ubicacion_actual_id
    WHERE id = v_cria_id;

    v_crias_ids := array_append(v_crias_ids, v_cria_id);
  END LOOP;

  -- ── 10. Crear crías nacidas muertas ───────────────────────────────────────
  -- Sin CAMBIO_UBICACION: las crías muertas no adquieren ubicación operativa.
  FOR v_cria_id IN
    SELECT gen_random_uuid() FROM generate_series(1, p_numero_muertos)
  LOOP
    INSERT INTO animal (
      id, especie, origen,
      madre_id, padre_id, raza_id,
      tipo_productivo_id, parto_evento_id, evento_creacion_id,
      fecha_nacimiento,
      estado_vital, estado_vinculo_materno
    )
    VALUES (
      v_cria_id, v_animal.especie, 'interno',
      p_animal_id, p_padre_id, p_raza_cria_id,
      NULL, v_evento_id, v_evento_id,
      p_fecha,
      'muerto', 'finalizado'
    );

    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_evento_id, v_cria_id, 'cria');
  END LOOP;

  -- ── 11. Fijar resultado del ciclo: 'parto' ────────────────────────────────
  UPDATE ciclo_reproductivo
  SET resultado = 'parto'
  WHERE id = p_ciclo_id;

  -- ── 12. Consecuencias sobre la madre ─────────────────────────────────────
  IF v_animal.es_reproductora THEN
    SELECT COALESCE(MAX(numero_ciclo), 0) + 1
    INTO v_nuevo_ciclo_num
    FROM ciclo_reproductivo
    WHERE animal_id = p_animal_id;

    INSERT INTO ciclo_reproductivo (animal_id, numero_ciclo, fecha_inicio)
    VALUES (p_animal_id, v_nuevo_ciclo_num, p_fecha);

    UPDATE animal
    SET estado_reproductivo  = 'vacia',
        fecha_prevista_parto = NULL
    WHERE id = p_animal_id;
  ELSE
    UPDATE animal
    SET estado_reproductivo  = NULL,
        fecha_prevista_parto = NULL
    WHERE id = p_animal_id;
  END IF;

  RETURN jsonb_build_object(
    'eventoId', v_evento_id,
    'criasIds',  v_crias_ids
  );
END;
$$;
