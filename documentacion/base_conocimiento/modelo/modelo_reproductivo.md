# Modelo Reproductivo

> Este documento describe el modelo conceptual del dominio reproductivo.
>
> Para conocer su implementación arquitectónica, consultar `documentacion/dominios/reproductivo.md`.

# Índice

1. Introducción
2. Qué representa realmente el modelo reproductivo
3. Un modelo pensado para gestionar, no para reconstruir
4. Principios fundamentales
5. Conceptos fundamentales
6. Estado reproductivo
7. El modelo y la experiencia de usuario
8. El ciclo reproductivo
9. La evolución del ciclo reproductivo
10. Inicio del ciclo reproductivo
11. Finalización del ciclo reproductivo
12. Evolución del conocimiento durante el ciclo reproductivo
13. Decisiones de diseño del modelo
14. Conclusión

## Introducción

La reproducción constituye uno de los procesos más complejos que debe gestionar una explotación ganadera.

A diferencia de otros acontecimientos del ciclo de vida de un animal, como una compra, una venta o una vacunación, la reproducción no puede entenderse como un hecho aislado. Se trata de un proceso que puede extenderse durante meses y en el que intervienen numerosos acontecimientos relacionados entre sí.

Una cubrición, una confirmación de gestación, un parto o un destete poseen significado individual, pero únicamente adquieren todo su sentido cuando se interpretan como partes de una misma historia.

Si la aplicación almacenara únicamente una lista de eventos reproductivos, conservaría correctamente el historial de la explotación, pero sería incapaz de responder muchas de las preguntas que forman parte de la gestión diaria.

Por ejemplo:

- ¿Está actualmente gestante este animal?
- ¿En qué punto de su ciclo reproductivo se encuentra?
- ¿Cuándo se espera el próximo parto?
- ¿Cuántos ciclos reproductivos ha completado?
- ¿Cuántos terminaron con éxito y cuántos finalizaron por aborto?

Responder a estas preguntas exige algo más que una sucesión cronológica de eventos.

Es necesario disponer de un modelo capaz de relacionarlos, interpretarlos y proyectar el conocimiento que la explotación posee sobre el proceso reproductivo de cada animal.

Ese es precisamente el propósito del modelo reproductivo.

Este documento describe los conceptos, principios y reglas que permiten representar dicho conocimiento de forma coherente, trazable y comprensible para el resto de la aplicación.

No pretende describir la implementación técnica del sistema ni las particularidades de una especie concreta.

Aunque los ejemplos utilizados hacen referencia principalmente al ganado vacuno y porcino, los conceptos descritos en este documento pretenden ser independientes de la especie y servir como base para cualquier dominio reproductivo incorporado en el futuro.

Su objetivo consiste en definir el lenguaje común sobre el que se construyen todas las funcionalidades reproductivas presentes y futuras.

---

# Qué representa realmente el modelo reproductivo

Durante el diseño del módulo reproductivo apareció muy pronto una cuestión fundamental.

¿Debe la aplicación intentar representar exactamente todo lo que ha ocurrido durante la vida reproductiva del animal?

La respuesta fue no.

El motivo es sencillo.

Existe una diferencia muy importante entre la realidad biológica y el conocimiento que una explotación posee sobre dicha realidad.

La realidad biológica existe independientemente de que alguien la observe o la registre.

El conocimiento, en cambio, depende exclusivamente de la información que el ganadero ha podido registrar a lo largo del tiempo.

No todas las cubriciones se anotan.

No todas las gestaciones se confirman.

Incluso pueden existir partos de los que únicamente se conserva constancia porque posteriormente apareció una camada.

Pretender reconstruir automáticamente todos esos acontecimientos conduciría a un modelo lleno de suposiciones y reglas difíciles de explicar.

Por ese motivo el modelo reproductivo adopta una filosofía diferente.

No intenta reconstruir toda la realidad biológica.

Representa únicamente el conocimiento confirmado que la explotación posee en cada momento.

Como consecuencia:

- una cubrición solo existe cuando ha sido registrada;
- una gestación únicamente pasa a formar parte del modelo cuando ha sido confirmada;
- un parto solo existe cuando ha sido informado mediante un evento.

El sistema nunca inventa acontecimientos para completar información ausente.

Tampoco modifica la historia registrada para hacerla parecer más coherente desde un punto de vista biológico.

La información disponible puede ser incompleta.

Puede existir incertidumbre.

Incluso pueden faltar acontecimientos que realmente ocurrieron.

Todas estas situaciones forman parte del funcionamiento normal de una explotación y el modelo debe ser capaz de representarlas sin perder coherencia.

Esta decisión tiene además una consecuencia muy importante.

El objetivo del modelo ya no consiste en responder a la pregunta:

> ¿Qué ocurrió realmente?

Sino a una mucho más útil para la gestión diaria:

> ¿Qué sabemos actualmente que ocurrió?

Toda la arquitectura del dominio reproductivo se construye sobre esta idea.

Los estados reproductivos, los ciclos, las proyecciones y las reglas de negocio no representan la realidad biológica absoluta, sino el mejor conocimiento confirmado que la explotación posee en cada momento.

El modelo reproductivo no sustituye al modelo ganadero general, sino que constituye un dominio especializado construido sobre él.

Comparte sus principios de trazabilidad, eventos y proyecciones, incorporando únicamente las reglas específicas relacionadas con la reproducción.

---

# Un modelo pensado para gestionar, no para reconstruir

Representar únicamente el conocimiento disponible no significa aceptar cualquier combinación posible de eventos.

Desde el principio del diseño surgió un segundo objetivo igualmente importante.

El modelo debía resultar sencillo de utilizar.

Una aplicación de gestión ganadera se utiliza todos los días y, en la mayoría de los casos, las personas que registran la información no buscan reconstruir con precisión histórica todo el proceso reproductivo, sino mantener un seguimiento fiable de la explotación.

Por este motivo el modelo intenta alcanzar un equilibrio entre dos necesidades que, en ocasiones, pueden parecer opuestas.

Por un lado, representar fielmente el conocimiento disponible.

Por otro, proporcionar un flujo de trabajo claro, predecible y fácil de comprender.

Cuando ambas opciones son compatibles, el modelo conserva toda la información registrada.

Cuando aparecen situaciones excepcionales, se prioriza siempre mantener un proceso operativo sencillo antes que incorporar mecanismos destinados únicamente a reconstruir historias poco habituales.

Esta filosofía explica muchas de las decisiones adoptadas durante el diseño del dominio.

Por ejemplo, el sistema permite iniciar un ciclo reproductivo mediante una confirmación de gestación cuando nunca llegó a registrarse la cubrición correspondiente, ya que representa una situación relativamente frecuente en muchas explotaciones.

Sin embargo, una vez que el ciclo continúa a partir de ese punto, el modelo mantiene una secuencia lineal de acontecimientos y evita introducir flujos alternativos cuya complejidad sería muy superior al valor que aportarían en la práctica.

El resultado es un modelo que no pretende describir todas las situaciones imaginables, sino ofrecer una representación suficientemente fiel de la realidad conocida para facilitar la gestión diaria de la explotación.

---

# Principios fundamentales

Todo el modelo reproductivo se construye sobre un conjunto reducido de principios que permanecen invariables independientemente de la especie ganadera, del tamaño de la explotación o de las funcionalidades que puedan incorporarse en el futuro.

Más que reglas de implementación, constituyen la filosofía sobre la que se apoya todo el dominio reproductivo.

Comprender estos principios permite entender prácticamente cualquier decisión tomada durante el diseño del modelo.

---

## El modelo representa conocimiento, no biología

El principio más importante de todo el dominio reproductivo consiste en distinguir entre la realidad biológica y el conocimiento que la explotación posee sobre ella.

La aplicación no intenta reconstruir exactamente todo lo que ha ocurrido durante la vida reproductiva del animal.

Su responsabilidad consiste en representar únicamente aquello que el sistema conoce porque ha sido registrado mediante eventos.

Como consecuencia, dos animales que hayan vivido exactamente el mismo proceso biológico podrían presentar historiales diferentes si la información registrada sobre ellos también es diferente.

Ambos casos serían igualmente válidos.

El modelo no pretende completar los vacíos de información mediante suposiciones, sino representar fielmente el conocimiento disponible en cada momento.

---

## Los eventos constituyen la única fuente de verdad

Todo el conocimiento reproductivo nace siempre de un evento registrado.

Una cubrición, una confirmación de gestación, un parto o un destete no modifican directamente el estado del animal.

Lo que realmente ocurre es exactamente lo contrario.

Cada nuevo evento amplía el conocimiento disponible y, a partir de ese conocimiento, el sistema recalcula automáticamente el estado reproductivo, el ciclo correspondiente y cualquier otra información derivada.

Esto garantiza que toda la información observable pueda reconstruirse siempre a partir del historial de eventos.

Los eventos constituyen, por tanto, la única fuente de verdad del dominio reproductivo.

---

## La historia nunca se modifica

Una vez registrado, un evento pasa a formar parte permanente de la historia reproductiva del animal.

Aunque posteriormente aparezca nueva información, el sistema nunca sustituye unos hechos por otros para construir una historia aparentemente más coherente.

Si el conocimiento cambia, lo que cambia es la interpretación de ese conocimiento.

Nunca los acontecimientos registrados.

Este principio garantiza la trazabilidad completa del proceso reproductivo y permite reconstruir en cualquier momento la evolución histórica del animal.

---

## La incertidumbre también forma parte del modelo

