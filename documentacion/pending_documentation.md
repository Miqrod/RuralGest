# Pending Documentation

## Objetivo

Este documento recopila todas las decisiones de dominio, arquitectura, UX y modelo de datos que han quedado consolidadas durante el desarrollo de los distintos PRD, pero que todavía no han sido incorporadas a la documentación permanente del proyecto.

No pretende sustituir la documentación oficial.

Su finalidad es servir como backlog documental para que, en futuras revisiones de la Base de Conocimiento, todas las decisiones relevantes puedan trasladarse a los documentos correspondientes sin necesidad de revisar nuevamente todos los PRD.

Una vez una decisión haya sido incorporada a la documentación permanente, deberá eliminarse de este documento.

---

# Pendiente de documentar

| PRD | Estado | Documentación pendiente |
|-----|--------|-------------------------|
| PRD008 | ⏳ | Corrección del flujo de Confirmación de Gestación sin Cubrición previa |
| PRD009 | ⏳ | Parto, creación de crías, identificación, genealogía derivada, historial reproductivo y consolidación del nacimiento |
| PRD010 | ⏳ | Finalización del ciclo reproductivo, dependencia funcional madre-cría y flujo de Destete |
| PRD011 | ⏳ | Flujo de Aborto, RPC registrar_aborto como patrón de referencia |
| PRD012 | ⏳ | Machorra, invariante resultado='parto' AND fecha_fin IS NULL, validación temporal en DatePicker |
| PRD-correctivo | ⏳ | Cambio de tipo productivo, entradas virtuales vs reales, salida de animal |
| PRD013 | ⏳ | Consolidación dominio reproductivo, inmutabilidad de resultado, arquitectura UI→Query→Repository |
| PRD013-fix | ⏳ | Destete múltiple atómico, invariante ciclo_id histórico en DESTETE |

## PRD008 - Corrección del flujo "Confirmación de Gestación sin Cubrición previa"

### Motivo de la decisión

Una Confirmación de Gestación puede constituir el primer hecho reproductivo conocido por el sistema.

Este escenario es especialmente relevante cuando la explotación no ha registrado la Cubrición o cuando el animal procede de una situación histórica en la que dicho dato no está disponible.

Por tanto, el inicio de un ciclo reproductivo no depende exclusivamente de la existencia previa de una Cubrición.

### Inicio del ciclo mediante Confirmación

Cuando no existe una Cubrición previa y se registra una Confirmación de Gestación válida:

```text
Confirmación de Gestación
        ↓
crear ciclo reproductivo
        ↓
estado = GESTANTE
```

La estructura del ciclo es la misma que cuando se inicia mediante una Cubrición.

La diferencia reside únicamente en el conocimiento disponible y en la historia real de eventos registrada.

No se crea un tipo de ciclo diferente.

### Padre conocido

Cuando existe una Cubrición previa:

* el padre se obtiene de la Cubrición;
* la Confirmación de Gestación no puede modificarlo.

Cuando no existe Cubrición previa:

* la Confirmación de Gestación puede permitir informar opcionalmente `padre_id`;
* si el padre es desconocido, permanece `NULL`.

El sistema no debe inventar ni inferir un padre que no forme parte del conocimiento disponible.

### Consecuencia para la genealogía

Cuando posteriormente se produzca un Parto iniciado por este ciclo:

* la madre será conocida;
* el padre podrá ser conocido o permanecer `NULL`;
* las crías podrán crearse con la información realmente disponible.

La ausencia de padre conocido no impide representar correctamente el nacimiento.

### Reutilización de las reglas reproductivas

Los ciclos iniciados mediante:

```text
Cubrición → ciclo
```

y:

```text
Confirmación → ciclo
```

deben utilizar las mismas reglas posteriores.

Ambos pueden evolucionar hacia:

```text
CUBIERTA
→ GESTANTE
→ LACTANTE
→ finalización del ciclo
```

La diferencia pertenece a la historia registrada, no a una arquitectura o ciclo alternativo.

### Decisiones pendientes de trasladar a documentación permanente

Debe documentarse de forma permanente:

* Confirmación como posible primer hecho conocido del ciclo;
* reglas para determinar el inicio del ciclo;
* tratamiento de `padre_id` cuando no existe Cubrición;
* imposibilidad de modificar el padre ya conocido;
* reutilización de las mismas reglas posteriores independientemente del origen del ciclo.

El documento permanente de destino deberá ser principalmente el flujo de Confirmación de Gestación y, cuando corresponda, la documentación del modelo reproductivo.

---

## PRD009 - Registro de Parto y consolidación del nacimiento como evento reproductivo

### 1. Parto como evento reproductivo

El Parto constituye un evento reproductivo real registrado por el usuario.

El evento:

* pertenece al ciclo reproductivo correspondiente;
* cambia el estado reproductivo de la madre a `VACÍA` (el RPC abre inmediatamente un nuevo ciclo vacía — `LACTANTE` nunca se implementó);
* NO finaliza el ciclo de parto (queda con `resultado='parto'` y `fecha_fin=NULL` hasta el último destete);
* inicia la fase de dependencia funcional madre-cría.

El Parto debe poder registrarse cuando el ciclo se encuentre en:

* `CUBIERTA`, si existe una Cubrición registrada aunque no se haya confirmado la gestación;
* `GESTANTE`, si existe Confirmación de Gestación.

Si no existe ningún hecho reproductivo suficiente para justificar la gestación, deberá registrarse previamente una Confirmación de Gestación.

### 2. Información específica del Parto

El evento genérico `EVENTO` no debe sobrecargarse con información específica del nacimiento.

Se mantiene una entidad especializada:

`evento_parto`

relacionada 1:1 con `evento`.

Debe almacenar exclusivamente información propia del nacimiento que posteriormente pueda necesitarse de forma estructurada.

Entre la información inicialmente definida:

* `evento_id`;
* `numero_nacidos`;
* `numero_vivos`;
* `numero_muertos`;
* `tipo_parto`;
* `observaciones`.

La estructura definitiva deberá mantenerse alineada con el modelo persistente real.

### 3. Creación automática de las crías

El registro de un Parto crea automáticamente tantas entidades `Animal` como nacimientos registrados.

Las crías existen como entidades reales desde el momento en que el Parto queda registrado.

No existen:

* animales provisionales;
* animales pendientes de crear;
* entidades temporales para representar nacimientos.

La identificación administrativa puede quedar incompleta sin impedir la creación del animal.

