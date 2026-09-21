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

## RPC lote para operaciones multi-entidad atómicas

Cuando una acción del usuario afecta a N entidades del mismo tipo (ej: destetar varias crías a la vez), la atomicidad debe garantizarse en Postgres, no en el caller.

**Patrón:**
```sql
-- RPC lote: una transacción para todo el array
CREATE OR REPLACE FUNCTION registrar_x_lote(p_ids UUID[], ...) RETURNS JSONB AS $$
DECLARE v_id UUID;
BEGIN
  FOREACH v_id IN ARRAY p_ids LOOP
    -- validar y procesar cada entidad
  END LOOP;
  -- efectos secundarios post-bucle (ej: cierre de ciclo)
  RETURN jsonb_build_object('procesados', p_ids);
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
```

```ts
// Application layer: pre-validación rápida sin DB (fail-fast), luego una sola llamada
for (const id of input.ids) {
  const blockers = getDomainBlockers(await getEntityById(id))
  if (blockers.length) throw new Error(...)
}
const { data, error } = await supabase.rpc('registrar_x_lote', { p_ids: input.ids })
```

**Reglas:**
- Los efectos secundarios que dependen del estado post-loop (ej: comprobar si quedan vínculos activos) se evalúan DESPUÉS del `FOREACH`, no dentro.
- Los tipos de dominio para `Input` y `Result` del lote son independientes de los de la unidad individual (`RegistrarXInput` vs `RegistrarXLoteInput`).
- Mantener la función individual para operaciones de una sola entidad; el lote es una adición, no un reemplazo.

Los campos opcionales del RPC usan `undefined` (no `null`) según la convención del tipo generado.

## Accordion con Framer Motion (patrón actual)

Para revelar/ocultar contenido con animación de altura, usar `AnimatePresence` + `motion.div`:

```tsx
import { AnimatePresence, motion } from 'framer-motion'

<AnimatePresence initial={false}>
  {open && (
    <motion.div
      key="panel"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      style={{ overflow: 'hidden' }}
    >
      {/* contenido */}
    </motion.div>
  )}
</AnimatePresence>
```

- `initial={false}` en `AnimatePresence`: evita la animación de entrada en el primer render.
- `height: 'auto'` funciona directamente con Framer Motion (no con CSS transitions).
- No necesita el hack `formMounted`/`mounted`: `AnimatePresence` mantiene el componente
  montado hasta que termina la animación de salida.
- Animar el chevron por separado: `<motion.div animate={{ rotate: open ? 180 : 0 }}>`.

## Disclosure progresivo en formularios (Framer Motion)

Mostrar campos adicionales cuando el usuario selecciona un valor previo:

```tsx
const motivo = form.watch('motivo')

<AnimatePresence initial={false}>
  {motivo ? (
    <motion.div
      key="campo-condicional"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      style={{ overflow: 'hidden' }}
    >
      {/* campos que dependen de motivo */}
    </motion.div>
  ) : null}
</AnimatePresence>
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

## Toasts con sonner

Para notificaciones de éxito/error tras acciones del usuario:

```tsx
import { toast } from 'sonner'

toast.success('Animal registrado correctamente')
toast.error('Error al registrar la salida')
```

- `<Toaster position="top-center" richColors />` en `app/layout.tsx` (una sola vez).
- Usar `toast.success` tras operaciones completadas; `toast.error` para errores de servidor.
- Los errores de validación de formulario se muestran inline (más contextuales); el toast
  es para errores que llegan del servidor después del submit.
- Server Actions que antes hacían `redirect()` deben devolver `{ id }` para que el cliente
  pueda hacer `toast.success()` + `router.push()` antes de navegar.

## Transición de página (fade-in)

`app/(main)/template.tsx` envuelve cada página en un `motion.div` con fade-in:

```tsx
'use client'
import { motion } from 'framer-motion'

export default function Template({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}
```

- `template.tsx` (no `layout.tsx`) crea una instancia nueva en cada navegación → la animación
  de entrada se dispara siempre.
- Sin `exit` ni `AnimatePresence` para evitar problemas con navegación rápida (múltiples clics).
- El fade-out no se implementa: complica la coordinación y apenas se percibe visualmente.

## Stagger en listas con Framer Motion

Para animar ítems de una lista en cascada:

```tsx
'use client'
import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, x: -6 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.2 } },
}

