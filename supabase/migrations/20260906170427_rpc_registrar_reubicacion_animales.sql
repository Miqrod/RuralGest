-- =============================================================================
-- PRD014 — Instalaciones y Reubicación de Animales
-- Tarea 247: RPC registrar_reubicacion_animales
--
-- Único mecanismo de backend para reubicar animales, independientemente del
-- punto de entrada UI (ficha animal, Reubicaciones, detalle instalación, dashboard).
-- Operación atómica: N animales + 1 destino + 1 fecha.
-- Locks en orden determinista por animal.id para evitar deadlocks.
-- =============================================================================

CREATE OR REPLACE FUNCTION registrar_reubicacion_animales(
  p_animal_ids            UUID[],
  p_ubicacion_destino_id  UUID,
  p_fecha                 DATE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_destino          RECORD;
  v_animal           RECORD;
  v_tipo_evento_id   UUID;
  v_ultimo_fecha     DATE;
  v_evento_id        UUID;
  v_procesados       INT := 0;
BEGIN
  -- 1. Lista no vacía
  IF array_length(p_animal_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'La lista de animales no puede estar vacía';
  END IF;

  -- 1b. Sin IDs duplicados (= ANY deduplica en el loop y daría falso "no encontrado")
  IF array_length(p_animal_ids, 1) !=
     (SELECT COUNT(DISTINCT x) FROM unnest(p_animal_ids) x) THEN
    RAISE EXCEPTION 'La lista contiene IDs de animales duplicados';
  END IF;

  -- 2. Destino: existe, activo y admite animales
  SELECT activo, admite_animales
  INTO   v_destino
  FROM   instalacion
  WHERE  id = p_ubicacion_destino_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Instalación destino no encontrada: %', p_ubicacion_destino_id;
  END IF;

  IF NOT v_destino.activo THEN
    RAISE EXCEPTION 'La instalación destino está inactiva';
  END IF;

  IF NOT v_destino.admite_animales THEN
    RAISE EXCEPTION 'La instalación destino no admite animales';
  END IF;

  -- 3. Fecha no futura
  IF p_fecha > CURRENT_DATE THEN
    RAISE EXCEPTION 'La fecha de reubicación no puede ser futura: %', p_fecha;
  END IF;

  v_tipo_evento_id := _resolve_tipo_evento_id('CAMBIO_UBICACION');

  -- 4. Bloquear y procesar en orden determinista (evita deadlocks en operaciones concurrentes)
  FOR v_animal IN
    SELECT a.id, a.estado_vital, a.especie, a.ubicacion_actual_id
    FROM   animal a
    WHERE  a.id = ANY(p_animal_ids)
    ORDER  BY a.id
    FOR UPDATE
  LOOP
    v_procesados := v_procesados + 1;

    -- Animal vivo
    IF v_animal.estado_vital != 'vivo' THEN
      RAISE EXCEPTION 'El animal % no está vivo (estado: %)', v_animal.id, v_animal.estado_vital;
    END IF;

    -- Destino distinto del origen (NULL → UUID es siempre válido; UUID = UUID no)
    IF v_animal.ubicacion_actual_id IS NOT NULL
       AND v_animal.ubicacion_actual_id = p_ubicacion_destino_id THEN
      RAISE EXCEPTION 'El animal % ya se encuentra en la instalación destino', v_animal.id;
    END IF;

    -- Fecha ≥ último CAMBIO_UBICACION del animal (ORDER BY fecha DESC, created_at DESC)
    SELECT e.fecha INTO v_ultimo_fecha
    FROM   eventos e
    JOIN   evento_animales ea ON ea.evento_id = e.id
    JOIN   tipo_evento te     ON te.id = e.tipo_evento_id
    WHERE  ea.animal_id = v_animal.id
      AND  te.codigo    = 'CAMBIO_UBICACION'
    ORDER  BY e.fecha DESC, e.created_at DESC
    LIMIT  1;

    IF FOUND AND p_fecha < v_ultimo_fecha THEN
      RAISE EXCEPTION
        'La fecha % es anterior al último cambio de ubicación del animal % (%)',
        p_fecha, v_animal.id, v_ultimo_fecha;
    END IF;

    -- Evento CAMBIO_UBICACION individual por animal
    INSERT INTO eventos (tipo_evento_id, especie, fecha, ubicacion_origen_id, ubicacion_destino_id)
    VALUES (v_tipo_evento_id, v_animal.especie, p_fecha,
            v_animal.ubicacion_actual_id, p_ubicacion_destino_id)
    RETURNING id INTO v_evento_id;

    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_evento_id, v_animal.id, 'self');

    -- Actualizar proyección
    UPDATE animal
    SET    ubicacion_actual_id = p_ubicacion_destino_id
    WHERE  id = v_animal.id;

  END LOOP;

  -- Detectar IDs inexistentes (no aparecen en el loop → v_procesados < longitud array)
  IF v_procesados != array_length(p_animal_ids, 1) THEN
    RAISE EXCEPTION 'Uno o más animales de la lista no existen';
  END IF;

  RETURN jsonb_build_object(
    'ok',                   true,
    'procesados',           v_procesados,
    'ubicacion_destino_id', p_ubicacion_destino_id,
    'fecha',                p_fecha
  );
END;
$$;