### 4. Información inicial de las crías

Cada nueva cría recibe automáticamente toda la información que el sistema conoce en el momento del Parto.

Entre ella:

* `madre_id`;
* `padre_id`, cuando sea conocido;
* fecha de nacimiento;
* origen;
* estado vital;
* tipo productivo;
* raza;
* estado de identificación;
* referencia al hecho de nacimiento.

La relación con el ciclo reproductivo se mantiene a través de los eventos y del modelo de ciclos, no mediante un `ciclo_reproductivo_id` almacenado directamente en `Animal`.

### 5. Vínculo madre-cría

El nacimiento de una cría viva crea el vínculo funcional con su madre.

La cría nace con:

```text
tipo_productivo = CRÍA
estado_vinculo_materno = ACTIVO
```

La genealogía se conserva mediante:

```text
madre_id
```

La dependencia funcional se representa mediante:

```text
estado_vinculo_materno
```

Ambos conceptos son independientes.

La relación genealógica permanece aunque posteriormente finalice la dependencia funcional.

El detalle de este modelo se documenta en la documentación permanente del modelo reproductivo y del modelo ganadero.

### 6. Animales nacidos muertos

Los animales nacidos muertos también se crean como entidades `Animal`.

Su existencia constituye un hecho confirmado por el Parto y debe formar parte de la historia de la explotación.

Estos animales:

* mantienen la trazabilidad del nacimiento;
* conservan la relación genealógica conocida;
* no establecen una dependencia funcional activa con la madre;
* no participan en la continuidad del ciclo reproductivo como crías dependientes.

### 7. Tipo productivo

Las nuevas crías nacidas vivas se crean con:

```text
tipo_productivo = CRÍA
```

`CRÍA` representa un animal que permanece en etapa lactante y mantiene un vínculo funcional activo con su madre.

La transición:

```text
CRÍA → RECRÍA
```

se produce automáticamente mediante el Destete.

Una cría que muere o es vendida antes del Destete puede permanecer como `CRÍA`, pero con el vínculo materno finalizado.

Las crías nacidas muertas no adquieren un papel productivo y permanecen con:

```text
tipo_productivo = NULL
```

### 8. Cálculo automático de la raza

La raza de las nuevas crías se calcula automáticamente a partir del conocimiento disponible sobre sus progenitores.

Reglas iniciales:

* ambos progenitores con la misma raza → la cría hereda esa raza;
* progenitores de razas diferentes → la cría se clasifica como `CRUZADA`;
* cuando no existe información suficiente, el sistema conserva la ausencia de conocimiento en lugar de inventarlo.

La lógica queda preparada para evolucionar en futuras versiones.

### 9. Identificación administrativa

La existencia del animal y su identificación administrativa son conceptos independientes.

Un animal puede existir aunque todavía no disponga de toda su información administrativa.

Se incorpora:

`estado_identificacion`

con los valores:

* `PENDIENTE`;
* `COMPLETA`.

Este estado representa exclusivamente el grado de identificación administrativa del animal.

No representa:

* estado vital;
* estado reproductivo;
* estado sanitario;
* tipo productivo;
* dependencia materna.

Las reglas de identificación pertenecen al modelo de Animal y deberán documentarse como un flujo reutilizable de identificación.

### 10. Identificación posterior al Parto

El registro del Parto no debe obligar al usuario a completar inmediatamente toda la información administrativa de cada cría.

La aplicación puede crear las crías con información parcial y ofrecer posteriormente una acción de identificación.

La identificación debe permitir completar al menos:

* crotal;
* sexo;

y cualquier otro dato que las reglas vigentes determinen como obligatorio.

La interfaz de identificación se plantea como una acción contextual desde la ficha de la madre y/o desde los mecanismos de tareas o acciones derivadas que se consoliden posteriormente.

### 11. Historial reproductivo

La ficha de la madre incorpora una proyección de historial reproductivo basada en ciclos.

El usuario no necesita conocer el concepto técnico de `ciclo_reproductivo`.

El carrusel debe utilizar los ciclos como estructura interna para contar la historia reproductiva.

El historial:

* muestra primero el ciclo actual;
* permite consultar ciclos anteriores;
* adapta la información mostrada al momento en el que se encuentra cada ciclo;
* tras el Parto desplaza el foco hacia la información relacionada con las crías;
* no sustituye al historial puro de eventos.

El Timeline de eventos y el historial reproductivo cumplen funciones diferentes:

```text
Timeline
→ hechos registrados

Historial reproductivo
→ interpretación agregada de la historia reproductiva
```

### 12. Proyección de las crías

El historial reproductivo deberá poder explicar qué ocurrió con las crías asociadas al ciclo.

Esta información no debe depender de un único "resultado" que resuma toda la camada.

Debe poder reconstruirse a partir de:

* las crías creadas por el Parto;
* su genealogía;
* sus eventos;
* su estado de vínculo materno;
* su tipo productivo;
* su estado vital.

La narrativa agregada de cada ciclo pertenece a la proyección del historial, no al historial de eventos.

### 13. Pendiente de documentación permanente

Debe trasladarse a documentación permanente:

* flujo completo de Parto;
* creación automática de animales;
* entidad `evento_parto`;
* creación de crías parcialmente conocidas;
* animales nacidos muertos;
* vínculo inicial madre-cría;
* `CRÍA` como tipo productivo inicial;
* cálculo de raza;
* identificación administrativa;
* identificación posterior al nacimiento;
* historial reproductivo;
* separación entre Timeline de eventos e historial reproductivo;
* comportamiento de la proyección del ciclo después del Parto.

Los documentos permanentes previstos son principalmente:

```text
documentacion/flujos/reproductivo/parto.md
```

y los documentos de modelo y arquitectura que correspondan.

### 14. Decisiones ya superadas

No deben trasladarse a la documentación permanente como decisiones vigentes las formulaciones antiguas del PRD009 que contradigan el modelo actual.

En particular:

* `RECRÍA` como tipo productivo inicial de una cría viva;
* almacenamiento directo de `ciclo_reproductivo_id` en `Animal`;
* consideración del Destete como cierre directo del ciclo;
* cualquier representación de la finalización del ciclo mediante un evento artificial;
* cualquier tratamiento de la muerte prematura de una cría como si fuera un Destete.

---

### UX

#### Historial reproductivo

Nuevo widget en la ficha del animal.

Representa internamente ciclos reproductivos, aunque este concepto permanezca oculto al usuario.

Comportamiento:

- El primer slide representa siempre el ciclo actual.
- Los siguientes representan ciclos históricos.
- Antes del Parto se muestra información operativa de la gestación.
- Tras el Parto el foco pasa automáticamente a las crías.
- Los ciclos históricos muestran únicamente la información relevante para comprender el resultado reproductivo.

---

#### Drawer "Identificar"

Primera utilización del patrón Drawer en la aplicación.

Permite completar rápidamente la identificación de las nuevas crías sin abandonar la ficha de la madre.

El Drawer muestra:

Información contextual (solo lectura):

- fecha de nacimiento;
- madre;
- padre;
- raza;
- estado vital.

Información editable:

- crotal;
- sexo.

---

#### Dashboard

Se inicia el Dashboard operacional mediante un primer widget:

**Animales pendientes de identificar**

---

### Decisiones arquitectónicas

#### ReproductiveEngine — CANCELADO POR AHORA (evaluado en PRD013)

Tras la consolidación del dominio reproductivo en PRD013, no se ha identificado una responsabilidad compartida de suficiente complejidad que justifique una capa adicional. Los Use Cases actuales presentan una orquestación simple y auditable, mientras que las garantías críticas se resuelven en las operaciones transaccionales correspondientes.

El Engine podrá reconsiderarse únicamente ante una necesidad concreta: múltiples consumidores del mismo pipeline reproductivo, lógica de proyección sustancialmente reutilizada, o nuevos módulos que requieran coordinar el dominio reproductivo de forma transversal. No existe actualmente un problema que el Engine resuelva.

---

## PRD010 - Finalización del ciclo reproductivo y gestión de la dependencia madre-cría

### Dependencia funcional madre-cría

La relación madre-cría ya ha sido consolidada en el modelo mediante:

* `madre_id` como genealogía permanente;
* `estado_vinculo_materno` como estado derivado de la dependencia funcional.

Debe documentarse de forma permanente el comportamiento completo de esta relación dentro del dominio reproductivo.

### Regla de continuidad del ciclo

El ciclo reproductivo permanece abierto mientras exista al menos una cría que cumpla:

```text
tipo_productivo = CRÍA
estado_vital = VIVO
estado_vinculo_materno = ACTIVO
```

Cuando no exista ninguna cría que cumpla simultáneamente estas condiciones, el ciclo podrá finalizar.

El cierre del ciclo:

* no constituye un evento;
* no genera una entrada artificial en el historial;
* constituye una consecuencia derivada de las reglas del dominio.

### Destete

El Destete:

* se inicia desde la ficha de la madre;
* permite seleccionar una, varias o todas las crías elegibles;
* afecta individualmente a cada cría;
* registra el hecho tanto en la historia de la madre como en la de cada cría afectada;
* finaliza el vínculo materno de cada cría destetada;
* cambia `tipo_productivo` de `CRÍA` a `RECRÍA`.

La operación debe ser atómica.

### Destete parcial

Una madre puede tener varias crías vinculadas y cada una puede finalizar su vínculo en una fecha diferente.

El Destete de una cría no implica por sí mismo el cierre del ciclo.

El ciclo continúa mientras exista al menos una cría viva que siga siendo `CRÍA + ACTIVO`.

### Venta y Muerte

La Venta o Muerte de una cría puede finalizar su vínculo materno mientras dicho vínculo continúe activo.

La Venta o Muerte de la madre finaliza los vínculos maternos activos asociados a ella.

Una vez finalizado un vínculo:

* los acontecimientos posteriores de esa cría ya no afectan al contexto reproductivo de la madre;
* una cría que posteriormente sea vendida o muera como `RECRÍA` no debe generar consecuencias sobre el ciclo de la madre.

### Nuevo ciclo

Cuando el último vínculo materno activo desaparece:

1. finaliza el ciclo actual;
2. la madre pasa a `VACÍA`;
3. si continúa siendo `REPRODUCTORA`, se crea inmediatamente un nuevo ciclo en estado `VACÍA`.

La creación del nuevo ciclo no constituye un evento del historial.

### Narrativa del ciclo

El historial de eventos debe permanecer puro.

No se registrará:

* "inicio de ciclo";
* "cierre de ciclo";
* "fin de vínculo";
* `TIMEOUT`.

La historia agregada del ciclo se explicará mediante la proyección del historial reproductivo.

Esta proyección deberá permitir comprender la evolución de las diferentes crías y evitar reducir un ciclo con varias crías a un único motivo de cierre.

### Evoluciones futuras

La detección de discontinuidades temporales queda fuera del PRD010.

No se implementará:

* cron de cierre;
* cierre automático por tiempo;
* evento `TIMEOUT`.

Se conserva como evolución futura la posibilidad de que un nuevo evento reproductivo permita detectar que existe una discontinuidad temporal suficiente para considerar finalizado el ciclo anterior y comenzar otro.

### Documentación permanente prevista

El conocimiento de PRD010 deberá trasladarse principalmente a:

```text
documentacion/flujos/reproductivo/destete.md
```

y, cuando corresponda:

```text
documentacion/modelo/modelo_reproductivo.md
documentacion/arquitectura/domains/reproductive.md
```

---

### Arquitectura transversal

#### Pending Tasks

Se mantiene pendiente de consolidación la infraestructura transversal para representar trabajo pendiente derivado de acontecimientos ya registrados.

Una `PendingTask` no constituye:

* un evento de dominio;
* un estado del dominio;
* una proyección del estado;
* una nueva fuente de verdad.

Representa una acción que el sistema considera pendiente de resolución por parte del usuario como consecuencia de hechos ya registrados.

Por ejemplo:

* identificar nuevas crías;
* completar una acción administrativa derivada del nacimiento;
* asignar ubicación tras un proceso operativo;
* adjuntar documentación financiera.

Las `PendingTask` deberán ser derivadas de los hechos y de las reglas del dominio correspondiente, pero su existencia no modificará por sí misma el estado del dominio.

La infraestructura deberá ser transversal y reutilizable por los distintos bounded contexts.

Se prevé que permita alimentar:

* Dashboard operacional;
* widgets de tareas pendientes;
* acciones recomendadas;
* futuras automatizaciones.

### Pendiente

Todavía debe definirse:

* modelo persistente;
* ciclo de vida de una `PendingTask`;
* relación entre evento origen y tarea pendiente;
* reglas de creación y resolución;
* idempotencia;
* ownership del dominio que genera la tarea;
* integración con `AvailableActions`;
* comportamiento cuando el hecho origen deja de ser relevante.

