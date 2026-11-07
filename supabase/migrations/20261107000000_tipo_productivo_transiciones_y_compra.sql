-- ─────────────────────────────────────────────────────────────────────────────
-- Transiciones de tipo productivo: Recría y Cría no son estados "comodín"
-- + validación del tipo de entrada en la compra
--
-- Decisión del usuario (2026-11-07). Ciclo de vida del tipo productivo:
--
--   Parto → Cría → (destete, automático) → Recría → (decisión) → Reproductora / Semental / Engorde
--                                                                 (porcino: Verraco = Semental, Cebo = Engorde)
--
--   · Recría NO es destino de un cambio manual: es la fase de transición tras el destete.
--     Una vez el animal pasa a Reproductora / Semental / Engorde no vuelve a Recría.
--   · Cría NO admite cambios manuales (origen): su único cambio es Cría → Recría y lo hace
--     el destete. Confirmado en BD: toda Cría viva tiene madre y vínculo activo, así que
--     siempre puede destetarse; la regla no deja ninguna atrapada.
--   · Reactivación permitida (sin cambios): Engorde → Reproductora / Semental, también
--     para ex-reproductoras (ciclo nuevo en VACÍA, historial anterior intacto).
--   · Reproductora ↔ Semental ya lo impide la regla de sexo.
--
-- registrar_compra_animal no validaba el tipo de entrada: permitía comprar un animal como
-- Cría (sin madre ni vínculo → no destetable → Cría para siempre con la regla anterior) o
-- con un tipo incoherente con su sexo. Se le añaden las mismas reglas que al cambio de tipo,
-- salvo que Recría SÍ es un tipo de entrada válido.
--
-- Bases (scripts/check-rpc.sh; ninguna migration posterior las redefine):
--   cambiar_tipo_productivo  → 20261104000000_cambiar_tipo_productivo_validacion_destino.sql
--   registrar_compra_animal  → 20260906173840_extend_registrar_compra_animal_ubicacion.sql
-- Cambio mínimo: solo se añaden validaciones previas a cualquier escritura. Firmas idénticas
-- (CREATE OR REPLACE sustituye la única versión existente de cada función).
--
-- Espejo TS (solo para guiar la UI): validarTipoProductivoDestino / validarTipoProductivoOrigen
-- en modules/ganadero/animales/domain/rules.ts. Mantener los mensajes alineados.
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

  -- Origen Cría: su único cambio de tipo es Cría → Recría, y lo hace el destete
  -- (registrar_destete / registrar_destete_lote / destete implícito en salida de la madre).
  -- Antes del destete la cría depende de la madre: no admite cambios manuales.
  SELECT nombre INTO v_tipo_anterior_nombre FROM tipo_productivo WHERE id = v_tipo_anterior_id;
  IF v_tipo_anterior_nombre = 'Cría' THEN
    RAISE EXCEPTION 'Una Cría solo cambia de tipo productivo mediante el destete.';
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

  -- Recría es la fase de transición tras el destete (la asigna el sistema). Una vez el
  -- animal pasa a Reproductora / Semental / Engorde (Verraco / Cebo en porcino) no vuelve.
  IF v_tipo_nuevo_nombre = 'Recría' THEN
    RAISE EXCEPTION 'Recría es la fase posterior al destete; no puede elegirse en un cambio de tipo productivo.';
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

  -- (v_tipo_anterior_nombre ya resuelto arriba, en la validación del origen)

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
  v_tp_especie           especie_enum;
  v_tp_activa            BOOLEAN;
  v_sexo_requerido       sexo_enum;
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

  -- ── Validación del tipo productivo de entrada (antes de cualquier escritura) ──
  -- Mismas reglas y mensajes que cambiar_tipo_productivo (migration 20261104000000),
  -- salvo que Recría SÍ es válida aquí: es el tipo con el que entra un animal comprado.
  SELECT nombre, especie, activa
  INTO   v_tp_nombre, v_tp_especie, v_tp_activa
  FROM   tipo_productivo WHERE id = p_tipo_productivo_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tipo productivo no encontrado: %', p_tipo_productivo_id;
  END IF;

  IF v_tp_especie != p_especie THEN
    RAISE EXCEPTION 'El tipo productivo % no corresponde a la especie del animal (%)', v_tp_nombre, p_especie;
  END IF;

  IF NOT v_tp_activa THEN
    RAISE EXCEPTION 'El tipo productivo % está desactivado', v_tp_nombre;
  END IF;

  -- Una Cría comprada no tendría madre ni vínculo en la explotación: nunca podría
  -- destetarse y, como Cría no admite cambios manuales, quedaría como Cría para siempre.
  IF v_tp_nombre = 'Cría' THEN
    RAISE EXCEPTION 'El tipo Cría solo se asigna al nacer; un animal comprado no puede entrar como Cría.';
  END IF;

  -- Tipos ligados al sexo. Verraco = equivalente porcino de Semental.
  v_sexo_requerido := CASE v_tp_nombre
    WHEN 'Reproductora' THEN 'hembra'::sexo_enum
    WHEN 'Semental'     THEN 'macho'::sexo_enum
    WHEN 'Verraco'      THEN 'macho'::sexo_enum
    ELSE NULL
  END;

  IF v_sexo_requerido IS NOT NULL THEN
    IF p_sexo IS NULL THEN
      RAISE EXCEPTION 'Indica el sexo del animal antes de asignarle el tipo productivo %.', v_tp_nombre;
    END IF;
    IF p_sexo != v_sexo_requerido THEN
      RAISE EXCEPTION 'El tipo % solo puede asignarse a %.',
        v_tp_nombre,
        CASE v_sexo_requerido WHEN 'hembra' THEN 'hembras' ELSE 'machos' END;
    END IF;
  END IF;
  -- ─────────────────────────────────────────────────────────────────────────

  -- es_reproductora: solo hembras con tipo_productivo 'Reproductora'
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