En una explotación real no toda la información se registra siempre con la misma precisión.

Puede desconocerse la fecha exacta de una cubrición.

Puede confirmarse una gestación semanas después de haberse producido.

Incluso puede registrarse un parto sin que exista constancia de una confirmación previa.

Lejos de considerar estas situaciones como errores, el modelo las trata como parte natural del funcionamiento de la explotación.

Su objetivo no consiste en eliminar la incertidumbre, sino en representarla de forma explícita.

Por ello el sistema admite distintos niveles de conocimiento sin perder coherencia.

Cuando la información disponible es limitada, las proyecciones también lo serán.

Cuando el conocimiento aumenta, las proyecciones podrán enriquecerse sin necesidad de alterar la historia registrada.

---

## Las proyecciones representan el mejor conocimiento disponible

Además de conservar la historia de eventos, la aplicación necesita ofrecer información útil para la gestión diaria.

Por ejemplo:

- el estado reproductivo actual;
- la fecha prevista de parto;
- los días restantes para el parto;
- el ciclo reproductivo activo.

Toda esta información constituye una proyección derivada.

No representa hechos nuevos.

Representa la mejor interpretación que el sistema puede realizar utilizando únicamente los eventos registrados.

En algunos casos esa interpretación se basa en información muy precisa, como una cubrición registrada.

En otros deberá apoyarse en estimaciones, como la edad gestacional introducida durante una confirmación de gestación.

En ambos casos la naturaleza de la información sigue siendo la misma.

La proyección nunca modifica la historia.

Simplemente transforma el conocimiento disponible en información útil para la gestión de la explotación.

---

## El modelo prioriza un flujo de trabajo coherente

Durante el diseño del dominio aparecieron numerosas situaciones biológicamente posibles.

Sin embargo, no todas aportaban el mismo valor desde el punto de vista de la gestión diaria.

El objetivo de la aplicación no consiste en permitir cualquier combinación imaginable de eventos, sino ofrecer un proceso de trabajo claro, consistente y fácil de utilizar.

Por este motivo el modelo admite aquellas situaciones que representan escenarios habituales en una explotación, incluso cuando la información disponible es incompleta.

Por ejemplo, permite iniciar un ciclo mediante una confirmación de gestación cuando nunca llegó a registrarse la cubrición.

Sin embargo, una vez iniciado el seguimiento del ciclo, el modelo evita introducir caminos alternativos cuyo único objetivo sería reconstruir retrospectivamente una historia más completa.

Con ello se consigue un equilibrio entre fidelidad al conocimiento disponible y simplicidad operativa, dos objetivos que han guiado el diseño del dominio desde sus primeras versiones.

# Conceptos fundamentales

Todo el modelo reproductivo gira alrededor de un conjunto reducido de conceptos.

Cada uno responde a una pregunta diferente y cumple una responsabilidad concreta dentro del dominio.

Comprender el significado de estos conceptos resulta mucho más importante que conocer su implementación, ya que todas las reglas del modelo se construyen a partir de ellos.

---

## Evento reproductivo

Un evento reproductivo representa un hecho conocido que afecta al proceso reproductivo de un animal.

Cada evento constituye una observación registrada por la explotación en un momento determinado.

Por ejemplo:

- una cubrición;
- una confirmación de gestación;
- un parto;
- un aborto;
- un destete.

Los eventos representan exclusivamente hechos registrados.

No expresan hipótesis, estimaciones ni interpretaciones.

Tampoco describen por sí solos la situación reproductiva del animal.

Un evento únicamente responde a una pregunta muy concreta:

> ¿Qué hecho conocemos que ocurrió?

Todo el conocimiento del dominio nace siempre a partir de estos eventos.

Los eventos reproductivos no constituyen un tipo especial de almacenamiento distinto al resto de eventos del sistema.

Forman parte del modelo general de eventos de la aplicación y únicamente se diferencian por pertenecer al dominio reproductivo.

Esto permite mantener una arquitectura homogénea para todos los dominios de negocio y reutilizar los mismos principios de trazabilidad, proyección y reconstrucción del estado.

---

## Estado reproductivo

Mientras que un evento representa un hecho puntual, el estado reproductivo describe la situación reproductiva conocida del animal en un instante determinado.

No responde a la pregunta:

> ¿Qué ocurrió?

Sino a otra distinta:

> ¿Qué sabemos actualmente sobre este animal?

Esta diferencia resulta fundamental.

Un mismo estado reproductivo puede alcanzarse mediante historias diferentes.

Por ejemplo, un animal puede encontrarse en estado **GESTANTE** después de registrar una cubrición y una posterior confirmación de gestación.

Pero también puede llegar al mismo estado cuando la primera información disponible es directamente una confirmación de gestación.

En ambos casos el conocimiento actual es el mismo.

Lo que cambia es el camino recorrido para llegar hasta él.

Por este motivo el estado reproductivo nunca se modifica directamente.

Siempre constituye una consecuencia de los eventos registrados.

El estado reproductivo representa la situación del ciclo reproductivo actual del animal.

La existencia de otros ciclos reproductivos históricos que permanezcan abiertos por dependencias funcionales pendientes no implica que esos ciclos definan el estado reproductivo actual de la madre. Una madre puede tener un ciclo reproductivo actual vacío, pero tener una cría a la que amamantar.

---

## Ciclo reproductivo

La reproducción no puede entenderse como una colección de acontecimientos independientes.

Una cubrición, un parto o un destete forman parte de un mismo proceso biológico.

El ciclo reproductivo nace precisamente para representar esa relación.

Su función consiste en agrupar todos los eventos que pertenecen a una misma historia reproductiva.

Gracias a esta agrupación el sistema deja de interpretar los acontecimientos como hechos aislados y pasa a comprenderlos como fases sucesivas de un mismo proceso.

El ciclo constituye, por tanto, el contexto sobre el que se interpreta cada nuevo evento reproductivo.

No describe únicamente lo que ocurrió.

Describe cómo se relacionan entre sí todos esos acontecimientos.

---

## Proyección reproductiva

La historia de eventos contiene toda la información necesaria para reconstruir el conocimiento reproductivo.

Sin embargo, consultar continuamente toda esa historia resultaría poco eficiente y dificultaría enormemente el trabajo diario.

Por este motivo el sistema construye distintas proyecciones derivadas.

Una proyección representa el resultado de interpretar toda la información conocida hasta un determinado momento.

Gracias a ella la aplicación puede mostrar directamente información como:

- el estado reproductivo actual;
- el ciclo activo;
- la fecha prevista de parto;
- los días restantes para el parto;
- cualquier otro dato derivado que resulte útil para la gestión.

Es importante comprender que una proyección nunca añade información nueva.

Simplemente resume e interpreta el conocimiento existente para facilitar su consulta.

---

## Conocimiento confirmado

Todos los conceptos anteriores comparten una misma idea.

El modelo reproductivo únicamente trabaja con conocimiento confirmado.

Aquello que no ha sido registrado mediante un evento puede haber ocurrido realmente o puede no haber ocurrido.

Desde el punto de vista del modelo ambas situaciones son indistinguibles.

Por este motivo el sistema nunca intenta completar automáticamente los vacíos de información.

Cuando dispone de información suficiente puede construir estimaciones útiles para la gestión, como una fecha prevista de parto.

Sin embargo, esas estimaciones nunca pasan a formar parte de la historia del animal.

La historia está formada exclusivamente por hechos registrados.

Las proyecciones, en cambio, representan el conocimiento que puede derivarse de dichos hechos.

# Estado reproductivo

El estado reproductivo constituye probablemente el concepto más visible de todo el modelo.

Mientras que los eventos describen hechos concretos y el ciclo reproductivo organiza dichos acontecimientos dentro de una misma historia, el estado responde a la pregunta que el usuario necesita conocer en cada momento:

> ¿Cuál es la situación reproductiva actual de este animal?

La respuesta no depende de un único evento, sino de la interpretación conjunta de toda la información registrada hasta ese instante.

Por este motivo el estado reproductivo nunca se almacena como un dato introducido manualmente.

Siempre se obtiene como consecuencia de los eventos registrados durante la vida reproductiva del animal.

Su función consiste en resumir el conocimiento actual del sistema y servir como punto de partida para las siguientes decisiones operativas.

---

## No todos los animales poseen estado reproductivo

El modelo reproductivo no forma parte del ciclo de vida de todos los animales de la explotación.

Su utilización depende de una decisión de negocio previa.

Únicamente los animales cuyo **tipo productivo** sea **REPRODUCTORA** participan en el dominio reproductivo.

Además, esta clasificación solo resulta aplicable a animales de sexo femenino.

Mientras un animal pertenezca a cualquier otro tipo productivo, el sistema simplemente no iniciará ningún seguimiento reproductivo.

No existirán ciclos reproductivos.

No existirán estados reproductivos.

Tampoco aparecerán acciones relacionadas con la reproducción.

Esta decisión simplifica considerablemente el modelo y refleja el funcionamiento habitual de la explotación, donde únicamente una parte del ganado participa en los procesos reproductivos.

El cambio de tipo productivo marca, por tanto, la entrada o salida del dominio reproductivo, del mismo modo que otros cambios pueden hacer que un animal deje de formar parte de otros procesos de negocio.

---

## El tipo productivo y el estado reproductivo responden a preguntas diferentes

Aunque ambos conceptos están relacionados, representan aspectos distintos del animal.

El tipo productivo expresa el papel que el animal desempeña dentro de la explotación. Es una decisión de negocio que determina cómo participa en los distintos procesos de gestión.

