# Principle: Derived Snapshots

Este principio es independiente de cualquier patrón arquitectónico o dominio concreto y deberá respetarse en todo el proyecto.

## Objetivo

Este documento define el papel que desempeñan los **Snapshots Derivados** dentro de la arquitectura del proyecto.

Los snapshots existen exclusivamente para optimizar la lectura del sistema.

Nunca representan una segunda fuente de verdad.

Su contenido siempre debe derivarse de la historia de eventos.

---

# Filosofía

La arquitectura distingue claramente dos conceptos:

```text
Historia

↓

Eventos
```

```text
Lectura

↓

Snapshots
```

Los eventos describen lo ocurrido.

Los snapshots describen el estado observable resultante.

Cada uno posee una responsabilidad distinta.

---

# ¿Qué es un Snapshot?

Un Snapshot es una representación persistida del estado actual de una entidad.

Su finalidad consiste únicamente en evitar recalcular continuamente información que puede obtenerse de forma determinista.

No representa conocimiento adicional.

No sustituye a los eventos.

No almacena la historia.

Representa únicamente una fotografía optimizada para consulta.

---

# Principios fundamentales

Todo Snapshot debe cumplir simultáneamente las siguientes condiciones.

## 1. Es derivado

Toda la información almacenada debe obtenerse a partir de los eventos registrados.

Nunca debe introducir conocimiento nuevo.

---

## 2. Es reconstruible

Debe ser posible reconstruir completamente un Snapshot procesando nuevamente la historia de eventos.

Si esto no es posible, el Snapshot está almacenando información que no debería existir.

---

## 3. Es observable

Únicamente debe contener información útil para el resto del sistema.

Nunca información interna utilizada exclusivamente durante la interpretación del dominio.

---

## 4. Es prescindible

El sistema debe seguir siendo conceptualmente correcto incluso si el Snapshot desaparece.

Su pérdida únicamente debe afectar al rendimiento de lectura.

Nunca a la consistencia del dominio.

---

# ¿Cuándo persistir un Snapshot?

Persistir un Snapshot únicamente cuando:

* su cálculo sea reutilizado frecuentemente;
* mejore significativamente el rendimiento;
* represente un estado observable del sistema;
* pueda reconstruirse íntegramente desde los eventos.

Si alguna de estas condiciones no se cumple, la información deberá calcularse bajo demanda.

---

# ¿Qué NO debe contener?

Un Snapshot nunca debe almacenar:

* reglas del dominio;
* información temporal utilizada por algoritmos;
* estructuras auxiliares;
* estados imposibles de reconstruir;
* decisiones tomadas por el frontend.

Todo ese conocimiento pertenece al dominio o a la infraestructura.

Nunca al Snapshot.

---

# Relación con Projection

Dentro del patrón **Context → Rules → Projection**, únicamente **Projection** puede construir un Snapshot.

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

Toda actualización deberá producirse como consecuencia de la interpretación del dominio.

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

Estos comportamientos contradicen los principios arquitectónicos del proyecto.

---

# Beneficios

La utilización de snapshots derivados proporciona:

* consultas rápidas;
* menor complejidad en lectura;
* consistencia entre módulos;
* independencia entre historia y estado observable;
* posibilidad de recalcular completamente el sistema cuando sea necesario.

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

Los eventos continúan siendo la única fuente de verdad.

Los snapshots representan únicamente una optimización de lectura.

Ambos principios son inseparables.

---

# Relación con otros documentos

Este principio complementa:

```text
principles/event-first.md
```

y es utilizado por el patrón:

```text
patterns/context-rules-projection.md
```

Todos los dominios que implementen dicho patrón deberán respetar las reglas descritas en este documento.

---

# Conclusión

Los snapshots constituyen una optimización de lectura.

No representan una segunda fuente de verdad.

No contienen conocimiento propio.

Su única misión consiste en ofrecer al resto del sistema una representación observable, consistente y fácilmente consultable del estado derivado de los eventos.
