# PRD007

# Fase actual

Fase 7: Inicio del módulo reproductivo.

---

# CONTEXTO

Lee SIEMPRE antes de empezar.

---

## 1. Especificaciones generales (obligatorio)

Definen los estándares generales del proyecto.

- `AI_docs/product_spec.md`
- `AI_docs/frontend_spec.md`
- `AI_docs/backend_spec.md`

---

## 2. Especificaciones de patrones (obligatorio cuando aplique)

Leer únicamente cuando el PRD introduzca un dominio cuya complejidad justifique la utilización del patrón correspondiente.

- `AI_docs/context-rules-projection_pattern_spec.md`

---

## 3. Objetivos de la fase (obligatorio)

Definen el alcance concreto de esta implementación.

- `.taskmaster/reports/objetivos_fase07.md`

---

## 4. Contexto arquitectónico (consulta cuando sea necesario)

Describe la arquitectura permanente del proyecto.

### Principios

- `documentacion/arquitectura/principles/architecture-principles.md`
- `documentacion/arquitectura/principles/event-first.md`
- `documentacion/arquitectura/principles/snapshots.md`

### Patrones

- `documentacion/arquitectura/patterns/context-rules-projection.md`
- `documentacion/arquitectura/patterns/rpc-transaccional.md`

### Dominios

- `documentacion/arquitectura/domains/reproductive.md`

### Índice

- `documentacion/arquitectura/overview.md`

---

## 5. Guías de Frontend (cuando exista UI)

- `AI_docs/frontend_patterns.md`

---

# Contexto del proyecto

El proyecto ha consolidado durante las fases anteriores un modelo arquitectónico basado en eventos, donde todas las operaciones relevantes del dominio se representan mediante hechos del mundo real y no mediante modificaciones directas sobre el estado de las entidades.

A lo largo de las primeras fases se ha validado progresivamente esta filosofía mediante diferentes vertical slices funcionales.

Primero se consolidó el modelo de lectura del dominio ganadero.

Posteriormente se introdujo el primer flujo completo de escritura mediante el registro de entradas de animales.

Finalmente se completó el ciclo básico de vida del animal mediante el registro de salidas y la consolidación de las escrituras transaccionales basadas en RPC.

El siguiente paso natural consiste en abordar el primer dominio cuyo comportamiento depende de reglas biológicas complejas y cuya evolución no puede modelarse únicamente mediante casos de uso independientes.

Ese dominio es el módulo reproductivo.

El objetivo ya no consiste únicamente en registrar nuevos eventos.

A partir de esta fase el sistema comienza a interpretar relaciones biológicas entre eventos, ciclos y estados derivados.

### Impacto en futuras fases

Este cambio introduce la primera infraestructura de dominio transversal del proyecto y servirá como base para todas las funcionalidades reproductivas posteriores.

---

# Contexto funcional

Hasta este momento los eventos implementados presentan un comportamiento relativamente sencillo.

Cada evento modifica una parte concreta del sistema y genera un conjunto limitado de consecuencias derivadas.

Ejemplos:

```text
Compra
↓
Creación del animal

Venta
↓
Cambio de estado vital

Muerte
↓
Cambio de estado vital
```

En el ámbito reproductivo la situación cambia significativamente.

Una cubrición no representa únicamente un hecho aislado.

Su significado depende del contexto biológico del animal y condiciona el comportamiento de múltiples eventos futuros.

Registrar correctamente una cubrición implica responder previamente a preguntas como:

- ¿el animal puede entrar en reproducción?
- ¿existe un ciclo reproductivo abierto?
- ¿debe reutilizarse un ciclo existente?
- ¿qué estado reproductivo debe proyectarse?
- ¿qué información derivada necesita consultar el resto del sistema?

Estas preguntas no pertenecen a un caso de uso concreto.

Pertenecen al propio dominio reproductivo.

Por este motivo la fase deja de centrarse exclusivamente en una funcionalidad y pasa a introducir una nueva forma de organizar el conocimiento del dominio.

### Impacto en futuras fases

Todos los eventos reproductivos reutilizarán exactamente el mismo mecanismo de interpretación del dominio, evitando duplicar reglas entre casos de uso.

---

# Contexto arquitectónico

Hasta PRD006 la arquitectura de escritura podía resumirse mediante el siguiente flujo:

```text
Frontend
↓
Use Case
↓
Repository
↓
RPC
↓
Base de datos
```

Este modelo continúa siendo completamente válido.

Sin embargo, resulta insuficiente cuando un mismo conjunto de reglas debe reutilizarse por múltiples casos de uso distintos.

La alternativa no consiste en crear Use Cases cada vez más complejos.

