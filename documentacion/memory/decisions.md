# Decisions

## Eventos como source of truth

- Los eventos no se editan nunca (`assertEventoNoEditable`)
- Los estados (`estado_vital`, `estado_reproductivo`, etc.) son derivados de eventos, nunca editados directamente
- Las correcciones se hacen creando eventos compensatorios, nunca modificando el histórico

## Backend vs DB

- El backend (capa `application/`) decide la lógica de negocio
- La DB protege la integridad con constraints (`CHECK`, FK, `UNIQUE`)
- No hay lógica compleja en triggers de Postgres

## Workflow Supabase: remote-only sin Docker

- No se usa `supabase db pull` (requiere Docker local)
- Todas las migraciones se crean manualmente en `supabase/migrations/` y se aplican con `supabase db push`
- Los tipos TypeScript se generan con `supabase gen types typescript` (Task 7 pendiente)

## FK circulares: ALTER TABLE al final

- `animal` referencia `eventos` y `eventos` referencia `animal` (ciclo)
- Solución: crear `animal.evento_creacion_id` y `animal.evento_origen_id` como `UUID NULL` sin FK, añadir las FK con `ALTER TABLE` después de crear `eventos`

## UUIDs fijos para seed jerárquico

- `categoria_financiera` tiene una estructura de árbol (`parent_id`)
- Para el seed, se usan UUIDs predecibles (`00000000-0000-0000-0000-000000000001`, etc.) para poder referenciar `parent_id` dentro del mismo archivo de migración

## Estructura de módulos: Clean Architecture

- Cada submódulo tiene 4 capas: `domain/`, `application/`, `infrastructure/`, `ui/`
- La dependencia fluye hacia adentro: `ui → application → domain`, `infrastructure → domain`
- Los repositorios son funciones Supabase concretas, no interfaces abstractas (una sola fuente de datos)
- El puente ganadero ↔ financiero es explícito en `cross-domain/monetizacion-eventos/`

## Ventas: nunca automáticas

- El sistema nunca crea ventas automáticamente
- El usuario controla explícitamente la creación, agrupación y asociación
- Una venta con transacciones se vuelve inmutable

## Autenticación: sesión larga, rol único, RLS mínima

- `jwt_expiry = 604800` (7 días). La sesión no expira en el uso normal del día a día.
- Un solo rol `authenticated`. Sin roles complejos, sin ownership avanzado, sin multi-tenant.
- RLS habilitada en todas las tablas pero con política `USING (true) WITH CHECK (true)` — protege contra acceso anónimo, la lógica de autorización fina va en `application/`.
- El refresco de sesión lo gestiona automáticamente `proxy.ts` + `@supabase/ssr`.

## proxy.ts (Next.js 16)

- Next.js 16 depreca `middleware.ts` → renombrar a `proxy.ts` y la función de `middleware` a `proxy`.
- La lógica de protección de rutas vive en `proxy.ts`. No añadir lógica entre `createServerClient` y `getUser()`.
- `PUBLIC_PATHS` usa comparación exacta (`includes`), nunca `startsWith` (evita que `/login123` sea tratada como pública).

## Estrategia de entornos (.env)

- `.env.local` es el archivo activo (gitignored). No editar a mano.
- `.env.local.local` contiene las credenciales del Supabase local — está en git porque la anon key es pública.
- `.env.prod` contiene las credenciales de producción — gitignored.
- Cambio de entorno: `npm run env:local` / `npm run env:prod`.

## Transacciones: inmutables

- Las transacciones son hechos históricos, no se editan
- Las correcciones crean nuevas transacciones
- `importe` siempre >= 0; la dirección del dinero la da el campo `tipo` (ingreso/gasto)