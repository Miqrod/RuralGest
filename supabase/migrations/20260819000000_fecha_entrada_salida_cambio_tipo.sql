-- =============================================================================
-- fecha_entrada, fecha_salida y cambio de tipo productivo
--
-- Objetivos:
--   1. Añadir fecha_entrada y fecha_salida a la tabla animal
--   2. Retroalimentar (backfill) datos históricos coherentes
--   3. Desvincular registrar_salida_animal del cierre de ciclo:
--      la salida ya no cierra el ciclo propio de la reproductora
--   4. Registrar fecha_entrada en altas (compra + parto)
--   5. Crear el RPC cambiar_tipo_productivo para cambiar el tipo productivo
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Nuevas columnas
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE animal
  ADD COLUMN IF NOT EXISTS fecha_entrada DATE NULL,
  ADD COLUMN IF NOT EXISTS fecha_salida  DATE NULL;

COMMENT ON COLUMN animal.fecha_entrada IS
  'Fecha en que el animal entró en la explotación (compra) o nació (origen interno).';

COMMENT ON COLUMN animal.fecha_salida IS
  'Fecha de salida definitiva del animal (venta o muerte). NULL mientras el animal está vivo.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Backfill: fecha_salida para animales vendidos / muertos que ya existían
--
-- Antes de esta migración, registrar_salida_animal cerraba el ciclo reproductivo
-- con resultado='cierre_manual'. Esos ciclos son los que debemos usar para
-- retroalimentar fecha_salida y luego re-abrir (resultado=NULL, fecha_fin=NULL).
-- ─────────────────────────────────────────────────────────────────────────────

-- 2a. Transferir fecha_fin del ciclo 'cierre_manual' → animal.fecha_salida
UPDATE animal a
SET    fecha_salida = cr.fecha_fin
FROM   ciclo_reproductivo cr
WHERE  cr.animal_id = a.id
  AND  cr.resultado = 'cierre_manual'
  AND  cr.fecha_fin IS NOT NULL
  AND  a.estado_vital IN ('vendido', 'muerto')
  AND  a.fecha_salida IS NULL;   -- idempotente: no sobreescribir si ya tiene valor

-- 2b. Re-abrir esos ciclos: cierre_manual en animales vendidos/muertos
--     era un artefacto de registrar_salida_animal, no un desenlace reproductivo real.
--     El ciclo queda abierto (NULL/NULL) y el carrusel mostrará la anotación contextual.
UPDATE ciclo_reproductivo cr
SET    resultado = NULL,
       fecha_fin = NULL
FROM   animal a
WHERE  cr.animal_id = a.id
  AND  cr.resultado = 'cierre_manual'
  AND  a.estado_vital IN ('vendido', 'muerto');


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Backfill: fecha_entrada para animales ya existentes
--
-- - Origen 'interno' (nacidos en explotación): fecha_entrada = fecha_nacimiento
-- - Origen 'compra': fecha_entrada = fecha del evento de creación del animal
-- ─────────────────────────────────────────────────────────────────────────────

-- 3a. Nacidos en la explotación
UPDATE animal
SET    fecha_entrada = fecha_nacimiento
WHERE  origen = 'interno'
  AND  fecha_nacimiento IS NOT NULL
  AND  fecha_entrada IS NULL;

