# PRD012 --- Consolidación del flujo reproductivo y registro de Machorra

## 1. Propósito

PRD012 completa la última pieza funcional pendiente del flujo
reproductivo principal: el registro de una hembra como `MACHORRA`.

El PRD no redefine el modelo reproductivo consolidado en PRD-CORRECTIVO
y PRD011. Su función es llevar a implementación las decisiones que
todavía faltan y corregir algunas inconsistencias técnicas detectadas
durante la auditoría del dominio.

El objetivo es dejar los desenlaces reproductivos principales en un
nivel homogéneo de coherencia, atomicidad, validación y trazabilidad
antes de abordar el siguiente paso del dominio: `ReproductiveEngine`.

La lógica final que se quiere alcanzar es:

```text
                    CICLO REPRODUCTIVO
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
           VACÍA        CUBIERTA      GESTANTE
             │             │           │     │
             │             │           │     │
             └──────┐ ┌────┘         PARTO  ABORTO
                    │ │                │      │
                    ▼ ▼                └──┬───┘
                 MACHORRA                 │
                    │                     │
                    └──────────┬──────────┘
                               │
                               ▼
                    desenlace de la
                  oportunidad reproductiva
                               │
                               ▼
                    ¿sigue siendo
                     reproductora?
                         │      │
                        SÍ      NO
                         │       │
                         ▼       ▼
                    nuevo ciclo  sin nuevo
                       VACÍA       ciclo
```

`VACÍA`, `CUBIERTA` y `GESTANTE` son situaciones posibles dentro del
ciclo. La cubrición no es un requisito para que exista el ciclo:
una hembra puede iniciar un ciclo como `VACÍA` al convertirse en
reproductora.

El cierre manual por cambio de tipo productivo, así como Venta/Muerte,
continúan siendo casuísticas diferenciadas y no forman parte del
conjunto de desenlaces reproductivos que PRD012 pretende unificar.

## 2. Contexto

El proyecto representa conocimiento operativo de la explotación, no una
simulación biológica.

Se mantienen como principios de diseño:

-   Event First.
-   Los eventos son la fuente de verdad.
-   Los estados son proyecciones derivadas.
-   Context → Rules → Projection.
-   La interfaz trabaja con acciones de negocio.
-   El dominio trabaja con eventos.
-   La lógica de negocio debe permanecer centralizada.
-   El frontend no puede ser la única barrera de integridad.
-   Las operaciones de dominio deben ser atómicas cuando producen varias
    consecuencias inseparables.
-   User First.

PRD012 debe respetar el modelo consolidado tras la redefinición del
ciclo reproductivo.

## 3. Modelo reproductivo vigente

### 3.1 Qué es un ciclo reproductivo

Un ciclo reproductivo es la unidad de historial que agrupa los hechos
correspondientes a una oportunidad reproductiva de una hembra, desde su
inicio hasta su desenlace.

Los principales desenlaces reproductivos son:

-   `PARTO`
-   `ABORTO`
-   `MACHORRA`

Existe además `CIERRE_MANUAL` para determinados cierres derivados del
cambio de uso productivo, pero no debe confundirse con un desenlace
reproductivo ordinario.

Si la hembra continúa siendo reproductora después de un desenlace que
termina una oportunidad reproductiva, se crea inmediatamente un nuevo
ciclo en estado `VACÍA`.

### 3.2 Lactación y vínculos madre-cría

`LACTANTE` no es un estado del ciclo reproductivo.

La lactación y los vínculos madre-cría forman una historia paralela que
puede coexistir con ciclos reproductivos posteriores.

Por tanto, una hembra puede encontrarse simultáneamente en una situación
equivalente a:

``` text
ciclo actual → VACÍA / CUBIERTA / GESTANTE
+
vínculos madre-cría activos
```

PRD012 no debe modificar esta separación.

### 3.3 `ciclo_id` es histórico

`ciclo_id` no significa "ciclo actual".

