# PRD008

# Fase actual

**Fase 8: Confirmación de gestación y consolidación del dominio reproductivo.**

---

# CONTEXTO

Lee **SIEMPRE** antes de empezar.

---

## 1. Especificaciones generales (obligatorio)

Definen los estándares generales del proyecto.

- `AI_docs/product_spec.md`
- `AI_docs/frontend_spec.md`
- `AI_docs/backend_spec.md`

---

## 2. Objetivos de la fase (obligatorio)

Definen el alcance concreto de esta implementación.

- `.taskmaster/reports/objetivos_fase08.md`

---

## 3. Base de conocimiento (obligatorio)

Antes de comenzar cualquier implementación deben revisarse los siguientes documentos.

### Modelo

- `documentacion/modelo/modelo_ganadero.md`
- `documentacion/modelo/modelo_reproductivo.md`

### Arquitectura

- `documentacion/arquitectura/overview.md`

### Principios

- `documentacion/arquitectura/principles/architecture-principles.md`
- `documentacion/arquitectura/principles/event-first.md`
- `documentacion/arquitectura/principles/snapshots.md`

### Patrones

- `documentacion/arquitectura/patterns/context-rules-projection.md`
- `documentacion/arquitectura/patterns/action-usecase-event.md`
- `documentacion/arquitectura/patterns/rpc-transaccional.md`

### Dominios

- `documentacion/arquitectura/domains/reproductive.md`

---

## 4. Guías de Frontend (cuando exista UI)

- `AI_docs/frontend_patterns.md`

---

# Contexto del proyecto

Las fases anteriores han consolidado definitivamente la arquitectura del sistema y el primer conjunto de reglas del dominio reproductivo.

Actualmente el proyecto ya dispone de:

- una arquitectura Event First completamente operativa;
- persistencia transaccional mediante RPC;
- snapshots derivados como modelo de lectura;
- un dominio reproductivo implementado mediante el patrón **Context → Rules → Projection**;
- registro operativo de Cubrición;
- registro operativo de Confirmación de gestación cuando existe una cubrición previamente registrada.

La infraestructura necesaria para interpretar eventos reproductivos ya existe y ha sido validada durante PRD007.

Esta fase no pretende introducir una nueva arquitectura ni un nuevo patrón.

Su objetivo consiste en evolucionar el dominio reproductivo incorporando el conocimiento consolidado durante el diseño del modelo reproductivo.

A partir de este momento las siguientes funcionalidades deberán desarrollarse ampliando el dominio existente y reutilizando la infraestructura ya implementada.

---

# Contexto funcional

Durante PRD007 se implementó el flujo básico de gestación:

```text
Cubrición

↓

Confirmación de gestación

↓

Estado GESTANTE
```

Este flujo continúa siendo completamente válido.

Sin embargo, durante el diseño del dominio reproductivo se identificó un escenario habitual que todavía no se encuentra soportado por el sistema.

En numerosas explotaciones la cubrición nunca llega a registrarse.

El primer hecho conocido del proceso reproductivo consiste directamente en la confirmación de gestación.

Este escenario no representa una excepción.

Forma parte del funcionamiento normal de muchas explotaciones ganaderas.

El modelo reproductivo definitivo admite este comportamiento porque continúa respetando el principio fundamental del dominio:

> El sistema representa conocimiento, no biología.

Como consecuencia, la Confirmación de gestación deja de depender obligatoriamente de una Cubrición previamente registrada.

Podrá convertirse en el primer hecho conocido del ciclo reproductivo.

Esta evolución no sustituye el comportamiento implementado en PRD007.

Lo amplía.

---

# Contexto de evolución

PRD008 no incorpora un nuevo evento reproductivo.

Tampoco introduce un nuevo formulario.

La Confirmación de gestación ya forma parte del sistema y continuará siendo exactamente la misma acción de negocio disponible desde la ficha del animal.

La evolución consiste en ampliar su comportamiento para soportar dos escenarios distintos:

