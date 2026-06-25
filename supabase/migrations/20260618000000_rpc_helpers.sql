-- Helpers SQL privados reutilizables entre RPCs transaccionales.
-- El prefijo _ marca que no forman parte de la API pública de PostgREST.
-- STABLE: no modifican la BD y devuelven el mismo resultado para los mismos
-- parámetros dentro de una transacción, lo que permite optimización por Postgres.

-- Resuelve el UUID de un tipo_evento a partir de su código de máquina (ej: 'SALIDA')
CREATE OR REPLACE FUNCTION _resolve_tipo_evento_id(p_codigo TEXT)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM tipo_evento WHERE codigo = p_codigo
$$;

-- Resuelve el UUID de un motivo_movimiento a partir de su nombre (ej: 'venta', 'muerte')
CREATE OR REPLACE FUNCTION _resolve_motivo_id(p_nombre TEXT)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM motivos_movimiento WHERE nombre = p_nombre
$$;

-- Obtiene la especie de un animal; necesaria para rellenar eventos.especie sin pre-fetch en TS
CREATE OR REPLACE FUNCTION _resolve_animal_especie(p_animal_id UUID)
RETURNS especie_enum LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT especie FROM animal WHERE id = p_animal_id
$$;
