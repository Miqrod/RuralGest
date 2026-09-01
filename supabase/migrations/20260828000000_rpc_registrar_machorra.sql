-- =============================================================================
-- registrar_machorra: registro atómico de una oportunidad reproductiva sin resultado
--
-- Operaciones en una sola transacción:
--   1. Carga y bloquea el animal (FOR UPDATE → protección TOCTOU)
--   2. Valida que es_reproductora = true (Machorra no aplica a no-reproductoras)
--   3. Valida estado reproductivo ('vacia' o 'cubierta' — no 'gestante')
--   4. Obtiene y bloquea el ciclo más reciente abierto
--   5. Crea el evento MACHORRA con CURRENT_DATE
--   6. Asocia la madre al evento (rol: 'madre')
--   7. Cierra el ciclo (resultado = 'machorra', fecha_fin = CURRENT_DATE)
--   8. Abre nuevo ciclo en 'vacia' (Machorra implica que sigue siendo reproductora)
--   9. Proyecta estado_reproductivo = 'vacia', borra fecha_prevista_parto
--
-- Diferencias clave respecto a registrar_aborto:
--   · Sin p_fecha: usa CURRENT_DATE (fecha no editable — OBJ-02 PRD012)
--   · Sin p_observaciones: no hay formulario adicional
--   · Estado válido: 'vacia' | 'cubierta', no 'gestante' (gestante → registrar_aborto)
--   · es_reproductora = true obligatorio: Machorra siempre abre nuevo ciclo
--   · No existe rama defensiva sin nuevo ciclo: es_reproductora se valida al inicio
--
-- Ref: PRD012 OBJ-01, OBJ-04, OBJ-05
-- =============================================================================
CREATE OR REPLACE FUNCTION registrar_machorra(
  p_animal_id UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_animal          RECORD;
  v_fecha           DATE := CURRENT_DATE;
  v_ciclo_id        UUID;
  v_tipo_evento_id  UUID;
  v_evento_id       UUID;
  v_nuevo_ciclo_num INT;
  v_nuevo_ciclo_id  UUID;
BEGIN
  -- ── 1. Cargar y bloquear el animal ────────────────────────────────────────
  SELECT id, especie, estado_reproductivo, es_reproductora
  INTO v_animal
  FROM animal
  WHERE id = p_animal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Animal no encontrado: %', p_animal_id;
  END IF;

  -- ── 2. Validar es_reproductora ────────────────────────────────────────────
  -- Machorra no tiene rama sin nuevo ciclo: solo aplica a reproductoras activas.
  -- A diferencia de Aborto, aquí es_reproductora = false es siempre un error.
  IF NOT v_animal.es_reproductora THEN
    RAISE EXCEPTION 'Machorra no permitida: el animal no es reproductora (id: %)', p_animal_id;
  END IF;

  -- ── 3. Validar estado reproductivo ────────────────────────────────────────
  -- 'gestante' queda bloqueado: si la gestación ya fue confirmada, el flujo
  -- correcto es registrar_aborto, no registrar_machorra.
  IF v_animal.estado_reproductivo IS NULL OR
     v_animal.estado_reproductivo NOT IN ('vacia', 'cubierta') THEN
    RAISE EXCEPTION 'Estado reproductivo inválido para machorra: %. Solo se permite desde vacia o cubierta.',
      COALESCE(v_animal.estado_reproductivo::text, 'NULL');
  END IF;

  -- ── 4. Obtener y bloquear ciclo abierto más reciente ─────────────────────
  -- ORDER BY numero_ciclo DESC LIMIT 1: protege el caso de ciclos concurrentes
  -- (p.ej. ciclo lactante abierto + nuevo ciclo vacía tras un parto).
  SELECT id INTO v_ciclo_id
  FROM ciclo_reproductivo
  WHERE animal_id = p_animal_id AND fecha_fin IS NULL
  ORDER BY numero_ciclo DESC
  LIMIT 1
  FOR UPDATE;

  IF v_ciclo_id IS NULL THEN
    RAISE EXCEPTION 'No existe ciclo reproductivo abierto para el animal: %', p_animal_id;
  END IF;

  -- ── 5. Crear evento MACHORRA ──────────────────────────────────────────────
  v_tipo_evento_id := _resolve_tipo_evento_id('MACHORRA');

  INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id)
  VALUES (v_tipo_evento_id, v_animal.especie, v_fecha, v_ciclo_id)
  RETURNING id INTO v_evento_id;

  -- ── 6. Asociar la hembra al evento ────────────────────────────────────────
  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_animal_id, 'madre');

  -- ── 7. Cerrar ciclo actual ────────────────────────────────────────────────
  UPDATE ciclo_reproductivo
  SET fecha_fin = v_fecha,
      resultado = 'machorra'
  WHERE id = v_ciclo_id;

  -- ── 8. Abrir nuevo ciclo en vacía ─────────────────────────────────────────
  -- Siempre ocurre: es_reproductora = true está validado en el paso 2.
  SELECT COALESCE(MAX(numero_ciclo), 0) + 1 INTO v_nuevo_ciclo_num
  FROM ciclo_reproductivo
  WHERE animal_id = p_animal_id;

  INSERT INTO ciclo_reproductivo (animal_id, numero_ciclo, fecha_inicio)
  VALUES (p_animal_id, v_nuevo_ciclo_num, v_fecha)
  RETURNING id INTO v_nuevo_ciclo_id;

  -- ── 9. Proyectar estado del animal ────────────────────────────────────────
  UPDATE animal
  SET estado_reproductivo  = 'vacia',
      fecha_prevista_parto = NULL
  WHERE id = p_animal_id;

  RETURN jsonb_build_object(
    'eventoId',         v_evento_id,
    'cicloCerrado',     true,
    'nuevoCicloCreado', true
  );
END;
$$;
