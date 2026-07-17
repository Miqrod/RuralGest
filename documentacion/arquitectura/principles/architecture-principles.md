# Principios Arquitectónicos

## Objetivo

Este documento recoge los principios fundamentales sobre los que se construye toda la arquitectura del proyecto.

No describe implementaciones concretas.

No pertenece a ningún módulo específico.

Su finalidad es proporcionar un conjunto estable de reglas que sirvan de guía para todas las decisiones técnicas presentes y futuras.

Los principios definidos aquí tienen prioridad sobre cualquier PRD cuando exista una duda de diseño o arquitectura.

---

# Organización de la arquitectura

La documentación arquitectónica del proyecto se organiza en tres niveles claramente diferenciados.

## 1. Principios

Los principios representan las reglas fundamentales del proyecto.

Son decisiones de largo recorrido que rara vez cambian y sobre las que se apoya toda la arquitectura.

Ejemplos:

* el Use Case es la unidad arquitectónica por defecto;
* los eventos constituyen la única fuente de verdad;
* los snapshots representan estados derivados;
* el backend contiene toda la lógica del dominio.

Los principios responden a la pregunta:

> **¿Qué creemos como proyecto?**

---

## 2. Patrones

Los patrones representan soluciones arquitectónicas reutilizables.

No forman parte obligatoria de todos los desarrollos.

Se aplican únicamente cuando un problema concreto lo justifica.

Ejemplos:

* Context → Rules → Projection;
* RPC transaccionales.

Los patrones responden a la pregunta:

> **¿Cómo resolvemos un tipo de problema cuando aparece?**

---

## 3. Dominios

Los dominios representan implementaciones concretas del negocio.

Cada dominio aplica los principios generales y utiliza únicamente los patrones que necesita.

Ejemplos:

* Reproductivo;
* Financiero;
* Sanidad;
* Operaciones.

Los dominios responden a la pregunta:

> **¿Cómo implementamos un área funcional concreta del sistema?**

---

La relación entre estos tres niveles puede resumirse de la siguiente forma:

```text
Principios

↓

Patrones

↓

Dominios
```

Los principios inspiran los patrones.

Los patrones facilitan la implementación de los dominios.

Los dominios nunca redefinen los principios.

---

# Principio 1

## El Use Case es la unidad arquitectónica por defecto

Toda nueva funcionalidad deberá comenzar implementándose mediante un Use Case.

Mientras la lógica permanezca localizada dentro de una única operación, no deberán introducirse nuevas capas de dominio.

La simplicidad constituye la primera opción arquitectónica del proyecto.

---

# Principio 2

## El conocimiento reutilizable abandona el Use Case

Cuando un dominio acumule reglas de negocio reutilizables, persistentes y compartidas por varias funcionalidades, dichas reglas dejarán de vivir en el Use Case.

En ese momento deberán encapsularse mediante el patrón:

```text
Context

↓

Rules

↓

Projection
```

Este patrón constituye una evolución natural del dominio.

Nunca un punto de partida.

---

# Principio 3

## Los eventos constituyen la única fuente de verdad

Todo hecho relevante del negocio deberá representarse mediante un evento.

Los eventos describen la historia del sistema.

Nunca deberán reconstruirse a partir de estados derivados.

---

# Principio 4

## Los snapshots representan únicamente estados derivados

Los snapshots existen exclusivamente para optimizar las consultas.

Nunca representan una segunda fuente de verdad.

Toda la información persistida en un snapshot deberá poder reconstruirse completamente a partir de la historia de eventos.

---

# Principio 5

## El backend contiene toda la lógica del dominio

Las reglas del negocio pertenecen exclusivamente al backend.

El frontend:

* solicita operaciones;
* muestra resultados;
* guía la interacción del usuario.

Nunca interpreta reglas del dominio.

---

# Principio 6

## La infraestructura nunca define el dominio

Las decisiones del dominio deben ser independientes de:

* base de datos;
* ORM;
* RPC;
* framework;
* proveedor cloud.

La infraestructura implementa el dominio.

Nunca lo condiciona.

---

# Principio 7

## Cada componente posee una única responsabilidad

Toda pieza de la arquitectura deberá tener un objetivo claramente identificable.

Evitar componentes que simultáneamente:

* interpreten reglas;
* persistan información;
* coordinen operaciones;
* construyan interfaces.

La separación de responsabilidades constituye uno de los pilares de la mantenibilidad del proyecto.

---

# Principio 8

## La arquitectura evoluciona junto al dominio

Ningún dominio se diseñará suponiendo la utilización de un patrón arquitectónico concreto. La elección de un patrón será consecuencia de la evolución del dominio, nunca un requisito previo.

La arquitectura no debe anticiparse innecesariamente.

Los nuevos patrones únicamente se incorporarán cuando el crecimiento del dominio los justifique.

Este principio pretende evitar la sobrearquitectura y favorecer una evolución incremental del sistema.

---

# Relación entre los principios

Los principios mantienen la siguiente dependencia conceptual:

```text
Use Case

↓

Eventos

↓

Snapshots

↓

Patrones

↓

Dominios
```

El Use Case constituye el punto de partida.

Los eventos representan la historia.

Los snapshots optimizan la lectura.

Los patrones aparecen únicamente cuando el dominio necesita evolucionar.

Finalmente, cada dominio aplica únicamente los principios y patrones que realmente necesita.

---

# Relación con el resto de la documentación

Los principios definidos en este documento sirven de base para:

```text
Patterns/

↓

Context → Rules → Projection

RPC transaccionales
```

y para todos los dominios definidos en:

```text
Domains/

↓

Reproductivo

Financiero

Sanidad

Operaciones
```

Ningún patrón ni ningún dominio deberá contradecir los principios establecidos en este documento.

En caso de conflicto, este documento tendrá prioridad.

---

# Conclusión

La arquitectura del proyecto no se construye alrededor de tecnologías concretas.

Se construye alrededor de principios.

Los patrones constituyen herramientas para aplicar dichos principios.

Los dominios representan la materialización del negocio utilizando únicamente los patrones que realmente necesitan.

Mantener esta jerarquía permitirá que el sistema evolucione de forma coherente durante todo su ciclo de vida, minimizando la complejidad accidental y favoreciendo un crecimiento incremental de la arquitectura.
