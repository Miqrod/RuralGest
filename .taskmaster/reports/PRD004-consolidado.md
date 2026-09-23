# PRD Consolidado — Fase 4: Ficha Individual de Animal Vacuno

## Fuentes de contexto integradas

Este documento consolida:
- `AI_docs/product_spec.md`
- `AI_docs/frontend_spec.md`
- `AI_docs/backend_spec.md`
- `.taskmaster/reports/objetivos_fase04.md`
- `AI_docs/frontend_patterns.md`
- `documentacion/arquitectura/overview.md`

---

## 1. Visión del producto (product_spec.md)

La aplicación gestiona una explotación ganadera con cuatro capas:
- Realidad física → eventos, animales, lotes
- Operación comercial → ventas
- Documento legal → facturas
- Dinero → transacciones

**Principio fundamental**: Los eventos son la única fuente de verdad.

Los estados (`estado_vital`, `estado_reproductivo`, `estado_sanitario`) son **derivados de eventos**, nunca editados directamente.

El sistema es **event-driven**, no CRUD. Las correcciones se hacen mediante compensación, nunca mutando el pasado.

---

## 2. Stack tecnológico

- **Framework**: Next.js 16 con App Router (SSR-first, Server Components por defecto)
- **UI**: React 19, Tailwind v4, shadcn/ui, @base-ui/react
- **Base de datos**: Supabase (PostgreSQL)
- **Cliente DB**: @supabase/ssr (browser + server)
- **Tipos**: TypeScript estricto, generados desde Supabase CLI
- **Tablas**: TanStack Table v8
- **Formularios**: react-hook-form + zod

---

## 3. Arquitectura (backend_spec.md + overview.md)

### Capas del sistema

```
app/(main)/vacuno/     ← rutas Next.js App Router (solo entrada/salida, NUNCA lógica)
modules/               ← lógica de negocio por dominio
lib/                   ← utilidades transversales (format, config…)
supabase/migrations/   ← SQL versionado
```

### Capas dentro de cada módulo

Cada submódulo sigue esta estructura **obligatoria**:
```
<módulo>/
  domain/
    types.ts      ← tipos de negocio (entidades, estados, invariantes)
    rules.ts      ← funciones puras que lanzan si se viola una regla
  application/
    <caso>.ts     ← orquesta domain + infrastructure; nunca accede a la DB directamente
  infrastructure/
    repository.ts ← única capa que habla con Supabase
    mapper.ts     ← funciones puras: DbRow ↔ Domain (sin efectos secundarios)
  ui/
    <Componente>  ← componentes React específicos del módulo
```

Dirección de dependencia **siempre hacia adentro**:
```
ui → application → domain
infrastructure → domain
```

### Reglas absolutas de arquitectura

- La página NUNCA accede a Supabase directamente: `page → use case → repository`
- La UI trabaja con **proyecciones** definidas en `application/`, nunca con `DbRow` ni tipos de dominio completos
- `domain/` no importa nada de fuera del módulo excepto tipos base
- Los tipos DB (`DbRow<T>`) se usan SOLO en `infrastructure/`

### Separación de tipos: DB vs Dominio

```typescript
// Solo en infrastructure/: tipos de persistencia
export type DbRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

// En domain/types.ts: conceptos de negocio independientes del schema
export interface Animal {
  id: UUID
  crotal: string | null
  // ... campos con semántica de negocio
}
```

---

## 4. Estado actual del código

### Módulo ganadero/animales ya implementado

**domain/types.ts** — El tipo `Animal` completo ya existe:
```typescript
export interface Animal {
  id: UUID
  especie: Especie           // 'vacuno' | 'porcino'
  tipo: 'normal' | 'reproductor'
  crotal: string | null
  num_hierro: string | null
  fecha_nacimiento: ISODate | null
  fecha_nacimiento_estimada: ISODate | null
  sexo: Sexo                 // 'macho' | 'hembra'
  madre_id: UUID | null
  padre_id: UUID | null
  es_reproductora: boolean
  origen: OrigenAnimal       // 'interno' | 'compra'
  lote_id: UUID | null
  lote_origen_id: UUID | null
  evento_creacion_id: UUID | null
  evento_origen_id: UUID | null
  estado_vital: EstadoVital           // 'vivo' | 'muerto' | 'vendido'
  estado_reproductivo: EstadoReproductivo | null  // 'vacia' | 'gestante' | 'lactante' | 'no_reproductiva'
  estado_sanitario: EstadoSanitario   // 'sano' | 'en_observacion' | 'en_tratamiento' | 'no_apto'
  ubicacion_actual_id: UUID | null
  created_at: ISOTimestamp
  created_by: UUID | null
  updated_at: ISOTimestamp
  updated_by: UUID | null
}
```

