-- =============================================================================
-- Inmutabilidad del resultado de ciclo reproductivo (PRD013 OBJ-05)
-- Afecta: registrar_parto, registrar_aborto, registrar_machorra
--
-- PROBLEMA IDENTIFICADO (auditoría PRD013 tarea 192):
--   Los RPCs que fijan `resultado` en ciclo_reproductivo no protegían contra
--   sobrescribir un resultado ya existente. Si por un bug o modificación futura
--   se llegara a llamar un RPC con un ciclo que ya tiene resultado fijado, el
--   UPDATE anterior silenciosamente sobreescribía el dato histórico.
--   Ejemplo concreto: registrar_aborto podría haber escrito resultado='aborto'
--   sobre un ciclo que ya tenía resultado='parto', corrompiendo el historial.
--
-- INVARIANTE DE DOMINIO:
--   El resultado de un ciclo reproductivo es un hecho histórico inmutable.
--   Solo puede pasar de NULL → valor; nunca de valor → otro valor.
--   Es el equivalente reproductivo de la inmutabilidad de transacciones (CLAUDE.md §7).
--
-- IMPLEMENTACIÓN ELEGIDA: guardias en RPC, no trigger.
--   Alternativa descartada: trigger BEFORE UPDATE en ciclo_reproductivo.
--   Razón del descarte: el proyecto concentra toda la lógica en RPCs SECURITY DEFINER
--   para mantener un único punto de verdad. Los triggers dispersan lógica entre la
--   capa de almacenamiento y la capa de aplicación, dificultando el razonamiento sobre
--   el sistema. Como todos los cambios a ciclo_reproductivo pasan por RPCs controlados,
--   aplicar la guardia en los propios RPCs es suficiente y coherente con la arquitectura.
--   Limitación aceptada: alguien con acceso SQL directo a la DB podría saltarse la guardia.
--   Este riesgo se acepta como riesgo de disciplina de equipo, no de arquitectura.
--
-- PATRÓN APLICADO en cada RPC:
--   1. SELECT del ciclo activo: añadir AND resultado IS NULL al filtro.
--      Garantiza que el ciclo elegido no tiene ya un desenlace fijado.
--   2. UPDATE que fija resultado: añadir AND resultado IS NULL al WHERE.
--      Segunda línea de defensa — falla si entre el SELECT y el UPDATE
--      otro proceso modificó el ciclo (en práctica imposible por FOR UPDATE,
--      pero hace la guardia explícita e independiente de la hipótesis de bloqueo).
--   3. IF NOT FOUND THEN RAISE EXCEPTION: fallo ruidoso en lugar de corrupción silenciosa.
--
-- Ref: PRD013 OBJ-05, CLAUDE.md §7 (inmutabilidad de hechos históricos)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. registrar_parto
--    Cambios respecto a 20260829000002_robustez_registrar_parto.sql:
--      · Step 5: añadir AND resultado IS NULL al SELECT de validación del ciclo.
--      · Step 11: añadir AND resultado IS NULL al UPDATE + IF NOT FOUND guard.
-- ─────────────────────────────────────────────────────────────────────────────
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
  v_animal          RECORD;
  v_ciclo_animal_id UUID;
  v_tipo_evento_id  UUID;
  v_evento_id       UUID;
  v_tp_id_cria      UUID;
  v_cria_id         UUID;
  v_crias_ids       UUID[] := '{}';
  v_nuevo_ciclo_num INT;
