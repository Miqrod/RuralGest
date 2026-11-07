# Flujo — Cambio de tipo productivo

> Documento de flujo de la Base de Conocimiento.
>
> Define qué significa cambiar el tipo productivo de un animal, cuándo está permitido, qué consecuencias tiene sobre el ciclo reproductivo y cómo se refleja en la historia del animal.
>
> Las secciones 1–9 describen reglas de dominio. La sección 10 documenta la implementación vigente como evidencia (RPC, UI, ficheros) y la sección 11 recoge discrepancias y huecos detectados.
>
> Fuentes: PRD-correctivo (`documentacion/pending_documentation.md`), `documentacion/agentes/claude/memory/deferred.md`, migrations `20260819000000_fecha_entrada_salida_cambio_tipo.sql` (definición original de `cambiar_tipo_productivo`) y `20261104000000_cambiar_tipo_productivo_validacion_destino.sql` (versión vigente), `DrawerCambioTipoProductivo.tsx`, `HistorialCarousel.tsx`, `seed.sql`.

---

# 1. Propósito

El tipo productivo expresa **el papel que el animal desempeña en la explotación**. Es una decisión de negocio del ganadero, no una fase biológica.

```text
¿Para qué se utiliza este animal?   → tipo productivo
¿Qué sabemos de su reproducción?    → estado reproductivo
```

Cambiar el tipo productivo puede hacer que un animal **entre o salga del dominio reproductivo**. Es el único mecanismo manual que lo permite. Los estados reproductivos, en cambio, evolucionan exclusivamente como consecuencia de los eventos registrados.

Tipos de catálogo (`tipo_productivo`, por especie):

| Vacuno | Porcino |
|---|---|
| Cría, Recría, Reproductora, Semental, Engorde | Cría, Recría, Reproductora, Cebo, Verraco |

Equivalencias entre especies: **Cebo = Engorde** y **Verraco = Semental**.

## 1.1 Ciclo de vida del tipo productivo

```text
Parto ──► CRÍA ──(destete, automático)──► RECRÍA ──(decisión del ganadero)──► REPRODUCTORA (hembra)
                                                                          ──► SEMENTAL / VERRACO (macho)
                                                                          ──► ENGORDE / CEBO
Compra ──► Recría · Reproductora · Semental/Verraco · Engorde/Cebo   (nunca Cría)
```

- **Cría** la asigna el parto. Solo la abandona el **destete**, que la pasa a Recría. **No admite cambios manuales.**
- **Recría** es la fase de transición tras el destete. **Nunca es destino de un cambio manual**: una vez el animal pasa a Reproductora, Semental o Engorde, no vuelve a Recría. No es un tipo "comodín".
- Entre **Reproductora, Semental y Engorde** los cambios son manuales y libres, respetando el sexo. Incluye la **reactivación**: Engorde → Reproductora o Semental, también para un animal que ya lo fue.

Decisión del usuario, 2026-11-07. Amplía la de `decisions.md` → "`tipo_productivo` de crías: Cría → Recría en el destete".

---

# 2. Qué significa el cambio

> **Cambio de tipo productivo = decisión explícita del ganadero de asignar un nuevo papel productivo a un animal vivo.**

Es un **hecho real** y por tanto se persiste siempre como evento `CAMBIO_TIPO_PRODUCTIVO` (principio Event First). Nunca se deduce a posteriori a partir del snapshot del animal.

El cambio de tipo no representa:

- un evento reproductivo (no es cubrición, parto, aborto ni machorra);
- un desenlace del ciclo reproductivo;
- una salida del animal;
- una corrección de un error de alta.

El cierre o la apertura de ciclo que provoca son **consecuencias** del hecho, no hechos independientes.

---

# 3. `es_reproductora` es derivado

```text
es_reproductora = (sexo = 'hembra') AND (tipo_productivo = 'Reproductora')
```

