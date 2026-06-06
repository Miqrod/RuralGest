# Patterns

## Use case: flujo estándar

```
application/useCase.ts
  1. Validar con domain/rules.ts (throws si inválido)
  2. Llamar a infrastructure/repository.ts
  3. (Opcional) efectos secundarios: actualizar estados derivados, crear eventos relacionados
  4. Retornar entidad resultante
```

## Repository: funciones Supabase directas

Los repositorios no son interfaces abstractas. Son funciones async que usan el cliente Supabase del servidor:

```ts
export async function getAnimalById(id: UUID): Promise<Animal | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('animal').select('*').eq('id', id).single()
  if (error) throw error
  return data
}
```

## Domain rules: asserts que lanzan

Las reglas de dominio son funciones que lanzan si la condición no se cumple. No devuelven boolean:

```ts
export function assertLoteActivo(estado: string) {
  if (estado !== 'activo') throw new Error('El lote no está activo')
}
```

## Tipos: separación domain vs DB

- `domain/types.ts`: tipos de negocio (lo que maneja la app)
- `database.types.ts` (Task 7): tipos generados desde el schema de Supabase
- Los repositorios mapean entre ambos si es necesario

## Evento → Estado derivado

Cuando un evento cambia el estado de una entidad:

```
registrarEvento → evento insertado → actualizar estado derivado en animal/lote
```
El estado nunca se edita directamente. Siempre hay un evento que lo justifica.

## Seed: datos estructurales vs datos de usuario

- `supabase/migrations/seed_*.sql` → datos estructurales del sistema (catálogos)
- Los datos de usuario (granjas, animales, lotes reales) nunca van en migraciones

## Vertical slice: página de listado SSR

Patrón completo validado en PRD003 para pantallas de solo lectura:

```
page.tsx (Server Component, async)
  → useCase/listarX()          — application/
    → repository/listX()       — infrastructure/
      → supabase.from(...)
        → mapXRowToDomain()    — infrastructure/mapper.ts
  → <XTable data={items} />   — 'use client', en la misma carpeta de la página
```

- La página es async Server Component: fetch en servidor, HTML poblado al cliente.
- La tabla es Client Component separado porque DataTable usa hooks.
- La UI recibe una proyección (`XListItem`), nunca `DbRow` ni el tipo de dominio completo.
- La proyección se define en `application/` junto al use case que la produce.

## Columnas con accessor compuesto en DataTable

Cuando una columna depende de más de un campo (ej: fecha_nacimiento ?? fecha_nacimiento_estimada):

```tsx
{
  id: 'fecha_nacimiento',
  header: 'F. Nacimiento',
  accessorFn: (row) => row.fecha_nacimiento ?? row.fecha_nacimiento_estimada,
  cell: ({ getValue }) => {
    const val = getValue<string | null>()
    return val ? formatFecha(val) : <span className="text-ink-muted">—</span>
  },
}
```

## Auth: protección de rutas

`proxy.ts` en la raíz protege todas las rutas salvo las de `PUBLIC_PATHS`:

```ts
const PUBLIC_PATHS = ['/login', '/auth/callback']
// ...
const isPublic = PUBLIC_PATHS.includes(pathname)   // exacto, no startsWith
if (!user && !isPublic) redirect('/login')
if (user && pathname === '/login') redirect('/home')
```

## Auth: logout en componente cliente

```ts
const supabase = createClient()          // browser client
await supabase.auth.signOut()
router.push('/login')
```

No usar Server Actions para logout — el cliente browser es suficiente y más simple.

## Auth: getUser() en Server Components / Actions

```ts
import { getUser } from '@/lib/supabase/server'
const user = await getUser()             // lanza si no hay sesión
```

## Dropdown flotante (UserMenu pattern)

Patrón reutilizable para menús flotantes anclados a un botón:
- `useRef<HTMLDivElement>` en el contenedor → listener `mousedown` en `document` para cerrar al hacer click fuera.
- El panel usa `absolute right-0 top-full mt-2` para posicionarse debajo del trigger.
- Estilos: `bg-canvas rounded-xl border border-divider/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.12)]`.

## Vertical slice: página de detalle SSR

Patrón validado en PRD004 para pantallas de detalle de una entidad:

```
page.tsx (Server Component, async)
  → useCase/getXDetail(id)       — application/
    → repository/getXById(id)   — infrastructure/, usa .maybeSingle()
    → repository/getXLabel(id)  — consulta ligera para resolver etiquetas de relacionados
  → if (!entity) notFound()
  → <FichaX entity={entity} />  — ui/ficha/, Server Components
```

- `params` es `Promise<{ id: string }>` en Next.js 16 — siempre awaitearlo.
- `.maybeSingle()` retorna `null` sin lanzar cuando el registro no existe; `.single()` lanza.
- `notFound()` delega a `not-found.tsx` de la ruta.

## Badge con config object

Para badges con variantes por enum, usar `Record<Enum, { label, className }>` en lugar de switch:

```ts
const CONFIG: Record<EstadoVital, { label: string; className: string }> = {
  vivo:    { label: 'Vivo',    className: 'bg-success-soft text-success' },
  muerto:  { label: 'Muerto',  className: 'bg-alert-soft text-alert' },
  vendido: { label: 'Vendido', className: 'bg-surface-alt text-ink-muted' },
}
export function XBadge({ estado }: { estado: EstadoVital }) {
  const { label, className } = CONFIG[estado]
  return <span className={cn(base, className)}>{label}</span>
}
```

Acepta `className` extra para componer desde el exterior. Si el valor puede ser `null`, manejar antes de acceder al config.

## Consulta ligera para resolver etiquetas

Cuando solo se necesita un campo de una entidad relacionada (ej: el crotal de la madre), hacer una consulta ligera en lugar de cargar el registro completo:

```ts
export async function getAnimalCrotal(id: UUID): Promise<string | null> {
  const { data } = await supabase.from('animal').select('crotal').eq('id', id).maybeSingle()
  return data?.crotal ?? null
}
```

Si hay varios relacionados, resolverlos en paralelo con `Promise.all`.

## Cálculo de presentación en el componente UI

Las funciones de formato humanizado (edades, duraciones, etiquetas derivadas de valores brutos) viven en el componente que las muestra, no en `domain/`:

```ts
function calcularEdad(fechaIso: string): string { ... }  // en SeccionOrigen.tsx
```

Solo van al dominio si son reglas de negocio (validaciones, invariantes). El formato de pantalla no lo es.

## Estados de ruta Next.js (loading / error / not-found)

Cada ruta con fetch async debe tener los tres archivos:
- `loading.tsx` — Server Component, skeleton con `animate-pulse` que imita la estructura visual de la página.
- `error.tsx` — **Client Component** (`'use client'` obligatorio), recibe `{ error, reset }`, muestra mensaje con botón de reintento.
- `not-found.tsx` — Server Component, se activa con `notFound()` en la página.

## Tests

- caso válido → resultado esperado
- caso inválido → error con mensaje correcto
- edge case → límite de la regla (cantidad = 0, estado incorrecto para transición)