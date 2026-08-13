# Decisions

## Eventos como source of truth

- Los eventos no se editan nunca (`assertEventoNoEditable`)
- Los estados (`estado_vital`, `estado_reproductivo`, etc.) son derivados de eventos, nunca editados directamente
- Las correcciones se hacen creando eventos compensatorios, nunca modificando el histórico

## Backend vs DB

- El backend (capa `application/`) decide la lógica de negocio
- La DB protege la integridad con constraints (`CHECK`, FK, `UNIQUE`)
- No hay lógica compleja en triggers de Postgres

## ~~Workflow Supabase: remote-only sin Docker~~ — SUPERSEDIDO

Ver sección "Supabase local vs remote" más abajo. El proyecto migró a local-first desde PRD002/Tarea 7.

## FK circulares: ALTER TABLE al final

- `animal` referencia `eventos` y `eventos` referencia `animal` (ciclo)
- Solución: crear `animal.evento_creacion_id` y `animal.evento_origen_id` como `UUID NULL` sin FK, añadir las FK con `ALTER TABLE` después de crear `eventos`

## UUIDs fijos para seed jerárquico

- `categoria_financiera` tiene una estructura de árbol (`parent_id`)
- Para el seed, se usan UUIDs predecibles (`00000000-0000-0000-0000-000000000001`, etc.) para poder referenciar `parent_id` dentro del mismo archivo de migración

## Estructura de módulos: Clean Architecture

- Cada submódulo tiene 4 capas: `domain/`, `application/`, `infrastructure/`, `ui/`
- La dependencia fluye hacia adentro: `ui → application → domain`, `infrastructure → domain`
- Los repositorios son funciones Supabase concretas, no interfaces abstractas (una sola fuente de datos)
- El puente ganadero ↔ financiero es explícito en `cross-domain/monetizacion-eventos/`

## Ventas: nunca automáticas

- El sistema nunca crea ventas automáticamente
- El usuario controla explícitamente la creación, agrupación y asociación
- Una venta con transacciones se vuelve inmutable

## Autenticación: sesión larga, rol único, RLS mínima

- `jwt_expiry = 604800` (7 días). La sesión no expira en el uso normal del día a día.
- Un solo rol `authenticated`. Sin roles complejos, sin ownership avanzado, sin multi-tenant.
- RLS habilitada en todas las tablas pero con política `USING (true) WITH CHECK (true)` — protege contra acceso anónimo, la lógica de autorización fina va en `application/`.
- El refresco de sesión lo gestiona automáticamente `proxy.ts` + `@supabase/ssr`.

## proxy.ts (Next.js 16)

- Next.js 16 depreca `middleware.ts` → renombrar a `proxy.ts` y la función de `middleware` a `proxy`.
- La lógica de protección de rutas vive en `proxy.ts`. No añadir lógica entre `createServerClient` y `getUser()`.
- `PUBLIC_PATHS` usa comparación exacta (`includes`), nunca `startsWith` (evita que `/login123` sea tratada como pública).

## Seed de desarrollo vs migraciones

- `supabase/seed.sql` es para datos de desarrollo — se ejecuta con `supabase db reset`, nunca con `supabase db push`.
- Las migraciones son para estructura y catálogos del sistema (datos que van a producción).
- `db reset` borra también `auth.users` → recrear usuario dev con `node scripts/create-dev-user.mjs` tras cada reset.
- UUIDs fijos en seed para poder referenciar FKs dentro del mismo INSERT (mismo patrón que seed_catalogo).

## AnimalListItem como proyección de UI

- La UI nunca recibe `Animal` completo ni `DbRow`. Recibe `AnimalListItem`, definido en `application/`.
- Definir la proyección en el use case (no en el dominio ni en la UI) mantiene el desacoplamiento.
- Si la tabla necesita más o menos campos, solo cambia `AnimalListItem` y el mapeo en el use case.

## Estrategia de entornos (.env)