Tampoco en introducir grandes servicios de dominio que acumulen responsabilidades heterogéneas.

La solución adoptada consiste en introducir el primer dominio del proyecto cuya complejidad justifica encapsular parte del conocimiento del negocio mediante el patrón Context → Rules → Projection.

El Use Case continúa siendo la unidad arquitectónica por defecto del proyecto. Este patrón se introduce únicamente cuando varias funcionalidades comparten reglas de negocio reutilizables, persistentes y suficientemente complejas como para merecer una separación explícita del conocimiento del dominio.

Este patrón encapsula exclusivamente el conocimiento relacionado con el dominio reproductivo y establece una separación clara entre:

- la información necesaria para interpretar un evento;
- las reglas que gobiernan el comportamiento del dominio;
- la construcción del estado derivado que utilizará el resto del sistema.

El objetivo no es aumentar el número de capas.

El objetivo es separar responsabilidades conceptuales para mantener un dominio comprensible, reutilizable y fácilmente extensible.

### Impacto en futuras fases

Las nuevas funcionalidades reproductivas se incorporarán ampliando el mismo contexto, evitando la proliferación de lógica distribuida entre múltiples Use Cases.

---

# Contexto de evolución

PRD007 constituye el punto de partida del módulo reproductivo.

No pretende resolver todas las necesidades relacionadas con la reproducción animal.

Su responsabilidad consiste en establecer la infraestructura arquitectónica sobre la que evolucionarán las siguientes fases.

Durante esta fase únicamente se implementará el primer caso de uso necesario para validar dicha infraestructura:

```text
Cubrición
```

La Cubrición no representa el objetivo principal del PRD.

Representa el mecanismo de validación del nuevo patrón arquitectónico.

Una vez demostrado que dicho patrón funciona correctamente, el resto de eventos reproductivos podrán incorporarse reutilizando exactamente la misma estructura.

Entre ellos se encuentran, entre otros:

- parto;
- aborto;
- destete;
- confirmación de gestación;
- eventos reproductivos avanzados;
- automatizaciones futuras.

El verdadero entregable de esta fase no es un formulario de cubrición.

Es una arquitectura de dominio preparada para evolucionar durante todo el ciclo de vida del proyecto.

### Impacto en futuras fases

Las siguientes fases dejarán de centrarse en construir infraestructura y podrán dedicar prácticamente todo su esfuerzo a incorporar nuevo conocimiento funcional.

---

# Prioridad máxima

Priorizar siempre:

1. consistencia del dominio;
2. separación clara de responsabilidades;
3. reutilización del patrón arquitectónico;
4. simplicidad conceptual;
5. mantenibilidad a largo plazo.

Por encima de:

- velocidad de implementación;
- optimizaciones prematuras;
- abstracciones innecesarias;
- soporte para escenarios todavía no implementados.

---

# Objetivo principal

Implementar el primer dominio del proyecto que adopta el patrón Context → Rules → Projection, demostrando cómo puede extraerse el conocimiento reutilizable del Use Case sin modificar la arquitectura general del sistema.

El objetivo NO es únicamente registrar una cubrición.

El verdadero objetivo consiste en introducir un patrón reutilizable capaz de interpretar cualquier evento reproductivo presente o futuro.

La Cubrición constituye únicamente el primer caso de uso encargado de validar dicho patrón.

A partir de esta fase, el procesamiento de los eventos reproductivos seguirá la siguiente secuencia conceptual:

```text
Evento
↓
Contexto
↓
Rules
↓
Projection
↓
Snapshot persistido
```

Este flujo pasa a ser la referencia oficial para todo el módulo reproductivo.

### Impacto en futuras fases

Los nuevos eventos reproductivos deberán integrarse reutilizando este patrón, sin modificar su estructura fundamental.

---

# Problema que resuelve

Intentar implementar cada evento reproductivo como un caso de uso independiente conduciría progresivamente a la duplicación de reglas, la dispersión del conocimiento del dominio y la aparición de inconsistencias entre funcionalidades relacionadas.

Ejemplos de este problema serían:

- validar la elegibilidad reproductiva en múltiples lugares distintos;
- recalcular estados mediante algoritmos diferentes;
- interpretar el ciclo reproductivo de forma distinta según el evento;
- duplicar cálculos sobre fechas previstas;
- generar snapshots inconsistentes entre distintas operaciones.

El problema no aparece con un único evento.

Aparece cuando el dominio comienza a crecer.

Por ello, PRD007 introduce una organización explícita del conocimiento reproductivo antes de incorporar nuevos casos de uso.