- Lo calcula siempre el backend dentro del cambio de tipo.
- Nunca es editable ni aparece en ningún input de usuario.
- La transición relevante para el dominio reproductivo es el **cambio de valor** de `es_reproductora`, no el cambio de tipo en sí.

De ahí las tres familias de cambio:

| Antes | Después | Familia |
|---|---|---|
| `true` | `false` | Salida del dominio reproductivo (§5) |
| `false` | `true` | Entrada / reactivación reproductiva (§6) |
| `false` | `false` | Cambio neutro — p.ej. Recría → Engorde (§7) |

---

# 4. Precondiciones generales

1. El animal debe estar **vivo** (`estado_vital = 'vivo'`). Un animal vendido o muerto conserva su último tipo como dato histórico; en la ficha la sección "Uso productivo" es solo informativa.
2. El animal **no es una Cría**. Su único cambio de tipo lo hace el destete (*"Una Cría solo cambia de tipo productivo mediante el destete."*). En la ficha de una Cría no aparece el lápiz, sino la nota "Pasará a Recría al registrar su destete".
3. El tipo nuevo debe ser **distinto** del actual.
4. El tipo destino debe ser **válido para el animal**. Se protege en backend y la UI lo explica antes de enviar:
   - existe en el catálogo, pertenece a la **misma especie** y está **activo**;
   - `Cría` nunca es destino de un cambio manual: solo la asigna el Parto;
   - `Recría` nunca es destino de un cambio manual: es la fase posterior al destete (*"Recría es la fase posterior al destete; no puede elegirse en un cambio de tipo productivo."*);
   - tipos ligados al sexo:

     | Tipo | Sexo requerido |
     |---|---|
     | `Reproductora` | hembra |
     | `Semental` (vacuno) / `Verraco` (porcino) | macho |

   - **sexo sin identificar** (`sexo = NULL`): los tipos ligados al sexo se bloquean con el mensaje *"Indica el sexo del animal antes de cambiar su tipo productivo a X."*. Los tipos no ligados al sexo (Engorde, Cebo) siguen permitidos.

   En la UI, Cría y Recría nunca aparecen en el selector, y con sexo conocido tampoco los tipos incompatibles. Con sexo NULL los tipos ligados al sexo sí aparecen, pero al elegir uno se muestra el bloqueo en rojo y "Confirmar" queda deshabilitado. Así el usuario entiende por qué no puede hacerlo.

## 4.1 Matriz de transiciones manuales (vacuno; porcino: Cebo = Engorde, Verraco = Semental)

| Desde \ Hacia | Cría | Recría | Reproductora | Semental | Engorde |
|---|:---:|:---:|:---:|:---:|:---:|
| **Cría** | ❌ | ❌ (solo el destete) | ❌ | ❌ | ❌ |
| **Recría** | ❌ | — | ✅ hembra | ✅ macho | ✅ |
| **Reproductora** | ❌ | ❌ | — | ❌ (sexo) | ✅ |
| **Semental** | ❌ | ❌ | ❌ (sexo) | — | ✅ |
| **Engorde** | ❌ | ❌ | ✅ hembra (reactivación) | ✅ macho (reactivación) | — |

Además, en la columna Reproductora se aplica el bloqueo en GESTANTE (§5.1) cuando el origen es Reproductora.

---

# 5. Salida del dominio reproductivo (Reproductora → otro tipo)

El comportamiento depende del estado reproductivo del ciclo abierto.

| Estado reproductivo | ¿Permitido? | Consecuencia sobre el ciclo | UX |
|---|:---:|---|---|
| `GESTANTE` | **No** | — (no se registra nada) | Mensaje de bloqueo en rojo. Sin formulario, solo "Cerrar". |
| `CUBIERTA` | Sí | Ciclo cerrado con `resultado = 'cierre_manual'` | Aviso + **checkbox de confirmación obligatoria** |
| `VACÍA` | Sí | Ciclo cerrado con `resultado = 'cierre_manual'` | Aviso informativo, sin checkbox |
| Sin ciclo abierto | Sí | Ninguna | Sin mensaje |