El estado reproductivo, en cambio, describe el conocimiento que la explotación posee sobre su proceso reproductivo en un momento determinado.

En otras palabras, el tipo productivo responde a la pregunta:

> ¿Para qué se utiliza este animal dentro de la explotación?

Mientras que el estado reproductivo responde a otra completamente distinta:

> ¿Qué sabemos actualmente sobre su situación reproductiva?

Por este motivo, un cambio de tipo productivo puede hacer que un animal entre o salga del dominio reproductivo, mientras que los estados reproductivos evolucionan exclusivamente como consecuencia de los eventos registrados.

---

## El estado reproductivo representa conocimiento

Los distintos estados reproductivos no describen fases biológicas absolutas.

Representan el mayor nivel de conocimiento confirmado que la explotación posee sobre el proceso reproductivo del animal.

Por ejemplo, un estado **GESTANTE** no significa necesariamente que la gestación comenzara en ese momento.

Significa que, a partir de la información registrada, el sistema ya puede afirmar que el animal está gestante.

Del mismo modo, un estado **VACÍA** no significa que el animal nunca haya estado gestante ni que no pueda iniciar un nuevo proceso reproductivo. Significa ausencia de gestación activa conocida (puede estar gestante sin que el sistema lo sepa).

Representa que, según el conocimiento actualmente disponible y el ciclo reproductivo vigente, no existe una gestación activa conocida.

Los estados nunca intentan reconstruir acontecimientos desconocidos.

Únicamente resumen el conocimiento reproductivo disponible en cada momento.

---

## Estados definidos por el modelo

Actualmente el dominio reproductivo contempla los siguientes estados:

| Estado | Significado |
|---------|-------------|
| **VACÍA** | No existe conocimiento de una gestación activa. El animal puede iniciar un nuevo proceso reproductivo. |
| **CUBIERTA** | Existe una cubrición registrada. La gestación todavía no ha sido confirmada, aunque puede llegar a producirse un parto directamente desde este estado. |
| **GESTANTE** | La gestación ha sido confirmada y forma parte del conocimiento conocido por la explotación. |

Estos son los únicos estados que forman parte de `estado_reproductivo`.

Cada uno de ellos constituye una fotografía del conocimiento actual del sistema.

No representan etapas obligatorias de un proceso biológico ni implican que cada ciclo tenga que pasar necesariamente por todos los estados ni seguir una secuencia fija.

El modelo representa el conocimiento disponible en cada momento y permite, por ejemplo, que un ciclo se inicie directamente mediante una confirmación de gestación sin que exista una cubrición previamente registrada.

IMPORTANTE: la relación madre cría, no se refleja en el estado reproductivo de la madre:
* La situación de las crías respecto de su madre no se representa mediante un estado reproductivo adicional de la madre, como por ejemplo LACTANTE (NO es un estado reproductivo real y por tanto NO debe usarse en ningún caso).
* La dependencia funcional madre-cría se representa mediante el vínculo materno y su estado correspondiente, mientras que la continuidad de ese vínculo determina la evolución del ciclo reproductivo que contiene el Parto que originó las crías
* Por tanto, el estado reproductivo de la madre y la existencia de una dependencia funcional madre-cría representan dimensiones diferentes del conocimiento del animal.

---

# El modelo y la experiencia de usuario

Existe un último aspecto que conviene comprender antes de describir el funcionamiento del ciclo reproductivo.

Aunque el dominio se construye a partir de eventos, el usuario no trabaja directamente con ellos.

La interfaz de usuario presenta **acciones de negocio**, no eventos técnicos.

Desde el punto de vista del ganadero, acciones como:

- Registrar cubrición.
- Confirmar gestación.
- Registrar parto.
- Registrar destete.

constituyen operaciones independientes y fácilmente comprensibles.

Sin embargo, internamente una misma acción puede generar uno o varios eventos, actualizar distintas proyecciones o ejecutar reglas adicionales del dominio.

Del mismo modo, un mismo evento puede formar parte de diferentes procesos internos sin que el usuario necesite conocer esa complejidad.

Esta separación es deliberada.

La experiencia de usuario se diseña para reflejar el lenguaje habitual de la explotación.

El modelo interno, en cambio, se organiza alrededor de eventos, reglas de negocio y proyecciones.

Ambos describen la misma realidad, pero desde perspectivas diferentes.

Esta separación también implica que determinados conceptos internos del dominio no tienen por qué exponerse directamente al usuario.

Un ejemplo representativo es la edad gestacional estimada utilizada cuando una Confirmación de gestación inicia un ciclo reproductivo.

Desde el punto de vista del dominio, este dato permite reconstruir temporalmente el conocimiento disponible para calcular las proyecciones correspondientes.

Sin embargo, la interfaz no solicitará al usuario una "edad gestacional".

Solicitará una información mucho más natural:

> ¿Desde hace cuántos meses aproximadamente está gestante?

Esta traducción entre el lenguaje del dominio y el lenguaje del usuario constituye una responsabilidad de la experiencia de usuario y permite mantener un modelo interno preciso sin trasladar dicha complejidad a la interfaz.

Esta independencia permite que la evolución del dominio no obligue necesariamente a modificar la experiencia de usuario y, al mismo tiempo, evita que las decisiones de diseño de la interfaz condicionen la estructura interna del modelo.

# El ciclo reproductivo

Hasta este punto hemos definido los conceptos que utiliza el modelo reproductivo.

Sin embargo, todavía falta responder a una pregunta importante.

¿Cómo se relacionan todos esos conceptos entre sí?

La respuesta la proporciona el ciclo reproductivo.

El ciclo constituye la unidad sobre la que el sistema organiza toda la información relacionada con la reproducción de un animal.

No representa un único acontecimiento.

Representa la historia completa de un proceso reproductivo, desde su inicio hasta su finalización.

Gracias a él, eventos que por separado únicamente describen hechos puntuales pasan a formar parte de un mismo contexto.

Una cubrición deja de ser simplemente una cubrición.

Pasa a ser el inicio de un determinado ciclo.

Una confirmación de gestación permite consolidar el conocimiento sobre ese mismo proceso.

Un parto deja de ser únicamente un parto.

Un parto pasa a formar parte del ciclo reproductivo que originó la gestación y, al mismo tiempo, puede dar lugar a un nuevo ciclo reproductivo actual para la madre (si la madre sigue teniendo tipo productivo = reproductora, tras el parto iniciará un nuevo ciclo con estado "vacía").

Un destete deja de interpretarse como un evento aislado para convertirse en un acontecimiento que modifica la dependencia funcional entre la madre y una de sus crías. El destete pertenece al ciclo reproductivo cuyo parto originó dicha cría.

Por tanto, un animal puede tener simultáneamente:

* un **ciclo actual**, que representa el contexto reproductivo disponible para nuevas operaciones reproductivas;
* uno o más **ciclos históricos abiertos**, que permanecen abiertos porque todavía existen dependencias funcionales derivadas de acontecimientos ocurridos durante esos ciclos.

La existencia de un ciclo actual no implica que todos los ciclos anteriores estén necesariamente cerrados.

Del mismo modo, la existencia de un ciclo histórico abierto no impide que la madre pueda haber iniciado posteriormente un nuevo proceso reproductivo.

El ciclo reproductivo aporta, por tanto, el contexto necesario para interpretar correctamente cada evento.

Sin él, la aplicación únicamente dispondría de una sucesión cronológica de acontecimientos independientes.

Con él, el sistema puede comprender qué eventos pertenecen al mismo proceso reproductivo y cuáles corresponden a procesos diferentes.

---

## Un ciclo representa un único proceso reproductivo

Cada ciclo reproductivo agrupa exclusivamente los acontecimientos que pertenecen a un mismo proceso reproductivo.

Cuando dicho proceso finaliza, también finaliza el ciclo.

Si posteriormente el animal inicia una nueva reproducción, esta se desarrolla en un nuevo ciclo independiente del anterior.

Esta separación permite conservar la historia completa del animal sin mezclar acontecimientos que pertenecen a reproducciones distintas.

Cada ciclo puede analizarse individualmente y, al mismo tiempo, formar parte del historial reproductivo global del animal.

El ciclo no representa una propiedad permanente del animal.

Representa un proceso concreto que comienza, evoluciona y finaliza.

Un mismo animal puede completar numerosos ciclos reproductivos a lo largo de su vida.

La existencia de varios ciclos abiertos de forma simultánea no contradice esta regla.

Los ciclos abiertos simultáneamente corresponden a procesos reproductivos diferentes que todavía conservan alguna consecuencia funcional pendiente.

En particular, después de un Parto puede coexistir:

* el ciclo que contiene el Parto y que permanece abierto mientras existan dependencias maternas derivadas de las crías nacidas en él;
* un nuevo ciclo actual de la madre, disponible para una nueva reproducción.

Cada uno de estos ciclos mantiene su propia historia y sus propias reglas de continuidad.

### El ciclo no se cierra por un evento concreto

El cierre del ciclo no debe interpretarse como una consecuencia directa de un evento reproductivo concreto.

En particular:

* el Parto no cierra necesariamente el ciclo que lo contiene;
* un Destete individual no cierra necesariamente el ciclo que originó la cría;
* la existencia de varias crías puede prolongar la dependencia funcional derivada del Parto aunque alguna de ellas ya haya finalizado su vínculo o haya sido destetada;
* el ciclo que contiene el Parto finaliza cuando desaparece toda dependencia funcional activa derivada de las crías nacidas en dicho ciclo.