## Escenario 1

Existe una cubrición previamente registrada.

```text
Cubrición

↓

Confirmación

↓

GESTANTE
```

Este flujo ya existe y deberá mantenerse sin modificaciones funcionales.

## Escenario 2

No existe ninguna cubrición registrada.

```text
Confirmación

↓

Creación del ciclo

↓

GESTANTE
```

En este caso el formulario solicitará además la edad gestacional estimada para que el dominio pueda construir las proyecciones necesarias.

La implementación deberá reutilizar toda la infraestructura existente, ampliando únicamente las reglas del dominio cuando resulte necesario.

---

# Contexto arquitectónico

La arquitectura introducida durante PRD007 permanece completamente vigente.

Toda acción reproductiva continuará recorriendo exactamente el mismo flujo:

```text
Acción

↓

Use Case

↓

ReproductiveContext

↓

Rules

↓

Projection

↓

RPC

↓

Persistencia
```

PRD008 no modifica esta secuencia.

La evolución se produce exclusivamente dentro del conocimiento que interpreta el dominio.

Las nuevas reglas deberán integrarse ampliando los componentes existentes, evitando crear arquitecturas paralelas o casos de uso específicos para un único escenario.

---

# Contexto del modelo reproductivo

La confirmación de gestación constituye el primer evento capaz de aumentar el conocimiento del sistema sin modificar el proceso reproductivo ya existente.

Una cubrición indica que existe un intento reproductivo.

Una confirmación de gestación permite afirmar algo diferente.

Permite afirmar que la explotación ya conoce que existe una gestación.

Este cambio no representa una nueva fase biológica.

Representa un nuevo nivel de conocimiento confirmado.

Además, el modelo admite que dicho conocimiento pueda aparecer aunque nunca llegara a registrarse la cubrición correspondiente.

Por este motivo el dominio deberá soportar ambos recorridos sin reconstruir retrospectivamente acontecimientos desconocidos y sin generar eventos ficticios.

---

# Prioridad máxima

Priorizar siempre:

1. Representar conocimiento antes que biología.
2. Reutilizar el dominio ya existente.
3. No duplicar reglas entre casos de uso.
4. No persistir información completamente derivable.
5. Mantener la historia de eventos inalterable.

Por encima de:

- optimizaciones prematuras;
- soluciones específicas para un único escenario;
- reconstrucción artificial de hechos no registrados.

---

# Objetivo principal

Evolucionar la funcionalidad de Confirmación de gestación para consolidar definitivamente el flujo de gestación definido por el modelo reproductivo.

La finalidad de esta fase no consiste únicamente en ampliar un formulario existente.

Su verdadero objetivo consiste en completar las reglas del dominio necesarias para soportar cualquier inicio válido del seguimiento de una gestación.

Al finalizar PRD008 el sistema deberá ser capaz de interpretar correctamente los siguientes escenarios:

```text
Cubrición

↓

Confirmación

↓

GESTANTE
```

```text
Confirmación

↓

GESTANTE
```

En ambos casos el dominio deberá construir exactamente las mismas proyecciones observables respetando siempre la historia realmente registrada.

---

# Problema que resuelve

Actualmente la Confirmación de gestación únicamente puede registrarse cuando existe una Cubrición previa.

Esta limitación impide representar correctamente aquellas situaciones en las que el primer conocimiento disponible consiste directamente en una gestación confirmada.

Como consecuencia, el modelo implementado todavía no refleja completamente las reglas definidas en el modelo reproductivo.

PRD008 elimina esta limitación ampliando el comportamiento existente.

A partir de esta fase la Confirmación de gestación podrá convertirse en el primer evento reproductivo conocido del ciclo cuando no exista una Cubrición registrada previamente.

El dominio continuará respetando los principios fundamentales del proyecto:

- los eventos seguirán siendo la única fuente de verdad;
- nunca se crearán eventos ficticios;
- nunca se modificará retrospectivamente la historia registrada;
- toda la información observable continuará obteniéndose mediante proyecciones derivadas.

