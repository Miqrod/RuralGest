# ⏳ Deferred

## ~~TRANSACCIONALIDAD EN OPERACIONES DE ESCRITURA MULTI-TABLA~~ ✅ RESUELTO EN PRD006

Resuelto mediante RPCs transaccionales en `supabase/migrations/20260618000001_rpcs_transaccionales.sql`:
- `registrar_compra_animal` — reemplaza las 3 inserciones secuenciales de compra
- `registrar_salida_animal` — flujo de venta y muerte
Patrón documentado en `documentacion/arquitectura/rpc-transaccional.md`.

## ~~TOAST DE CONFIRMACIÓN TRAS EVENTOS DE ESCRITURA~~ ✅ RESUELTO EN PRD006

Resuelto con Sonner: `toast.success` / `toast.error` en Server Actions + Client Components.
`<Toaster position="top-center" richColors />` añadido en `app/layout.tsx`.
Patrón documentado en `patterns.md` — sección "Toasts con sonner".

## ⚠️ PADRE AUSENTE EN CONFIRMACIÓN DE GESTACIÓN DIRECTA (sin cubrición previa)

**Bug de trazabilidad genética — prioridad alta.**

`RegistrarConfirmacionGestacionInput` no incluye `macho_id`. Cuando el ganadero confirma
una gestación directamente desde estado `vacia` (sin cubrición registrada — habitual en
extensivo), no tiene forma de informar el padre aunque lo conozca con certeza: en una
explotación extensiva solo puede haber un semental por cercado, por lo que la paternidad
es conocida aunque no se haya registrado la cubrición.

**Consecuencia actual:** las crías nacidas de ciclos sin cubrición registrada tendrán
`padre_id = null` aunque el padre sea conocido. Esto rompe la trazabilidad genética.

**Solución:**
1. Añadir `macho_id?: UUID` a `RegistrarConfirmacionGestacionInput`.
2. Actualizar el RPC `registrar_confirmacion_gestacion` para persistir `macho_id`
   en `eventos.metadata_json` del evento CONFIRMACION_GESTACION.
3. Actualizar `getMachoIdFromCiclo` (repository reproductivo) para buscar `macho_id`
   también en eventos CONFIRMACION_GESTACION cuando no haya CUBRICION en el ciclo.
4. Actualizar el formulario `FormConfirmacionGestacion.tsx` para mostrar el selector
   de macho cuando el animal está en estado `vacia`.

Cuándo: en el siguiente PRD que toque el flujo reproductivo o antes de implementar
genealogía y estadísticas de productividad reproductiva.

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

## REPRODUCTIVEENGINE — INTÉRPRETE DEL DOMINIO REPRODUCTIVO

Patrón identificado durante PRD007 pero diferido conscientemente hasta completar el módulo reproductivo.

`ReproductiveEngine` encapsula el pipeline `Context → EligibilityRules → CycleRules → Projection`
como intérprete reutilizable del dominio reproductivo — distinto del Use Case, que sigue siendo
el orquestador. Su rol es interpretar el significado biológico de un evento, no coordinarlo.

`buildReproductiveContext()` también viviría dentro del engine, no como fichero independiente.
Por ahora cada Use Case construye el `ReproductiveContext` directamente como objeto literal.

**No es una refactorización puntual.** Es la pieza que culminará todo el módulo reproductivo.
Su momento natural es cuando todos los eventos del ciclo estén implementados:
Cubrición ✅ · Confirmación de Gestación ✅ · Parto ✅ (PRD009) · Destete ✅ (PRD010) · Aborto.

Cuando: tras implementar Aborto y Destete — cuando el ciclo reproductivo completo esté consolidado.
Referencia: `documentacion/base_conocimiento/arquitectura/patterns/context-rules-projection-pattern.md`

## INFERENCIA DE PADRE Y RAZA EN ALTA DE CRÍAS (PARTO)

Al registrar un parto, el Use Case puede inferir automáticamente datos de la cría
recorriendo la cadena ya persistida en cubrición:

  ciclo_reproductivo
    → evento CUBRICION (último del ciclo, por fecha)
    → metadata_json.macho_id → animal padre → raza_id

Esto permite pre-rellenar en el formulario de parto/alta de crías:
  - **Padre**: macho_id de la cubrición vigente del ciclo
  - **Raza de la cría**:
      - Si raza_madre == raza_padre → misma raza
      - Si son distintas → null (usuario decide) o marcar como "cruzada" (a decidir)

La inferencia es una sugerencia al usuario, no un valor impuesto.
El usuario puede corregirla si la información fuera incorrecta.

Requisito previo: que el macho_id se haya informado en la cubrición
(cubriciones sin macho_id no permiten esta inferencia).

Cuando: al implementar el flujo de PARTO y alta de crías (PRD009 o posterior).
Datos ya disponibles: `eventos.metadata_json` contiene `macho_id` desde PRD007.

## TRAZABILIDAD GENÉTICA — DONANTE / REGISTRO GENÉTICO

Identificado durante PRD007 al diseñar `RegistrarCubricionInput`.

`macho_id` (FK a `animal`) cubre el caso del macho interno (cubrición natural o IA con semen propio).
Para inseminación con semen externo, la información genética relevante es distinta:
referencia de pajuela, casa genética (Semex, CRI...), número de registro del donante, raza de la
línea paterna, valoración genética (ICO, TPI...). Estos datos no corresponden a un animal del sistema.

**Posible solución cuando sea necesario:**
Una entidad `donante_genetico` (o `registro_genetico`) independiente de `animal`:
- id, nombre, raza, especie
- referencia_externa (número de catálogo del proveedor)
- proveedor (casa genética)
- valoracion_genetica (JSONB libre para índices específicos por especie)
La cubrición entonces tendría `donante_id UUID NULL REFERENCES donante_genetico(id)`
en paralelo (no en lugar) a `macho_id`, ya que ambos son conceptos distintos.

Por ahora: el campo `observaciones` de `RegistrarCubricionInput` absorbe la referencia libre
de semen externo sin estructura formal.

Cuando: al detectar necesidad real de consultas o métricas por línea genética.

## DISCARDED HOOKS

Not needed: `useLocalStorage`, `usePrevious`, `useAsync`, `useMediaQuery`.
Reason: speculative, no concrete use case in this project.
