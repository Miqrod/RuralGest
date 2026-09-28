-- =============================================================================
-- registrar_machorra_animales
--
-- Registra múltiples hembras como machorras en una única transacción atómica.
-- Operación: N animales, fecha = CURRENT_DATE.
-- Locks en orden determinista por animal.id para evitar deadlocks.
--
-- Por cada animal:
--   1. Valida es_reproductora y estado_reproductivo (vacia | cubierta)
--   2. Obtiene y bloquea ciclo activo más reciente
--   3. Crea evento MACHORRA ligado al ciclo
--   4. Cierra el ciclo (resultado = 'machorra')
--   5. Abre nuevo ciclo en 'vacia' (es_reproductora = true es precondición)
--   6. Proyecta estado del animal (estado_reproductivo = 'vacia')
--
-- Cualquier fallo en un animal propaga excepción → rollback total.
-- =============================================================================

CREATE OR REPLACE FUNCTION registrar_machorra_animales(
  p_animal_ids UUID[]
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_animal           RECORD;
  v_ciclo_id         UUID;
  v_tipo_evento_id   UUID;
  v_evento_id        UUID;
  v_nuevo_ciclo_num  INT;
  v_fecha            DATE := CURRENT_DATE;
  v_procesados       INT  := 0;
BEGIN
  -- ── 1. Validar lista ──────────────────────────────────────────────────────
  IF array_length(p_animal_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'La lista de animales no puede estar vacía';
  END IF;

  -- Sin duplicados (un animal no puede procesarse dos veces en la misma operación)
  IF array_length(p_animal_ids, 1) !=
     (SELECT COUNT(DISTINCT x) FROM unnest(p_animal_ids) x) THEN
    RAISE EXCEPTION 'La lista contiene IDs de animales duplicados';
  END IF;

  v_tipo_evento_id := _resolve_tipo_evento_id('MACHORRA');

  -- ── 2. Procesar en orden determinista (evita deadlocks en escrituras concurrentes) ──
  FOR v_animal IN
    SELECT id, especie, estado_reproductivo, es_reproductora
    FROM   animal
    WHERE  id = ANY(p_animal_ids)
    ORDER  BY id
    FOR UPDATE
  LOOP
    v_procesados := v_procesados + 1;

    -- Validar que el animal es reproductora activa
    IF NOT v_animal.es_reproductora THEN
      RAISE EXCEPTION 'Machorra no permitida: el animal % no es reproductora', v_animal.id;
    END IF;

    -- Validar estado reproductivo compatible con machorra
    IF v_animal.estado_reproductivo IS NULL OR
       v_animal.estado_reproductivo NOT IN ('vacia', 'cubierta') THEN
      RAISE EXCEPTION
        'Estado reproductivo inválido para machorra en animal %: %. Solo se permite desde vacia o cubierta.',
        v_animal.id, COALESCE(v_animal.estado_reproductivo::text, 'NULL');
    END IF;

    -- Obtener y bloquear ciclo activo más reciente
    -- resultado IS NULL: el ciclo activo nunca tiene resultado fijado
    SELECT id INTO v_ciclo_id
    FROM   ciclo_reproductivo
    WHERE  animal_id = v_animal.id
      AND  fecha_fin  IS NULL
      AND  resultado  IS NULL
    ORDER  BY numero_ciclo DESC
    LIMIT  1
    FOR UPDATE;

    IF v_ciclo_id IS NULL THEN
      RAISE EXCEPTION 'No existe ciclo reproductivo activo para el animal: %', v_animal.id;
    END IF;

    -- Crear evento MACHORRA ligado al ciclo
    INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id)
    VALUES (v_tipo_evento_id, v_animal.especie, v_fecha, v_ciclo_id)
    RETURNING id INTO v_evento_id;

    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_evento_id, v_animal.id, 'madre');

    -- Cerrar ciclo actual (AND resultado IS NULL: guardia de inmutabilidad)
    UPDATE ciclo_reproductivo
    SET    fecha_fin = v_fecha,
           resultado = 'machorra'
    WHERE  id       = v_ciclo_id
      AND  resultado IS NULL;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No se pudo cerrar el ciclo %: ya tiene resultado fijado', v_ciclo_id;
    END IF;

    -- Abrir nuevo ciclo en vacía (siempre ocurre: es_reproductora validado arriba)
    SELECT COALESCE(MAX(numero_ciclo), 0) + 1 INTO v_nuevo_ciclo_num
    FROM   ciclo_reproductivo
    WHERE  animal_id = v_animal.id;

    INSERT INTO ciclo_reproductivo (animal_id, numero_ciclo, fecha_inicio)
    VALUES (v_animal.id, v_nuevo_ciclo_num, v_fecha);

    -- Proyectar estado del animal
    UPDATE animal
    SET    estado_reproductivo  = 'vacia',
           fecha_prevista_parto = NULL
    WHERE  id = v_animal.id;

  END LOOP;

  -- Detectar IDs inexistentes (no aparecen en el loop → v_procesados < longitud array)
  IF v_procesados != array_length(p_animal_ids, 1) THEN
    RAISE EXCEPTION 'Uno o más animales de la lista no existen';
  END IF;

  RETURN jsonb_build_object(
    'ok',        true,
    'procesados', v_procesados,
    'fecha',     v_fecha
  );
END;
$$;

GRANT EXECUTE ON FUNCTION registrar_machorra_animales(UUID[]) TO authenticated;