# Decisiones consolidadas

Las siguientes decisiones forman parte del modelo reproductivo definitivo y deberán respetarse en todas las futuras implementaciones del dominio.

PRD008 no introduce estas decisiones.

Las consolida mediante su implementación.

---

## 1. El modelo representa conocimiento

El dominio reproductivo no intenta describir exactamente la realidad biológica del animal.

Describe el conocimiento confirmado que la explotación posee sobre dicha realidad.

Cada evento reproductivo incrementa, modifica o completa ese conocimiento.

Como consecuencia, el estado reproductivo no representa una fase biológica.

Representa el mayor nivel de conocimiento confirmado alcanzado hasta ese momento.

Ejemplo:

```text
Cubrición

↓

CUBIERTA
```

El sistema conoce que existe un intento reproductivo.

```text
Confirmación de gestación

↓

GESTANTE
```

El sistema ya conoce que la gestación existe.

El cambio de estado no responde a un cambio biológico.

Responde a un incremento del conocimiento disponible.

---

## 2. Los eventos nunca se reconstruyen

Los eventos continúan siendo la única fuente de verdad del sistema.

Cuando una gestación comienza a registrarse mediante una Confirmación de gestación, el sistema no debe reconstruir artificialmente una Cubrición anterior.

Tampoco debe generar eventos internos para completar la historia.

La historia únicamente estará formada por los hechos realmente registrados.

Ejemplo válido:

```text
Confirmación

↓

Parto
```

Ejemplo NO válido:

```text
Cubrición (inventada)

↓

Confirmación

↓

Parto
```

El dominio interpreta la información disponible.

Nunca inventa información inexistente.

---

## 3. La edad gestacional estimada nunca forma parte del dominio

Cuando una Confirmación de gestación inicia directamente el seguimiento reproductivo será necesario solicitar una edad gestacional estimada.

Este dato no representa un hecho del dominio.

Únicamente constituye un dato auxiliar necesario para construir las proyecciones correspondientes.

Una vez calculadas las fechas derivadas, dicho valor deja de tener utilidad.

Por tanto:

- no debe persistirse;
- no debe formar parte del snapshot;
- no debe almacenarse como información histórica;
- no deberá utilizarse posteriormente por ningún otro proceso.

Su única finalidad consiste en permitir calcular las fechas derivadas durante el procesamiento del evento.

---

## 4. Las proyecciones continúan siendo completamente derivadas

Toda la información observable deberá seguir obteniéndose exclusivamente mediante Projection.

Entre otras:

- estado reproductivo;
- fecha prevista de parto;
- días restantes;
- ciclo reproductivo activo.

El dominio no deberá persistir información adicional cuando ésta pueda obtenerse nuevamente mediante la interpretación de los eventos.

---

## 5. El ciclo reproductivo representa una única historia

Cada ciclo reproductivo describe una única historia reproductiva.

Todos los eventos registrados durante dicho proceso deberán pertenecer al mismo ciclo.

Cuando el seguimiento comience mediante una Confirmación de gestación, ese evento constituirá el primer hecho conocido del ciclo.

Posteriormente podrán registrarse eventos compatibles con dicha evolución.

Sin embargo, no será posible incorporar retrospectivamente una Cubrición al mismo ciclo.

Esta restricción evita reconstrucciones artificiales de la historia y mantiene una narrativa consistente de los acontecimientos registrados.

---

# Evolución del dominio reproductivo

PRD007 introdujo la infraestructura necesaria para interpretar eventos reproductivos.

PRD008 amplía dicha infraestructura incorporando nuevas reglas sin modificar la arquitectura existente.

La evolución del dominio afecta únicamente al conocimiento que interpreta cada uno de sus componentes.

---

# Evolución de ReproductiveContext

La responsabilidad de ReproductiveContext permanece inalterada.

