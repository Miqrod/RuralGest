# Guía de Contribución a la Base de Conocimiento

## Objetivo

Este documento define las normas para crear, modificar y mantener la Base de Conocimiento del proyecto.

Su finalidad es garantizar que la documentación permanezca coherente, consistente y fácil de mantener a medida que el sistema evoluciona.

Toda contribución debe respetar estas normas antes de incorporarse al repositorio.

---

# Principios generales

## La documentación es código

La documentación forma parte del sistema.

Debe evolucionar junto con el código y mantener el mismo nivel de calidad, revisión y cuidado.

Una funcionalidad no se considera completamente terminada si la documentación permanente correspondiente no ha sido actualizada.

---

## La Base de Conocimiento es la única fuente de verdad

La documentación permanente representa el conocimiento oficial del proyecto.

No deben existir múltiples documentos describiendo el mismo concepto desde perspectivas distintas.

Cuando aparezca información duplicada, deberá consolidarse en un único documento y el resto limitarse a referenciarlo.

---

## Cada concepto tiene un hogar

Todo conocimiento permanente debe tener un único documento propietario.

Ese documento constituye la referencia oficial para dicho conocimiento.

Los demás documentos podrán enlazarlo, resumirlo cuando sea necesario para mantener el contexto o utilizarlo como dependencia, pero nunca redefinirlo ni convertirse en una segunda fuente de verdad.

Si un concepto no tiene un documento claramente identificable como propietario, la estructura de la Base de Conocimiento debe revisarse antes de seguir ampliándola.

---

## Un documento, una responsabilidad

Cada documento debe tener un propósito claramente definido.

Si un documento empieza a abarcar varios temas independientes, debe dividirse.

La cohesión es prioritaria frente al tamaño.

---

## Auto-suficiencia

Todo documento debe ser comprensible de forma aislada. 

Debe proporcionar el contexto mínimo necesario para entender su propósito y su contenido, sin obligar al lector a consultar otros documentos para comprender las ideas principales. 

Las referencias a otros documentos servirán para profundizar o ampliar información, nunca para completar conceptos imprescindibles para la comprensión del documento actual.

---

# Qué pertenece a esta Base de Conocimiento

Debe documentarse únicamente conocimiento permanente o de larga duración.

Por ejemplo:

* principios arquitectónicos;
* patrones reutilizables;
* modelos de dominio;
* reglas de negocio estables;
* convenciones del proyecto;
* decisiones arquitectónicas permanentes;
* procesos que seguirán siendo válidos durante el desarrollo del sistema.

---

# Qué NO pertenece

No debe incorporarse documentación temporal como:

* PRDs;
* objetivos de una fase;
* listas de tareas;
* notas de reuniones;
* experimentos;
* conversaciones de diseño;
* alternativas descartadas que ya no aporten contexto;
* documentación generada únicamente para una implementación concreta.

Estos documentos forman parte del proceso de desarrollo, pero no de la Base de Conocimiento.

---

# Creación de nuevos documentos

Antes de crear un documento nuevo deben responderse estas preguntas:

1. ¿Este conocimiento ya existe en otro documento?
2. ¿Es información permanente?
3. ¿Tiene suficiente entidad para merecer un documento propio?
4. ¿Encaja dentro de la estructura actual?
5. ¿Puede resolverse ampliando un documento existente?

Solo cuando la respuesta lo justifique deberá crearse un nuevo documento.

---

# Organización del conocimiento

La información debe organizarse siguiendo una estructura jerárquica.

Cada documento debe tener una responsabilidad concreta y un único propósito principal.

Un documento puede referenciar a otros, pero no sustituirlos ni duplicar su contenido.

---

# Referencias entre documentos

Siempre que un concepto ya esté explicado en otro documento:

* debe enlazarse;
* no debe volver a describirse;
* únicamente puede resumirse cuando sea necesario para mantener el contexto.

La referencia debe prevalecer sobre la duplicación.

---

# Uso del Glosario

El **Glosario de Dominio** constituye el vocabulario oficial del proyecto.

Todo término de negocio debe definirse allí una única vez.

Los demás documentos deberán utilizar dicha terminología sin redefinirla.

Si durante la redacción aparece un nuevo concepto de dominio, el glosario deberá actualizarse antes o simultáneamente.

---

# Modificación de documentación existente

Antes de añadir contenido a un documento existente debe verificarse que:

* sigue siendo el lugar adecuado;
* la nueva información no rompe su responsabilidad;
* no existe otra ubicación más apropiada.

Si la modificación altera significativamente el propósito original del documento, deberá plantearse una reorganización.

---

# Estilo de escritura

La documentación debe priorizar la comprensión.

Se recomienda:

* utilizar lenguaje claro y preciso;
* evitar ambigüedades;
* escribir frases directas;
* utilizar títulos descriptivos;
* mantener una estructura consistente;
* justificar las decisiones importantes cuando sea relevante.

Debe evitarse:

* documentación redundante;
* opiniones personales;
* explicaciones excesivamente ligadas a una implementación concreta;
* información obsoleta mantenida por compatibilidad.

---

# Evolución de la documentación

La Base de Conocimiento debe evolucionar continuamente.

Cada cambio debe perseguir al menos uno de estos objetivos:

* mejorar la claridad;
* eliminar redundancias;
* incorporar nuevo conocimiento permanente;
* actualizar información que haya dejado de ser válida;
* reorganizar documentos para mantener una estructura coherente.

No deben realizarse cambios únicamente por preferencias de estilo si no aportan un beneficio claro.

---

# Revisión antes de aceptar un cambio

Antes de considerar terminada una modificación debe comprobarse que:

* el contenido es correcto;
* no duplica información existente;
* utiliza la terminología oficial;
* respeta la responsabilidad del documento;
* mantiene la coherencia con el resto de la Base de Conocimiento;
* las referencias a otros documentos siguen siendo válidas.

---

# Filosofía

La Base de Conocimiento debe crecer de forma orgánica, manteniendo siempre una estructura sencilla y fácil de recorrer.

Añadir información es sencillo.

Mantener una documentación coherente durante años es el verdadero objetivo.

Toda contribución debe ayudar a conservar esa coherencia.
