-- Eliminar la firma antigua de registrar_compra_animal (10 parámetros, sin p_ubicacion_id).
-- La migración 20260906173840 añadió p_ubicacion_id con CREATE OR REPLACE, lo que creó
-- un overload en lugar de sustituir la función — Postgres los trata como funciones distintas
-- si la lista de tipos difiere. Al haber dos candidatos, el cliente no puede elegir.
-- Ver mistakes.md: "CREATE OR REPLACE EN POSTGRES CON FIRMA DISTINTA CREA OVERLOAD".
DROP FUNCTION IF EXISTS registrar_compra_animal(
  especie_enum, sexo_enum, uuid, date, text, text, uuid, date, date, uuid
);