Esta decisión permite que el crecimiento futuro del módulo se produzca mediante ampliación del dominio existente y no mediante acumulación de lógica distribuida.

El resultado esperado es un sistema donde las reglas reproductivas tengan un único lugar donde vivir, evolucionar y mantenerse.

### Impacto en futuras fases

La incorporación de nuevos eventos dejará de implicar la creación de nuevas arquitecturas y pasará a consistir únicamente en extender un dominio ya consolidado.

# Decisiones consolidadas

Las siguientes decisiones pasan a formar parte de la arquitectura permanente del proyecto.

No constituyen decisiones específicas de esta fase, sino normas de diseño que deberán respetarse en todas las futuras implementaciones del módulo reproductivo.

---

## 1. Los eventos continúan siendo la única fuente de verdad

Todo hecho ocurrido en el dominio reproductivo debe representarse mediante un evento.

Ejemplos:

- cubrición;
- parto;
- aborto;
- destete.

El sistema nunca debe reconstruir artificialmente eventos a partir de estados persistidos.

Los eventos representan la historia.

Los estados representan únicamente una fotografía operacional derivada de dicha historia.

```text
Evento
↓
Interpretación
↓
Estado derivado
```

### Impacto en futuras fases

La incorporación de nuevos estados reproductivos nunca justificará almacenar información que pueda reconstruirse a partir de los eventos existentes.

---

## 2. El snapshot reproductivo es una proyección derivada

El estado reproductivo persistido del animal no constituye una fuente de información independiente.

Su única finalidad es optimizar la lectura del sistema.

Debe entenderse siempre como:

```text
Snapshot persistido

↓

Derivado de eventos
```

Nunca debe modificarse manualmente.

Nunca debe utilizarse como origen para reconstruir la historia del animal.

Toda modificación del snapshot debe producirse exclusivamente como consecuencia del procesamiento de un evento reproductivo.

### Impacto en futuras fases

La evolución del snapshot no afectará al modelo histórico, permitiendo añadir nuevas proyecciones sin modificar los eventos ya registrados.

---

## 3. El backend interpreta el dominio

Toda decisión relacionada con el comportamiento reproductivo pertenece al backend.

El frontend únicamente:

- solicita registrar un evento;
- muestra información;
- guía la interacción del usuario.

No interpreta estados.

No calcula fechas.

No decide si un evento es válido.

Toda regla del dominio debe permanecer concentrada dentro del módulo reproductivo.

### Impacto en futuras fases

La incorporación de nuevas interfaces o clientes no requerirá duplicar lógica reproductiva.

---

## 4. No persistir información derivable

El sistema evitará almacenar información que pueda obtenerse de manera determinista a partir de los eventos existentes.

Persistir un dato derivado únicamente estará justificado cuando:

- mejore significativamente las consultas;
- represente un estado observable por el resto del sistema;
- pueda recalcularse íntegramente desde la historia de eventos.

En caso contrario, deberá calcularse bajo demanda.

### Impacto en futuras fases

El crecimiento del modelo reproductivo no incrementará innecesariamente la duplicación de información.

---

## 5. Separación entre interpretación y persistencia

Interpretar un evento y persistir sus consecuencias son responsabilidades distintas.

La lógica reproductiva nunca dependerá de cómo se almacena posteriormente la información.

Esto permitirá evolucionar las proyecciones sin modificar las reglas del dominio.

### Impacto en futuras fases

Las futuras optimizaciones de persistencia podrán realizarse sin alterar la interpretación biológica del sistema.

---

# Aplicación del patrón al dominio reproductivo

PRD007 introduce el primer dominio del proyecto cuya complejidad justifica encapsular el conocimiento mediante el patrón Context → Rules → Projection.

Su responsabilidad consiste exclusivamente en encapsular el conocimiento relacionado con la reproducción animal.

No representa una nueva capa técnica.

Representa una frontera conceptual del dominio.

A partir de esta fase, cualquier funcionalidad relacionada con la reproducción deberá desarrollarse dentro de este contexto.

---

## Responsabilidad única

El dominio reproductivo encapsula únicamente las reglas reproductivas mediante el patrón Context → Rules → Projection.

No contiene lógica financiera.

No interpreta estados sanitarios.

No gestiona movimientos de stock.

No conoce la interfaz de usuario.

Su única responsabilidad consiste en comprender qué significado tienen los eventos reproductivos y cuáles son sus consecuencias.

### Impacto en futuras fases

La evolución de otros dominios no afectará al comportamiento del módulo reproductivo.

---

## Independencia de infraestructura

El contexto nunca accede directamente a:

- Supabase;
- RPC;
- repositorios;
- consultas SQL;
- servicios externos.