<motion.ol variants={container} initial="hidden" animate="show">
  {items.map((item) => (
    <motion.li key={item.id} variants={item}>...</motion.li>
  ))}
</motion.ol>
```

- Si el componente padre es un Server Component (async), extraer la lista a un Client Component
  separado que reciba los datos ya resueltos como prop.
- Para tablas con DataTable genérico, animar el wrapper completo en lugar de filas individuales:
  `<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>`.

## Badge con crossfade al cambiar de valor

Cuando un badge puede cambiar de valor en runtime (ej: `estado_vital` tras registrar salida):

```tsx
'use client'
import { AnimatePresence, motion } from 'framer-motion'

<AnimatePresence mode="wait">
  <motion.div
    key={valor}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.15 }}
  >
    <Badge valor={valor} />
  </motion.div>
</AnimatePresence>
```

- `key={valor}` fuerza a React a desmontar/montar cuando cambia, activando enter/exit.
- El componente contenedor debe ser Client Component (`'use client'`).

## Leaflet en Client Components: `dynamic({ ssr: false })` obligatorio

Aunque el componente sea Client Component (`'use client'`), Leaflet accede a `window` durante la importación del módulo, lo que falla en SSR. El `dynamic` con `ssr: false` es necesario para que el bundle de Leaflet nunca se evalúe en el servidor:

```tsx
const SelectorCoordenadas = dynamic(
  () => import('@/modules/.../SelectorCoordenadas'),
  { ssr: false, loading: () => <div>Cargando mapa…</div> }
)
```

El `dynamic` puede usarse directamente en el Client Component que lo importa — no es exclusivo de Server Components.

## `TooltipTrigger render={...}` para botones de icono con acción

`TooltipTrigger` de Base UI renderiza su propio `<button>` por defecto. Si se envuelve otro `<button>` dentro, se produce anidamiento inválido en HTML → error de hidratación.

Solución: usar el prop `render` para que Base UI fusione sus event handlers sobre el elemento ya renderizado en lugar de añadir uno nuevo:

```tsx
<TooltipTrigger
  render={
    <button
      type="button"
      onClick={handleAction}
      className="..."
    />
  }
>
  <IconComponent className="size-3.5" />
</TooltipTrigger>
```

Aplicar siempre que un botón de icono necesite tooltip Y lance una acción al hacer click. No usar `InfoPopover` para botones accionables: `InfoPopover` abre al hacer click, lo que entra en conflicto con la acción propia del botón.

## Lazy server action como prop para datos raramente consultados

Para datos que el usuario consulta con poca frecuencia (historial de ubicación, estadísticas secundarias), evitar cargarlos en el render inicial de la página. Patrón:

```tsx
// Server Component (page.tsx)
async function fetchHistorial() {
  'use server'
  return getHistorialUbicacionesAnimal(id)  // se ejecuta solo cuando el cliente la llama
}

<AnimalHeader fetchHistorial={fetchHistorial} />
```

```tsx
// Client Component
const [data, setData] = useState<Item[] | null>(null)

async function handleOpen() {
  setOpen(true)
  if (data === null) {          // carga solo en la primera apertura
    const result = await fetchHistorial()
    setData(result)
  }
}
```

- `useState(null)` actúa como centinela: `null` = no cargado, `[]` = cargado y vacío.
- La prop es opcional (`fetchHistorial?`) para que el componente funcione en contextos donde no se necesita el historial.
- No usar para datos críticos del render inicial — esos siempre van en el `Promise.all` de la página.

## DataTable con columnas sticky y scroll horizontal

Cuando un DataTable tiene más columnas de las que caben en el contenedor, aplicar este patrón completo.

### Columnas sticky izquierda

Marcar con `meta: { sticky: true }`. El `size` en px solo es necesario cuando hay varias columnas sticky consecutivas (la primera necesita `size` para que la siguiente pueda calcular su `left`). Una sola columna sticky siempre tiene `left: 0` y no necesita `size`:

```tsx
// Dos sticky consecutivas: la primera NECESITA size para el offset de la segunda
{ accessorKey: 'crotal', header: 'Crotal', size: 160, meta: { sticky: true }, ... },
{ accessorKey: 'nombre', header: 'Nombre',             meta: { sticky: true }, ... },

