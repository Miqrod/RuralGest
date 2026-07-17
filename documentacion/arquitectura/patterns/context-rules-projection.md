# Patrón Context → Rules → Projection

## Objetivo

Este documento define el patrón arquitectónico **Context → Rules → Projection (CRP)** utilizado por el proyecto para encapsular conocimiento de dominio reutilizable.

No describe un dominio concreto.

No pertenece a ningún PRD.

Forma parte de la arquitectura permanente del sistema y constituye la referencia para cualquier dominio cuya complejidad justifique separar el conocimiento del negocio del Use Case.

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

# Filosofía

El patrón separa tres responsabilidades completamente diferentes.

## Context

Describe la realidad.

## Rules

Interpretan esa realidad.

## Projection

Construye el resultado observable.

Cada componente posee una única responsabilidad.

Esta separación permite que el conocimiento del dominio evolucione sin afectar al resto de la arquitectura.

---

# Componentes del patrón

## Context

El Context representa toda la información necesaria para interpretar correctamente una operación del dominio.

Su misión consiste únicamente en transportar información.

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

Su única responsabilidad consiste en interpretar correctamente el dominio.

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

Projection transforma el resultado del dominio en un estado observable.

No interpreta reglas.

No modifica el dominio.

Construye exclusivamente la información que el resto del sistema necesita consultar.

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

# Ventajas

La utilización del patrón proporciona:

* separación clara de responsabilidades;
* reutilización de reglas;
* menor duplicación;
* mayor cohesión;
* mayor mantenibilidad;
* evolución incremental del dominio;
* independencia entre dominio e infraestructura.

---

# Evolución de un dominio

Un dominio normalmente atraviesa las siguientes etapas.

## Etapa 1

Todo el comportamiento cabe dentro de un único Use Case.

No existe necesidad de introducir nuevas capas.

---

## Etapa 2

Empiezan a aparecer reglas compartidas entre varias funcionalidades.

Todavía pueden mantenerse dentro del Use Case.

---

## Etapa 3

Las reglas comienzan a reutilizarse de forma sistemática.

En este punto el conocimiento del dominio deja de pertenecer naturalmente al Use Case.

Es el momento de introducir el patrón Context → Rules → Projection.

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

# Relación con otros documentos

Este patrón se apoya en los principios definidos en:

```text
documentacion/arquitectura/principles/architecture-principles.md
```

Cada dominio que adopte este patrón deberá documentar su implementación específica dentro de:

```text
documentacion/arquitectura/domains/
```

---

# Conclusión

El patrón **Context → Rules → Projection** constituye una herramienta arquitectónica para dominios complejos.

No reemplaza al Use Case.

Lo complementa cuando el conocimiento del negocio deja de pertenecer naturalmente a una única operación.

Su objetivo es mantener la arquitectura sencilla durante las primeras fases del proyecto y permitir una evolución controlada cuando determinados dominios requieren encapsular reglas reutilizables.
