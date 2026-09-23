# objetivos_fase12.md

# Objetivos Fase 12 --- Consolidación del flujo reproductivo y registro de Machorra

## 1. Propósito

La Fase 12 tiene como objetivo completar la última funcionalidad
pendiente del flujo reproductivo principal y dejar el dominio preparado
para su posterior consolidación mediante `ReproductiveEngine`.

El foco de esta fase es:

``` text
MACHORRA
+
robustez transaccional
+
coherencia temporal
+
trazabilidad histórica
+
tests
```

No se pretende ampliar el dominio reproductivo con nuevos conceptos de
manejo de explotación.

## 2. Resultado funcional esperado

Al finalizar la fase, una hembra podrá terminar su oportunidad
reproductiva mediante:

```text
PARTO
ABORTO
MACHORRA
```

y, cuando corresponda, si continúa siendo reproductora:

```text
desenlace
   ↓
nuevo ciclo
   ↓
VACÍA
```

Machorra solo podrá registrarse cuando:

```text
es_reproductora = true
AND
estado = VACÍA | CUBIERTA
```

y nunca desde:

```text
GESTANTE
```

ni sobre una hembra que ya no sea reproductora.

## 3. Objetivos funcionales

### OBJ-01 --- Registrar Machorra

Implementar la acción de negocio que permita marcar como machorra el
ciclo reproductivo actual.

La acción debe:

-   estar vinculada al ciclo reproductivo actual (identificado técnicamente por `last_ciclo_id`);
-   ser válida solo si la hembra es reproductora;
-   ser válida desde `VACÍA` y `CUBIERTA`;
-   rechazar `GESTANTE`;
-   registrar el evento `MACHORRA`;
-   finalizar la oportunidad reproductiva;
-   crear un nuevo ciclo `VACÍA`;
-   no modificar vínculos madre-cría.

### OBJ-02 --- UX contextual

La acción individual debe aparecer exclusivamente en el slide del
`last_ciclo_id`, debajo de los eventos existentes.

Solo será visible para animales vivos, presentes en la explotación,
reproductores y en estado `VACÍA` o `CUBIERTA`.

No se implementará inicialmente como acción genérica del panel principal
de acciones.

El usuario deberá:

``` text
ver la historia
   ↓
identificar que el ciclo puede finalizar
   ↓
Marcar como machorra
   ↓
confirmar
```

No habrá formulario adicional.

La fecha utilizada será la fecha del día en que se confirma la acción.
No habrá datepicker ni posibilidad de modificarla.

### OBJ-03 --- Confirmación User First

La acción debe utilizar un modal de confirmación breve y comprensible.

El usuario debe saber:

-   qué animal se va a marcar;
-   qué fecha se registrará;
-   que el ciclo actual terminará;
-   que, si continúa siendo reproductora, comenzará otro ciclo en
    `VACÍA`.

No se solicitarán datos que el sistema ya conoce o que no aportan valor
operativo.

## 4. Objetivos de dominio

### OBJ-04 --- Elegibilidad transaccional

La elegibilidad de Machorra debe comprobarse dentro de la operación
transaccional.

No debe confiarse únicamente en:

-   visibilidad del botón;
-   AvailableActions;
-   validaciones del formulario;
-   Use Case pre-transaccional.

La operación debe revalidar el estado real antes de persistir.

### OBJ-05 --- Atomicidad

Registrar Machorra debe ser una operación atómica.

El sistema debe garantizar que:

``` text
evento MACHORRA
+
finalización del ciclo
+
nuevo ciclo cuando corresponda
```

se ejecuten como una única operación lógica.

No puede quedar persistido un estado parcial.

### OBJ-06 --- Homogeneizar robustez

Aplicar a Cubrición y Confirmación de Gestación el mismo principio de
revalidación transaccional ya utilizado por Aborto.

Especialmente:

``` text
bloqueo
↓
revalidación
↓
reglas
↓
persistencia
```

Esto debe evitar condiciones TOCTOU.

### OBJ-07 --- Verificar y, si procede, corregir Parto

Verificar que `registrar_parto` cumple el contrato consolidado de
atomicidad y coherencia definido por PRD009 y PRD-Correctivo.

Debe comprobarse que las consecuencias inseparables del Parto se
resuelven de forma atómica:

-   evento Parto;
-   finalización de la oportunidad reproductiva anterior;
-   creación del nuevo ciclo;
-   creación de crías;
-   vínculos madre-cría;
-   proyecciones asociadas.

Si el comportamiento ya cumple el contrato, no debe refactorizarse por
el mero hecho de revisarlo.

Si se detecta una desviación real, corregirla dentro de PRD012 y dejar
documentada la corrección.

## 5. Objetivos temporales

### OBJ-08 --- Mantener la fecha real del hecho

Para Cubrición, Confirmación de Gestación y Parto, el sistema debe
permitir registrar hechos ocurridos en fechas pasadas.

Ejemplo:

```text
Cubrición real: 22/08
Registro:       24/08
```

Debe poder conservarse:

```text
fecha_evento = 22/08
```

No se debe obligar al usuario a utilizar la fecha de registro.

Machorra queda fuera de este objetivo porque su fecha se genera
automáticamente al confirmar la acción y no es editable.

### OBJ-09 --- Rechazar fechas futuras

Los eventos reproductivos con fecha editable no pueden registrarse con
una fecha posterior al día en que se ejecuta el registro.

Esta regla aplica a:

-   Cubrición;
-   Confirmación de Gestación;
-   Parto.

El datepicker debe reflejar esta restricción y el backend debe
garantizarla.

Machorra queda fuera porque su fecha se genera automáticamente en el
momento de ejecución.

### OBJ-10 --- Mantener el orden histórico

Para cada evento con fecha editable:

```text
fecha_nuevo_evento >=
fecha_último_evento_del_mismo_ciclo
```

La igualdad es válida.

La regla debe comprobarse:

-   en frontend, para guiar al usuario;
-   en backend, para garantizar integridad.

### OBJ-11 --- No introducir restricciones biológicas arbitrarias

No se implementarán ventanas rígidas de duración de gestación u otras
restricciones biológicas sin una definición de dominio específica.

La fase se limitará a garantizar:

``` text
coherencia histórica
```

No:

``` text
simulación biológica
```

## 6. Objetivos de trazabilidad histórica

### OBJ-12 --- Respetar `ciclo_id` histórico

Todos los eventos deben seguir asociándose al ciclo histórico al que
pertenecen.

No se debe utilizar `last_ciclo_id` como sustituto de la pertenencia
histórica.

Debe comprobarse especialmente:

-   Destete;
-   eventos sobre crías;
-   eventos registrados después de crear un nuevo ciclo;
-   cualquier operación que pueda afectar a un ciclo anterior.

### OBJ-13 --- Mantener la pureza del historial

No crear eventos artificiales:

```text
CIERRE_CICLO
INICIO_CICLO
```

El dominio seguirá registrando únicamente hechos reales.

Los cambios de ciclo derivados de esos hechos podrán representarse
mediante proyecciones o elementos virtuales de presentación cuando
corresponda.

## 7. Objetivos de robustez

### OBJ-14 --- Evitar doble ejecución

Proteger los flujos de:

-   Parto;
-   Aborto;
-   Machorra;
-   Destete.

La protección debe existir tanto:

``` text
Frontend
```

como:

``` text
Backend / RPC
```

El frontend evita el doble submit.

El backend garantiza que una segunda operación no pueda producir un
segundo efecto válido.

### OBJ-15 --- Cubrir casos "Mister Bean"

Los tests deben contemplar situaciones reales de uso incorrecto o
inesperado.

Como mínimo:

-   doble click;
-   doble confirmación;
-   requests concurrentes;
-   estado cambiado mientras el formulario estaba abierto;
-   acción repetida;
-   acciones incompatibles ejecutadas simultáneamente;
-   fechas incoherentes enviadas directamente al backend.

## 8. Objetivos de Destete

### OBJ-16 --- Verificar la asociación histórica

El Destete se considera funcionalmente implementado antes de PRD012 y no
constituye trabajo funcional nuevo de esta fase.

La fase debe comprobar que:

-   mantiene su `ciclo_id` histórico;
-   finaliza correctamente el vínculo;
-   funciona para destete natural;
-   funciona cuando la madre muere o se vende;
-   funciona cuando la cría muere o se vende;
-   mantiene el evento como `DESTETE`.

Cuando corresponda, el historial podrá mostrar:

``` text
Destete (muerte cría)
Destete (venta cría)
Destete (muerte madre)
Destete (venta madre)
```

sin crear nuevos tipos de evento.

### OBJ-17 --- No resolver todavía el Destete multi-cría

La posible falta de atomicidad entre varios Destetes individuales queda
registrada como deuda técnica para PRD013.

No ampliar el alcance de Fase 12 para construir un RPC multi-cría salvo
que una contradicción real obligue a ello.

## 9. Objetivos de pruebas

### OBJ-18 --- Tests de Machorra

Cubrir como mínimo:

  Escenario                       Resultado
  ------------------------------- -------------------
  VACÍA → Machorra                Permitido
  CUBIERTA → Machorra             Permitido
  GESTANTE → Machorra             Rechazado
  Reproductora + Machorra         Nuevo ciclo VACÍA
  No reproductora → Machorra      Rechazado
  Machorra + vínculo madre-cría   Vínculo intacto
  Doble Machorra                  Solo una válida

### OBJ-19 --- Tests de temporalidad

Cubrir:

-   fecha igual al último evento;
-   fecha posterior;
-   fecha pasada pero válida;
-   fecha anterior al último evento del ciclo;
-   evento sobre ciclo histórico;
-   validación frontend;
-   validación backend.

### OBJ-20 --- Tests de concurrencia

Comprobar como mínimo:

``` text
dos requests simultáneas
```

para:

-   Machorra;
-   Confirmación;
-   Cubrición.

El resultado debe ser un único efecto válido.

### OBJ-21 --- Tests de regresión

Comprobar que la implementación no rompe:

-   Cubrición;
-   Confirmación de Gestación;
-   Parto;
-   Aborto;
-   Destete;
-   cambio de tipo productivo;
-   historial;
-   carrusel;
-   AvailableActions.

## 10. Objetivos técnicos

### OBJ-22 --- Mantener Context → Rules → Projection

No introducir lógica de negocio nueva en componentes de presentación.

La secuencia debe mantenerse:

``` text
Acción
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
```

### OBJ-23 --- No crear ReproductiveEngine todavía

PRD012 debe identificar reglas compartidas que posteriormente deban
consolidarse.

No debe implementar todavía:

``` text
ReproductiveEngine
```

La abstracción se abordará en PRD013 después de disponer del conjunto
completo de desenlaces principales.

## 11. Exclusiones de la fase

No forman parte de Fase 12:

``` text
Temporada reproductiva
Entrada/salida de sementales
Ubicaciones
Movimientos de animales
Eventos de manejo de explotación
Widget de Machorras
Drawer masivo de Machorras
Gestión masiva
Cron
Corrección/reversión de eventos
Reglas biológicas avanzadas
ReproductiveEngine
```

La futura gestión colectiva de Machorras deberá esperar a que exista un
modelo de manejo de explotación que permita determinar correctamente el
contexto de las candidatas.

## 12. Criterio de finalización de la fase

Fase 12 podrá considerarse completada cuando:

1.  Machorra esté implementada de extremo a extremo.
2.  La acción individual funcione desde el carrusel.
3.  La operación sea atómica.
4.  Gestante quede bloqueada.
5.  Reproductoras creen nuevo ciclo `VACÍA`.
6.  Los vínculos madre-cría permanezcan intactos.
7.  Cubrición y Confirmación revaliden estado dentro de la transacción.
8.  Parto mantenga sus consecuencias de forma atómica.
9.  La secuencia temporal básica esté protegida en frontend y backend.
10. Los eventos mantengan su `ciclo_id` histórico correcto.
11. El Destete conserve su asociación histórica y sus causas derivadas.
12. Los casos de doble ejecución estén cubiertos.
13. Los tests de integración y regresión sean satisfactorios.
14. No se haya introducido ningún mecanismo de temporada ni
    ReproductiveEngine.

## 13. Preparación para Fase 13

El resultado de Fase 12 debe dejar preparado un dominio en el que los
tres desenlaces principales compartan una base suficientemente
homogénea:

``` text
PARTO
ABORTO
MACHORRA
```

El siguiente paso será:

``` text
PRD013
ReproductiveEngine
+
consolidación de reglas
+
integración
+
QA global
```

Fase 12 no debe anticipar ni implementar esas abstracciones.