Recibe únicamente información ya preparada para ser interpretada.

Esto garantiza que las reglas reproductivas puedan evolucionar sin depender del mecanismo de persistencia.

### Impacto en futuras fases

Será posible modificar la infraestructura sin alterar el comportamiento del dominio.

---

## Determinismo

El mismo conjunto de eventos debe producir siempre exactamente el mismo resultado.

Las reglas reproductivas nunca dependerán de:

- estados temporales;
- decisiones del frontend;
- orden accidental de ejecución;
- efectos secundarios externos.

La interpretación del dominio debe ser completamente determinista.

### Impacto en futuras fases

Será posible recalcular snapshots completos manteniendo resultados consistentes.

---

## Extensibilidad

El objetivo del contexto no es resolver únicamente la Cubrición.

Debe permitir incorporar nuevos eventos sin modificar la arquitectura existente.

Cada nuevo evento ampliará el conocimiento del dominio reutilizando exactamente el mismo patrón.

La arquitectura debe crecer mediante extensión.

Nunca mediante sustitución.

### Impacto en futuras fases

Eventos como Parto, Aborto o Destete podrán incorporarse reutilizando la infraestructura ya creada.

---

## Cohesión del conocimiento

Todas las reglas relacionadas con la reproducción deben vivir juntas.

Evitar repartir pequeñas validaciones entre:

- Use Cases;
- componentes UI;
- repositorios;
- procedimientos SQL.

Cuando una regla pertenece al dominio reproductivo, debe localizarse dentro del patrón Context → Rules → Projection implementado por dicho dominio.

### Impacto en futuras fases

La evolución del dominio resultará más sencilla y reducirá el riesgo de inconsistencias.

---

# Patrón arquitectónico

El siguiente patrón no sustituye a la arquitectura general del proyecto.

Se trata de una especialización utilizada únicamente cuando un dominio acumula reglas de negocio reutilizables que dejarían de pertenecer naturalmente al Use Case.

El módulo reproductivo deja de organizarse exclusivamente mediante casos de uso, sino que adopta el siguiente patrón conceptual:

```text
Evento
    ↓
ReproductiveContext
    ↓
ReproductiveEligibilityRules
    ↓
ReproductiveCycleRules
    ↓
ReproductiveProjection
    ↓
Snapshot persistido
```

Cada elemento posee una responsabilidad perfectamente delimitada.

El objetivo consiste en impedir que una misma clase interprete el dominio, valide reglas y construya proyecciones simultáneamente.

---

# ReproductiveContext

El contexto constituye el punto de entrada del dominio reproductivo.

Su responsabilidad consiste exclusivamente en agrupar toda la información necesaria para interpretar correctamente un evento.

Nunca realiza cálculos.

Nunca modifica estados.

Nunca contiene reglas.

Únicamente representa el conocimiento disponible en el momento de ejecutar una operación.

Inicialmente podrá incluir información como:

- animal;
- ciclo reproductivo activo;
- último evento biológico;
- evento que se desea registrar.

En el futuro podrá ampliarse con cualquier otra información necesaria para interpretar correctamente el dominio.

El contexto describe la realidad.

No toma decisiones sobre ella.

### Impacto en futuras fases

Nuevos eventos podrán reutilizar exactamente el mismo contexto sin modificar su filosofía.

---

# ReproductiveEligibilityRules

Una vez construido el contexto, el primer paso consiste en validar si el evento solicitado puede registrarse.

Este conjunto de reglas responde exclusivamente a una pregunta:

```text
¿Puede este animal recibir este evento?
```

Ejemplos de validaciones:

- el animal pertenece al sistema reproductivo;
- el estado actual permite registrar el evento;
- no existen incompatibilidades biológicas.

Estas reglas nunca modifican estados.

Nunca proyectan información.

Nunca crean ciclos.

Su única responsabilidad consiste en aceptar o rechazar el evento solicitado.

### Impacto en futuras fases

Todos los eventos reproductivos compartirán un único mecanismo de validación.

---

# ReproductiveCycleRules

Una vez validado el evento, el dominio debe interpretar cómo afecta al ciclo reproductivo.

Estas reglas son responsables exclusivamente de la narrativa biológica del ciclo.

Entre otras responsabilidades futuras:

- apertura de ciclo;
- reutilización del ciclo existente;
- cierre del ciclo;
- transición entre estados del ciclo.

Nunca construyen snapshots.

Nunca calculan información destinada a lectura.

Su objetivo consiste únicamente en mantener la coherencia del ciclo reproductivo.

### Impacto en futuras fases

