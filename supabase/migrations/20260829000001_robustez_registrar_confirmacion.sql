-- =============================================================================
-- registrar_confirmacion_gestacion: añadir revalidación transaccional (OBJ-06 PRD012)
--
-- La versión anterior tenía FOR UPDATE y validación de estado_vital.
-- Le faltaba:
--   · Revalidar estado_reproductivo dentro de la transacción (anti-TOCTOU)
--   · Validar que p_ciclo_id pertenece al animal y está abierto
--   · Rechazar fechas futuras
--   · Garantizar coherencia temporal: fecha >= último evento del mismo ciclo
--
-- Estados válidos: 'cubierta' (caso habitual) y 'vacia' (confirmación directa
-- sin cubrición previa, PRD008). La tarea describe solo CUBIERTA pero el dominio
-- —TRANSICIONES en rules.ts— ya incluye VACIA como origen válido.
--
-- Firma sin cambios: compatible hacia atrás.
-- =============================================================================
CREATE OR REPLACE FUNCTION registrar_confirmacion_gestacion(
  p_animal_id            UUID,
  p_fecha                DATE,
  p_ciclo_id             UUID,
  p_fecha_prevista_parto DATE    DEFAULT NULL,
  p_observaciones        TEXT    DEFAULT NULL,
  p_padre_id             UUID    DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_animal          RECORD;
  v_tipo_evento_id  UUID;
  v_evento_id       UUID;
  v_ciclo_animal_id UUID;
  v_metadata        JSONB;
BEGIN
  -- ── 1. Cargar y bloquear el animal ────────────────────────────────────────
  SELECT id, estado_vital, especie, crotal, estado_reproductivo
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
  -- Cubierta: caso habitual (cubrición previa registrada).
  -- Vacia: confirmación directa sin cubrición previa (PRD008).
  -- Gestante: ya confirmada — rechazar para evitar doble confirmación.
  IF v_animal.estado_reproductivo IS NULL OR
     v_animal.estado_reproductivo NOT IN ('cubierta', 'vacia') THEN
    RAISE EXCEPTION 'Estado reproductivo inválido para confirmación de gestación: %. Solo se permite desde cubierta o vacia.',
      COALESCE(v_animal.estado_reproductivo::text, 'NULL');
  END IF;

  -- ── 4. Validar fecha ──────────────────────────────────────────────────────
  IF p_fecha > CURRENT_DATE THEN
    RAISE EXCEPTION 'La fecha de la confirmación no puede ser futura: %', p_fecha;
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
  -- La confirmación no puede ser anterior a ningún evento ya registrado en el ciclo.
  IF EXISTS (
    SELECT 1
    FROM eventos
    WHERE ciclo_id = p_ciclo_id
      AND fecha > p_fecha
  ) THEN
    RAISE EXCEPTION 'La fecha de la confirmación (%) es anterior al último evento del ciclo', p_fecha;
  END IF;

  -- ── 7. Construir metadata_json ────────────────────────────────────────────
  -- Eliminar claves con valor null para mantener el JSON limpio.
  v_metadata := jsonb_build_object(
    'observaciones', p_observaciones,
    'padre_id',      p_padre_id
  );
  v_metadata := v_metadata - ARRAY(
    SELECT key FROM jsonb_each(v_metadata) WHERE value = 'null'::jsonb
  );
  IF v_metadata = '{}'::jsonb THEN v_metadata := NULL; END IF;

  -- ── 8. Crear evento CONFIRMACION_GESTACION ────────────────────────────────
  v_tipo_evento_id := _resolve_tipo_evento_id('CONFIRMACION_GESTACION');

  INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
  VALUES (v_tipo_evento_id, v_animal.especie, p_fecha, p_ciclo_id, v_metadata)
  RETURNING id INTO v_evento_id;

  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_animal_id, 'madre');

  -- ── 9. Proyectar estado del animal ────────────────────────────────────────
  -- estado_reproductivo → siempre 'gestante'.
  -- fecha_prevista_parto: se actualiza solo si viene informada; si no, conserva la anterior
  -- (calculada por una cubrición previa).
  UPDATE animal
  SET estado_reproductivo  = 'gestante',
      fecha_prevista_parto = COALESCE(p_fecha_prevista_parto, fecha_prevista_parto)
  WHERE id = p_animal_id;

  RETURN v_evento_id;
END;
$$;
