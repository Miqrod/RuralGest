-- clock_timestamp() avanza con el reloj de pared dentro de una transacción,
-- a diferencia de now() / CURRENT_TIMESTAMP que son transaction-stable y devuelven
-- el mismo valor para todas las operaciones del mismo transaction.
--
-- Problema que resuelve:
--   Los RPCs insertan primero el evento (PARTO, ABORTO, CAMBIO_TIPO_PRODUCTIVO…)
--   y después el nuevo ciclo_reproductivo en la misma transacción. Con now(), ambos
--   rows obtienen el mismo created_at, lo que hace el orden del log de historial
--   indeterminado cuando se comparan por timestamp.
--
-- Con clock_timestamp() como DEFAULT, el ciclo insertado después del evento
--   obtiene siempre un timestamp ligeramente mayor, garantizando que el log virtual
--   "Nuevo ciclo · Vacía" aparezca por encima del evento que lo originó.
--
-- Cobertura: afecta a todos los RPCs que crean ciclos sin necesidad de modificarlos
--   (registrar_parto, registrar_aborto, cambiar_tipo_productivo, registrar_compra_animal).

ALTER TABLE ciclo_reproductivo
  ALTER COLUMN created_at SET DEFAULT clock_timestamp();
