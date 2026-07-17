# Principle: Event First

Este principio es independiente de cualquier patrón arquitectónico o dominio concreto y deberá respetarse en todo el proyecto.

## Objetivo

Este documento define uno de los principios fundamentales de la arquitectura del proyecto.

Todo hecho relevante del dominio debe representarse mediante un evento.

Los eventos constituyen la única fuente de verdad del sistema.

Todos los estados persistidos, proyecciones y snapshots son consecuencia de dichos eventos.

---

# Filosofía

El proyecto adopta una arquitectura **Event First**.

Esto significa que el sistema no almacena únicamente el estado actual de las entidades.

Almacena también la historia que explica cómo se ha llegado hasta dicho estado.

La historia pertenece a los eventos.

El estado pertenece a las proyecciones.

---

# Regla principal

Todo hecho relevante del dominio debe registrarse como un evento.

Ejemplos:

* compra;
* venta;
* muerte;
* cubrición;
* parto;
* tratamiento sanitario;
* movimiento financiero.

El evento constituye la representación oficial de lo ocurrido.

Nunca deberá deducirse posteriormente a partir de estados derivados.

---

# Fuente de verdad

La historia del sistema vive exclusivamente en los eventos.

```text id="4v7i1m"
Eventos

↓

Historia oficial
```

Los snapshots únicamente representan una fotografía optimizada para lectura.

```text id="8tx4fd"
Snapshots

↓

Estado observable
```

Ambos conceptos cumplen responsabilidades completamente distintas.

---

# Consecuencias

Adoptar este principio implica que:

* ningún estado podrá modificarse sin registrar previamente el evento correspondiente;
* toda proyección deberá derivarse de los eventos;
* cualquier snapshot podrá reconstruirse a partir de la historia registrada;
* las reglas del dominio siempre interpretarán eventos, nunca snapshots.

---

# Beneficios

La estrategia Event First proporciona:

* trazabilidad completa;
* reconstrucción del estado;
* auditoría funcional;
* menor duplicación de información;
* separación clara entre historia y lectura;
* evolución segura del dominio.

---

# Relación con los snapshots

Los snapshots no sustituyen a los eventos.

Los complementan.

Su objetivo consiste exclusivamente en optimizar las consultas.

Los eventos continúan siendo el origen de toda la información del sistema.

La relación entre ambos puede resumirse así:

```text id="7ibms0"
Eventos

↓

Interpretación del dominio

↓

Projection

↓

Snapshot
```

---

# Relación con el patrón Context → Rules → Projection

Cuando un dominio implementa el patrón **Context → Rules → Projection**, las Rules interpretan los eventos y Projection construye el snapshot derivado.

El patrón no modifica este principio.

Simplemente organiza la forma en que el dominio interpreta los eventos.

---

# Restricciones

Nunca:

* crear eventos a partir de snapshots;
* utilizar snapshots como fuente de verdad;
* modificar un estado derivado sin registrar previamente el evento correspondiente;
* duplicar la historia en varias estructuras persistidas.

---

# Conclusión

Todo estado observable del sistema debe poder explicarse mediante una secuencia de eventos previamente registrados.

Los eventos representan la historia.

Los snapshots representan únicamente una vista optimizada de dicha historia.

Este principio constituye uno de los pilares fundamentales sobre los que se construye toda la arquitectura del proyecto.