Identifica la historia reproductiva a la que pertenece un evento.

Esto permite que:

``` text
C2 → PARTO
C3 → CUBRICIÓN
C2 → DESTETE
```

sea una secuencia válida.

Los eventos posteriores pueden seguir perteneciendo a un ciclo histórico
anterior cuando ese hecho forme parte de dicha historia.

## 4. Alcance

El animal tiene un único ciclo reproductivo actual. Los ciclos
anteriores pueden conservar eventos pendientes aunque ya exista un ciclo
posterior. Esto no convierte la coexistencia histórica de registros de
ciclo sin `fecha_fin` en una nueva regla de dominio ni en un mecanismo
para mantener varias oportunidades reproductivas actuales.

### 4.1 Incluido

PRD012 incluye:

1.  Implementación completa de `MACHORRA`.
2.  Acción individual de "Marcar como machorra" desde el carrusel del
    ciclo.
3.  Confirmación mediante modal, sin formulario adicional.
4.  RPC transaccional para registrar Machorra.
5.  Use Case y reglas de elegibilidad.
6.  Creación atómica del nuevo ciclo cuando corresponda.
7.  Integración con historial y carrusel.
8.  Validación transaccional de Cubrición y Confirmación de Gestación.
9.  Revisión y refuerzo de la coherencia temporal de Cubrición,
    Confirmación y Parto.
10. Protección frente a doble ejecución y condiciones de carrera.
11. Auditoría de la asociación histórica de eventos mediante `ciclo_id`.
12. Verificación de los casos de Destete sobre ciclos históricos.
13. Tests de integración y casos "Mister Bean".

### 4.2 Fuera de alcance

Quedan expresamente fuera:

-   `ReproductiveEngine`.
-   Temporada reproductiva.
-   Entrada/salida de sementales.
-   Ubicaciones y movimientos de animales.
-   Eventos de manejo de explotación.
-   Widget de candidatas a Machorra.
-   Drawer de gestión masiva de Machorras.
-   Gestión masiva de animales.
-   Sistema general de corrección o reversión de eventos.
-   Automatización por cron.
-   Reglas de plausibilidad biológica rígidas.
-   Reestructuración completa del procesamiento del Destete.
-   Transacción única para destete de varias crías.

La futura gestión colectiva de Machorras se diseñará cuando exista el
dominio de ubicaciones y manejo de explotación que permita determinar de
forma fiable el contexto en el que una hembra debe ser revisada.

## 5. Registro de Machorra

### 5.1 Significado

Marcar una hembra como `MACHORRA` significa registrar que la oportunidad
reproductiva representada por su ciclo actual ha terminado sin una
gestación que haya culminado en un resultado reproductivo satisfactorio.

No significa:

-   diagnosticar esterilidad;
-   declarar que la hembra no puede reproducirse en el futuro;
-   cambiar su tipo productivo;
-   modificar sus vínculos madre-cría;
-   crear una causa sanitaria;
-   inferir una enfermedad.

Machorra es un desenlace aplicable a una hembra que continúa siendo
reproductora. No cambia por sí mismo el tipo productivo del animal.

Por ejemplo:

``` text
C2
VACÍA
  ↓
MACHORRA
  ↓
C2 finaliza
  ↓
C3
VACÍA
```

### 5.2 Elegibilidad

Machorra solo puede registrarse sobre una hembra que:

- sea `REPRODUCTORA`;
- esté viva;
- permanezca en la explotación;
- tenga un ciclo actual;
- se encuentre en estado `VACÍA` o `CUBIERTA`.

No puede registrarse desde:

```text
GESTANTE
```

ni utilizarse como mecanismo alternativo de cierre cuando el animal ya
no es reproductor. En ese caso corresponde el flujo de `CIERRE_MANUAL`
derivado del cambio de tipo productivo.

Una gestación debe finalizar mediante:

-   Parto.
-   Aborto.

