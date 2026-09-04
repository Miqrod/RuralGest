-- =============================================================================
-- registrar_destete_lote: destete atómico de múltiples crías en una transacción
--
-- Problema resuelto:
--   El flujo anterior llamaba a registrar_destete una vez por cría desde el
--   cliente (for loop en FormDestete.tsx). Si fallaba la N-ésima cría, las
--   anteriores ya estaban committed y el sistema quedaba en estado parcial.
--
-- Invariante de dominio:
--   El ciclo_id de cada evento DESTETE es el HISTÓRICO de la cría —obtenido
--   via parto_evento_id— y nunca el ciclo reproductivo abierto actual de la
--   madre, aunque éste exista en paralelo.
--
-- Contrato:
--   - Todas las crías deben ser elegibles. Si una falla, RAISE EXCEPTION y
--     Postgres hace rollback automático de toda la transacción.
--   - Cada cría recibe su propio evento DESTETE con su ciclo_id histórico.
--   - El cierre de ciclo se evalúa al final, tras actualizar todas las crías,
--     para garantizar que la cuenta de vínculos activos sea correcta.
--   - Retorna JSONB: { destetes: [{criaId, eventoId}], cicloCerrado: boolean }
--
-- Ref: PRD013-fix T236
-- =============================================================================
CREATE OR REPLACE FUNCTION registrar_destete_lote(
  p_cria_ids      UUID[],
  p_fecha         DATE,
  p_observaciones TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cria_id            UUID;
  v_cria               RECORD;
  v_tp_nombre          TEXT;
  v_tipo_evento_id     UUID;
  v_tipo_productivo_id UUID;
  v_evento_id          UUID;
  v_ciclo_id           UUID;
  v_active_bonds       INT;
  -- Acumula los ciclo_ids afectados para evaluar cierre al final
  v_ciclos_afectados   UUID[] := '{}';
  -- Resultado final
  v_destetes           JSONB  := '[]'::JSONB;
  v_ciclo_cerrado      BOOLEAN := false;
BEGIN
  -- ── 0. Guardias previas al loop ───────────────────────────────────────────
  IF array_length(p_cria_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Se requiere al menos una cría para registrar el destete';
  END IF;

  IF p_fecha > CURRENT_DATE THEN
    RAISE EXCEPTION 'La fecha del destete no puede ser futura (fecha: %)', p_fecha;
  END IF;

  -- Resolver tipo_evento una sola vez para todas las crías
  v_tipo_evento_id := _resolve_tipo_evento_id('DESTETE');

  -- ── 1. Procesar cada cría ─────────────────────────────────────────────────
  FOREACH v_cria_id IN ARRAY p_cria_ids LOOP

    -- Cargar y bloquear la cría (FOR UPDATE evita condiciones de carrera)
    SELECT
      a.id,
      a.especie,
      a.estado_vital,
      a.estado_vinculo_materno,
      a.madre_id,
      a.parto_evento_id,
      a.tipo_productivo_id,
      a.fecha_nacimiento
    INTO v_cria
    FROM animal a
    WHERE a.id = v_cria_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cría no encontrada: %', v_cria_id;
    END IF;

    -- Resolver nombre del tipo productivo
    SELECT nombre INTO v_tp_nombre
    FROM tipo_productivo
    WHERE id = v_cria.tipo_productivo_id;

    -- Validaciones de elegibilidad (mismas que registrar_destete unitario)
    IF v_tp_nombre IS DISTINCT FROM 'Cría' THEN
      RAISE EXCEPTION 'El animal % no está en etapa "Cría" (tipo actual: %)',
        v_cria_id, COALESCE(v_tp_nombre, 'sin tipo');
    END IF;

    IF v_cria.estado_vital != 'vivo' THEN
      RAISE EXCEPTION 'La cría % no está viva (estado: %)',
        v_cria_id, v_cria.estado_vital;
    END IF;

    IF v_cria.estado_vinculo_materno IS DISTINCT FROM 'activo' THEN
      RAISE EXCEPTION 'El vínculo materno de la cría % no está activo (estado: %)',
        v_cria_id, COALESCE(v_cria.estado_vinculo_materno::text, 'NULL');
    END IF;

    -- Coherencia temporal: destete no puede ser anterior al nacimiento
    IF v_cria.fecha_nacimiento IS NOT NULL AND p_fecha < v_cria.fecha_nacimiento THEN
      RAISE EXCEPTION 'La fecha del destete (%) no puede ser anterior a la fecha de nacimiento de la cría % (%)',
        p_fecha, v_cria_id, v_cria.fecha_nacimiento;
    END IF;

    -- Actualizar la cría: Cría → Recría, vínculo → finalizado
    SELECT id INTO v_tipo_productivo_id
    FROM tipo_productivo
    WHERE nombre = 'Recría' AND especie = v_cria.especie
    LIMIT 1;

    UPDATE animal
    SET tipo_productivo_id     = v_tipo_productivo_id,
        estado_vinculo_materno = 'finalizado'
    WHERE id = v_cria_id;

    -- Obtener ciclo histórico de la cría via su evento de parto.
    -- Este es el ciclo del PARTO que originó a esta cría, no el ciclo abierto
    -- actual de la madre. Pueden coexistir en paralelo sin conflicto.
    v_ciclo_id := NULL;
    IF v_cria.parto_evento_id IS NOT NULL THEN
      SELECT ciclo_id INTO v_ciclo_id
      FROM eventos
      WHERE id = v_cria.parto_evento_id;
    END IF;

    -- Crear evento DESTETE para esta cría con su ciclo_id histórico
    INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
    VALUES (
      v_tipo_evento_id,
      v_cria.especie,
      p_fecha,
      v_ciclo_id,
      CASE WHEN p_observaciones IS NOT NULL
        THEN jsonb_build_object('observaciones', p_observaciones)
        ELSE NULL
      END
    )
    RETURNING id INTO v_evento_id;

    -- Asociar cría y madre al evento
    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_evento_id, v_cria_id, 'cria');

    IF v_cria.madre_id IS NOT NULL THEN
      INSERT INTO evento_animales (evento_id, animal_id, rol)
      VALUES (v_evento_id, v_cria.madre_id, 'madre');
    END IF;

    -- Acumular resultado de esta cría
    v_destetes := v_destetes || jsonb_build_object(
      'criaId',   v_cria_id,
      'eventoId', v_evento_id
    );

    -- Registrar ciclo afectado para evaluación posterior (deduplicando)
    IF v_ciclo_id IS NOT NULL AND NOT (v_ciclo_id = ANY(v_ciclos_afectados)) THEN
      v_ciclos_afectados := v_ciclos_afectados || v_ciclo_id;
    END IF;

  END LOOP;

  -- ── 2. Evaluar cierre de ciclos tras procesar TODAS las crías ─────────────
  -- Se hace al final para que la cuenta de vínculos activos sea correcta:
  -- si desteto 2 crías del mismo ciclo, la primera no debe cerrar el ciclo
  -- antes de que la segunda también esté marcada como finalizada.
  FOREACH v_ciclo_id IN ARRAY v_ciclos_afectados LOOP

    SELECT COUNT(*) INTO v_active_bonds
    FROM animal
    WHERE parto_evento_id IN (SELECT id FROM eventos WHERE ciclo_id = v_ciclo_id)
      AND estado_vinculo_materno = 'activo'
      AND estado_vital = 'vivo';

    IF v_active_bonds = 0 THEN
      -- Solo cierra ciclos que ya tienen resultado reproductivo fijado
      -- (resultado IS NOT NULL: establecido por registrar_parto).
      -- Evita cerrar accidentalmente ciclos aún en curso.
      UPDATE ciclo_reproductivo
      SET fecha_fin = p_fecha
      WHERE id = v_ciclo_id
        AND fecha_fin IS NULL
        AND resultado IS NOT NULL;

      IF FOUND THEN
        v_ciclo_cerrado := true;
      END IF;
    END IF;

  END LOOP;

  RETURN jsonb_build_object(
    'destetes',     v_destetes,
    'cicloCerrado', v_ciclo_cerrado
  );
END;
$$;
