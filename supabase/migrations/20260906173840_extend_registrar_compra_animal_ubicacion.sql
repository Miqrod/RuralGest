-- =============================================================================
-- PRD014 — Instalaciones y Reubicación de Animales
-- Tarea 249: extender registrar_compra_animal con ubicación inicial opcional
--
-- Nuevo parámetro opcional p_ubicacion_id (DEFAULT NULL).
-- Si se informa:
--   1. Valida que la instalación existe, está activa y admite_animales = true.
--   2. Genera un CAMBIO_UBICACION NULL → instalacion con {"contexto":"compra"}.
--   3. Vincula el evento al animal (rol 'self').
--   4. Actualiza animal.ubicacion_actual_id.
-- Si es NULL: sin cambio respecto al comportamiento anterior (compatible hacia atrás).
-- La UI del formulario de compra añadirá el campo en la tarea 262 (tras tarea 252).
-- =============================================================================
CREATE OR REPLACE FUNCTION registrar_compra_animal(
  p_especie                   especie_enum,
  p_sexo                      sexo_enum,
  p_tipo_productivo_id        UUID,
  p_fecha_compra              DATE,
  p_crotal                    TEXT    DEFAULT NULL,
  p_num_hierro                TEXT    DEFAULT NULL,
  p_raza_id                   UUID    DEFAULT NULL,
  p_fecha_nacimiento          DATE    DEFAULT NULL,
  p_fecha_nacimiento_estimada DATE    DEFAULT NULL,
  p_lote_id                   UUID    DEFAULT NULL,
  p_ubicacion_id              UUID    DEFAULT NULL   -- instalación de destino inicial (opcional)
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tipo_evento_id       UUID;
  v_tipo_cambio_ubic_id  UUID;
  v_motivo_id            UUID;
  v_evento_id            UUID;
  v_cambio_ubic_id       UUID;
  v_animal_id            UUID;
  v_tp_nombre            TEXT;
  v_es_reproductora      BOOLEAN;
  v_destino              RECORD;
BEGIN
  -- 1. Validar instalación antes de cualquier escritura (fail fast)
  IF p_ubicacion_id IS NOT NULL THEN
    SELECT activo, admite_animales
    INTO   v_destino
    FROM   instalacion
    WHERE  id = p_ubicacion_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Instalación no encontrada: %', p_ubicacion_id;
    END IF;
    IF NOT v_destino.activo THEN
      RAISE EXCEPTION 'La instalación destino está inactiva';
    END IF;
    IF NOT v_destino.admite_animales THEN
      RAISE EXCEPTION 'La instalación destino no admite animales';
    END IF;
  END IF;

  v_tipo_evento_id := _resolve_tipo_evento_id('ENTRADA');
  v_motivo_id      := _resolve_motivo_id('compra');

  -- es_reproductora: solo hembras con tipo_productivo 'Reproductora'
  SELECT nombre INTO v_tp_nombre FROM tipo_productivo WHERE id = p_tipo_productivo_id;
  v_es_reproductora := (p_sexo = 'hembra' AND v_tp_nombre = 'Reproductora');

  -- 2. Evento ENTRADA: fuente de verdad del sistema
  INSERT INTO eventos (tipo_evento_id, motivo_id, especie, fecha)
  VALUES (v_tipo_evento_id, v_motivo_id, p_especie, p_fecha_compra)
  RETURNING id INTO v_evento_id;

  -- 3. Animal: la fecha de compra es también la fecha de entrada
  INSERT INTO animal (
    especie, sexo, tipo_productivo_id,
    crotal, num_hierro, raza_id,
    fecha_nacimiento, fecha_nacimiento_estimada,
    lote_id,
    origen, fecha_entrada,
    ubicacion_actual_id,
    evento_creacion_id, evento_origen_id,
    es_reproductora,
    estado_vital, estado_sanitario, estado_reproductivo
  ) VALUES (
    p_especie, p_sexo, p_tipo_productivo_id,
    p_crotal, p_num_hierro, p_raza_id,
    p_fecha_nacimiento, p_fecha_nacimiento_estimada,
    p_lote_id,
    'compra', p_fecha_compra,
    p_ubicacion_id,
    v_evento_id, v_evento_id,
    v_es_reproductora,
    'vivo', 'sano',
    CASE WHEN v_es_reproductora THEN 'vacia'::estado_reproductivo_enum ELSE NULL END
  ) RETURNING id INTO v_animal_id;

  -- 4. Asociación N:M evento ENTRADA ↔ animal
  INSERT INTO evento_animales (evento_id, animal_id)
  VALUES (v_evento_id, v_animal_id);

  -- 5. Ciclo reproductivo inicial (solo reproductoras)
  IF v_es_reproductora THEN
    INSERT INTO ciclo_reproductivo (animal_id, numero_ciclo, fecha_inicio)
    VALUES (v_animal_id, 1, p_fecha_compra);
  END IF;

  -- 6. CAMBIO_UBICACION inicial si se informó instalación
  IF p_ubicacion_id IS NOT NULL THEN
    v_tipo_cambio_ubic_id := _resolve_tipo_evento_id('CAMBIO_UBICACION');

    INSERT INTO eventos (
      tipo_evento_id, especie, fecha,
      ubicacion_origen_id, ubicacion_destino_id,
      metadata_json
    )
    VALUES (
      v_tipo_cambio_ubic_id, p_especie, p_fecha_compra,
      NULL,            -- origen NULL: el animal llega nuevo a la explotación
      p_ubicacion_id,
      '{"contexto": "compra"}'
    )
    RETURNING id INTO v_cambio_ubic_id;

    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_cambio_ubic_id, v_animal_id, 'self');
  END IF;

  RETURN v_animal_id;
END;
$$;
