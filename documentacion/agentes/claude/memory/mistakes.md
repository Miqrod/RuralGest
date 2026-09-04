## 📄 `mistakes.md`

Tus “antipatrones detectados”.

# 💣 Mistakes

## TIPOS DE INPUT DE DOMINIO EN APPLICATION/

Error: colocar tipos como `RegistrarCompraAnimalInput` en `application/actions/` siguiendo
la analogía de las proyecciones de salida (`AnimalListItem` en `application/queries/`).

Solución: los tipos de **input para operaciones de dominio** van siempre en `domain/types.ts`.
`infrastructure/mapper.ts` los necesita para los mappers de escritura, e `infrastructure/`
solo puede importar de `domain/` — no de `application/`.

Las proyecciones de salida (`AnimalListItem`, `AnimalDetail`) sí pueden vivir en `application/`
porque solo las consume `ui/`, nunca `infrastructure/`.

Regla: si `infrastructure/mapper.ts` necesita el tipo → `domain/`. Si solo lo necesita la UI → `application/`.

---

## TAILWIND V4 + TURBOPACK: @source PATHS Y CLASES DE PADDING

**Síntoma recurrente:** las clases de padding de campos de formulario (`px-3.5`, `py-2.5`, etc.)
desaparecen visualmente después de reiniciar el servidor o añadir componentes shadcn.

**Causa:** En Next.js 16 con Turbopack, `@source` puede resolver paths relativos a la raíz
del proyecto en lugar del archivo CSS. Con `@source "../components/**/*.tsx"` desde
`styles/globals.css`, Turbopack buscaba **fuera del proyecto** y no encontraba nada.

**Solución establecida en `styles/globals.css` — NO modificar sin entender:**
```css
/* Rutas con ../ (PostCSS) y sin ../ (Turbopack) para cubrir ambas interpretaciones */
@source "../app/**/*.{tsx,ts}";
@source "../components/**/*.{tsx,ts}";
@source "../modules/**/*.{tsx,ts}";
@source "app/**/*.{tsx,ts}";
@source "components/**/*.{tsx,ts}";
@source "modules/**/*.{tsx,ts}";
/* Salvaguarda definitiva — estas clases se generan SIEMPRE */
@source inline("px-3.5 py-2.5 pr-2.5 pl-3.5 py-3 shadow-sm");
```

**Regla:** cuando se añadan nuevas clases de formulario que no aparezcan en el CSS generado,
añadirlas al `@source inline(...)`. No depender solo del escaneo de archivos.

**Si vuelve a romperse:** verificar que `styles/globals.css` tiene las 7 líneas de @source
intactas. El CLI de shadcn (`npx shadcn add`) puede regenerar componentes con padding incorrecto
(`h-8 px-2.5 py-1`) — tras cada `shadcn add`, revisar `input.tsx`, `select.tsx`, `textarea.tsx`.

---

## NULL VS UNDEFINED EN ARGS OPCIONALES DE RPC

**Síntoma:** TypeScript error `Type 'null' is not assignable to type 'string | undefined'`
al pasar args opcionales a `.rpc()`.

**Causa:** Los tipos generados por `supabase gen types` representan parámetros opcionales
como `param?: string` (es decir, `string | undefined`), nunca como `string | null`.
Los mappers que usaban `campo ?? null` producen `null`, que es incompatible.

**Solución:** En los mappers de args de RPC, usar `?? undefined` en lugar de `?? null`
para campos opcionales:

```ts
// ❌ Incorrecto
p_crotal: input.crotal ?? null     // null no es undefined

// ✅ Correcto
p_crotal: input.crotal ?? undefined
```

**Regla:** reservar `null` para campos de dominio que la DB acepta como NULL.
Usar `undefined` para parámetros opcionales de funciones TypeScript/RPC.

---

## CREATE OR REPLACE EN POSTGRES CON FIRMA DISTINTA CREA OVERLOAD

**Síntoma:** error "could not choose the best candidate function" al llamar a una función RPC
después de añadirle parámetros con `CREATE OR REPLACE FUNCTION`.

**Causa:** en Postgres, `CREATE OR REPLACE` solo reemplaza la función si la lista de tipos de
parámetros es idéntica a la definición existente. Si cambia la firma (por ejemplo, añadir
`p_fecha_prevista_parto DATE DEFAULT NULL`), Postgres crea una segunda sobrecarga en lugar de
sustituir la anterior. El cliente tiene entonces dos candidatos y no sabe cuál elegir.

**Solución:** antes de recrear una función cuya firma cambia, añadir un `DROP FUNCTION IF EXISTS`
explícito con la firma antigua:

```sql
-- Eliminar la firma anterior para evitar ambigüedad de overloads
DROP FUNCTION IF EXISTS nombre_funcion(uuid, date, uuid, text);

CREATE OR REPLACE FUNCTION nombre_funcion(
  p_animal_id UUID,
  p_fecha     DATE,
  p_ciclo_id  UUID    DEFAULT NULL,
  p_nuevo_param DATE  DEFAULT NULL,
  ...
) ...
```

**Regla:** cuando una migración modifique la firma de un RPC existente (añadir, eliminar o
reordenar parámetros), siempre incluir el DROP de la firma antigua en la misma migración.
Visto en PRD008: `registrar_confirmacion_gestacion` v1 → v2.

---

