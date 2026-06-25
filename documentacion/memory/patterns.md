# Patterns

## Botón principal (CTA)

Los botones de acción principal usan `h-auto py-3 px-8` para que el texto respire:

```tsx
// Botón nativo (formularios, acciones en página)
<Button type="submit" className="h-auto py-3 px-8">Guardar</Button>

// Botón-enlace (navegación entre páginas)
<Link href="/ruta" className={cn(buttonVariants(), 'h-auto py-3 px-8')}>
  Registrar entrada
</Link>
```

`h-auto` es necesario para liberar la altura fija que impone el variant por defecto.
`cn` + `tailwind-merge` resuelve los conflictos de clase.
Botones secundarios o inline (filtros, acciones de tabla…) conservan el tamaño por defecto.

## DatePicker

`components/ui/date-picker.tsx` — wrapper de Calendar (react-day-picker v10) + Popover (Base UI).
Retorna `ISODate` (string `YYYY-MM-DD`). Muestra en formato `dd/MM/yyyy` con locale `es`.

```tsx
// Sin restricción de fecha (permite futuro)
<DatePicker value={field.value} onChange={(v) => field.onChange(v ?? '')} />

// Solo fechas pasadas (nacimiento, compra, eventos históricos)
<DatePicker value={field.value} onChange={(v) => field.onChange(v ?? '')} maxDate={new Date()} />
```

- `captionLayout="dropdown"`: el usuario puede saltar directamente a cualquier año/mes.
- `maxDate?: Date`: opcional. Si se omite, no hay restricción. Si es `new Date()`, bloquea fechas futuras.
- El trigger imita el estilo del `Input` (mismo padding, border, focus ring).
- Años disponibles en dropdown: desde 2000 hasta `maxDate` (o +2 años si no hay maxDate).

## Select con valores UUID

Base UI no refleja automáticamente el `ItemText` del portal en el trigger.
Usar `children` como render function en `SelectValue`:

```tsx
<SelectValue>
  {(value: string | null) =>
    value
      ? opciones.find((o) => o.id === value)?.nombre ?? value
      : 'Selecciona una opción'
  }
</SelectValue>
```

La función recibe el valor bruto (UUID), devuelve el texto a mostrar en el trigger.
El placeholder se maneja dentro de la función (cuando `value` es null o vacío).

## Padding de campos de formulario

`Input`, `Select` (trigger) y `Textarea` usan padding aumentado para igualar la altura del `DatePicker`:

| Componente | Clases de padding |
|---|---|
| `Input` | `px-3.5 py-2.5` (sin `h-8`) |
| `SelectTrigger` | `py-2.5 pr-2.5 pl-3.5` (sin `data-[size=default]:h-8`) |
| `Textarea` | `px-3.5 py-3` |
| `DatePicker` trigger | `px-3.5 py-2.5` |

Si `npx shadcn add` regenera un componente, vuelve a los valores por defecto (`h-8 px-2.5 py-1`).
Después de cada `shadcn add` que toque estos archivos, restaurar los valores de la tabla.

Estas clases están protegidas con `@source inline(...)` en `styles/globals.css` para que
Tailwind siempre las genere (ver `mistakes.md` — TAILWIND V4 + TURBOPACK).

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

## Sección async independiente compuesta desde page.tsx

Cuando una sección de una ficha necesita hacer su propio fetch (no depende de los datos ya cargados por la página), se implementa como Server Component async que recibe solo el ID de la entidad, y se compone desde `page.tsx` al mismo nivel que el componente principal — nunca anidado dentro de él.

```tsx
// page.tsx
<div className="flex flex-col gap-4">
  <FichaAnimal animal={animal} />         ← recibe los datos ya resueltos por la página
  <SeccionEventos animalId={animal.id} /> ← hace su propio fetch por ID
</div>
```

Ventajas:
- `FichaAnimal` permanece sync y sin conocimiento de eventos.
- `SeccionEventos` es reutilizable en cualquier contexto que tenga un `animalId`.
- Si en el futuro aparece un segundo caso de uso (dashboard de rebaño, vista de lote), se extrae un primitivo de presentación `ListaEventos({ eventos })` y cada contexto aporta su fetcher.

Cuándo **no** usar este patrón: si los datos de la sección son parte inseparable de la entidad principal y ya viajan en la misma query (ej: los estados del animal en `AnimalDetail`), se componen dentro del componente principal sin fetch adicional.

## JOIN por tabla intermedia en Supabase (PostgREST)

Para recorrer una relación N:M (tabla de junction) y llegar a la tabla destino con sus campos:

```ts
supabase
  .from('evento_animales')                          // tabla junction
  .select(`
    eventos!evento_animales_evento_id_fkey (
      id,
      fecha,
      tipo_evento!eventos_tipo_evento_id_fkey ( codigo, tipo_negocio ),
      motivos_movimiento!eventos_motivo_id_fkey ( nombre )
    )
  `)
  .eq('animal_id', animalId)
```

- El nombre de FK explícito (`!tabla_columna_fkey`) es necesario cuando Supabase no puede inferir la relación de forma unívoca.
- `row.eventos` llega como un objeto (to-one), no como array — filtrar nulos antes de mapear.
- Ordenar en JS cuando la lista es corta; usar `.order()` en Supabase para listas grandes.

