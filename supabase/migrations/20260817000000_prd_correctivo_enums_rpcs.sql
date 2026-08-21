-- =============================================================================
-- PRD-CORRECTIVO: Redefinición del modelo reproductivo
--
-- Cambios en enums:
--   estado_reproductivo_enum: eliminar 'lactante'
--     La lactancia es una relación temporal madre-cría, derivada de
--     estado_vinculo_materno = 'activo', nunca un estado reproductivo.
--     EstadoReproductivo = 'vacia' | 'cubierta' | 'gestante'
--
--   resultado_ciclo_enum: eliminar 'desconocido', 'venta', 'muerte'; añadir 'machorra', 'cierre_manual'
--     Los desenlaces de un ciclo son reproductivos, no eventos de salida del animal.
--     ResultadoCiclo = 'parto' | 'aborto' | 'machorra' | 'cierre_manual'
--
-- Cambios en RPCs:
--   registrar_parto: eliminar p_estado_reproductivo (siempre 'vacia' post-parto).
--     Fija resultado='parto' en el ciclo actual pero NO fecha_fin (ciclo sigue abierto
--     hasta el último destete). Si es_reproductora: crea nuevo ciclo VACÍA.
--
--   registrar_cubricion: eliminar rama de creación de ciclo.
--     p_ciclo_id siempre provisto por evalCycleRules ('reutilizar' siempre).
--
--   registrar_confirmacion_gestacion: igual que cubricion.
--     p_ciclo_id siempre provisto; el ciclo VACÍA ya existe.
--
--   registrar_destete: al cerrar el ciclo, solo actualizar fecha_fin.
--     resultado ya fue fijado por registrar_parto con valor 'parto'.
--
--   registrar_salida_animal: eliminar 'venta'/'muerte' como resultado de ciclo.
--     El ciclo de la reproductora que sale se cierra con resultado='cierre_manual'.
--     Al cerrar ciclo por último vínculo activo: solo fecha_fin (resultado ya 'parto').
--
-- Ref: PRD-CORRECTIVO §T158
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Eliminar funciones que referencian estado_reproductivo_enum en su firma
--    (Postgres no permite DROP TYPE si funciones lo usan en la firma)
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS registrar_parto(uuid, date, uuid, int, int, int, tipo_parto_enum, estado_reproductivo_enum, uuid, uuid, text);
DROP FUNCTION IF EXISTS registrar_cubricion(uuid, date, uuid, estado_reproductivo_enum, date, text, uuid, text);

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Redefinir estado_reproductivo_enum: eliminar 'lactante'
-- ─────────────────────────────────────────────────────────────────────────────

-- Normalizar datos: cualquier fila con 'lactante' pasa a 'vacia'
UPDATE animal SET estado_reproductivo = 'vacia' WHERE estado_reproductivo = 'lactante';

ALTER TABLE animal ALTER COLUMN estado_reproductivo TYPE TEXT;
DROP TYPE estado_reproductivo_enum;
CREATE TYPE estado_reproductivo_enum AS ENUM ('vacia', 'cubierta', 'gestante');
ALTER TABLE animal
  ALTER COLUMN estado_reproductivo TYPE estado_reproductivo_enum
  USING estado_reproductivo::estado_reproductivo_enum;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Redefinir resultado_ciclo_enum: limpiar + añadir valores
-- ─────────────────────────────────────────────────────────────────────────────

-- registrar_salida_animal declara v_resultado_ciclo resultado_ciclo_enum
-- → DROP explícito antes de DROP TYPE para evitar dependencias colgantes
DROP FUNCTION IF EXISTS registrar_salida_animal(uuid, text, date);

-- Convertir a TEXT primero para poder asignar 'cierre_manual' (aún no existe en enum)
ALTER TABLE ciclo_reproductivo ALTER COLUMN resultado TYPE TEXT;

-- Normalizar datos: los valores eliminados pasan a 'cierre_manual'
UPDATE ciclo_reproductivo
SET resultado = 'cierre_manual'
WHERE resultado IN ('desconocido', 'venta', 'muerte');