- `.env.local` es el archivo activo (gitignored). No editar a mano.
- `.env.local.local` contiene las credenciales del Supabase local — está en git porque la anon key es pública.
- `.env.prod` contiene las credenciales de producción — gitignored.
- Cambio de entorno: `npm run env:local` / `npm run env:prod`.

## Transacciones: inmutables

- Las transacciones son hechos históricos, no se editan
- Las correcciones crean nuevas transacciones
- `importe` siempre >= 0; la dirección del dinero la da el campo `tipo` (ingreso/gasto)

## Una proyección por vista

Cada vista define exactamente los campos que necesita. `AnimalListItem` (listado) y `AnimalDetail` (ficha) son proyecciones separadas aunque compartan campos. No existe un tipo de dominio "universal" para la UI.

- Las proyecciones se definen en `application/`, junto al use case que las produce.
- Si la vista cambia de necesidades, solo cambia su proyección y el mapeo en el use case.

## `.maybeSingle()` vs `.single()`

Usar `.maybeSingle()` cuando el registro puede no existir (retorna `null` sin lanzar). Usar `.single()` solo cuando la ausencia del registro es un error del sistema. En páginas de detalle, siempre `.maybeSingle()` + `notFound()` explícito.

## `params` como Promise en Next.js 16

En Next.js 16, `params` en páginas y layouts es `Promise<{...}>` y debe ser awaiteado antes de usarse. Tiparlo como `Promise<{ id: string }>` y hacer `const { id } = await params`.

## Razas: catálogo por especie, no texto libre

- Tabla `raza(id, nombre, especie, activa)` con `UNIQUE(nombre, especie)`.
- FK `animal.raza_id → raza(id) ON DELETE RESTRICT`: no se puede borrar una raza referenciada. La baja se hace con `activa = false`, que la excluye del selector pero preserva el histórico.
- `raza_nombre` se resuelve con un JOIN en el repositorio (`select('*, raza(nombre)')`), no con una consulta separada. Evita N+1 en listados.
- El nombre resuelto viaja como `raza_nombre: string | null` en `Animal`, `AnimalListItem` y `AnimalDetail`. El mapper es el único punto que conoce el JOIN.

## Cabecera de ficha con color de mundo

`AnimalHeader` usa `var(--world-accent-soft)` como fondo y `border-world` como borde para anclar visualmente la ficha al mundo activo (vacuno, porcino…). Este es el patrón para cabeceras de identidad en fichas de entidad.

## `tipo_productivo`: catálogo por especie, FK en animal

`animal.tipo: 'normal' | 'reproductor'` se elimina. En su lugar:
- Tabla `tipo_productivo(id, nombre, especie, activa)` con `UNIQUE(nombre, especie)`.
- FK `animal.tipo_productivo_id → tipo_productivo(id) ON DELETE RESTRICT`.
- Mismo patrón que `raza`: soft-delete con `activa`, `ON DELETE RESTRICT` protege histórico.
- Valores iniciales: vacuno → recría, reproductora, semental, engorde; porcino → recría, reproductora, cebo, verraco.
- El nombre resuelto viaja como `tipo_productivo_nombre: string | null` en proyecciones. El mapper usa `select('*, raza(nombre), tipo_productivo(nombre)')`.
- Los tipos pueden evolucionar per-especie sin cambiar el modelo de `animal`.

## Supabase local vs remote: workflow de migraciones

- `supabase db push` aplica migraciones al **remoto** (producción/staging)
- La app en desarrollo usa el **Supabase local** (puerto 54321), que es una instancia separada
- Para sincronizar el local tras crear nuevas migraciones: `supabase db reset`
  (`db reset` aplica todas las migraciones + seed desde cero en local)
- Consecuencia: si se empuja al remoto pero no se ejecuta `db reset`, el local queda desactualizado
  y las llamadas a RPCs nuevos fallan con "function not found in schema cache"

