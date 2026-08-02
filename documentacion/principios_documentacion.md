# Principios de diseño documental

## Objetivo

Este documento define los principios que rigen la creación, organización y evolución de la Base de Conocimiento del proyecto.

Su finalidad es garantizar que la documentación permanezca coherente, comprensible y sostenible a lo largo del tiempo, independientemente de la tecnología utilizada o de las personas que participen en el desarrollo.

Estos principios son de aplicación a toda la documentación permanente del proyecto.

---

# Filosofía

La documentación no pretende describir el código fuente.

Su objetivo es capturar el conocimiento permanente del sistema:

* el dominio de negocio;
* la arquitectura;
* las reglas de negocio;
* los modelos conceptuales;
* las decisiones de diseño que forman parte del funcionamiento del sistema.

El código implementa ese conocimiento.

La documentación lo explica.

---

# Principios

## 1. Conservar los ejemplos con valor semántico

Los ejemplos que ayudan a comprender una regla del dominio forman parte del conocimiento y deben conservarse.

Especialmente cuando:

* muestran diferencias entre especies;
* ilustran casos límite;
* explican consecuencias de una decisión de diseño;
* facilitan la comprensión de un concepto complejo.

Solo deben eliminarse ejemplos redundantes o meramente ilustrativos que no aporten conocimiento adicional.

---

## 2. Cada documento es propietario de su conocimiento

Todo concepto debe tener un único documento propietario.

Cuando un documento explica correctamente un concepto, este no debe fragmentarse entre varios archivos.

Los documentos auxiliares pueden complementar esa información, pero nunca sustituirla ni repartir la narrativa principal.

---

## 3. Las decisiones pertenecen a su contexto

Las decisiones de diseño deben documentarse allí donde forman parte natural de la explicación.

No deben trasladarse a documentos independientes si ello rompe el hilo argumental del dominio.

Los documentos ADR quedan reservados para decisiones excepcionales que afecten transversalmente a toda la arquitectura del sistema.

---

## 4. El modelo se organiza por dominios

La documentación del modelo debe estructurarse siguiendo los dominios funcionales de la aplicación.

Cada dominio constituye una unidad de conocimiento completa.

Por ello existirán documentos como:

* ganadero;
* reproductivo;
* financiero.

No se fragmentará el modelo únicamente por categorías técnicas como entidades, estados o eventos, salvo cuando un concepto sea realmente compartido por varios dominios.

---

## 5. La documentación debe leerse como un libro técnico

Cada documento debe construirse como una explicación progresiva del conocimiento.

Siempre que sea posible debería responder, en este orden, a preguntas como:

1. ¿Qué problema resuelve?
2. ¿Por qué existe este modelo?
3. ¿Cómo representa la realidad?
4. ¿Qué reglas gobiernan su comportamiento?
5. ¿Qué casos especiales existen?
6. ¿Cómo afecta a otros dominios?

Los detalles de implementación deben aparecer únicamente cuando sean necesarios para comprender el modelo.

La documentación no pretende ser una referencia de APIs ni del código fuente.

---

## 6. Los documentos auxiliares complementan, no sustituyen

Los documentos transversales existen para evitar duplicidades entre dominios.

Su función es describir conceptos compartidos, como por ejemplo:

* tablas comunes;
* patrones reutilizables;
* invariantes globales;
* catálogos compartidos.

Nunca deben vaciar de contenido a los documentos principales del dominio.

---

## 7. La documentación describe conocimiento, no implementación

La Base de Conocimiento debe permanecer válida aunque cambie la tecnología utilizada.

Por ello debe evitar describir:

* componentes concretos;
* estructura del código;
* detalles del framework;
* organización de carpetas del proyecto;
* decisiones de implementación temporales.

Solo se documentarán aquellos aspectos técnicos que formen parte del conocimiento permanente del sistema.

---

## 8. La documentación evoluciona por consolidación

La documentación permanente no debe crecer copiando conversaciones o decisiones temporales.

El conocimiento evoluciona siguiendo un proceso de consolidación:

```text
Conversación
      ↓
Análisis
      ↓
PRD / Diseño
      ↓
Implementación
      ↓
Base de Conocimiento
```

Solo el conocimiento estable y validado debe incorporarse a la documentación permanente.

---

# Aplicación

Estos principios son comunes a toda la Base de Conocimiento.

Cada directorio (`arquitectura`, `modelo`, `flujos`, etc.) podrá definir convenciones específicas, pero siempre respetando los principios establecidos en este documento.

Su cumplimiento tiene como objetivo mantener una documentación coherente, comprensible y sostenible a largo plazo.