Continúa representando toda la información necesaria para interpretar un evento reproductivo.

Sin embargo, el contexto deberá incorporar ahora la información necesaria para distinguir entre dos situaciones diferentes:

- existe una Cubrición previa;
- la Confirmación inicia directamente el seguimiento de la gestación.

El contexto nunca decidirá qué comportamiento aplicar.

Únicamente deberá proporcionar a las Rules toda la información necesaria para interpretar correctamente ambos escenarios.

---

# Evolución de ReproductiveEligibilityRules

Las reglas de elegibilidad deberán ampliarse para soportar las nuevas posibilidades introducidas por el modelo.

Como mínimo deberán contemplarse los siguientes escenarios.

## Confirmación con Cubrición previa

La Confirmación continuará comportándose exactamente igual que en PRD007.

El dominio verificará que la Cubrición registrada pertenece al ciclo reproductivo correspondiente y que el estado actual permite registrar la Confirmación.

No deberán introducirse cambios funcionales en este recorrido.

---

## Confirmación sin Cubrición previa

Cuando no exista ninguna Cubrición registrada el dominio permitirá iniciar el seguimiento reproductivo directamente mediante la Confirmación.

En este caso deberá verificarse que:

- el animal puede participar en reproducción;
- no existe una situación incompatible;
- la Confirmación puede convertirse en el primer hecho conocido del ciclo.

---

## Cubrición posterior

Una vez un ciclo haya comenzado mediante una Confirmación de gestación ya no podrá registrarse posteriormente una Cubrición para ese mismo ciclo.

Esta restricción forma parte del modelo reproductivo y garantiza que la historia permanezca coherente con los hechos realmente conocidos.

---

# Evolución de ReproductiveCycleRules

Las reglas del ciclo deberán ampliarse para soportar un nuevo mecanismo de inicio.

Hasta este momento el ciclo reproductivo comenzaba mediante la primera Cubrición registrada.

A partir de PRD008 también podrá comenzar mediante una Confirmación de gestación cuando ésta constituya el primer conocimiento disponible.

Ambos recorridos deberán generar exactamente el mismo resultado estructural.

La única diferencia residirá en la historia registrada.

```text
Cubrición

↓

Crear ciclo
```

```text
Confirmación

↓

Crear ciclo
```

El ciclo representa una historia reproductiva.

No depende del evento concreto con el que comenzó dicha historia.

---

# Evolución de ReproductiveProjection

La proyección continúa siendo responsable de construir el snapshot reproductivo.

Su responsabilidad permanece inalterada.

Lo que evoluciona es la forma de obtener determinada información derivada.

Cuando exista una Cubrición registrada, las fechas derivadas se calcularán utilizando dicha información.

Cuando la Confirmación constituya el primer hecho conocido del ciclo, las fechas necesarias se calcularán utilizando la edad gestacional estimada introducida durante el registro del evento.

En ambos casos el resultado observable deberá ser exactamente el mismo.

Projection únicamente deberá construir la información que necesita consultar el resto del sistema.

Nunca deberá almacenar información auxiliar utilizada durante los cálculos.

---

# Consolidación del flujo de gestación

Al finalizar PRD008 el dominio deberá soportar completamente ambos recorridos.

## Flujo clásico

```text
Cubrición

↓

Confirmación

↓

GESTANTE

↓

Parto
```

## Flujo iniciado mediante Confirmación

```text
Confirmación

↓

GESTANTE

↓

Parto
```

A partir de este momento ambos recorridos deberán reutilizar exactamente las mismas reglas del dominio y generar el mismo comportamiento observable para el resto de la aplicación.

La diferencia entre ambos quedará reflejada únicamente en la historia real de eventos registrada para cada ciclo reproductivo.

# Modelo funcional

La funcionalidad implementada durante PRD008 reutiliza completamente la infraestructura introducida en PRD007.

La evolución se produce ampliando el comportamiento del caso de uso existente de Confirmación de gestación.

