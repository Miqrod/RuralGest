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

## Seed de desarrollo vs migraciones

- `supabase/seed.sql` es para datos de desarrollo — se ejecuta con `supabase db reset`, nunca con `supabase db push`.
- Las migraciones son para estructura y catálogos del sistema (datos que van a producción).
- `db reset` borra también `auth.users` → recrear usuario dev con `node scripts/create-dev-user.mjs` tras cada reset.
- UUIDs fijos en seed para poder referenciar FKs dentro del mismo INSERT (mismo patrón que seed_catalogo).

## AnimalListItem como proyección de UI

- La UI nunca recibe `Animal` completo ni `DbRow`. Recibe `AnimalListItem`, definido en `application/`.
- Definir la proyección en el use case (no en el dominio ni en la UI) mantiene el desacoplamiento.
- Si la tabla necesita más o menos campos, solo cambia `AnimalListItem` y el mapeo en el use case.

## Estrategia de entornos (.env)

- `.env.local` es el archivo activo (gitignored). No editar a mano.
- `.env.local.local` contiene las credenciales del Supabase local — está en git porque la anon key es pública.
- `.env.prod` contiene las credenciales de producción — gitignored.
- Cambio de entorno: `npm run env:local` / `npm run env:prod`.

## Transacciones: inmutables

- Las transacciones son hechos históricos, no se editan
- Las correcciones crean nuevas transacciones
- `importe` siempre >= 0; la dirección del dinero la da el campo `tipo` (ingreso/gasto)

## Una proyección por vista

Cada vista define exactamente los campos que necesita. `AnimalListItem` (listado) y `AnimalDetail` (ficha) son proyecciones separadas aunque compartan campos. No existe un tipo de dominio "universal" para la UI.

- Las proyecciones se definen en `application/`, junto al use case que las produce.
- Si la vista cambia de necesidades, solo cambia su proyección y el mapeo en el use case.

## `.maybeSingle()` vs `.single()`

Usar `.maybeSingle()` cuando el registro puede no existir (retorna `null` sin lanzar). Usar `.single()` solo cuando la ausencia del registro es un error del sistema. En páginas de detalle, siempre `.maybeSingle()` + `notFound()` explícito.

## `params` como Promise en Next.js 16

En Next.js 16, `params` en páginas y layouts es `Promise<{...}>` y debe ser awaiteado antes de usarse. Tiparlo como `Promise<{ id: string }>` y hacer `const { id } = await params`.

## Razas: catálogo por especie, no texto libre

- Tabla `raza(id, nombre, especie, activa)` con `UNIQUE(nombre, especie)`.
- FK `animal.raza_id → raza(id) ON DELETE RESTRICT`: no se puede borrar una raza referenciada. La baja se hace con `activa = false`, que la excluye del selector pero preserva el histórico.
- `raza_nombre` se resuelve con un JOIN en el repositorio (`select('*, raza(nombre)')`), no con una consulta separada. Evita N+1 en listados.
- El nombre resuelto viaja como `raza_nombre: string | null` en `Animal`, `AnimalListItem` y `AnimalDetail`. El mapper es el único punto que conoce el JOIN.

## Cabecera de ficha con color de mundo

`AnimalHeader` usa `var(--world-accent-soft)` como fondo y `border-world` como borde para anclar visualmente la ficha al mundo activo (vacuno, porcino…). Este es el patrón para cabeceras de identidad en fichas de entidad.

## `tipo_productivo`: catálogo por especie, FK en animal

`animal.tipo: 'normal' | 'reproductor'` se elimina. En su lugar:
- Tabla `tipo_productivo(id, nombre, especie, activa)` con `UNIQUE(nombre, especie)`.
- FK `animal.tipo_productivo_id → tipo_productivo(id) ON DELETE RESTRICT`.
- Mismo patrón que `raza`: soft-delete con `activa`, `ON DELETE RESTRICT` protege histórico.
- Valores iniciales: vacuno → recría, reproductora, semental, engorde; porcino → recría, reproductora, cebo, verraco.
- El nombre resuelto viaja como `tipo_productivo_nombre: string | null` en proyecciones. El mapper usa `select('*, raza(nombre), tipo_productivo(nombre)')`.
- Los tipos pueden evolucionar per-especie sin cambiar el modelo de `animal`.

## Supabase local vs remote: workflow de migraciones

- `supabase db push` aplica migraciones al **remoto** (producción/staging)
- La app en desarrollo usa el **Supabase local** (puerto 54321), que es una instancia separada
- Para sincronizar el local tras crear nuevas migraciones: `supabase db reset`
  (`db reset` aplica todas las migraciones + seed desde cero en local)
- Consecuencia: si se empuja al remoto pero no se ejecuta `db reset`, el local queda desactualizado
  y las llamadas a RPCs nuevos fallan con "function not found in schema cache"

## Tipos Supabase: siempre generados, nunca manuales

Los tipos de tablas, enums y RPCs se generan automáticamente desde el schema real:
```bash
supabase gen types typescript --local > types/supabase.ts
```
El cliente se tipa con `createServerClient<Database>(...)` y `createBrowserClient<Database>(...)`.
Nunca escribir tipos de DB a mano — se desincronizarían con el schema real.
Regenerar después de cada migración que modifique el schema.

## estado_vital: snapshot derivado, no fuente de verdad

`animal.estado_vital` es un campo de conveniencia que el RPC mantiene sincronizado.
No es la fuente de verdad — los eventos lo son.

- Nunca actualizar `estado_vital` directamente desde UI ni desde Use Case
- Solo el RPC lo modifica, y siempre como último paso después de insertar el evento
- Si el snapshot difiriera de los eventos, los eventos prevalecen (fuente canónica)

## Acciones inline: en la ficha, no en una página separada

Las acciones sobre una entidad (salida de animal, registro de evento, etc.) se implementan
como formularios inline en la ficha de la entidad, dentro de un panel `SeccionAcciones`.
No se navega a una página separada de "registrar X".

Razones: el usuario no pierde el contexto de la ficha, la acción es visible junto a los datos
que la justifican, y `router.refresh()` actualiza los Server Components sin navegación.

## `es_reproductora`: flag interno, solo backend

`es_reproductora` es una derivación computada por el backend, nunca expuesta al usuario ni modificable directamente.

- `true` **únicamente** para hembras con `tipo_productivo.nombre = 'Reproductora'`. Cualquier otro caso → `false`.
- El cambio es automático cuando el backend actualiza `tipo_productivo_id`.
- Para machos siempre `false` (el ciclo reproductivo no aplica).
- Objetivo: todas las validaciones reproductivas usan `if (!animal.es_reproductora)` sin interpretar sexo + tipo + estado.
- En el dominio `Animal` el campo existe (es útil en reglas de negocio). En cualquier tipo de input del usuario (`RegistrarCompraAnimalInput`, etc.) nunca aparece.