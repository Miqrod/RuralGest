-- =============================================================================
-- Eliminar estado 'no_reproductiva' del enum estado_reproductivo_enum
--
-- El dominio define los estados reproductivos como:
--   NULL | vacia | cubierta | gestante | lactante
--
-- 'no_reproductiva' no existe en el modelo de negocio. El estado inicial de
-- una hembra reproductora es siempre 'vacia'. NULL corresponde a animales
-- con es_reproductora = false (no participan en el ciclo reproductivo).
--
-- PostgreSQL no permite DROP VALUE en enums existentes, por lo que:
--   1. Se actualiza cualquier fila con ese valor a 'vacia'
--   2. Se convierte la columna a TEXT
--   3. Se elimina y recrea el enum con los valores correctos
--   4. Se restaura la columna al nuevo enum
--   5. Se recrea el RPC que dependía del tipo con DEFAULT 'cubierta'
--      (el valor correcto según el flujo CUBRICION → cubierta)
-- =============================================================================

-- 1. Datos: convertir animales con estado 'no_reproductiva' a 'vacia'
UPDATE animal
SET estado_reproductivo = 'vacia'
WHERE estado_reproductivo = 'no_reproductiva';

-- 2. Eliminar la función que usa el enum como tipo de parámetro
DROP FUNCTION IF EXISTS registrar_cubricion(
  UUID, DATE, UUID, estado_reproductivo_enum, DATE, TEXT, UUID, TEXT
);

-- 3. Convertir columna a TEXT para poder eliminar el enum
ALTER TABLE animal ALTER COLUMN estado_reproductivo TYPE TEXT;

-- 4. Eliminar el enum antiguo
DROP TYPE estado_reproductivo_enum;

-- 5. Recrear el enum sin 'no_reproductiva' (incluye 'cubierta' añadido en 20260708)
CREATE TYPE estado_reproductivo_enum AS ENUM ('vacia', 'cubierta', 'gestante', 'lactante');

-- 6. Restaurar la columna al nuevo enum
ALTER TABLE animal
  ALTER COLUMN estado_reproductivo TYPE estado_reproductivo_enum
  USING estado_reproductivo::estado_reproductivo_enum;

-- 7. Recrear registrar_cubricion con DEFAULT 'cubierta' (corrección semántica:
--    CUBRICION no confirma gestación, solo indica que ha habido cubrición)
CREATE OR REPLACE FUNCTION registrar_cubricion(
  p_animal_id            UUID,
  p_fecha                DATE,
  p_ciclo_id             UUID    DEFAULT NULL,
  p_estado_reproductivo  estado_reproductivo_enum DEFAULT 'cubierta',
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
  v_ciclo_id       UUID;
  v_numero_ciclo   INT;
BEGIN
  -- Validación anti-concurrencia: bloquear la fila antes de cualquier escritura
  SELECT estado_vital, especie, crotal
  INTO v_estado_vital, v_especie, v_crotal
  FROM animal WHERE id = p_animal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Animal no encontrado: %', p_animal_id;
  END IF;

  IF v_estado_vital != 'vivo' THEN
    RAISE EXCEPTION 'El animal% no puede recibir eventos: estado_vital es "%"',
      CASE WHEN v_crotal IS NOT NULL THEN ' (crotal: ' || v_crotal || ')' ELSE '' END,
      v_estado_vital;
  END IF;

  -- Gestión del ciclo: crear o reutilizar, dentro de la misma transacción
  IF p_ciclo_id IS NULL THEN
    SELECT COALESCE(MAX(numero_ciclo), 0) + 1
    INTO v_numero_ciclo
    FROM ciclo_reproductivo
    WHERE animal_id = p_animal_id;

    INSERT INTO ciclo_reproductivo (animal_id, numero_ciclo, fecha_inicio)
    VALUES (p_animal_id, v_numero_ciclo, p_fecha)
    RETURNING id INTO v_ciclo_id;
  ELSE
    v_ciclo_id := p_ciclo_id;
  END IF;

  v_tipo_evento_id := _resolve_tipo_evento_id('CUBRICION');

  -- 1. Evento: fuente de verdad del sistema
  INSERT INTO eventos (tipo_evento_id, especie, fecha, ciclo_id, metadata_json)
  VALUES (
    v_tipo_evento_id,
    v_especie,
    p_fecha,
    v_ciclo_id,
    jsonb_build_object(
      'tipo_cubricion', p_tipo_cubricion,
      'macho_id',       p_macho_id,
      'observaciones',  p_observaciones
    )
  )
  RETURNING id INTO v_evento_id;

  -- 2. Asociación N:M evento ↔ animal (rol 'madre' identifica a la hembra receptora)
  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_animal_id, 'madre');

  -- 3. Actualizar snapshot derivado: siempre DESPUÉS del evento, nunca antes
  UPDATE animal
  SET estado_reproductivo  = p_estado_reproductivo,
      fecha_prevista_parto = p_fecha_prevista_parto
  WHERE id = p_animal_id;

  RETURN v_evento_id;
END;
$$;
