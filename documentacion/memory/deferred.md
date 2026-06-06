# ⏳ Deferred

## GESTIÓN DE RAZAS POR USUARIO

Pendiente: interfaz para que el usuario pueda añadir, renombrar y desactivar razas por especie.
La tabla `raza` ya existe con columna `activa`. La desactivación oculta la raza del selector sin borrarla (ON DELETE RESTRICT protege animales existentes).
Cuando: al construir el módulo de configuración.

## SERVER-SIDE SEARCH + DEBOUNCE

Pending: `useDebounce` for DataTable search once queries hit Supabase.
When: implementing server-side filtering.

## SUPABASE GENERATED TYPES

Pending: do not write `types/common.ts` manually — run `supabase gen types` instead.
When: Supabase is connected and schema is stable.

## NEW WORLDS (equino, ovino…)

Pending: adding a world requires defining full business processes for that species.
Not a data change — it is a product decision. Deferred indefinitely.

## VIRTUALIZATION (react-window)

Cancelled: unnecessary with server-side pagination. Revisit only if a real 1000+ row
unpaginated table appears.

## HOVER EN NUEVOS ELEMENTOS DE FORMULARIO

Pendiente: cuando se implementen datepicker y radiobutton, añadir el mismo patrón de hover
que input/select/textarea: `hover:border-stone-400 dark:hover:border-stone-500 transition-colors duration-200 ease-in`.

## LOGIN PAGE — LOGO Y NOMBRE
Pendiente: mostrar el logo subido por el usuario y el nombre "Hermanos Rodríguez" con el
mismo estilo tipográfico que en el sidebar (font-black tracking-tight text-brand).
Cuando: cuando se implemente la subida de logo / configuración de marca.

## USER MENU — POSICIÓN Y ANIMACIÓN
Pendiente: ajustar el dropdown de usuario para que (1) no pise el header y aparezca
claramente por debajo de él, y (2) tenga una animación de entrada suave (fade + slide-down).
Cuando: al trabajar en la capa de UI/polish del header.

## DISCARDED HOOKS

Not needed: `useLocalStorage`, `usePrevious`, `useAsync`, `useMediaQuery`.
Reason: speculative, no concrete use case in this project.