**infrastructure/mapper.ts** — `mapAnimalRowToDomain` ya funciona.

**infrastructure/repository.ts** — `listAnimales()` funciona. `getAnimalById()` está declarada pero lanza `Error('not implemented')`. Las demás también son stubs.

**application/listarAnimales.ts** — Funciona. Genera proyección `AnimalListItem` (subconjunto de Animal para el listado).

**app/(main)/vacuno/animales/page.tsx** — Listado SSR funcionando.

**app/(main)/vacuno/animales/AnimalesTable.tsx** — Client Component con DataTable y columnas. Actualmente el crotal no es un link.

### Sistema de colores del proyecto (Tailwind CSS variables)

```css
/* Acento del mundo activo (verde para vacuno, azul para porcino...) */
text-world / bg-world / border-world

/* Texto */
text-ink / text-ink-muted

/* Superficies */
bg-surface-base / bg-surface-alt / bg-canvas

/* Estados */
text-success / bg-success-soft   /* positivos: vivo, sano, lactante */
text-warning / bg-warning-soft   /* atención: en_observacion, gestante */
text-alert / bg-alert-soft       /* alerta: muerto, en_tratamiento, no_apto */

/* Bordes */
border-divider
```

### Componentes de layout disponibles

- `PageContainer` — contenedor estándar centrado (máx. 1280px, px-6 py-7)
- `PageContainerWide` — contenedor ancho (100% disponible)
- Sidebar ya configurado con entrada "Ficha de animal" en el menú de Vacuno

---

## 5. Objetivo de Fase 4 (objetivos_fase04.md)

Implementar la **ficha individual de animal** en `/vacuno/animales/[id]`.

**Objetivo principal**: validar routing dinámico, SSR individual, proyecciones de detalle, composición UI modular y navegación lista → detalle.

**NO incluir en esta fase**:
- Edición, formularios de escritura, mutaciones
- Server Actions complejas, invalidaciones, caches avanzadas
- Timeline de eventos o historial completo
- Genealogía completa avanzada (árbol)
- Finanzas relacionadas, analytics
- Tabs avanzadas

---

## 6. Principios de UX (frontend_spec.md + frontend_patterns.md)

- Diseño limpio, moderno, responsive (mobile-first)
- Sin breadcrumbs
- SSR-first: Server Components por defecto, Client Components solo cuando haya interacción/estado
- Componentes pequeños y con nombres explícitos (`AnimalHeader`, no `Container`)
- La ficha debe priorizar: claridad, velocidad de lectura, jerarquía visual, densidad moderada
- Badges/pills para representar estados visualmente (lectura rápida)
- La aplicación es una herramienta operacional, no una landing visual

---

## 7. Requisitos funcionales por tarea

### TAREA 1 — Implementar `getAnimalById` en el repositorio

**Archivo**: `modules/ganadero/animales/infrastructure/repository.ts`

La función existe pero lanza `Error('not implemented')`. Implementar con Supabase usando `.maybeSingle()` (retorna null si no existe, sin lanzar error).

```typescript
export async function getAnimalById(id: UUID): Promise<Animal | null>
```

Usar `mapAnimalRowToDomain(data)` con el mapper existente.

### TAREA 2 — Añadir helper `getAnimalCrotal` en el repositorio

**Archivo**: `modules/ganadero/animales/infrastructure/repository.ts`

Consulta ligera para resolver el crotal de un animal dado su ID. Se usará para mostrar el identificador de madre/padre en la ficha sin cargar el animal completo.

```typescript
export async function getAnimalCrotal(id: UUID): Promise<string | null>
```

### TAREA 3 — Crear proyección `AnimalDetail` y use case `getAnimalDetail`

**Archivo**: `modules/ganadero/animales/application/getAnimalDetail.ts`