En todos los casos permitidos, tras el cambio:

```text
es_reproductora      = false
estado_reproductivo  = NULL
fecha_prevista_parto = NULL
```

## 5.1 Regla de bloqueo en GESTANTE

> **Una gestación en curso no puede interrumpirse cambiando el tipo productivo.**

Debe resolverse antes con su desenlace real (Parto o Aborto). Después la hembra queda en `VACÍA` en un nuevo ciclo y el cambio pasa a estar permitido.

Razón: si se permitiera, la gestación quedaría huérfana — un ciclo abierto en un animal que ya no participa en el dominio reproductivo — o se cerraría con un resultado que no describe lo ocurrido. Ambas opciones corrompen la historia reproductiva.

La regla se protege en dos capas independientes: UI (no ofrece el formulario) y backend (excepción y rollback completo).

## 5.2 Por qué CUBIERTA exige confirmación

En `CUBIERTA` existe una Cubrición registrada sin desenlace. Cerrar el ciclo deja esa Cubrición **sin desenlace para siempre**. Es una pérdida de información irreversible y el ganadero debe asumirla explícitamente:

> "Entiendo que la cubrición registrada quedará sin desenlace y el ciclo se cerrará"

En `VACÍA` no hay información pendiente; basta con informar.

## 5.3 `cierre_manual` como resultado

`cierre_manual` es el resultado de ciclo reservado a este flujo. Distingue el cierre por decisión de negocio de:

| Resultado | Origen |
|---|---|
| `parto` | Parto |
| `aborto` | Aborto |
| `machorra` | Machorra |
| `cierre_manual` | Cambio de tipo productivo |
| `NULL` con `fecha_fin` | Salida del animal (venta/muerte) |

`fecha_fin` del ciclo = fecha del cambio de tipo.

## 5.4 El cambio no toca vínculos madre-cría

Salir del dominio reproductivo no finaliza vínculos materno-filiales activos ni crea destetes. Las crías conservan su vínculo y se destetarán por su propio flujo.

---

# 6. Entrada o reactivación reproductiva (otro tipo → Reproductora)

> **Al pasar a Reproductora se crea SIEMPRE un nuevo ciclo en estado `VACÍA`.**

```text
CAMBIO_TIPO_PRODUCTIVO (→ Reproductora)
        ↓
nuevo ciclo  numero_ciclo = MAX(numero_ciclo) + 1
        ↓
fecha_inicio = fecha del cambio
        ↓
VACÍA
```

- Da igual que existan ciclos anteriores, cerrados o incluso abiertos por datos históricos: el nuevo ciclo es un punto de inicio limpio.
- Nunca se reabre un ciclo cerrado.
- El inicio del ciclo no es un evento: el log muestra el hito virtual "Nuevo ciclo · Vacía", derivado de `ciclo_reproductivo.fecha_inicio`. Aparece **también cuando es el primer ciclo (C1)**, por ejemplo en una Recría que pasa a Reproductora (decisión 2026-11-07; antes solo se mostraba desde C2).

Casos típicos:
- una Recría que el ganadero decide incorporar al rebaño reproductor (C1);
- **reactivación**: una ex-reproductora que pasó a Engorde y vuelve a Reproductora. Está permitida (decisión 2026-11-07): se abre un ciclo nuevo y el historial anterior queda intacto, por ejemplo Pastora (C1 cerrado con `cierre_manual` y C2 nuevo).

---

# 7. Cambio neutro (no reproductora → no reproductora)

Por ejemplo `Recría → Engorde`, `Semental → Engorde`, `Engorde → Semental`. Nunca hacia Recría (§1.1).

- Se registra el evento `CAMBIO_TIPO_PRODUCTIVO`.
- Se actualiza el tipo del animal.
- No hay consecuencias reproductivas.

