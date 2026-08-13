-- =============================================================================
-- registrar_confirmacion_gestacion v3 (PRD008 corrección)
--
-- Extiende v2 para aceptar p_padre_id cuando la confirmación parte de 'vacia'
-- (sin cubrición previa registrada). El ganadero puede conocer al padre aunque
-- no haya habido cubrición registrada en el sistema.
--
-- ── Distinción macho_id / padre_id ──────────────────────────────────────────
-- Los eventos de CUBRICION almacenan el progenitor como "macho_id" en su
-- metadata_json. Aquí usamos "padre_id" porque son contextos distintos:
--
--   CUBRICION → metadata_json.macho_id
--     El macho que cubrió físicamente a la hembra.
--     Registrado en el momento del acto reproductivo.
--
--   CONFIRMACION_GESTACION → metadata_json.padre_id
--     El padre declarado por el ganadero cuando no existe cubrición registrada.
--     Registrado retrospectivamente al confirmar la gestación.
--
-- En el momento del parto, getPadreIdFromCiclo resuelve al padre buscando
-- primero en CUBRICION (macho_id) y, como fallback, en CONFIRMACION_GESTACION
-- (padre_id). La prioridad está en la cubrición porque es el hecho biológico
-- más concreto.
--
-- Claves distintas permiten identificar inmediatamente el origen del dato al
-- consultar el evento directamente en la DB.
--
-- Si p_padre_id es NULL se conserva el comportamiento anterior sin cambios.
-- =============================================================================
DROP FUNCTION IF EXISTS registrar_confirmacion_gestacion(uuid, date, uuid, date, text);

CREATE OR REPLACE FUNCTION registrar_confirmacion_gestacion(
  p_animal_id             UUID,
  p_fecha                 DATE,
  p_ciclo_id              UUID    DEFAULT NULL,
  p_fecha_prevista_parto  DATE    DEFAULT NULL,
  p_observaciones         TEXT    DEFAULT NULL,
  p_padre_id              UUID    DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tipo_evento_id UUID;
  v_evento_id      UUID;
  v_especie        especie_enum;
  v_estado_vital   estado_vital_enum;
  v_crotal         TEXT;
  v_ciclo_id       UUID;
  v_num_ciclo      INT;
  v_metadata       JSONB;
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
    SELECT COALESCE(MAX(numero_ciclo), 0) + 1
    INTO v_num_ciclo
    FROM ciclo_reproductivo
    WHERE animal_id = p_animal_id;

    INSERT INTO ciclo_reproductivo (animal_id, numero_ciclo, fecha_inicio)
    VALUES (p_animal_id, v_num_ciclo, p_fecha)
    RETURNING id INTO v_ciclo_id;
  END IF;

  -- Construir metadata_json combinando todos los campos opcionales.
  -- Se eliminan las claves null para mantener el JSON limpio.
  v_metadata := jsonb_build_object(
    'observaciones', p_observaciones,
    'padre_id',      p_padre_id
  );
  v_metadata := v_metadata - ARRAY(
    SELECT key FROM jsonb_each(v_metadata) WHERE value = 'null'::jsonb
  );
  IF v_metadata = '{}'::jsonb THEN
    v_metadata := NULL;
  END IF;

  v_tipo_evento_id := _resolve_tipo_evento_id('CONFIRMACION_GESTACION');

  -- 1. Evento: fuente de verdad del sistema
  INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
  VALUES (v_tipo_evento_id, v_especie, p_fecha, v_ciclo_id, v_metadata)
  RETURNING id INTO v_evento_id;

  -- 2. Asociación N:M evento ↔ animal
  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_animal_id, 'madre');

  -- 3. Actualizar snapshot
  UPDATE animal
  SET
    estado_reproductivo  = 'gestante',
    fecha_prevista_parto = COALESCE(p_fecha_prevista_parto, fecha_prevista_parto)
  WHERE id = p_animal_id;

  RETURN v_evento_id;
END;
$$;