## Tipos Supabase: siempre generados, nunca manuales

Los tipos de tablas, enums y RPCs se generan automáticamente desde el schema real:
```bash
supabase gen types typescript --local > types/supabase.ts
```
El cliente se tipa con `createServerClient<Database>(...)` y `createBrowserClient<Database>(...)`.
Nunca escribir tipos de DB a mano — se desincronizarían con el schema real.
Regenerar después de cada migración que modifique el schema.

## estado_vital: snapshot derivado, no fuente de verdad

`animal.estado_vital` es un campo de conveniencia que el RPC mantiene sincronizado.
No es la fuente de verdad — los eventos lo son.

- Nunca actualizar `estado_vital` directamente desde UI ni desde Use Case
- Solo el RPC lo modifica, y siempre como último paso después de insertar el evento
- Si el snapshot difiriera de los eventos, los eventos prevalecen (fuente canónica)

## Acciones inline: en la ficha, no en una página separada

Las acciones sobre una entidad (salida de animal, registro de evento, etc.) se implementan
como formularios inline en la ficha de la entidad, dentro de un panel `SeccionAcciones`.
No se navega a una página separada de "registrar X".

Razones: el usuario no pierde el contexto de la ficha, la acción es visible junto a los datos
que la justifican, y `router.refresh()` actualiza los Server Components sin navegación.

## `fecha_prevista_parto` y `dias_restantes`: cálculo y persistencia

`animal.fecha_prevista_parto` es un snapshot derivado que se actualiza mediante RPC cuando se registra una cubrición.

**Cómo se calcula:**
- Vacuno: `fecha_cubricion + 283 días` (duración media de gestación bovina)
- Porcino: `fecha_cubricion + 114 días` (duración media de gestación porcina, regla 3-3-3: 3 meses, 3 semanas, 3 días)
- La especie se obtiene de `animal.especie` en el momento de registrar la cubrición.

**`dias_restantes` NO se persiste.**
- Se calcula en `ReproductiveProjection` como `fecha_prevista_parto - fecha_actual`.
- Persistirlo crearía un valor que envejece: el día siguiente sería incorrecto sin actualizarlo.
- Cualquier componente que lo necesite lo calcula: `differenceInDays(fechaPrevistaParto, new Date())`.

**Invariante:**
- Si `estado_reproductivo = 'gestante'` entonces `fecha_prevista_parto` debe ser no nula.
- Si `estado_reproductivo != 'gestante'` (parto, aborto, etc.) el RPC limpia `fecha_prevista_parto = NULL`.

## `es_reproductora`: flag interno, solo backend

`es_reproductora` es una derivación computada por el backend, nunca expuesta al usuario ni modificable directamente.

- `true` **únicamente** para hembras con `tipo_productivo.nombre = 'Reproductora'`. Cualquier otro caso → `false`.
- El cambio es automático cuando el backend actualiza `tipo_productivo_id`.
- Para machos siempre `false` (el ciclo reproductivo no aplica).
- Objetivo: todas las validaciones reproductivas usan `if (!animal.es_reproductora)` sin interpretar sexo + tipo + estado.
- En el dominio `Animal` el campo existe (es útil en reglas de negocio). En cualquier tipo de input del usuario (`RegistrarCompraAnimalInput`, etc.) nunca aparece.

**Restricción para eventos reproductivos (CUBRICIÓN, PARTO, DESTETE, ABORTO):**
El animal debe cumplir `sexo === 'hembra' && es_reproductora === true`.
Si falla cualquiera de las dos condiciones, el evento se rechaza antes de ejecutar la transición de estado.
Esta validación la implementa `ReproductiveEligibilityRules`.

## `estado_reproductivo` inicial al crear una reproductora

Al registrar la compra de un animal con `tipo_productivo = Reproductora` (→ `es_reproductora = true`),
el RPC `registrar_compra_animal` inicializa `estado_reproductivo = 'vacia'`, nunca `NULL`.

