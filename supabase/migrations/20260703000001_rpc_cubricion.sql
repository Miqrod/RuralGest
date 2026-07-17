-- =============================================================================
-- registrar_cubricion
--
-- Atomiza el flujo completo de cubrición en una única transacción:
--   SELECT FOR UPDATE → (INSERT ciclo si procede) → INSERT eventos
--   → INSERT evento_animales → UPDATE animal
--
-- Gestión del ciclo reproductivo (dentro de la transacción):
--   p_ciclo_id = NULL  → crear nuevo ciclo (primera cubrición o ciclo anterior cerrado)
--   p_ciclo_id = UUID  → reutilizar ciclo abierto existente (repetición, fallo)
-- La decisión crear/reutilizar la toma ReproductiveCycleRules en el Use Case;
-- el RPC solo ejecuta lo que se le indica.
--
-- Los metadatos de cubrición (tipo, macho, observaciones) se almacenan en
-- eventos.metadata_json para mantener la trazabilidad junto al evento.
--
-- Devuelve el UUID del evento creado.
-- =============================================================================
CREATE OR REPLACE FUNCTION registrar_cubricion(
  p_animal_id            UUID,
  p_fecha                DATE,
  p_ciclo_id             UUID    DEFAULT NULL,  -- null = crear nuevo ciclo
  p_estado_reproductivo  estado_reproductivo_enum DEFAULT 'gestante',
  p_fecha_prevista_parto DATE    DEFAULT NULL,
  p_tipo_cubricion       TEXT    DEFAULT NULL,  -- 'natural' | 'inseminacion'
  p_macho_id             UUID    DEFAULT NULL,
  p_observaciones        TEXT    DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tipo_evento_id UUID;
  v_evento_id      UUID;
  v_especie        especie_enum;
  v_estado_vital   estado_vital_enum;
  v_crotal         TEXT;
  v_ciclo_id       UUID;
  v_numero_ciclo   INT;
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

  -- Gestión del ciclo: crear o reutilizar, dentro de la misma transacción
  IF p_ciclo_id IS NULL THEN
    SELECT COALESCE(MAX(numero_ciclo), 0) + 1
    INTO v_numero_ciclo
    FROM ciclo_reproductivo
    WHERE animal_id = p_animal_id;

    INSERT INTO ciclo_reproductivo (animal_id, numero_ciclo, fecha_inicio)
    VALUES (p_animal_id, v_numero_ciclo, p_fecha)
    RETURNING id INTO v_ciclo_id;
  ELSE
    v_ciclo_id := p_ciclo_id;
  END IF;

  v_tipo_evento_id := _resolve_tipo_evento_id('CUBRICION');

  -- 1. Evento: fuente de verdad del sistema
  INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
  VALUES (
    v_tipo_evento_id,
    v_especie,
    p_fecha,
    v_ciclo_id,
    jsonb_build_object(
      'tipo_cubricion', p_tipo_cubricion,
      'macho_id',       p_macho_id,
      'observaciones',  p_observaciones
    )
  )
  RETURNING id INTO v_evento_id;

  -- 2. Asociación N:M evento ↔ animal (rol 'madre' identifica a la hembra receptora)
  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_animal_id, 'madre');

  -- 3. Actualizar snapshot derivado: siempre DESPUÉS del evento, nunca antes
  UPDATE animal
  SET estado_reproductivo  = p_estado_reproductivo,
      fecha_prevista_parto = p_fecha_prevista_parto
  WHERE id = p_animal_id;

  RETURN v_evento_id;
END;
$$;
