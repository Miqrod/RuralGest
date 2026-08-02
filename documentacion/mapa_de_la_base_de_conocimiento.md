# Mapa de la Base de Conocimiento

## Propósito

Este documento constituye el mapa de navegación de la Base de Conocimiento del proyecto.

Su objetivo es facilitar la localización del conocimiento permanente, indicando dónde reside cada tipo de información y cuál es el documento responsable de mantenerla.

No pretende explicar el contenido de cada documento, sino servir como guía para encontrar rápidamente la fuente oficial de conocimiento.

---

# Filosofía

La Base de Conocimiento se construye siguiendo una idea sencilla:

> Cada concepto tiene un único lugar donde vive.

Toda la documentación debe organizarse de forma que cualquier persona o herramienta de IA pueda responder a estas preguntas sin ambigüedad:

* ¿Dónde se documenta este concepto?
* ¿Qué documento es el propietario?
* ¿Cuál es la fuente de verdad?
* ¿Qué documentos simplemente lo referencian?

---

# Principios de organización

Toda la Base de Conocimiento debe respetar los siguientes principios:

* un concepto tiene un único documento propietario;
* un documento tiene una única responsabilidad principal;
* el conocimiento permanente permanece separado de la documentación temporal;
* los documentos se relacionan mediante referencias y no mediante duplicación;
* la arquitectura evoluciona lentamente; los dominios evolucionan continuamente;
* los PRD describen implementaciones temporales; la Base de Conocimiento describe el sistema.

---

# Punto de entrada

La lectura recomendada comienza siempre por:

1. `README.md`
2. `CONTRIBUTING.md`
3. `glosario_de_dominio.md`
4. `mapa_de_la_base_de_conocimiento.md`

A partir de ese momento la consulta dependerá del tipo de conocimiento que se necesite.

---

# Organización general

```text
documentacion/
│
├── README.md
├── CONTRIBUTING.md
├── glosario_de_dominio.md
├── mapa_de_la_base_de_conocimiento.md
│
├── base_conocimiento/              ← conocimiento permanente del sistema
│   ├── arquitectura/
│   │   ├── overview.md
│   │   ├── principles/             (event-first, snapshots)
│   │   ├── patterns/               (CRP, RPC transaccional, Action→UseCase→Event)
│   │   ├── dominios/               (arquitectura por dominio)
│   │   └── decisiones/             (ADRs)
│   ├── dominios/                   (ganadero, reproductivo, financiero, sanitario, operacional)
│   ├── modelo/                     (modelo_ganadero, modelo_reproductivo, ...)
│   ├── implementacion/             (convenciones, tipos, estructura de módulos)
│   └── interfaz/                   (design system, patrones de pantalla)
│
└── agentes/
    └── claude/
        ├── principios_operativos.md
        ├── glosario_operativo.md
        ├── memory/                 (decisions, deferred, patterns, mistakes, glossary)
        └── desarrollo/             (progreso, layout, componentes)
```

---

# Estructura de la documentación

## Documentación fundacional

Contiene la información necesaria para comprender cómo está organizada la Base de Conocimiento.

| Documento                          | Responsabilidad                                              |
| ---------------------------------- | ------------------------------------------------------------ |
| README.md                          | Introducción general al proyecto y a la Base de Conocimiento |
| CONTRIBUTING.md                    | Normas para mantener la documentación                        |
| glosario_de_dominio.md             | Lenguaje oficial del dominio                                 |
| mapa_de_la_base_de_conocimiento.md | Mapa y organización de la documentación                      |

---

## Arquitectura

Describe las decisiones técnicas permanentes del proyecto.

Debe responder preguntas como:

* ¿Cómo funciona el sistema?
* ¿Qué principios gobiernan el diseño?
* ¿Qué patrones arquitectónicos utilizamos?
* ¿Por qué se tomaron determinadas decisiones?

La arquitectura se divide en cuatro niveles.

### Principios

Definen las reglas fundamentales del proyecto.

Ejemplos:

* Event First
* Snapshots
* Principios arquitectónicos

Los principios cambian muy poco con el tiempo.

---

### Patrones

Describen soluciones reutilizables aplicadas de forma repetitiva.

Ejemplos:

* Context → Rules → Projection
* Action → Use Case → Event
* RPC transaccional

Los patrones representan la forma estándar de implementar nuevas funcionalidades.

---

### Dominios

Documentan el comportamiento funcional permanente de cada bounded context.

Ejemplos:

* Reproductivo
* Financiero
* Sanitario
* Operacional

Cada documento describe exclusivamente las reglas de su dominio.

---

### Decisiones

Recogen las decisiones arquitectónicas permanentes (ADR) y la justificación que motivó su adopción.

---

# Modelo

Describe la representación conceptual del negocio.

Incluye:

* entidades;
* relaciones;
* estados;
* ciclos;
* reglas conceptuales.

No documenta detalles de implementación.

Ejemplos:

* modelo_ganadero.md
* modelo_reproductivo.md

---

# Implementación

Describe aspectos técnicos cuya responsabilidad no pertenece al dominio ni a la arquitectura.

Incluye, entre otros:

* organización del código;
* convenciones;
* estructura de carpetas;
* buenas prácticas de desarrollo.

---

# Documentación temporal

Los PRD y documentos de planificación no forman parte de la Base de Conocimiento.

Su finalidad consiste en organizar el desarrollo de una funcionalidad concreta.

Una vez implementada la funcionalidad:

* el PRD conserva únicamente valor histórico;
* el conocimiento permanente debe trasladarse a la Base de Conocimiento.

Nunca debe ocurrir lo contrario.

---

# Cómo localizar conocimiento

Cuando aparezca una duda, seguir el siguiente orden.

## 1. Glosario

Cuando la duda afecte al significado de un término.

---

## 2. Modelo

Cuando la duda afecte a entidades, estados, relaciones o conceptos del negocio.

---

## 3. Dominio

Cuando la duda afecte al comportamiento funcional o a las reglas de negocio.

---

## 4. Arquitectura

Cuando la duda afecte a patrones, principios o diseño del sistema.

---

## 5. Implementación

Cuando la duda afecte a la organización del código.

---

## 6. PRD

Únicamente cuando se necesite conocer el alcance o la planificación de una implementación concreta.

---

# Flujo recomendado para IA

Ante cualquier nueva funcionalidad se recomienda seguir este orden:

1. Comprender el dominio mediante el modelo y la documentación permanente.
2. Revisar la arquitectura para identificar los patrones aplicables.
3. Consultar el PRD correspondiente para conocer el alcance concreto de la implementación.
4. Implementar reutilizando la arquitectura y el dominio existentes.
5. Trasladar cualquier nuevo conocimiento permanente a la Base de Conocimiento.

---

# Evolución del mapa

Este documento deberá actualizarse siempre que:

* aparezca una nueva categoría documental;
* cambie la organización de la documentación;
* se redefina la responsabilidad de algún documento.

Su objetivo es garantizar que cualquier desarrollador o herramienta de IA pueda localizar rápidamente la fuente oficial de conocimiento sin necesidad de recorrer toda la documentación del proyecto.