DROP TYPE resultado_ciclo_enum;
CREATE TYPE resultado_ciclo_enum AS ENUM ('parto', 'aborto', 'machorra', 'cierre_manual');
ALTER TABLE ciclo_reproductivo
  ALTER COLUMN resultado TYPE resultado_ciclo_enum
  USING resultado::resultado_ciclo_enum;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Recrear registrar_parto
-- ─────────────────────────────────────────────────────────────────────────────
-- Cambios:
--   - Eliminar p_estado_reproductivo (era DEFAULT 'lactante')
--   - Fijar resultado='parto' en el ciclo actual, pero fecha_fin=NULL (ciclo sigue abierto)
--   - Si es_reproductora: crear nuevo ciclo VACÍA + estado_reproductivo='vacia'
--   - Si !es_reproductora: estado_reproductivo=NULL, sin nuevo ciclo

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

  -- Tipo productivo inicial para crías vivas: 'Cría' (→ 'Recría' al destete)
  SELECT id INTO v_tp_id_cria
  FROM   tipo_productivo WHERE nombre = 'Cría' AND especie = v_especie LIMIT 1;

  v_tipo_evento_id := _resolve_tipo_evento_id('PARTO');

  -- 1. Evento: fuente de verdad del sistema
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

  -- 2. Detalle especializado del parto (1:1 con eventos)
  INSERT INTO evento_parto (evento_id, numero_nacidos, numero_vivos, numero_muertos, tipo_parto, observaciones)
  VALUES (v_evento_id, p_numero_nacidos, p_numero_vivos, p_numero_muertos, p_tipo_parto, p_observaciones);

  -- 3. Asociación evento ↔ madre
  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_animal_id, 'madre');

  -- 4. Una entidad Animal por cada cría viva
  --    parto_evento_id: FK al evento de origen (trazabilidad madre ↔ hijos)
  FOR v_cria_id IN
    SELECT gen_random_uuid() FROM generate_series(1, p_numero_vivos)
  LOOP
    INSERT INTO animal (
      id, especie, origen,
      madre_id, padre_id, raza_id,
      tipo_productivo_id, parto_evento_id, evento_creacion_id,
      fecha_nacimiento,
      estado_vital, estado_identificacion, estado_vinculo_materno
    )
    VALUES (
      v_cria_id, v_especie, 'interno',
      p_animal_id, p_padre_id, p_raza_cria_id,
      v_tp_id_cria, v_evento_id, v_evento_id,
      p_fecha,
      'vivo', 'pendiente', 'activo'
    );

    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_evento_id, v_cria_id, 'cria');

    v_crias_ids := array_append(v_crias_ids, v_cria_id);
  END LOOP;

  -- 5. Una entidad Animal por cada cría nacida muerta
  --    Sin workflow de identificación; vínculo finalizado (nunca existió dependencia funcional)
  FOR v_cria_id IN
    SELECT gen_random_uuid() FROM generate_series(1, p_numero_muertos)
  LOOP
    INSERT INTO animal (
      id, especie, origen,
      madre_id, padre_id, raza_id,
      tipo_productivo_id, parto_evento_id, evento_creacion_id,
      fecha_nacimiento,
      estado_vital, estado_vinculo_materno
    )
    VALUES (
      v_cria_id, v_especie, 'interno',
      p_animal_id, p_padre_id, p_raza_cria_id,
      NULL, v_evento_id, v_evento_id,
      p_fecha,
      'muerto', 'finalizado'
    );

    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_evento_id, v_cria_id, 'cria');
  END LOOP;

  -- 6. Fijar resultado del ciclo actual: 'parto'
  --    El ciclo NO se cierra (fecha_fin sigue NULL): puede recibir DESTETEs posteriores.
  --    El destete del último vínculo activo establecerá fecha_fin.
  UPDATE ciclo_reproductivo
  SET resultado = 'parto'
  WHERE id = p_ciclo_id;

  -- 7. Consecuencias sobre la madre según si sigue siendo reproductora
  IF v_es_reproductora THEN
    -- Abrir nuevo ciclo en estado VACÍA para el siguiente período reproductivo
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
    -- No es reproductora: sin ciclo activo, estado reproductivo NULL
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
-- 4. Recrear registrar_cubricion: eliminar rama de creación de ciclo
-- ─────────────────────────────────────────────────────────────────────────────
-- evalCycleRules siempre devuelve 'reutilizar': p_ciclo_id siempre llega provisto.
-- Se mantiene p_estado_reproductivo para recibir el valor calculado por ReproductiveProjection.

