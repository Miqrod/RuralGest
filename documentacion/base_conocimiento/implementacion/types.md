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