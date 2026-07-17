-- =============================================================================
-- GRANTS — permisos de acceso al schema público
--
-- Supabase Cloud aplica estos grants automáticamente.
-- En local hay que declararlos explícitamente.
-- RLS sigue siendo la capa de control real: estos grants son el prerequisito.
-- =============================================================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Permisos sobre tablas existentes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT                          ON ALL TABLES IN SCHEMA public TO anon;

-- Permisos automáticos para tablas creadas en el futuro
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;

-- Secuencias (necesarias para INSERT con serial/bigserial)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated, anon;

-- Funciones / RPCs
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated, anon;
