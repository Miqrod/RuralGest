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

## Tests

- caso válido → resultado esperado
- caso inválido → error con mensaje correcto
- edge case → límite de la regla (cantidad = 0, estado incorrecto para transición)