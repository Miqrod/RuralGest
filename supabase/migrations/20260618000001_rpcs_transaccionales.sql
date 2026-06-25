-- =============================================================================
-- RPC transaccionales: registrar_compra_animal + registrar_salida_animal
--
-- Cada función agrupa todas las operaciones de BD en una única transacción
-- Postgres, eliminando el riesgo de registros huérfanos que existía con las
-- inserciones secuenciales del repositorio TypeScript.
--
-- Ver: documentacion/arquitectura/rpc-transaccional.md
-- =============================================================================


-- -----------------------------------------------------------------------------
-- registrar_compra_animal
--
-- Atomiza el flujo de compra de PRD005:
--   INSERT eventos → INSERT animal → INSERT evento_animales
--
-- Reemplaza las 3 inserciones secuenciales de insertarCompraAnimal() en el
-- repositorio TypeScript. Devuelve el UUID del animal creado para que el
-- repositorio lo hidrate con un SELECT posterior.
-- -----------------------------------------------------------------------------
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
  p_lote_id                   UUID    DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tipo_evento_id  UUID;
  v_motivo_id       UUID;
  v_evento_id       UUID;
  v_animal_id       UUID;
  v_tp_nombre       TEXT;
  v_es_reproductora BOOLEAN;
BEGIN
  -- Resolver IDs de catálogo reutilizando los helpers privados
  v_tipo_evento_id := _resolve_tipo_evento_id('ENTRADA');
  v_motivo_id      := _resolve_motivo_id('compra');

  -- es_reproductora: true solo para hembras cuyo tipo_productivo es 'Reproductora'.
  -- Se calcula aquí para no exponer esta lógica al cliente TypeScript.
  SELECT nombre INTO v_tp_nombre FROM tipo_productivo WHERE id = p_tipo_productivo_id;
  v_es_reproductora := (p_sexo = 'hembra' AND v_tp_nombre = 'Reproductora');

  -- 1. Evento: fuente de verdad del sistema
  INSERT INTO eventos (tipo_evento_id, motivo_id, especie, fecha)
  VALUES (v_tipo_evento_id, v_motivo_id, p_especie, p_fecha_compra)
  RETURNING id INTO v_evento_id;

  -- 2. Animal: entidad física cuya existencia queda justificada por el evento
  INSERT INTO animal (
    especie, sexo, tipo_productivo_id,
    crotal, num_hierro, raza_id,
    fecha_nacimiento, fecha_nacimiento_estimada,
    lote_id,
    origen,
    evento_creacion_id, evento_origen_id,
    es_reproductora,
    estado_vital, estado_sanitario, estado_reproductivo
  ) VALUES (
    p_especie, p_sexo, p_tipo_productivo_id,
    p_crotal, p_num_hierro, p_raza_id,
    p_fecha_nacimiento, p_fecha_nacimiento_estimada,
    p_lote_id,
    'compra',
    v_evento_id, v_evento_id,
    v_es_reproductora,
    'vivo', 'sano', NULL
  ) RETURNING id INTO v_animal_id;

  -- 3. Asociación N:M evento ↔ animal (trazabilidad completa)
  INSERT INTO evento_animales (evento_id, animal_id)
  VALUES (v_evento_id, v_animal_id);

  RETURN v_animal_id;
END;
$$;


-- -----------------------------------------------------------------------------
-- registrar_salida_animal
--
-- Atomiza el flujo de salida (venta o muerte):
--   SELECT FOR UPDATE → INSERT eventos → INSERT evento_animales → UPDATE animal
--
-- El FOR UPDATE bloquea la fila durante la transacción: si dos peticiones
-- llegan en paralelo para el mismo animal, la segunda verá el estado ya
-- actualizado por la primera y recibirá la excepción correspondiente.
--
-- Devuelve el UUID del evento creado.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION registrar_salida_animal(
  p_animal_id UUID,
  p_motivo    TEXT,   -- 'venta' | 'muerte'
  p_fecha     DATE
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_estado_actual  estado_vital_enum;
  v_especie        especie_enum;
  v_crotal         TEXT;
  v_tipo_evento_id UUID;
  v_motivo_id      UUID;
  v_evento_id      UUID;
  v_nuevo_estado   estado_vital_enum;
BEGIN
  -- Validación anti-concurrencia: bloquear la fila antes de cualquier escritura
  SELECT estado_vital, especie, crotal
  INTO v_estado_actual, v_especie, v_crotal
  FROM animal WHERE id = p_animal_id
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

  -- Estado derivado según el motivo: determinar antes de insertar el evento
  IF p_motivo = 'venta' THEN
    v_nuevo_estado := 'vendido';
  ELSIF p_motivo = 'muerte' THEN
    v_nuevo_estado := 'muerto';
  ELSE
    RAISE EXCEPTION 'Motivo de salida no reconocido: "%"', p_motivo;
  END IF;

  -- Resolver IDs de catálogo con helpers privados
  v_tipo_evento_id := _resolve_tipo_evento_id('SALIDA');
  v_motivo_id      := _resolve_motivo_id(p_motivo);

  -- 1. Evento: fuente de verdad del sistema
  INSERT INTO eventos (tipo_evento_id, motivo_id, especie, fecha)
  VALUES (v_tipo_evento_id, v_motivo_id, v_especie, p_fecha)
  RETURNING id INTO v_evento_id;

  -- 2. Asociación N:M evento ↔ animal (trazabilidad completa)
  INSERT INTO evento_animales (evento_id, animal_id)
  VALUES (v_evento_id, p_animal_id);

  -- 3. Actualizar snapshot derivado: siempre DESPUÉS del evento, nunca antes
  UPDATE animal SET estado_vital = v_nuevo_estado WHERE id = p_animal_id;

  RETURN v_evento_id;
END;
$$;
