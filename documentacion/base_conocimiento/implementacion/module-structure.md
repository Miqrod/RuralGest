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
    types.ts        ← tipos de negocio (conceptos, estados derivados, invariantes)
    rules.ts        ← funciones que lanzan si se viola una regla de negocio
  application/
    queries/        ← casos de uso de lectura (proyecciones de salida para la UI)
      listarX.ts
      getXDetail.ts
    actions/        ← casos de uso de escritura (orquestan validación + repositorio)
      registrarX.ts
  infrastructure/
    repository.ts   ← única capa que habla con Supabase
    mapper.ts       ← funciones puras: DbRow ↔ Domain (sin dependencias externas)
  ui/
    <Componente>    ← componentes React y hooks específicos del módulo
```

La separación `queries/` vs `actions/` refleja la asimetría entre lecturas y escrituras:
- Las **queries** producen proyecciones de salida (`XListItem`, `XDetail`) — viven en `application/` porque solo las consume `ui/`.
- Las **actions** coordinan validación de dominio + persistencia — también en `application/`.
- Los **inputs de escritura** (`RegistrarXInput`) viven en `domain/types.ts` porque `infrastructure/mapper.ts` los necesita.


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
