-- =============================================================================
-- registrar_confirmacion_gestacion v2 (PRD008)
--
-- Extiende la versión de PRD007 para soportar dos recorridos:
--
--   Desde 'cubierta' (cubrición previa registrada):
--     - p_ciclo_id OBLIGATORIO: reutiliza el ciclo existente.
--     - p_fecha_prevista_parto NULL: no se toca (ya fue calculada en la cubrición).
--     - Transición: cubierta → gestante
--
--   Desde 'vacia' (confirmación es el primer hecho conocido del ciclo):
--     - p_ciclo_id NULL: se crea un nuevo ciclo_reproductivo internamente.
--     - p_fecha_prevista_parto OBLIGATORIO: calculada por ReproductiveProjection
--       a partir de los meses de gestación estimados que introdujo el usuario.
--     - Transición: vacia → gestante
--
-- La edad gestacional estimada nunca llega aquí: el dominio TS ya la consumió
-- para calcular p_fecha_prevista_parto y la descarta. Solo persiste la fecha.
--
-- Devuelve el UUID del evento creado.
-- =============================================================================
-- Elimina la firma anterior (PRD007) para evitar ambigüedad de overloads.
-- La firma antigua tenía (p_animal_id, p_fecha, p_ciclo_id, p_observaciones)
-- sin p_fecha_prevista_parto, que era obligatorio en ese momento.
DROP FUNCTION IF EXISTS registrar_confirmacion_gestacion(uuid, date, uuid, text);

CREATE OR REPLACE FUNCTION registrar_confirmacion_gestacion(
  p_animal_id             UUID,
  p_fecha                 DATE,
  p_ciclo_id              UUID    DEFAULT NULL,
  p_fecha_prevista_parto  DATE    DEFAULT NULL,
  p_observaciones         TEXT    DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tipo_evento_id UUID;
  v_evento_id      UUID;
  v_especie        especie_enum;
  v_estado_vital   estado_vital_enum;
  v_crotal         TEXT;
  v_ciclo_id       UUID;
  v_num_ciclo      INT;
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

  -- Resolver ciclo: reutilizar el recibido o crear uno nuevo
  IF p_ciclo_id IS NOT NULL THEN
    v_ciclo_id := p_ciclo_id;
  ELSE
    -- Confirmación inicia el ciclo: calcular numero_ciclo y crear
    SELECT COALESCE(MAX(numero_ciclo), 0) + 1
    INTO v_num_ciclo
    FROM ciclo_reproductivo
    WHERE animal_id = p_animal_id;

    INSERT INTO ciclo_reproductivo (animal_id, numero_ciclo, fecha_inicio)
    VALUES (p_animal_id, v_num_ciclo, p_fecha)
    RETURNING id INTO v_ciclo_id;
  END IF;

  v_tipo_evento_id := _resolve_tipo_evento_id('CONFIRMACION_GESTACION');

  -- 1. Evento: fuente de verdad del sistema
  INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
  VALUES (
    v_tipo_evento_id,
    v_especie,
    p_fecha,
    v_ciclo_id,
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

  -- 3. Actualizar snapshot
  --    estado_reproductivo siempre → gestante
  --    fecha_prevista_parto solo cuando se proporciona (desde vacia con estimación)
  UPDATE animal
  SET
    estado_reproductivo  = 'gestante',
    fecha_prevista_parto = COALESCE(p_fecha_prevista_parto, fecha_prevista_parto)
  WHERE id = p_animal_id;

  RETURN v_evento_id;
END;
$$;
