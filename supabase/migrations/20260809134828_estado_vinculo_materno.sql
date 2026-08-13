-- =============================================================================
-- estado_vinculo_materno: dependencia funcional madre-cría
--
-- Distinción fundamental del dominio reproductivo:
--
--   madre_id               → genealogía permanente e inmutable
--   estado_vinculo_materno → dependencia funcional temporal y derivada
--
-- madre_id responde "¿quién es la madre de este animal?" y nunca cambia.
-- estado_vinculo_materno responde "¿existe actualmente una dependencia
-- funcional que deba mantener abierto el ciclo reproductivo de la madre?"
--
-- Valores:
--   NULL       → el sistema no dispone de información suficiente (histórico)
--   'activo'   → dependencia funcional vigente (cría viva post-parto)
--   'finalizado' → dependencia finalizada (destete, venta o muerte)
--
-- La columna es:
--   - interna: no editable por el usuario
--   - derivada: gestionada exclusivamente por los RPCs del dominio
--   - nullable: NULL es un valor semántico válido, no un error
--
-- Ciclo de vida habitual:
--   Parto (cría viva) → ACTIVO → Destete → FINALIZADO
--   Parto (cría muerta) → FINALIZADO (nunca existió dependencia)
--
-- Ref: PRD010, documentacion/flujos/reproductivo/destete.md
-- =============================================================================

CREATE TYPE vinculo_materno_enum AS ENUM ('activo', 'finalizado');

ALTER TABLE animal
  ADD COLUMN estado_vinculo_materno vinculo_materno_enum NULL;

COMMENT ON COLUMN animal.estado_vinculo_materno IS
  'Dependencia funcional madre-cría. NULL = sin información suficiente; activo = vínculo vigente; finalizado = vínculo cerrado. Distinto de madre_id (genealogía permanente). Gestionado exclusivamente por el dominio.';
