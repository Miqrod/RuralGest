# Layout principal

## Composición

```
AppLayout
├── SidebarProvider          (contexto: collapsed / toggle / mobileOpen / toggleMobile / closeMobile)
└── AppShell
    ├── WorldSync            (sincroniza data-world en <html>)
    ├── Sidebar              (fixed left, z-50)
    ├── MobileBackdrop       (overlay z-[45], solo mobile)
    ├── Header               (fixed top, z-40)
    ├── <main>               (contenido de la página)
    └── Footer               (fixed bottom, z-40)
```

El `<main>` recibe `padding-left` dinámico (64px colapsado / 256px expandido) sincronizado con el estado del Sidebar mediante transición CSS.

---

## Componentes

### `AppLayout`
`components/layout/AppLayout.tsx`

Wrapper de nivel de ruta. Provee el `SidebarProvider` y monta el `AppShell`. Se usa en `app/(main)/layout.tsx`.

```tsx
<AppLayout>
  {children}
</AppLayout>
```

---

### `Sidebar`
`components/layout/Sidebar.tsx`

Barra lateral fija. Ancho: 256px expandido / 64px colapsado.

**Estado:** gestionado por `SidebarProvider` (context). El botón de colapso está en la parte inferior.

**Comportamiento por estado:**
- Expandido: icono + label. Ítems con `children` muestran acordeón animado con chevron.
- Colapsado: solo icono + `Tooltip` lateral. Si el ítem tiene hijos, el click expande el sidebar y abre el acordeón.

**Sub-ítems (acordeón):**
- Sin icono. Texto con `pl-11`. Fondo `bg-stone-100/50` en el contenedor.
- Flecha `▸` posicionada en `left-6`. Transparente por defecto, aparece en hover y activo.
- Activo: color de mundo + `font-semibold`. Inactivo: `text-ink-muted` con `hover:text-world`.

**Borde izquierdo de ítems:** siempre `border-l-4`. Transparente en reposo, color de mundo en activo/hover. Sin layout shift.

**Color del borde lateral del aside:** `border-world` (color del mundo actual de la página).

**Clases de color por mundo:** mapas estáticos (`WORLD_ACTIVE`, `WORLD_HOVER`, `WORLD_TEXT`, `WORLD_HOVER_TEXT`, `WORLD_ARROW_HOVER`) declarados al inicio del archivo para que Tailwind los detecte en build time.

---

### `Header`
`components/layout/Header.tsx`

Barra superior fija. Se ajusta con clases Tailwind condicionales (`left-16`/`left-64`, `w-[calc(100%-4rem)]`/`w-[calc(100%-16rem)]`) para seguir el ancho del Sidebar.

Contiene: botón hamburguesa (mobile), buscador global (placeholder), `WeatherWidget`, botón de notificaciones, toggle de tema (light/dark), avatar de usuario.

---

### `Footer`
`components/layout/Footer.tsx`

Pie fijo en la parte inferior. Misma lógica de clases condicionales que el Header.

---

### `WorldSync`
`components/layout/WorldSync.tsx`

Componente invisible (`return null`). Escucha el pathname y escribe `data-world="vacuno|porcino|financiero"` en `document.documentElement`. Si el mundo es `default`, elimina el atributo.

Este atributo activa los selectores CSS `[data-world="vacuno"]` que cambian `--world-accent` y con ello todos los tokens que dependen de él (`text-world`, `border-world`, `bg-world`, `focus:ring-world`…).

---

### `PageContainer`
`components/layout/PageContainer.tsx`

Wrapper de contenido de página. Dos variantes:

```tsx
// Fluido hasta 1280px, luego centrado
<PageContainer>...</PageContainer>

// Siempre ancho completo (calendarios, analytics)
<PageContainerWide>...</PageContainerWide>
```

---

---

## Menú mobile

En pantallas `< md` (< 768px) el sidebar se convierte en un drawer deslizante.

**Comportamiento:**
- Sidebar oculto por defecto (`-translate-x-full`), se desliza con `translate-x-0` al abrirse.
- El sidebar siempre muestra el modo expandido (labels visibles) en móvil, independientemente del estado `collapsed` de desktop (`displayCollapsed = !mobileOpen && collapsed`).
- Al navegar a una ruta el drawer se cierra automáticamente (`useEffect` sobre `pathname`).

**Componentes involucrados:**

| Elemento | Ubicación | Descripción |
|---|---|---|
| Botón hamburguesa | `Header` | `md:hidden`. Llama a `toggleMobile` |
| Botón X (`MobileCloseBtn`) | Dentro del `Sidebar`, esquina superior derecha | `md:hidden`, `bg-world`, `rounded-full`. Animación 4 fases. Llama a `closeMobile` |
| Backdrop overlay (`MobileBackdrop`) | `AppLayout` | `z-[45]`, cubre header y footer. Click cierra el drawer |
| Drawer | `Sidebar` `<aside>` | `transition-[width,translate]`, `-translate-x-full` → `translate-x-0` |

**Animación del botón X (`MobileCloseBtn`):**

Máquina de estados con 4 fases para evitar conflictos de z-index (el botón nunca sale lateralmente, solo verticalmente desde fuera del viewport):

| Fase | Estado visual |
|---|---|
| `offscreen` | `-translate-y-16`, sin transición, `pointer-events-none` |
| `entering` | `translate-y-0`, `transition-[translate] duration-400ms ease-in` (delay 500ms) |
| `settled` | `translate-y-0`, transiciones de hover activas (`bg`, `color`, `scale`) |
| `fading` | `opacity-0`, `transition-opacity duration-200`, luego vuelve a `offscreen` |

**Z-index layers en mobile:**

```
contenido         z-0
header / footer   z-40
overlay           z-[45]   ← cubre toda la interfaz
sidebar / botón X z-50
```

---

## Sincronización Sidebar ↔ Header ↔ Footer ↔ main

| Elemento | Mecanismo |
|---|---|
| `main` | `className` condicional con Tailwind (`pl-16` / `pl-64`) |
| `Header` | clases condicionales Tailwind (`md:left-16`/`md:left-64`, `md:w-[calc(100%-4rem)]`/`md:w-[calc(100%-16rem)]`) |
| `Footer` | igual que Header |

El Sidebar y `main` usan `transition-[width]` / `transition-[padding-left]` con `duration-300`. Header y Footer usan `transition-[left,width] duration-300`.