// Una sola sticky: sin size (auto-sizing)
{ accessorKey: 'nombre', header: 'Nombre', meta: { sticky: true }, ... },
```

### Columnas sticky derecha

Para columnas de acciones o cualquier columna que deba permanecer anclada al borde derecho:

```tsx
{ id: 'acciones', header: 'Acciones', meta: { sticky: 'right' as const }, ... }
```

- `sticky: 'right'` → `position: sticky; right: N` (acumulado desde la derecha si hay varias).
- Sin `size` explícito si es la única sticky-right (siempre `right: 0`).
- El separador visual (gradiente izquierdo) aparece en la primera sticky-right con `after:right-full` — mismo mecanismo que el separador izquierdo pero reflejado.

### Separadores visuales con fade

Ambos separadores están **siempre en el DOM** con `opacity-0` y solo pasan a `opacity-100` cuando hay contenido oculto en ese lado → fade-in/fade-out al scrollear:

```tsx
// El DataTable detecta el estado de scroll inicial y actualiza en cada evento:
const checkScroll = () => {
  setIsScrolled(scrollEl.scrollLeft > 0)
  // hasRightScroll: hay contenido a la derecha aún oculto bajo la columna sticky-right
  setHasRightScroll(scrollEl.scrollLeft < scrollEl.scrollWidth - scrollEl.clientWidth - 1)
}
checkScroll()  // llamar en mount para detectar el estado antes del primer scroll
scrollEl.addEventListener('scroll', checkScroll, { passive: true })

// Separador derecho (última sticky-left):
"after:content-[''] after:absolute after:top-0 after:bottom-0 after:left-full
 after:w-4 after:bg-gradient-to-r after:from-black/[.07] after:to-transparent
 after:pointer-events-none after:transition-opacity after:duration-200"
+ (isScrolled ? 'after:opacity-100' : 'after:opacity-0')

// Separador izquierdo (primera sticky-right):
"after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-full
 after:w-4 after:bg-gradient-to-r after:from-transparent after:to-black/[.07]
 after:pointer-events-none after:transition-opacity after:duration-200"
+ (hasRightScroll ? 'after:opacity-100' : 'after:opacity-0')
```

`box-shadow` no sirve aquí porque su `blur-radius` irradia en todas las direcciones. `::after` con `top-0/bottom-0` limita el gradiente a la altura exacta de la celda.

Ambos separadores usan `::after` (no `::before`) porque en Tailwind v4 + Turbopack `after:left-full` y `after:right-full` se escanean y generan correctamente; `before:right-full` puede no generarse.

### Por qué `relative z-0` en columnas no-sticky

En HTML tables las celdas se pintan en orden DOM (las últimas encima). Sin z-index explícito, las celdas no-sticky pueden tapar las sticky. `relative z-0` fuerza a las no-sticky a participar en el sistema de z-index → `z-20 > z-0`.

### Fondo de celdas sticky con filas de color especial

Las celdas sticky necesitan fondo **sólido** y **opaco**. El `DataTable` expone `getRowStickyClassName`:

```tsx
// Prop en DataTable — el caller controla rest Y hover de las sticky
getRowStickyClassName?: (row: TData) => string | undefined
// Cuando retorna undefined, se usa el default: 'bg-canvas group-hover:bg-surface-alt'
```

**Importante**: el string devuelto debe incluir el estado hover (`group-hover:*`) porque el DataTable no añade `group-hover:bg-surface-alt` cuando el prop está presente. Si se omite el hover, las celdas sticky no cambian al pasar el ratón.

**El color debe ser sólido**: nunca usar opacidad (`bg-alert-soft/50`) en celdas sticky porque la transparencia se mezcla con el contenido que pasa por debajo al hacer scroll-X, produciendo un color diferente al de las celdas no-sticky de la misma fila.

**Patrón para tablas con filas de estado especial** — definir tokens sólidos en `globals.css` con `color-mix()` sobre `bg-canvas`. Al usar `var()`, los tokens se adaptan automáticamente al dark mode sin redefinirlos en `.dark`:

```css
/* globals.css — dentro de :root */
--status-alert-row:       color-mix(in srgb, var(--status-alert-soft) 50%, var(--canvas));
--status-alert-row-hover: color-mix(in srgb, var(--status-alert-soft) 70%, var(--canvas));

