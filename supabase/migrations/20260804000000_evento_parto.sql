-- =============================================================================
-- evento_parto (PRD009)
--
-- Tabla especializada 1:1 con eventos que almacena la información específica
-- del nacimiento: conteos de crías, tipo de parto y observaciones.
--
-- La pertenencia al ciclo reproductivo no se duplica aquí:
--   evento_parto → evento → ciclo_reproductivo
--
-- El Parto NO cierra el ciclo reproductivo (solo el Destete lo hace).
-- Tras el Parto, el estado reproductivo de la madre pasa a LACTANTE.
-- =============================================================================

-- 1. Enum para el tipo de parto
CREATE TYPE tipo_parto_enum AS ENUM ('natural', 'asistido');

-- 2. Tabla evento_parto: relación 1:1 con eventos
CREATE TABLE evento_parto (
  evento_id       UUID             PRIMARY KEY
                                   REFERENCES eventos(id) ON DELETE CASCADE,
  numero_nacidos  INT              NOT NULL CHECK (numero_nacidos > 0),
  numero_vivos    INT              NOT NULL CHECK (numero_vivos >= 0),
  numero_muertos  INT              NOT NULL CHECK (numero_muertos >= 0),
  tipo_parto      tipo_parto_enum  NOT NULL,
  observaciones   TEXT,

  -- Invariante: vivos + muertos = total nacidos
  CONSTRAINT chk_conteo_crias
    CHECK (numero_vivos + numero_muertos = numero_nacidos)
);

-- 3. RLS — mismo patrón que el resto de tablas del proyecto
ALTER TABLE evento_parto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated" ON evento_parto
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
