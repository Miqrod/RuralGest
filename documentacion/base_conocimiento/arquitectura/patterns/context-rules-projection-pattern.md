# Patrón Context → Rules → Projection

## Objetivo

Este documento define el patrón arquitectónico **Context → Rules → Projection (CRP)** utilizado por el proyecto para encapsular conocimiento de dominio reutilizable.

No describe un dominio concreto.

No pertenece a ningún PRD.

Forma parte de la arquitectura permanente del sistema y constituye la referencia para cualquier dominio cuya complejidad justifique separar el conocimiento del negocio del Use Case.

El objetivo del patrón no consiste en añadir nuevas capas a la arquitectura.

Su finalidad es mantener el conocimiento del dominio cohesionado, reutilizable y desacoplado de las operaciones que lo utilizan.

Este patrón complementa la arquitectura basada en Use Cases.

Nunca la sustituye.

---

## Problema que resuelve

La arquitectura del proyecto parte de un principio muy sencillo: cada nueva funcionalidad debe implementarse inicialmente mediante un Use Case.

Mientras toda la lógica pertenezca a una única operación, esta arquitectura resulta suficiente.

Sin embargo, algunos dominios evolucionan de forma distinta.

Las mismas reglas empiezan a reutilizarse.

Varios Use Cases necesitan interpretar el mismo conocimiento.

Las modificaciones afectan simultáneamente a varias funcionalidades.

El conocimiento deja de pertenecer naturalmente a una única operación.

Si no se actúa en este momento, las reglas acaban repartidas entre distintos Use Cases, aparecen duplicidades y el dominio pierde cohesión.

Este patrón surge precisamente para evitar esa evolución.

---

# Evolución de un dominio

El patrón no nace durante el diseño inicial.

Nace cuando el dominio alcanza un grado de madurez suficiente como para que varias operaciones compartan conocimiento.

Un dominio normalmente atraviesa las siguientes etapas.

## Etapa 1

Todo el comportamiento cabe dentro de un único Use Case.

No existe necesidad de introducir nuevas capas.

La simplicidad continúa siendo la mejor solución.

---

## Etapa 2

Empiezan a aparecer reglas compartidas entre varias funcionalidades.

Todavía pueden mantenerse dentro del Use Case.

El dominio continúa siendo suficientemente pequeño.

---

## Etapa 3

Las reglas comienzan a reutilizarse de forma sistemática.

Modificar una regla implica revisar varios Use Cases.

En este punto el conocimiento del dominio deja de pertenecer naturalmente al Use Case, a una única operación.

Es el momento de introducir el patrón Context → Rules → Projection.

La arquitectura evoluciona como consecuencia del dominio.

Nunca al revés.

---

## Principio fundamental

Este patrón parte de una idea sencilla.

> **Los Casos de Uso representan operaciones.**
>
> **El dominio representa conocimiento.**

Los Casos de Uso pueden multiplicarse con el crecimiento del sistema.

Mientras una regla sólo pertenece a una operación, esa regla vive dentro del Use Case.

Cuando varias operaciones comparten el mismo conocimiento, ese conocimiento deja de pertenecer a los Casos de Uso y pasa a convertirse en un elemento de primer nivel dentro de la arquitectura.

Como consecuencia, el conocimiento compartido deja de pertenecer a un caso de uso y pasa a convertirse en un elemento de primer nivel dentro de la arquitectura.

El patrón Context → Rules → Projection aparece exactamente en ese momento de la evolución del dominio, surge precisamente para conseguir esa separación.

El objetivo del patrón no consiste en reutilizar código.

Consiste en reutilizar conocimiento.

---

# Motivación

La arquitectura del proyecto adopta el **Use Case** como unidad arquitectónica por defecto.

En la mayoría de funcionalidades, un Use Case contiene toda la lógica necesaria para completar una operación.

Sin embargo, algunos dominios evolucionan hasta compartir reglas de negocio entre múltiples funcionalidades.

Cuando esto ocurre, mantener toda la lógica dentro del Use Case provoca:

* duplicación de reglas;
* dificultad para evolucionar el dominio;
* inconsistencias entre funcionalidades;
* pérdida de cohesión.

