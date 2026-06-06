# Progreso — Tareas 1–10

Resumen de las 10 tareas iniciales de construcción de la base técnica.

---

## Tarea 1 — Configuración del proyecto

Proyecto creado con Next.js 16, TypeScript, Tailwind CSS v4 y shadcn/ui (@base-ui/react).
Pipeline de CI añadido. ESLint, Prettier y Husky configurados.

## Tarea 2 — Diseño del sistema de tokens de color

Sistema de design tokens via CSS variables en `styles/globals.css`.
Paleta semántica: `--color-canvas`, `--color-ink`, `--color-ink-muted`, `--color-surface-*`, `--color-divider`, `--color-brand`, `--color-world`…
Soporte dark mode con `.dark` selector.

## Tarea 3 — Configuración de Tailwind v4

Integración de `@tailwindcss/postcss`. Uso de `@theme inline` para exponer CSS variables como utilities de Tailwind. Configuración de fuentes y breakpoints.

## Tarea 4 — Providers y contextos base

`SidebarProvider`: contexto React para el estado collapsed/expanded del Sidebar.
`useTheme`: hook para gestionar light/dark mode.

## Tarea 5 — Layout principal

Implementación completa de `AppLayout`, `Sidebar`, `Header`, `Footer`, `WorldSync` y `PageContainer`.

Problemas resueltos:
- `asChild` no existe en @base-ui/react → sustituido por prop `render`
- Iconos del sidebar colapsado no apilados → fix con `flex flex-col gap-1` en el nav
- Layout shift al aparecer el borde de ítem activo → `border-l-4 border-transparent` siempre reserva el espacio

## Tarea 6 — Navegación

Estructura de `NAV_ITEMS` en `lib/navigation.ts` con soporte para ítems con hijos (acordeón), mundo por ítem y función `getWorldForPath`.
Breadcrumbs descartados (el menú lateral siempre visible los hace redundantes).

## Tarea 7 — Componentes de formulario

Instalación de shadcn/ui `field`, `input`, `textarea`, `select`, `checkbox`, `button`.
Integración con react-hook-form + zod mediante el patrón `Controller` + `Field`/`FieldError`.
Página `/demo` con formulario de validación funcional.

## Tarea 8 — DataTable

Hook `useDataTable` y componente `DataTable` con TanStack Table v8.
Soporte: ordenación por columna, filtrado por texto, paginación numerada con elipsis.
Estilos extraídos del boceto `listado_de_animales_v12.14_final.html`.
Tarea 8.5 (virtualización) cancelada — innecesaria con paginación server-side.

## Tarea 9 — Patrones y utilidades comunes

Creada `lib/format.ts` con `formatPeso`, `formatMoneda`, `formatFecha`, `formatFechaLarga`.
Descartados hooks especulativos (useLocalStorage, usePrevious, useAsync, useMediaQuery).
Especies/razas pospuestas a BD — no deben ser constantes de código.

## Tarea 10 — Estructura y documentación

`README.md` en la raíz del proyecto.
Documentación técnica en `documentacion/desarrollo/`: layout, componentes, sistema de mundos y este resumen de progreso.
`documentacion/memory/deferred.md` con elementos pospuestos y razones.

---

## Post-PRD001 — Mejoras incrementales

### Menú mobile (drawer)

Drawer deslizante en pantallas `< md`. El sidebar arranca con `-translate-x-full` y entra con `translate-x-0`. Siempre muestra el modo expandido en mobile. Se cierra automáticamente al navegar.

Elementos añadidos: botón hamburguesa en `Header`, `MobileBackdrop` en `AppLayout` (`z-[45]`), `MobileCloseBtn` dentro del `Sidebar` con animación vertical de 4 fases (evita conflictos de z-index).

`SidebarProvider` ampliado con `mobileOpen`, `toggleMobile` y `closeMobile`.

### Hover effects en formularios

Todos los elementos de formulario reciben `transition duration-200 ease-in`:
- `Input`, `Select`, `Textarea`: borde pasa a gris oscuro (`hover:border-stone-400`).
- `Button` variante `default`: `hover:bg-stone-500 hover:text-white`.
- `Checkbox` y `FieldLabel`: añaden `cursor-pointer`.