Proyección de detalle **separada** de `AnimalListItem`. La UI nunca reutiliza la proyección del listado para el detalle (contextos diferentes → proyecciones diferentes).

```typescript
export interface AnimalDetail {
  id: UUID
  crotal: string | null
  num_hierro: string | null
  especie: Especie
  sexo: Sexo
  tipo: 'normal' | 'reproductor'
  es_reproductora: boolean
  estado_vital: EstadoVital
  estado_reproductivo: EstadoReproductivo | null
  estado_sanitario: EstadoSanitario
  origen: OrigenAnimal
  fecha_nacimiento: ISODate | null
  fecha_nacimiento_estimada: ISODate | null
  madre_id: UUID | null
  madre_crotal: string | null    // resuelto por el use case
  padre_id: UUID | null
  padre_crotal: string | null    // resuelto por el use case
  lote_id: UUID | null
  created_at: ISOTimestamp
}
```

El use case `getAnimalDetail(id)` debe:
1. Llamar a `getAnimalById(id)` → si null, retornar null
2. Si hay `madre_id` o `padre_id`, llamar a `getAnimalCrotal()` para cada uno en paralelo (`Promise.all`)
3. Construir y retornar `AnimalDetail`

La application/ **nunca** llama a Supabase directamente.

### TAREA 4 — Crear badges reutilizables de estado

**Archivo**: `modules/ganadero/animales/ui/ficha/EstadosBadges.tsx`

Tres componentes Server Component (sin 'use client'):

- `EstadoVitalBadge({ estado: EstadoVital })`:
  - `vivo` → `bg-success-soft text-success`
  - `muerto` → `bg-alert-soft text-alert`
  - `vendido` → `bg-surface-alt text-ink-muted`

- `EstadoReproductivoBadge({ estado: EstadoReproductivo | null })`:
  - `gestante` → `bg-warning-soft text-warning`
  - `lactante` → `bg-success-soft text-success`
  - `vacia` / `no_reproductiva` / null → `bg-surface-alt text-ink-muted`

- `EstadoSanitarioBadge({ estado: EstadoSanitario })`:
  - `sano` → `bg-success-soft text-success`
  - `en_observacion` → `bg-warning-soft text-warning`
  - `en_tratamiento` / `no_apto` → `bg-alert-soft text-alert`

Estilo base del badge: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`

### TAREA 5 — Crear componente de sección extensible `FichaSection`

**Archivo**: `modules/ganadero/animales/ui/ficha/FichaSection.tsx`

Tarjeta reutilizable que envuelve cada sección de la ficha. Permite añadir nuevas secciones en el futuro sin modificar la estructura principal.

```typescript
interface Props {
  title: string
  children: ReactNode
  className?: string
}
```

Estilo: `rounded-lg border border-divider bg-surface-base p-5`. Título en `text-sm font-semibold text-ink-muted uppercase tracking-wide mb-4`.

### TAREA 6 — Crear cabecera del animal `AnimalHeader`

**Archivo**: `modules/ganadero/animales/ui/ficha/AnimalHeader.tsx`

Server Component. Muestra:
- **Identificador principal**: crotal si existe, sino num_hierro, sino ID corto (`#${id.slice(0,8)}`)
- **Subtítulo**: num_hierro si también hay crotal
- **Pills** de especie, sexo y tipo (`bg-surface-alt text-ink-muted rounded-full px-2.5 py-0.5 text-xs`)
- **Badge de estado vital** prominente, alineado a la derecha en la misma fila que el título

Usar `EstadoVitalBadge`.

### TAREA 7 — Crear sección de estados `SeccionEstados`

**Archivo**: `modules/ganadero/animales/ui/ficha/SeccionEstados.tsx`

Server Component. Usa `FichaSection` con título "Estados". Muestra filas:
- "Vital" → `EstadoVitalBadge`
- "Reproductivo" → `EstadoReproductivoBadge` (**solo si `animal.es_reproductora` es true**)
- "Sanitario" → `EstadoSanitarioBadge`

Cada fila: `flex items-center justify-between py-2 border-b border-divider last:border-0`. Etiqueta en `text-sm text-ink-muted`.

### TAREA 8 — Crear sección de origen `SeccionOrigen`