El patrón **Context → Rules → Projection** nace para resolver este problema.

No sustituye al Use Case.

Extrae únicamente el conocimiento reutilizable del dominio.

El objetivo del patrón no es añadir capas arquitectónicas.

Su objetivo es evitar que el conocimiento del dominio quede repartido entre múltiples operaciones independientes.

# Ventajas del patrón

La utilización del patrón proporciona:
* separación clara de responsabilidades;
* reutilización del conocimiento;
* menor duplicación;
* mayor cohesión;
* mayor mantenibilidad;
* evolución incremental del dominio;
* independencia entre dominio e infraestructura.

# Cuándo utilizar este patrón

El patrón debe utilizarse únicamente cuando el dominio lo justifique.

Normalmente esto ocurre cuando concurren varias de las siguientes circunstancias:

- existen múltiples Use Cases relacionados;
- todos reutilizan una parte importante de las mismas reglas;
- las reglas evolucionan conjuntamente;
- el dominio posee un lenguaje propio;
- comienza a aparecer duplicación de lógica;
- el estado observable depende del conjunto del dominio y no únicamente de un evento aislado.

En estas situaciones, el conocimiento deja de pertenecer naturalmente al Use Case y pasa a convertirse en una responsabilidad propia del dominio.

# Cuándo NO utilizar este patrón

Este patrón no constituye la arquitectura por defecto del proyecto.

No aporta valor cuando:

- el Use Case es prácticamente independiente;
- apenas existen reglas compartidas;
- la lógica de negocio es sencilla;
- introducir nuevas capas únicamente incrementaría la complejidad.

En estos casos, la arquitectura tradicional basada en Use Cases continúa siendo la solución recomendada.

La simplicidad siempre debe prevalecer cuando el dominio no justifique una mayor abstracción.

---

# Filosofía

El patrón divide el conocimiento del dominio en tres responsabilidades complementarias.

Ninguna sustituye a las demás.

Cada una responde a una pregunta distinta.

## Context

"Describe la realidad".

El Context representa toda la información necesaria para interpretar correctamente una operación del dominio.

Su misión consiste únicamente en transportar información hacia las Rules.

Debe comportarse como una fotografía del dominio en el instante previo a la interpretación.

## Rules

Interpretan esa realidad.

## Projection

Construye el resultado observable.

Cada componente posee una única responsabilidad.

Esta separación permite que el conocimiento del dominio evolucione sin afectar al resto de la arquitectura.

---

# Relación con la arquitectura del proyecto

La arquitectura general permanece inalterada.

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

Cuando un dominio requiere reglas reutilizables, el Use Case incorpora una etapa adicional de interpretación.

```text
Frontend

↓

Use Case

↓

(opcional)

Context

↓

Rules

↓

Projection

↓

Repository

↓

RPC

↓

Base de datos
```

La palabra **opcional** es fundamental.

El patrón únicamente aparece cuando el dominio lo necesita.

---

# Componentes del patrón

## Context

El Context representa toda la información necesaria para interpretar correctamente una operación del dominio.

Su misión consiste únicamente en transportar información, en reunir los hechos relevantes del dominio antes de aplicar las reglas.

No interpreta ni toma decisiones.

Simplemente proporciona el contexto necesario para que las Rules puedan trabajar.

Puede contener:

* entidades;
* eventos previos;
* ciclos;
* relaciones;
* parámetros del evento recibido;
* cualquier dato necesario para interpretar el dominio.

El Context nunca:

* calcula;
* modifica estados;
* consulta infraestructura;
* construye snapshots.

Debe comportarse como una fotografía del dominio en el instante previo a la interpretación.

---

## Rules

Las Rules contienen todo el conocimiento del dominio.

Son responsables de responder preguntas como:

* ¿es válido este evento?
* ¿qué consecuencias produce?
* ¿cómo evoluciona el dominio?
* ¿qué información debe derivarse?

Las Rules nunca conocen:

* frontend;
* repositorios;
* SQL;
* RPC;
* infraestructura;
* persistencia.

Su única responsabilidad consiste en interpretar correctamente el dominio, en transformar información en decisiones del dominio.