Esta decisión se consolidará en un PRD específico antes de introducir la infraestructura transversal.

---

### Decisiones descartadas o sustituidas

Durante la evolución del modelo se han descartado o sustituido algunas aproximaciones inicialmente consideradas.

Estas decisiones se conservan aquí únicamente mientras no hayan sido incorporadas como decisiones históricas relevantes en la documentación arquitectónica.

* No persistir `ciclo_reproductivo_id` directamente en `Animal`.
* No crear una entidad independiente `VinculoMadreCria` para representar la dependencia funcional.
* No modificar ni eliminar `madre_id` cuando finaliza el vínculo materno.
* No crear un evento artificial `CIERRE_CICLO`.
* No crear un evento artificial `TIMEOUT`.
* No utilizar el Destete individual como sinónimo de cierre del ciclo.
* No utilizar un único motivo de cierre para resumir el resultado de un ciclo con varias crías.
* No tratar automáticamente la Muerte de una cría como un Destete.
* No hacer que acontecimientos posteriores al fin del vínculo de una cría afecten al ciclo reproductivo de la madre.
* No crear un nuevo ciclo por medio de un evento visible de "inicio de ciclo".

---

## Decisiones de modelo pendientes de incorporar

### Tipo productivo

Se redefine el significado de `tipo_productivo`.

El tipo productivo representa el papel funcional que desempeña el animal dentro de la explotación y no exclusivamente su finalidad económica.

Se incorpora el nuevo valor:

`CRÍA`

con el siguiente flujo de evolución:

CRÍA → RECRÍA → (REPRODUCTORA | SEMENTAL | ENGORDE)

Esta decisión mejora la representación del ciclo de vida del animal y simplifica la futura implementación del Destete y del Dashboard.

---

---

## PRD011 — Aborto

> Pendiente de incorporar a documentación permanente.

### Flujo del Aborto

El Aborto registra la pérdida de gestación desde los estados `CUBIERTA` o `GESTANTE`.

```text
CUBIERTA | GESTANTE
       ↓
  resultado = 'aborto'
  fecha_fin = fecha del aborto
       ↓
  Si es_reproductora → nuevo ciclo VACÍA
  Si no → estado_reproductivo = NULL
```

El Aborto **cierra el ciclo inmediatamente** con `fecha_fin`. A diferencia del Parto, no hay crías ni vínculos maternos pendientes que mantener abiertos.

### RPC `registrar_aborto` como patrón de referencia

`registrar_aborto` es el patrón de referencia para coherencia temporal y robustez transaccional en el dominio reproductivo. Implementa:

- Validación de que el ciclo es del animal correcto y está abierto.
- Validación temporal: `p_fecha >= MAX(fecha) de eventos del ciclo`.
- Cierre atómico del ciclo y apertura del nuevo ciclo vacía en la misma transacción.

### Relación con Machorra

El Aborto es el flujo correcto cuando la gestación ya fue confirmada (`GESTANTE`) y se pierde. La Machorra no puede registrarse desde `GESTANTE` — si el veterinario determina que la confirmación fue incorrecta, el camino es registrar un Aborto.

### Documentación permanente prevista

```text
documentacion/flujos/reproductivos/aborto.md
```

---

## PRD012 — Machorra

> Pendiente de incorporar a documentación permanente.

### Flujo de Machorra

La Machorra registra el fracaso reproductivo de un ciclo: la hembra no ha quedado gestante tras una o varias cubriciones, o se decide cerrar el ciclo sin gestación.

```text
VACÍA | CUBIERTA  (NO desde GESTANTE)
       ↓
  resultado = 'machorra'
  fecha_fin = CURRENT_DATE  (sin fecha elegida por el usuario)
       ↓
  Si es_reproductora → nuevo ciclo VACÍA
  Si no → estado_reproductivo = NULL
```

### Restricción desde GESTANTE

La Machorra **no puede registrarse desde `GESTANTE`**. Si la gestación ya fue confirmada, el flujo correcto es `ABORTO`. Esta regla está implementada en dos capas:

- **UI**: la acción `machorra` no aparece en `getAvailableActions` cuando `estadoReproductivo === 'gestante'`.
- **RPC**: `registrar_machorra` valida el estado y lanza excepción si el animal está en `GESTANTE`.

### Presentación — carrusel, no SeccionAcciones

La acción de registrar Machorra se presenta en el carrusel del ciclo activo (dentro de `HistorialCarousel`), no en `SeccionAcciones` junto a las demás operaciones reproductivas. Razón: la Machorra es un desenlace del ciclo visible en su contexto histórico, no una acción operativa del día a día.

La prop `canMachorra` fluye: `page.tsx → SeccionHistorialReproductivo → HistorialCarousel`.

### Invariante de audit confirmado (PRD012, tarea 179)

El patrón `resultado='parto' AND fecha_fin IS NULL` en `ciclo_reproductivo` es **diseño intencional**, no un defecto:

- El RPC `registrar_parto` fija `resultado='parto'` pero no pone `fecha_fin`.
- El ciclo de parto queda "semiabierto" hasta que el último destete lo cierre con `fecha_fin`.
- `getCicloAbierto()` filtra `resultado IS NULL` — devuelve siempre el ciclo activo correcto, nunca el ciclo de parto pendiente de destete.
- **Este filtro es un invariante crítico que no debe eliminarse.**

Pueden coexistir dos ciclos con `fecha_fin IS NULL` por animal: el ciclo de parto (resultado='parto') y el ciclo activo nuevo (resultado=NULL). Esto es correcto y esperado.

### Documentación permanente prevista

```text
documentacion/flujos/reproductivos/machorra.md  (existe, actualizar con detalle de implementación)
```

---

## PRD012 — Validación temporal en frontend (tarea 177)

> Pendiente de incorporar a documentación permanente de patrones.

### `getLastEventoFechaForCiclo` → sustituida por `getCicloAbiertoParaFicha` (PRD013)

`getLastEventoFechaForCiclo` existe en `reproductivo/infrastructure/repository.ts` pero ya no se usa en `page.tsx`. Fue reemplazada por `getCicloAbiertoParaFicha` (ver sección PRD013), que combina la lectura del ciclo y del último evento en una sola query (join en Supabase), eliminando la consulta serial y la violación de arquitectura de importar infrastructure desde page.tsx.

La función sigue disponible en repository.ts para posibles futuros usos puntuales, pero no debe reintroducirse como patrón en page.tsx.