No se debe permitir que el sistema utilice Machorra como atajo para
finalizar una gestación existente.

La regla debe comprobarse en backend y dentro de la operación
transaccional, no únicamente mediante la visibilidad del botón en la
interfaz.

## 6. UX de Machorra

### 6.1 Ubicación de la acción

La acción individual se ofrecerá de forma contextual desde el carrusel
del ciclo actual.

No se incorpora inicialmente como una acción genérica de
`SeccionAcciones`.

El usuario debe encontrarla dentro de la historia que está a punto de
finalizar.

Conceptualmente:

``` text
CICLO ACTUAL
────────────────────────

C2 · Vacía

[historia del ciclo]

────────────────────────

[Marcar como machorra]
```

La futura aparición condicionada por una temporada reproductiva queda
fuera de PRD012.

Durante esta fase de desarrollo y testing, la acción podrá estar
disponible para cualquier animal elegible en estado `VACÍA` o
`CUBIERTA`.

### 6.2 Integración con AvailableActions

Machorra es una acción de negocio y su elegibilidad debe quedar integrada en el mecanismo de reglas de acciones existente cuando dicho mecanismo sea utilizado por la arquitectura actual.

Esto no implica que Machorra deba aparecer en `SeccionAcciones`.

La presentación es contextual y pertenece al carrusel, pero la elegibilidad no debe duplicarse como una regla independiente en el componente visual.

La regla de backend/RPC sigue siendo la autoridad final.

### 6.3 No existe formulario

La acción no requiere datos adicionales.

La fecha será la fecha del día en que se ejecuta la operación.

No se solicitarán:

-   fecha manual;
-   observaciones;
-   motivo;
-   diagnóstico;
-   tipo de infertilidad;
-   edad fetal;
-   información veterinaria.

El flujo será:

``` text
Marcar como machorra
        ↓
modal de confirmación
        ↓
confirmar
        ↓
registrar Machorra
```

### 6.4 Modal de confirmación

El modal debe permitir tomar una decisión rápida y consciente.

Ejemplo:

### ¿Marcar como machorra?

Se marcará a **Pastora** como machorra con fecha **24/08/2026**.

El ciclo reproductivo actual quedará finalizado. Si continúa siendo
reproductora, se iniciará un nuevo ciclo en estado **Vacía**.

\[Cancelar\] \[Marcar como machorra\]

El texto definitivo podrá ajustarse durante implementación, pero debe
mantener:

-   lenguaje comprensible;
-   explicación breve;
-   consecuencias claras;
-   ausencia de jerga técnica innecesaria.

## 7. Efectos de registrar Machorra

La operación debe ser atómica.

Cuando se registra Machorra:

``` text
1. validar elegibilidad
2. bloquear el contexto necesario
3. crear evento MACHORRA
4. finalizar el ciclo actual
5. si es_reproductora = true:
       crear nuevo ciclo
       estado = VACÍA
6. proyectar el estado reproductivo resultante
7. actualizar las demás proyecciones necesarias
8. commit
```

No debe existir un estado intermedio persistente en el que:

-   el ciclo aparezca como Machorra pero falte el nuevo ciclo cuando
    debería existir;
-   exista un nuevo ciclo sin el desenlace que lo originó;
-   el evento exista pero el estado proyectado no sea coherente.

## 8. Efecto sobre los vínculos madre-cría

Machorra no modifica los vínculos madre-cría.

Puede producirse:

``` text
C2 → MACHORRA
+
cría de C2 todavía dependiente
```

La historia reproductiva y la maternidad continúan siendo
independientes.

Los vínculos solo se modificarán mediante los hechos que correspondan a
la historia de cada cría:

-   Destete.
-   Venta.
-   Muerte.
-   Otros hechos futuros que puedan finalizar el vínculo.

## 9. Historial y carrusel

### 9.1 Evento real

El dominio registra únicamente:

``` text
MACHORRA
```

No se crea:

``` text
CIERRE_CICLO
```

