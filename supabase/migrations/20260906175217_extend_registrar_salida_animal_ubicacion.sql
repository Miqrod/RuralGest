-- =============================================================================
-- PRD014 — Instalaciones y Reubicación de Animales
-- Tarea 250: extender registrar_salida_animal con CAMBIO_UBICACION final
--
-- Al registrar la salida de un animal (venta o muerte):
--   - Si tenía ubicación asignada: genera CAMBIO_UBICACION origen → NULL
--     y limpia ubicacion_actual_id en el snapshot del animal.
--   - Si no tenía ubicación (NULL): no se genera ningún evento de ubicación.
-- destino=NULL indica que el animal abandona el sistema de seguimiento físico.
-- Firma sin cambios: compatible hacia atrás.
-- =============================================================================
CREATE OR REPLACE FUNCTION registrar_salida_animal(
  p_animal_id UUID,
  p_motivo    TEXT,   -- 'venta' | 'muerte'
  p_fecha     DATE
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_estado_actual       estado_vital_enum;
  v_especie             especie_enum;
  v_crotal              TEXT;
  v_madre_id            UUID;
  v_parto_evento_id     UUID;
  v_vinculo             vinculo_materno_enum;
  v_ubicacion_actual_id UUID;
  v_tipo_evento_id      UUID;
  v_tipo_cambio_ubic_id UUID;
  v_motivo_id           UUID;
  v_evento_id           UUID;
  v_cambio_ubic_id      UUID;
  v_nuevo_estado        estado_vital_enum;
  v_ciclo_id            UUID;
  v_active_bonds        INT;
BEGIN
  -- Anti-concurrencia: bloquear la fila antes de cualquier escritura
  SELECT estado_vital, especie, crotal, madre_id, parto_evento_id,
         estado_vinculo_materno, ubicacion_actual_id
  INTO   v_estado_actual, v_especie, v_crotal, v_madre_id, v_parto_evento_id,
         v_vinculo, v_ubicacion_actual_id
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

  -- 3. Actualizar snapshot del animal: nuevo estado vital + fecha de salida + limpiar ubicación.
  --    El ciclo reproductivo propio (si existía) queda abierto intencionalmente:
  --    el carrusel lo mostrará con anotación contextual usando fecha_salida.
  UPDATE animal
  SET estado_vital         = v_nuevo_estado,
      estado_reproductivo  = NULL,
      fecha_prevista_parto = NULL,
      fecha_salida         = p_fecha,
      ubicacion_actual_id  = NULL   -- el animal sale de la explotación
  WHERE id = p_animal_id;

  -- 4. CAMBIO_UBICACION final: solo si el animal tenía ubicación asignada.
  --    destino=NULL refleja que el animal abandona el sistema de seguimiento físico.
  IF v_ubicacion_actual_id IS NOT NULL THEN
    v_tipo_cambio_ubic_id := _resolve_tipo_evento_id('CAMBIO_UBICACION');

    INSERT INTO eventos (
      tipo_evento_id, especie, fecha,
      ubicacion_origen_id, ubicacion_destino_id,
      metadata_json
    )
    VALUES (
      v_tipo_cambio_ubic_id, v_especie, p_fecha,
      v_ubicacion_actual_id,  -- origen: instalación que tenía
      NULL,                    -- destino NULL: abandona el sistema
      jsonb_build_object('contexto', p_motivo)  -- 'venta' o 'muerte'
    )
    RETURNING id INTO v_cambio_ubic_id;

    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_cambio_ubic_id, p_animal_id, 'self');
  END IF;

  -- 5. Finalizar vínculo materno si la cría lo tenía activo
  --    y cerrar el ciclo de la madre si ya no quedan crías con vínculo activo.
  IF v_vinculo = 'activo' AND v_madre_id IS NOT NULL AND v_parto_evento_id IS NOT NULL THEN

    UPDATE animal
    SET estado_vinculo_materno = 'finalizado'
    WHERE id = p_animal_id;

    -- Resolver el ciclo de la madre a través del evento de parto que originó esta cría
    SELECT ciclo_id INTO v_ciclo_id
    FROM   eventos WHERE id = v_parto_evento_id;

    IF v_ciclo_id IS NOT NULL THEN
      SELECT COUNT(*) INTO v_active_bonds
      FROM   animal a
      JOIN   eventos e ON e.id = a.parto_evento_id
      WHERE  e.ciclo_id = v_ciclo_id
        AND  a.estado_vinculo_materno = 'activo'
        AND  a.estado_vital = 'vivo';

      -- Solo fecha_fin: resultado ya fue fijado como 'parto' por registrar_parto
      IF v_active_bonds = 0 THEN
        UPDATE ciclo_reproductivo
        SET fecha_fin = p_fecha
        WHERE id = v_ciclo_id
          AND fecha_fin IS NULL
          AND resultado IS NOT NULL;
      END IF;
    END IF;

  END IF;

  -- NOTA: el ciclo reproductivo PROPIO de la reproductora que sale ya NO se cierra aquí.
  -- Su historia reproductiva queda visible en el carrusel con la anotación contextual.

  RETURN v_evento_id;
END;
$$;