Invariante: `es_reproductora = true` ↔ `estado_reproductivo IS NOT NULL`.
El valor `NULL` significa que el módulo reproductivo no aplica a ese animal.

## Visibilidad contextual de acciones reproductivas en `SeccionAcciones`

Los botones de acción reproductiva se muestran u ocultan según `estado_reproductivo`, no solo según `es_reproductora`.

Reglas actuales (PRD008):
- "Registrar cubrición" → visible cuando `estado_reproductivo ∈ {vacia, cubierta}` (etiqueta cambia a "Registrar nueva cubrición" cuando `cubierta`)
- "Confirmar gestación" → visible cuando `estado_reproductivo ∈ {cubierta, vacia}` (PRD008: ampliado desde solo `cubierta`)
- En estado `gestante` o `lactante` no se muestra ninguna acción reproductiva hasta que el ciclo avance

Cuando "Confirmar gestación" se activa desde `vacia` (sin cubrición previa), el formulario muestra un aviso
informativo y un campo adicional obligatorio de edad gestacional estimada en meses.
La edad gestacional estimada es un dato auxiliar efímero: se usa para calcular `fecha_prevista_parto`
durante el procesamiento del evento y nunca se persiste.

Esto evita que el backend reciba eventos con transiciones inválidas y orienta al usuario sin mensajes de error.

## Ordenación del historial de eventos

Los eventos en `EventosList` se ordenan `fecha DESC` (fecha biológica introducida por el usuario),
con `created_at DESC` como desempate cuando dos eventos comparten la misma fecha.

Limitación aceptada: si el usuario introduce eventos retroactivos el mismo día en orden incorrecto,
el `created_at` puede no reflejar la realidad biológica. Se difiere un `numero_secuencia` hasta que
haya un caso real que lo justifique.

## `tipo_productivo` de crías: Cría → Recría en el destete

Las crías vivas nacidas en un parto reciben `tipo_productivo = 'Cría'` (no 'Recría').
Las crías nacidas muertas siguen con `tipo_productivo = NULL`.

Ciclo de vida del tipo_productivo para animales nacidos internamente:
```
Parto → Cría → (destete) → Recría → (decisión ganadero) → Semental / Reproductora / Engorde / …
```

**Por qué 'Cría' y no 'Recría' desde el nacimiento:**
Permite distinguir en el censo cuántos animales son lactantes (Cría) y cuántos están
estrictamente en fase de recría post-destete (Recría). Son fases productivas distintas.

**Transición automática en el destete:**
El RPC `registrar_destete` (implementado en PRD010) actualiza `tipo_productivo_id` de cada cría
de 'Cría' → 'Recría' como parte de la misma transacción del evento.
Esta es la única transición de tipo_productivo que el sistema realiza automáticamente.
El resto de cambios de tipo_productivo son manuales (decisión del ganadero).

**El catálogo 'Cría' existe para vacuno y porcino.**

## Rol del animal en eventos compartidos: "Parto" vs "Nacimiento" / Destete en madre y cría

Los eventos reproductivos pueden asociarse a múltiples animales mediante `evento_animales.rol`.
El `rol` determina cómo se muestra el evento en la ficha de cada animal participante.

**PARTO:**
- Madre (`rol = 'madre'`) → muestra "Parto"
- Cría (`rol = 'cria'`) → muestra "Nacimiento" (el parto le ocurrió a la madre, no a la cría)

Este patrón se implementa en `EventosList`: la descripción del evento depende del `tipo_codigo` Y del `rol` del animal en ese evento. La query `listarEventosDeAnimal` selecciona `rol` de `evento_animales` para que la UI pueda hacer esta distinción.

**DESTETE (implementado en PRD010):**
El RPC `registrar_destete` inserta en `evento_animales`:
- La madre con `rol = 'madre'`
- Cada cría destetada con `rol = 'cria'`