-- 3b. Comprados: obtener la fecha del evento de alta
UPDATE animal a
SET    fecha_entrada = e.fecha
FROM   eventos e
WHERE  e.id = a.evento_creacion_id
  AND  a.origen = 'compra'
  AND  a.fecha_entrada IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Nuevo tipo de evento: CAMBIO_TIPO_PRODUCTIVO
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO tipo_evento (
  codigo, descripcion,
  tipo_tecnico, tipo_negocio,
  es_biologico, requiere_motivo,
  afecta_stock, afecta_animales, afecta_lotes
) VALUES (
  'CAMBIO_TIPO_PRODUCTIVO', 'Cambio de tipo productivo del animal',
  'OPERATIVO', 'gestion',
  false, false,
  false, true, false
) ON CONFLICT (codigo) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Recrear registrar_compra_animal: añadir fecha_entrada
-- ─────────────────────────────────────────────────────────────────────────────

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
  v_tipo_evento_id := _resolve_tipo_evento_id('ENTRADA');
  v_motivo_id      := _resolve_motivo_id('compra');

  -- es_reproductora: solo hembras con tipo_productivo 'Reproductora'
  SELECT nombre INTO v_tp_nombre FROM tipo_productivo WHERE id = p_tipo_productivo_id;
  v_es_reproductora := (p_sexo = 'hembra' AND v_tp_nombre = 'Reproductora');

  -- 1. Evento: fuente de verdad del sistema
  INSERT INTO eventos (tipo_evento_id, motivo_id, especie, fecha)
  VALUES (v_tipo_evento_id, v_motivo_id, p_especie, p_fecha_compra)
  RETURNING id INTO v_evento_id;

  -- 2. Animal: la fecha de compra es también la fecha de entrada
  INSERT INTO animal (
    especie, sexo, tipo_productivo_id,
    crotal, num_hierro, raza_id,
    fecha_nacimiento, fecha_nacimiento_estimada,
    lote_id,
    origen, fecha_entrada,
    evento_creacion_id, evento_origen_id,
    es_reproductora,
    estado_vital, estado_sanitario, estado_reproductivo
  ) VALUES (
    p_especie, p_sexo, p_tipo_productivo_id,
    p_crotal, p_num_hierro, p_raza_id,
    p_fecha_nacimiento, p_fecha_nacimiento_estimada,
    p_lote_id,
    'compra', p_fecha_compra,
    v_evento_id, v_evento_id,
    v_es_reproductora,
    'vivo', 'sano', NULL
  ) RETURNING id INTO v_animal_id;

  -- 3. Asociación N:M evento ↔ animal
  INSERT INTO evento_animales (evento_id, animal_id)
  VALUES (v_evento_id, v_animal_id);

  RETURN v_animal_id;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Recrear registrar_parto: añadir fecha_entrada en las crías
