-- =============================================================================
-- Actualiza registrar_salida_animal con dos cambios:
--
-- 1. Al cerrar el ciclo reproductivo propio del animal que sale:
--    solo fecha_fin; resultado queda NULL intencionalmente.
--    El carousel interpreta (ciclo.fecha_fin IS NOT NULL AND ciclo.resultado IS NULL
--    AND estadoVital != 'vivo') como cierre por salida y muestra la anotación
--    "Animal vendido/fallecido · Historia reproductiva finalizada" en la timeline.
--
-- 2. Destete implícito de crías cuando la madre sale:
--    Si el animal tiene crías con estado_vinculo_materno = 'activo', se crea un
--    evento DESTETE por cada una con metadata_json = {"cierre_por_salida": "venta"/"muerte"}.
--    Esto registra el hecho en el historial de la cría y permite mostrar la causa
--    del destete temprano: "(venta madre)" o "(muerte madre)".
-- =============================================================================

CREATE OR REPLACE FUNCTION registrar_salida_animal(
  p_animal_id UUID,
  p_motivo    TEXT,   -- 'venta' | 'muerte'
  p_fecha     DATE
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_estado_actual      estado_vital_enum;
  v_especie            especie_enum;
  v_crotal             TEXT;
  v_madre_id           UUID;
  v_parto_evento_id    UUID;
  v_vinculo            vinculo_materno_enum;
  v_tipo_evento_id     UUID;
  v_motivo_id          UUID;
  v_evento_id          UUID;
  v_nuevo_estado       estado_vital_enum;
  v_ciclo_id           UUID;
  v_active_bonds       INT;
  -- Destete implícito cuando la madre sale
  v_destete_tipo_id    UUID;
  v_destete_evento_id  UUID;
  v_tp_recria_id       UUID;
  v_cria               RECORD;
BEGIN
  -- Anti-concurrencia: bloquear la fila antes de cualquier escritura
  SELECT estado_vital, especie, crotal, madre_id, parto_evento_id, estado_vinculo_materno
  INTO   v_estado_actual, v_especie, v_crotal, v_madre_id, v_parto_evento_id, v_vinculo
  FROM   animal WHERE id = p_animal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Animal no encontrado: %', p_animal_id;
  END IF;

  IF v_estado_actual != 'vivo' THEN
    RAISE EXCEPTION 'El animal% no puede salir: estado_vital actual es "%"',
      CASE WHEN v_crotal IS NOT NULL THEN ' (crotal: ' || v_crotal || ')' ELSE '' END,
      v_estado_actual;
  END IF;

  IF p_motivo = 'venta' THEN
    v_nuevo_estado := 'vendido';
  ELSIF p_motivo = 'muerte' THEN
    v_nuevo_estado := 'muerto';
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

  -- 4. Si el animal era una cría con vínculo activo: finalizar vínculo y
  --    evaluar si la madre puede cerrar su ciclo (última cría activa).
  IF v_vinculo = 'activo' AND v_madre_id IS NOT NULL AND v_parto_evento_id IS NOT NULL THEN

    UPDATE animal
    SET estado_vinculo_materno = 'finalizado'
    WHERE id = p_animal_id;

    SELECT ciclo_id INTO v_ciclo_id
    FROM   eventos WHERE id = v_parto_evento_id;

    IF v_ciclo_id IS NOT NULL THEN
      SELECT COUNT(*) INTO v_active_bonds
      FROM   animal a
      JOIN   eventos e ON e.id = a.parto_evento_id
      WHERE  e.ciclo_id = v_ciclo_id
        AND  a.estado_vinculo_materno = 'activo'
        AND  a.estado_vital = 'vivo';

      IF v_active_bonds = 0 THEN
        -- resultado ya fue fijado como 'parto' por registrar_parto → solo fecha_fin
        UPDATE ciclo_reproductivo
        SET fecha_fin = p_fecha
        WHERE id = v_ciclo_id
          AND fecha_fin IS NULL
          AND resultado IS NOT NULL;
      END IF;
    END IF;

  END IF;

  -- 4b. Si el animal tiene crías propias con vínculo activo: destete implícito.
  --     El ciclo_id del evento DESTETE se resuelve desde el parto_evento_id de cada cría
  --     (igual que registrar_destete), NO desde el ciclo actual de la madre.
  --     Así el evento aparece en el slide correcto del carrusel.
  v_destete_tipo_id := _resolve_tipo_evento_id('DESTETE');

  SELECT id INTO v_tp_recria_id
  FROM   tipo_productivo
  WHERE  nombre = 'Recría' AND especie = v_especie
  LIMIT  1;

  FOR v_cria IN
      SELECT a.id, tp.nombre AS tp_nombre,
             ep.ciclo_id AS ciclo_parto_id   -- ciclo donde nació la cría
      FROM   animal a
      LEFT   JOIN tipo_productivo tp ON tp.id = a.tipo_productivo_id
      LEFT   JOIN eventos ep         ON ep.id = a.parto_evento_id
      WHERE  a.madre_id              = p_animal_id
        AND  a.estado_vinculo_materno = 'activo'
        AND  a.estado_vital           = 'vivo'
    LOOP
      INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
      VALUES (
        v_destete_tipo_id, v_especie, p_fecha, v_cria.ciclo_parto_id,
        jsonb_build_object('cierre_por_salida', p_motivo)
      )
      RETURNING id INTO v_destete_evento_id;

      -- Asociar la cría y la madre al evento de destete
      INSERT INTO evento_animales (evento_id, animal_id, rol)
      VALUES (v_destete_evento_id, v_cria.id, 'cria');

      INSERT INTO evento_animales (evento_id, animal_id, rol)
      VALUES (v_destete_evento_id, p_animal_id, 'madre');

      -- Finalizar vínculo; pasar a Recría solo si aún estaba en etapa Cría
      UPDATE animal
      SET estado_vinculo_materno = 'finalizado',
          tipo_productivo_id     = CASE WHEN v_cria.tp_nombre = 'Cría'
                                        THEN v_tp_recria_id
                                        ELSE tipo_productivo_id END
      WHERE id = v_cria.id;
    END LOOP;

  -- 5. Cerrar ciclo reproductivo propio si existe.
  --    resultado queda NULL: lo distingue de un cierre por evento reproductivo.
  UPDATE ciclo_reproductivo
  SET fecha_fin = p_fecha
  WHERE animal_id = p_animal_id
    AND fecha_fin IS NULL;

  RETURN v_evento_id;
END;
$$;