La incorporación de nuevos eventos modificará únicamente este bloque cuando afecte a la evolución del ciclo.

---

# ReproductiveProjection

Después de interpretar el dominio, el sistema debe construir la información observable por el resto de la aplicación.

Esta responsabilidad pertenece exclusivamente a ReproductiveProjection.

Su objetivo no consiste únicamente en calcular el estado reproductivo.

Construye una proyección completa del estado reproductivo persistido.

Inicialmente podrá incluir:

- estado reproductivo;
- ciclo activo;
- fecha prevista de parto;
- días restantes.

En fases posteriores podrá ampliarse con nuevas propiedades derivadas siempre que cumplan simultáneamente las siguientes condiciones:

- sean completamente derivables;
- aporten valor para lectura o consulta;
- pertenezcan al estado observable del animal.

Nunca contendrá información interna del algoritmo.

Nunca almacenará estructuras necesarias únicamente para la interpretación del dominio.

La proyección representa el resultado visible del proceso de interpretación.

### Impacto en futuras fases

Será posible enriquecer el snapshot reproductivo sin modificar el resto de la arquitectura.

---

# Separación entre Contexto y Proyección

Uno de los objetivos fundamentales de PRD007 consiste en diferenciar explícitamente dos conceptos que habitualmente terminan mezclándose.

El contexto representa toda la información necesaria para comprender un evento.

La proyección representa únicamente la información derivada que necesita consultar el resto del sistema.

Ambos conceptos cumplen funciones completamente distintas.

```text
Contexto

Toda la información necesaria
para interpretar el dominio.

        ↓

Rules

Interpretan el significado
biológico del evento.

        ↓

Projection

Construye exclusivamente
el estado observable.

        ↓

Snapshot persistido
```

Confundir ambos conceptos conduciría a modelos difíciles de mantener, donde la información utilizada para interpretar el dominio terminaría persistiéndose sin necesidad.

Mantener esta separación constituye una de las decisiones arquitectónicas más importantes de todo el módulo reproductivo.

### Impacto en futuras fases

El crecimiento del dominio reproductivo podrá realizarse ampliando el conocimiento del contexto o enriqueciendo las proyecciones de manera independiente, evitando acoplamientos innecesarios entre interpretación y persistencia.

# Modelo conceptual

Evento
        ↓
Contexto
        ↓
Interpretación
        ↓
Proyección
        ↓
Snapshot

El procesamiento del dominio reproductivo debe entenderse como una secuencia de transformación del conocimiento.

Cada etapa añade significado al evento recibido hasta obtener un estado observable por el resto del sistema.

```text
Evento

↓

Contexto

Toda la información necesaria
para interpretar el evento.

↓

Rules

Interpretan el dominio
y aplican las reglas biológicas.

↓

Projection

Construye exclusivamente
la información observable.

↓

Snapshot

Estado persistido
optimizado para lectura.


# Infraestructura introducida

PRD007 introduce la primera implementación del patrón Context → Rules → Projection dentro del proyecto.

A diferencia de las fases anteriores, donde la mayor parte del trabajo consistía en implementar un flujo funcional concreto, esta fase incorpora una arquitectura de dominio preparada para ser reutilizada durante todo el desarrollo del módulo reproductivo.

La Cubrición constituye únicamente el primer caso de uso que utilizará esta infraestructura.

El verdadero entregable de la fase es la primera implementación del patrón Context → Rules → Projection dentro del proyecto.

### Impacto en futuras fases

Las siguientes funcionalidades reproductivas reutilizarán esta infraestructura sin necesidad de crear nuevas arquitecturas específicas.

---

## Organización del dominio

El dominio reproductivo pasa a estructurarse alrededor de cuatro grandes bloques de responsabilidad:

```text
Reproductive/

├── Context/
│
├── Rules/
│   ├── ReproductiveEligibilityRules
│   ├── ReproductiveCycleRules
│   └── ReproductiveProjection
│
├── Types/
│
└── Events/
```

Esta estructura no pretende reflejar necesariamente la organización física definitiva del código.

Representa la organización conceptual del dominio.

Su objetivo es facilitar que todas las reglas reproductivas permanezcan agrupadas bajo un mismo contexto funcional.

### Impacto en futuras fases

La incorporación de nuevos eventos consistirá principalmente en ampliar este dominio sin modificar su estructura.

---

## Caso de uso

El caso de uso mantiene la misma responsabilidad que en fases anteriores.

Su misión consiste en orquestar la operación.

No interpreta el dominio.

No calcula estados.

No conoce la lógica reproductiva.

Su flujo conceptual será:

```text
Construir contexto
↓

Validar elegibilidad

