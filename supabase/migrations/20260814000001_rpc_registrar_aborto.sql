-- =============================================================================
-- registrar_aborto: registro atómico de una pérdida de gestación
--
-- Operaciones en una sola transacción:
--   1. Valida estado reproductivo (cubierta o gestante)
--   2. Valida coherencia temporal (fecha >= último evento compatible del ciclo)
--   3. Crea el evento ABORTO ligado al ciclo activo
--   4. Asocia la madre al evento (rol: 'madre')
--   5. Cierra el ciclo actual (resultado = 'aborto')
--   6a. Si es_reproductora = true → abre nuevo ciclo en 'vacia' (misma fecha)
--   6b. Si es_reproductora = false → estado_reproductivo = NULL, sin nuevo ciclo
--
-- Ref: PRD011 §3, §7, §8, §24
-- =============================================================================
CREATE OR REPLACE FUNCTION registrar_aborto(
  p_animal_id     UUID,
  p_fecha         DATE,
  p_observaciones TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_animal           RECORD;
  v_ciclo_id         UUID;
  v_tipo_evento_id   UUID;
  v_evento_id        UUID;
  v_nuevo_ciclo_num  INT;
  v_nuevo_ciclo_id   UUID := NULL;
BEGIN
  -- ── 1. Cargar y bloquear el animal ────────────────────────────────────────
  SELECT id, especie, estado_reproductivo, es_reproductora
  INTO v_animal
  FROM animal
  WHERE id = p_animal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Animal no encontrado: %', p_animal_id;
  END IF;

  -- ── 2. Validar estado reproductivo ────────────────────────────────────────
  -- No se comprueba es_reproductora: PRD011 §9 establece que un animal puede
  -- recibir el Aborto aunque ya no sea reproductora, siempre que tenga ciclo
  -- abierto en estado cubierta/gestante (Regla transversal 1).
  IF v_animal.estado_reproductivo IS NULL OR
     v_animal.estado_reproductivo NOT IN ('cubierta', 'gestante') THEN
    RAISE EXCEPTION 'Estado reproductivo inválido para aborto: %',
      COALESCE(v_animal.estado_reproductivo::text, 'NULL');
  END IF;

  -- ── 3. Validar fecha ──────────────────────────────────────────────────────
  IF p_fecha > CURRENT_DATE THEN
    RAISE EXCEPTION 'La fecha del aborto no puede ser futura: %', p_fecha;
  END IF;

  -- ── 4. Obtener y bloquear ciclo abierto ───────────────────────────────────
  SELECT id INTO v_ciclo_id
  FROM ciclo_reproductivo
  WHERE animal_id = p_animal_id AND fecha_fin IS NULL
  FOR UPDATE;

  IF v_ciclo_id IS NULL THEN
    RAISE EXCEPTION 'No existe ciclo reproductivo abierto para el animal: %', p_animal_id;
  END IF;

  -- ── 5. Validar coherencia temporal ────────────────────────────────────────
  -- La fecha del aborto no puede ser anterior al último evento reproductivo
  -- compatible del ciclo (CUBRICION o CONFIRMACION_GESTACION).
  IF EXISTS (
    SELECT 1
    FROM eventos e
    JOIN tipo_evento te ON te.id = e.tipo_evento_id
    WHERE e.ciclo_id = v_ciclo_id
      AND te.codigo IN ('CUBRICION', 'CONFIRMACION_GESTACION')
      AND e.fecha > p_fecha
  ) THEN
    RAISE EXCEPTION 'La fecha del aborto (%) es anterior al último evento reproductivo del ciclo', p_fecha;
  END IF;

  -- ── 6. Crear evento ABORTO ────────────────────────────────────────────────
  v_tipo_evento_id := _resolve_tipo_evento_id('ABORTO');

  INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
  VALUES (
    v_tipo_evento_id,
    v_animal.especie,
    p_fecha,
    v_ciclo_id,
    CASE WHEN p_observaciones IS NOT NULL
      THEN jsonb_build_object('observaciones', p_observaciones)
      ELSE NULL
    END
  )
  RETURNING id INTO v_evento_id;

  -- ── 7. Asociar madre al evento ────────────────────────────────────────────
  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_animal_id, 'madre');

  -- ── 8. Cerrar ciclo actual ────────────────────────────────────────────────
  UPDATE ciclo_reproductivo
  SET fecha_fin  = p_fecha,
      resultado  = 'aborto'
  WHERE id = v_ciclo_id;

  -- ── 9. Consecuencias sobre la madre ──────────────────────────────────────
  IF v_animal.es_reproductora THEN
    -- Madre sigue siendo reproductora → nuevo ciclo en 'vacia' desde hoy mismo
    SELECT COALESCE(MAX(numero_ciclo), 0) + 1 INTO v_nuevo_ciclo_num
    FROM ciclo_reproductivo
    WHERE animal_id = p_animal_id;

    INSERT INTO ciclo_reproductivo (animal_id, numero_ciclo, fecha_inicio)
    VALUES (p_animal_id, v_nuevo_ciclo_num, p_fecha)
    RETURNING id INTO v_nuevo_ciclo_id;

    UPDATE animal
    SET estado_reproductivo = 'vacia',
        fecha_prevista_parto = NULL
    WHERE id = p_animal_id;
  ELSE
    -- Madre ya no es reproductora → sin ciclo activo, estado NULL
    UPDATE animal
    SET estado_reproductivo  = NULL,
        fecha_prevista_parto = NULL
    WHERE id = p_animal_id;
  END IF;

  RETURN jsonb_build_object(
    'eventoId',        v_evento_id,
    'cicloCerrado',    true,
    'nuevoCicloCreado', v_nuevo_ciclo_id IS NOT NULL
  );
END;
$$;
