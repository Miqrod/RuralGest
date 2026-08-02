# Principle: Event First

## Objetivo

Este documento define el principio arquitectónico más importante del proyecto.

Todo hecho relevante del dominio debe representarse mediante uno o varios eventos.

Los eventos constituyen la única fuente de verdad del sistema.

Todos los estados persistidos, proyecciones y snapshots son consecuencia de dichos eventos.

Este principio es independiente de cualquier patrón arquitectónico o dominio concreto y deberá respetarse en todo el proyecto.

---

# Matiz importante

El proyecto no implementa Event Sourcing puro. Implementa una arquitectura Event First basada en Eventos + Proyecciones + Snapshots.

---

# Filosofía

El proyecto adopta una arquitectura **Event First**.

Esto significa que el sistema no almacena únicamente el estado actual de las entidades.

Conserva también la historia que explica cómo se ha llegado hasta dicho estado.

La historia pertenece a los eventos.

El estado observable pertenece a las proyecciones.

Esta decisión proporciona trazabilidad, coherencia y capacidad de evolución sin convertir el proyecto en un sistema de Event Sourcing puro.

---

# Qué significa Event First

Un evento representa un hecho del mundo real que ha ocurrido y que resulta relevante para el negocio.

Ejemplos:

* compra;
* nacimiento;
* venta;
* muerte;
* cubrición;
* parto;
* tratamiento sanitario;
* cambio de tipo productivo.

El evento constituye la representación oficial de lo ocurrido.

Nunca debe deducirse posteriormente a partir del estado de una entidad.

---

# Qué NO significa Event First

El proyecto **no implementa Event Sourcing puro**.

No todas las lecturas se reconstruyen continuamente desde la historia completa.

En su lugar se utiliza un modelo híbrido:

```text id="k2dj0z"
Eventos

↓

Interpretación del dominio

↓

Projection

↓

Snapshot
```

Los eventos constituyen la fuente de verdad.

Los snapshots proporcionan una representación persistida optimizada para consulta.

Ambos conceptos se complementan.

Nunca compiten.

---

# Fuente de verdad

La historia del sistema vive exclusivamente en los eventos.

```text id="cx5mle"
Eventos

↓

Historia oficial
```

Los snapshots representan únicamente el estado observable del sistema.

```text id="pbjpcd"
Snapshots

↓

Estado observable
```

Toda la información almacenada en un snapshot debe poder reconstruirse completamente a partir de los eventos.

---

# Consecuencias arquitectónicas

Adoptar este principio implica que:

* ningún estado podrá modificarse sin registrar previamente el evento correspondiente;
* toda proyección deberá derivarse de los eventos;
* cualquier snapshot podrá reconstruirse a partir de la historia registrada;
* las reglas del dominio siempre interpretarán eventos, nunca snapshots;
* el frontend nunca decidirá qué eventos deben producirse.

---

# Inmutabilidad

Los eventos representan hechos históricos.

Por tanto:

* no se editan;
* no se eliminan;
* no se sobrescriben.

Cuando una información deba corregirse, el sistema registrará un nuevo evento que compense o complete la historia existente.

La historia nunca se reescribe.

---

# Beneficios

La estrategia Event First proporciona:

* trazabilidad completa;
* reconstrucción del estado;
* auditoría funcional;
* separación entre historia y estado observable;
* menor duplicación de información;
* mayor facilidad para evolucionar el dominio;
* posibilidad de recalcular completamente las proyecciones cuando sea necesario.

---

# Errores habituales

Este principio pretende evitar situaciones como:

* crear estados sin registrar el evento correspondiente;
* utilizar snapshots como fuente de verdad;
* modificar directamente un estado derivado;
* deducir eventos a partir del estado actual;
* representar acciones técnicas en lugar de hechos del negocio;
* almacenar información derivable dentro de un evento.

---

# Relación con los snapshots

Los snapshots existen únicamente porque previamente existen eventos.

```text id="0p8ozr"
Eventos

↓

Interpretación

↓

Projection

↓

Snapshot
```

Los snapshots optimizan la lectura.

Los eventos conservan la historia.

Este principio se complementa con `principles/snapshots.md`.

---

# Relación con Context → Rules → Projection

Cuando un dominio implementa el patrón **Context → Rules → Projection**, las Rules interpretan los eventos y Projection construye el snapshot derivado.

El patrón no modifica el principio Event First.

Simplemente organiza la forma en que un dominio interpreta esa historia.

---

# Relación con Backend Centric

La decisión de qué eventos deben registrarse pertenece al backend.

La interfaz de usuario expresa la intención del usuario.

El backend interpreta esa intención y decide qué hechos del negocio deben quedar registrados.

---

# Conclusión

Todo estado observable del sistema debe poder explicarse mediante una secuencia de eventos previamente registrados.

Los eventos representan la historia.

Las proyecciones interpretan esa historia.

Los snapshots representan una vista optimizada para lectura.

Esta separación constituye uno de los pilares fundamentales sobre los que se construye toda la arquitectura del proyecto.
