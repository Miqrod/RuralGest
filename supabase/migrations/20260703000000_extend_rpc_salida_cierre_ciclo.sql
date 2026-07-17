-- =============================================================================
-- Extiende registrar_salida_animal para cerrar el ciclo reproductivo activo.
--
-- Si el animal tiene un ciclo_reproductivo abierto (fecha_fin IS NULL) en el
-- momento de la venta o muerte, se cierra en la misma transacción:
--   venta  → resultado = 'venta'
--   muerte → resultado = 'muerte'
--
-- Si no existe ciclo abierto el UPDATE afecta 0 filas (operación silenciosa).
-- No se abre un nuevo ciclo en ninguno de los dos casos.
--
-- Regla de dominio: documentacion/memory/decisions.md § fecha_prevista_parto
-- Ver flujo completo: CHAT03.01-MODELO GANADERO.txt § CASO 6 y CASO 7
-- =============================================================================
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
  v_resultado_ciclo resultado_ciclo_enum;
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
    v_nuevo_estado    := 'vendido';
    v_resultado_ciclo := 'venta';
  ELSIF p_motivo = 'muerte' THEN
    v_nuevo_estado    := 'muerto';
    v_resultado_ciclo := 'muerte';
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
  UPDATE animal
  SET estado_vital         = v_nuevo_estado,
      estado_reproductivo  = NULL,          -- un animal muerto/vendido no tiene estado reproductivo
      fecha_prevista_parto = NULL           -- la gestación termina con la salida
  WHERE id = p_animal_id;

  -- 4. Cerrar ciclo reproductivo activo si existe (0 filas afectadas si no hay ciclo)
  UPDATE ciclo_reproductivo
  SET fecha_fin = p_fecha,
      resultado = v_resultado_ciclo
  WHERE animal_id = p_animal_id
    AND fecha_fin IS NULL;

  RETURN v_evento_id;
END;
$$;
