-- =============================================================================
-- Fix: registrar_aborto — ORDER BY en la query de ciclo abierto
--
-- Problema: cuando hay más de un ciclo con fecha_fin IS NULL (p.ej. lactante N
-- + nuevo vacía N+1 tras un parto), el SELECT INTO fallaba con "query returned
-- more than one row".
--
-- Causa raíz: por diseño, tras un PARTO con crías vivas lactantes coexisten
-- dos ciclos abiertos: el ciclo del lactante (sin fecha_fin hasta el último
-- destete) y el nuevo ciclo N+1 (vacía). El RPC original no contemplaba esto.
--
-- Fix: añadir ORDER BY numero_ciclo DESC LIMIT 1 para seleccionar siempre el
-- ciclo más reciente, que es el que recibirá el evento ABORTO.
--
-- Ref: PRD011 §Conflicto 2, PRD-correctivo
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
  -- Tras PRD-correctivo, si un animal está en {cubierta, gestante} se garantiza
  -- implícitamente que es_reproductora = true:
  --   · gestante → el cambio de tipo está BLOQUEADO (no puede volverse no-reproductora)
  --   · cubierta/vacía → cambiar_tipo_productivo cierra el ciclo y pone estado_reproductivo = NULL
  -- Por eso esta validación solo necesita comprobar el estado reproductivo.
  -- (Datos históricos anteriores a PRD-correctivo podrían no cumplir este invariante;
  --  el ELSE del paso 9 los trata como red de seguridad.)
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
  -- ORDER BY numero_ciclo DESC LIMIT 1: selecciona el ciclo más reciente cuando
  -- coexisten varios abiertos (p.ej. lactante + nuevo vacía tras parto).
  SELECT id INTO v_ciclo_id
  FROM ciclo_reproductivo
  WHERE animal_id = p_animal_id AND fecha_fin IS NULL
  ORDER BY numero_ciclo DESC
  LIMIT 1
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
    -- Madre sigue siendo reproductora → nuevo ciclo en 'vacia' desde la fecha del aborto
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
    -- Rama defensiva para datos históricos (previos a PRD-correctivo) o
    -- inconsistencias introducidas fuera del API.
    -- En operación normal es_reproductora = true siempre al llegar aquí.
    UPDATE animal
    SET estado_reproductivo  = NULL,
        fecha_prevista_parto = NULL
    WHERE id = p_animal_id;
  END IF;

  RETURN jsonb_build_object(
    'eventoId',         v_evento_id,
    'cicloCerrado',     true,
    'nuevoCicloCreado', v_nuevo_ciclo_id IS NOT NULL
  );
END;
$$;
