-- =============================================================================
-- PRD015 — Bucket de Supabase Storage para imágenes (Tarea 291/294)
--
-- Bucket público: cualquiera puede leer (logos, imágenes de la explotación).
-- Solo usuarios autenticados pueden escribir, reemplazar y borrar.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- INSERT cubre subidas nuevas, UPDATE permite reemplazar (upsert), DELETE para limpiar
CREATE POLICY "images_write_authenticated" ON storage.objects
  FOR ALL TO authenticated
  USING   (bucket_id = 'images')
  WITH CHECK (bucket_id = 'images');
