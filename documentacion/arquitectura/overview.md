# Arquitectura

## Principios

- **Event-driven**: `eventos` es la única fuente de verdad. Los estados (`estado_vital`, `estado_reproductivo`, etc.) son derivados, nunca editados directamente.
- **Backend decide, DB protege**: la lógica de negocio vive en `application/` y `domain/`. La DB añade constraints como última línea de defensa (no lógica compleja en triggers).
- **Trazabilidad completa**: `factura → factura_linea → venta_linea → evento → animal/lote`. Ningún atajo rompe esta cadena.
- **El código no depende de cómo está guardada la DB**: los domain types son independientes del schema. Los cambios de schema solo afectan a los mappers.

---

## Resumen conceptual

| Concepto | Idea real |
|---|---|
| DB | guarda |
| Dominio | interpreta |
| Repositories | hablan con la DB |
| Mappers | traducen |
| Tipos TS | contratos |
| Modules | separan negocio |
| Arquitectura | controla complejidad |
| RLS | controla acceso |

---

## Capas verticales (por tecnología)

```
app/           ← rutas Next.js App Router (solo entrada/salida)
modules/       ← lógica de negocio organizada por dominio
lib/           ← utilidades transversales (format, config, navigation…)
supabase/      ← migraciones SQL y seed
```

---

## Capas horizontales dentro de cada módulo

Cada submódulo (`animales`, `lotes`, `eventos`, `ventas`…) sigue esta estructura:

```
<módulo>/
  domain/
    types.ts      ← tipos de negocio (conceptos, estados derivados, invariantes)
    rules.ts      ← funciones que lanzan si se viola una regla de negocio
  application/
    <caso>.ts     ← orquesta domain + infrastructure; nunca toca la DB directamente
  infrastructure/
    repository.ts ← única capa que habla con Supabase
    mapper.ts     ← funciones puras: DbRow ↔ Domain (sin dependencias externas)
  ui/
    <Componente>  ← componentes React y hooks específicos del módulo
```

La dirección de dependencia es siempre hacia adentro:

```
ui → application → domain
infrastructure → domain
```

Nunca al revés. `domain/` no importa nada de fuera del módulo excepto tipos base.

---

## Separación de tipos: DB vs Dominio

Existen dos familias de tipos completamente separadas:

### Tipos de DB (`modules/shared/db/database.types.ts`)

Generados automáticamente por Supabase CLI. Representan el schema persistente tal cual.
Nunca se usan directamente en lógica de negocio.

```ts
// Helpers sobre el tipo generado Database
export type DbRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type DbInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type DbUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
```

Uso en infrastructure:
```ts
type AnimalRow    = DbRow<'animal'>    // como llega de la DB
type AnimalInsert = DbInsert<'animal'> // para insertar
type AnimalUpdate = DbUpdate<'animal'> // para actualizar
```

### Tipos de dominio (`domain/types.ts`)

Representan los **conceptos de negocio**. Pueden incluir:
- propiedades calculadas que no existen en la DB
- joins ya resueltos (e.g. `lote: Lote` en lugar de solo `lote_id`)
- estados derivados con semántica de negocio
- invariantes del sistema

Evolucionan con el negocio, no con el schema.

---

## El mapper: el único traductor

El mapper vive en `infrastructure/mapper.ts` y es la única pieza que conoce ambas familias de tipos.
Es una función pura — sin efectos secundarios, sin llamadas a red, fácilmente testeable.

```ts
// infrastructure/mapper.ts
import type { DbRow } from '../../shared/db/helpers'
import type { Animal } from '../domain/types'

export function mapAnimalRowToDomain(row: DbRow<'animal'>): Animal {
  return {
    id: row.id,
    estado_vital: row.estado_vital,
    // ... campo a campo, con posibles transformaciones
  }
}

export function mapAnimalDomainToInsert(input: CrearAnimalInput): DbInsert<'animal'> {
  return {
    especie: input.especie,
    // ...
  }
}
```

El repositorio llama al mapper:

```ts
// infrastructure/repository.ts
export async function getAnimalById(id: UUID): Promise<Animal | null> {
  const supabase = await createServerClient()
  const { data } = await supabase.from('animal').select('*').eq('id', id).single()
  return data ? mapAnimalRowToDomain(data) : null
}
```

---

## Árbol de módulos

```
modules/
├── shared/
│   ├── db/
│   │   ├── index.ts            ← re-export clientes Supabase (browser + server)
│   │   ├── database.types.ts   ← generado con supabase gen types (no editar a mano)
│   │   └── helpers.ts          ← DbRow<T>, DbInsert<T>, DbUpdate<T>
│   └── types/
│       └── index.ts            ← UUID, ISODate, ISOTimestamp
├── ganadero/
│   ├── shared/domain/types.ts  ← enums: Especie, Sexo, EstadoVital…
│   ├── animales/
│   ├── lotes/
│   ├── eventos/
│   ├── movimientos/
│   └── reproductivo/
├── financiero/
│   ├── shared/domain/types.ts  ← enums: TipoFinanciero, OrigenTransaccion…
│   ├── terceros/
│   ├── ventas/
│   ├── facturas/
│   └── transacciones/
└── cross-domain/
    └── monetizacion-eventos/   ← puente GANADERO ↔ FINANCIERO (vía venta_linea)
```

---

## Dominio ganadero ↔ financiero

El único punto de contacto entre dominios es `venta_linea`:

```
eventos (ganadero)
  └── venta_linea   ← puente: conecta evento físico con acuerdo comercial
        └── venta (financiero)
              └── transaccion (financiero)
```

`cross-domain/monetizacion-eventos/` gestiona este cruce de forma explícita.

---

## Generación de tipos: workflow local-first

> Cuando Docker está disponible, el workflow preferido es local-first.

### Por qué local-first

| | Remote-only | Local-first (Docker) |
|---|---|---|
| Generar tipos | necesita red | instantáneo |
| Probar migraciones | afecta al remoto | entorno aislado |
| Datos de prueba | contaminan la BD | descartables |
| Trabajar sin internet | ❌ | ✅ |
| Studio (UI admin) | panel web Supabase | `localhost:54323` |

### Requisito: Docker Desktop

Docker Desktop es la única dependencia externa. Compatible con macOS y Windows.
Una vez instalado, Supabase CLI lo detecta automáticamente.

### Workflow local-first

```bash
supabase start                              # levanta stack local (primera vez descarga imágenes ~2-3 GB)
supabase db push                            # aplica migraciones al local
supabase gen types typescript --local \
  > modules/shared/db/database.types.ts    # regenera tipos desde local
supabase db push --linked                  # sube al remoto cuando esté listo
supabase stop                              # apaga el stack local
```

Script en `package.json`:
```json
"db:types": "supabase gen types typescript --local > modules/shared/db/database.types.ts"
```

### Fallback sin Docker (remote-only)

```bash
supabase gen types typescript --project-id <ref> > modules/shared/db/database.types.ts
```

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16, App Router |
| UI | React 19, Tailwind v4, @base-ui/react |
| Base de datos | Supabase (PostgreSQL) |
| Cliente DB | @supabase/ssr (browser + server) |
| Tipos | TypeScript estricto |
| Formularios | react-hook-form + zod |
| Tablas | TanStack Table v8 |