**Archivo**: `modules/ganadero/animales/ui/ficha/SeccionOrigen.tsx`

Server Component. Usa `FichaSection` con título "Origen". Muestra filas:
- "Procedencia": "Nacido en la explotación" (interno) / "Compra externa" (compra)
- "F. nacimiento" o "F. nacimiento (estimada)": fecha formateada con `formatFecha()` + edad calculada entre paréntesis (ej: "3 años y 2 meses")
- "Madre": link `<Link href={/vacuno/animales/${madre_id}}>` con crotal o "Desconocida" si no hay
- "Padre": igual, o "Desconocido"

La **edad** es aritmética de presentación (días/meses/años), no una regla de negocio. Se calcula en el componente.

Los links a progenitores usan `text-world hover:underline underline-offset-2`.

### TAREA 9 — Crear orquestador `FichaAnimal`

**Archivo**: `modules/ganadero/animales/ui/ficha/FichaAnimal.tsx`

Server Component que compone la ficha completa:
```tsx
<AnimalHeader animal={animal} />
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <SeccionEstados animal={animal} />
  <SeccionOrigen animal={animal} />
</div>
```

Este componente es el punto de extensión para añadir nuevas secciones en el futuro.

### TAREA 10 — Crear página de detalle SSR

**Archivo**: `app/(main)/vacuno/animales/[id]/page.tsx`

Server Component (async). Patrón obligatorio en Next.js 16: `params` es una Promise.

```typescript
interface Props {
  params: Promise<{ id: string }>
}

export default async function AnimalDetailPage({ params }: Props) {
  const { id } = await params
  const animal = await getAnimalDetail(id)
  if (!animal) notFound()
  // ...
}
```

Incluir link "← Volver a animales" con `href="/vacuno/animales"` y estilo `text-sm text-ink-muted hover:text-ink`.

Usar `PageContainer` para el contenedor.

### TAREA 11 — Crear estados de UI de la ruta (`loading`, `error`, `not-found`)

**Archivos en** `app/(main)/vacuno/animales/[id]/`:

- `loading.tsx` — Server Component. Skeleton de la ficha con `animate-pulse`. Simula: back-link, título, pills, y dos cards vacías en grid.

- `error.tsx` — **Client Component** (`'use client'` obligatorio: Next.js requiere error boundaries como Client Components). Props: `{ error: Error & { digest?: string }; reset: () => void }`. Mostrar mensaje simple + botón "Volver a intentar" que llame a `reset()`.

- `not-found.tsx` — Server Component. Mensaje "Animal no encontrado" + link "← Volver a la lista" con `href="/vacuno/animales"`.

### TAREA 12 — Actualizar `AnimalesTable` para navegar a la ficha

**Archivo**: `app/(main)/vacuno/animales/AnimalesTable.tsx`

En la columna `crotal`, convertir el valor en un `<Link>` de Next.js:
```tsx
<Link
  href={`/vacuno/animales/${row.original.id}`}
  className="font-medium text-world hover:underline underline-offset-2"
>
  {crotal ?? <span className="text-ink-muted font-normal">Sin crotal</span>}
</Link>
```

---

## 8. Entregables al finalizar la fase

- `/vacuno/animales` → click en crotal → navega a `/vacuno/animales/[id]`
- `/vacuno/animales/[id]` carga datos SSR, muestra: cabecera + sección de estados + sección de origen
- Loading skeleton durante la carga
- Not-found para IDs inexistentes
- Error boundary para fallos inesperados
- Badges de estado reutilizables (listos para usarse en otras vistas)
- Estructura de secciones extensible (añadir nuevas en fases futuras sin reestructurar)

---

## 9. Reglas de desarrollo (de todos los documentos de contexto)

- **Incremental**: implementar una tarea a la vez, validar antes de avanzar
- **Pedagógico**: explicar qué se hace y por qué antes de implementar
- **Quirúrgico**: no tocar código no relacionado con la tarea
- **No especulativo**: no añadir features no pedidas ni abstracciones innecesarias
- **Backend decide, DB protege, Frontend guía**
- No crear migraciones nuevas (el schema ya existe)
- No crear rutas API REST separadas (Next.js App Router usa SSR directo)
- Los estados del animal son derivados de eventos — en esta fase solo se leen, no se modifican