ni:

``` text
INICIO_CICLO
```

como eventos de dominio.

### 9.2 Nuevo ciclo

La creación del nuevo ciclo es una consecuencia de la operación, no un
evento histórico independiente.

El carrusel podrá mostrar el nuevo ciclo mediante su propia proyección.

Si el sistema muestra un hito virtual de creación de ciclo en el
historial general, este debe permanecer virtual y no persistirse como
evento de dominio. El mismo criterio se aplica a los hitos virtuales de
cambio de ciclo derivados de Parto, Aborto o Machorra.

### 9.3 Numeración de ciclos

Las etiquetas `C1`, `C2`, `C3`, etc. son información de presentación
derivada del número real de ciclo.

No deben convertirse en identificadores de negocio.

## 10. Robustez transaccional

La auditoría previa a PRD012 ha identificado una diferencia de robustez
entre los RPC existentes.

`registrar_aborto` constituye actualmente el patrón de referencia
porque:

-   bloquea el animal;
-   revalida el estado dentro de la transacción;
-   valida el ciclo;
-   comprueba la coherencia temporal;
-   ejecuta las consecuencias de forma atómica.

PRD012 debe llevar a este nivel las operaciones que todavía dependan de
validaciones pre-transaccionales.

### 10.1 Cubrición

`registrar_cubricion` debe volver a validar dentro de la transacción que
el animal continúa siendo elegible.

No debe confiarse exclusivamente en la validación previa del Use Case.

El `FOR UPDATE` debe utilizarse para serializar correctamente las
operaciones concurrentes sobre el animal/contexto afectado.

### 10.2 Confirmación de gestación

`registrar_confirmacion_gestacion` debe aplicar la misma protección.

El estado debe volver a comprobarse dentro de la transacción antes de
crear el evento.

Esto evita situaciones TOCTOU:

``` text
Request A                  Request B

lee CUBIERTA
                           lee CUBIERTA

                           registra confirmación

registra confirmación
```

El segundo intento debe ser rechazado cuando ya no sea elegible.

### 10.3 Parto

El registro de Parto debe mantener una operación atómica que incluya:

-   evento Parto;
-   finalización de la oportunidad reproductiva anterior;
-   creación del nuevo ciclo;
-   creación de las crías;
-   creación de los vínculos madre-cría;
-   demás consecuencias ya definidas por PRD009.

La creación del nuevo ciclo no impide que posteriormente puedan
registrarse en el ciclo anterior los hechos que todavía pertenezcan a
esa historia, especialmente los Destetes pendientes. La creación del
nuevo ciclo tampoco implica por sí sola que `fecha_fin` del ciclo
anterior deba quedar informada en ese mismo momento.

PRD012 debe revisar específicamente que la operación mantiene esta
atomicidad y que la validación temporal se ejecuta dentro de la
transacción.

## 11. Doble ejecución

PRD012 debe proteger las acciones frente a ejecuciones duplicadas.

Caso prioritario:

``` text
usuario pulsa dos veces
        ↓
dos requests
        ↓
una misma acción
```

Debe existir protección en dos niveles.

### Frontend

Los botones primarios deben deshabilitarse mientras la operación está en
curso.

Especialmente en flujos de:

-   Parto.
-   Aborto.
-   Machorra.
-   Destete.

El modal de confirmación también debe impedir múltiples confirmaciones
simultáneas.

### Backend

La protección real debe residir en la transacción.

Una segunda llamada debe encontrar el nuevo estado y ser rechazada si la
acción ya no es elegible.

No se debe considerar suficiente la protección visual del botón.

## 12. Otros casos "Mister Bean"

Los tests de PRD012 deben cubrir también situaciones previsibles de uso
incorrecto o inesperado.

