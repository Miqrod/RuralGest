# Dominio Reproductivo

## Objetivo

Este documento describe la implementación del dominio reproductivo del proyecto.

El dominio reproductivo implementa el patrón arquitectónico **Context → Rules → Projection (CRP)** definido en:

```text
documentacion/arquitectura/patterns/context-rules-projection.md
```

Su objetivo es encapsular todo el conocimiento relacionado con la reproducción animal dentro de un único dominio cohesionado, reutilizable y desacoplado de la infraestructura.

Este documento recoge exclusivamente las decisiones específicas del dominio reproductivo.

Las reglas generales del patrón se encuentran documentadas en el documento arquitectónico correspondiente.

---

# Responsabilidad del dominio

El dominio reproductivo es responsable de interpretar todos los eventos relacionados con el ciclo reproductivo del animal.

Su misión consiste en responder preguntas como:

* ¿Puede registrarse este evento?
* ¿Cómo evoluciona el ciclo reproductivo?
* ¿Qué estado reproductivo debe observar el resto del sistema?
* ¿Qué información derivada debe persistirse?

No es responsable de:

* persistencia;
* interfaz de usuario;
* consultas SQL;
* RPC;
* infraestructura.

Toda esa responsabilidad permanece fuera del dominio.

---

# Organización interna

El dominio se estructura siguiendo el patrón Context → Rules → Projection.

```text
Reproductive Domain

↓

Context

↓

Rules

↓

Projection
```

Cada componente mantiene una responsabilidad única.

---

# ReproductiveContext

## Objetivo

Reunir toda la información necesaria para interpretar correctamente un evento reproductivo.

El Context representa el estado conocido del dominio antes de aplicar ninguna regla.

Inicialmente podrá contener:

* animal;
* ciclo reproductivo activo;
* último evento biológico;
* evento solicitado.

En futuras fases podrá ampliarse con nueva información siempre que sea necesaria para interpretar el dominio.

El Context nunca:

* calcula;
* persiste;
* modifica estados;
* interpreta reglas.

---

# ReproductiveRules

Las reglas del dominio se organizan en componentes especializados.

Inicialmente el dominio incorpora:

```text
ReproductiveEligibilityRules

ReproductiveCycleRules

ReproductiveProjection
```

Esta división podrá ampliarse conforme evolucione el módulo.

---

## ReproductiveEligibilityRules

Responsabilidad:

Determinar si un evento reproductivo puede registrarse.

Ejemplos de validaciones:

* elegibilidad del animal;
* compatibilidad del estado actual;
* restricciones biológicas;
* coherencia del evento solicitado.

No modifica información.

No construye snapshots.

---

## ReproductiveCycleRules

Responsabilidad:

Interpretar la evolución del ciclo reproductivo.

Entre otras tareas:

* apertura de ciclo;
* reutilización de ciclo;
* cierre del ciclo;
* transición entre estados biológicos.

Nunca construye proyecciones.

Nunca calcula información destinada exclusivamente a lectura.

---

# ReproductiveProjection

Responsabilidad:

Construir el snapshot reproductivo observable por el resto del sistema.

Inicialmente podrá incluir:

* estado reproductivo;
* identificador del ciclo activo;
* fecha prevista de parto;
* días restantes.

En futuras fases podrá enriquecerse con nuevas propiedades derivadas siempre que respeten los principios generales definidos por el patrón CRP.

---

# Snapshot reproductivo

El snapshot reproductivo representa una proyección derivada.

Nunca constituye una fuente de verdad.

Su única finalidad consiste en optimizar las consultas realizadas por el resto de la aplicación.

Toda la información persistida debe poder reconstruirse completamente a partir de la historia de eventos.

---

# Eventos actuales

Actualmente el dominio implementa el siguiente evento:

* Cubrición.

Este evento constituye la primera validación completa del patrón Context → Rules → Projection dentro del proyecto.

---

# Evolución prevista

El dominio crecerá incorporando nuevos eventos reproductivos sin modificar la arquitectura existente.

Entre ellos podrán encontrarse:

* Parto;
* Aborto;
* Confirmación de gestación;
* Destete;
* Sincronización reproductiva;
* Otros eventos relacionados con el ciclo biológico.

Cada nuevo evento reutilizará el mismo patrón arquitectónico.

La evolución del dominio deberá producirse ampliando las reglas existentes, nunca duplicando comportamiento entre distintos casos de uso.

---

# Relación con los Use Cases

Cada evento reproductivo dispondrá de su correspondiente Use Case.

El Use Case será responsable de:

* construir el ReproductiveContext;
* invocar el dominio;
* coordinar la persistencia;
* devolver el resultado.

El conocimiento del negocio permanecerá siempre dentro del dominio reproductivo.

Esta separación permite mantener los Use Cases pequeños y fácilmente comprensibles.

---

# Relación con otros módulos

El dominio reproductivo es independiente del resto de dominios del sistema.

Comparte los mismos principios arquitectónicos, pero no comparte reglas de negocio.

Otros dominios como:

* Financiero;
* Sanidad;
* Operaciones;

podrán implementar el mismo patrón CRP mediante sus propios Context, Rules y Projection especializados.

---

# Estado actual

## Implementado

* Contexto arquitectónico del dominio.
* ReproductiveContext.
* ReproductiveEligibilityRules.
* ReproductiveCycleRules.
* ReproductiveProjection.
* Registro de Cubrición.

## Pendiente

* Nuevos eventos reproductivos.
* Enriquecimiento del snapshot.
* Automatizaciones.
* Alertas.
* Calendario reproductivo.
* Integraciones futuras.

---

# Principios específicos del dominio

Además de los principios generales definidos por la arquitectura del proyecto, el dominio reproductivo mantiene las siguientes reglas:

* el ciclo reproductivo constituye la unidad biológica principal del dominio;
* todo evento debe interpretarse dentro de su contexto reproductivo;
* el estado reproductivo siempre es una consecuencia de los eventos registrados;
* ninguna proyección podrá modificar la historia del dominio;
* las reglas reproductivas deberán permanecer centralizadas dentro de este dominio.

Estos principios deberán respetarse en todas las futuras ampliaciones del módulo reproductivo.