↓

Interpretar ciclo

↓

Construir proyección

↓

Persistir resultado
```

El Use Case continúa siendo el coordinador de la operación.

Nunca el lugar donde vive el conocimiento del dominio.

### Impacto en futuras fases

Todos los futuros casos de uso reproductivos mantendrán una estructura prácticamente idéntica.

---

## Persistencia

La estrategia de escritura introducida en PRD006 continúa siendo plenamente válida.

Toda modificación del estado reproductivo deberá seguir ejecutándose mediante operaciones transaccionales.

El procesamiento del dominio ocurre previamente.

La persistencia únicamente almacena el resultado obtenido.

El flujo completo pasa a entenderse como:

```text
Frontend

↓

Use Case

↓

Context

↓

Rules

↓

Projection

↓

RPC

↓

Persistencia
```

Esta separación evita mezclar reglas de negocio con lógica de almacenamiento.

### Impacto en futuras fases

Será posible modificar la estrategia de persistencia sin alterar el comportamiento del dominio reproductivo.

---

## Snapshot reproductivo

El snapshot reproductivo pasa a convertirse en el punto de consulta oficial para el resto del sistema.

No pretende sustituir a los eventos.

Su objetivo consiste en evitar recalcular continuamente información que puede obtenerse de forma determinista.

Inicialmente podrá persistir información como:

- estado reproductivo;
- identificador del ciclo activo;
- fecha prevista de parto;
- días restantes.

En futuras fases podrán añadirse nuevas propiedades derivadas siempre que respeten las reglas establecidas en este documento.

### Impacto en futuras fases

El resto de módulos podrán consultar directamente el snapshot sin necesidad de interpretar la historia reproductiva del animal.

---

# Modelo funcional

El comportamiento funcional implementado durante esta fase es deliberadamente reducido.

El objetivo consiste en validar la arquitectura.

No desarrollar todavía todo el dominio reproductivo.

La Cubrición constituye el primer evento capaz de recorrer completamente el nuevo patrón arquitectónico.

```text
Registrar cubrición

↓

Construcción del contexto

↓

Validación biológica

↓

Interpretación del ciclo

↓

Construcción del snapshot

↓

Persistencia
```

Cada paso añade una responsabilidad distinta.

Ninguno de ellos conoce el funcionamiento interno del siguiente.

### Impacto en futuras fases

Todos los eventos reproductivos reutilizarán exactamente esta secuencia.

---

## Apertura o reutilización del ciclo

Uno de los primeros comportamientos del dominio consiste en determinar cómo debe relacionarse el nuevo evento con el ciclo reproductivo.

La decisión no depende del formulario.

No depende del frontend.

No depende de la base de datos.

Pertenece exclusivamente al dominio.

La Cubrición podrá provocar dos situaciones:

### Caso 1

No existe un ciclo abierto.

```text
Cubrición

↓

Crear nuevo ciclo

↓

Asociar evento
```

### Caso 2

Ya existe un ciclo abierto.

```text
Cubrición

↓

Reutilizar ciclo existente

↓

Asociar evento
```

Esta decisión pertenece exclusivamente a ReproductiveCycleRules.

### Impacto en futuras fases

Eventos como Parto, Aborto o Destete reutilizarán el mismo ciclo sin necesidad de reinterpretar la lógica desde cada caso de uso.

---

## Proyección del estado reproductivo

Una vez interpretado el evento, el sistema construye la proyección observable.

Inicialmente el resultado esperado será:

```text
estado_reproductivo

↓

GESTANTE
```

junto con la información derivada necesaria para lectura.

Entre ella:

- fecha prevista de parto;
- días restantes;
- ciclo asociado.

El objetivo no consiste únicamente en mostrar un nuevo estado.

Consiste en demostrar que el snapshot puede construirse automáticamente a partir del dominio.

### Impacto en futuras fases

Las futuras proyecciones podrán enriquecerse sin modificar las reglas biológicas.

---

## Información derivada

La información calculada durante esta fase no representa nuevos datos introducidos por el usuario.

Representa conocimiento obtenido mediante interpretación del dominio.

Ejemplos:

```text
Evento

↓

Fecha prevista de parto
```

```text
Evento

↓

Días restantes
```

```text
Evento

↓

