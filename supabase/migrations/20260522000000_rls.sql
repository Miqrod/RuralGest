-- =============================================================================
-- MIGRATION: Row Level Security
-- Política única: solo usuarios autenticados pueden operar.
-- Sin ownership, sin roles complejos, sin multi-tenant.
-- TODO producción: revisar políticas según requisitos de seguridad reales.
-- =============================================================================

-- Capa ganadera
ALTER TABLE lote                ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal              ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimiento          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_evento         ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivos_movimiento  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ciclo_reproductivo  ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE evento_animales     ENABLE ROW LEVEL SECURITY;
ALTER TABLE evento_lotes        ENABLE ROW LEVEL SECURITY;

-- Capa financiera
ALTER TABLE categoria_financiera    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tercero                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_linea             ENABLE ROW LEVEL SECURITY;
ALTER TABLE factura                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE factura_linea           ENABLE ROW LEVEL SECURITY;
ALTER TABLE factura_linea_detalle   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaccion             ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos              ENABLE ROW LEVEL SECURITY;


-- Políticas: authenticated puede todo
CREATE POLICY "authenticated" ON lote               FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated" ON animal             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated" ON movimiento         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated" ON tipo_evento        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated" ON motivos_movimiento FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated" ON ciclo_reproductivo FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated" ON eventos            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated" ON evento_animales    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated" ON evento_lotes       FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated" ON categoria_financiera   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated" ON tercero                FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated" ON venta                  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated" ON venta_linea            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated" ON factura                FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated" ON factura_linea          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated" ON factura_linea_detalle  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated" ON transaccion            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated" ON documentos             FOR ALL TO authenticated USING (true) WITH CHECK (true);