El destete aparece en la ficha de ambos animales. El historial de eventos de la madre muestra el crotal y sexo (♂/♀) de cada cría destetada; el historial de la cría muestra el evento de destete con fecha.

## Inferencia del padre en el parto: `macho_id` vs `padre_id`

El sistema necesita conocer al padre de las crías en el momento del parto para asignarlo a `animal.padre_id`.
Existen dos vías para que esa información llegue al ciclo reproductivo, cada una con una clave distinta en `eventos.metadata_json`:

| Clave | Evento | Contexto |
|---|---|---|
| `macho_id` | `CUBRICION` | El macho que cubrió físicamente a la hembra. Se registra en el momento de la cubrición. |
| `padre_id` | `CONFIRMACION_GESTACION` | El padre declarado por el ganadero cuando no existía cubrición previa registrada. Se registra retrospectivamente al confirmar la gestación. |

Las claves son distintas porque representan momentos y contextos distintos:
- `macho_id` es el macho en el acto de cubrición (contexto de `CUBRICION`).
- `padre_id` es el padre conocido identificado a posteriori (contexto de `CONFIRMACION_GESTACION` desde estado `vacia`).

**Regla de prioridad en `getPadreIdFromCiclo`:**
La función busca primero en `CUBRICION` (fuente más fiable: hecho biológico registrado).
Solo si no encuentra nada busca en `CONFIRMACION_GESTACION`.
Nunca deben coexistir ambos en el mismo ciclo (la confirmación directa cierra la posibilidad de añadir cubrición posterior), pero la prioridad queda definida para proteger contra estados corruptos.

**Por qué no usar la misma clave en ambos eventos:**
Usar `macho_id` en CONFIRMACION_GESTACION habría ocultado el origen del dato. Con claves distintas, cualquier consulta directa al evento sabe inmediatamente en qué momento y con qué certeza se conoció al padre.

## PRD010 — `estado_vinculo_materno`: dependencia funcional madre-cría

`animal.estado_vinculo_materno` representa si existe una dependencia funcional activa entre la cría y su madre durante la lactancia. Es un campo derivado, interno y no editable directamente por el usuario.

**Valores y semántica:**
- `NULL` — sin información suficiente. Ocurre en animales anteriores a PRD010 sin historial de parto registrado, o en cualquier animal al que el sistema no puede atribuir con certeza una dependencia funcional.
- `'activo'` — dependencia funcional conocida: la cría está viva, bajo lactación, y el sistema tiene constancia de ello.
- `'finalizado'` — la dependencia ya no existe: la cría fue destetada (→ 'Recría'), vendida o murió antes del destete.

**Diferencia crítica con `madre_id`:**
`madre_id` es genealogía permanente e inmutable. Nunca cambia aunque la cría muera, sea vendida o destetada.
`estado_vinculo_materno` es estado temporal de dependencia funcional. Cambia durante la vida del animal.
Son conceptos distintos y no deben confundirse.

**Reglas de asignación:**
- Cría viva nacida en parto registrado: `ACTIVO`
- Nacido muerto: `FINALIZADO` (nunca existió dependencia funcional)
- Destete: `ACTIVO → FINALIZADO` + tipo_productivo `Cría → Recría`
- Muerte/venta antes del destete: `ACTIVO → FINALIZADO` (la cría permanece como tipo_productivo `Cría`)
- Solo el sistema modifica este campo mediante RPC; nunca la UI directamente

## PRD010 — Regla de continuidad del ciclo reproductivo

El ciclo reproductivo permanece abierto mientras exista al menos una cría que cumpla simultáneamente:
```
tipo_productivo = 'Cría'
AND estado_vital = 'vivo'
AND estado_vinculo_materno = 'activo'
```

Cuando el count de crías que cumplen esa condición llega a **0** (por destete, venta o muerte de la última):
1. El ciclo se cierra: `ciclo_reproductivo.fecha_fin = fecha_evento`, `resultado = 'parto'`
2. Si `madre.es_reproductora = true` → `madre.estado_reproductivo = 'vacia'`