Estado reproductivo
```

El usuario únicamente registra el hecho ocurrido.

El sistema deduce automáticamente sus consecuencias.

### Impacto en futuras fases

Las nuevas funcionalidades reproductivas podrán generar información adicional sin aumentar la complejidad de los formularios.

---

# UX

La experiencia de usuario mantiene la filosofía introducida en PRD006.

Las acciones pertenecen al contexto del animal.

No a pantallas independientes.

La Cubrición se registrará desde la ficha del animal utilizando el panel de acciones existente.

No se crearán nuevas rutas específicas.

No se introducirán asistentes adicionales.

No se añadirán pantallas exclusivas para reproducción.

### Impacto en futuras fases

La ficha del animal continuará consolidándose como centro operativo del sistema.

---

## Flujo esperado

```text
Ficha del animal

↓

Registrar evento

↓

Cubrición

↓

Formulario dinámico

↓

Guardar

↓

Ficha actualizada
```

El comportamiento debe sentirse coherente con el resto de acciones implementadas anteriormente.

El usuario no necesita comprender cómo funciona internamente el módulo reproductivo.

Únicamente registra un hecho biológico.

El sistema interpreta automáticamente sus consecuencias.

### Impacto en futuras fases

El mismo panel permitirá registrar cualquier otro evento reproductivo reutilizando exactamente la misma experiencia de usuario.

---

## Formularios dinámicos

La Cubrición reutiliza el sistema de formularios dinámicos ya introducido en fases anteriores.

Cada acción continúa mostrando únicamente los campos necesarios para completar la operación solicitada.

No deben construirse formularios genéricos que intenten resolver simultáneamente todos los eventos reproductivos.

La simplicidad operacional continúa siendo prioritaria.

### Impacto en futuras fases

Nuevos eventos podrán añadirse como nuevas variantes del formulario sin modificar la navegación general.

---

# Alcance funcional

## ✅ Incluir

Durante esta fase se implementará exclusivamente:

- registro de Cubrición;
- construcción del ReproductiveContext;
- validación mediante ReproductiveEligibilityRules;
- gestión básica del ciclo mediante ReproductiveCycleRules;
- construcción del snapshot mediante ReproductiveProjection;
- apertura o reutilización del ciclo reproductivo;
- proyección del estado reproductivo;
- cálculo de fecha prevista de parto;
- cálculo de días restantes;
- persistencia del snapshot derivado.

El objetivo consiste en validar el patrón arquitectónico completo.

No desarrollar todavía todo el dominio reproductivo.

---

## ❌ No incluir

No forman parte del alcance de PRD007:

### Eventos biológicos posteriores

- Parto;
- Aborto;
- Destete.

---

### Diagnóstico reproductivo

- confirmación de gestación;
- repeticiones;
- pérdidas embrionarias.

---

### Automatizaciones

- alertas;
- recordatorios;
- calendario reproductivo;
- tareas automáticas.

---

### Analítica

- indicadores reproductivos;
- estadísticas;
- cuadros de mando.

---

### Integraciones

- dispositivos externos;
- sensores;
- sistemas veterinarios.

El objetivo continúa siendo validar la arquitectura.

No completar todavía el módulo reproductivo.

---

# Preparación para PRD008

Al finalizar esta fase el proyecto dispondrá de un dominio reproductivo completamente estructurado.

Las siguientes fases dejarán de centrarse en construir infraestructura.

Su responsabilidad consistirá en ampliar el conocimiento existente.

Cada nuevo evento deberá responder únicamente a tres preguntas:

```text
¿Qué información necesita el contexto?

↓

¿Qué reglas del dominio deben ampliarse?

↓