---

# 8. Fecha del cambio

La fecha del cambio es **la fecha en que se registra** (hoy). El usuario no puede indicar una fecha pasada.

Se aplica a la vez a:

- `eventos.fecha` del `CAMBIO_TIPO_PRODUCTIVO`;
- `fecha_fin` del ciclo cerrado (§5);
- `fecha_inicio` del ciclo nuevo (§6).

Ver §11.3: esto difiere del resto de flujos reproductivos, donde la fecha es la del hecho.

---

# 9. Historia del animal

## 9.1 El evento

```text
codigo         CAMBIO_TIPO_PRODUCTIVO
fecha          fecha del cambio
ciclo_id       ciclo cerrado (solo en salida del dominio reproductivo con ciclo abierto); NULL en otro caso
metadata_json  { "tipo_anterior": "<nombre>", "tipo_nuevo": "<nombre>" }
animal         vinculado vía evento_animales, sin rol
```

## 9.2 Log de historial (`EventosList`)

- Categoría **Gestión** (badge neutro), no Reproductivo.
- Descripción: `Cambio productivo: <tipo_nuevo>`.
- Aunque tenga `ciclo_id`, **no muestra etiqueta de ciclo** (`C1`, `C2`…): junto a un evento de gestión generaría confusión semántica.

## 9.3 Carrusel reproductivo (`HistorialCarousel`)

- El evento aparece dentro del slide del ciclo que cerró, como **"Paso a no reproductora"**, con dot y label en rojo.
- El badge de resultado del ciclo muestra "Cierre manual".

**Compatibilidad hacia atrás.** Los ciclos con `cierre_manual` anteriores a la existencia del evento no tienen evento vinculado. Para ellos `buildEntradasOrdenadas()` inyecta una entrada sintética `tipo: 'cierre_manual'` con el mismo texto y la fecha `ciclo.fecha_fin`. Solo se inyecta si el ciclo no contiene ya un `CAMBIO_TIPO_PRODUCTIVO`.

La lección de ese caso está consolidada como regla del proyecto:

> **Si hay una acción real del usuario, se crea un evento real desde el principio.** Las entradas virtuales solo son válidas para estado derivado.

## 9.4 Ejemplo (seed — Pastora)

```text
Ciclo 1  (VACÍA, sin cubrición)
  01/06/2024  Paso a no reproductora    ← CAMBIO_TIPO_PRODUCTIVO {Reproductora → Engorde}
  Resultado:  Cierre manual
```

---

# 10. Implementación vigente (evidencia)

## 10.1 Pasos