No se introduce una nueva acción de negocio.

No se crea un nuevo evento.

No se incorpora una nueva arquitectura.

La funcionalidad existente evoluciona para soportar completamente el modelo reproductivo definitivo.

---

# Caso de uso

La acción de negocio continúa siendo:

```text
Confirmar gestación
```

Su responsabilidad sigue siendo exactamente la misma.

Registrar que la explotación dispone de conocimiento suficiente para afirmar que existe una gestación.

El caso de uso continuará limitándose a coordinar la operación.

Nunca deberá interpretar reglas del dominio.

Su flujo conceptual permanecerá inalterado.

```text
Construir contexto

↓

Validar elegibilidad

↓

Interpretar ciclo

↓

Construir proyección

↓

Persistir mediante RPC
```

Toda la evolución funcional deberá producirse ampliando el dominio reproductivo.

Nunca incorporando lógica específica dentro del Use Case.

---

# Comportamiento esperado

El dominio deberá soportar dos recorridos completamente válidos.

## Recorrido 1

Existe una Cubrición previamente registrada.

```text
Cubrición

↓

Confirmación

↓

Projection

↓

Snapshot
```

El comportamiento deberá mantenerse exactamente igual que en la implementación existente.

---

## Recorrido 2

No existe ninguna Cubrición registrada.

```text
Confirmación

↓

Creación del ciclo

↓

Construcción de la línea temporal

↓

Projection

↓

Snapshot
```

La ausencia de una Cubrición no deberá impedir registrar la gestación.

El dominio interpretará que la Confirmación constituye el primer conocimiento disponible del ciclo.

---

# Reconstrucción temporal del ciclo

Cuando la Confirmación constituya el primer hecho conocido del ciclo será necesario reconstruir internamente una línea temporal aproximada que permita interpretar correctamente el resto del proceso reproductivo.

Para ello el formulario solicitará una edad gestacional estimada.

Desde el punto de vista del dominio, la edad gestacional estimada constituye únicamente un dato auxiliar utilizado para reconstruir temporalmente el ciclo.

Sin embargo, este concepto no forma parte del lenguaje habitual del usuario.

La interfaz deberá traducir esta necesidad del dominio a un lenguaje comprensible para el ganadero, solicitando aproximadamente cuántos meses de gestación tiene actualmente el animal.

El objetivo no consiste en obtener una medida veterinaria precisa, sino una estimación suficientemente aproximada para construir las proyecciones reproductivas del ciclo.

Este dato únicamente se utilizará durante el procesamiento del evento.

El dominio combinará:

- fecha de la Confirmación;
- edad gestacional estimada;

para calcular una fecha aproximada de inicio de la gestación.

Dicha fecha no representa un nuevo evento.

No modifica la historia registrada.

No deberá persistirse.

Constituye exclusivamente un valor intermedio utilizado para construir las proyecciones derivadas del ciclo.

Una vez finalizado el procesamiento, únicamente permanecerán las proyecciones observables construidas por ReproductiveProjection.

---

# Interfaz de usuario

La experiencia de usuario deberá mantenerse coherente con el resto del sistema.

La Confirmación de gestación continuará registrándose desde el panel de acciones disponible en la ficha del animal.

No deberán incorporarse nuevas pantallas.

No deberán añadirse nuevas rutas.

No deberán crearse acciones alternativas.

---

## Evolución del formulario

Se reutilizará el formulario existente de Confirmación de gestación.

Únicamente se ampliará su comportamiento.

### Cuando exista una Cubrición previa

El formulario continuará mostrando exactamente los mismos campos implementados actualmente.

No deberán introducirse cambios en la experiencia de usuario.

## Confirmación asistida

Cuando el usuario intente registrar una Confirmación de gestación sin que exista una Cubrición previa, la interfaz deberá mostrar un aviso informativo antes de completar el formulario.

El objetivo de este aviso no consiste en impedir la operación.