/* globals.css — dentro de @theme inline */
--color-alert-row:       var(--status-alert-row);
--color-alert-row-hover: var(--status-alert-row-hover);
```

```tsx
// En el componente de tabla:
getRowClassName={(row) =>
  !row.activo ? 'bg-alert-row hover:bg-alert-row-hover' : undefined
}
getRowStickyClassName={(row) =>
  !row.activo ? 'bg-alert-row group-hover:bg-alert-row-hover' : undefined
}
```

Esto garantiza que sticky y no-sticky muestren el mismo color en todos los estados (reposo y hover), en light y dark mode.

**Hover estándar de fila**: el mismo problema existe para las filas normales (activas). El `<TableRow>` usa `hover:bg-surface-alt/50` (semitransparente) y la celda sticky por defecto usaba `group-hover:bg-surface-alt` (sólido al 100%) — colores distintos. La solución es el mismo patrón `color-mix()`:

```css
/* globals.css — dentro de :root */
--status-surface-row-hover: color-mix(in srgb, var(--surface-alt) 50%, var(--canvas));

/* globals.css — dentro de @theme inline */
--color-surface-row-hover: var(--status-surface-row-hover);
```

En `DataTable.tsx`, tanto `<TableRow>` como el `stickyRowBg` por defecto usan `bg-surface-row-hover` / `group-hover:bg-surface-row-hover`.

## Ancho de DataTable adaptable al contenedor (`@container`)

Cuando el layout tiene un sidebar colapsable/desplegable, el ancho disponible del contenido cambia sin que cambie el viewport. Los breakpoints de Tailwind (`sm:`, `lg:`…) no detectan esto — 1100px con sidebar visible no son los mismos 1100px que sin él.

Usar `@container` en el wrapper del componente y breakpoints de contenedor (`@[N]:`):

```tsx
// InstalacionesListado.tsx
<div className="@container">
  {/* ... */}
  <motion.div
    className="w-full @[47.5rem]:w-10/12 @[47.5rem]:mx-auto @[75rem]:w-8/12"
  >
    <DataTable ... />
  </motion.div>
</div>
```

- `@[47.5rem]` ≈ 760px de contenedor → centra la tabla a 10/12
- `@[75rem]` ≈ 1200px de contenedor → reduce a 8/12

`@container` no requiere convertir a nada nuevo: si el componente ya existe, se añade la clase al wrapper y se sustituyen los breakpoints de viewport por los de contenedor. Los valores arbitrarios `@[Nrem]:` permiten precisión sin definir breakpoints personalizados en la configuración.

Usar esta técnica cuando el DataTable esté en una página con sidebar; usar breakpoints normales solo para componentes que nunca convivan con un panel lateral cambiante.

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

## Tabla custom con columnas sticky: usar `<table>` real, no divs flex

Los divs flex no garantizan alineación de columnas entre filas: cada celda se dimensiona por su contenido, generando columnas que se "desplazan" entre filas ("serpiente"). Para cualquier tabla custom que necesite columnas sticky y alineación vertical, usar un `<table>` HTML real.

Por qué funciona:
- El algoritmo de tabla calcula un **ancho único por columna** considerando todo el contenido del `<tbody>`.
- `position: sticky` funciona nativamente en `<th>` y `<td>` sin requerir min-widths ni trucos de negación de márgenes.
- El overflow-x del contenedor desborda automáticamente cuando el contenido supera el ancho disponible.

```tsx
<div className="rounded-lg border border-divider overflow-hidden">
  <div ref={scrollRef} className="overflow-auto max-h-[60vh]">
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-surface-alt border-b border-divider/50">
          {/* Esquina: sticky top-0 + sticky left-0 → z-30 (mayor que z-20 de otros <th>) */}
          <th className="sticky top-0 left-0 z-30 bg-surface-alt px-4 py-4 text-left">...</th>
          {/* Resto de cabeceras: solo sticky top-0 → z-20 */}
          <th className="sticky top-0 z-20 bg-surface-alt px-4 py-4 text-left">...</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-divider/30">
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-surface-row-hover transition-colors cursor-pointer group">
            {/* Celda sticky-left */}
            <td className="sticky left-0 z-10 bg-canvas group-hover:bg-surface-row-hover transition-colors px-4 py-3">
              ...
            </td>
            {/* Celdas normales */}
            <td className="px-4 py-3 text-xs text-ink-muted whitespace-nowrap">...</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

