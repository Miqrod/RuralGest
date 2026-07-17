-- Snapshot derivado calculado en el momento de registrar una cubrición.
-- Vacuno: fecha_cubricion + 283 días. Porcino: fecha_cubricion + 114 días.
-- El RPC registrar_cubricion escribe este valor; al cerrar el ciclo (parto/aborto) lo pone a NULL.
-- dias_restantes NO se persiste: se calcula como fecha_prevista_parto - CURRENT_DATE cuando se necesita.
-- Ver: documentacion/memory/decisions.md § fecha_prevista_parto y dias_restantes
ALTER TABLE animal ADD COLUMN fecha_prevista_parto DATE NULL;
