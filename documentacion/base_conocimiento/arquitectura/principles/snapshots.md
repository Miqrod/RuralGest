# Principle: Snapshots

## Objetivo

Este documento define el principio arquitectónico que regula el uso de snapshots dentro del proyecto.

El Snapshot no representa la realidad. Representa el conocimiento actual del sistema sobre esa realidad.

Un Snapshot representa una vista persistida y optimizada del estado observable del sistema.

No constituye una fuente de verdad.

Su única finalidad consiste en facilitar la lectura del dominio sin perder la trazabilidad proporcionada por los eventos.

Este principio complementa directamente el definido en `event-first.md`.

---

# Filosofía

El proyecto distingue claramente entre:

* la historia del sistema;
* el conocimiento actual del sistema.

La historia pertenece a los eventos.

El conocimiento observable pertenece a los snapshots.

Mientras los eventos explican **qué ha ocurrido**, los snapshots responden a una pregunta distinta:

> **¿Cuál es el estado observable del sistema en este momento?**

---

# Qué es un Snapshot

Un Snapshot es una representación persistida del estado derivado de un conjunto de eventos.

No almacena historia.

No interpreta reglas.

No toma decisiones.

Únicamente conserva el resultado observable de interpretar correctamente la historia del dominio.

---

# Por qué existen los Snapshots

En teoría, cualquier consulta podría reconstruirse recorriendo toda la historia de eventos.

Sin embargo, hacerlo continuamente tendría un coste elevado y complicaría innecesariamente el sistema.

Por este motivo el proyecto adopta un modelo híbrido:

```text
Eventos

↓

Interpretación del dominio

↓

Projection

↓

Snapshot
```

Los eventos garantizan la consistencia.

Los snapshots optimizan las consultas.

Ambos forman parte de la misma arquitectura.

---

# Características fundamentales

Todo Snapshot debe cumplir las siguientes propiedades.

## 1. Es derivable

Toda la información almacenada debe poder reconstruirse completamente a partir de los eventos.

Si una información no puede reconstruirse, no pertenece a un Snapshot.

---

## 2. No es fuente de verdad

La historia del sistema nunca reside en un Snapshot.

Ante cualquier discrepancia, siempre prevalecen los eventos.

---

## 3. Es observable

Únicamente debe contener información útil para el resto del sistema.

Nunca información interna utilizada exclusivamente durante la interpretación del dominio.

---

## 4. Es prescindible

El sistema debe seguir siendo conceptualmente correcto incluso si todos los snapshots desaparecen.

Su pérdida únicamente debe afectar al rendimiento de lectura.

Nunca a la consistencia del dominio.

---

# ¿Cuándo persistir un Snapshot?

Persistir un Snapshot únicamente cuando:

* su cálculo vaya a reutilizarse con frecuencia;
* mejore significativamente el rendimiento;
* represente un estado observable del sistema;
* pueda reconstruirse íntegramente desde los eventos.

Si alguna de estas condiciones no se cumple, la información deberá calcularse bajo demanda.

---

# Qué debe contener

Un Snapshot debe contener únicamente información que resulte útil para consultar el estado actual del sistema.

Ejemplos:

* estado vital;
* estado reproductivo;
* ciclo reproductivo activo;
* fecha prevista de parto;
* días restantes;
* acciones disponibles;
* indicadores agregados.

Todos estos valores representan conocimiento observable derivado de los eventos.

---

# Qué NO debe contener

Un Snapshot nunca debe almacenar:

* reglas del dominio;
* estructuras auxiliares;
* información temporal utilizada por algoritmos;
* estados imposibles de reconstruir;
* decisiones tomadas por el frontend;
* información cuyo único propósito sea facilitar la implementación.

Todo ese conocimiento pertenece al dominio o a la infraestructura.

Nunca al Snapshot.

---

# Relación con Projection

Dentro del patrón **Context → Rules → Projection**, únicamente **Projection** puede construir o actualizar un Snapshot.

```text
Context

↓

Rules

↓

Projection

↓

Snapshot
```

El Snapshot nunca debe modificarse directamente desde un Use Case.

Tampoco desde el frontend.

Toda actualización debe producirse como consecuencia de interpretar correctamente los eventos del dominio.

---

# Ejemplos

## Correcto

```text
Eventos

↓

Projection

↓

estado_reproductivo
```

```text
Eventos

↓

Projection

↓

fecha_prevista_parto
```

```text
Eventos

↓

Projection

↓

dias_restantes
```

```text
Eventos

↓

Projection

↓

available_actions
```

Toda esta información es derivable y observable.

---

## Incorrecto

```text
Snapshot

↓

crear eventos
```

```text
Snapshot

↓

interpretar reglas
```

```text
Snapshot

↓

guardar variables internas del algoritmo
```

```text
Snapshot

↓

convertirse en la única copia del estado
```

Estos comportamientos contradicen la arquitectura del proyecto.

---

# Beneficios

La utilización de snapshots proporciona:

* consultas rápidas;
* menor complejidad en lectura;
* separación entre historia y estado observable;
* consistencia entre módulos;
* posibilidad de recalcular completamente el sistema cuando sea necesario;
* evolución del dominio sin perder trazabilidad.

---

# Relación con Event First

Los snapshots existen únicamente porque previamente existen eventos.

```text
Eventos

↓

Interpretación

↓

Projection

↓

Snapshot
```

Los eventos representan la historia.

Los snapshots representan el conocimiento observable obtenido al interpretar esa historia.

Ambos principios son inseparables.

---

# Conclusión

Los snapshots constituyen una optimización de lectura.

No representan una segunda fuente de verdad.

No contienen conocimiento propio.

Representan únicamente el conocimiento observable que el sistema ha derivado a partir de la historia registrada mediante eventos.

Su existencia permite consultar el sistema de forma eficiente sin comprometer la trazabilidad ni la consistencia del dominio.
