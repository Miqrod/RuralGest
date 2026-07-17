-- =============================================================================
-- registrar_confirmacion_gestacion
--
-- Registra la confirmación de gestación de una hembra reproductora.
-- A diferencia de registrar_cubricion:
--   - p_ciclo_id es OBLIGATORIO: la confirmación siempre pertenece a un ciclo
--     abierto existente, nunca crea uno nuevo.
--   - NO modifica fecha_prevista_parto: la fecha prevista se calcula desde la
--     cubrición y no cambia al confirmarse la gestación.
--   - Transición de estado: cubierta → gestante
--
-- Devuelve el UUID del evento creado.
-- =============================================================================
CREATE OR REPLACE FUNCTION registrar_confirmacion_gestacion(
  p_animal_id     UUID,
  p_fecha         DATE,
  p_ciclo_id      UUID,
  p_observaciones TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tipo_evento_id UUID;
  v_evento_id      UUID;
  v_especie        especie_enum;
  v_estado_vital   estado_vital_enum;
  v_crotal         TEXT;
BEGIN
  -- Validación anti-concurrencia: bloquear la fila antes de cualquier escritura
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

  IF p_ciclo_id IS NULL THEN
    RAISE EXCEPTION 'registrar_confirmacion_gestacion requiere p_ciclo_id: la confirmación siempre pertenece a un ciclo abierto';
  END IF;

  v_tipo_evento_id := _resolve_tipo_evento_id('CONFIRMACION_GESTACION');

  -- 1. Evento: fuente de verdad del sistema
  INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
  VALUES (
    v_tipo_evento_id,
    v_especie,
    p_fecha,
    p_ciclo_id,
    CASE
      WHEN p_observaciones IS NOT NULL
      THEN jsonb_build_object('observaciones', p_observaciones)
      ELSE NULL
    END
  )
  RETURNING id INTO v_evento_id;

  -- 2. Asociación N:M evento ↔ animal
  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_animal_id, 'madre');

  -- 3. Actualizar snapshot: solo estado_reproductivo.
  --    fecha_prevista_parto NO se toca: fue calculada en la cubrición y no cambia.
  UPDATE animal
  SET estado_reproductivo = 'gestante'
  WHERE id = p_animal_id;

  RETURN v_evento_id;
END;
$$;