--
-- Crías vivas y muertas nacen hoy → fecha_entrada = p_fecha (fecha del parto).
-- El resto del cuerpo de la función permanece sin cambios.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION registrar_parto(
  p_animal_id      UUID,
  p_fecha          DATE,
  p_ciclo_id       UUID,
  p_numero_nacidos INT,
  p_numero_vivos   INT,
  p_numero_muertos INT,
  p_tipo_parto     tipo_parto_enum,
  p_padre_id       UUID    DEFAULT NULL,
  p_raza_cria_id   UUID    DEFAULT NULL,
  p_observaciones  TEXT    DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tipo_evento_id  UUID;
  v_evento_id       UUID;
  v_especie         especie_enum;
  v_estado_vital    estado_vital_enum;
  v_crotal          TEXT;
  v_es_reproductora BOOLEAN;
  v_tp_id_cria      UUID;
  v_cria_id         UUID;
  v_crias_ids       UUID[] := '{}';
  v_nuevo_ciclo_num INT;
BEGIN
  -- Anti-concurrencia: bloquear la madre antes de cualquier escritura
  SELECT estado_vital, especie, crotal, es_reproductora
  INTO   v_estado_vital, v_especie, v_crotal, v_es_reproductora
  FROM   animal WHERE id = p_animal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Animal no encontrado: %', p_animal_id;
  END IF;

  IF v_estado_vital != 'vivo' THEN
    RAISE EXCEPTION 'El animal% no puede recibir eventos: estado_vital es "%"',
      CASE WHEN v_crotal IS NOT NULL THEN ' (crotal: ' || v_crotal || ')' ELSE '' END,
      v_estado_vital;
  END IF;

  -- Tipo productivo 'Cría' para todas las crías vivas recién nacidas
  SELECT id INTO v_tp_id_cria
  FROM   tipo_productivo WHERE nombre = 'Cría' AND especie = v_especie LIMIT 1;

  v_tipo_evento_id := _resolve_tipo_evento_id('PARTO');

  -- 1. Evento
  INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
  VALUES (
    v_tipo_evento_id, v_especie, p_fecha, p_ciclo_id,
    jsonb_build_object(
      'tipo_parto',     p_tipo_parto,
      'numero_nacidos', p_numero_nacidos,
      'numero_vivos',   p_numero_vivos,
      'numero_muertos', p_numero_muertos,
      'observaciones',  p_observaciones
    )
  )
  RETURNING id INTO v_evento_id;

  -- 2. Detalle especializado del parto
  INSERT INTO evento_parto (evento_id, numero_nacidos, numero_vivos, numero_muertos, tipo_parto, observaciones)
  VALUES (v_evento_id, p_numero_nacidos, p_numero_vivos, p_numero_muertos, p_tipo_parto, p_observaciones);

  -- 3. Asociación evento ↔ madre
  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_animal_id, 'madre');

  -- 4. Una entidad Animal por cada cría viva
  FOR v_cria_id IN
    SELECT gen_random_uuid() FROM generate_series(1, p_numero_vivos)
  LOOP
    INSERT INTO animal (
      id, especie, origen,
      madre_id, padre_id, raza_id,
      tipo_productivo_id, parto_evento_id, evento_creacion_id,
      fecha_nacimiento, fecha_entrada,
      estado_vital, estado_identificacion, estado_vinculo_materno
    )
    VALUES (
      v_cria_id, v_especie, 'interno',
      p_animal_id, p_padre_id, p_raza_cria_id,
      v_tp_id_cria, v_evento_id, v_evento_id,
      p_fecha, p_fecha,
      'vivo', 'pendiente', 'activo'
    );

    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_evento_id, v_cria_id, 'cria');

    v_crias_ids := array_append(v_crias_ids, v_cria_id);
  END LOOP;

  -- 5. Una entidad Animal por cada cría nacida muerta
  FOR v_cria_id IN
    SELECT gen_random_uuid() FROM generate_series(1, p_numero_muertos)
  LOOP
    INSERT INTO animal (
      id, especie, origen,
      madre_id, padre_id, raza_id,
      tipo_productivo_id, parto_evento_id, evento_creacion_id,
      fecha_nacimiento, fecha_entrada,
      estado_vital, estado_vinculo_materno
    )
    VALUES (
      v_cria_id, v_especie, 'interno',
      p_animal_id, p_padre_id, p_raza_cria_id,
      NULL, v_evento_id, v_evento_id,
      p_fecha, p_fecha,
      'muerto', 'finalizado'
    );

    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_evento_id, v_cria_id, 'cria');
  END LOOP;

  -- 6. Fijar resultado del ciclo: 'parto' (ciclo sigue abierto hasta destete)
  UPDATE ciclo_reproductivo
  SET resultado = 'parto'
  WHERE id = p_ciclo_id;

  -- 7. Consecuencias sobre la madre
  IF v_es_reproductora THEN
    SELECT COALESCE(MAX(numero_ciclo), 0) + 1
    INTO   v_nuevo_ciclo_num
    FROM   ciclo_reproductivo
    WHERE  animal_id = p_animal_id;

    INSERT INTO ciclo_reproductivo (animal_id, numero_ciclo, fecha_inicio)
    VALUES (p_animal_id, v_nuevo_ciclo_num, p_fecha);

    UPDATE animal
    SET estado_reproductivo  = 'vacia',
        fecha_prevista_parto = NULL
    WHERE id = p_animal_id;
  ELSE
    UPDATE animal
    SET estado_reproductivo  = NULL,
        fecha_prevista_parto = NULL
    WHERE id = p_animal_id;
  END IF;

  RETURN jsonb_build_object(
    'eventoId', v_evento_id,
    'criasIds',  v_crias_ids
  );
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Recrear registrar_salida_animal: añadir fecha_salida, eliminar cierre
--    del ciclo propio de la reproductora (paso 5 del original)
--
-- El ciclo de la reproductora permanece abierto después de la salida.
-- El carrusel detectará el ciclo abierto + fecha_salida y mostrará la anotación
-- contextual "Animal vendido/fallecido · Historia reproductiva finalizada".
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION registrar_salida_animal(
  p_animal_id UUID,
  p_motivo    TEXT,   -- 'venta' | 'muerte'
  p_fecha     DATE
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_estado_actual    estado_vital_enum;
  v_especie          especie_enum;
  v_crotal           TEXT;
  v_madre_id         UUID;
  v_parto_evento_id  UUID;
  v_vinculo          vinculo_materno_enum;
  v_tipo_evento_id   UUID;
  v_motivo_id        UUID;
  v_evento_id        UUID;
  v_nuevo_estado     estado_vital_enum;
  v_ciclo_id         UUID;
  v_active_bonds     INT;
BEGIN
  -- Anti-concurrencia: bloquear la fila antes de cualquier escritura
  SELECT estado_vital, especie, crotal, madre_id, parto_evento_id, estado_vinculo_materno
  INTO   v_estado_actual, v_especie, v_crotal, v_madre_id, v_parto_evento_id, v_vinculo
  FROM   animal WHERE id = p_animal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Animal no encontrado: %', p_animal_id;
  END IF;

  IF v_estado_actual != 'vivo' THEN
    RAISE EXCEPTION 'El animal% no puede salir: estado_vital actual es "%"',
      CASE WHEN v_crotal IS NOT NULL THEN ' (crotal: ' || v_crotal || ')' ELSE '' END,
      v_estado_actual;
  END IF;

  IF p_motivo = 'venta' THEN
    v_nuevo_estado := 'vendido';
  ELSIF p_motivo = 'muerte' THEN
    v_nuevo_estado := 'muerto';
  ELSE
    RAISE EXCEPTION 'Motivo de salida no reconocido: "%"', p_motivo;
  END IF;

  v_tipo_evento_id := _resolve_tipo_evento_id('SALIDA');
  v_motivo_id      := _resolve_motivo_id(p_motivo);

  -- 1. Evento: fuente de verdad del sistema
  INSERT INTO eventos (tipo_evento_id, motivo_id, especie, fecha)
  VALUES (v_tipo_evento_id, v_motivo_id, v_especie, p_fecha)
  RETURNING id INTO v_evento_id;

  -- 2. Asociación N:M evento ↔ animal
  INSERT INTO evento_animales (evento_id, animal_id)
  VALUES (v_evento_id, p_animal_id);

  -- 3. Actualizar snapshot del animal: nuevo estado vital + fecha de salida.
  --    El ciclo reproductivo propio (si existía) queda abierto intencionalmente:
  --    el carrusel lo mostrará con anotación contextual usando fecha_salida.
  UPDATE animal
  SET estado_vital         = v_nuevo_estado,
      estado_reproductivo  = NULL,
      fecha_prevista_parto = NULL,
      fecha_salida         = p_fecha
  WHERE id = p_animal_id;

  -- 4. Finalizar vínculo materno si la cría lo tenía activo
  --    y cerrar el ciclo de la madre si ya no quedan crías con vínculo activo.
  IF v_vinculo = 'activo' AND v_madre_id IS NOT NULL AND v_parto_evento_id IS NOT NULL THEN

    UPDATE animal
    SET estado_vinculo_materno = 'finalizado'
    WHERE id = p_animal_id;

    -- Resolver el ciclo de la madre a través del evento de parto que originó esta cría
    SELECT ciclo_id INTO v_ciclo_id
    FROM   eventos WHERE id = v_parto_evento_id;

    IF v_ciclo_id IS NOT NULL THEN
      SELECT COUNT(*) INTO v_active_bonds
      FROM   animal a
      JOIN   eventos e ON e.id = a.parto_evento_id
      WHERE  e.ciclo_id = v_ciclo_id
        AND  a.estado_vinculo_materno = 'activo'
        AND  a.estado_vital = 'vivo';

      -- Solo fecha_fin: resultado ya fue fijado como 'parto' por registrar_parto
      IF v_active_bonds = 0 THEN
        UPDATE ciclo_reproductivo
        SET fecha_fin = p_fecha
        WHERE id = v_ciclo_id
          AND fecha_fin IS NULL
          AND resultado IS NOT NULL;
      END IF;
    END IF;

  END IF;

  -- NOTA: el ciclo reproductivo PROPIO de la reproductora que sale ya NO se cierra aquí.
  -- Su historia reproductiva queda visible en el carrusel con la anotación contextual.

  RETURN v_evento_id;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Nuevo RPC: cambiar_tipo_productivo
--
-- Permite cambiar el tipo productivo de un animal vivo.
-- Reglas de negocio aplicadas:
--
--   a) Solo animales vivos pueden cambiar de tipo productivo.
--   b) es_reproductora se recalcula: true solo si sexo='hembra' Y tipo='Reproductora'.
--   c) Si el animal deja de ser reproductora con ciclo en vacía/cubierta:
--      se cierra el ciclo con resultado='cierre_manual'.
--   d) Si el animal deja de ser reproductora con ciclo en gestante:
--      el ciclo NO se toca (la gestación continúa hasta su desenlace).
--   e) Si el animal vuelve a ser reproductora: se crea SIEMPRE un nuevo ciclo
--      en estado VACÍA, independientemente de ciclos anteriores.
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

  -- Resolver nombres de catálogo para el evento y para calcular es_reproductora
  SELECT nombre INTO v_tipo_anterior_nombre FROM tipo_productivo WHERE id = v_tipo_anterior_id;
  SELECT nombre INTO v_tipo_nuevo_nombre    FROM tipo_productivo WHERE id = p_nuevo_tipo_productivo_id;

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
