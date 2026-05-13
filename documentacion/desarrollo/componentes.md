# Componentes

## DataTable
`components/data-table/DataTable.tsx`  
`hooks/useDataTable.ts`

Tabla genérica construida sobre **TanStack Table v8**. Soporta ordenación, filtrado por columna y paginación numerada.

### Props

```ts
interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  searchColumn?: string        // columna a filtrar con el input de búsqueda
  searchPlaceholder?: string   // default: 'Buscar...'
  pageSize?: number            // default: 10
}
```

### Uso mínimo

```tsx
const columns: ColumnDef<Animal, unknown>[] = [
  { accessorKey: 'nombre', header: 'Nombre' },
  { accessorKey: 'peso',   header: 'Peso (kg)' },
]

<DataTable
  columns={columns}
  data={animales}
  searchColumn="nombre"
  pageSize={5}
/>
```

### Características

* **Ordenación**: click en cabecera. Icono `ChevronUp/Down/ChevronsUpDown` indica estado.
* **Filtrado**: input de texto filtra la columna indicada en `searchColumn`.
* **Paginación numerada**: muestra páginas con elipsis inteligente. Página activa con `bg-world`. Función `getPaginationRange(current, total)`.
* **Estado vacío**: fila con "Sin resultados." cuando no hay datos o filtro sin resultados.
* **Conteo**: "Mostrando X–Y de Z" en el footer.

### Hook `useDataTable`

Encapsula el estado interno de TanStack Table (sorting, columnFilters, pagination). Devuelve la instancia `table` lista para usar.

```ts
const table = useDataTable({ data, columns, pageSize })
```

---

## Sistema de formularios

Patrón: **react-hook-form + zod + shadcn Field**.

### Componentes disponibles (`components/ui/`)

| Componente | Uso |
|---|---|
| `Field` | Contenedor de campo. Prop `data-invalid` activa estilos de error. Prop `orientation="horizontal"` para checkbox. |
| `FieldLabel` | Label del campo. |
| `FieldDescription` | Texto de ayuda bajo el input. |
| `FieldError` | Muestra mensajes de error de zod. Recibe `errors={[fieldState.error]}`. |
| `FieldGroup` | Agrupa campos con espacio vertical. |
| `Input` | Input de texto. Prop `aria-invalid` para accesibilidad. |
| `Textarea` | Área de texto multilínea. |
| `Select` / `SelectTrigger` / `SelectContent` / `SelectItem` | Select accesible. |
| `Checkbox` | Checkbox. Controlado con `checked` + `onCheckedChange`. |
| `Button` | Botón. Variantes: `default`, `outline`, `ghost`, `destructive`. |

### Patrón `Controller`

Todo campo se envuelve con `Controller` de react-hook-form para integrar el estado de validación:

```tsx
<Controller
  name="especie"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>Especie</FieldLabel>
      <Select value={field.value} onValueChange={field.onChange}>
        ...
      </Select>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

---

## Utilidades de formato
`lib/format.ts`

Funciones con locale `es-ES` para presentar datos del dominio:

```ts
formatPeso(420)              // "420 kg"
formatMoneda(1250)           // "1.250,00 €"
formatFecha('2026-05-12')    // "12/05/2026"
formatFechaLarga('2026-05-12') // "12 de mayo de 2026"
```

Usa `Intl.NumberFormat` e `Intl.DateTimeFormat` — no depende de librerías externas.