Por tanto, el dominio no pregunta:

> ¿Ha ocurrido un Destete?

Pregunta:

> ¿Queda alguna dependencia funcional activa derivada de las crías originadas por este ciclo? ¿Queda alguna cría viva que continúe dependiendo funcionalmente de la madre?

Mientras la respuesta sea sí, el ciclo continúa abierto.

Cuando la respuesta pasa a ser no, el ciclo puede finalizar.

Esta regla permite representar correctamente tanto los casos habituales de una única cría como situaciones en las que existen varias crías con fechas de destete diferentes o en las que alguna cría deja de depender de la madre por otros motivos.

El cierre del ciclo es, por tanto, una consecuencia derivada del estado de los vínculos madre-cría y no un hecho ganadero independiente.

### Nuevo ciclo

Cuando un ciclo finaliza, el dominio determina si la reproductora continúa siendo elegible para un nuevo ciclo.

Si continúa siéndolo y no existe ya un ciclo actual que represente el proceso reproductivo vigente de la madre, se crea el siguiente ciclo en estado `VACÍA`.

La creación del nuevo ciclo no constituye un evento del historial del animal.

Es una consecuencia interna del dominio necesaria para mantener correctamente la continuidad del ciclo reproductivo.

El historial de eventos continuará mostrando únicamente hechos ganaderos reales.

Por este motivo, el usuario no verá eventos como "inicio de ciclo" o "cierre de ciclo".

La existencia del nuevo ciclo se reflejará mediante el estado reproductivo proyectado y mediante el historial reproductivo agregado que presenta la aplicación.


---

## El ciclo proporciona contexto a los eventos

Uno de los errores más habituales al diseñar un modelo reproductivo consiste en interpretar los eventos únicamente de forma aislada.

Sin embargo, un mismo tipo de evento puede tener significados diferentes dependiendo del contexto en el que aparece.

Un parto solo puede comprenderse correctamente cuando se conoce el proceso reproductivo al que pertenece.

Lo mismo ocurre con una confirmación de gestación o con un destete.

Por este motivo cada evento reproductivo queda asociado al ciclo al que pertenece.

La asociación no se determina simplemente buscando un ciclo abierto.

Cuando existen varios ciclos abiertos, el dominio debe identificar el ciclo funcionalmente correspondiente al evento.

Para las nuevas operaciones reproductivas de la madre se utiliza el ciclo actual.

Los acontecimientos relacionados con una dependencia materna histórica, como el Destete de una cría, deben asociarse al ciclo reproductivo que originó dicha dependencia.

---

## El ciclo también representa conocimiento

Del mismo modo que ocurre con el estado reproductivo, un ciclo no intenta reconstruir exactamente todo el proceso biológico vivido por el animal.

Representa únicamente el proceso reproductivo que la explotación conoce.

En la mayoría de los casos el ciclo comenzará con una cubrición registrada.

Sin embargo, existen situaciones en las que la primera información disponible consiste directamente en una confirmación de gestación.

En ese caso el ciclo también puede iniciarse, aunque parte de la historia anterior permanezca desconocida.

El modelo acepta esta situación porque refleja fielmente el conocimiento disponible.

No intenta completar retrospectivamente la información que nunca llegó a registrarse.

---

## Apertura y cierre del ciclo

Todo ciclo reproductivo posee un momento de inicio y un momento de finalización.

Entre ambos se desarrollan todos los acontecimientos relacionados con ese proceso reproductivo.

La apertura del ciclo se produce cuando aparece el primer hecho que permite justificar un nuevo proceso reproductivo, normalmente una Cubrición o, en determinados casos, una Confirmación de Gestación sin Cubrición previa.

La finalización del ciclo no depende de una duración determinada ni del paso del tiempo.

Tampoco depende directamente de un evento concreto como el Destete.

Para los ciclos que generan una dependencia funcional madre-cría, el ciclo permanece abierto mientras exista alguna dependencia activa derivada de las crías originadas por dicho ciclo.

La regla de cierre es:

> **Un ciclo reproductivo que mantiene dependencias funcionales madre-cría finaliza cuando deja de existir cualquier vínculo materno activo derivado de ese ciclo.**

Esta condición se evalúa específicamente sobre las dependencias originadas por ese ciclo y no sobre el estado reproductivo actual de la madre.

El hecho de que la madre haya iniciado posteriormente un nuevo ciclo no modifica la continuidad ni la atribución histórica de las dependencias pertenecientes al ciclo anterior.

El sistema no necesita registrar un evento específico de "cierre de ciclo".

El cierre constituye una consecuencia derivada del conocimiento disponible.

### Finalización individual de los vínculos

Cada cría nacida dentro del ciclo mantiene inicialmente un vínculo materno activo.

Ese vínculo puede finalizar por:

* Destete;
* Venta de la cría antes del Destete;
* Muerte de la cría antes del Destete;
* Venta de la madre;
* Muerte de la madre.

Cuando un vínculo finaliza, deja de contribuir a la continuidad del ciclo.

La finalización de un vínculo individual no implica necesariamente la finalización del ciclo.

El ciclo solo puede finalizar cuando ya no queda ninguna cría viva y funcionalmente dependiente de la madre.

### Creación del ciclo siguiente

Cuando el último vínculo activo desaparece, el ciclo actual finaliza.
El cierre del ciclo histórico no implica necesariamente la creación de un nuevo ciclo.

Si la madre ya dispone de un ciclo actual iniciado posteriormente, ese ciclo continúa siendo el contexto reproductivo vigente para las nuevas operaciones.

Si no existe un ciclo actual y la madre continúa siendo `REPRODUCTORA` y elegible para participar en el dominio reproductivo, el dominio puede crear un nuevo ciclo en estado `VACÍA`.

La creación del nuevo ciclo no constituye un evento del historial del animal.

No se genera ningún evento de historial para representar su creación.

El siguiente evento reproductivo registrado por el usuario, como una Cubrición o una Confirmación de Gestación, será el primer hecho visible que permitirá comprender la evolución de ese nuevo ciclo.

El historial conserva los hechos ganaderos reales y los ciclos se utilizan como estructura de contexto para agrupar e interpretar esos hechos.

### Cierre por discontinuidad temporal

El modelo no utiliza un cierre automático del ciclo basado exclusivamente en el paso del tiempo.

La ausencia prolongada de nuevos acontecimientos reproductivos no constituye por sí misma un evento reproductivo ni provoca automáticamente el cierre de un ciclo.

Cuando un ciclo cumple las condiciones establecidas para la revisión reproductiva, el sistema puede generar una alerta o propuesta de revisión conforme al umbral de días parametrizado para la especie.

La revisión reproductiva permite gestionar explícitamente situaciones en las que existe una discontinuidad temporal sin introducir un cierre automático que podría modificar incorrectamente la historia reproductiva.

El concepto de `TIMEOUT`, utilizado en etapas anteriores del diseño, queda descartado como regla operativa del modelo actual.

---

## Coexistencia de ciclos abiertos

Un animal puede tener más de un ciclo reproductivo abierto de forma simultánea.

Esta situación no constituye una anomalía.

Puede producirse, especialmente, cuando un Parto mantiene abierto el ciclo que lo originó debido a la existencia de dependencias funcionales madre-cría, mientras la madre ya ha iniciado un nuevo ciclo reproductivo.

Por tanto, debe distinguirse entre:

* **ciclo actual**: ciclo que representa el contexto reproductivo vigente de la madre y al que se asociarán las nuevas operaciones reproductivas;
* **ciclo histórico abierto**: ciclo anterior que todavía no ha finalizado porque mantiene dependencias funcionales derivadas de acontecimientos ocurridos durante ese proceso.

La existencia de varios ciclos abiertos no implica que un evento pueda pertenecer simultáneamente a varios ciclos.

Cada evento reproductivo pertenece a un único ciclo.

La asignación debe determinarse según la naturaleza y el contexto del evento.

Las nuevas operaciones reproductivas de la madre se asocian al ciclo actual.

Los eventos relacionados con dependencias históricas, como el Destete de una cría, se asocian al ciclo que originó dicha dependencia.

Por tanto, el dominio no debe utilizar la existencia de un único ciclo abierto como mecanismo para determinar automáticamente el ciclo de un evento.

El ciclo actual debe identificarse explícitamente como el contexto reproductivo vigente para nuevas operaciones.

Los ciclos históricos conservan su propia identidad, eventos y reglas de cierre hasta que desaparezcan las dependencias que los mantienen abiertos.

Una vez cerrado un ciclo, deja de participar en nuevas operaciones reproductivas, pero permanece disponible como parte del historial reproductivo del animal.

---

## Dependencia funcional madre-cría

El ciclo reproductivo utiliza una relación funcional entre la madre y las crías nacidas dentro del ciclo para determinar si el proceso reproductivo continúa abierto.

Esta relación no representa únicamente genealogía.

La genealogía responde a:

> ¿Quién es la madre de este animal?

La dependencia funcional responde a:

> ¿Esta cría continúa dependiendo de su madre dentro del proceso reproductivo que se está gestionando?

Ambos conceptos son independientes.

### Genealogía

La relación `madre_id` pertenece a la identidad permanente del animal.

Cuando una cría se crea a partir de un Parto, su `madre_id` identifica a la madre de forma permanente.

Este dato no se modifica como consecuencia del Destete, de una Venta, de una Muerte ni de ningún otro acontecimiento posterior.

