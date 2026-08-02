# Arquitectura del sistema

## Objetivo

El directorio `arquitectura/` describe la arquitectura conceptual de la aplicación.

Su finalidad es explicar cómo está construido el sistema desde el punto de vista arquitectónico, independientemente de su implementación concreta.

Mientras el directorio `modelo/` describe la realidad que representa la aplicación, `arquitectura/` describe los principios y mecanismos utilizados para implementarla.

---

# Filosofía

La arquitectura define las reglas estructurales que deben respetar todos los dominios de la aplicación.

Estas reglas son independientes del negocio concreto y deben permanecer estables aunque evolucionen los módulos funcionales.

La arquitectura establece cómo se organizan los distintos elementos del sistema, cómo interactúan entre sí y qué principios deben cumplirse para mantener la coherencia del conjunto.

---

# Organización

El conocimiento arquitectónico se organiza en tres niveles.

```text
arquitectura/
│
├── overview.md
├── principles/
├── patterns/
└── decisiones/
```

---

## principles/

Contiene los principios arquitectónicos fundamentales del sistema.

Son reglas permanentes que deben cumplirse en cualquier implementación.

Ejemplos:

* Event First.
* Source of Truth.
* Backend Centric.
* Snapshot como proyección.
* Determinismo.
* Idempotencia.

Los principios responden a la pregunta:

> ¿Qué reglas nunca deben romperse?

---

## patterns/

Describe patrones reutilizables que pueden aplicarse en distintos dominios de la aplicación.

Un patrón representa una solución arquitectónica recurrente para un problema determinado.

Ejemplos:

* Context + Rules + Projection.
* RPC Transactions.
* Available Actions.
* Projection Pattern.

Los patrones responden a la pregunta:

> ¿Cómo resolvemos este tipo de problema cuando aparece?

---

## decisiones/

Recoge únicamente decisiones arquitectónicas excepcionales que afectan a todo el sistema.

No pretende documentar decisiones propias de un dominio concreto.

Cuando una decisión pertenece exclusivamente a un módulo funcional, debe documentarse en el propio documento de ese dominio.

---

# Alcance

La documentación arquitectónica describe:

* principios;
* patrones;
* decisiones transversales;
* relaciones entre capas;
* mecanismos generales del sistema.

No describe:

* reglas de negocio;
* modelos ganaderos;
* procesos reproductivos;
* flujos funcionales específicos.

Ese conocimiento pertenece al directorio `modelo/`.

---

# Relación con el resto de la Base de Conocimiento

Cada bloque documental aborda el sistema desde una perspectiva distinta.

* **arquitectura/** explica cómo está construido el sistema.
* **modelo/** explica qué representa el sistema.
* **flujos/** describen cómo se ejecutan los procesos de negocio.
* **implementación/** documenta la materialización técnica de la arquitectura.
* **glosario_de_dominio.md** mantiene el lenguaje ubicuo compartido por toda la documentación.

Cada concepto debe documentarse en el bloque propietario de ese conocimiento, evitando duplicidades y manteniendo una única fuente de verdad documental.

---

# Principios

Toda evolución arquitectónica debe respetar los principios definidos en `principles/`.

Los patrones reutilizables deberán construirse siempre sobre dichos principios.

Las decisiones arquitectónicas solo se incorporarán cuando introduzcan cambios permanentes que afecten al conjunto del sistema y no puedan explicarse adecuadamente dentro de un dominio concreto.

---

# Interacción entre usuario y dominio

Los usuarios interactúan con la aplicación mediante acciones de negocio. Los dominios representan el resultado de esas acciones mediante hechos.

Los usuarios trabajan mediante acciones

Los usuarios no interactúan con el modelo interno del dominio.

Realizan acciones propias de su actividad diaria utilizando el lenguaje del negocio.

* Registrar una compra.
* Registrar un parto.
* Vender un animal.
* Cambiar el tipo productivo.
* Mover un lote.

Estas acciones representan la forma natural de trabajar con la explotación.

Las acciones realizadas por el usuario no modifican directamente el estado del sistema.

Cada acción desencadena uno o varios casos de uso que registran los hechos correspondientes dentro del dominio.

Los estados observables se recalculan posteriormente como consecuencia de dichos hechos.

Esta separación permite mantener una representación consistente de la realidad sin exponer al usuario la complejidad del modelo interno.

Usuario

↓

Acción

↓

Caso de uso

↓

Dominio

↓

Eventos

↓

Proyecciones

↓

Estado observable