El fallback a `fecha_inicio` cuando el ciclo no tiene eventos aún sigue siendo necesario y está incorporado dentro de `getCicloAbiertoParaFicha`.

### `isoStringToDate` — columnas TIMESTAMP vs DATE

`eventos.fecha` es `TIMESTAMP NOT NULL`, no `DATE`. Supabase lo devuelve como `'2026-07-15T10:30:00+00:00'`. La función `isoStringToDate` en `lib/format.ts` usa `.slice(0, 10)` antes de parsear para ser robusta frente a ambos tipos:

```ts
export function isoStringToDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}
```

**Regla:** verificar siempre en la migración si una columna de fecha es `DATE` o `TIMESTAMP` antes de parsearla. Nunca asumir `YYYY-MM-DD`.

### Reglas del DatePicker con `captionLayout="dropdown"`

Dos invariantes del componente `DatePicker` que no deben violarse:

1. **`startMonth` ≠ `minDate`**: `startMonth` es el límite de navegación del calendario (siempre `new Date(FROM_YEAR, 0)`). `minDate` es la restricción de selección y va exclusivamente en `disabled`. Usar `minDate` como `startMonth` rompe el dropdown de año.

2. **`disabled` como función, no como array de objetos**: con `captionLayout="dropdown"`, el matcher `[{ before: minDate }]` no funciona. Usar siempre `(date: Date) => boolean`.

---

## Plan de testing de integración — pendiente de implementar

> Anotado en PRD010 (2026-08-12). Pendiente tras PRD011 y PRD012 sin haberse implementado.
> Existe `tests/machorra.test.ts` con 25 `it.todo` que marcan explícitamente los escenarios de integración pendientes.

### Contexto

Los evals actuales (`evals/`) cubren únicamente funciones puras (reglas de dominio, mappers). No existe cobertura de los RPCs de Postgres ni de las queries de application layer. Estos son el mayor riesgo de regresión: son transaccionales, tienen lógica condicional compleja y han tenido bugs que solo se detectan contra DB real.

### Propuesta de arquitectura de tests

