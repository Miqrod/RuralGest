## Dónde vive cada tipo — Dependency Rule

La **Dependency Rule** (Clean Architecture, Robert C. Martin) establece que las dependencias solo apuntan hacia adentro, hacia el dominio. Nunca hacia afuera:

```
ui → application → domain ← infrastructure
```

- `ui` conoce `application` y `domain`, pero `domain` no conoce `ui`.
- `application` conoce `domain` e `infrastructure`, pero `domain` no conoce `application`.
- `infrastructure` conoce `domain`, pero `domain` no conoce `infrastructure`.
- `domain` no importa nada de fuera del módulo excepto tipos base (`UUID`, `ISODate`…).

Esta regla define también **dónde debe residir cada categoría de tipo**. Incumplirla obliga a mover código más adelante.

| Tipo | Carpeta | Motivo |
|------|---------|--------|
| Entidades de dominio (`Animal`, `Lote`…) | `domain/types.ts` | Son el núcleo; nadie depende de ellos hacia afuera |
| **Inputs de operaciones de dominio** (`RegistrarCompraAnimalInput`, `CrearAnimalInput`…) | **`domain/types.ts`** | `infrastructure/mapper.ts` los necesita para los mappers de escritura; si vivieran en `application/`, `infrastructure/` tendría que importar de `application/` — dirección prohibida |
| Proyecciones de salida para UI (`AnimalListItem`, `AnimalDetail`…) | `application/queries/*.ts` | Son vistas específicas de una query; no las necesita `infrastructure/` |
| Validaciones de un use case concreto | `application/actions/*.ts` | Pertenecen al use case, no al dominio general |
| Tipos de DB (`DbRow`, `DbInsert`…) | `modules/shared/db/` | Solo visibles en `infrastructure/`; nunca en `domain/` ni `application/` |

**Regla mnemotécnica**: si `infrastructure/mapper.ts` necesita el tipo para un mapper de escritura, el tipo pertenece a `domain/`. Si solo lo necesita la UI para mostrar datos, puede vivir en `application/`.