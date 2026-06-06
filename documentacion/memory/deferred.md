# ⏳ Deferred

## SPECIES & BREEDS IN DATABASE

Pending: species (vacuno, porcino…) and breeds must live in DB tables, not code.
When: designing the animal data model in Supabase.

## RAZA DEL ANIMAL — CAMPO EN DB Y FICHA

Pendiente: añadir campo `raza` (o FK a tabla `raza`) en la tabla `animal`.
Mostrar la raza en la cabecera de la ficha (`AnimalHeader`) como pill, junto a sexo y tipo.
Consideraciones antes de implementar:
- Decidir si es texto libre o catálogo por especie (morucha, charolesa, mixta… para vacuno)
- Si es catálogo: crear tabla `raza` con columnas `id, nombre, especie` y FK en `animal.raza_id`
- Si es texto libre: `ALTER TABLE animal ADD COLUMN raza TEXT NULL`
Cuando: al diseñar el módulo de configuración o al ampliar el modelo de animal.

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
