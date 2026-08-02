# Implementación

## Propósito

Este documento proporciona una visión general de cómo se implementa la arquitectura del proyecto.

Mientras que la documentación de arquitectura describe los principios, patrones y decisiones conceptuales que gobiernan el sistema, la documentación de implementación explica cómo dichas decisiones se materializan en el código.

Su objetivo es servir como punto de entrada a toda la documentación relacionada con la organización del código, las dependencias, la persistencia y las tecnologías utilizadas.

No describe reglas de negocio ni decisiones específicas de un dominio funcional.

---

# Arquitectura e implementación

El proyecto distingue claramente entre arquitectura e implementación.

La arquitectura responde a preguntas como:

* ¿Qué principios gobiernan el sistema?
* ¿Cómo evoluciona un dominio?
* ¿Cuándo debe utilizarse un patrón?
* ¿Qué responsabilidades tiene cada componente?

La implementación responde a preguntas diferentes:

* ¿Cómo se organiza el código?
* ¿Dónde debe ubicarse cada responsabilidad?
* ¿Cómo se comunican las distintas capas?
* ¿Cómo se integra la infraestructura con el dominio?

Esta separación permite que la arquitectura permanezca estable incluso cuando cambian las tecnologías o la organización interna del código.

---

# Objetivos de la implementación

La implementación del proyecto persigue los siguientes objetivos:

* reflejar fielmente la arquitectura definida;
* mantener una organización coherente del código;
* minimizar el acoplamiento entre módulos;
* facilitar la evolución del sistema;
* aislar la infraestructura del dominio;
* favorecer la mantenibilidad y la legibilidad del código.

Toda decisión de implementación deberá contribuir a uno o varios de estos objetivos.

---

# Organización de la documentación

La documentación de implementación se divide en varios documentos especializados.

Cada uno posee una única responsabilidad y constituye la referencia oficial de su ámbito.

## Organización del código

Describe cómo se estructura físicamente el proyecto y cómo se organizan los módulos, capas y directorios.

Documento:

```text
module-structure.md
```

---

## Dependencias

Define la dirección permitida de las dependencias entre las distintas capas y módulos, así como las reglas que garantizan un bajo acoplamiento.

Documento:

```text
dependency-rule.md
```

---

## Tipos

Explica la clasificación de los distintos tipos utilizados por el sistema y dónde debe residir cada uno de ellos.

Documento:

```text
types.md
```

---

## Mapeo entre capas

Describe cómo se traducen los datos entre el dominio, la infraestructura y la persistencia, así como las responsabilidades de los mappers.

Documento:

```text
mapping.md
```

---

## Persistencia

Documenta cómo el proyecto utiliza Supabase, las migraciones, la generación de tipos, las funciones RPC y el resto de convenciones relacionadas con la persistencia.

Documento:

```text
supabase.md
```

---

## Tecnologías

Describe las tecnologías que forman parte del proyecto y el papel que desempeña cada una de ellas dentro de la arquitectura.

Documento:

```text
technology-stack.md
```

---

# Relación entre los documentos

Los documentos de implementación no deben interpretarse como documentos independientes entre sí.

Cada uno explica un aspecto concreto del sistema desde una perspectiva diferente.

En conjunto describen cómo se materializa la arquitectura en el código.

La relación entre ellos puede representarse de la siguiente forma:

```text
Arquitectura

↓

Organización del código

↓

Dependencias

↓

Tipos

↓

Mapeo

↓

Persistencia

↓

Tecnologías
```

Esta secuencia no representa una dependencia estricta entre documentos, sino un recorrido recomendado para comprender progresivamente la implementación del proyecto.

---

# Alcance

La documentación de implementación no describe:

* reglas de negocio;
* procesos funcionales;
* modelos de dominio;
* patrones arquitectónicos;
* principios de arquitectura.

Todos esos aspectos pertenecen a la documentación arquitectónica o a la documentación de los distintos dominios.

---

# Evolución

La implementación evolucionará junto con el proyecto.

Sin embargo, cualquier cambio deberá preservar los principios arquitectónicos definidos por el proyecto y mantener una correspondencia clara entre la arquitectura conceptual y su materialización en el código.

Cuando aparezca una nueva decisión relacionada con la implementación, deberá incorporarse al documento especializado que corresponda, evitando convertir este documento en un repositorio de detalles técnicos.
