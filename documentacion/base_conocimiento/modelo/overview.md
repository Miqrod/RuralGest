# Modelo del Dominio

## Objetivo

El directorio `modelo/` describe el modelo conceptual del sistema.

Su finalidad no es documentar la implementación, sino explicar cómo representa la aplicación la realidad del negocio.

Cada documento describe un dominio funcional de la aplicación y constituye la referencia principal para comprender su funcionamiento.

---

# Filosofía

El modelo del sistema se organiza siguiendo los dominios de negocio de la aplicación.

Cada dominio agrupa en un único documento todo el conocimiento necesario para comprender:

* el problema que resuelve;
* las entidades implicadas;
* las reglas de negocio;
* los estados;
* los eventos;
* las relaciones entre conceptos;
* las particularidades propias de cada especie cuando existan.

De esta forma, cada documento puede leerse de forma relativamente independiente y proporciona una visión completa de su ámbito funcional.

---

# Organización

Actualmente el modelo se estructura en los siguientes dominios:

```text
modelo/
│
├── overview.md
├── ganadero.md
├── reproductivo.md
├── financiero.md
└── tablas_compartidas.md
```

Cada documento tiene una responsabilidad claramente definida.

---

## ganadero.md

Describe el modelo principal de la explotación.

Incluye, entre otros aspectos:

* animales;
* lotes;
* eventos;
* movimientos;
* estados derivados;
* acciones disponibles;
* reglas generales comunes a todas las especies.

Constituye el núcleo del dominio.

---

## reproductivo.md

Describe el funcionamiento completo del ciclo reproductivo.

Incluye:

* ciclo reproductivo;
* estados reproductivos;
* reglas del ciclo;
* transiciones;
* casos especiales;
* diferencias entre especies cuando existan.

Este documento es el propietario de todo el conocimiento relacionado con la reproducción.

---

## financiero.md

Describe el modelo económico de la aplicación.

Incluye:

* ventas;
* transacciones;
* facturas;
* terceros;
* categorías financieras;
* relaciones entre los distintos elementos económicos.

---

## tablas_compartidas.md

Describe las tablas de referencia compartidas por varios dominios.

Por ejemplo:

* razas;
* tipos productivos;
* categorías;
* catálogos comunes.

Su objetivo es evitar duplicidades entre dominios cuando un mismo catálogo es utilizado por varios módulos.

---

# Relación entre documentos

Cada documento es propietario de su propio conocimiento.

Los documentos auxiliares únicamente contienen información compartida entre varios dominios.

Nunca deben sustituir la explicación del dominio correspondiente.

Cuando un concepto pertenece claramente a un único dominio, deberá documentarse en ese dominio y no fragmentarse entre varios archivos.

---

# Alcance

Los documentos del modelo describen el dominio.

No contienen:

* detalles de implementación;
* componentes de interfaz;
* decisiones específicas del framework;
* organización del código fuente;
* instrucciones para asistentes de IA.

Toda la información incluida debe permanecer válida independientemente de la tecnología utilizada para implementar el sistema.

---

# Relación con el resto de la Base de Conocimiento

El modelo del dominio se complementa con el resto de documentación del proyecto.

* **arquitectura/** describe cómo está construido el sistema.
* **modelo/** describe qué representa el sistema.
* **flujos/** describen cómo se ejecutan los procesos de negocio.
* **glosario_de_dominio.md** define el lenguaje ubicuo utilizado en todos los documentos.

Cada uno de estos bloques aborda el sistema desde una perspectiva diferente y complementaria.

---

# Principios

Los documentos de este directorio deben evolucionar junto con el conocimiento del dominio.

Su objetivo no es reflejar el estado actual del código, sino proporcionar un modelo estable que sirva de referencia para el diseño, la implementación y la evolución futura de la aplicación.
