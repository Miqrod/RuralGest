# Sistema de mundos

El sistema de mundos es el mecanismo que cambia el color de acento de la UI según la sección activa.

## Los 4 mundos

Definidos en `lib/navigation.ts` como `WORLDS` y en `types/navigation.ts` como `WorldId`:

| WorldId | Sección | Color (light) |
|---|---|---|
| `default` | Inicio, Calendario, Instalaciones, Configuración | `#166534` (verde) |
| `vacuno` | Vacuno | `#800000` (granate) |
| `porcino` | Porcino | `#ff7700` (naranja) |
| `financiero` | Finanzas | `#3377aa` (azul) |

---

## Cómo funciona

### 1. Detección del mundo activo — `WorldSync`

`components/layout/WorldSync.tsx` escucha el pathname y escribe en el `<html>`:

```html
<!-- en /vacuno -->
<html data-world="vacuno">

<!-- en /home -->
<html>  <!-- sin atributo -->
```

### 2. CSS variables — `styles/globals.css`

Selectores `[data-world]` sobreescriben `--world-accent`:

```css
:root {
  --world-accent: #166534;   /* default */
}
[data-world="vacuno"]    { --world-accent: #800000; }
[data-world="porcino"]   { --world-accent: #ff7700; }
[data-world="financiero"] { --world-accent: #3377aa; }
```

### 3. Tokens Tailwind — `@theme inline`

```css
@theme inline {
  --color-world: var(--world-accent);
}
```

Esto expone las utilities: `text-world`, `bg-world`, `border-world`, `ring-world`, etc.
El color cambia automáticamente al cambiar `--world-accent`.

---

## Colores de navegación (independientes del mundo activo)

Cada ítem del Sidebar tiene su propio color fijo, independiente de la página actual.
Por ejemplo, el ítem "Vacuno" siempre es granate, esté o no activo.

### Variables CSS por mundo de nav

```css
:root {
  --nav-world-default:    #166534;
  --nav-world-vacuno:     #800000;
  --nav-world-porcino:    #ff7700;
  --nav-world-financiero: #3377aa;
}
```

Registradas en `@theme inline` como `--color-nav-*`:

```css
@theme inline {
  --color-nav-vacuno: var(--nav-world-vacuno);
  /* etc. */
}
```

→ Genera utilities: `text-nav-vacuno`, `border-nav-vacuno`, `hover:text-nav-porcino`…

### Mapas estáticos en `Sidebar.tsx`

Tailwind JIT solo detecta clases como strings literales en el código. Por eso se usan `Record` estáticos:

```ts
const WORLD_ACTIVE: Record<WorldId, string> = {
  vacuno: 'text-nav-vacuno border-nav-vacuno',
  ...
}
const WORLD_HOVER: Record<WorldId, string> = {
  vacuno: 'hover:text-nav-vacuno hover:border-nav-vacuno',
  ...
}
```

Sin estos mapas, Tailwind no incluiría esas clases en el build.

---

## Añadir un nuevo mundo

Requiere cambios coordinados en varios ficheros y, sobre todo, **definir los procesos de negocio** para esa nueva sección. No es una operación de datos — es una decisión de producto.

Ver `documentacion/memory/deferred.md` para el detalle de por qué está pospuesto.