Las Rules:
* interpretan eventos;
* aplican invariantes;
* calculan consecuencias;
* determinan el estado lógico del dominio.

El Use Case y las Rules no compiten, se complementan.

Cuando el conocimiento crece, las Rules pueden dividirse en varios componentes especializados.

Por ejemplo:

```text
EligibilityRules

CycleRules

CalculationRules

ValidationRules
```

La organización concreta dependerá de cada dominio.

---

## Projection

Projection transforma el resultado del dominio obtenido por las Rules en un estado observable.

Projection construye o analiza el snapshot correspondiente a la nueva versión del dominio.

No interpreta reglas.

No modifica el dominio.

Construye la información que el resto del sistema necesita consultar.

Una proyección únicamente debe contener información que cumpla simultáneamente las siguientes condiciones:

* es completamente derivable;
* aporta valor para lectura;
* pertenece al estado observable del sistema.

Nunca debe almacenar información utilizada únicamente por el algoritmo interno.

---

# Flujo conceptual

El patrón puede resumirse mediante la siguiente secuencia:

```text
Evento

↓

Context

↓

Rules

↓

Projection

↓

Snapshot
```

Cada etapa añade significado.

Ninguna etapa duplica responsabilidades.

---

# Relación con los Use Cases

Una de las decisiones fundamentales de esta arquitectura consiste en diferenciar claramente dos conceptos.

## El Use Case orquesta

Responsabilidades:

* iniciar la operación;
* obtener la información necesaria;
* construir el Context;
* ejecutar el dominio;
* solicitar la persistencia;
* devolver el resultado.

El Use Case coordina.

No interpreta.

---

## Las Rules interpretan

Las Rules representan el conocimiento del negocio.

Su responsabilidad consiste en transformar información en decisiones del dominio.

El Use Case y las Rules no compiten.

Se complementan.

---

# Errores habituales

No utilizar este patrón para:

* reducir líneas de código;
* seguir una moda arquitectónica;
* crear más capas;
* anticipar necesidades futuras sin evidencia.

Tampoco debe utilizarse cuando un único Use Case resuelve completamente el problema.

La simplicidad continúa siendo la prioridad.

---

# Relación con los snapshots

Projection construye un Snapshot.

El Snapshot nunca constituye una fuente de verdad.

Representa únicamente un estado persistido optimizado para lectura.

Los eventos continúan siendo el origen de toda la información del dominio.

---

# Relación con otros principios

Este patrón se apoya en los principios definidos en:

- principles/event-first.md
- principles/snapshots.md
- principles/backend-centric.md

No modifica dichos principios.

Los aplica para organizar el conocimiento dentro de dominios complejos.

---

# Dominios candidatos

No todos los dominios necesitan este patrón.

En el momento de redactar esta documentación, el principal candidato es:

- Reproductivo.

En el futuro podrían evolucionar de forma similar otros dominios como:

- Sanidad.
- Producción.
- Genética.
- Bienestar animal.

La decisión dependerá siempre de la evolución real del dominio.

Nunca de una planificación previa.

---

# Checklist de adopción

Antes de introducir este patrón en un nuevo dominio conviene responder las siguientes preguntas.

- ¿Existen varios Use Cases relacionados?
- ¿Comparten reglas importantes?
- ¿Las reglas evolucionan conjuntamente?
- ¿Empieza a aparecer lógica duplicada?
- ¿Existe un lenguaje propio del dominio?
- ¿Modificar una regla obliga a cambiar varios Use Cases?

Si la mayoría de respuestas son afirmativas, probablemente el patrón resulte adecuado.

En caso contrario, la arquitectura tradicional basada en Use Cases seguirá siendo la opción preferible.

---

# Conclusión

El patrón **Context → Rules → Projection** constituye una herramienta arquitectónica para modelar dominios complejos.

No reemplaza al Use Case.

Lo complementa cuando el conocimiento del negocio deja de pertenecer naturalmente a una única operación.

Su objetivo es mantener la arquitectura sencilla durante las primeras fases del proyecto y permitir una evolución controlada cuando determinados dominios requieren encapsular reglas reutilizables.