La genealogía permanece aunque la relación funcional entre ambos animales haya terminado.

### Estado del vínculo

La dependencia funcional se representa mediante el campo técnico:

`animal.estado_vinculo_materno`

Sus valores posibles son:

| Valor        | Significado                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `NULL`       | El sistema no dispone de un vínculo materno funcional aplicable o no puede determinarlo a partir de la información disponible. |
| `ACTIVO`     | La cría mantiene una dependencia funcional de su madre.                                                                        |
| `FINALIZADO` | La dependencia funcional entre madre y cría ha terminado.                                                                      |

Este campo pertenece a `ANIMAL`.

Es un dato derivado y exclusivamente interno.

No es editable por el usuario y no forma parte de la interfaz como dato operativo.

### Nacimiento del vínculo

Cuando el Parto crea una nueva cría viva:

* se crea la entidad `ANIMAL`;
* se establece `madre_id`;
* `tipo_productivo = CRÍA`;
* `estado_vinculo_materno = ACTIVO`.

De esta forma, el vínculo nace como consecuencia del mismo hecho que crea la cría.

No es necesario crear una entidad independiente para representar la relación.

### Finalización del vínculo

El vínculo pasa a `FINALIZADO` cuando la cría deja de depender funcionalmente de la madre.

Las causas contempladas actualmente son:

* Destete;
* Venta de la cría antes del Destete;
* Muerte de la cría antes del Destete;
* Venta de la madre;
* Muerte de la madre.

La finalización del vínculo es independiente de la genealogía.

Una vez finalizado, `madre_id` continúa conservando la relación histórica entre ambos animales.

### Regla para determinar la continuidad del ciclo

Un ciclo reproductivo que contiene un Parto permanece abierto mientras exista al menos una cría originada por ese Parto que cumpla simultáneamente:

```text
tipo_productivo = CRÍA
estado_vinculo_materno = ACTIVO
estado_vital = VIVO
```

Estas son las únicas crías que mantienen actualmente una dependencia funcional relevante para la continuidad del ciclo.

La comprobación debe realizarse sobre las crías originadas por el Parto perteneciente al ciclo evaluado.

No debe utilizarse el conjunto global de crías dependientes de la madre ni el estado del ciclo actual de la madre para determinar la continuidad de un ciclo histórico.

Una cría que ya ha pasado a `RECRÍA` no debe volver a participar en esta comprobación.

Del mismo modo, una cría que continúa siendo `CRÍA` pero ha sido vendida o ha muerto no mantiene un vínculo funcional activo.

Cuando no existe ninguna cría que cumpla estas condiciones, el dominio puede determinar que el ciclo reproductivo ha finalizado.

### Transición CRÍA → RECRÍA

En el caso del Destete, la finalización del vínculo y el cambio de tipo productivo forman parte de una única operación de negocio.

La secuencia lógica es:

```text
Destete
    ↓
finalizar vínculo materno
    ↓
CRÍA → RECRÍA
```

Ambos cambios deben persistirse de forma atómica.

No debe existir un estado persistente en el que una cría destetada permanezca indefinidamente como `CRÍA + FINALIZADO`.

La combinación `CRÍA + FINALIZADO` puede existir temporalmente como consecuencia de una Venta o Muerte antes del Destete, pero no debe ser el resultado final de un Destete correctamente procesado.

### Naturaleza del vínculo

El vínculo madre-cría no constituye un nuevo evento.

Tampoco sustituye a los eventos de Parto, Destete, Venta o Muerte.

Los eventos continúan siendo la fuente de verdad.

`estado_vinculo_materno` es una proyección persistida que permite consultar de forma eficiente el conocimiento actual sobre la dependencia funcional sin tener que reconstruirlo en cada lectura.

El historial conserva los acontecimientos reales.

El estado del vínculo facilita la interpretación operativa actual.

El ciclo reproductivo utiliza dicho estado para determinar si todavía existe dependencia funcional derivada del proceso reproductivo.

---

# La evolución del ciclo reproductivo

Una vez iniciado un ciclo reproductivo, este evoluciona conforme aumenta el conocimiento que la explotación posee sobre dicho proceso.

Es importante comprender que el modelo no intenta reproducir automáticamente todas las fases biológicas por las que atraviesa el animal.

El paso del tiempo, por sí solo, no hace avanzar el ciclo.

Lo que realmente hace evolucionar el modelo es la incorporación de nuevos hechos conocidos.

Cada nuevo evento amplía el conocimiento disponible y permite interpretar el proceso reproductivo con mayor precisión.

Por este motivo el ciclo no avanza porque transcurran días o meses.

Avanza porque el sistema conoce algo nuevo.

Esta decisión mantiene el modelo completamente alineado con el principio fundamental del dominio: representar conocimiento, no biología.

---

## El conocimiento puede aumentar de distintas maneras

No todos los ciclos reproductivos comienzan con el mismo nivel de información.

En una explotación con un seguimiento muy exhaustivo es habitual registrar la cubrición desde el primer momento.

Sin embargo, en otras situaciones el primer hecho conocido puede ser una confirmación de gestación sin que exista una Cubrición registrada previamente.

El modelo admite esta situación porque representa conocimiento válido sobre un proceso reproductivo que ya está en curso.

El Parto, en cambio, no constituye por sí mismo el inicio de un ciclo reproductivo.

El Parto presupone que existe un proceso reproductivo previo. Por este motivo, si no existe ninguna Cubrición ni ninguna Confirmación de gestación registrada que permita justificarlo, deberá registrarse previamente una Confirmación de gestación.

Lo importante no es que todos los ciclos recorran exactamente el mismo camino, sino que el sistema sea capaz de representar correctamente la información que realmente conoce.

A medida que aparecen nuevos eventos, el conocimiento aumenta y el modelo continúa evolucionando desde ese punto.

Nunca intenta reconstruir retrospectivamente aquello que nunca llegó a registrarse.

---

## El modelo distingue entre flujo habitual y situaciones excepcionales

Aunque el modelo admite distintos niveles de información, no todos los escenarios tienen la misma relevancia operativa.

La inmensa mayoría de los ciclos reproductivos seguirán un recorrido muy parecido.

Se registrará una cubrición.

Posteriormente podrá confirmarse la gestación.

Finalmente se registrarán el parto y el destete.

Este constituye el flujo habitual sobre el que se apoya la mayor parte de la gestión reproductiva.

Sin embargo, el modelo también contempla determinadas situaciones excepcionales cuando representan escenarios frecuentes en la práctica.

Por ejemplo, puede iniciarse un ciclo mediante una confirmación de gestación cuando no existe una cubrición registrada.

Esta posibilidad no pretende ampliar artificialmente la flexibilidad del sistema.

Simplemente permite representar correctamente una situación habitual en explotaciones donde la cubrición no siempre se registra.

Una vez iniciado el seguimiento del ciclo, el modelo continúa aplicando las mismas reglas de evolución y atribución de eventos que en cualquier otro proceso reproductivo.

De este modo se evita que las excepciones terminen convirtiéndose en nuevos flujos de trabajo.

## Reconstrucción temporal del ciclo

Cuando una Confirmación de gestación constituye el primer evento conocido del ciclo, el dominio no dispone de una fecha de Cubrición registrada.

Para poder construir las proyecciones reproductivas será necesario reconstruir una línea temporal aproximada del ciclo.

Esta reconstrucción se realizará exclusivamente durante el procesamiento del evento utilizando:

- fecha de la Confirmación;
- edad gestacional estimada.

A partir de dicha información el dominio calculará internamente una fecha aproximada de inicio de la gestación.

Esta reconstrucción temporal no crea una Cubrición ficticia ni modifica el historial de eventos.

La ausencia de una Cubrición registrada debe conservarse como ausencia de ese hecho conocido.

Esta fecha no constituye un hecho histórico.

Representa únicamente un valor intermedio necesario para construir las proyecciones derivadas del ciclo.

Una vez obtenidas dichas proyecciones, esta información dejará de tener utilidad y no deberá persistirse.

El resto del sistema únicamente observará el resultado final construido por Projection.

---

# Inicio del ciclo reproductivo

Todo ciclo reproductivo comienza cuando aparece el primer hecho que permite afirmar que ha empezado un nuevo proceso reproductivo.

Ese primer hecho dependerá del conocimiento disponible.

En la mayoría de los casos será una cubrición.

En determinadas circunstancias podrá ser una confirmación de gestación.

Ambas situaciones representan el inicio de un nuevo ciclo porque, a partir de ese momento, existe evidencia suficiente para considerar que ha comenzado un nuevo proceso reproductivo.

En cambio, otros acontecimientos no pueden iniciar un ciclo por sí mismos.

Un Parto, por ejemplo, presupone la existencia de un proceso reproductivo previo.

El Parto puede registrarse cuando el animal se encuentra en estado `CUBIERTA` o `GESTANTE`.

En el estado `CUBIERTA` existe una Cubrición registrada, aunque la gestación no haya sido confirmada.

En el estado `GESTANTE` existe además una Confirmación de gestación.

Si no existe ni una Cubrición ni una Confirmación de gestación que permitan justificar el proceso reproductivo, primero deberá registrarse una Confirmación de gestación antes de poder registrar el Parto.

El modelo no crea retrospectivamente una Cubrición para justificar un Parto.

Cuando la Cubrición no fue registrada, la ausencia de ese evento forma parte de la historia conocida y la Confirmación de gestación constituye el primer hecho reproductivo conocido del ciclo.