¿Qué información debe proyectarse?
```

La arquitectura permanecerá invariable.

Únicamente evolucionará el conocimiento que contiene.

### Impacto en futuras fases

PRD008 podrá concentrarse casi exclusivamente en el comportamiento funcional del siguiente evento reproductivo, reutilizando íntegramente la infraestructura consolidada en esta fase.

# Reglas técnicas

Toda implementación realizada durante esta fase deberá respetar las siguientes normas.

---

## 1. No romper la arquitectura existente

El objetivo de PRD007 consiste en ampliar la arquitectura del sistema.

Nunca sustituir la arquitectura validada en fases anteriores.

La nueva infraestructura debe integrarse sobre:

- eventos como fuente de verdad;
- snapshots derivados;
- RPC transaccionales;
- separación de capas.

---

## 2. Mantener responsabilidades claras

Cada componente del módulo reproductivo debe tener una única responsabilidad.

Evitar clases que:

- interpreten reglas;
- construyan proyecciones;
- persistan información;
- coordinen casos de uso;

simultáneamente.

---

## 3. El dominio nunca depende de infraestructura

Las reglas reproductivas no deben conocer:

- Supabase;
- SQL;
- RPC;
- repositorios;
- componentes UI.

El dominio únicamente interpreta conocimiento del negocio.

---

## 4. Reutilizar antes que duplicar

Toda nueva regla eproductiva debe incorporarse ampliando el dominio existente mediante el patrón Context → Rules → Projection.

Evitar:

- nuevas implementaciones equivalentes;
- lógica repetida;
- cálculos duplicados;
- validaciones distribuidas.

---

## 5. Mantener el dominio explícito

Priorizar:

- nombres descriptivos;
- reglas fáciles de localizar;
- responsabilidades pequeñas;
- comportamiento predecible.

Evitar abstracciones cuyo objetivo sea únicamente reducir líneas de código.

---

## 6. Toda información derivada debe ser determinista

Una misma secuencia de eventos debe producir siempre exactamente el mismo snapshot.

Nunca introducir cálculos dependientes del frontend o de estados temporales.

---

## 7. Preparar el dominio para crecer

Toda decisión tomada durante esta fase debe facilitar la incorporación posterior de:

- Parto;
- Aborto;
- Destete;
- Confirmación de gestación;
- nuevos estados derivados.

No optimizar únicamente para la Cubrición.

---

### Impacto en futuras fases

Estas reglas pasarán a formar parte de las normas permanentes del módulo reproductivo.

---

# Entregables esperados

La fase deberá finalizar con:

- primera implementación operativa del patrón Context → Rules → Projection en el dominio reproductivo;
- ReproductiveContext implementado;
- ReproductiveEligibilityRules implementadas;
- ReproductiveCycleRules implementadas;
- ReproductiveProjection implementada;
- registro de Cubrición operativo;
- apertura o reutilización automática del ciclo;
- snapshot reproductivo actualizado;
- cálculo de fecha prevista de parto;
- cálculo de días restantes;
- ficha preparada para futuros eventos reproductivos;
- arquitectura reutilizable para el resto del módulo.

---

# Riesgos a evitar

Evitar especialmente:

- convertir ReproductiveContext en un servicio de dominio;
- mezclar contexto y snapshot;
- proyectar estados desde los Use Cases;
- introducir lógica reproductiva en el frontend;
- persistir información que pueda derivarse;
- repartir reglas entre distintos componentes;
- crear excepciones específicas para la Cubrición;
- diseñar una arquitectura difícil de reutilizar.

El objetivo de esta fase es construir una base sólida.

No resolver todavía todos los escenarios reproductivos.

---

# Resultado esperado real

Al finalizar PRD007 la aplicación deberá demostrar que un evento reproductivo puede recorrer completamente un dominio especializado sin que el caso de uso conozca las reglas biológicas.

El flujo conceptual esperado será:

```text
Evento

↓

ReproductiveContext

↓

ReproductiveEligibilityRules

↓

ReproductiveCycleRules

↓

ReproductiveProjection

↓

Snapshot persistido
```

La Cubrición habrá validado este recorrido de extremo a extremo.

El verdadero resultado de la fase no será únicamente registrar una cubrición.

Será disponer del primer dominio que implementa correctamente el patrón Context → Rules → Projection, manteniendo el Use Case como coordinador de la operación. La solución será plenamente operativa y preparada para soportar toda la evolución futura del módulo reproductivo.

La aplicación habrá evolucionado desde un conjunto de casos de uso independientes hacia un dominio capaz de interpretar conocimiento biológico de forma estructurada, reutilizable y mantenible.

---

# Forma de trabajo

## 1. NO avanzar más allá de lo pedido

Implementar únicamente los objetivos definidos para esta fase.

La infraestructura debe quedar preparada para crecer, pero las funcionalidades futuras no deben desarrollarse todavía.

---

## 2. Explicar antes de implementar

Antes de escribir código:

- explicar qué se va a construir;
- justificar las decisiones arquitectónicas;
- identificar los riesgos;
- ddescribir cómo encaja cada cambio dentro del dominio y, cuando aplique, dentro del patrón Context → Rules → Projection.

---

## 3. Trabajar en pasos pequeños

Cada paso debe perseguir un único objetivo claramente identificable.

Evitar modificaciones amplias que dificulten revisar el comportamiento del dominio.

---

## 4. Mostrar siempre

En cada iteración indicar:

- archivos creados o modificados;
- código completo;
- explicación breve;
- relación con el patrón arquitectónico definido en PRD007.

---

## 5. Documentar

Toda decisión relevante tomada durante la implementación deberá incorporarse a la documentación permanente del proyecto.

Especialmente:

- nuevos patrones;
- decisiones arquitectónicas;
- evolución del dominio reproductivo;
- modificaciones del modelo funcional.

El objetivo no consiste únicamente en implementar la funcionalidad.

Consiste en consolidar conocimiento reutilizable para las siguientes fases.