```text
UI — ficha del animal
  1. SeccionUsoProductivo muestra el lápiz solo si estado_vital = 'vivo'
  2. DrawerCambioTipoProductivo
       · tipo actual (informativo)
       · si Reproductora + gestante → solo mensaje de bloqueo
       · si no → Select con tipos disponibles (sin el actual)
       · destino inválido (validarTipoProductivoDestino) → mensaje rojo, Confirmar deshabilitado
       · aviso contextual vacía/cubierta (getMensajeCambioTipoProductivo, animales/domain/rules.ts)
       · checkbox obligatorio si cubierta
  3. "Confirmar cambio"

Server Action — app/(main)/vacuno/animales/[id]/actions.ts
  4. submitCambiarTipoProductivo(animalId, nuevoTipoId)
  5. revalidatePath + router.refresh()

Use Case — modules/ganadero/animales/application/actions/cambiarTipoProductivo.ts
  6. supabase.rpc('cambiar_tipo_productivo', { p_animal_id, p_nuevo_tipo_productivo_id })

RPC — supabase/migrations/20261107000000_tipo_productivo_transiciones_y_compra.sql
  7.  SELECT ... FROM animal FOR UPDATE            ← bloqueo anti-concurrencia
  8.  valida estado_vital = 'vivo'
  8b. valida origen ≠ 'Cría' (su único cambio lo hace el destete)
  9.  valida tipo nuevo ≠ tipo actual
  9b. valida tipo destino ANTES de escribir nada:
        existe · misma especie · activo · ≠ 'Cría' · ≠ 'Recría' · sexo coherente (sexo NULL → bloqueo)
 10.  calcula es_reproductora nuevo
 11.  si sale de reproductora: busca ciclo abierto más reciente
        (fecha_fin IS NULL AND resultado IS NULL ORDER BY numero_ciclo DESC LIMIT 1)
 12.  INSERT eventos (CAMBIO_TIPO_PRODUCTIVO, CURRENT_DATE, ciclo_id, metadata)
 13.  INSERT evento_animales (sin rol)
 14.  UPDATE animal SET tipo_productivo_id, es_reproductora
 15a. sale de reproductora:
        · si ciclo abierto y estado gestante → RAISE EXCEPTION (rollback total)
        · si ciclo abierto → UPDATE ciclo SET fecha_fin = CURRENT_DATE, resultado = 'cierre_manual'
        · UPDATE animal SET estado_reproductivo = NULL, fecha_prevista_parto = NULL
 15b. entra en reproductora:
        · INSERT ciclo (numero_ciclo = MAX + 1, fecha_inicio = CURRENT_DATE)
        · UPDATE animal SET estado_reproductivo = 'vacia'
```

Toda la operación es una única transacción.

## 10.2 Detalles técnicos relevantes

- **Ciclo más reciente.** Pueden coexistir varios ciclos sin `fecha_fin` por cambios de tipo históricos (ver §11.2). Tanto el RPC como `getCicloAbierto()` operan siempre sobre el de mayor `numero_ciclo`. Nunca se usa `.single()`.
- **Orden evento → ciclo.** `ciclo_reproductivo.created_at` usa `clock_timestamp()` (migration `20260821180635`), así el ciclo creado en §6 queda siempre después del evento que lo origina en el log.
- **Opciones del Select.** `getTiposProductivosDisponibles(especie, sexo)` excluye `Cría` y los tipos cuyo sexo requerido no coincide con el del animal. Con sexo NULL mantiene los tipos ligados al sexo para que el drawer explique el bloqueo. `SeccionUsoProductivo` excluye además el tipo actual.
- **Regla duplicada SQL ↔ TS.** Las validaciones de origen, destino y entrada por compra existen en los RPC (fuente de verdad) y en `validarTipoProductivoOrigen` / `validarTipoProductivoDestino` / `validarTipoProductivoEntrada` (`animales/domain/rules.ts`), que solo sirven para guiar la UI. Si cambia una, debe cambiar la otra. La eval `evals/cambio-tipo-productivo.eval.ts` protege la versión TS.

## 10.3 Ficheros

| Capa | Fichero |
|---|---|
| RPC (vigente) | `supabase/migrations/20261107000000_tipo_productivo_transiciones_y_compra.sql` (también valida el tipo de entrada en `registrar_compra_animal`) |
| RPC (versiones anteriores) | `20260819000000_fecha_entrada_salida_cambio_tipo.sql` (original) → `20261104000000_cambiar_tipo_productivo_validacion_destino.sql` (validación de destino) |
| Formulario de compra | `app/(main)/vacuno/animales/entrada/page.tsx` (excluye Cría), `modules/ganadero/animales/ui/entrada/FormEntradaCompra.tsx` (sexo ↔ tipo) |
| Reglas de dominio (TS) | `modules/ganadero/animales/domain/rules.ts` → `validarTipoProductivoDestino`, `sexoRequeridoParaTipo`, `getMensajeCambioTipoProductivo` |
| Regla del carrusel | `modules/ganadero/reproductivo/domain/rules.ts` → `tipoEntradaSinteticaCierre` |
| Eval (dominio puro) | `evals/cambio-tipo-productivo.eval.ts` |
| Verificación del RPC contra BD | `scripts/verify-cambiar-tipo.sql` (15 casos, deshace todo al terminar). Ejecutar tras `supabase db reset --local` |
| Use Case | `modules/ganadero/animales/application/actions/cambiarTipoProductivo.ts` |
| Server Action | `app/(main)/vacuno/animales/[id]/actions.ts` |
| Query opciones | `modules/ganadero/animales/application/queries/listarTiposProductivos.ts` |
| UI | `modules/ganadero/animales/ui/ficha/SeccionUsoProductivo.tsx`, `DrawerCambioTipoProductivo.tsx` |
| Historial | `modules/ganadero/animales/ui/ficha/EventosList.tsx` |
| Carrusel | `modules/ganadero/reproductivo/ui/HistorialCarousel.tsx` |

