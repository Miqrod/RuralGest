-- =============================================================================
-- sexo nullable en animal (PRD009 · tarea 106)
--
-- En explotaciones extensivas el sexo de una cría no siempre puede determinarse
-- en el momento del parto. NULL = sexo aún no informado (dato pendiente).
-- La identificación de la cría se considera COMPLETA cuando crotal y sexo
-- están ambos informados (AnimalIdentificationRules).
--
-- Los animales existentes (compras, altas manuales) siempre tienen sexo informado
-- ya que se exige en el formulario de entrada. Solo las crías recién nacidas
-- pueden tener sexo = NULL de forma transitoria.
-- =============================================================================

ALTER TABLE animal ALTER COLUMN sexo DROP NOT NULL;
