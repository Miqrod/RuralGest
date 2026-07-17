# Context → Rules → Projection Pattern Specification

Este documento tiene prioridad sobre cualquier PRD cuando existan dudas sobre si un nuevo desarrollo debe introducir o no el patrón Context → Rules → Projection.

## Objetivo

Este documento define cuándo debe utilizarse el patrón **Context → Rules → Projection (CRP)** dentro del proyecto.

No describe una implementación concreta ni un dominio específico.

Su objetivo es garantizar que todos los nuevos desarrollos apliquen el mismo criterio arquitectónico y evitar tanto el infra-diseño como la sobrearquitectura.

---

# Principio fundamental

> **El Use Case es la unidad arquitectónica por defecto del proyecto.**

Solo cuando un dominio acumule reglas de negocio reutilizables, persistentes y compartidas por varias funcionalidades deberá extraerse dicho conocimiento del Use Case mediante el patrón:

```text
Context

↓

Rules

↓

Projection
```

Este patrón es una especialización de la arquitectura general del proyecto.

No sustituye al Use Case.

Lo complementa cuando la complejidad del dominio lo requiere.

---

# Cuándo utilizar este patrón

Utilizar el patrón **únicamente** cuando se cumplan la mayoría de las siguientes condiciones:

* existen varias funcionalidades sobre el mismo dominio;
* dichas funcionalidades comparten reglas de negocio;
* las reglas evolucionarán con el tiempo;
* el dominio necesita construir estados derivados reutilizables;
* mantener toda la lógica dentro del Use Case dificultaría su evolución.

Ejemplos adecuados:

* reproducción;
* sanidad;
* finanzas;
* operaciones complejas.

---

# Cuándo NO utilizar este patrón

No utilizar este patrón cuando:

* el comportamiento pertenece únicamente a un Use Case;
* las reglas son simples;
* no existe reutilización prevista;
* el dominio no necesita snapshots derivados;
* introducir nuevas capas únicamente aumentaría la complejidad.

En estos casos el conocimiento debe permanecer dentro del propio Use Case.

---

# Patrón general

Cuando el patrón resulte necesario, la estructura conceptual será siempre la siguiente:

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

La parte opcional únicamente aparece cuando el dominio justifica encapsular conocimiento reutilizable.

---

# Responsabilidades

## Use Case

Responsable de:

* coordinar la operación;
* obtener la información necesaria;
* construir el Context;
* invocar el dominio;
* solicitar la persistencia;
* devolver el resultado.

Nunca debe contener reglas complejas del dominio.

---

## Context

Responsable de transportar toda la información necesaria para interpretar correctamente un evento.

Nunca:

* calcula;
* proyecta;
* persiste;
* consulta infraestructura.

---

## Rules

Responsables de interpretar el dominio.

Contienen todo el conocimiento del negocio.

Nunca conocen:

* frontend;
* repositorios;
* SQL;
* RPC;
* infraestructura.

---

## Projection

Responsable de construir el estado observable del dominio.

Debe contener únicamente información útil para lectura.

Nunca información necesaria únicamente para el algoritmo interno.

---

# Reglas obligatorias

Todo dominio que implemente este patrón deberá respetar los siguientes principios:

* los eventos continúan siendo la única fuente de verdad;
* los snapshots representan únicamente estados derivados;
* el dominio permanece independiente de la infraestructura;
* las reglas viven exclusivamente dentro del dominio;
* el frontend nunca interpreta reglas de negocio;
* toda proyección debe poder reconstruirse a partir de los eventos.

---

# Checklist

Antes de introducir el patrón responder:

## 1.

¿El Use Case está acumulando reglas reutilizables?

□ Sí

□ No

---

## 2.

¿Varias funcionalidades compartirán esas reglas?

□ Sí

□ No

---

## 3.

¿El dominio necesita construir snapshots derivados?

□ Sí

□ No

---

## 4.

¿Las reglas evolucionarán previsiblemente con el tiempo?

□ Sí

□ No

---

## Decisión

Si la mayoría de respuestas son **Sí**, utilizar el patrón Context → Rules → Projection.

En caso contrario, mantener la implementación dentro del Use Case.

---

# Estado actual del proyecto

Actualmente el patrón se aplica únicamente al dominio reproductivo.

Los futuros dominios deberán justificar explícitamente su adopción antes de incorporarlo a la arquitectura.

El uso del patrón nunca constituye un objetivo por sí mismo.

Su finalidad es mantener el dominio comprensible, reutilizable y fácil de evolucionar.