Su finalidad es ayudar al usuario a comprender las implicaciones de la acción que está realizando.

El mensaje deberá explicar, como mínimo, que:

- no existe una Cubrición registrada para este ciclo;
- la Confirmación de gestación pasará a convertirse en el primer hecho conocido del proceso reproductivo;
- posteriormente ya no podrá registrarse una Cubrición para este mismo ciclo;
- será necesario indicar una edad gestacional estimada para que el sistema pueda construir las proyecciones reproductivas correspondientes.

Este aviso deberá mostrarse únicamente cuando la Confirmación inicie directamente el ciclo reproductivo.

No deberá aparecer cuando exista una Cubrición previamente registrada.

---

### Cuando no exista una Cubrición previa

Antes de solicitar información adicional, la interfaz mostrará un bloque específico para registrar una gestación cuyo seguimiento comienza sin una Cubrición previa. 

Primero mostrará un mensaje informativo explicando que:

- no existe una Cubrición registrada para este ciclo;
- la Confirmación pasará a convertirse en el primer hecho conocido del proceso reproductivo;
- posteriormente ya no podrá registrarse una Cubrición para este mismo ciclo.

Una vez aceptado este escenario, el formulario mostrará además un nuevo campo obligatorio para indicar una "Edad gestacional estimada" que deberá indicarse en meses.

```text
¿Desde hace cuántos meses aproximadamente está gestante?

[ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ] [ 6 ] [ 7 ] [ 8 ]
```

Este campo únicamente aparecerá cuando resulte necesario para construir la línea temporal aproximada del ciclo.

En cualquier otro escenario permanecerá oculto.

El usuario nunca introducirá una edad gestacional expresada en días o semanas.

La interfaz trabajará exclusivamente con meses completos, ya que el objetivo no consiste en obtener una medida exacta, sino una estimación suficientemente aproximada para reconstruir temporalmente el ciclo reproductivo.

Internamente el dominio utilizará dicho valor para construir las proyecciones necesarias.

Este dato nunca formará parte de la historia del animal ni se persistirá una vez finalizado el procesamiento del evento.

---

## Validaciones

El frontend únicamente será responsable de validar aspectos relacionados con la experiencia de usuario.

Entre otros:

- campos obligatorios;
- formatos válidos;
- consistencia de fechas.

Toda validación relacionada con el dominio continuará realizándose exclusivamente mediante ReproductiveEligibilityRules.

---

# Compatibilidad con la implementación existente

PRD008 evoluciona la funcionalidad implementada durante PRD007.

No sustituye el comportamiento existente.

Toda Confirmación de gestación registrada sobre una Cubrición previa deberá continuar comportándose exactamente igual que hasta este momento.

Las nuevas reglas únicamente amplían el dominio para soportar escenarios que anteriormente no podían representarse.

El objetivo de esta fase consiste en incrementar las capacidades del dominio manteniendo la compatibilidad con todas las funcionalidades ya implementadas.

---

# Alcance funcional

## Incluir

Durante esta fase se implementará exclusivamente:

- ampliación del caso de uso existente de Confirmación de gestación;
- soporte para Confirmación sin Cubrición previa;
- creación del ciclo cuando resulte necesario;
- ampliación de ReproductiveEligibilityRules;
- ampliación de ReproductiveCycleRules;
- ampliación de ReproductiveProjection;
- construcción interna de la línea temporal del ciclo;
- cálculo de las proyecciones derivadas correspondientes;
- ampliación del formulario existente con el campo condicional de edad gestacional estimada.

---

## No incluir

No forman parte del alcance de PRD008:

- Parto;
- Aborto;
- Destete;
- automatizaciones reproductivas;
- recordatorios;
- calendario reproductivo;
- indicadores reproductivos;
- cuadros de mando;
- modificaciones del flujo general de acciones del sistema.

El objetivo continúa siendo consolidar completamente el dominio de gestación antes de abordar el siguiente gran evento reproductivo: el Parto.