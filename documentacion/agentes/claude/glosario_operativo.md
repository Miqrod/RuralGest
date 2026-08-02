# Glosario Operativo para Claude

## Objetivo

Este documento define el vocabulario utilizado por Claude durante el desarrollo del proyecto.

No forma parte de la Base de Conocimiento del producto.

Su finalidad es proporcionar un lenguaje común para los asistentes de IA que participan en el desarrollo, evitando ambigüedades y garantizando un comportamiento consistente.

Los términos definidos aquí describen herramientas, procesos de trabajo y convenciones utilizadas durante el desarrollo del proyecto.

---

# Alcance

Este documento incluye exclusivamente conceptos relacionados con:

* proceso de desarrollo;
* generación de documentación;
* uso de asistentes de IA;
* organización del trabajo.

No incluye conceptos del dominio ganadero, financiero o arquitectónico.

---

# Conceptos

## Base de Conocimiento

Conjunto de documentos permanentes que describen el funcionamiento del sistema.

Es la fuente principal de contexto para cualquier asistente de IA.

La Base de Conocimiento debe consultarse antes de realizar cambios importantes.

---

## Memoria

Conjunto de documentos destinados a almacenar conocimiento acumulado durante el desarrollo.

Su objetivo es evitar volver a discutir decisiones ya tomadas.

La memoria no sustituye a la Base de Conocimiento.

Cuando una decisión deja de ser temporal y pasa a formar parte del diseño definitivo, debe trasladarse a la documentación correspondiente.

---

## Contexto Generado

Resumen dinámico del proyecto utilizado para proporcionar contexto rápidamente a los asistentes de IA.

Su contenido puede regenerarse cuando cambia el proyecto.

No constituye documentación oficial.

---

## PRD (Product Requirements Document)

Documento temporal utilizado para diseñar e implementar una funcionalidad concreta.

Describe:

* objetivo;
* alcance;
* requisitos;
* criterios de aceptación;
* tareas de implementación.

Una vez implementada la funcionalidad, el PRD deja de ser la fuente oficial de información.

Las decisiones permanentes deberán trasladarse a la Base de Conocimiento.

---

## Caso de Desarrollo

Unidad de trabajo utilizada para implementar una funcionalidad.

Normalmente coincide con un PRD o con una tarea suficientemente independiente.

---

## Patrón Arquitectónico

Solución reutilizable para resolver un tipo de problema recurrente.

Los patrones deben documentarse dentro de:

```
base_conocimiento/
    arquitectura/
        patterns/
```

Nunca deben describirse únicamente dentro de un PRD.

---

## Decisión Arquitectónica

Decisión permanente que afecta al diseño del sistema.

Toda decisión arquitectónica debe registrarse en la carpeta:

```
base_conocimiento/
    decisiones/
```

antes de considerarse definitiva.

---

## Regla Operativa

Norma utilizada durante el desarrollo para mantener la coherencia del proyecto.

Las reglas operativas pueden evolucionar con el tiempo.

No forman parte del dominio del negocio.

---

## Deuda Técnica

Trabajo conocido que se decide posponer conscientemente.

Debe registrarse para evitar que desaparezca del conocimiento del proyecto.

---

## Edge Case

Situación poco frecuente que requiere un tratamiento específico.

Los edge cases importantes deben documentarse durante el diseño de la funcionalidad.

---

## Refactorización

Modificación del código destinada a mejorar su diseño sin alterar el comportamiento funcional.

Toda refactorización debe respetar las decisiones arquitectónicas existentes.

---

## Fuente de Verdad

Documento considerado oficial para un determinado conocimiento.

Cada concepto del proyecto debe tener una única fuente de verdad.

Nunca deben mantenerse dos documentos con autoridad sobre el mismo contenido.

---

## Duplicidad Documental

Situación en la que dos documentos describen el mismo concepto con distinto nivel de detalle o con información diferente.

Debe evitarse.

Cuando aparezca una duplicidad:

1. se identifica el documento propietario;
2. se trasladan las aportaciones útiles;
3. se elimina la duplicidad.

---

## Evolución Documental

Proceso mediante el cual el conocimiento pasa desde documentos temporales hasta la Base de Conocimiento.

El ciclo recomendado es:

```
Idea

↓

Conversación

↓

PRD

↓

Implementación

↓

Decisión permanente

↓

Base de Conocimiento
```

---

# Principios Operativos

Durante el desarrollo deben respetarse los siguientes principios:

* una única fuente de verdad por concepto;
* documentar únicamente conocimiento permanente;
* evitar duplicidades;
* priorizar claridad sobre cantidad;
* mover el conocimiento desde documentos temporales hacia la Base de Conocimiento cuando alcance estabilidad;
* mantener separada la documentación del producto de la documentación destinada a los asistentes de IA.

---

# Relación con la Base de Conocimiento

La Base de Conocimiento describe **el sistema**.

Este documento describe **cómo colaborar para construirlo**.

Ambos son complementarios, pero tienen responsabilidades completamente distintas.
