# Principios Arquitectónicos

## Objetivo

Este documento define los principios fundamentales sobre los que se construye toda la arquitectura del proyecto.

No describe implementaciones concretas ni decisiones propias de un dominio específico.

Su finalidad es establecer un conjunto estable de reglas que sirvan como guía para todas las decisiones arquitectónicas presentes y futuras.

Los principios definidos aquí tienen prioridad sobre cualquier PRD cuando exista una duda de diseño o arquitectura.

---

# Filosofía

La arquitectura del proyecto busca mantener un equilibrio entre simplicidad, evolución y consistencia.

No pretende imponer una estructura compleja desde el inicio.

La arquitectura debe evolucionar junto con el dominio, incorporando nuevas soluciones únicamente cuando el crecimiento del sistema las haga necesarias.

Los principios representan aquello que el proyecto considera permanente.

Los patrones representan soluciones reutilizables construidas sobre esos principios.

Los dominios aplican únicamente los principios y patrones que realmente necesitan.

---

# Organización de la arquitectura

La documentación arquitectónica del proyecto se organiza en tres niveles claramente diferenciados.

## 1. Principios

Los principios representan las reglas fundamentales del proyecto.

Son decisiones de largo recorrido que rara vez cambian y sobre las que se apoya toda la arquitectura.

Responden a la pregunta:

> **¿Qué creemos como proyecto?**

Actualmente los principios arquitectónicos son:

* El Use Case es la unidad arquitectónica por defecto.
* Los eventos constituyen la única fuente de verdad.
* Los snapshots representan únicamente estados derivados.
* El backend interpreta el dominio.
* El dominio es independiente de la infraestructura.
* Cada componente posee una única responsabilidad.
* La arquitectura evoluciona junto al dominio.

Cada uno de estos principios se desarrolla en su propio documento.

---

## 2. Patrones

Los patrones representan soluciones arquitectónicas reutilizables.

No forman parte obligatoria de todos los desarrollos.

Se incorporan únicamente cuando un problema concreto lo justifica.

Responden a la pregunta:

> **¿Cómo resolvemos un tipo de problema cuando aparece?**

Ejemplos:

* Context → Rules → Projection.
* RPC transaccionales.

---

## 3. Dominios

Los dominios representan implementaciones concretas del negocio.

Cada dominio aplica los principios generales y utiliza únicamente los patrones que necesita.

Responden a la pregunta:

> **¿Cómo implementamos un área funcional concreta del sistema?**

Ejemplos:

* Ganadero.
* Reproductivo.
* Financiero.
* Sanitario.

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

# Principios fundamentales

## 1. El Use Case es la unidad arquitectónica por defecto

Toda nueva funcionalidad debe comenzar implementándose mediante un único Use Case.

Mientras la lógica permanezca cohesionada dentro de una única operación, no deben introducirse nuevas capas de dominio.

La simplicidad constituye siempre la primera opción arquitectónica.

---

## 2. Los eventos constituyen la única fuente de verdad

Todo hecho relevante del negocio debe representarse mediante uno o varios eventos.

Los eventos describen la historia del sistema.

Nunca deben reconstruirse a partir de estados derivados.

Este principio se desarrolla en `principles/event-first.md`.

---

## 3. Los snapshots representan únicamente estados derivados

Los snapshots existen exclusivamente para optimizar la lectura del sistema.

Nunca representan una segunda fuente de verdad.

Toda la información persistida en un snapshot debe poder reconstruirse completamente a partir de los eventos.

Este principio se desarrolla en `principles/snapshots.md`.

---

## 4. El backend interpreta el dominio

La interpretación de las reglas del negocio pertenece exclusivamente al backend.

El frontend expresa la intención del usuario.

La infraestructura ejecuta las operaciones necesarias.

Este principio se desarrolla en `principles/backend-centric.md`.

---

## 5. El dominio es independiente de la infraestructura

Las decisiones del dominio no deben depender de:

* la base de datos;
* el framework;
* el ORM;
* el mecanismo de persistencia;
* el proveedor cloud.

La infraestructura implementa el dominio.

Nunca lo define.

---

## 6. Cada componente posee una única responsabilidad

Toda pieza de la arquitectura debe tener un objetivo claramente identificable.

Debe evitarse que un mismo componente:

* interprete reglas;
* coordine operaciones;
* persista información;
* construya proyecciones;
* represente interfaces.

La separación de responsabilidades constituye uno de los pilares de la mantenibilidad del proyecto.

---

## 7. La arquitectura evoluciona junto al dominio

Ningún dominio debe diseñarse suponiendo la utilización de un patrón arquitectónico concreto.

La elección de un patrón será consecuencia de la evolución del dominio, nunca un requisito previo.

Los nuevos patrones únicamente deben incorporarse cuando el crecimiento del sistema los justifique.

Este principio evita la sobrearquitectura y favorece una evolución incremental.

---

# Relación entre los principios

Los principios mantienen la siguiente dependencia conceptual.

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

Los eventos representan la historia del sistema.

Los snapshots proporcionan una representación optimizada para lectura.

Los patrones aparecen únicamente cuando un dominio necesita encapsular conocimiento reutilizable.

Finalmente, cada dominio aplica únicamente los principios y patrones que realmente necesita.

---

# Relación con el resto de la documentación

Este documento constituye el nivel superior de la arquitectura.

Los documentos del directorio `principles/` desarrollan cada principio individual.

Los documentos del directorio `patterns/` describen soluciones reutilizables construidas sobre estos principios.

Los documentos del directorio `modelo/` describen el conocimiento del negocio y no deben redefinir principios arquitectónicos.

En caso de conflicto entre un patrón, un dominio o un PRD y alguno de los principios definidos en este documento, prevalecerán siempre los principios arquitectónicos.

---

# Conclusión

La arquitectura del proyecto no se construye alrededor de tecnologías concretas.

Se construye alrededor de principios.

Los patrones constituyen herramientas para aplicar dichos principios.

Los dominios representan la materialización del negocio utilizando únicamente los patrones que realmente necesitan.

Mantener esta jerarquía permitirá que el sistema evolucione de forma coherente durante todo su ciclo de vida, minimizando la complejidad accidental y favoreciendo un crecimiento incremental de la arquitectura.
