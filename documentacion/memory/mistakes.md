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

## LÓGICA EN FRONTEND

Error: validar estado en React
Solución: mover a backend

## DUPLICACIÓN BACKEND/DB

Error: misma lógica en ambos
Solución: backend único punto de decisión