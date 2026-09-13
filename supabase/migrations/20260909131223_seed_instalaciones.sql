-- =============================================================================
-- PRD014 — Instalaciones y Reubicación de Animales
-- Tarea 263: Seed — 10 instalaciones reales de Casasola de la Encomienda
--
-- Las coordenadas proceden de Google Maps (lat, lng).
-- Los IDs son fijos para poder referenciarlos desde seed.sql, donde se
-- asignan los animales a los tres cercados con admite_animales = true.
--
-- Supabase aplica primero las migraciones y luego seed.sql, por lo que
-- las instalaciones ya existen cuando seed.sql registra las reubicaciones.
-- =============================================================================

INSERT INTO instalacion (id, nombre, tipo, admite_animales, admite_stock, coordenadas) VALUES

  -- Cercados (campo abierto vallado): los tres primeros admiten animales
  ('cccccccc-0001-0000-0000-000000000001', 'Valdelera',        'cercado', true,  false, '{"lat": 40.913857, "lng": -6.204804}'),
  ('cccccccc-0002-0000-0000-000000000002', 'El rincón',        'cercado', true,  false, '{"lat": 40.918507, "lng": -6.199944}'),
  ('cccccccc-0003-0000-0000-000000000003', 'Vallejito',        'cercado', true,  false, '{"lat": 40.918659, "lng": -6.196959}'),
  -- Pajar "La nave": cercado físicamente, pero usado como almacén (no admite animales)
  ('cccccccc-0008-0000-0000-000000000008', 'Pajar "La nave"',  'cercado', false, true,  '{"lat": 40.920341, "lng": -6.198084}'),

  -- Instalaciones de manejo: admiten animales temporalmente
  ('cccccccc-0004-0000-0000-000000000004', 'Corral',           'corral',  true,  false, '{"lat": 40.922936, "lng": -6.196491}'),
  ('cccccccc-0005-0000-0000-000000000005', 'Cebadero',         'otro',    true,  false, '{"lat": 40.923195, "lng": -6.196191}'),
  ('cccccccc-0006-0000-0000-000000000006', 'Pocilgas',         'otro',    true,  false, '{"lat": 40.923478, "lng": -6.194832}'),

  -- Almacenes y zonas logísticas
  ('cccccccc-0007-0000-0000-000000000007', 'Pajar Nuevo',      'almacen', false, true,  '{"lat": 40.917427, "lng": -6.204303}'),
  ('cccccccc-0009-0000-0000-000000000009', 'Caseta',           'almacen', false, true,  '{"lat": 40.923779, "lng": -6.194532}'),
  ('cccccccc-0010-0000-0000-000000000010', 'Embarcadero',      'otro',    false, true,  '{"lat": 40.922823, "lng": -6.196500}');
