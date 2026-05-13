# Progreso — Tareas 1–10

Resumen de las 10 tareas iniciales de construcción de la base técnica.

---

## Tarea 1 — Configuración del proyecto

Proyecto creado con Next.js 16, TypeScript, Tailwind CSS v4 y shadcn/ui (@base-ui/react).
Pipeline de CI añadido. ESLint, Prettier y Husky configurados.

## Tarea 2 — Diseño del sistema de tokens de color

Sistema de design tokens via CSS variables en `styles/globals.css`.
Paleta semántica: `--color-canvas`, `--color-ink`, `--color-ink-muted`, `--color-surface-*`, `--color-divider`, `--color-brand`, `--color-world`…
Soporte dark mode con `.dark` selector.

## Tarea 3 — Configuración de Tailwind v4

Integración de `@tailwindcss/postcss`. Uso de `@theme inline` para exponer CSS variables como utilities de Tailwind. Configuración de fuentes y breakpoints.

## Tarea 4 — Providers y contextos base

`SidebarProvider`: contexto React para el estado collapsed/expanded del Sidebar.
`useTheme`: hook para gestionar light/dark mode.

## Tarea 5 — Layout principal

Implementación completa de `AppLayout`, `Sidebar`, `Header`, `Footer`, `WorldSync` y `PageContainer`.

Problemas resueltos:
- `asChild` no existe en @base-ui/react → sustituido por prop `render`
- Iconos del sidebar colapsado no apilados → fix con `flex flex-col gap-1` en el nav
- Layout shift al aparecer el borde de ítem activo → `border-l-4 border-transparent` siempre reserva el espacio

## Tarea 6 — Navegación

Estructura de `NAV_ITEMS` en `lib/navigation.ts` con soporte para ítems con hijos (acordeón), mundo por ítem y función `getWorldForPath`.
Breadcrumbs descartados (el menú lateral siempre visible los hace redundantes).

## Tarea 7 — Componentes de formulario

Instalación de shadcn/ui `field`, `input`, `textarea`, `select`, `checkbox`, `button`.
Integración con react-hook-form + zod mediante el patrón `Controller` + `Field`/`FieldError`.
Página `/demo` con formulario de validación funcional.

## Tarea 8 — DataTable

Hook `useDataTable` y componente `DataTable` con TanStack Table v8.
Soporte: ordenación por columna, filtrado por texto, paginación numerada con elipsis.
Estilos extraídos del boceto `listado_de_animales_v12.14_final.html`.
Tarea 8.5 (virtualización) cancelada — innecesaria con paginación server-side.

## Tarea 9 — Patrones y utilidades comunes

Creada `lib/format.ts` con `formatPeso`, `formatMoneda`, `formatFecha`, `formatFechaLarga`.
Descartados hooks especulativos (useLocalStorage, usePrevious, useAsync, useMediaQuery).
Especies/razas pospuestas a BD — no deben ser constantes de código.

## Tarea 10 — Estructura y documentación

`README.md` en la raíz del proyecto.
Documentación técnica en `documentacion/desarrollo/`: layout, componentes, sistema de mundos y este resumen de progreso.
`documentacion/memory/deferred.md` con elementos pospuestos y razones.

---

## Post-PRD001 — Mejoras incrementales

### Menú mobile (drawer)

Drawer deslizante en pantallas `< md`. El sidebar arranca con `-translate-x-full` y entra con `translate-x-0`. Siempre muestra el modo expandido en mobile. Se cierra automáticamente al navegar.

Elementos añadidos: botón hamburguesa en `Header`, `MobileBackdrop` en `AppLayout` (`z-[45]`), `MobileCloseBtn` dentro del `Sidebar` con animación vertical de 4 fases (evita conflictos de z-index).

`SidebarProvider` ampliado con `mobileOpen`, `toggleMobile` y `closeMobile`.

### Hover effects en formularios

Todos los elementos de formulario reciben `transition duration-200 ease-in`:
- `Input`, `Select`, `Textarea`: borde pasa a gris oscuro (`hover:border-stone-400`).
- `Button` variante `default`: `hover:bg-stone-500 hover:text-white`.
- `Checkbox` y `FieldLabel`: añaden `cursor-pointer`.

### Seguridad de dependencias

Eliminados tres paquetes no utilizados que introducían 20+ vulnerabilidades altas/críticas: `html-pdf-node`, `puppeteer-core`, `md-to-pdf`.

CI actualizado: `npm install` → `npm ci` + paso de auditoría `npm audit --audit-level=high`.

### Submenús de navegación

`NavItem.href` pasa a ser opcional para soportar ítems padre que solo despliegan acordeón.

Vacuno, Porcino y Finanzas son ahora ítems padre sin ruta propia. Cada uno tiene 4 sub-ítems con ruta.

**Visual de sub-ítems** (basado en boceto `listado_de_animales_v12.14_final.html`):
- Sin icono. Indentación `pl-11`. Contenedor con `bg-stone-100/50`.
- Flecha `▸` en `left-6`: transparente por defecto, aparece en hover/activo (`group-hover/subitem`).
- Activo: color de mundo + `font-semibold`. Inactivo: `text-ink-muted`.

Cuando el sidebar está colapsado y el ítem tiene hijos, el click expande el sidebar y abre el acordeón.

`getWorldForPath` actualizado para buscar también en `children`.

### Página de documentación

`app/(main)/docs/page.tsx` creado (página base con h1).
Ítem "Documentación" añadido al menú (`BookOpen`, world `default`, entre Instalaciones y Configuración).