CREATE OR REPLACE FUNCTION registrar_cubricion(
  p_animal_id            UUID,
  p_fecha                DATE,
  p_ciclo_id             UUID,                                        -- siempre provisto
  p_estado_reproductivo  estado_reproductivo_enum DEFAULT 'cubierta', -- calculado por ReproductiveProjection
  p_fecha_prevista_parto DATE    DEFAULT NULL,
  p_tipo_cubricion       TEXT    DEFAULT NULL,
  p_macho_id             UUID    DEFAULT NULL,
  p_observaciones        TEXT    DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tipo_evento_id UUID;
  v_evento_id      UUID;
  v_especie        especie_enum;
  v_estado_vital   estado_vital_enum;
  v_crotal         TEXT;
BEGIN
  -- Anti-concurrencia
  SELECT estado_vital, especie, crotal
  INTO   v_estado_vital, v_especie, v_crotal
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

  v_tipo_evento_id := _resolve_tipo_evento_id('CUBRICION');

  -- Evento: fuente de verdad del sistema
  INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
  VALUES (
    v_tipo_evento_id, v_especie, p_fecha, p_ciclo_id,
    jsonb_build_object(
      'tipo_cubricion', p_tipo_cubricion,
      'macho_id',       p_macho_id,
      'observaciones',  p_observaciones
    )
  )
  RETURNING id INTO v_evento_id;

  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_animal_id, 'madre');

  -- Actualizar snapshot derivado: siempre DESPUÉS del evento, nunca antes
  UPDATE animal
  SET estado_reproductivo  = p_estado_reproductivo,
      fecha_prevista_parto = p_fecha_prevista_parto
  WHERE id = p_animal_id;

  RETURN v_evento_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Recrear registrar_confirmacion_gestacion: eliminar rama de creación de ciclo
-- ─────────────────────────────────────────────────────────────────────────────
-- El ciclo VACÍA siempre existe: creado al convertirse en REPRODUCTORA o tras un desenlace.
-- evalCycleRules siempre devuelve 'reutilizar'; p_ciclo_id llega siempre provisto.

DROP FUNCTION IF EXISTS registrar_confirmacion_gestacion(uuid, date, uuid, date, text, uuid);

CREATE OR REPLACE FUNCTION registrar_confirmacion_gestacion(
  p_animal_id            UUID,
  p_fecha                DATE,
  p_ciclo_id             UUID,          -- siempre provisto
  p_fecha_prevista_parto DATE    DEFAULT NULL,
  p_observaciones        TEXT    DEFAULT NULL,
  p_padre_id             UUID    DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tipo_evento_id UUID;
  v_evento_id      UUID;
  v_especie        especie_enum;
  v_estado_vital   estado_vital_enum;
  v_crotal         TEXT;
  v_metadata       JSONB;
BEGIN
  SELECT estado_vital, especie, crotal
  INTO   v_estado_vital, v_especie, v_crotal
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

  -- Construir metadata_json: eliminar claves null para mantener el JSON limpio
  v_metadata := jsonb_build_object(
    'observaciones', p_observaciones,
    'padre_id',      p_padre_id
  );
  v_metadata := v_metadata - ARRAY(
    SELECT key FROM jsonb_each(v_metadata) WHERE value = 'null'::jsonb
  );
  IF v_metadata = '{}'::jsonb THEN v_metadata := NULL; END IF;

  v_tipo_evento_id := _resolve_tipo_evento_id('CONFIRMACION_GESTACION');

  INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
  VALUES (v_tipo_evento_id, v_especie, p_fecha, p_ciclo_id, v_metadata)
  RETURNING id INTO v_evento_id;

  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_animal_id, 'madre');

  -- estado_reproductivo siempre → gestante
  -- fecha_prevista_parto solo cuando se proporciona (desde vacia con estimación)
  UPDATE animal
  SET estado_reproductivo  = 'gestante',
      fecha_prevista_parto = COALESCE(p_fecha_prevista_parto, fecha_prevista_parto)
  WHERE id = p_animal_id;

  RETURN v_evento_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Recrear registrar_destete: solo fecha_fin al cerrar el ciclo
