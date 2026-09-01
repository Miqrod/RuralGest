-- =============================================================================
-- Añade un DESTETE implícito en el historial de la madre cuando una CRÍA
-- con vínculo activo sale de la explotación (venta o muerte).
--
-- Antes de este cambio, el paso 4 de registrar_salida_animal solo finalizaba
-- silenciosamente estado_vinculo_materno = 'finalizado' sin dejar rastro en
-- el historial de la madre ni en el carrusel reproductivo.
--
-- Ahora se crea un evento DESTETE con:
--   metadata_json = { cierre_por_cria: 'venta' | 'muerte' }
--
-- La clave cierre_por_cria (distinta de cierre_por_salida que usa el paso 4b)
-- permite a la UI mostrar "(venta cría)" / "(muerte cría)" desde la ficha de
-- la madre, equivalente simétrico al "(venta madre)" / "(muerte madre)" que
-- ya se muestra en la ficha de la cría cuando es LA MADRE quien sale.
--
-- El evento DESTETE se registra en el ciclo del parto original de la cría
-- para que aparezca en el slide correcto del carrusel.
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

  -- 1. Evento SALIDA: fuente de verdad del sistema
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

  -- 4. Si el animal era una CRÍA con vínculo activo:
  --    - Finalizar el vínculo
  --    - Registrar DESTETE implícito con cierre_por_cria en el historial de la madre
  --    - Evaluar cierre del ciclo de la madre (última cría activa)
  IF v_vinculo = 'activo' AND v_madre_id IS NOT NULL AND v_parto_evento_id IS NOT NULL THEN

    UPDATE animal
    SET estado_vinculo_materno = 'finalizado'
    WHERE id = p_animal_id;

    -- El ciclo_id es el del parto que originó a esta cría → aparece en el slide correcto
    SELECT ciclo_id INTO v_ciclo_id
    FROM   eventos WHERE id = v_parto_evento_id;

    -- DESTETE implícito: deja traza en el historial de la madre y en el carrusel.
    -- cierre_por_cria (distinto de cierre_por_salida del paso 4b) permite a la UI
    -- distinguir si el vínculo lo cerró la cría o la madre.
    v_destete_tipo_id := _resolve_tipo_evento_id('DESTETE');

    INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
    VALUES (
      v_destete_tipo_id, v_especie, p_fecha, v_ciclo_id,
      jsonb_build_object('cierre_por_cria', p_motivo)
    )
    RETURNING id INTO v_destete_evento_id;

    -- La cría aparece en el evento para que la madre vea su crotal/sexo en el log
    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_destete_evento_id, p_animal_id, 'cria');

    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_destete_evento_id, v_madre_id, 'madre');

    -- Cierre del ciclo de la madre si ya no quedan crías activas
    IF v_ciclo_id IS NOT NULL THEN
      SELECT COUNT(*) INTO v_active_bonds
      FROM   animal a
      JOIN   eventos e ON e.id = a.parto_evento_id
      WHERE  e.ciclo_id = v_ciclo_id
        AND  a.estado_vinculo_materno = 'activo'
        AND  a.estado_vital = 'vivo';

      IF v_active_bonds = 0 THEN
        UPDATE ciclo_reproductivo
        SET fecha_fin = p_fecha
        WHERE id = v_ciclo_id
          AND fecha_fin IS NULL
          AND resultado IS NOT NULL;
      END IF;
    END IF;

  END IF;

  -- 4b. Si el animal tiene CRÍAS PROPIAS con vínculo activo: destete implícito.
  --     Usa cierre_por_salida (no cierre_por_cria) porque es la madre quien sale.
  --     El ciclo_id viene del parto_evento_id de cada cría para aparecer en el slide correcto.
  v_destete_tipo_id := _resolve_tipo_evento_id('DESTETE');

  SELECT id INTO v_tp_recria_id
  FROM   tipo_productivo
  WHERE  nombre = 'Recría' AND especie = v_especie
  LIMIT  1;

  FOR v_cria IN
      SELECT a.id, tp.nombre AS tp_nombre,
             ep.ciclo_id AS ciclo_parto_id
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

      INSERT INTO evento_animales (evento_id, animal_id, rol)
      VALUES (v_destete_evento_id, v_cria.id, 'cria');

      INSERT INTO evento_animales (evento_id, animal_id, rol)
      VALUES (v_destete_evento_id, p_animal_id, 'madre');

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