## LÓGICA EN FRONTEND

Error: validar estado en React
Solución: mover a backend

## DUPLICACIÓN BACKEND/DB

Error: misma lógica en ambos
Solución: backend único punto de decisión

---

## TIMESTAMP VS DATE EN COLUMNAS DE EVENTOS

**Síntoma:** `RangeError: Invalid Date` al intentar llamar `.toISOString()` sobre una Date construida
desde `isoStringToDate` con una cadena como `'2026-07-15T10:30:00+00:00'`.

**Causa:** `eventos.fecha` está definida como `TIMESTAMP NOT NULL` en la migración, no como `DATE`.
Supabase devuelve el valor como `'2026-07-15T10:30:00+00:00'`. La función `isoStringToDate` hacía
`.split('-').map(Number)` directamente, produciendo el tercer elemento `'15T10:30:00+00:00'` → NaN.

**Solución:** siempre usar `.slice(0, 10)` antes de parsear para aislar la parte `YYYY-MM-DD`:

```ts
export function isoStringToDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}
```

**Regla:** antes de parsear cualquier campo de fecha desde Supabase, verificar en la migración si
la columna es `DATE` o `TIMESTAMP`. Nunca asumir que la cadena viene en formato `YYYY-MM-DD`.
La utilidad `isoStringToDate` ya incorpora este fix — usarla siempre en lugar de `new Date(string)`.

---

## DATEPICKER: startMonth NO ES minDate

**Síntoma:** el dropdown de año del DatePicker muestra solo el rango desde el año de `minDate`
hasta unos pocos años después, haciendo que el selector parezca roto cuando `minDate` es reciente.

**Causa:** `startMonth` en react-day-picker es el límite de **navegación**, no el mes inicial
mostrado. Si se pasa `minDate` (ej. julio 2026) como `startMonth`, el dropdown de año solo muestra
2026-2028 en lugar del rango completo.

**Solución:** `startMonth` debe ser siempre `new Date(FROM_YEAR, 0)` (año 2000, enero). La
restricción real de mínimo va en `disabled`, no en `startMonth`:

```tsx
const startMonth = new Date(FROM_YEAR, 0)   // SIEMPRE — nunca usar minDate aquí
```

**Regla:** `startMonth` = inicio del rango de navegación (2000). `minDate` = restricción de
selección → va en la función `disabled`. Son conceptos distintos; no mezclarlos.

---

## DATEPICKER: `disabled` como función, no como array de objetos

**Síntoma:** las fechas anteriores a `minDate` no quedan deshabilitadas visualmente; el usuario
puede seleccionarlas sin restricción.

**Causa:** con `captionLayout="dropdown"`, el matcher de objeto `[{ before: minDate }, { after: maxDate }]`
no funciona de forma fiable en react-day-picker.

**Solución:** usar una función matcher en lugar de array de objetos:

```tsx
disabled={(date: Date) => {
  if (maxDate && date > maxDate) return true
  if (minDate && date < minDate) return true
  return false
}}
```

**Regla:** con `captionLayout="dropdown"` usar siempre función `(date: Date) => boolean`
para `disabled`. El array de matchers de objeto no es fiable en este modo.

---

## CICLO RECIÉN ABIERTO SIN EVENTOS → getLastEventoFechaForCiclo DEVUELVE null

**Síntoma:** para animales con ciclo abierto pero sin eventos (ej. ciclo vacía recién creado
tras machorra o parto), `minDate` llega como `undefined` al DatePicker y no hay restricción
de fecha mínima.

**Causa:** `getLastEventoFechaForCiclo` devuelve `null` cuando el ciclo no tiene eventos
registrados aún (MAX sobre tabla vacía = NULL en Postgres).

**Solución aplicada en PRD013:** `getCicloAbiertoParaFicha` combina ciclo + last evento en una
sola query SQL con `COALESCE(MAX(e.fecha), c.fecha_inicio)`, eliminando el problema de raíz.
El fallback ya no es responsabilidad del caller sino de la query.

**Regla:** cualquier query que calcule MAX/MIN sobre eventos de un ciclo puede devolver null
para ciclos recién abiertos. Manejar con `COALESCE(MAX(...), fecha_inicio)` en SQL,
o con fallback explícito en TypeScript si la query no se puede modificar.

---

## FOR LOOP EN CLIENTE PARA OPERACIONES MULTI-ENTIDAD

**Síntoma:** una operación de usuario que afecta a N entidades se implementa como un `for` loop
que llama N veces al RPC/action de la unidad individual. Si la iteración K falla, las K-1 previas
ya han quedado persistidas sin rollback.

**Causa:** operar a nivel de "unidad individual" cuando la acción del usuario es semánticamente
atómica sobre un grupo.

**Solución:** RPC lote en Postgres que envuelve todas las N operaciones en una única transacción.
El caller pasa el array completo; si alguna falla, Postgres hace rollback de todo.

**Ejemplo concreto (PRD013-fix):**
- ❌ `for (const criaId of criaIds) await supabase.rpc('registrar_destete', { p_cria_id })`
- ✅ `await supabase.rpc('registrar_destete_lote', { p_cria_ids: criaIds })`

**Regla:** cuando el usuario realiza una acción sobre N elementos del mismo tipo en una misma
pantalla, la atomicidad debe garantizarse en la capa de base de datos, no en la de aplicación.