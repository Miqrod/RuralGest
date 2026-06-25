# ⏳ Deferred

## ~~TRANSACCIONALIDAD EN OPERACIONES DE ESCRITURA MULTI-TABLA~~ ✅ RESUELTO EN PRD006

Resuelto mediante RPCs transaccionales en `supabase/migrations/20260618000001_rpcs_transaccionales.sql`:
- `registrar_compra_animal` — reemplaza las 3 inserciones secuenciales de compra
- `registrar_salida_animal` — flujo de venta y muerte
Patrón documentado en `documentacion/arquitectura/rpc-transaccional.md`.

## TOAST DE CONFIRMACIÓN TRAS EVENTOS DE ESCRITURA

Al guardar un evento (salida, compra…) el usuario no recibe ninguna confirmación visual
más allá del cambio de estado en pantalla. Un toast tipo Sonner mejoraría la experiencia.

Decisión: diferido hasta que el flujo de salida esté validado end-to-end.
Requiere instalar `sonner` via shadcn y añadir `<Toaster />` al layout raíz —
cambio de infraestructura que merece su propio paso de pulido.
Cuando: al acometer el primer PRD de polish de UX o al finalizar PRD006 completo.

## LADO FINANCIERO DE LA COMPRA DE ANIMAL (precio_compra, proveedor)

`RegistrarCompraAnimalInput` no incluye `precio_compra` ni `proveedor_nombre` porque no
existe puente GANADERO ↔ FINANCIERO para la dirección de compras. El esquema actual conecta
`transaccion` con `venta_id` y `factura_id`, pero no con `evento_id`. Crear una `transaccion`
desvinculada del evento de ENTRADA rompe la trazabilidad.

Antes de implementarlo hay que diseñar el enlace: un campo `evento_id` en `transaccion`,
una tabla `compra_linea` análoga a `venta_linea`, u otro mecanismo explícito.
Cuando: al diseñar el módulo financiero de gastos / compras.

## SELECTOR DE MOTIVO EN EL FLUJO DE ENTRADA

La ruta `/vacuno/animales/entrada` va directamente al formulario de compra sin pedir motivo.
Decisión consciente: con un solo motivo implementado (COMPRA), añadir un selector sería
una pantalla vacía sin valor real para el usuario.

Cuando exista un segundo motivo (nacimiento, adopción…), habrá que resolver el punto de
elección. Las dos opciones posibles:

  A) Pantalla intermedia en `/vacuno/animales/entrada` que muestra los motivos disponibles
     y redirige a `/vacuno/animales/entrada/compra`, `/vacuno/animales/entrada/nacimiento`, etc.
  B) El botón "Registrar entrada" del listado abre directamente un selector de motivo
     antes de navegar al formulario específico.

Cuándo: al implementar el segundo motivo de entrada.

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

## ~~SUPABASE GENERATED TYPES~~ ✅ RESUELTO EN PRD006

Generados con `supabase gen types typescript --local > types/supabase.ts` (1197 líneas).
Conectados al cliente en `lib/supabase/server.ts` y `lib/supabase/client.ts` mediante `createServerClient<Database>` / `createBrowserClient<Database>`.
A partir de ahora: regenerar con `supabase gen types typescript --local > types/supabase.ts` cada vez que se añada una migración que cambie el schema.

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