---

# 11. Discrepancias y huecos detectados

Registro de lo detectado al documentar el flujo y cómo quedó cada punto. Estado a 2026-11-06: todos resueltos, decididos o sin efecto. No queda ninguno abierto.

## 11.1 Evolución de la regla de GESTANTE — ✅ corregido

La migration `20260814000000_drop_constraint_chk_estado_reproductivo.sql` preveía que un cambio a no reproductora **no cerrara** un ciclo gestante (`es_reproductora = false + ciclo abierto + GESTANTE → válido`). La decisión posterior (PRD-correctivo) fue **bloquear** el cambio. El comentario de cabecera del RPC conservaba la regla antigua y se corrigió el 2026-11-03.

## 11.2 Ciclos abiertos heredados — sin efecto actual

Antes del bloqueo pudieron quedar ciclos gestantes abiertos en animales no reproductores. Por eso el código tolera que coexistan varios ciclos abiertos (§10.2).

Comprobado el 2026-11-06: el seed no contiene ningún animal con más de un ciclo abierto, y la aplicación no está desplegada ni tiene datos reales. No hace falta limpieza. La tolerancia del código (`ORDER BY numero_ciclo DESC LIMIT 1`) se mantiene como defensa.

## 11.3 Fecha no seleccionable — decidido

El cambio usa siempre `CURRENT_DATE`. El resto de flujos reproductivos registra la fecha del hecho y valida coherencia temporal. Si el ganadero registra el cambio días después de decidirlo, la historia queda desplazada. Además, el RPC no valida que hoy sea ≥ último evento del ciclo, aunque por construcción casi siempre se cumple.

Decisión vigente (2026-11-06): no se permite elegir la fecha. Es la del momento en que se aplica el cambio. El caso queda anotado en `deferred.md` con lo que habría que definir si se reabre.

~~**Zona horaria.**~~ ✅ RESUELTO (2026-11-06). Antes, `CURRENT_DATE` se evaluaba en UTC y un cambio registrado entre la medianoche local y la UTC quedaba con el día anterior. Lo resuelve la migration `20261106000000_timestamptz_y_zona_horaria.sql`, que pone la BD en `Europe/Madrid`. El servidor Next.js necesitará `TZ=Europe/Madrid` al desplegar (ver `deferred.md`).

## ~~11.4 Restricciones de destino solo en UI~~ ✅ RESUELTO (2026-11-04)

La migration `20261104000000_cambiar_tipo_productivo_validacion_destino.sql` añade al RPC la validación del destino: existe, misma especie, activo, ≠ `Cría`, coherencia sexo ↔ tipo y bloqueo con sexo NULL (§4). Verificado contra la BD local con 15 casos (10 rechazos y 5 caminos válidos). Ningún rechazo deja eventos y las reglas previas (gestante, `cierre_manual`, ciclo nuevo en VACÍA) siguen intactas.

## ~~11.5 Porcino: hembra → Verraco~~ ✅ RESUELTO (2026-11-04)

`Verraco` se trata como equivalente porcino de `Semental` (solo machos), tanto en el RPC como en `getTiposProductivosDisponibles`.

