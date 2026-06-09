# ⏳ Deferred

## LADO FINANCIERO DE LA COMPRA DE ANIMAL (precio_compra, proveedor)

`RegistrarCompraAnimalInput` no incluye `precio_compra` ni `proveedor_nombre` porque no
existe puente GANADERO ↔ FINANCIERO para la dirección de compras. El esquema actual conecta
`transaccion` con `venta_id` y `factura_id`, pero no con `evento_id`. Crear una `transaccion`
desvinculada del evento de ENTRADA rompe la trazabilidad.

Antes de implementarlo hay que diseñar el enlace: un campo `evento_id` en `transaccion`,
una tabla `compra_linea` análoga a `venta_linea`, u otro mecanismo explícito.
Cuando: al diseñar el módulo financiero de gastos / compras.

## BASE TYPE PARA INPUTS DE ENTRADA DE ANIMAL

Idea a recuperar cuando se implemente el segundo motivo de entrada (nacimiento u otro):
usar un `BaseEntradaAnimalInput` no exportado con los campos comunes, y extenderlo
en un tipo específico por operación (`RegistrarCompraAnimalInput`, `RegistrarNacimientoAnimalInput`…).
Así cada use case recibe exactamente su tipo sin ifs ni switches, y no se repiten campos.
Decidido no implementarlo ahora porque aún no sabemos qué campos tendrán los otros motivos.

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