BEGIN
  -- ── 1. Cargar y bloquear el animal ────────────────────────────────────────
  SELECT id, estado_vital, especie, crotal, es_reproductora, estado_reproductivo
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

  -- ── 3. Revalidar estado reproductivo (TOCTOU) ────────────────────────────
  IF v_animal.estado_reproductivo IS NULL OR
     v_animal.estado_reproductivo NOT IN ('cubierta', 'gestante') THEN
    RAISE EXCEPTION 'Estado reproductivo inválido para parto: %. Solo se permite desde cubierta o gestante.',
      COALESCE(v_animal.estado_reproductivo::text, 'NULL');
  END IF;

  -- ── 4. Validar fecha ──────────────────────────────────────────────────────
  IF p_fecha > CURRENT_DATE THEN
    RAISE EXCEPTION 'La fecha del parto no puede ser futura: %', p_fecha;
  END IF;

  -- ── 5. Validar que el ciclo pertenece al animal y está activo ─────────────
  -- resultado IS NULL: el ciclo activo nunca tiene resultado fijado.
  -- Un ciclo con resultado='parto' y fecha_fin=NULL es el ciclo esperando destetes,
  -- no un ciclo válido para registrar un nuevo parto.
  SELECT animal_id INTO v_ciclo_animal_id
  FROM ciclo_reproductivo
  WHERE id         = p_ciclo_id
    AND fecha_fin  IS NULL
    AND resultado  IS NULL
  FOR UPDATE;

  IF v_ciclo_animal_id IS NULL THEN
    RAISE EXCEPTION 'El ciclo % no existe, no está abierto, o ya tiene resultado fijado', p_ciclo_id;
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

  v_tipo_evento_id := _resolve_tipo_evento_id('PARTO');

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

    v_crias_ids := array_append(v_crias_ids, v_cria_id);
  END LOOP;

  -- ── 10. Crear crías nacidas muertas ───────────────────────────────────────
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
  -- fecha_fin se deja NULL: el ciclo sigue abierto hasta el último destete.
  -- AND resultado IS NULL: guardia de inmutabilidad. El ciclo fue bloqueado FOR UPDATE
  -- en step 5, por lo que en práctica no puede haber cambiado. La guardia es una
  -- segunda línea de defensa que hace el invariante explícito e independiente del bloqueo.
  UPDATE ciclo_reproductivo
  SET resultado = 'parto'
  WHERE id        = p_ciclo_id
    AND resultado IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo fijar resultado en el ciclo %: ya tiene resultado fijado', p_ciclo_id;
  END IF;

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

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. registrar_aborto
--    Cambios respecto a 20260821101458_fix_registrar_aborto_ciclo_order.sql:
--      · Step 4: añadir AND resultado IS NULL al SELECT del ciclo abierto.
--      · Step 8: añadir AND resultado IS NULL al UPDATE + IF NOT FOUND guard.
-- ─────────────────────────────────────────────────────────────────────────────
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
  IF v_animal.estado_reproductivo IS NULL OR
     v_animal.estado_reproductivo NOT IN ('cubierta', 'gestante') THEN
    RAISE EXCEPTION 'Estado reproductivo inválido para aborto: %',
      COALESCE(v_animal.estado_reproductivo::text, 'NULL');
  END IF;

  -- ── 3. Validar fecha ──────────────────────────────────────────────────────
  IF p_fecha > CURRENT_DATE THEN
    RAISE EXCEPTION 'La fecha del aborto no puede ser futura: %', p_fecha;
  END IF;

  -- ── 4. Obtener y bloquear ciclo activo ───────────────────────────────────
  -- resultado IS NULL: el ciclo activo nunca tiene resultado fijado.
  --   Un ciclo con resultado='parto' y fecha_fin=NULL es el ciclo del parto anterior
  --   (abierto esperando destetes); no debe recibir un aborto.
  --   En práctica el ORDER BY numero_ciclo DESC siempre elegiría el ciclo correcto
  --   (N+1 es más reciente que N), pero el filtro resultado IS NULL hace el contrato
  --   explícito y añade una segunda línea de defensa ante futuros cambios.
  -- ORDER BY numero_ciclo DESC LIMIT 1: selecciona el más reciente si coexisten varios.
  SELECT id INTO v_ciclo_id
  FROM ciclo_reproductivo
  WHERE animal_id = p_animal_id
    AND fecha_fin  IS NULL
    AND resultado  IS NULL
  ORDER BY numero_ciclo DESC
  LIMIT 1
  FOR UPDATE;

  IF v_ciclo_id IS NULL THEN
    RAISE EXCEPTION 'No existe ciclo reproductivo activo para el animal: %', p_animal_id;
  END IF;

  -- ── 5. Validar coherencia temporal ────────────────────────────────────────
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
  -- AND resultado IS NULL: guardia de inmutabilidad. Fallo ruidoso si el ciclo
  -- ya tiene resultado — mejor una excepción explícita que una sobreescritura silenciosa.
  UPDATE ciclo_reproductivo
  SET fecha_fin = p_fecha,
      resultado = 'aborto'
  WHERE id       = v_ciclo_id
    AND resultado IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo cerrar el ciclo %: ya tiene resultado fijado', v_ciclo_id;
  END IF;

  -- ── 9. Consecuencias sobre la madre ──────────────────────────────────────
  IF v_animal.es_reproductora THEN
    SELECT COALESCE(MAX(numero_ciclo), 0) + 1 INTO v_nuevo_ciclo_num
    FROM ciclo_reproductivo
    WHERE animal_id = p_animal_id;

    INSERT INTO ciclo_reproductivo (animal_id, numero_ciclo, fecha_inicio)
    VALUES (p_animal_id, v_nuevo_ciclo_num, p_fecha)
    RETURNING id INTO v_nuevo_ciclo_id;

    UPDATE animal
    SET estado_reproductivo  = 'vacia',
        fecha_prevista_parto = NULL
    WHERE id = p_animal_id;
  ELSE
    -- Rama defensiva para datos históricos previos a PRD-correctivo.
    -- En operación normal, es_reproductora = true siempre al llegar aquí.
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

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. registrar_machorra
--    Cambios respecto a 20260828000000_rpc_registrar_machorra.sql:
--      · Step 4: añadir AND resultado IS NULL al SELECT del ciclo activo.
--      · Step 7: añadir AND resultado IS NULL al UPDATE + IF NOT FOUND guard.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION registrar_machorra(
  p_animal_id UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_animal          RECORD;
  v_fecha           DATE := CURRENT_DATE;
  v_ciclo_id        UUID;
  v_tipo_evento_id  UUID;
  v_evento_id       UUID;
  v_nuevo_ciclo_num INT;
  v_nuevo_ciclo_id  UUID;
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

  -- ── 2. Validar es_reproductora ────────────────────────────────────────────
  IF NOT v_animal.es_reproductora THEN
    RAISE EXCEPTION 'Machorra no permitida: el animal no es reproductora (id: %)', p_animal_id;
  END IF;

  -- ── 3. Validar estado reproductivo ────────────────────────────────────────
  IF v_animal.estado_reproductivo IS NULL OR
     v_animal.estado_reproductivo NOT IN ('vacia', 'cubierta') THEN
    RAISE EXCEPTION 'Estado reproductivo inválido para machorra: %. Solo se permite desde vacia o cubierta.',
      COALESCE(v_animal.estado_reproductivo::text, 'NULL');
  END IF;

  -- ── 4. Obtener y bloquear ciclo activo más reciente ──────────────────────
  -- resultado IS NULL: el ciclo activo nunca tiene resultado fijado.
  -- ORDER BY numero_ciclo DESC LIMIT 1: protege el caso de ciclos concurrentes.
  SELECT id INTO v_ciclo_id
  FROM ciclo_reproductivo
  WHERE animal_id = p_animal_id
    AND fecha_fin  IS NULL
    AND resultado  IS NULL
  ORDER BY numero_ciclo DESC
  LIMIT 1
  FOR UPDATE;

  IF v_ciclo_id IS NULL THEN
    RAISE EXCEPTION 'No existe ciclo reproductivo activo para el animal: %', p_animal_id;
  END IF;

  -- ── 5. Crear evento MACHORRA ──────────────────────────────────────────────
  v_tipo_evento_id := _resolve_tipo_evento_id('MACHORRA');

  INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id)
  VALUES (v_tipo_evento_id, v_animal.especie, v_fecha, v_ciclo_id)
  RETURNING id INTO v_evento_id;

  -- ── 6. Asociar la hembra al evento ────────────────────────────────────────
  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_animal_id, 'madre');

  -- ── 7. Cerrar ciclo actual ────────────────────────────────────────────────
  -- AND resultado IS NULL: guardia de inmutabilidad. Fallo ruidoso en lugar de
  -- sobreescritura silenciosa si el ciclo ya tiene resultado fijado.
  UPDATE ciclo_reproductivo
  SET fecha_fin = v_fecha,
      resultado = 'machorra'
  WHERE id       = v_ciclo_id
    AND resultado IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo cerrar el ciclo %: ya tiene resultado fijado', v_ciclo_id;
  END IF;

  -- ── 8. Abrir nuevo ciclo en vacía ─────────────────────────────────────────
  -- Siempre ocurre: es_reproductora = true está validado en el paso 2.
  SELECT COALESCE(MAX(numero_ciclo), 0) + 1 INTO v_nuevo_ciclo_num
  FROM ciclo_reproductivo
  WHERE animal_id = p_animal_id;

  INSERT INTO ciclo_reproductivo (animal_id, numero_ciclo, fecha_inicio)
  VALUES (p_animal_id, v_nuevo_ciclo_num, v_fecha)
  RETURNING id INTO v_nuevo_ciclo_id;

  -- ── 9. Proyectar estado del animal ────────────────────────────────────────
  UPDATE animal
  SET estado_reproductivo  = 'vacia',
      fecha_prevista_parto = NULL
  WHERE id = p_animal_id;

  RETURN jsonb_build_object(
    'eventoId',         v_evento_id,
    'cicloCerrado',     true,
    'nuevoCicloCreado', true
  );
END;
$$;