## ~~11.6 Cobertura de evals~~ ✅ RESUELTO (2026-11-06)

Las reglas del flujo quedan cubiertas en dos niveles.

**Evals de dominio puro** (`evals/cambio-tipo-productivo.eval.ts`, se ejecutan en CI):
- validación del tipo destino (§4);
- mensaje del drawer según el estado reproductivo: bloqueo / aviso / sin mensaje (§5). Para poder
  probarla, la función se extrajo del componente a `getMensajeCambioTipoProductivo`;
- entrada sintética de cierre en el carrusel: `salida` / `cierre_manual` legado / ninguna (§9.3). Para
  poder probarla, la regla se extrajo a `tipoEntradaSinteticaCierre` y el carrusel conserva el
  ordenado y la agrupación de destetes.

**Verificación contra BD** (`scripts/verify-cambiar-tipo.sql`), para lo que solo existe en SQL:
- matriz estado reproductivo × familia de cambio (§3, §5): bloqueo en gestante, `cierre_manual` en
  vacía, ciclo nuevo en VACÍA al entrar en Reproductora, cambio neutro;
- derivación de `es_reproductora`;
- que ningún rechazo deje eventos.

No es eval porque necesita la BD. Las evals son puras por convención (`evals/README.md`).

---

# 12. Invariantes del flujo

1. Solo animales vivos pueden cambiar de tipo productivo.
2. Todo cambio de tipo genera un evento `CAMBIO_TIPO_PRODUCTIVO` real.
3. `es_reproductora` es siempre derivado (`hembra AND Reproductora`).
4. Una hembra `GESTANTE` no puede dejar de ser Reproductora.
5. Salir de Reproductora con ciclo abierto cierra el ciclo más reciente con `cierre_manual`.
6. Salir de Reproductora deja `estado_reproductivo` y `fecha_prevista_parto` en `NULL`.
7. Salir desde `CUBIERTA` requiere confirmación explícita del usuario.
8. Entrar en Reproductora crea siempre un ciclo nuevo en `VACÍA`; nunca reabre uno anterior.
9. El cambio de tipo no modifica vínculos madre-cría ni genera destetes.
10. El cierre y la apertura de ciclo no son eventos; son consecuencias del cambio.
11. `Cría` nunca es destino de un cambio manual.
11a. Una `Cría` no admite cambios manuales: su único cambio (→ `Recría`) lo hace el destete.
11b. El tipo destino es de la misma especie, está activo y es coherente con el sexo. Con sexo sin identificar no se asignan tipos ligados al sexo.
11c. `Recría` nunca es destino de un cambio manual: no se vuelve a Recría.
11d. La reactivación (Engorde → Reproductora / Semental) está permitida, también para ex-reproductoras.
11e. Un animal comprado no puede entrar como `Cría` y su tipo de entrada debe ser coherente con su sexo.
12. En el carrusel, el cambio aparece como "Paso a no reproductora" dentro del ciclo cerrado; en el log, como evento de Gestión sin etiqueta de ciclo.

---

# 13. Relación con otros flujos

- **Parto / Aborto** — única vía para desbloquear el cambio desde `GESTANTE`.
- **Destete** — cambia CRÍA → RECRÍA dentro de su propia operación atómica, **sin** pasar por `cambiar_tipo_productivo`. Ese cambio forma parte del hecho Destete.
- **Salida (venta/muerte)** — también cierra el ciclo, pero con `resultado = NULL`. No es un cambio de tipo.
- **Compra** — fija el tipo de entrada del animal. No es un cambio de tipo, pero `registrar_compra_animal` aplica las mismas reglas de catálogo y sexo, salvo que Recría sí es un tipo de entrada válido y Cría no (§1.1).
- **Machorra** — desenlace reproductivo propio. No implica cambio de tipo automático: si el ganadero decide desechar la hembra, registra el cambio de tipo explícitamente.
