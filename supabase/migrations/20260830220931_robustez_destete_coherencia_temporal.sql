-- =============================================================================
-- registrar_destete: añadir validación de coherencia temporal (PRD013 OBJ-05)
--
-- Brecha identificada en auditoría PRD013:
--   La validación anterior solo rechazaba fechas futuras (p_fecha > CURRENT_DATE).
--   No impedía un destete con fecha anterior al nacimiento de la cría, lo que
--   produciría datos incoherentes en el historial.
--
-- Fix:
--   Incluir fecha_nacimiento en la carga de la cría y validar que
--   p_fecha >= v_cria.fecha_nacimiento antes de cualquier escritura.
--
-- Sin cambios en firma, contrato ni semántica del resto del RPC.
-- =============================================================================
CREATE OR REPLACE FUNCTION registrar_destete(
  p_cria_id       UUID,
  p_fecha         DATE,
  p_observaciones TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cria                 RECORD;
  v_tp_nombre            TEXT;
  v_tipo_evento_id       UUID;
  v_evento_id            UUID;
  v_tipo_productivo_id   UUID;
  v_ciclo_id             UUID;
  v_active_bonds         INT;
  v_ciclo_cerrado        BOOLEAN := false;
BEGIN
  -- ── 1. Cargar y bloquear la cría ──────────────────────────────────────────
  -- FOR UPDATE solo sobre animal: no aplica al lado nullable de un outer join
  SELECT
    a.id,
    a.especie,
    a.estado_vital,
    a.estado_vinculo_materno,
    a.madre_id,
    a.parto_evento_id,
    a.tipo_productivo_id,
    a.fecha_nacimiento
  INTO v_cria
  FROM animal a
  WHERE a.id = p_cria_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cría no encontrada: %', p_cria_id;
  END IF;

  -- Resolver nombre del tipo productivo en consulta separada
  SELECT nombre INTO v_tp_nombre
  FROM tipo_productivo
  WHERE id = v_cria.tipo_productivo_id;

  -- ── 2. Validaciones ───────────────────────────────────────────────────────

  IF v_tp_nombre IS DISTINCT FROM 'Cría' THEN
    RAISE EXCEPTION 'El animal no está en etapa "Cría" (tipo actual: %)',
      COALESCE(v_tp_nombre, 'sin tipo');
  END IF;

  IF v_cria.estado_vital != 'vivo' THEN
    RAISE EXCEPTION 'La cría no está viva (estado: %)', v_cria.estado_vital;
  END IF;

  IF v_cria.estado_vinculo_materno IS DISTINCT FROM 'activo' THEN
    RAISE EXCEPTION 'El vínculo materno no está activo (estado: %)',
      COALESCE(v_cria.estado_vinculo_materno::text, 'NULL');
  END IF;

  IF p_fecha > CURRENT_DATE THEN
    RAISE EXCEPTION 'La fecha del destete no puede ser futura (fecha: %)', p_fecha;
  END IF;

  -- Coherencia temporal: el destete no puede ser anterior al nacimiento de la cría.
  -- Aplica solo cuando fecha_nacimiento está presente (todos los animales 'interno').
  IF v_cria.fecha_nacimiento IS NOT NULL AND p_fecha < v_cria.fecha_nacimiento THEN
    RAISE EXCEPTION 'La fecha del destete (%) no puede ser anterior a la fecha de nacimiento de la cría (%)',
      p_fecha, v_cria.fecha_nacimiento;
  END IF;

  -- ── 3. Actualizar la cría ─────────────────────────────────────────────────
  SELECT id INTO v_tipo_productivo_id
  FROM tipo_productivo
  WHERE nombre = 'Recría' AND especie = v_cria.especie
  LIMIT 1;

  UPDATE animal
  SET tipo_productivo_id     = v_tipo_productivo_id,
      estado_vinculo_materno = 'finalizado'
  WHERE id = p_cria_id;

  -- ── 4. Obtener ciclo de la cría vía parto_evento_id ──────────────────────
  IF v_cria.parto_evento_id IS NOT NULL THEN
    SELECT ciclo_id INTO v_ciclo_id
    FROM eventos
    WHERE id = v_cria.parto_evento_id;
  END IF;

  -- ── 5. Crear evento DESTETE ───────────────────────────────────────────────
  v_tipo_evento_id := _resolve_tipo_evento_id('DESTETE');

  INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
  VALUES (
    v_tipo_evento_id,
    v_cria.especie,
    p_fecha,
    v_ciclo_id,
    CASE WHEN p_observaciones IS NOT NULL
      THEN jsonb_build_object('observaciones', p_observaciones)
      ELSE NULL
    END
  )
  RETURNING id INTO v_evento_id;

  -- ── 6. Asociar animales al evento ─────────────────────────────────────────
  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_cria_id, 'cria');

  IF v_cria.madre_id IS NOT NULL THEN
    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_evento_id, v_cria.madre_id, 'madre');
  END IF;

  -- ── 7. Evaluar cierre de ciclo ────────────────────────────────────────────
  -- Cuenta vínculos activos restantes después de actualizar esta cría.
  -- Guardia resultado IS NOT NULL: solo cerrar ciclos que ya tienen desenlace
  -- reproductivo fijado por registrar_parto. Evita cerrar accidentalmente ciclos
  -- que aún están en proceso (resultado IS NULL).
  IF v_ciclo_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_active_bonds
    FROM animal
    WHERE parto_evento_id IN (SELECT id FROM eventos WHERE ciclo_id = v_ciclo_id)
      AND estado_vinculo_materno = 'activo'
      AND estado_vital = 'vivo';

    IF v_active_bonds = 0 THEN
      UPDATE ciclo_reproductivo
      SET fecha_fin = p_fecha
      WHERE id = v_ciclo_id
        AND fecha_fin IS NULL
        AND resultado IS NOT NULL;

      v_ciclo_cerrado := true;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'eventoId',     v_evento_id,
    'cicloCerrado', v_ciclo_cerrado
  );
END;
$$;