**El cierre del ciclo no genera un evento.** Es una consecuencia derivada, no un hecho biológico registrado. El historial solo contiene hechos reales (PARTO, DESTETE, VENTA, MUERTE).

La misma regla se aplica independientemente del motivo que redujo el count a 0: el mecanismo es idéntico para último destete, última muerte y última venta.

## PRD010 — Patrón de finalización de vínculo por muerte/venta de la cría

El RPC `registrar_salida_animal` se extendió en PRD010 para finalizar el vínculo materno cuando la cría tiene `estado_vinculo_materno = 'activo'`.

**Flujo añadido (paso 4 del RPC, tras actualizar `estado_vital`):**
1. Detecta que `estado_vinculo_materno = 'activo'` AND `madre_id IS NOT NULL` AND `parto_evento_id IS NOT NULL`
2. Actualiza `estado_vinculo_materno = 'finalizado'` en la cría
3. Resuelve `ciclo_id` via `parto_evento_id → eventos.ciclo_id`
4. Cuenta vínculos activos restantes en ese ciclo
5. Si quedan 0: cierra el ciclo y pone la madre en `estado_reproductivo = 'vacia'`

La cría permanece con `tipo_productivo = 'Cría'` (a diferencia del destete, que la promueve a 'Recría'). Biológicamente correcto: murió/vendida antes de ser destetada.

## PRD010 — Backfill conservador de `estado_vinculo_materno`

El backfill **no establece `ACTIVO` indiscriminadamente** en todas las crías vivas existentes.
Solo se infiere ACTIVO cuando hay evidencia suficiente:

| Condición | Valor asignado |
|-----------|---------------|
| `tipo_productivo='Cría'` AND `estado_vital='vivo'` AND `madre_id IS NOT NULL` | `'activo'` |
| `estado_vital IN ('muerto','vendido')` con `tipo_productivo='Cría'` | `'finalizado'` |
| `tipo_productivo='Recría'` (o superior) — ya fue destetada | `'finalizado'` |
| Nacido muerto (`estado_vital='muerto'` desde el parto) | `'finalizado'` |
| Cualquier otro caso sin información suficiente | `NULL` (se conserva la ausencia) |

El principio es que el sistema representa conocimiento, no inventa retrospectivamente información que nunca fue registrada.

## PRD010 — `registrar_destete`: un evento por cría, agrupación en UI

El RPC `registrar_destete` crea **un evento DESTETE por cría** para preservar la fecha individual de destete de cada una (las crías de un mismo parto pueden destetarse en fechas distintas).

La UI agrupa todos los eventos DESTETE de un mismo ciclo en una sola fila del carrusel reproductivo mediante `agruparDestetes()` (en `HistorialCarousel.tsx`):
- El título del grupo muestra la fecha del **último** destete (cuando la madre quedó libre)
- Cada cría conserva su `fecha_destete` individual visible dentro del grupo
- Los símbolos ♂/♀ identifican el sexo de cada cría en el carrusel y en el historial de eventos

Esta agrupación es presentacional y vive exclusivamente en la UI. El modelo de datos mantiene la trazabilidad individual de cada destete.

## `EventosList`: badge de categoría + descripción específica

Patrón visual unificado para el historial de eventos:
- **Badge** = categoría del evento: "Entrada", "Salida", "Reproductivo" (color por categoría)
- **Descripción** = nombre específico del evento: "compra", "cubrición", "confirmación gestación"

Para movimientos (ENTRADA/SALIDA), la descripción es el campo `motivo`.
Para eventos reproductivos, la descripción viene del mapa `EVENTO_DESCRIPCION` en `EventosList.tsx`.
Todos los eventos futuros siguen este esquema añadiendo entradas en `BADGE_LABEL`, `BADGE_CLASS` y `EVENTO_DESCRIPCION`.