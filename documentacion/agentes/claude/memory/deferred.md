# ⏳ Deferred

## ~~DESTETE DE CRÍAS DE MADRE CON es_reproductora=false~~ ✅ RESUELTO

El gate `esReproductora &&` fue eliminado de `getAvailableActions` y de la llamada a `getCriasParaDestete` en `page.tsx`. El destete ahora depende solo de `tieneCriasElegibles` (tipo='Cría', vínculo='activo'), independiente de `es_reproductora`. Eval actualizado.

---

## ~~PAGE.TSX IMPORTA DIRECTAMENTE DE INFRASTRUCTURE/REPOSITORY — PRD013~~ ✅ RESUELTO

Resuelto creando `getCicloAbiertoParaFicha(animalId)` en `reproductivo/application/queries/`.
La nueva query combina ciclo + fecha del último evento en una sola round-trip (join interno),
eliminando la consulta serial que había en `page.tsx` y las dos importaciones directas de infrastructure.

---

## FILTRADO POR FECHA EN LISTADO DE ANIMALES + ANALÍTICA HISTÓRICA

Dos necesidades distintas identificadas al implementar los filtros de estado vital (vivos/vendidos/muertos):

**1. Filtro operacional** (corto plazo) — añadir date-range picker al listado `/vacuno/animales`.
Aplica solo cuando hay estados no-vivos activos (vendidos/muertos). Filtra por la fecha del
evento de salida. Se puede implementar en cliente con los datos ya cargados, o como parámetro
de query. No requiere cambios de schema.

**2. Analítica histórica / censo temporal** (módulo separado futuro) — responde preguntas como
"¿cuántos vivos había el 01/01/2016?" o "¿cuántos se vendieron en 2024?". Requiere reconstruir
el estado del sistema en un instante pasado recorriendo `eventos`. No es un filtro sobre
`animal`; es una query analítica que produce series temporales.

**Diseño propuesto:**
- Listado (`/vacuno/animales`): date-range simple sobre fecha de evento de salida
- Módulo analítica (futuro `/vacuno/historico` o dashboard ampliado): censos en fecha,
  evolución del rebaño, ventas por periodo — todo contra la tabla `eventos`

Cuando: el filtro operacional, cuando el usuario lo solicite. El módulo analítico, al diseñar
el área de informes/estadísticas.

## ~~TRANSACCIONALIDAD EN OPERACIONES DE ESCRITURA MULTI-TABLA~~ ✅ RESUELTO EN PRD006

Resuelto mediante RPCs transaccionales en `supabase/migrations/20260618000001_rpcs_transaccionales.sql`:
- `registrar_compra_animal` — reemplaza las 3 inserciones secuenciales de compra
- `registrar_salida_animal` — flujo de venta y muerte
Patrón documentado en `documentacion/arquitectura/rpc-transaccional.md`.

## ~~TOAST DE CONFIRMACIÓN TRAS EVENTOS DE ESCRITURA~~ ✅ RESUELTO EN PRD006

Resuelto con Sonner: `toast.success` / `toast.error` en Server Actions + Client Components.
`<Toaster position="top-center" richColors />` añadido en `app/layout.tsx`.
Patrón documentado en `patterns.md` — sección "Toasts con sonner".

## ~~PADRE AUSENTE EN CONFIRMACIÓN DE GESTACIÓN DIRECTA~~ ✅ RESUELTO

Implementado en `FormConfirmacionGestacion.tsx` (PRD-correctivo, 2026-08-20):
- Campo `padre_id` obligatorio cuando `estadoReproductivo === 'vacia'` (sin cubrición previa).
- "Desconocido" como primera opción del selector (sentinel `__desconocido__` → `undefined` al enviar).
- Campo siempre visible dentro del bloque `sinCubricionPrevia`, sin dependencia de `machos.length`.
- Validación en `onSubmit` antes de `setIsSubmitting` para evitar botón bloqueado en error.
- El RPC y `getPadreIdFromCiclo` (repository) ya gestionaban `padre_id` desde PRD008.

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

## ~~REFINAMIENTO — COMPORTAMIENTO DEL CICLO SEGÚN ESTADO AL CAMBIAR A NO-REPRODUCTORA~~ ✅ RESUELTO

Implementado en `cambiar_tipo_productivo` (migration 20260819000000) y UI (PRD-correctivo):

- `gestante`: **cambio BLOQUEADO**. El drawer muestra mensaje de bloqueo en rojo sin formulario.
  El RPC lanza `RAISE EXCEPTION` como red de seguridad a nivel DB.
  Regla de dominio: una gestación en curso no puede interrumpirse cambiando el tipo productivo.
- `cubierta`: cambio permitido con aviso + checkbox de confirmación obligatoria.
  El ciclo se cierra con `resultado = 'cierre_manual'`.
- `vacía`: cambio permitido con aviso informativo. El ciclo se cierra con `resultado = 'cierre_manual'`.
- El carrusel muestra el evento `CAMBIO_TIPO_PRODUCTIVO` en rojo en el slide del ciclo afectado.
- Compatibilidad hacia atrás: ciclos con `cierre_manual` anteriores a esta implementación
  (sin evento vinculado) muestran una entrada sintética "Paso a no reproductora".

---

## ~~REGLA 2 PRD011 — REACTIVACIÓN REPRODUCTIVA (sin ciclo → REPRODUCTORA → nuevo ciclo VACÍA)~~ ✅ RESUELTO

Implementado en `cambiar_tipo_productivo` (migration 20260819000000):
al cambiar a Reproductora se crea SIEMPRE un nuevo ciclo en estado VACÍA,
independientemente de si existen ciclos anteriores abiertos o cerrados.

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

## ~~T162 — Renderizado de EventoVirtual y etiquetas CX en historial + carrusel~~ ✅ COMPLETADO

Implementado: `listarEventosDeAnimal` inyecta `EventoVirtual` para ciclos C2+, `EventosList.tsx` los renderiza con opacidad reducida e itálica, `HistorialCarousel.tsx` muestra "Ciclo X" como pill gris y navegación dinámica `<< CX / CX >>`.

## ~~T161 — Refactorizar AvailableActions~~ ✅ COMPLETADO

Implementado: `modules/ganadero/animales/domain/availableActions.ts` con `getAvailableActions()`. `SeccionAcciones.tsx` usa `acciones.has('X')`. Eval en `evals/available-actions.eval.ts` (10 casos).

## ~~WIDGET DE CRÍAS DEPENDIENTES~~ ✅ COMPLETADO

Implementado: `getCriasConVinculoActivo.ts` + `SeccionCriasDependientes.tsx` (server) + `CriasDependientesWidget.tsx` (client con DrawerIdentificacion). Se renderiza debajo del carrusel en col 1 de la ficha. Grid con `items-start` para que cols 2 y 3 no se estiren. Desaparece automáticamente cuando no hay vínculos activos.

## DISCARDED HOOKS

Not needed: `useLocalStorage`, `usePrevious`, `useAsync`, `useMediaQuery`.
Reason: speculative, no concrete use case in this project.
