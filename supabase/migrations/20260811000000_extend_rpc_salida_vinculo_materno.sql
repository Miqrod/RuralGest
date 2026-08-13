-- =============================================================================
-- Extiende registrar_salida_animal para finalizar el vínculo materno cuando
-- una cría muere o es vendida con estado_vinculo_materno = 'activo'.
--
-- Lógica añadida (paso 4, tras actualizar estado_vital de la cría):
--   1. Si la cría tenía vínculo activo → estado_vinculo_materno = 'finalizado'
--   2. Resolver ciclo de la madre via parto_evento_id → eventos.ciclo_id
--   3. Contar crías activas restantes en ese ciclo
--   4. Si quedan 0 → cerrar ciclo + madre pasa a estado_reproductivo = 'vacia'
--
-- IMPORTANTE: no se crea evento DESTETE. El vínculo se finaliza como
--             consecuencia de la pérdida, no como acto explícito de destete.
-- =============================================================================
CREATE OR REPLACE FUNCTION registrar_salida_animal(
  p_animal_id UUID,
  p_motivo    TEXT,   -- 'venta' | 'muerte'
  p_fecha     DATE
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_estado_actual    estado_vital_enum;
  v_especie          especie_enum;
  v_crotal           TEXT;
  v_madre_id         UUID;
  v_parto_evento_id  UUID;
  v_vinculo          vinculo_materno_enum;
  v_tipo_evento_id   UUID;
  v_motivo_id        UUID;
  v_evento_id        UUID;
  v_nuevo_estado     estado_vital_enum;
  v_resultado_ciclo  resultado_ciclo_enum;
  v_ciclo_id         UUID;
  v_active_bonds     INT;
BEGIN
  -- Validación anti-concurrencia: bloquear la fila antes de cualquier escritura
  SELECT estado_vital, especie, crotal, madre_id, parto_evento_id, estado_vinculo_materno
  INTO   v_estado_actual, v_especie, v_crotal, v_madre_id, v_parto_evento_id, v_vinculo
  FROM   animal WHERE id = p_animal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Animal no encontrado: %', p_animal_id;
  END IF;

  -- Regla de negocio: solo animales vivos pueden tener evento de salida
  IF v_estado_actual != 'vivo' THEN
    RAISE EXCEPTION 'El animal% no puede salir: estado_vital actual es "%"',
      CASE WHEN v_crotal IS NOT NULL THEN ' (crotal: ' || v_crotal || ')' ELSE '' END,
      v_estado_actual;
  END IF;

  -- Estado derivado según el motivo
  IF p_motivo = 'venta' THEN
    v_nuevo_estado    := 'vendido';
    v_resultado_ciclo := 'venta';
  ELSIF p_motivo = 'muerte' THEN
    v_nuevo_estado    := 'muerto';
    v_resultado_ciclo := 'muerte';
  ELSE
    RAISE EXCEPTION 'Motivo de salida no reconocido: "%"', p_motivo;
  END IF;

  v_tipo_evento_id := _resolve_tipo_evento_id('SALIDA');
  v_motivo_id      := _resolve_motivo_id(p_motivo);

  -- 1. Evento: fuente de verdad del sistema
  INSERT INTO eventos (tipo_evento_id, motivo_id, especie, fecha)
  VALUES (v_tipo_evento_id, v_motivo_id, v_especie, p_fecha)
  RETURNING id INTO v_evento_id;

  -- 2. Asociación N:M evento ↔ animal
  INSERT INTO evento_animales (evento_id, animal_id)
  VALUES (v_evento_id, p_animal_id);

  -- 3. Actualizar snapshot del animal que sale
  UPDATE animal
  SET estado_vital         = v_nuevo_estado,
      estado_reproductivo  = NULL,
      fecha_prevista_parto = NULL
  WHERE id = p_animal_id;

  -- 4. Finalizar vínculo materno si la cría lo tenía activo
  IF v_vinculo = 'activo' AND v_madre_id IS NOT NULL AND v_parto_evento_id IS NOT NULL THEN

    UPDATE animal
    SET estado_vinculo_materno = 'finalizado'
    WHERE id = p_animal_id;

    -- Resolver el ciclo de la madre a través del evento de parto que originó a esta cría
    SELECT ciclo_id INTO v_ciclo_id
    FROM   eventos WHERE id = v_parto_evento_id;

    IF v_ciclo_id IS NOT NULL THEN
      -- Contar crías que aún tienen vínculo activo en el mismo ciclo
      -- (la cría actual ya tiene estado_vital != 'vivo' y vinculo = 'finalizado' tras los UPDATEs anteriores)
      SELECT COUNT(*) INTO v_active_bonds
      FROM   animal a
      JOIN   eventos e ON e.id = a.parto_evento_id
      WHERE  e.ciclo_id = v_ciclo_id
        AND  a.estado_vinculo_materno = 'activo'
        AND  a.estado_vital = 'vivo';

      -- Si no quedan crías activas: cerrar el ciclo y liberar a la madre
      IF v_active_bonds = 0 THEN
        UPDATE ciclo_reproductivo
        SET fecha_fin = p_fecha,
            resultado = 'parto'
        WHERE id = v_ciclo_id
          AND fecha_fin IS NULL;

        UPDATE animal
        SET estado_reproductivo = 'vacia'
        WHERE id = v_madre_id
          AND estado_vital = 'vivo';
      END IF;
    END IF;

  END IF;

  -- 5. Cerrar ciclo reproductivo propio si existe (reproductoras que salen)
  UPDATE ciclo_reproductivo
  SET fecha_fin = p_fecha,
      resultado = v_resultado_ciclo
  WHERE animal_id = p_animal_id
    AND fecha_fin IS NULL;

  RETURN v_evento_id;
END;
$$;
