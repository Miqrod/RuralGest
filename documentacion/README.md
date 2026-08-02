# Base de Conocimiento del Proyecto

## Propósito

Esta documentación constituye la **Base de Conocimiento oficial** del proyecto.

Su objetivo es preservar el conocimiento permanente del sistema, proporcionando una única fuente de verdad para comprender su arquitectura, su modelo de dominio, sus principios de diseño y las decisiones que definen su evolución.

La finalidad de esta base de conocimiento no es describir el estado puntual del desarrollo, sino documentar aquello que debe permanecer válido a largo plazo.

Todo miembro del proyecto debería poder comprender cómo está concebido el sistema antes de leer una sola línea de código.

---

# Principios

La Base de Conocimiento se rige por los siguientes principios.

## Una única fuente de verdad

Cada concepto debe estar definido en un único lugar.

Los documentos pueden referenciarse entre sí, pero nunca duplicar información ni mantener varias versiones de un mismo conocimiento.

---

## Conocimiento antes que implementación

La documentación describe el funcionamiento del sistema desde la perspectiva del dominio y de la arquitectura.

El código implementa ese conocimiento.

Cuando exista una discrepancia entre ambos, debe corregirse la inconsistencia, nunca aceptarse como normal.

---

## Permanencia

Solo debe formar parte de esta documentación el conocimiento que previsiblemente seguirá siendo válido durante la evolución del proyecto.

No pertenece a esta base de conocimiento información temporal como:

* tareas pendientes;
* planificación de desarrollo;
* PRDs;
* experimentos;
* notas de trabajo;
* conversaciones de diseño.

Estos elementos forman parte del proceso de desarrollo, pero no del conocimiento permanente del sistema.

---

## Evolución controlada

La documentación no es estática.

Debe evolucionar al mismo ritmo que el sistema.

Sin embargo, cualquier modificación debe preservar la coherencia global de la Base de Conocimiento y respetar los principios ya establecidos.

---

# Organización de la documentación

La documentación se organiza por áreas de conocimiento.

Cada documento posee una responsabilidad claramente definida y debe evitar solaparse con el resto.

De forma general, la estructura sigue esta filosofía:

* **README**: puerta de entrada a la Base de Conocimiento.
* **CONTRIBUTING**: normas para crear y mantener la documentación.
* **Glosario**: vocabulario oficial del dominio.
* **Arquitectura**: principios, patrones y organización técnica.
* **Dominios**: conocimiento específico de cada área funcional.
* **Modelos**: representación conceptual de las entidades y relaciones del sistema.
* **Decisiones**: decisiones arquitectónicas permanentes y su justificación.

La estructura podrá crecer con el proyecto siempre que se mantenga esta separación de responsabilidades.

---

# Cómo utilizar esta Base de Conocimiento

La lectura recomendada para comprender el proyecto es la siguiente:

1. Leer este documento para comprender la finalidad y organización de la documentación.
2. Consultar el **Glosario de Dominio** para conocer el significado preciso de la terminología utilizada.
3. Revisar los principios y patrones arquitectónicos que gobiernan el sistema.
4. Profundizar en los distintos dominios funcionales según sea necesario.

Cuando surja una duda sobre un concepto, debe consultarse siempre su documento de referencia en lugar de inferir su significado a partir de otros documentos.

---

# Documentos fundacionales

Toda la Base de Conocimiento se apoya inicialmente sobre tres documentos fundamentales.

## README

Define el propósito, la organización y el modo de utilización de la Base de Conocimiento.

## CONTRIBUTING

Establece las normas para crear, modificar y mantener la documentación del proyecto.

Su objetivo es garantizar que toda nueva documentación conserve un estilo, una estructura y un nivel de calidad homogéneos.

## Glosario de Dominio

Recoge la terminología oficial del proyecto.

Todo concepto de negocio utilizado en la documentación debe definirse una única vez en este documento.

Ningún otro documento debe redefinir términos ya presentes en el glosario.

---

# Convenciones generales

Toda la documentación debe seguir unas reglas comunes.

* Priorizar la claridad sobre la complejidad.
* Describir el "qué" y el "por qué" antes que el "cómo".
* Mantener una única fuente de verdad para cada concepto.
* Evitar duplicar contenido entre documentos.
* Utilizar siempre la terminología oficial definida en el glosario.
* Mantener separados el conocimiento permanente y la documentación temporal.
* Favorecer documentos pequeños, cohesionados y con una única responsabilidad.

---

# Evolución de la documentación

La Base de Conocimiento debe evolucionar junto con el proyecto.

Cuando una decisión deje de ser válida, la documentación debe actualizarse para reflejar la realidad actual del sistema.

Las modificaciones deben preservar la coherencia del conjunto y mantener la trazabilidad de las decisiones relevantes.

El objetivo final es que esta documentación continúe siendo, en todo momento, la referencia oficial para comprender el funcionamiento, la arquitectura y el dominio del proyecto.
