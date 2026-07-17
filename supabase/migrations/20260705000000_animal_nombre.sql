-- Añade nombre opcional al animal.
-- En vacuno suele usarse (nombre propio del toro/vaca); en porcino casi nunca.
-- NULL = sin nombre asignado; no se muestra en la ficha si es NULL.
ALTER TABLE animal ADD COLUMN nombre TEXT NULL;