Esta decisión mantiene la coherencia del modelo sin obligar a reconstruir retrospectivamente acontecimientos desconocidos.

---

# Finalización del ciclo reproductivo

Un ciclo reproductivo finaliza cuando deja de existir cualquier circunstancia que, de acuerdo con las reglas del dominio, requiera mantener abierto ese proceso reproductivo.

La condición de finalización depende del tipo de ciclo y de los acontecimientos que hayan tenido lugar durante él.

En los ciclos que han originado una dependencia funcional madre-cría mediante un Parto, el ciclo permanece abierto mientras exista al menos una dependencia materna activa derivada de las crías originadas por dicho Parto.

El Destete de la última cría que mantiene ese vínculo permite finalizar el ciclo histórico que contiene el Parto.

El Destete no implica necesariamente que finalice el ciclo reproductivo actual de la madre.

La madre puede haber iniciado un nuevo ciclo después del Parto y, en ese caso, ambos ciclos pueden coexistir:

```text
Ciclo histórico
PARTO
  ↓
dependencias madre-cría
  ↓
DESTETE de las últimas crías
  ↓
cierre del ciclo histórico


Ciclo actual de la madre
VACÍA
  ↓
nueva Cubrición
  ↓
nueva Gestación
  ↓
...

```


Por tanto, el cierre de un ciclo histórico no debe interpretarse como una transición del estado reproductivo actual de la madre.

El estado reproductivo de la madre pertenece a su ciclo actual.

Existen también acontecimientos que pueden finalizar un ciclo sin que se produzca un Parto.

Un Aborto pone fin al proceso reproductivo afectado y cierra el ciclo correspondiente con resultado ABORTO.

La finalización por Machorra cierra el ciclo correspondiente con resultado MACHORRA.

Del mismo modo, la Venta o la Muerte del animal pueden provocar el cierre del ciclo reproductivo que corresponda porque el proceso deja de poder continuar dentro de la explotación.

En estos casos, el cierre se produce como consecuencia del acontecimiento que impide continuar el seguimiento del proceso.

La Venta o Muerte de una cría dependiente también puede afectar a la continuidad del ciclo histórico que originó dicha cría, al finalizar su vínculo materno y permitir reevaluar si quedan otras dependencias activas.

El cierre del ciclo es una consecuencia derivada del conocimiento disponible.

No se registra como un evento independiente.

Cada ciclo mantiene su propia historia y su propia fecha de finalización, independientemente de que el animal continúe posteriormente con nuevos procesos reproductivos.

---

# Evolución del conocimiento durante el ciclo reproductivo

Los principios descritos hasta este punto definen cómo interpreta el sistema la información reproductiva.

Sin embargo, la mejor forma de comprender el modelo consiste en observar cómo evoluciona el conocimiento a medida que se registran nuevos acontecimientos.

Los siguientes ejemplos no pretenden describir todos los escenarios posibles.

Su objetivo consiste en ilustrar cómo aplica el modelo sus principios en las situaciones más habituales de una explotación ganadera.

---

## Caso 1. Inicio del ciclo mediante una cubrición

Este constituye el escenario más habitual.

El ganadero registra una cubrición y, a partir de ese momento, el sistema dispone de información suficiente para considerar iniciado un nuevo proceso reproductivo.

Como consecuencia:

- se crea un nuevo ciclo reproductivo;
- el evento queda asociado a dicho ciclo;
- el ciclo pasa a ser el ciclo actual del animal;
- el estado reproductivo pasa a **CUBIERTA**;
- se generan las primeras proyecciones derivadas, como la fecha prevista de parto.

En este momento el sistema todavía no sabe si la gestación llegará a producirse.

Únicamente conoce que ha existido una cubrición.

Por ese motivo el estado continúa siendo **CUBIERTA**.

La existencia de otros ciclos históricos que permanezcan abiertos por dependencias funcionales pendientes no altera esta situación.

El nuevo ciclo es el contexto utilizado para las siguientes operaciones reproductivas de la madre.

---

## Caso 2. Confirmación de la gestación

Cuando posteriormente se confirma la gestación, el conocimiento disponible aumenta.

El sistema ya no necesita limitarse a asumir que pudo existir una gestación.

Ahora puede afirmarla.

Como consecuencia:

- el estado reproductivo pasa a **GESTANTE**;
- la Confirmación queda asociada al mismo ciclo reproductivo;
- el ciclo continúa siendo el ciclo actual del animal;
- las proyecciones pueden recalcularse utilizando la nueva información disponible.

No comienza un nuevo ciclo.

No se modifica la historia.

Simplemente aumenta el conocimiento sobre un proceso reproductivo que ya se encontraba en seguimiento.

---

## Caso 3. Inicio del ciclo mediante una confirmación de gestación

No todas las explotaciones registran las cubriciones.

En ocasiones, el primer hecho conocido consiste directamente en una confirmación de gestación.

El modelo admite esta situación porque representa un conocimiento perfectamente válido.

En este caso:

- la confirmación inicia un nuevo ciclo reproductivo;
- el ciclo pasa a ser el ciclo actual del animal;
- el estado pasa directamente a **GESTANTE**;
- las proyecciones se calculan utilizando la edad gestacional conocida o estimada.

La cubrición puede haber existido realmente o no, pero no forma parte del conocimiento disponible y, por tanto, no forma parte de la historia registrada.

Desde el punto de vista del modelo resulta irrelevante.

Por tanto, el modelo no crea retrospectivamente una Cubrición para completar la historia.

A partir de este momento el ciclo continúa exactamente igual que cualquier otro ciclo iniciado mediante Cubrición.

No será posible registrar posteriormente una cubrición perteneciente al mismo proceso reproductivo.

Esta decisión mantiene un flujo de trabajo sencillo y evita reconstrucciones retrospectivas de la historia ni de hechos que no fueron registrados.

---

## Caso 4. Registro de un parto

El Parto representa un nuevo aumento del conocimiento.

El sistema ya conoce que el proceso reproductivo ha llegado al nacimiento de una o varias crías y puede consolidar la relación genealógica y la dependencia funcional madre-cría.

El Parto puede registrarse tanto desde el estado **CUBIERTA** como desde **GESTANTE**.

En el primer caso nunca llegó a registrarse una Confirmación de gestación.

En el segundo sí.

Ambos escenarios son válidos porque representan historias diferentes que conducen al mismo hecho conocido: se ha producido un Parto.

Como consecuencia:

- se registra el evento `PARTO`;
- se consolidan las crías nacidas y su relación genealógica con la madre;
- se crean las dependencias funcionales madre-cría que correspondan;
- las crías pasan a `tipo_productivo = CRÍA`;
- el ciclo que contiene el Parto permanece abierto mientras existan dependencias funcionales activas derivadas de dicho Parto;
- la madre inicia un nuevo ciclo reproductivo actual en estado **VACÍA**, siempre que continúe siendo `REPRODUCTORA`.

El ciclo que contiene el Parto y el nuevo ciclo actual de la madre son procesos diferentes y pueden coexistir.

Por tanto, después de un Parto pueden existir simultáneamente:

```text
Ciclo histórico del Parto
PARTO
  ↓
dependencias madre-cría
  ↓
DESTETE / Venta / Muerte de las crías
  ↓
cierre del ciclo cuando no queden dependencias activas


Ciclo actual de la madre
VACÍA
  ↓
nueva Cubrición
  ↓
Confirmación de gestación
  ↓
nuevo Parto

```

El Parto no modifica el estado reproductivo actual de la madre a LACTANTE, porque LACTANTE no forma parte del modelo de estados reproductivos.

La situación de dependencia respecto de las crías se representa mediante el vínculo materno y su estado funcional, independientemente del estado reproductivo actual de la madre.

---

## Caso 5. Registro de un aborto

Un aborto finaliza el proceso reproductivo iniciado sin que llegue a producirse un parto.

El Aborto se registra sobre un ciclo reproductivo abierto cuyo estado reproductivo es **CUBIERTA** o **GESTANTE**.

No puede registrarse un aborto sobre un ciclo que ya ha finalizado por otro motivo.

En consecuencia:

- se registra el evento `ABORTO`;
- el ciclo afectado se cierra con resultado `ABORTO`;
- el evento queda asociado al ciclo que contenía el proceso reproductivo interrumpido;
- el resultado del ciclo queda consolidado como **ABORTO**.

Si el animal continúa siendo `REPRODUCTORA`, el dominio crea o mantiene un nuevo ciclo reproductivo actual en estado **VACÍA**, preparado para futuras operaciones reproductivas.

El aborto no elimina la historia previa.

Forma parte permanente del ciclo que acaba de finalizar y permite conservar toda la trazabilidad del proceso.

No se crea ningún ciclo histórico adicional como consecuencia del cierre del ciclo abortado. El nuevo ciclo, cuando corresponda, representa un proceso reproductivo diferente.

---

## Caso 6. Registro del destete

El Destete representa la finalización de la dependencia funcional de una cría respecto de su madre.

La acción se inicia desde la ficha de la madre, pero afecta individualmente a las crías seleccionadas.

Una misma madre puede tener varias crías vinculadas y cada una puede ser destetada en una fecha diferente.

Por tanto, el Destete puede ser parcial.

El evento `DESTETE` pertenece al ciclo reproductivo histórico cuyo Parto originó la cría afectada.

Esta atribución es importante porque la madre puede haber iniciado entretanto un nuevo ciclo reproductivo actual.

Cuando se registra el Destete de una cría:

* se registra el evento `DESTETE` asociado a la madre;
* se registra el mismo evento asociado a la cría;
* ambos eventos quedan contextualizados en el ciclo que corresponde al proceso reproductivo que originó la dependencia;
* el vínculo materno de esa cría pasa de `ACTIVO` a `FINALIZADO`;
* el tipo productivo de la cría pasa de `CRÍA` a `RECRÍA`;
* la cría deja de contribuir a la continuidad del ciclo histórico que contiene el Parto que la originó.

El evento se registra sobre ambos animales porque el hecho tiene significado operativo tanto para la madre como para la cría.

### Destete parcial

Si una madre tiene varias crías vinculadas, el Destete de una parte de ellas no finaliza el ciclo.

Por ejemplo:

```text
Madre
├── Cría A → DESTETADA
├── Cría B → ACTIVA
└── Cría C → ACTIVA
```

El ciclo histórico continúa abierto porque todavía existen vínculos maternos activos.

Si posteriormente se desteta la Cría B:

```text
Madre
├── Cría A → FINALIZADO
├── Cría B → FINALIZADO
└── Cría C → ACTIVA
```

El ciclo histórico continúa abierto.

Finalmente:

```text
Madre
├── Cría A → FINALIZADO
├── Cría B → FINALIZADO
└── Cría C → FINALIZADO
```

Ya no existe ninguna dependencia funcional activa.

En ese momento el dominio puede finalizar el ciclo histórico que contiene el Parto.

### Finalización del ciclo tras el Destete

El Destete de una cría no es equivalente al cierre del ciclo.

El cierre únicamente se produce cuando el Destete afecta a la última cría que mantenía un vínculo activo con la madre, dentro del proceso reproductivo originado por ese Parto.

Cuando desaparece el último vínculo:

* el ciclo histórico del Parto se considera finalizado;
* se establece su fecha de finalización;
* la proyección del ciclo refleja que ya no existen dependencias funcionales pendientes.

Este cierre no modifica automáticamente el estado reproductivo actual de la madre.

Si la madre ya dispone de un ciclo reproductivo actual, dicho ciclo continúa siendo el contexto de sus nuevas operaciones reproductivas.

Si por cualquier circunstancia no existe un ciclo actual y la madre continúa siendo REPRODUCTORA, el dominio podrá crear uno en estado VACÍA conforme a las reglas de creación del ciclo.

No se registra ningún evento adicional para representar el cierre del ciclo o la creación del nuevo ciclo.

La historia de eventos permanece formada únicamente por los hechos ocurridos en la explotación.

### Historia del ciclo

El historial de eventos conserva cada Destete individual.

El carrusel del historial reproductivo es quien agregará estos acontecimientos para explicar la historia completa del ciclo.

De esta forma el sistema puede distinguir entre:

* una madre con una única cría destetada correctamente;
* una madre con varias crías destetadas en fechas diferentes;
* una madre cuyas crías han dejado de depender de ella por causas diferentes;
* ciclos en los que existieron pérdidas antes del Destete.

El cierre del ciclo no sustituye esta información ni intenta resumirla en un único "motivo de cierre".

La historia detallada permanece en los eventos y la interpretación agregada pertenece a la proyección del ciclo.

La existencia de un nuevo ciclo reproductivo de la madre no modifica ni absorbe la historia del ciclo anterior.

Cada ciclo conserva los eventos que pertenecen al proceso reproductivo que representa.

---

## Caso 7. Venta o muerte de la madre o de una cría

La Venta y la Muerte son eventos de gestión o de causa mayor, no eventos reproductivos.

Sin embargo, mientras exista una dependencia funcional activa entre una madre y una cría, estos acontecimientos pueden modificar dicha dependencia y afectar a la continuidad del ciclo histórico que contiene el Parto que originó la relación.

### Venta o muerte de una cría

Si una cría continúa siendo:

```text
tipo_productivo = CRÍA
estado_vinculo_materno = ACTIVO
```

y se registra su Venta o Muerte antes del Destete:

* el evento de Venta o Muerte se registra sobre la propia cría;
* el vínculo materno pasa a `FINALIZADO`;
* la cría deja de contribuir a la continuidad del ciclo histórico que originó dicha dependencia;
* el dominio vuelve a evaluar si existen otras crías que mantengan vínculos activos.

Si todavía existe alguna otra cría dependiente, el ciclo histórico continúa abierto.

Si no queda ninguna, el ciclo histórico finaliza.

Una vez finalizado el vínculo, los acontecimientos posteriores que afecten a esa cría ya no tienen repercusión el ciclo reproductivo histórico de la madre.

En particular, si una cría fue destetada previamente y posteriormente se vende o muere cuando ya es `RECRÍA`, ese evento pertenece únicamente a la historia de la propia cría y no afecta al ciclo reproductivo histórico de la madre.

La Venta o Muerte de una cría tampoco modifica el ciclo reproductivo actual de la madre, salvo por las consecuencias que correspondan a la dependencia funcional del ciclo histórico al que pertenecía.

### Venta o muerte de la madre

La Venta o Muerte de la madre provoca la finalización de todos los vínculos maternos que continúen activos.

El ciclo reproductivo histórico y/o las dependencias funcionales dejan de poder continuar porque la madre ya no puede participar en ellas dentro de la explotación.

Como consecuencia:
- los vínculos maternos activos pasan a FINALIZADO;
- los ciclos históricos que dependan de esas relaciones se reevalúan y pueden quedar finalizados si ya no existen otras dependencias activas;
- los ciclos reproductivos de la madre que ya no puedan continuar dentro de la explotación se cierran conforme a las reglas del dominio;
- no se crea ningún nuevo ciclo para la madre.

La relación genealógica `madre_id` de las crías se conserva íntegramente.

La Venta o Muerte no elimina la historia reproductiva ni la genealogía.

### Regla general

La finalización del vínculo materno se produce independientemente del motivo que la origine.

Lo relevante para el dominio reproductivo es si la dependencia funcional continúa existiendo.

La Venta o Muerte no generan un evento artificial de "fin de vínculo" ni un evento de "cierre de ciclo".

Los hechos reales permanecen registrados como eventos de Venta o Muerte.

El estado `estado_vinculo_materno` y la proyección de los ciclos permiten interpretar sus consecuencias sobre la dependencia madre-cría y sobre la continuidad de cada ciclo afectado.

Las consecuencias se evalúan sobre el ciclo al que pertenece cada dependencia o proceso, sin asumir que existe un único ciclo abierto para el animal.

---

# Decisiones de diseño del modelo

El modelo reproductivo no es la única forma posible de representar la reproducción de un animal.

Durante su diseño se valoraron distintas alternativas para representar estados, eventos y ciclos.

Las decisiones finalmente adoptadas persiguen siempre el mismo objetivo: mantener un modelo sencillo de comprender, coherente con el conocimiento disponible y suficientemente flexible para adaptarse a distintas formas de trabajar sin incrementar innecesariamente su complejidad.

Las siguientes decisiones resumen la filosofía que guía todo el dominio reproductivo.

---

## El estado reproductivo no es editable

El estado reproductivo constituye una consecuencia del conocimiento registrado.

No representa un dato introducido manualmente por el usuario.

Permitir modificarlo directamente implicaría romper la coherencia entre el estado actual y la historia de eventos del animal.

Por este motivo el estado reproductivo siempre se obtiene a partir de los eventos registrados y nunca puede modificarse de forma independiente.

El estado reproductivo representa exclusivamente la situación del ciclo reproductivo actual del animal.

La existencia de ciclos históricos que permanezcan abiertos por dependencias funcionales pendientes no modifica este estado.

Por tanto, un animal puede tener ciclos reproductivos históricos abiertos y, al mismo tiempo, encontrarse en estado `VACÍA`, `CUBIERTA` o `GESTANTE` dentro de su ciclo actual.

---

## El ciclo reproductivo tampoco se gestiona manualmente

Del mismo modo que ocurre con el estado reproductivo, el usuario nunca crea ni cierra un ciclo de forma explícita.

Los ciclos se crean como consecuencia de acontecimientos reproductivos que justifican el inicio de un nuevo proceso y se consideran finalizados cuando dejan de existir las condiciones que obligan a mantenerlos abiertos.

El cierre del ciclo es una consecuencia derivada de los eventos y de las dependencias funcionales existentes.

No existe un evento independiente de "cierre de ciclo".

Un animal puede tener simultáneamente:

- un ciclo reproductivo actual, utilizado para sus nuevas operaciones reproductivas;
- uno o varios ciclos históricos abiertos, cuando todavía existen dependencias funcionales pendientes derivadas de procesos reproductivos anteriores.

Esta coexistencia no representa una inconsistencia.

Cada ciclo representa un proceso reproductivo diferente y mantiene su propia historia.

Cada evento reproductivo se asigna a un único ciclo, pero un mismo animal puede tener eventos pertenecientes a distintos ciclos abiertos.

Esta separación permite conservar correctamente la historia de un Parto anterior mientras la madre continúa desarrollando un nuevo ciclo reproductivo.

---

## Los estados representan conocimiento, no fases biológicas

Una de las decisiones fundamentales del modelo consiste en no representar directamente las fases biológicas de la reproducción.

En su lugar, los estados describen aquello que la explotación sabe sobre el proceso reproductivo actual del animal.

Los estados reproductivos son únicamente:

- `VACÍA`
- `CUBIERTA`
- `GESTANTE`

No existe el estado reproductivo `LACTANTE`.

La existencia de una cría dependiente después de un Parto no constituye un estado reproductivo de la madre.