### Seguridad de dependencias

Eliminados tres paquetes no utilizados que introducían 20+ vulnerabilidades altas/críticas: `html-pdf-node`, `puppeteer-core`, `md-to-pdf`.

CI actualizado: `npm install` → `npm ci` + paso de auditoría `npm audit --audit-level=high`.

### Submenús de navegación

`NavItem.href` pasa a ser opcional para soportar ítems padre que solo despliegan acordeón.

Vacuno, Porcino y Finanzas son ahora ítems padre sin ruta propia. Cada uno tiene 4 sub-ítems con ruta.

**Visual de sub-ítems** (basado en boceto `listado_de_animales_v12.14_final.html`):
- Sin icono. Indentación `pl-11`. Contenedor con `bg-stone-100/50`.
- Flecha `▸` en `left-6`: transparente por defecto, aparece en hover/activo (`group-hover/subitem`).
- Activo: color de mundo + `font-semibold`. Inactivo: `text-ink-muted`.

Cuando el sidebar está colapsado y el ítem tiene hijos, el click expande el sidebar y abre el acordeón.

`getWorldForPath` actualizado para buscar también en `children`.

### Página de documentación

`app/(main)/docs/page.tsx` creado (página base con h1).
Ítem "Documentación" añadido al menú (`BookOpen`, world `default`, entre Instalaciones y Configuración).

### Fix: `delayDuration` → `delay` en TooltipProvider

`@base-ui/react` usa la prop `delay`, no `delayDuration` (que es la API de Radix UI).
Corregido en `components/layout/Sidebar.tsx` línea 265.

---

## PRD002 — Integración Supabase y arquitectura backend

### Tarea 1 — Variables de entorno y test de conexión