## Tests

- caso válido → resultado esperado
- caso inválido → error con mensaje correcto
- edge case → límite de la regla (cantidad = 0, estado incorrecto para transición)

## RPC transaccional

Toda operación que cree eventos, cree entidades derivadas o modifique snapshots derivados
debe ejecutarse mediante RPC transaccional. Ver `documentacion/arquitectura/rpc-transaccional.md`.

Regenerar tipos tras cualquier migración que cambie el schema:
```bash
supabase gen types typescript --local > types/supabase.ts
```

## Tipos Supabase generados: no duplicar en TypeScript

Con `types/supabase.ts` generado, los tipos de args de RPC ya existen en el tipo `Database`.
No crear tipos paralelos manuales (`CompraRpcArgs`, etc.) — son fuente de desincronización.
El mapper puede devolver un objeto sin anotar el tipo de retorno; TypeScript lo infiere
contra el tipo generado del RPC cuando se pasa a `.rpc()`.

```ts
// ✅ Correcto — TypeScript infiere contra Database["public"]["Functions"]["..."]["Args"]
export function mapCompraInputToRpcArgs(input: RegistrarCompraAnimalInput) {
  return { p_especie: input.especie, p_crotal: input.crotal ?? undefined, ... }
}

// ❌ Incorrecto — tipo manual que puede desincronizarse
export type CompraRpcArgs = { p_especie: string; p_crotal: string | null; ... }
```

Los campos opcionales del RPC usan `undefined` (no `null`) según la convención del tipo generado.

## Accordion con animación de altura (grid-rows trick)

Para revelar/ocultar contenido con animación suave de altura sin `max-height`:

```tsx
<div className={cn(
  'grid transition-[grid-template-rows] duration-300 ease-in-out',
  open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
)}>
  <div className="overflow-hidden min-h-0">
    {/* contenido */}
  </div>
</div>
```

- `grid-rows-[0fr]` → el hijo interno colapsa a 0 (la máscara `overflow-hidden` lo oculta)
- `grid-rows-[1fr]` → el hijo ocupa su altura natural
- `min-h-0` en el hijo interno es obligatorio para que el colapso funcione
- Animable directamente con `transition-[grid-template-rows]`

Para mantener el componente montado durante la animación de cierre (evitar desmontaje inmediato):
```tsx
const [mounted, setMounted] = useState(false)
// Montar al primer open; nunca desmontar (el grid colapsa la altura visualmente)
if (!mounted && open) setMounted(true)
{mounted && <div className={cn('grid ...', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}> ... </div>}
```

## Disclosure progresivo en formularios

Mostrar campos adicionales solo cuando el usuario ha seleccionado un valor previo,
usando el mismo grid trick:

```tsx
const motivo = form.watch('motivo')

<div className={cn(
  'grid transition-[grid-template-rows] duration-300 ease-in-out',
  motivo ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
)}>
  <div className="overflow-hidden min-h-0">
    {/* campos que dependen de motivo */}
  </div>
</div>
```

Reduce la carga cognitiva: el usuario ve solo lo que necesita rellenar en cada momento.

## AlertDialog para acciones irreversibles

Antes de ejecutar cualquier operación que no se puede deshacer (salida de animal, baja de
registro, etc.), abrir un AlertDialog de confirmación. El formulario no llama al servidor
en el `onSubmit` — guarda los valores validados en estado local y deja que el diálogo
confirme antes de llamar a la Server Action:

```tsx
function onValidSubmit(values: FormValues) {
  setPendingValues(values)   // abre el diálogo; NO llama al servidor
}

async function onConfirm() {
  const result = await submitAction(pendingValues)
  if (result?.error) { setServerError(result.error); return }
  onSuccess()
}

<AlertDialog open={pendingValues !== null}>
  <AlertDialogContent size="sm">
    <AlertDialogHeader className="place-items-center py-3">
      <AlertDialogTitle className="text-lg text-alert text-center">
        ¿Confirmar acción?
      </AlertDialogTitle>
      <AlertDialogDescription className="text-center">
        Descripción clara.<br />Esta acción no se puede deshacer.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={() => setPendingValues(null)}>Volver</AlertDialogCancel>
      <AlertDialogAction className="bg-alert hover:bg-alert/90 text-white border-transparent"
        onClick={onConfirm}>
        Confirmar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Hover selectivo sobre cabecera de panel

Cuando el hover de un panel (cambio de fondo) debe activarse solo al pasar por la cabecera
y no por el contenido, usar estado JS en lugar de `group-hover`:

```tsx
const [headerHovered, setHeaderHovered] = useState(false)

<button
  onMouseEnter={() => setHeaderHovered(true)}
  onMouseLeave={() => setHeaderHovered(false)}
>...</button>

<div className={headerHovered ? 'bg-[#E5E7EB]' : 'bg-surface-alt'}>
  {/* contenido — el hover no se activa aquí */}
</div>
```

`group-hover` afecta a todo el grupo sin distinción. El estado JS permite precisión quirúrgica.