**Capa 1 — evals/** (ya existe): funciones puras, Vitest, sin DB, `npm run evals`

**Capa 2 — tests/integration/** (por construir): contra Supabase local Docker

```
tests/
  helpers/
    supabase.ts          ← createTestClient() + helpers de seed: createTestAnimal, createTestCiclo, cleanup
    seed-minimal.ts      ← inserta solo los datos mínimos por test (especie, tipo_productivo, etc.)
  integration/
    reproductive-cycle.test.ts   ← parto → destete → cierre
    salida-vinculo-materno.test.ts  ← muerte/venta de cría finaliza vínculo
```

**vitest.config.ts**: añadir configuración separada para integración (`--project integration`) con `globalSetup` que verifique que Supabase local está corriendo.

### Estrategia de aislamiento

Cada test genera UUIDs únicos, inserta datos mínimos necesarios y ejecuta `cleanup()` en `afterEach`. Sin mocks, sin rollback de transacciones — datos reales, DB real.

### Escenarios prioritarios a cubrir

1. `registrar_parto` → crías creadas con `estado_vinculo_materno = 'activo'`
2. `registrar_destete` cría 1 de 2 → ciclo sigue abierto, madre sigue `lactante`
3. `registrar_destete` última cría → ciclo se cierra, madre pasa a `vacía`
4. `registrar_destete` de cría ya destetada → RPC lanza error
5. `registrar_salida_animal` (muerte) de cría con vínculo activo → vínculo finaliza, ciclo se evalúa

### Esfuerzo estimado

- Setup inicial (`helpers/`): ~4 horas
- Primer test como plantilla: ~2 horas
- Cada RPC nuevo a partir de ahí: ~30-60 minutos

### Cuándo hacerlo

Al inicio del siguiente PRD, antes de escribir nuevos RPCs. Una vez que la plantilla existe, el coste marginal por RPC es bajo.

---

---

## PRD-correctivo — Cambio de tipo productivo y correcciones del módulo reproductivo

> Implementado en agosto 2026. Pendiente de incorporar a la documentación permanente del modelo reproductivo.
> No documentar todavía: el modelo reproductivo puede seguir evolucionando.

---

### 1. Tabla `animal` — nuevos campos

Se añaden `fecha_entrada` y `fecha_salida` directamente en la tabla `animal`.

- `fecha_entrada`: fecha de alta del animal en la explotación (compra, nacimiento, etc.).
- `fecha_salida`: fecha de baja (venta, muerte). Null mientras el animal esté activo.

Backfill aplicado desde `eventos` para animales existentes.

---

### 2. Tipo de evento `CAMBIO_TIPO_PRODUCTIVO`

Nuevo código de evento reproductivo que registra el momento en que un animal deja de ser Reproductora.

- Persiste en `eventos` vinculado al `ciclo_id` del ciclo que se cierra.
- Aparece en el slide del ciclo en el carrusel, en rojo, con la etiqueta "Paso a no reproductora".

---

### 3. RPC `cambiar_tipo_productivo`

RPC transaccional en `supabase/migrations/20260819000000_fecha_entrada_salida_cambio_tipo.sql`.

Comportamiento según el estado reproductivo del animal:

| Estado al cambiar | Resultado |
|---|---|
| `gestante` | `RAISE EXCEPTION` — cambio bloqueado a nivel DB |
| `cubierta` o `vacia` | Ciclo más reciente cerrado con `resultado = 'cierre_manual'` |
| Sin ciclo abierto | Solo se actualiza `tipo_productivo` |

Al volver a Reproductora: se crea siempre un nuevo ciclo en estado `vacía`, independientemente de si existen ciclos anteriores abiertos o cerrados.

Detalle técnico crítico: la query del ciclo abierto usa `ORDER BY numero_ciclo DESC LIMIT 1` para operar siempre sobre el ciclo más reciente. Pueden coexistir múltiples ciclos sin `fecha_fin` (escenario posible con cambios de tipo históricos).

---

### 4. Regla de dominio: gestante no puede cambiar de tipo productivo

Decisión de dominio adoptada para simplificar el modelo y evitar estados inconsistentes.

Un animal en estado `gestante` **no puede cambiar de tipo productivo**. La gestación en curso debe resolverse primero (parto o aborto).

Implementación en dos capas:
- **UI**: `DrawerCambioTipoProductivo` detecta `estadoReproductivo === 'gestante'` y muestra solo un mensaje de bloqueo en rojo. No hay formulario ni botón de confirmar.
- **DB**: el RPC lanza `RAISE EXCEPTION` como red de seguridad independiente de la UI.

---

### 5. `DrawerCambioTipoProductivo` — lógica de mensajes y confirmación

`getMensajeContextual()` devuelve `{ texto, tipo: 'bloqueo' | 'aviso' } | null` según la combinación de tipo actual, tipo nuevo y estado reproductivo:

- `gestante` → `bloqueo`: mensaje rojo, sin formulario, solo "Cerrar".
- `cubierta` saliendo de Reproductora → `aviso` + checkbox obligatorio de confirmación.
- `vacía` saliendo de Reproductora → `aviso` informativo (sin checkbox).
- Otras combinaciones → sin mensaje.

El checkbox de cubierta usa `style={{ accentColor: 'var(--color-world)' }}` (la clase Tailwind `accent-world` no aplica correctamente).
El estado del drawer (tipo seleccionado + checkbox) se resetea siempre al cerrar.

---

### 6. Eventos reales vs entradas de presentación — patrón transversal

El sistema diferencia con precisión lo que es un **hecho registrado** de lo que es un **hito de presentación**. Esta distinción es crítica para no confundir la historia real de la explotación con ayudas visuales construidas en tiempo de render.

#### Log de historial completo (`listarEventosDeAnimal`)

Devuelve una lista mezclada de dos tipos, distinguidos por la unión discriminada `EventoEnHistorial`:

```typescript
type EventoEnHistorial = EventoReal | EventoVirtual
```

- **`EventoReal` (`virtual: false`)**: fila persistida en la tabla `eventos`, creada por un RPC a partir de una acción real del usuario. Tiene UUID real.
- **`EventoVirtual` (`virtual: true`)**: hito de presentación inyectado en la propia función de query. Nunca persiste en la DB. El `id` es un string sintético (`'virtual-ciclo-{ciclo_id}'`), nunca un UUID.

Tipo virtual actualmente existente:
- `NUEVO_CICLO`: marca el inicio de un nuevo ciclo reproductivo (C2, C3...) en el log cronológico. Se inyecta para que el usuario entienda el punto de inflexión sin que exista un evento real de "inicio de ciclo".

**Regla de dominio explícita en el código:** nunca crear un `tipo_evento = 'INICIO_CICLO'` en la DB. Estos hitos viven exclusivamente en la capa de presentación.

#### Carrusel reproductivo (`HistorialCarousel`)

Usa su propia unión discriminada `EntradaCiclo`:

```typescript
type EntradaCiclo =
  | { tipo: 'real';          evento: EventoHistorial }
  | { tipo: 'cierre_manual'; fecha: string }
  | { tipo: 'salida';        fecha: string; motivo: 'vendido' | 'muerto' }
```

- **`tipo: 'real'`**: evento real leído de `getHistorialReproductivo` (tabla `eventos`). Renderizado por `EventoRow`.
- **`tipo: 'cierre_manual'`**: entrada sintética de compatibilidad hacia atrás. Solo existe para ciclos ANTERIORES a la implementación del evento `CAMBIO_TIPO_PRODUCTIVO`, que tienen `resultado = 'cierre_manual'` pero ningún evento vinculado. Renderiza "Paso a no reproductora".
- **`tipo: 'salida'`**: entrada sintética para ciclos cerrados por venta/muerte del animal. Renderiza "Animal vendido/fallecido · Historia reproductiva finalizada" con la fecha de `ciclo.fecha_fin`.

Para ciclos NUEVOS (creados a partir del PRD-correctivo), "Paso a no reproductora" es un `EventoReal` (`CAMBIO_TIPO_PRODUCTIVO`) persisitido en `eventos` con `ciclo_id`. Aparece como `tipo: 'real'` y lo renderiza `EventoRow` con dot y label en rojo (`text-alert`).

La lógica de `buildEntradasOrdenadas()` (recibe `estadoVital` como segundo parámetro):

```typescript
// Cierre por salida: fecha_fin existe pero resultado es NULL (señal intencional)
if (ciclo.fecha_fin && !ciclo.resultado && estadoVital !== 'vivo') {
  entradas.push({ tipo: 'salida', fecha: ciclo.fecha_fin, motivo: estadoVital })
} else {
  // Compatibilidad ciclos antiguos: cierre_manual sin evento real vinculado
  const tieneEventoCambioTipo = ciclo.eventos.some(e => e.codigo === 'CAMBIO_TIPO_PRODUCTIVO')
  if (ciclo.resultado === 'cierre_manual' && ciclo.fecha_fin && !tieneEventoCambioTipo) {
    entradas.push({ tipo: 'cierre_manual', fecha: ciclo.fecha_fin })
  }
}
```

#### Anotación "Animal vendido/fallecido" — entrada en la timeline

Cuando un animal es vendido o muere, `registrar_salida_animal` cierra el ciclo reproductivo propio con **solo `fecha_fin`** — el campo `resultado` queda `NULL` intencionalmente. Esta combinación (`fecha_fin IS NOT NULL AND resultado IS NULL`) es la señal que distingue el cierre por salida de cualquier cierre reproductivo (que siempre tiene resultado: `'parto' | 'aborto' | 'machorra' | 'cierre_manual'`).

`buildEntradasOrdenadas` detecta esta señal e inyecta una entrada `tipo: 'salida'` en el timeline del ciclo, igual que "Paso a no reproductora":

```
● Animal vendido · Historia reproductiva finalizada    23/08/2026
```

El badge de resultado (`ResultadoBadge`) se oculta para estos ciclos — no hay resultado reproductivo que mostrar.

Solo se aplica a animales reproductores (el carrusel únicamente aparece para ellos).

#### Resumen del patrón

| Superficie | Tipo de entrada | ¿Persiste? | Mecanismo de distinción |
|---|---|---|---|
| Log historial | `EventoReal` | Sí (`eventos`) | `virtual: false` |
| Log historial | `EventoVirtual` (`NUEVO_CICLO`) | No | `virtual: true`, id sintético |
| Carrusel | `EventoHistorial` real | Sí (`eventos`) | `EntradaCiclo.tipo === 'real'` |
| Carrusel | Entrada `cierre_manual` (ciclos antiguos) | No | `EntradaCiclo.tipo === 'cierre_manual'` |
| Carrusel | Entrada `salida` (venta/muerte) | No | `EntradaCiclo.tipo === 'salida'`; señal: `fecha_fin && !resultado && estadoVital !== 'vivo'` |

---

#### Por qué las entradas virtuales no deben persistirse

La pregunta natural es: si ya diferenciamos eventos reales de virtuales, ¿no sería más simple persistirlos todos y consultarlos uniformemente?

No. El criterio de persistencia no es la uniformidad de consulta — es la naturaleza del dato.

**El test que decide:**

> ¿Ocurrió algo que alguien hizo explícitamente?

- Sí → evento real → persiste en `eventos`.
- No, es una consecuencia derivada de otros hechos ya persistidos → no persiste. Vive en la query layer o en el render.

`NUEVO_CICLO` no lo originó ninguna acción del usuario. Lo originan el parto, el aborto, el último destete. Esos sí están persistidos. El inicio de un ciclo es estado derivado que ya existe en `ciclo_reproductivo.fecha_inicio`. Persistir adicionalmente un evento `NUEVO_CICLO` duplicaría la misma verdad en dos sitios.

**El riesgo concreto de persistir estado derivado:**

Dos fuentes del mismo dato divergen con el tiempo. Si una migración corrige la `fecha_inicio` de un ciclo, ¿qué actualiza el evento `NUEVO_CICLO` persistido? Si el RPC lo olvida, hay inconsistencia silenciosa e indetectable sin auditoría manual. Este tipo de duplicidad es exactamente lo que los dashboards futuros tendrían que filtrar activamente para no contaminar resultados.

**La lección del caso `cierre_manual`:**

La entrada sintética de compatibilidad hacia atrás existe precisamente porque en su día no se persistió `CAMBIO_TIPO_PRODUCTIVO` cuando se debía. La acción "el usuario cambió el tipo productivo" era un hecho real y no se capturó como evento. El resultado fue deuda técnica y lógica de retrocompatibilidad.

La lección no es "persistamos los virtuales". La lección es: **si hay una acción real del usuario, crea un evento real desde el principio**. Los virtuales son correctos únicamente cuando representan estado derivado.

**Regla para este proyecto:**

| Qué es | ¿Persiste? |
|---|---|
| Acción explícita del usuario | Sí, en `eventos` con tipo real |
| Consecuencia derivada de hechos ya persistidos | No — query layer o render layer |
| Ayuda visual sin semántica de dominio | No — nunca en la DB |

---

### 7. `getCicloAbierto` — robustez ante múltiples ciclos abiertos

`getCicloAbierto()` en `repository.ts` usa `ORDER BY numero_ciclo DESC LIMIT 1` en lugar de `.single()`.

Razón: pueden coexistir múltiples ciclos sin `fecha_fin` (p.ej. un ciclo gestante que no se cerró por un cambio de tipo histórico + un nuevo ciclo vacía). `.maybeSingle()` sin orden lanzaba PGRST116 en ese escenario. La solución siempre opera sobre el ciclo más reciente.

Los tres flujos de acción (cubrición, confirmación de gestación, parto) llaman a `getCicloAbierto` y se benefician de esta corrección.

---

### 8. `FormCubricion` — macho obligatorio en cubrición natural

En cubrición natural, el campo macho pasa a ser obligatorio.

- "Desconocido" como primera opción del selector (sentinel `__desconocido__` → `undefined` al enviar al servidor).
- Validación con `superRefine`: error si `tipo_cubricion === 'natural'` y no hay `macho_id`.
- Label cambiado de `(opcional)` a `*`.

---

### 9. `FormConfirmacionGestacion` — padre obligatorio sin cubrición previa

Cuando el animal está en estado `vacía` (sin cubrición previa registrada), el campo padre pasa a ser obligatorio.

- "Desconocido" como primera opción del selector (mismo patrón que cubrición).
- Campo siempre visible cuando `sinCubricionPrevia`, sin dependencia de `machos.length`.
- Validación en `onSubmit` antes de `setIsSubmitting` (evita botón bloqueado en error de validación).
- El RPC y `getPadreIdFromCiclo` ya gestionaban `padre_id` desde PRD008.

---

---

### 10. Salida de animal — venta y muerte

Implementado en agosto 2026. RPC `registrar_salida_animal` (última versión en `20260823153813_salida_sin_resultado_destete_implicito.sql`).

#### Consecuencias del RPC (atómicas)

1. Crea evento `SALIDA` real en `eventos` con `motivo_id = 'venta'/'muerte'`.
2. Actualiza `animal`: `estado_vital = 'vendido'/'muerto'`, `estado_reproductivo = NULL`, `fecha_prevista_parto = NULL`.
3. Si el animal era **una cría con vínculo activo** (`estado_vinculo_materno = 'activo'`): finaliza el vínculo y evalúa si la madre puede cerrar su ciclo (si no quedan más crías activas).
4. Si el animal tiene **crías propias con vínculo activo** (era la madre): crea un evento `DESTETE` implícito por cada cría con `metadata_json = {"cierre_por_salida": "venta"/"muerte"}`. El `ciclo_id` del DESTETE se resuelve desde `cria.parto_evento_id → eventos.ciclo_id` para que el evento aparezca en el slide correcto del carrusel. La cría pasa a `Recría` si aún estaba en etapa `Cría`.
5. Cierra el ciclo reproductivo propio si existe: solo `fecha_fin = p_fecha`, **resultado queda `NULL`**.

#### Señal `resultado = NULL` en ciclo cerrado

La combinación `fecha_fin IS NOT NULL AND resultado IS NULL` es la convención que distingue los ciclos cerrados por salida de los cerrados por evento reproductivo. Los cierres reproductivos siempre tienen resultado: `'parto' | 'aborto' | 'machorra' | 'cierre_manual'`. El carousel la usa para inyectar la entrada "Animal vendido/fallecido" en el timeline (ver sección 6).

#### Destete implícito — anotación en historial de la cría

El evento `DESTETE` creado por el RPC aparece en el historial de la cría con el campo `metadata_json.cierre_por_salida`. `EventosList` lo renderiza como:

```
Reproductivo   23/08/2026   C3   Destete (venta madre)
```

La anotación solo aparece cuando `evento.rol !== 'madre'` (desde la ficha de la cría, no desde la de la madre). Desde la madre el evento muestra las crías afectadas mediante `criasLabel`, sin nota de causa (sería redundante).

#### Regla de integridad: `getMachosDisponibles` y animales vendidos/muertos

`getMachosDisponibles` filtra `.eq('estado_vital', 'vivo')`: los machos vendidos o muertos no aparecen como opciones en cubrición natural ni confirmación de gestación.

---

### Documentación permanente prevista

Cuando el modelo reproductivo esté consolidado, trasladar principalmente a:

- `documentacion/modelo/modelo_reproductivo.md` — regla de bloqueo en gestante, ciclos coexistentes, `cambiar_tipo_productivo`, señal resultado=NULL para salida
- `documentacion/flujos/reproductivo/cambio_tipo_productivo.md` — flujo completo con matriz de estados
- `documentacion/flujos/reproductivo/salida_animal.md` — consecuencias reproductivas de venta/muerte, destete implícito
- `documentacion/arquitectura/` — patrón de compatibilidad hacia atrás en eventos del carrusel, `EntradaCiclo` union type

---

## PRD013 — Consolidación del dominio reproductivo

> Implementado en septiembre 2026. Pendiente de incorporar a documentación permanente.

### 1. Corrección de arquitectura: `page.tsx` no puede importar de `infrastructure/`

`page.tsx` importaba directamente `getCicloAbierto` y `getLastEventoFechaForCiclo` desde `reproductivo/infrastructure/repository`. Esto viola el contrato UI → Query → Repository.

**Solución:** nueva query de application layer `getCicloAbiertoParaFicha(animalId)` en `reproductivo/application/queries/getCicloAbiertoParaFicha.ts`.

Esta query combina en una sola round-trip (join interno Supabase) la lectura del ciclo abierto y la fecha del último evento:

```typescript
export interface CicloAbiertoParaFicha {
  id: UUID
  numero_ciclo: number
  fecha_inicio: ISODate
  fechaUltimoEvento: ISODate  // fallback a fecha_inicio si el ciclo no tiene eventos aún
}
```

**Beneficio adicional:** elimina la consulta serial que existía en `page.tsx` (primero getCicloAbierto, luego getLastEventoFechaForCiclo). Ambas se resuelven en paralelo con el resto del `Promise.all`.

**Regla de arquitectura reforzada:** la capa `animales` (application) no debe importar de `reproductivo` (infrastructure). Si necesita datos reproductivos, debe usar una query propia en `reproductivo/application/queries/`.

### 2. Inmutabilidad de `resultado` en RPCs reproductivos

Los RPCs `registrar_parto`, `registrar_aborto` y `registrar_machorra` añaden un guard `AND resultado IS NULL` en la cláusula UPDATE del ciclo (y en el SELECT FOR UPDATE previo). Si el ciclo ya tiene un resultado fijado, el UPDATE devuelve 0 filas y se lanza `RAISE EXCEPTION 'El ciclo % ya tiene resultado fijado'`.

**Razón:** el `resultado` de un ciclo es un hecho histórico inmutable. Una vez que un ciclo tiene parto, aborto o machorra, no puede sobrescribirse aunque el ciclo siga con `fecha_fin IS NULL`. Esto protege contra doble ejecución y condiciones de carrera.

Complementariamente, `registrar_destete` usa `AND resultado IS NOT NULL` para el cierre de ciclo: solo cierra ciclos que ya tienen un resultado reproductivo fijado por `registrar_parto`. Evita cerrar accidentalmente ciclos en curso.

### 3. Eliminación de alias de compatibilidad `EventoDeAnimal`

El alias `export type EventoDeAnimal = EventoEnHistorial` fue eliminado de `listarEventosDeAnimal.ts`. El tipo canónico es `EventoEnHistorial`. Cualquier referencia futura a eventos del historial debe usar `EventoEnHistorial`.

### 4. Decisión: ReproductiveEngine CANCELADO

Ver sección "ReproductiveEngine — CANCELADO POR AHORA" en PRD009 (decisiones arquitectónicas).

### Documentación permanente prevista

- `documentacion/arquitectura/` — regla de no-importación cross-domain, patrón getCicloAbiertoParaFicha
- `documentacion/modelo/modelo_reproductivo.md` — inmutabilidad de resultado en ciclos, guards AND resultado IS NULL / IS NOT NULL

---

## PRD013-fix — Destete múltiple atómico

> Implementado en septiembre 2026. Pendiente de incorporar a documentación permanente.

### Problema resuelto

El flujo anterior llamaba a `registrar_destete` una vez por cría desde el cliente (for loop en `FormDestete.tsx`). Si fallaba la N-ésima cría, las anteriores ya estaban committed y el sistema quedaba en estado parcial inconsistente.

### Solución: `registrar_destete_lote`

Nuevo RPC `registrar_destete_lote(p_cria_ids UUID[], p_fecha DATE, p_observaciones TEXT)` que procesa el destete de múltiples crías en una **única transacción Postgres**. Si cualquier cría no es elegible, `RAISE EXCEPTION` y Postgres hace rollback automático de toda la operación.

### Invariante crítico de dominio: ciclo_id histórico

El `ciclo_id` de cada evento DESTETE es el **histórico de la cría** — obtenido via `cria.parto_evento_id → eventos.ciclo_id` — y **nunca** el ciclo reproductivo abierto actual de la madre, aunque éste exista en paralelo.

Esto significa que el destete NO pertenece al ciclo reproductivo activo de la madre. Pertenece al ciclo del parto que originó a cada cría. Ambos ciclos pueden coexistir con `fecha_fin IS NULL` simultáneamente: es correcto y esperado.

### Cierre de ciclo al final del lote

La evaluación de cierre de ciclo (¿quedan vínculos activos?) se hace **después de procesar todas las crías** del lote, no tras cada una individualmente. Esto garantiza que si se destetan 2 crías del mismo ciclo, la cuenta de activos sea correcta antes de decidir si cerrar.

Solo cierra ciclos con `AND resultado IS NOT NULL AND fecha_fin IS NULL`: el ciclo de parto debe tener ya su resultado fijado por `registrar_parto` antes de que el destete pueda cerrarlo.

### Arquitectura resultante

| Capa | Antes | Después |
|---|---|---|
| `FormDestete.tsx` | `for` loop, N llamadas al Server Action | Una sola llamada con array de IDs |
| `registrarDesteteLote` (action) | — | Pre-valida cada cría en TS, una sola llamada `supabase.rpc` |
| `registrar_destete_lote` (RPC) | — | FOREACH interno, transacción única |

### Documentación permanente prevista

- `documentacion/flujos/reproductivos/destete.md` — añadir sección de destete en lote, invariante del ciclo_id histórico, cierre al final del lote