-- =============================================================================
-- registrar_cubricion: añadir revalidación transaccional (OBJ-06 PRD012)
--
-- La versión anterior (PRD-correctivo) ya tenía FOR UPDATE y validación de
-- estado_vital. Le faltaba:
--   · Revalidar estado_reproductivo dentro de la transacción (anti-TOCTOU)
--   · Validar que p_ciclo_id pertenece al animal y está abierto
--   · Rechazar fechas futuras
--   · Garantizar coherencia temporal: fecha >= último evento del mismo ciclo
--
-- Firma sin cambios: los parámetros existentes son compatibles hacia atrás.
-- El Use Case sigue calculando p_estado_reproductivo y p_fecha_prevista_parto;
-- el RPC los acepta pero revalida el estado inicial antes de usarlos.
-- =============================================================================
CREATE OR REPLACE FUNCTION registrar_cubricion(
  p_animal_id            UUID,
  p_fecha                DATE,
  p_ciclo_id             UUID,
  p_estado_reproductivo  estado_reproductivo_enum DEFAULT 'cubierta',
  p_fecha_prevista_parto DATE    DEFAULT NULL,
  p_tipo_cubricion       TEXT    DEFAULT NULL,
  p_macho_id             UUID    DEFAULT NULL,
  p_observaciones        TEXT    DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_animal          RECORD;
  v_tipo_evento_id  UUID;
  v_evento_id       UUID;
  v_ciclo_animal_id UUID;
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
  -- La cubrición solo es válida desde vacía o cubierta (re-cubrición permitida).
  -- Este check protege contra el caso TOCTOU: el estado podría haber cambiado
  -- entre la lectura del Use Case y la ejecución del RPC.
  IF v_animal.estado_reproductivo IS NULL OR
     v_animal.estado_reproductivo NOT IN ('vacia', 'cubierta') THEN
    RAISE EXCEPTION 'Estado reproductivo inválido para cubrición: %. Solo se permite desde vacia o cubierta.',
      COALESCE(v_animal.estado_reproductivo::text, 'NULL');
  END IF;

  -- ── 4. Validar fecha ──────────────────────────────────────────────────────
  IF p_fecha > CURRENT_DATE THEN
    RAISE EXCEPTION 'La fecha de la cubrición no puede ser futura: %', p_fecha;
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
  -- La cubrición no puede ser anterior a ningún evento ya registrado en el ciclo.
  IF EXISTS (
    SELECT 1
    FROM eventos
    WHERE ciclo_id = p_ciclo_id
      AND fecha > p_fecha
  ) THEN
    RAISE EXCEPTION 'La fecha de la cubrición (%) es anterior al último evento del ciclo', p_fecha;
  END IF;

  -- ── 7. Crear evento CUBRICION ─────────────────────────────────────────────
  v_tipo_evento_id := _resolve_tipo_evento_id('CUBRICION');

  INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
  VALUES (
    v_tipo_evento_id,
    v_animal.especie,
    p_fecha,
    p_ciclo_id,
    jsonb_build_object(
      'tipo_cubricion', p_tipo_cubricion,
      'macho_id',       p_macho_id,
      'observaciones',  p_observaciones
    )
  )
  RETURNING id INTO v_evento_id;

  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_animal_id, 'madre');

  -- ── 8. Proyectar estado del animal ────────────────────────────────────────
  -- p_estado_reproductivo es siempre 'cubierta' desde el Use Case;
  -- se acepta como parámetro para mantener compatibilidad hacia atrás.
  UPDATE animal
  SET estado_reproductivo  = p_estado_reproductivo,
      fecha_prevista_parto = p_fecha_prevista_parto
  WHERE id = p_animal_id;

  RETURN v_evento_id;
END;
$$;
