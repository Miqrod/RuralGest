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
* cambia el estado reproductivo de la madre a `LACTANTE`;
* NO finaliza el ciclo reproductivo;
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

#### ReproductiveEngine

Se mantiene el patrón actual:

Context → Rules → Projection

La incorporación de un futuro `ReproductiveEngine` queda expresamente pospuesta hasta que la complejidad del dominio justifique centralizar las reglas reproductivas compartidas.

Se evita introducir una abstracción prematura.

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

## Plan de testing de integración — pendiente de implementar

> Anotado en PRD010 (2026-08-12). Implementar al inicio del siguiente PRD.

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