Como mínimo:

  -----------------------------------------------------------------------
  Caso                                Comportamiento esperado
  ----------------------------------- -----------------------------------
  Doble click                         Un solo efecto válido

  Dos requests concurrentes           Solo una operación válida

  Acción repetida después de          Rechazo
  completarse                         

  Formulario abierto y estado         Revalidación y rechazo si deja de
  cambiado antes de confirmar         ser elegible

  Dos acciones incompatibles          Solo una puede modificar el
  concurrentes                        contexto de forma válida

  Operación masiva futura con animal  El RPC individual debe rechazarlo
  ya no elegible                      

  Fecha modificada manualmente fuera  Backend debe rechazarla
  de las reglas                       
  -----------------------------------------------------------------------

La lista podrá ampliarse durante implementación.

## 13. Coherencia temporal

### 13.1 Principio

La fecha del evento representa cuándo ocurrió realmente el hecho, no
cuándo se registró en la aplicación.

Por tanto, es válido registrar hoy una cubrición ocurrida hace dos días.

Para los eventos con fecha editable:

- se permiten fechas pasadas;
- se permite la fecha de hoy;
- no se permiten fechas futuras.

Machorra es la excepción de UX: su fecha se genera automáticamente al
confirmar la acción y no es editable.

### 13.2 Fechas futuras

Los eventos reproductivos con fecha editable no pueden registrarse con
una fecha posterior al día en que se ejecuta el registro.

Esto se comprueba en backend. El datepicker debe reflejar la misma
restricción para guiar al usuario.

### 13.3 Orden histórico

Dentro de un mismo `ciclo_id` debe mantenerse la secuencia temporal de
los eventos.

La regla básica es:

> La fecha de un nuevo evento no puede ser anterior a la fecha del
> último evento registrado en el mismo `ciclo_id`.

Ejemplo válido:

``` text
C2
Cubrición       20/08
Confirmación    25/08
Parto           10/09
```

Ejemplo inválido:

``` text
C2
Cubrición       20/08
Confirmación    25/08
Parto           22/08
```

### 13.4 Frontend y backend

El frontend debe ayudar al usuario:

``` text
datePicker.minDate = último evento del ciclo
```

pero esta no es una garantía suficiente.

El backend debe volver a comprobar la regla dentro de la operación
transaccional.

La razón es que el estado puede cambiar entre:

``` text
abrir formulario
```

y:

``` text
confirmar operación
```

### 13.5 Ciclos históricos

La fecha mínima debe calcularse respecto al `ciclo_id` al que pertenece
el nuevo evento.

No debe utilizarse simplemente:

``` text
last_ciclo_id
```

ni el último evento global del animal.

Ejemplo:

``` text
C2 → Parto       01/04
C3 → Cubrición   20/05
C2 → Destete     01/09
```

El Destete debe validarse respecto a la historia de `C2`, no respecto a
`C3`.

### 13.6 Plausibilidad biológica

PRD012 no debe convertir el sistema en una simulación biológica.

No se introducirán ventanas rígidas del tipo:

``` text
Parto = Cubrición + X días
```

como requisito obligatorio.

La validación de orden histórico es una regla de integridad.

La plausibilidad biológica es un problema diferente y podrá abordarse
posteriormente mediante advertencias o reglas específicas cuando exista
conocimiento ganadero suficiente.

## 14. Asociación de eventos con `ciclo_id`

La asociación histórica de eventos ya está resuelta conceptualmente y
debe preservarse.

PRD012 debe realizar una verificación de la implementación y de datos
representativos para confirmar que los eventos se asignan al ciclo
histórico que les corresponde.

La verificación no implica una migración general de datos históricos.
Si se detecta una asociación incorrecta, deberá determinarse su causa y
corregirse únicamente cuando sea un defecto introducido o afectado por
el alcance de esta fase.

Especial atención a:

-   Cubrición.
-   Confirmación de gestación.
-   Parto.
-   Aborto.
-   Machorra.
-   Destete.
-   Muerte de crías.
-   Venta de crías.
-   Otros eventos reproductivos existentes.

La regla es:

``` text
evento
   ↓
historia reproductiva a la que pertenece
   ↓
ciclo_id correspondiente
```

No:

``` text
evento
   ↓
last_ciclo_id
```

## 15. Destete

El Destete se considera funcionalmente implementado.

PRD012 no debe rediseñarlo.

Debe comprobarse únicamente que:

1.  el evento mantiene el `ciclo_id` histórico correcto;
2.  el vínculo madre-cría se cierra correctamente;
3.  el Destete natural sigue funcionando;
4.  la finalización del vínculo por venta o muerte de la madre sigue
    representándose como `DESTETE`;
5.  la finalización del vínculo por venta o muerte de la cría sigue
    representándose como `DESTETE`;
6.  la presentación puede enriquecer el evento con el contexto
    correspondiente, por ejemplo:
    -   `Destete (muerte cría)`
    -   `Destete (venta cría)`
    -   `Destete (venta madre)`
    -   `Destete (muerte madre)`
7.  no se crea un nuevo tipo de evento para cada causa.

## 16. Atomicidad del Destete múltiple

Actualmente puede existir una operación de Destete que procesa varias
crías mediante llamadas independientes.

Por ejemplo:

``` text
Cría A → éxito
Cría B → éxito
Cría C → error
```

puede dejar un resultado parcial.

Esta limitación queda expresamente fuera de PRD012.

Se documentará como deuda técnica para PRD013, donde se revisará la
atomicidad de operaciones complejas dentro de la consolidación del
dominio y del futuro `ReproductiveEngine`.

## 17. Machorra y futuras temporadas reproductivas

PRD012 no implementará la temporada reproductiva.

La futura temporada se considera un concepto de manejo de la
explotación, no un estado del ciclo.

Del mismo modo, la futura entrada/salida de sementales será un hecho de
manejo asociado a una ubicación y no un evento reproductivo de la
hembra.

No deberán:

-   abrir ciclos;
-   cerrar ciclos;
-   cambiar estados reproductivos;
-   crear Machorras automáticamente;
-   aparecer en el historial reproductivo individual de las hembras.

En el futuro, estos hechos podrán utilizarse para realizar lecturas y
consultas sobre resultados reproductivos, pero no modificarán
directamente el dominio reproductivo.

## 18. Cambios de base de datos

PRD012 podrá requerir:

-   migración relacionada con la funcionalidad `MACHORRA`;
-   ajustes necesarios para soportar las validaciones transaccionales;
-   cualquier cambio estrictamente necesario para garantizar atomicidad
    e integridad.

No se deben introducir triggers como solución general cuando la regla
pueda mantenerse transparente dentro de los Use Cases y RPC
transaccionales.

No se deben añadir campos derivados únicamente para facilitar la
interfaz.

La persistencia debe representar hechos y relaciones necesarias, no
estados duplicados.

## 19. Arquitectura de implementación

La dirección arquitectónica continúa siendo:

``` text
Acción de negocio
       ↓
Use Case
       ↓
Context
       ↓
Rules
       ↓
RPC transaccional
       ↓
Evento
       ↓
Projection
       ↓
UI
```

Durante PRD012 no se creará todavía una abstracción
`ReproductiveEngine`.

Sin embargo, las implementaciones nuevas deben evitar introducir más
lógica específica que después sea difícil de consolidar.

Las reglas compartidas descubiertas durante PRD012 deberán quedar
identificadas para PRD013.

## 20. Tests

PRD012 debe incluir pruebas suficientes para demostrar que Machorra y
las correcciones de robustez funcionan realmente.

### 20.1 Machorra

Como mínimo:

-   Machorra desde `VACÍA`.
-   Machorra desde `CUBIERTA`.
-   Machorra desde `GESTANTE` → rechazo.
-   Machorra con `es_reproductora = true` → nuevo ciclo `VACÍA`.
-   Machorra con `es_reproductora = false` → rechazo.
-   Machorra con vínculos madre-cría activos → vínculos intactos.
-   Machorra produce un único evento.
-   Machorra produce un único cierre y, cuando corresponde, un único
    nuevo ciclo.