-- ─────────────────────────────────────────────────────────────────────────────
-- resultado ya fue fijado como 'parto' por registrar_parto; solo se informa fecha_fin.
-- Guardia AND resultado IS NOT NULL: solo cerrar ciclos que tienen desenlace reproductivo.

CREATE OR REPLACE FUNCTION registrar_destete(
  p_cria_id       UUID,
  p_fecha         DATE,
  p_observaciones TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cria                 RECORD;
  v_tp_nombre            TEXT;
  v_tipo_evento_id       UUID;
  v_evento_id            UUID;
  v_tipo_productivo_id   UUID;
  v_ciclo_id             UUID;
  v_active_bonds         INT;
  v_ciclo_cerrado        BOOLEAN := false;
BEGIN
  -- Cargar y bloquear la cría
  -- FOR UPDATE solo sobre animal: no aplica al lado nullable de un outer join
  SELECT
    a.id,
    a.especie,
    a.estado_vital,
    a.estado_vinculo_materno,
    a.madre_id,
    a.parto_evento_id,
    a.tipo_productivo_id
  INTO v_cria
  FROM animal a
  WHERE a.id = p_cria_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cría no encontrada: %', p_cria_id;
  END IF;

  -- Resolver nombre del tipo productivo en consulta separada
  SELECT nombre INTO v_tp_nombre
  FROM tipo_productivo
  WHERE id = v_cria.tipo_productivo_id;

  -- Validaciones
  IF v_tp_nombre IS DISTINCT FROM 'Cría' THEN
    RAISE EXCEPTION 'El animal no está en etapa "Cría" (tipo actual: %)',
      COALESCE(v_tp_nombre, 'sin tipo');
  END IF;

  IF v_cria.estado_vital != 'vivo' THEN
    RAISE EXCEPTION 'La cría no está viva (estado: %)', v_cria.estado_vital;
  END IF;

  IF v_cria.estado_vinculo_materno IS DISTINCT FROM 'activo' THEN
    RAISE EXCEPTION 'El vínculo materno no está activo (estado: %)',
      COALESCE(v_cria.estado_vinculo_materno::text, 'NULL');
  END IF;

  IF p_fecha > CURRENT_DATE THEN
    RAISE EXCEPTION 'La fecha del destete no puede ser futura (fecha: %)', p_fecha;
  END IF;

  -- Actualizar la cría: Cría → Recría, vínculo → finalizado
  SELECT id INTO v_tipo_productivo_id
  FROM tipo_productivo
  WHERE nombre = 'Recría' AND especie = v_cria.especie
  LIMIT 1;

  UPDATE animal
  SET tipo_productivo_id     = v_tipo_productivo_id,
      estado_vinculo_materno = 'finalizado'
  WHERE id = p_cria_id;

  -- Obtener ciclo de la cría vía parto_evento_id
  IF v_cria.parto_evento_id IS NOT NULL THEN
    SELECT ciclo_id INTO v_ciclo_id
    FROM eventos
    WHERE id = v_cria.parto_evento_id;
  END IF;

  -- Crear evento DESTETE
  v_tipo_evento_id := _resolve_tipo_evento_id('DESTETE');

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

  -- Asociar animales al evento
  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_cria_id, 'cria');

  IF v_cria.madre_id IS NOT NULL THEN
    INSERT INTO evento_animales (evento_id, animal_id, rol)
    VALUES (v_evento_id, v_cria.madre_id, 'madre');
  END IF;

  -- Evaluar cierre del ciclo
  -- Cuenta vínculos activos restantes después de actualizar esta cría.
  IF v_ciclo_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_active_bonds
    FROM animal
    WHERE parto_evento_id IN (SELECT id FROM eventos WHERE ciclo_id = v_ciclo_id)
      AND estado_vinculo_materno = 'activo'
      AND estado_vital = 'vivo';

    IF v_active_bonds = 0 THEN
      -- Solo fecha_fin: resultado ya fue fijado como 'parto' por registrar_parto.
      -- Guardia resultado IS NOT NULL: solo cerrar ciclos con desenlace reproductivo.
      UPDATE ciclo_reproductivo
      SET fecha_fin = p_fecha
      WHERE id = v_ciclo_id
        AND fecha_fin IS NULL
        AND resultado IS NOT NULL;

      v_ciclo_cerrado := true;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'eventoId',     v_evento_id,
    'cicloCerrado', v_ciclo_cerrado
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Recrear registrar_salida_animal: adaptar al nuevo modelo
-- ─────────────────────────────────────────────────────────────────────────────
-- Cambios:
--   - Eliminar v_resultado_ciclo (tipo removido del enum)
--   - Al cerrar ciclo propio de la reproductora: resultado='cierre_manual'
--   - Al cerrar ciclo por último vínculo activo: solo fecha_fin (resultado ya 'parto')

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

  -- Regla de negocio: solo animales vivos pueden tener evento de salida
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

  -- 3. Actualizar snapshot del animal que sale
  UPDATE animal
  SET estado_vital         = v_nuevo_estado,
      estado_reproductivo  = NULL,
      fecha_prevista_parto = NULL
  WHERE id = p_animal_id;

  -- 4. Finalizar vínculo materno si la cría lo tenía activo
  IF v_vinculo = 'activo' AND v_madre_id IS NOT NULL AND v_parto_evento_id IS NOT NULL THEN

    UPDATE animal
    SET estado_vinculo_materno = 'finalizado'
    WHERE id = p_animal_id;

    -- Resolver el ciclo de la madre a través del evento de parto que originó a esta cría
    SELECT ciclo_id INTO v_ciclo_id
    FROM   eventos WHERE id = v_parto_evento_id;

    IF v_ciclo_id IS NOT NULL THEN
      -- Contar crías que aún tienen vínculo activo en el mismo ciclo
      SELECT COUNT(*) INTO v_active_bonds
      FROM   animal a
      JOIN   eventos e ON e.id = a.parto_evento_id
      WHERE  e.ciclo_id = v_ciclo_id
        AND  a.estado_vinculo_materno = 'activo'
        AND  a.estado_vital = 'vivo';

      -- Si no quedan crías activas: cerrar el ciclo
      -- resultado ya fue fijado como 'parto' por registrar_parto → solo fecha_fin
      IF v_active_bonds = 0 THEN
        UPDATE ciclo_reproductivo
        SET fecha_fin = p_fecha
        WHERE id = v_ciclo_id
          AND fecha_fin IS NULL
          AND resultado IS NOT NULL;
      END IF;
    END IF;

  END IF;

  -- 5. Cerrar ciclo reproductivo propio si existe
  --    'cierre_manual': la reproductora salió sin completar su ciclo reproductivo
  UPDATE ciclo_reproductivo
  SET fecha_fin = p_fecha,
      resultado = 'cierre_manual'
  WHERE animal_id = p_animal_id
    AND fecha_fin IS NULL;

  RETURN v_evento_id;
END;
$$;