**Regla**: si hay una tabla custom con más de 3-4 columnas o con datos de longitud variable, usar `<table>` desde el principio. Los divs flex solo son válidos para listas de elementos homogéneos sin estructura tabular.

## Selección de fila en `<table>` sin `<label>` wrapper

`<label>` no puede envolver un `<tr>` (HTML inválido). Para permitir clic en cualquier parte de la fila y seleccionar la entidad, usar:

```tsx
<tr
  onClick={() => toggleItem(a.id)}
  className="cursor-pointer select-none group"
>
  {/* Celda con checkbox: stopPropagation en el <input>, NO en el <td>.
      Así el clic en el td (fuera del input) burbujea hasta el <tr> y selecciona la fila.
      El clic directo en el input para allí y solo dispara onChange — evita doble toggle. */}
  <td>
    <input
      type="checkbox"
      checked={seleccionados.has(a.id)}
      onChange={() => toggleItem(a.id)}
      onClick={(e) => e.stopPropagation()}
      className="..."
    />
  </td>
  {/* Resto de celdas: sin onClick especial — burbujean hasta el <tr> */}
  <td>...</td>
</tr>
```

El error habitual es poner `stopPropagation` en el `<td>` en lugar del `<input>`: eso bloquea la selección al hacer clic en toda la celda Animal en lugar de solo en el checkbox.

## Scroll tracking para gradiente sticky en tablas custom (fuera de DataTable)

Cuando se implementa una tabla custom (no DataTable) con columnas sticky que necesitan el gradiente separador:

```tsx
// Estado y ref — dentro del componente
const scrollRef = useRef<HTMLDivElement>(null)
const [isScrolled, setIsScrolled] = useState(false)

useEffect(() => {
  const el = scrollRef.current
  if (!el) return
  const check = () => setIsScrolled(el.scrollLeft > 0)
  check()  // estado inicial antes del primer scroll del usuario
  el.addEventListener('scroll', check, { passive: true })
  return () => el.removeEventListener('scroll', check)
}, [])
```

```tsx
// En la celda sticky-left (cabecera y filas):
<th className={cn(
  'sticky left-0 z-30 bg-surface-alt ...',
  "after:content-[''] after:absolute after:top-0 after:bottom-0 after:left-full after:w-4",
  'after:bg-gradient-to-r after:from-black/[.07] after:to-transparent after:pointer-events-none',
  'after:transition-opacity after:duration-200',
  isScrolled ? 'after:opacity-100' : 'after:opacity-0',
)}>
```

La llamada `check()` en el `useEffect` es necesaria para el estado inicial: sin ella, si la tabla ya desborda al montar (scroll > 0 por otro motivo), el gradiente no aparecería hasta el primer evento de scroll del usuario.

## Grid 2-col estable: nodo de columna siempre en el DOM

En un `grid grid-cols-2`, si una columna tiene contenido condicional y se renderiza con `{condicion && <div>...</div>}`, al fallar la condición la columna desaparece del DOM y la columna hermana salta a la primera posición. Esto crea un reflow visual jarring.

**Patrón correcto**: siempre renderizar el `<div>` de la columna y condicionar el contenido dentro:

```tsx
{/* ❌ El div desaparece del grid cuando la condición falla */}
{condicion && (
  <div className="flex flex-col gap-2">
    <DatePicker ... />
  </div>
)}

{/* ✅ El div siempre ocupa su slot en el grid */}
<div className="flex flex-col gap-2">
  {condicion && (
    <>
      <DatePicker ... />
    </>
  )}
</div>
```

Para el campo Fecha en ReubicacionFlow paso 2: la condición que oculta el DatePicker se simplificó a solo `!destinoEsUbicacionActualIndividual` (el único caso donde mostrar una fecha realmente no tiene sentido). En modo multi-selección el DatePicker siempre se muestra aunque `animalesEfectivos.length === 0` — el botón de confirmar desactivado ya comunica que no se puede proceder.