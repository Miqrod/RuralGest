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