### 20.2 Concurrencia

-   doble ejecución;
-   dos requests simultáneos;
-   confirmación duplicada;
-   estado modificado entre lectura y ejecución.

### 20.3 Temporalidad

-   fecha igual al último evento → válida;
-   fecha posterior → válida;
-   fecha pasada pero posterior al último evento → válida;
-   fecha anterior al último evento del ciclo → rechazo;
-   fecha futura → rechazo;
-   ciclo histórico anterior correctamente utilizado.

### 20.4 Regresión

Verificar que los cambios no rompen:

-   Cubrición.
-   Confirmación.
-   Parto.
-   Aborto.
-   Destete.
-   Cambio de tipo productivo.
-   historial reproductivo.
-   carrusel.
-   `AvailableActions`.

## 21. Criterios de aceptación

PRD012 se considerará completado cuando:

### Machorra

-   [ ] pueda registrarse desde `VACÍA`;
-   [ ] pueda registrarse desde `CUBIERTA`;
-   [ ] no pueda registrarse desde `GESTANTE`;
-   [ ] se registre como evento real `MACHORRA`;
-   [ ] cierre correctamente el ciclo correspondiente;
-   [ ] cree un nuevo ciclo `VACÍA` cuando `es_reproductora = true`;
-   [ ] rechace la operación cuando `es_reproductora = false`;
-   [ ] sea una operación atómica;
-   [ ] no modifique vínculos madre-cría;
-   [ ] aparezca correctamente en historial y carrusel;
-   [ ] no cree `CIERRE_CICLO` ni `INICIO_CICLO` como eventos de
    dominio.

### Robustez

-   [ ] Cubrición revalide su elegibilidad dentro de la transacción;
-   [ ] Confirmación revalide su elegibilidad dentro de la transacción;
-   [ ] Parto mantenga sus consecuencias de forma atómica;
-   [ ] las acciones no puedan producir duplicados por doble ejecución;
-   [ ] los cambios de estado concurrentes sean detectados.

### Temporalidad

-   [ ] puedan registrarse hechos pasados reales;
-   [ ] no puedan introducirse fechas anteriores al último evento del
    mismo ciclo;
-   [ ] la regla se aplique en frontend y backend;
-   [ ] los eventos históricos utilicen su `ciclo_id` real.

### Destete

-   [ ] continúe asociado al ciclo histórico correcto;
-   [ ] mantenga correctamente los vínculos;
-   [ ] conserve el tipo de evento `DESTETE`;
-   [ ] se mantenga el enriquecimiento contextual de las causas ya
    implementado.

### Alcance

-   [ ] no se haya introducido todavía `ReproductiveEngine`;
-   [ ] no se haya introducido temporada reproductiva;
-   [ ] no se haya introducido widget/drawer masivo de Machorra;
-   [ ] no se haya introducido un sistema de corrección de eventos.

## 22. Resultado esperado de PRD012

Al finalizar PRD012, el dominio debe disponer de tres desenlaces
reproductivos principales implementados:

``` text
PARTO
ABORTO
MACHORRA
```

con un comportamiento coherente:

``` text
             desenlace reproductivo
                       │
                       ▼
                ciclo finalizado
                       │
             ¿sigue siendo reproductora?
                  /                           sí             no
                │               │
                ▼               ▼
        nuevo ciclo VACÍA    sin nuevo ciclo
```

y con garantías comunes de:

-   validación;
-   atomicidad;
-   coherencia temporal;
-   trazabilidad;
-   protección contra concurrencia;
-   separación entre hechos y proyecciones.

El siguiente paso será PRD013, dedicado a consolidar estas reglas
mediante `ReproductiveEngine`, integración y QA global del dominio
reproductivo.

PRD012 no debe intentar resolver por anticipado ese problema.