`.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Script `scripts/test-supabase.mjs` que lee `.env.local`, llama a `supabase.auth.getSession()` y confirma conectividad.

Problema resuelto: los valores de `.env.local` venían con comillas envolventes → regex `.replace(/^["']|["']$/g, '')`.

### Tarea 2 — Supabase CLI y vinculación del proyecto

CLI instalado via Homebrew (`brew install supabase/tap/supabase`, v2.101.0).
Proyecto vinculado con `supabase link --project-ref <ref>`.

Workflow inicial remote-only (`supabase db push`). Migrado a **local-first** en Tarea 7.

### Tarea 4 — Migraciones SQL

Tres archivos en `supabase/migrations/`, aplicados con `supabase db push`:

**`20260514170408_ganadero_base.sql`** — capa ganadera:
ENUMs + tablas: `lote`, `animal`, `movimiento`, `tipo_evento`, `motivos_movimiento`, `ciclo_reproductivo`, `eventos`, `evento_animales`, `evento_lotes`.
FK circular resuelta: `animal.evento_creacion_id` y `animal.evento_origen_id` creadas como `UUID NULL` y añadidas con `ALTER TABLE` después de crear `eventos`.

**`20260515131917_financiero_base.sql`** — capa financiera:
Tablas: `categoria_financiera`, `tercero`, `venta`, `venta_linea` (con `chk_tipo_entidad`), `factura`, `factura_linea`, `factura_linea_detalle`, `transaccion` (con `chk_origen_relaciones`), `documentos` (polimórfica sin FK).

**`20260515232251_seed_catalogo.sql`** — seed estructural:
11 `tipo_evento`, 10 `motivos_movimiento`, 14 `categoria_financiera` (árbol con UUIDs fijos predictables para poder referenciar `parent_id` en el mismo INSERT).

### Tarea 5 — Clientes Supabase

`lib/supabase/client.ts` — cliente browser con `createBrowserClient` de `@supabase/ssr`.
`lib/supabase/server.ts` — cliente servidor async con `createServerClient` + `cookies()` de Next.js. El bloque `setAll` captura la excepción esperada en Server Components (cookies de solo lectura).

### Tarea 6 — Estructura de módulos (Clean Architecture)

35 archivos en `modules/` siguiendo una arquitectura de 4 capas por submódulo:

| Capa | Pregunta | Contenido |
|------|----------|-----------|
| `domain/` | ¿Qué reglas existen? | tipos, interfaces, invariantes |
| `application/` | ¿Qué operaciones hacemos? | use cases que orquestan domain + infrastructure |
| `infrastructure/` | ¿Cómo persistimos? | repositorios Supabase (stubs) |
| `ui/` | ¿Cómo se muestra? | componentes React y hooks del módulo (se popula al construir UI) |

Árbol de módulos:
```
modules/
├── shared/           db/ (re-export clientes) · types/ (UUID, ISODate, ISOTimestamp)
├── ganadero/         shared/domain/types · animales · lotes · eventos · movimientos · reproductivo
├── financiero/       shared/domain/types · terceros · ventas · facturas · transacciones
└── cross-domain/     monetizacion-eventos/  ← puente GANADERO ↔ FINANCIERO
```

Lógica pre-existente en `lib/domain/`, `lib/guardrails/`, `lib/validators/` está reimplementada limpiamente en los `domain/rules.ts` de cada módulo. La migración formal de esos archivos queda como tarea pendiente.

### Tarea 7 — Tipos TypeScript desde Supabase + workflow local-first

**Docker Desktop instalado** (compatible macOS y Windows). Prerequisito para el workflow local-first.

**Stack local arrancado** con `supabase start`. URLs locales:
- API: `http://127.0.0.1:54321`
- Studio: `http://127.0.0.1:54323`
- DB: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

**`modules/shared/db/database.types.ts`** — generado con:
```bash
npm run db:types  # alias de: supabase gen types typescript --local 2>/dev/null > ...
```
No editar a mano. Regenerar después de cada migración. Contiene el tipo `Database` con Row/Insert/Update por tabla y todos los enums de Postgres.

**`modules/shared/db/helpers.ts`** — helpers con nombres acordados:
```ts
DbRow<T>    // fila tal como llega de la DB
DbInsert<T> // payload para insertar
DbUpdate<T> // payload para actualizar (todo opcional)
DbEnum<T>   // enum de Postgres
```
Usar solo en `infrastructure/` — nunca en `domain/` ni `application/`.

**Decisión de arquitectura confirmada:**
- Los tipos DB (`DbRow`) representan el schema persistente. No son tipos de dominio.
- Los tipos de dominio (`domain/types.ts`) representan conceptos de negocio y pueden incluir propiedades calculadas, joins resueltos o invariantes que no existen en la DB.
- Los **mappers** (`infrastructure/mapper.ts`) son las únicas funciones que conocen ambas familias. Son funciones puras sin efectos secundarios:
  ```ts
  mapAnimalRowToDomain(row: DbRow<'animal'>): Animal
  mapAnimalDomainToInsert(input: CrearAnimalInput): DbInsert<'animal'>
  ```
- Los repositorios llaman al mapper, nunca exponen tipos DB hacia afuera.

### Tarea 8 — Autenticación

**Filosofía:** sesiones muy largas, un solo rol `authenticated`, RLS mínima. Sin ownership avanzado, sin roles complejos, sin multi-tenant.

#### Supabase config (`supabase/config.toml`)
- `jwt_expiry = 604800` (7 días, máximo permitido). TODO: ajustar para producción.
- `additional_redirect_urls` ampliadas con `http://localhost:3000` y `http://127.0.0.1:3000`.

#### Migración RLS (`supabase/migrations/20260522000000_rls.sql`)
RLS habilitada en las 18 tablas del schema. Una política por tabla:
```sql
ALTER TABLE animal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated" ON animal FOR ALL TO authenticated USING (true) WITH CHECK (true);
```
Filosofía: la autorización fina es responsabilidad de la capa `application/`, no de la DB.

#### `proxy.ts` (antes `middleware.ts`)
Next.js 16 renombró la convención de `middleware.ts` a `proxy.ts` y la función de `middleware` a `proxy`. El archivo:
- Crea un cliente Supabase SSR con refresco de cookies.
- `getUser()` debe ser inmediatamente consecutivo a `createServerClient` (sin lógica intermedia).
- `PUBLIC_PATHS = ['/login', '/auth/callback']` con comparación exacta (`includes`), no `startsWith`.
- Sin sesión en ruta protegida → redirect a `/login`.
- Con sesión en `/login` → redirect a `/home`.

#### `app/auth/callback/route.ts`
Intercambia el code OAuth/magic-link por una sesión real. Redirige a `/home` si tiene éxito o a `/login?error=auth` si falla.

#### Auth layout (`app/(auth)/layout.tsx`)
Layout sin sidebar para las rutas públicas. Fondo `bg-surface-base` (gris piedra general de la app). Centra el contenido con `flex items-center justify-center min-h-screen`.

#### Login page (`app/(auth)/login/page.tsx`)
- Tarjeta flotante: `bg-canvas rounded-2xl shadow-md border border-divider/30 px-8 py-10`.
- react-hook-form + zod + patrón `Controller` con `Field`/`FieldLabel`/`Input`/`FieldError` (mismo estilo que demo/page.tsx).
- Error de credenciales con `form.setError('root', ...)` — nunca en campos individuales.
- Botón `<Button size="lg" className="w-full">` con estado `isSubmitting`.

#### `lib/supabase/server.ts` — helper `getUser()`
```ts
export async function getUser(): Promise<User> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('No autenticado')
  return user
}
```
Usar en Server Components y Server Actions que requieren sesión.

#### `scripts/create-dev-user.mjs`
Script de uso único para crear el usuario de desarrollo local (`admin@hermanos.local` / `dev1234`) usando la `service_role_key` local. Ejecutar con `node scripts/create-dev-user.mjs` una sola vez después de `supabase start`.

#### `components/layout/Header.tsx` — `UserMenu`
El botón de avatar estático se reemplazó por un componente `UserMenu` con:
- Dropdown flotante: `bg-canvas rounded-xl border border-divider/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.12)]`.
- Cierre al hacer click fuera (listener `mousedown` + `useRef`).
- Acción "Cerrar sesión": `createClient().signOut()` + `router.push('/login')`.
- Diseñado para ampliarse con más opciones (perfil, configuración) en el futuro.

#### Gestión de entornos (`.env`)
Patrón acordado para cambiar entre Supabase local y producción sin editar archivos manualmente:

| Archivo | Contenido | Git |
|---------|-----------|-----|
| `.env.local` | credenciales activas (sobreescrito por scripts) | ignorado |
| `.env.local.local` | credenciales Supabase local (anon key pública demo) | **incluido** |
| `.env.prod` | credenciales Supabase producción | ignorado |

Scripts npm:
```bash
npm run env:local   # cp .env.local.local .env.local
npm run env:prod    # cp .env.prod .env.local
```

---

## PRD003 — Primer vertical slice funcional: listado de animales

**Milestone:** la arquitectura queda validada end-to-end con datos reales de Supabase.

Flujo completo implementado:
```
DB → repository → mapper → use case → page (SSR) → DataTable
```

### Tarea 1 — Seed de desarrollo (`supabase/seed.sql`)

Fichero estándar de Supabase para datos de desarrollo. Se ejecuta automáticamente con `supabase db reset` — **no viaja a producción** con `supabase db push`.

10 animales vacuno que cubren todas las combinaciones relevantes de estado:

| Animal | Sexo | Tipo | Estado vital | Estado reproductivo | Estado sanitario |
|---|---|---|---|---|---|
| Estrella | hembra | reproductor | vivo | gestante | sano |
| Carmela | hembra | reproductor | vivo | lactante | sano |
| Blanca | hembra | reproductor | vivo | vacia | sano |
| Rosalía | hembra | normal | vivo | — | sano |
| Torito | macho | normal | vivo | — | sano |
| Becerro | macho | normal | vivo | — | sano (sin crotal, madre=Carmela) |
| La Negra | hembra | reproductor | vivo | vacia | en_tratamiento |
| Vendida | hembra | normal | vendido | — | sano |
| Finado | macho | normal | muerto | — | sano |
| Manchas | hembra | normal | vivo | — | en_observacion |

UUIDs fijos (`aaaaaaaa-000X-...`) para poder referenciar `madre_id` dentro del mismo INSERT.

Nota: `supabase db reset` borra también los usuarios de `auth.users`. Tras cada reset hay que recrear el usuario dev con `node scripts/create-dev-user.mjs`.

### Tarea 2 — Mapper (`modules/ganadero/animales/infrastructure/mapper.ts`)

Función pura `mapAnimalRowToDomain(row: DbRow<'animal'>): Animal`.

- Sin async, sin efectos secundarios — fácilmente testeable.
- Único cast necesario: `tipo` (`string` en DB con CHECK constraint → `'normal' | 'reproductor'` en dominio).
- Los tipos enum de DB y dominio tienen los mismos valores — TypeScript los acepta directamente.
- Es el único punto del sistema que conoce ambas familias de tipos.

### Tarea 3 — Repository (`modules/ganadero/animales/infrastructure/repository.ts`)

Nueva función `listAnimales()` añadida al stub existente:
```ts
const { data, error } = await supabase.from('animal').select('*').order('created_at', { ascending: false })
return data.map(mapAnimalRowToDomain)
```
Los stubs `getAnimalById`, `listAnimalesByLote` e `insertAnimal` permanecen para implementación futura.

### Tarea 4 — Use case + proyección (`modules/ganadero/animales/application/listarAnimales.ts`)

Dos responsabilidades en un fichero:
- `AnimalListItem` — proyección para la UI con solo los campos del listado (subconjunto de `Animal`). La UI nunca trabaja con `Animal` completo ni con `DbRow`.
- `listarAnimales()` — llama al repository y mapea `Animal[]` → `AnimalListItem[]`.

### Tarea 5 — Página SSR (`app/(main)/vacuno/animales/page.tsx`)

Server Component async que llama a `listarAnimales()` durante el render en servidor. Sin estado client-side, sin React Query, sin loading spinners — HTML ya poblado al llegar al cliente.

```tsx
export default async function AnimalesPage() {
  const animales = await listarAnimales()
  return <PageContainer>...<AnimalesTable data={animales} /></PageContainer>
}
```

### Tarea 6 — DataTable conectada (`app/(main)/vacuno/animales/AnimalesTable.tsx`)

Componente `'use client'` separado de la página (DataTable usa hooks internamente).

Columnas: crotal · sexo · tipo · fecha nacimiento · estado vital · reproductivo · sanitario · origen.

- Búsqueda por crotal con `searchColumn="crotal"`.
- Columna "F. Nacimiento" con `accessorFn` que resuelve `fecha_nacimiento ?? fecha_nacimiento_estimada`.
- Valores nulos (crotal del becerro, estado reproductivo de animales no reproductores) muestran `—`.
- Formato de fechas con `formatFecha()` de `lib/format.ts`.

### Tarea 7 — Navegación

La ruta `/vacuno/animales` ya estaba configurada en `lib/navigation.ts`. No requirió cambios. El ítem del sidebar queda resaltado automáticamente al navegar a la ruta.

---

## PRD004 — Ficha de detalle del animal

**Milestone:** segundo vertical slice funcional — navegación desde la tabla al detalle de un animal individual.

Flujo completo implementado:
```
AnimalesTable (crotal link) → /vacuno/animales/[id] → getAnimalDetail → FichaAnimal
```

### Tarea 1 — `getAnimalById` en el repositorio

Nueva función en `modules/ganadero/animales/infrastructure/repository.ts`:

```ts
export async function getAnimalById(id: UUID): Promise<Animal | null> {
  const { data, error } = await supabase.from('animal').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  return mapAnimalRowToDomain(data)
}
```

Usa `.maybeSingle()` en lugar de `.single()` para retornar `null` sin lanzar error cuando el animal no existe.

### Tarea 2 — `getAnimalCrotal` en el repositorio

Consulta optimizada que carga solo el `crotal` de un animal por su ID:

```ts
export async function getAnimalCrotal(id: UUID): Promise<string | null> {
  const { data } = await supabase.from('animal').select('crotal').eq('id', id).maybeSingle()
  return data?.crotal ?? null
}
```

Se usa exclusivamente para resolver etiquetas de madre/padre sin cargar el registro completo.

### Tarea 3 — Proyección `AnimalDetail` y use case `getAnimalDetail`

`modules/ganadero/animales/application/getAnimalDetail.ts`

`AnimalDetail` es una proyección separada de `AnimalListItem`. Añade los campos propios de la ficha (`num_hierro`, `es_reproductora`, `fecha_nacimiento_estimada`, `lote_id`) y resuelve los crotales de progenitores:

```ts
const [madre_crotal, padre_crotal] = await Promise.all([
  animal.madre_id ? getAnimalCrotal(animal.madre_id) : Promise.resolve(null),
  animal.padre_id ? getAnimalCrotal(animal.padre_id) : Promise.resolve(null),
])
```

Las dos consultas de crotales se ejecutan en paralelo con `Promise.all`.

### Tarea 4 — Badges de estado (`EstadosBadges.tsx`)

`modules/ganadero/animales/ui/ficha/EstadosBadges.tsx`

Tres Server Components: `EstadoVitalBadge`, `EstadoReproductivoBadge`, `EstadoSanitarioBadge`.

Patrón de configuración con `Record<Enum, { label, className }>` en lugar de switch:

```ts
const VITAL_CONFIG: Record<EstadoVital, { label: string; className: string }> = {
  vivo:    { label: 'Vivo',    className: 'bg-success-soft text-success' },
  muerto:  { label: 'Muerto',  className: 'bg-alert-soft text-alert' },
  vendido: { label: 'Vendido', className: 'bg-surface-alt text-ink-muted' },
}
```

`EstadoReproductivoBadge` acepta `null` y muestra `—` (no lanza). `className` adicional en todos para componer desde el exterior.

Reutilizados también en `AnimalesTable` para las columnas de estado.

### Tarea 5 — `FichaSection`

`modules/ganadero/animales/ui/ficha/FichaSection.tsx`

Contenedor de sección reutilizable: `rounded-lg border border-divider bg-surface-base p-5` con título en `text-sm font-semibold text-ink-muted uppercase tracking-wide`. Punto de extensión para añadir secciones futuras sin tocar la estructura principal.

### Tarea 6 — `AnimalHeader`

`modules/ganadero/animales/ui/ficha/AnimalHeader.tsx`

Cabecera de identidad del animal. Lógica de identificador:
- Identificador principal: `crotal ?? num_hierro`
- Subtítulo (`Hierro: ...`): solo aparece cuando existen ambos, para no repetir el identificador
- Sin identificador: muestra "Sin crotal" en itálica y `text-ink-muted`

Estilo de la tarjeta: fondo `var(--world-accent-soft)` + borde `border-world` + `shadow-sm` para dar énfasis de identidad al contexto del mundo activo.

### Tarea 7 — `SeccionEstados`

`modules/ganadero/animales/ui/ficha/SeccionEstados.tsx`

Muestra los tres estados del animal usando `FichaSection` y los badges. El estado reproductivo solo aparece si `animal.es_reproductora === true`.

### Tarea 8 — `SeccionOrigen`

`modules/ganadero/animales/ui/ficha/SeccionOrigen.tsx`

Muestra procedencia, fecha de nacimiento con edad calculada, y links a progenitores.

`calcularEdad` es una función de presentación (no regla de dominio) definida en el componente. Devuelve formato humanizado: días / meses / "N años y M meses".

`ProgenitorLink`: si hay `madre_id` / `padre_id`, renderiza `<Link>` a la ficha del progenitor con `crotal ?? #${id.slice(0, 8)}` como etiqueta.

La fecha usa `fecha_nacimiento ?? fecha_nacimiento_estimada`. Si es estimada, el label cambia a "F. nacimiento (est.)".

### Tarea 9 — `FichaAnimal`

`modules/ganadero/animales/ui/ficha/FichaAnimal.tsx`

Orquestador de composición: `AnimalHeader` + grid 1→2 columnas con `SeccionEstados` y `SeccionOrigen`. No contiene lógica, solo composición. Punto de extensión para secciones futuras (genealogía, eventos, finanzas).

### Tarea 10 — Página de detalle SSR

`app/(main)/vacuno/animales/[id]/page.tsx`

```tsx
export default async function AnimalDetailPage({ params }: Props) {
  const { id } = await params   // Next.js 16: params es una Promise
  const animal = await getAnimalDetail(id)
  if (!animal) notFound()
  return <PageContainer>...<FichaAnimal animal={animal} /></PageContainer>
}
```

`params` debe ser `Promise<{ id: string }>` y awaiteado — patrón obligatorio en Next.js 16.

### Tarea 11 — Estados de UI de la ruta

`app/(main)/vacuno/animales/[id]/`

- `loading.tsx` — Server Component. Skeleton con `animate-pulse` que replica la estructura visual de la ficha (cabecera + grid de dos secciones).
- `error.tsx` — **Client Component** (`'use client'` obligatorio para acceder a `reset()`). Muestra mensaje de error con botón para reintentar.
- `not-found.tsx` — Server Component. Mensaje "Animal no encontrado" con link de vuelta al listado.

### Tarea 12 — Navegación desde `AnimalesTable`

La columna `crotal` de `AnimalesTable` se convirtió en un `<Link>` a `/vacuno/animales/${id}`:

```tsx
cell: ({ row, getValue }) => {
  const crotal = getValue<string | null>()
  return (
    <Link href={`/vacuno/animales/${row.original.id}`} className="font-medium text-world hover:underline underline-offset-2">
      {crotal ?? <span className="text-ink-muted font-normal">Sin crotal</span>}
    </Link>
  )
}
```

Los badges de estado (`EstadoVitalBadge`, etc.) también se adoptaron en la tabla, reemplazando los valores de texto plano anteriores.

---

## Post-PRD004 — Catálogo de razas por especie

Modelo de datos y propagación completa de `raza` a través de todas las capas.

### Migración (`supabase/migrations/20260606000000_raza.sql`)

```sql
CREATE TABLE raza (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre  TEXT NOT NULL,
  especie especie_enum NOT NULL,
  activa  BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (nombre, especie)
);
ALTER TABLE animal ADD COLUMN raza_id UUID REFERENCES raza(id) ON DELETE RESTRICT;
```

Catálogo inicial: Morucha, Charolesa, Limusina, Cruzada (vacuno) · Ibérico, Duroc (porcino). UUIDs fijos (`bb000001-…`) para referenciarlos desde el seed.

`ON DELETE RESTRICT`: no se puede borrar una raza si algún animal la referencia. La desactivación (`activa = false`) es el mecanismo de baja sin romper integridad.

RLS habilitada con política `authenticated` igual que el resto de tablas.

### Propagación por capas

- **`domain/types.ts`** — `Animal` gana `raza_id: UUID | null` y `raza_nombre: string | null`.
- **`infrastructure/mapper.ts`** — tipo local `AnimalRowWithRaza = DbRow<'animal'> & { raza: { nombre: string } | null }`. El mapper resuelve `raza_nombre` desde el JOIN en el mismo paso de mapeo.
- **`infrastructure/repository.ts`** — todas las queries cambian a `select('*, raza(nombre)')`. El JOIN es la única consulta; no hay N+1.
- **`application/listarAnimales.ts`** — `AnimalListItem` añade `raza_nombre: string | null`.
- **`application/getAnimalDetail.ts`** — `AnimalDetail` añade `raza_nombre: string | null`.
- **`ui/ficha/AnimalHeader.tsx`** — pill de raza condicional junto a sexo y tipo.
- **`AnimalesTable.tsx`** — columna "Raza" con `—` cuando es null.

### `.gitignore` corregido

La regla `db/` (sin anclar) ignoraba `modules/shared/db/`. Corregida a `/db/`. `database.types.ts`, `helpers.ts` e `index.ts` pasan a estar en git.