Esta situación se representa mediante la relación funcional madre-cría y mediante el estado del vínculo materno.

Por este motivo, dos animales pueden encontrarse en el mismo estado reproductivo aun habiendo seguido recorridos diferentes.

Lo importante no es reconstruir exactamente la biología, sino representar correctamente el conocimiento disponible.

La separación entre estado reproductivo y dependencia materna permite además que una madre pueda encontrarse en `VACÍA`, `CUBIERTA` o `GESTANTE` dentro de su ciclo actual mientras un ciclo histórico anterior continúa abierto por dependencias madre-cría pendientes.

---

## El modelo distingue entre historia y proyección

La historia reproductiva está formada exclusivamente por hechos registrados mediante eventos.

Las proyecciones, en cambio, representan la interpretación que el sistema realiza de esa historia para facilitar la gestión diaria.

Ambos conceptos cumplen responsabilidades distintas y nunca deben confundirse.

Modificar una proyección no altera la historia.

Del mismo modo, registrar un nuevo evento no modifica los acontecimientos anteriores, sino que amplía el conocimiento disponible para construir nuevas proyecciones.

El ciclo reproductivo y su estado de finalización forman parte de esta interpretación derivada.

El sistema no registra un evento artificial para indicar que un ciclo se ha cerrado.

El cierre se determina a partir de los eventos existentes y de las reglas del dominio.

Por tanto, la historia conserva los hechos reales y las proyecciones permiten interpretar qué ciclo corresponde a cada proceso, cuál es su situación y si todavía existen dependencias funcionales que impiden considerarlo finalizado.

---

## La experiencia de usuario y el modelo interno evolucionan de forma independiente

La aplicación no expone directamente la estructura interna del dominio reproductivo.

El usuario trabaja con acciones de negocio que reflejan el lenguaje habitual de la explotación.

Internamente, dichas acciones pueden traducirse en uno o varios casos de uso, generar distintos eventos o activar diferentes reglas del dominio.

Esta separación permite mejorar la experiencia de usuario sin comprometer la coherencia del modelo interno y, al mismo tiempo, posibilita que el dominio evolucione sin obligar a modificar continuamente la interfaz.

---

## El modelo favorece un flujo de trabajo claro

Durante el diseño se optó deliberadamente por limitar determinados recorridos que, aunque biológicamente posibles, aportaban muy poco valor desde el punto de vista de la gestión.

El objetivo nunca ha sido representar todas las situaciones imaginables.

El objetivo consiste en ofrecer un flujo de trabajo sencillo, consistente y fácil de comprender para la mayoría de explotaciones.

Cuando el conocimiento disponible resulta suficiente para continuar un proceso reproductivo, el modelo continúa desde ese punto.

Cuando una reconstrucción retrospectiva únicamente añadiría complejidad sin aportar información relevante para la gestión, el modelo decide no incorporarla.

Esta filosofía explica decisiones como permitir iniciar un ciclo mediante una Confirmación de gestación y, al mismo tiempo, impedir registrar posteriormente una Cubrición perteneciente a ese mismo proceso reproductivo.

El modelo tampoco utiliza el paso del tiempo como mecanismo automático para cerrar ciclos.

Una ausencia prolongada de acontecimientos reproductivos puede justificar una revisión reproductiva, pero no constituye por sí misma un evento ni provoca un cierre automático.

Cuando corresponde, la revisión reproductiva se determina mediante el umbral de días parametrizado para la especie.

De esta forma el modelo diferencia entre:

- hechos reproductivos registrados;
- interpretación derivada de esos hechos;
- alertas o propuestas de gestión;
- decisiones explícitas del usuario que generan nuevos eventos.

Cada uno de estos elementos mantiene una responsabilidad diferente dentro del dominio.

---

## El ciclo actual y los ciclos históricos son conceptos diferentes

El modelo distingue entre el ciclo reproductivo actual del animal y los ciclos históricos que todavía permanecen abiertos por circunstancias pendientes.

El ciclo actual representa el proceso reproductivo sobre el que se realizan las nuevas operaciones reproductivas de la madre.

Los ciclos históricos abiertos representan procesos anteriores que todavía requieren seguimiento debido a dependencias funcionales que no han finalizado.

Un ciclo histórico abierto no se convierte en el ciclo actual por el mero hecho de permanecer abierto.

Del mismo modo, la creación de un nuevo ciclo actual no implica el cierre automático de los ciclos históricos anteriores.

Esta distinción es especialmente importante después de un Parto.

El ciclo que contiene el Parto puede permanecer abierto mientras existan crías dependientes, mientras la madre ya dispone de un nuevo ciclo actual en estado `VACÍA`.

Las nuevas Cubriciones y Confirmaciones de gestación pertenecen al ciclo actual.

Los Destetes y otros acontecimientos relacionados con las dependencias originadas por el Parto pertenecen al ciclo histórico correspondiente.

De esta forma, cada proceso reproductivo conserva su propia historia y puede evolucionar independientemente de los procesos posteriores del mismo animal.

---

## Los eventos se atribuyen al ciclo por contexto funcional

Cada evento reproductivo pertenece a un único ciclo reproductivo.

Sin embargo, la atribución del evento no debe realizarse suponiendo que existe un único ciclo abierto para el animal.

Cuando existen varios ciclos abiertos, el sistema determina el ciclo correspondiente atendiendo al significado funcional del evento.

Las nuevas operaciones reproductivas de la madre se asignan a su ciclo actual.

Los acontecimientos relacionados con una dependencia madre-cría se asignan al ciclo histórico que originó dicha dependencia.

Por ejemplo, una nueva Cubrición de la madre pertenece a su ciclo actual, mientras que el Destete de una cría pertenece al ciclo que contiene el Parto que originó dicha cría.

Esta regla evita mezclar acontecimientos pertenecientes a procesos reproductivos diferentes y permite conservar la trazabilidad completa de cada ciclo.

---

## El cierre del ciclo es una consecuencia, no un acontecimiento

El cierre de un ciclo reproductivo no constituye un hecho independiente que deba registrarse como evento.

El sistema determina que un ciclo ha finalizado cuando los acontecimientos registrados y las reglas del dominio permiten concluir que ya no existe ninguna circunstancia que obligue a mantenerlo abierto.

Por ejemplo, el ciclo histórico que contiene un Parto puede permanecer abierto mientras existan dependencias maternas activas.

Cuando desaparece la última dependencia correspondiente, el ciclo puede considerarse finalizado.

La fecha y el resultado del ciclo forman parte de la proyección derivada del proceso.

Los eventos originales permanecen inmutables y constituyen la historia que permite reconstruir dicha proyección.

---

## La dependencia materna y la genealogía son conceptos diferentes

La relación genealógica entre una madre y una cría es permanente.

El campo `madre_id` identifica quién es la madre de la cría y no desaparece cuando finaliza la dependencia funcional.

La dependencia madre-cría, en cambio, es temporal.

Su estado se representa mediante `estado_vinculo_materno` y permite determinar si la cría continúa dependiendo funcionalmente de la madre para los efectos del dominio reproductivo.

Por tanto:

- la finalización del vínculo materno no elimina la genealogía;
- el Destete no modifica `madre_id`;
- la Venta o Muerte de una cría no elimina su relación genealógica;
- una cría puede conservar su madre histórica aunque ya no exista dependencia funcional.

Esta separación permite conservar una genealogía permanente sin utilizarla como mecanismo para determinar si una dependencia reproductiva continúa activa.

---

# Conclusión

El modelo reproductivo constituye el lenguaje común sobre el que se construyen todas las funcionalidades relacionadas con la reproducción dentro de la aplicación.

Su propósito no consiste únicamente en almacenar eventos ni en describir el estado biológico de los animales.

Su responsabilidad es representar de forma coherente el conocimiento reproductivo que posee la explotación y proporcionar una base sólida sobre la que puedan construirse nuevas funcionalidades sin perder consistencia.

El modelo distingue claramente entre:

- los hechos registrados mediante eventos;
- el estado reproductivo actual del animal;
- los ciclos reproductivos que representan procesos independientes;
- las proyecciones derivadas de dichos eventos;
- las dependencias funcionales madre-cría;
- y la genealogía permanente entre madre y cría.

Un animal puede tener un ciclo reproductivo actual y, al mismo tiempo, ciclos históricos abiertos por dependencias funcionales pendientes.

Esta coexistencia no representa una anomalía, sino una consecuencia natural de separar los distintos procesos reproductivos que pueden solaparse en el tiempo.

El modelo tampoco intenta reconstruir hechos que nunca fueron registrados ni utiliza el paso del tiempo para inventar acontecimientos o cerrar automáticamente procesos.

Cuando la información disponible resulta incompleta, el sistema representa explícitamente ese nivel de conocimiento.

Cuando una situación requiere una decisión de gestión, como una revisión reproductiva o el registro de una Machorra, dicha decisión se expresa mediante las reglas y eventos correspondientes.

Esta visión permite mantener una historia reproductiva trazable, conservar la genealogía, gestionar correctamente las dependencias madre-cría y proporcionar una interpretación coherente de la situación actual.

En definitiva, el modelo persigue un principio sencillo:

> **Los eventos representan lo que ocurrió, las proyecciones representan lo que el sistema puede interpretar y el estado reproductivo representa la situación actual conocida del proceso reproductivo.**

Esta separación permite que el dominio evolucione sin perder la trazabilidad de la historia ni introducir contradicciones entre procesos reproductivos diferentes.