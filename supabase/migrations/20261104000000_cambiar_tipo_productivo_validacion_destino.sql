-- ─────────────────────────────────────────────────────────────────────────────
-- cambiar_tipo_productivo: validación del tipo destino en backend
--
-- Base: 20260819000000_fecha_entrada_salida_cambio_tipo.sql (única definición previa;
-- ninguna migration posterior la redefine ni altera columnas/enums que use).
-- Cambio mínimo: se añade el bloque "Validación del tipo destino" y la lectura del
-- tipo nuevo se amplía a (nombre, especie, activa). El resto del cuerpo es idéntico.
--
-- Hasta ahora estas restricciones solo existían en la UI
-- (getTiposProductivosDisponibles). Una llamada directa al RPC podía, por ejemplo,
-- asignar 'Reproductora' a un macho o 'Cría' a un adulto. Las reglas de negocio
-- críticas deben protegerse en backend (CLAUDE.md §10).
--
-- Reglas nuevas sobre el tipo destino:
--   f) Debe existir en el catálogo.
--   g) Debe pertenecer a la misma especie que el animal.
--   h) Debe estar activo (activa = true).
--   i) No puede ser 'Cría': solo la asigna el parto.
--   j) Tipos ligados al sexo:
--        Reproductora → solo hembras
--        Semental / Verraco → solo machos (Verraco = equivalente porcino de Semental)
--      Con sexo NULL (sin identificar) se rechaza pidiendo identificar el sexo.
--
-- Espejo TS (solo para guiar la UI): validarTipoProductivoDestino en
-- modules/ganadero/animales/domain/rules.ts. Mantener los mensajes alineados.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cambiar_tipo_productivo(
  p_animal_id                UUID,
  p_nuevo_tipo_productivo_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_estado_vital         estado_vital_enum;
  v_especie              especie_enum;
  v_sexo                 sexo_enum;
  v_crotal               TEXT;
  v_tipo_anterior_id     UUID;
  v_tipo_anterior_nombre TEXT;
  v_tipo_nuevo_nombre    TEXT;
  v_tipo_nuevo_especie   especie_enum;
  v_tipo_nuevo_activa    BOOLEAN;
  v_sexo_requerido       sexo_enum;
  v_era_reproductora     BOOLEAN;
  v_sera_reproductora    BOOLEAN;
  v_tipo_evento_id       UUID;
  v_evento_id            UUID;
  v_estado_repro         estado_reproductivo_enum;
  v_ciclo_abierto_id     UUID;
  v_nuevo_ciclo_num      INT;
BEGIN
  -- Bloquear fila para evitar condiciones de carrera
  SELECT estado_vital, especie, sexo, crotal, tipo_productivo_id, es_reproductora
  INTO   v_estado_vital, v_especie, v_sexo, v_crotal, v_tipo_anterior_id, v_era_reproductora
  FROM   animal WHERE id = p_animal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Animal no encontrado: %', p_animal_id;
  END IF;

  IF v_estado_vital != 'vivo' THEN
    RAISE EXCEPTION 'No se puede cambiar el tipo productivo de un animal que no está vivo (estado_vital: "%")', v_estado_vital;
  END IF;

  IF v_tipo_anterior_id = p_nuevo_tipo_productivo_id THEN
    RAISE EXCEPTION 'El animal ya tiene el tipo productivo seleccionado';
  END IF;

  -- ── Validación del tipo destino ──────────────────────────────────────────
  -- Se valida ANTES de cualquier escritura: el RPC no inserta nada si el destino no es válido.
  SELECT nombre, especie, activa
  INTO   v_tipo_nuevo_nombre, v_tipo_nuevo_especie, v_tipo_nuevo_activa
  FROM   tipo_productivo WHERE id = p_nuevo_tipo_productivo_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tipo productivo no encontrado: %', p_nuevo_tipo_productivo_id;
  END IF;

  IF v_tipo_nuevo_especie != v_especie THEN
    RAISE EXCEPTION 'El tipo productivo % no corresponde a la especie del animal (%)', v_tipo_nuevo_nombre, v_especie;
  END IF;

  IF NOT v_tipo_nuevo_activa THEN
    RAISE EXCEPTION 'El tipo productivo % está desactivado', v_tipo_nuevo_nombre;
  END IF;

  IF v_tipo_nuevo_nombre = 'Cría' THEN
    RAISE EXCEPTION 'El tipo Cría solo se asigna al nacer; no puede elegirse en un cambio de tipo productivo.';
  END IF;

  -- Tipos ligados al sexo. NULL = el tipo no depende del sexo.
  v_sexo_requerido := CASE v_tipo_nuevo_nombre
    WHEN 'Reproductora' THEN 'hembra'::sexo_enum
    WHEN 'Semental'     THEN 'macho'::sexo_enum
    WHEN 'Verraco'      THEN 'macho'::sexo_enum
    ELSE NULL
  END;

  IF v_sexo_requerido IS NOT NULL THEN
    IF v_sexo IS NULL THEN
      RAISE EXCEPTION 'Indica el sexo del animal antes de cambiar su tipo productivo a %.', v_tipo_nuevo_nombre;
    END IF;
    IF v_sexo != v_sexo_requerido THEN
      RAISE EXCEPTION 'El tipo % solo puede asignarse a %.',
        v_tipo_nuevo_nombre,
        CASE v_sexo_requerido WHEN 'hembra' THEN 'hembras' ELSE 'machos' END;
    END IF;
  END IF;
  -- ─────────────────────────────────────────────────────────────────────────

  -- Resolver nombre del tipo anterior para el evento
  SELECT nombre INTO v_tipo_anterior_nombre FROM tipo_productivo WHERE id = v_tipo_anterior_id;

  -- es_reproductora se deriva del sexo y del nuevo tipo productivo
  v_sera_reproductora := (v_sexo = 'hembra' AND v_tipo_nuevo_nombre = 'Reproductora');

  -- Buscar el ciclo abierto ANTES de insertar el evento para poder vincularlo.
  -- Solo aplica cuando el animal deja de ser reproductora.
  -- ORDER BY numero_ciclo DESC garantiza que se selecciona el ciclo más reciente
  -- si hubiera múltiples ciclos sin fecha_fin (p.ej. ciclos re-abiertos por backfill).
  IF v_era_reproductora AND NOT v_sera_reproductora THEN
    SELECT id INTO v_ciclo_abierto_id
    FROM   ciclo_reproductivo
    WHERE  animal_id = p_animal_id
      AND  fecha_fin IS NULL
      AND  resultado IS NULL
    ORDER BY numero_ciclo DESC
    LIMIT  1;
  END IF;

  -- Registrar el evento vinculado al ciclo activo (cuando aplica)
  v_tipo_evento_id := _resolve_tipo_evento_id('CAMBIO_TIPO_PRODUCTIVO');

  INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
  VALUES (
    v_tipo_evento_id, v_especie, CURRENT_DATE, v_ciclo_abierto_id,
    jsonb_build_object(
      'tipo_anterior', v_tipo_anterior_nombre,
      'tipo_nuevo',    v_tipo_nuevo_nombre
    )
  )
  RETURNING id INTO v_evento_id;

  -- rol NULL: este evento no tiene rol madre/cría, igual que registrar_salida_animal
  INSERT INTO evento_animales (evento_id, animal_id)
  VALUES (v_evento_id, p_animal_id);

  -- Aplicar el cambio de tipo productivo en el snapshot del animal
  UPDATE animal
  SET tipo_productivo_id = p_nuevo_tipo_productivo_id,
      es_reproductora    = v_sera_reproductora
  WHERE id = p_animal_id;

  -- ── Consecuencias sobre el ciclo reproductivo ──────────────────────────────

  IF v_era_reproductora AND NOT v_sera_reproductora THEN
    -- ── Reproductora → No reproductora ──────────────────────────────────────
    -- Solo permitido en vacía o cubierta. Gestante queda bloqueado.
    IF v_ciclo_abierto_id IS NOT NULL THEN
      SELECT estado_reproductivo INTO v_estado_repro
      FROM   animal WHERE id = p_animal_id;

      -- Bloqueo de seguridad a nivel DB: la UI ya lo impide, pero protegemos el invariante.
      IF v_estado_repro = 'gestante' THEN
        RAISE EXCEPTION 'No se puede cambiar el tipo productivo de un animal gestante. Registra primero el parto o el aborto.';
      END IF;

      UPDATE ciclo_reproductivo
      SET fecha_fin = CURRENT_DATE,
          resultado = 'cierre_manual'
      WHERE id = v_ciclo_abierto_id;
    END IF;

    UPDATE animal
    SET estado_reproductivo  = NULL,
        fecha_prevista_parto = NULL
    WHERE id = p_animal_id;

  ELSIF NOT v_era_reproductora AND v_sera_reproductora THEN
    -- ── No reproductora → Reproductora ──────────────────────────────────────
    -- Se crea SIEMPRE un nuevo ciclo en estado VACÍA.
    -- No importa si existen ciclos anteriores cerrados o incluso abiertos por
    -- errores de datos: el nuevo ciclo es un punto de inicio limpio.
    SELECT COALESCE(MAX(numero_ciclo), 0) + 1
    INTO   v_nuevo_ciclo_num
    FROM   ciclo_reproductivo
    WHERE  animal_id = p_animal_id;

    INSERT INTO ciclo_reproductivo (animal_id, numero_ciclo, fecha_inicio)
    VALUES (p_animal_id, v_nuevo_ciclo_num, CURRENT_DATE);

    UPDATE animal
    SET estado_reproductivo = 'vacia'
    WHERE id = p_animal_id;
  END IF;

END;
$$;
