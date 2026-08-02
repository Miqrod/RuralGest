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

Del mismo modo, un estado **LACTANTE** no describe únicamente una fase biológica.

Representa que existe un parto registrado y que dicho ciclo continúa abierto hasta la finalización de la lactancia mediante el destete.

Esta diferencia puede parecer sutil, pero condiciona toda la interpretación del modelo.

Los estados nunca intentan reconstruir acontecimientos desconocidos.

Únicamente resumen el conocimiento disponible.

---

## Estados definidos por el modelo

Actualmente el dominio reproductivo contempla los siguientes estados:

| Estado | Significado |
|---------|-------------|
| **VACÍA** | No existe conocimiento de una gestación activa. El animal puede iniciar un nuevo proceso reproductivo. |
| **CUBIERTA** | Existe una cubrición registrada. La gestación todavía no ha sido confirmada, aunque puede llegar a producirse un parto directamente desde este estado. |
| **GESTANTE** | La gestación ha sido confirmada y forma parte del conocimiento conocido por la explotación. |
| **LACTANTE** | Existe un parto registrado y el ciclo reproductivo permanece abierto hasta el destete. |

Cada uno de estos estados constituye una fotografía del conocimiento actual del sistema.

No representan etapas obligatorias de un proceso biológico.

Tampoco todos los ciclos recorrerán necesariamente todos los estados.

Lo importante no es seguir una secuencia fija, sino representar correctamente aquello que la explotación conoce en cada momento.

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

Un parto deja de ser únicamente un parto.

Pasa a formar parte del mismo proceso reproductivo iniciado meses atrás.

Y un destete deja de interpretarse como un evento aislado para convertirse en el acontecimiento que marca el cierre de dicho ciclo.

El ciclo reproductivo aporta, por tanto, el contexto necesario para interpretar correctamente cada evento.

Sin él, la aplicación únicamente dispondría de una sucesión cronológica de acontecimientos independientes.

Con él, el sistema puede comprender qué eventos pertenecen al mismo proceso reproductivo y cuáles corresponden a procesos diferentes.

---

## Un ciclo representa un único proceso reproductivo

Cada ciclo reproductivo agrupa exclusivamente los acontecimientos que pertenecen a un mismo proceso reproductivo.

Cuando dicho proceso finaliza, también finaliza el ciclo.

Si posteriormente el animal vuelve a iniciar una nueva reproducción, comenzará un nuevo ciclo completamente independiente del anterior.

Esta separación permite conservar la historia completa del animal sin mezclar acontecimientos que pertenecen a reproducciones distintas.

Cada ciclo puede analizarse individualmente y, al mismo tiempo, formar parte del historial reproductivo global del animal.

El ciclo no representa una propiedad permanente del animal.

Representa un proceso concreto que comienza, evoluciona y finaliza.

Un mismo animal puede completar numerosos ciclos reproductivos a lo largo de su vida, cada uno completamente independiente de los anteriores.

---

## El ciclo proporciona contexto a los eventos

Uno de los errores más habituales al diseñar un modelo reproductivo consiste en interpretar los eventos únicamente de forma aislada.

Sin embargo, un mismo tipo de evento puede tener significados diferentes dependiendo del contexto en el que aparece.

Un parto solo puede comprenderse correctamente cuando se conoce el proceso reproductivo al que pertenece.

Lo mismo ocurre con una confirmación de gestación o con un destete.

Por este motivo cada evento reproductivo queda asociado al ciclo al que pertenece.

Es el ciclo quien proporciona el contexto necesario para interpretar correctamente su significado.

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

La apertura y el cierre del ciclo no dependen de una duración determinada ni del paso del tiempo.

Dependen exclusivamente del conocimiento registrado mediante eventos.

Esto permite que el modelo se adapte tanto a procesos completos como a situaciones donde parte de la información resulta desconocida.

El ciclo permanece abierto mientras exista un proceso reproductivo activo.

Cuando dicho proceso concluye, el ciclo se cierra y el animal queda preparado para iniciar uno nuevo cuando corresponda.

---

## Un único ciclo abierto por animal

Aunque un animal puede completar numerosos ciclos reproductivos a lo largo de su vida, únicamente puede existir un ciclo abierto en cada momento.

Esta constituye una de las principales invariantes del modelo.

La existencia de un único ciclo activo simplifica considerablemente la interpretación del historial reproductivo y evita situaciones ambiguas en las que un mismo evento pudiera pertenecer simultáneamente a procesos distintos.

Cada nuevo evento reproductivo se incorpora siempre al ciclo abierto.

Si no existe ninguno, el sistema determinará si dicho evento debe iniciar un nuevo ciclo de acuerdo con las reglas del dominio.

Una vez cerrado, ese ciclo pasa a formar parte del historial del animal y nunca volverá a modificarse.

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

Sin embargo, en otras situaciones el primer hecho conocido puede ser una confirmación de gestación o incluso un parto.

El modelo admite estas diferencias porque todas ellas representan conocimiento válido.

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

Una vez iniciado el seguimiento del ciclo, el modelo vuelve a comportarse exactamente igual que en cualquier otro proceso reproductivo.

De este modo se evita que las excepciones terminen convirtiéndose en nuevos flujos de trabajo.

## Reconstrucción temporal del ciclo

Cuando una Confirmación de gestación constituye el primer evento conocido del ciclo, el dominio no dispone de una fecha de Cubrición registrada.

Para poder construir las proyecciones reproductivas será necesario reconstruir una línea temporal aproximada del ciclo.

Esta reconstrucción se realizará exclusivamente durante el procesamiento del evento utilizando:

- fecha de la Confirmación;
- edad gestacional estimada.

A partir de dicha información el dominio calculará internamente una fecha aproximada de inicio de la gestación.

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

Un parto, por ejemplo, presupone necesariamente la existencia de una gestación previa.

Si el sistema no dispone todavía de conocimiento suficiente para justificar ese proceso reproductivo, primero deberá registrarse una confirmación de gestación.

Esta decisión mantiene la coherencia del modelo sin obligar a reconstruir retrospectivamente acontecimientos desconocidos.

---

# Finalización del ciclo reproductivo

Un ciclo reproductivo permanece abierto mientras exista un proceso reproductivo activo asociado a él.

Su finalización no depende únicamente del último evento registrado, sino del significado que dicho evento tiene dentro del proceso reproductivo.

En condiciones normales, el ciclo concluye con el destete.

Ese momento marca el final del proceso reproductivo y deja al animal preparado para iniciar uno nuevo cuando corresponda.

No obstante, existen otras circunstancias capaces de finalizar anticipadamente un ciclo.

Por ejemplo, un aborto pone fin al proceso reproductivo iniciado, aunque no llegue a producirse un parto.

Del mismo modo, acontecimientos ajenos a la reproducción, como la venta o la muerte del animal, también provocan el cierre del ciclo activo, ya que dejan de existir las condiciones necesarias para continuar su seguimiento dentro de la explotación.

En todos los casos el principio es el mismo.

Cada ciclo representa un único proceso reproductivo.

Cuando ese proceso termina, el ciclo también finaliza.

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
- el estado reproductivo pasa a **CUBIERTA**;
- se generan las primeras proyecciones derivadas, como la fecha prevista de parto.

En este momento el sistema todavía no sabe si la gestación llegará a producirse.

Únicamente conoce que ha existido una cubrición.

Por ese motivo el estado continúa siendo **CUBIERTA**.

---

## Caso 2. Confirmación de la gestación

Cuando posteriormente se confirma la gestación, el conocimiento disponible aumenta.

El sistema ya no necesita limitarse a asumir que pudo existir una gestación.

Ahora puede afirmarla.

Como consecuencia:

- el estado reproductivo pasa a **GESTANTE**;
- el ciclo reproductivo continúa siendo el mismo;
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
- el estado pasa directamente a **GESTANTE**;
- las proyecciones se calculan utilizando la edad gestacional conocida o estimada.

La cubrición puede haber existido realmente o no.

Desde el punto de vista del modelo resulta irrelevante.

No forma parte del conocimiento disponible y, por tanto, no forma parte de la historia registrada.

A partir de este momento el ciclo continúa exactamente igual que cualquier otro.

No será posible registrar posteriormente una cubrición perteneciente al mismo proceso reproductivo.

Esta decisión mantiene un flujo de trabajo sencillo y evita reconstrucciones retrospectivas de la historia.

---

## Caso 4. Registro de un parto

El parto representa un nuevo aumento del conocimiento.

El sistema ya conoce que la gestación ha llegado a término y que ha comenzado una nueva fase del proceso reproductivo.

Como consecuencia:

- el estado pasa a **LACTANTE**;
- el ciclo continúa abierto;
- podrán registrarse posteriormente todos los acontecimientos relacionados con la lactancia hasta el destete.

El parto puede registrarse tanto desde el estado **CUBIERTA** como desde **GESTANTE**.

En el primer caso nunca llegó a registrarse una confirmación de gestación.

En el segundo sí.

Ambos escenarios son válidos porque representan historias diferentes que conducen al mismo conocimiento final.

---

## Caso 5. Registro de un aborto

Un aborto finaliza el proceso reproductivo iniciado sin que llegue a producirse un parto.

En consecuencia:

- el ciclo reproductivo activo se cierra;
- el estado vuelve a **VACÍA**;
- el animal queda preparado para iniciar un nuevo ciclo cuando corresponda.

El aborto no elimina la historia previa.

Forma parte permanente del ciclo que acaba de finalizar y permite conservar toda la trazabilidad del proceso.

---

## Caso 6. Registro del destete

El destete representa la finalización normal de un ciclo reproductivo.

Hasta ese momento el sistema continúa considerando que el proceso iniciado con la gestación permanece abierto.

Una vez registrado el destete:

- el ciclo se cierra;
- el estado vuelve a **VACÍA**;
- el animal puede iniciar un nuevo proceso reproductivo.

El destete no inicia automáticamente un nuevo ciclo.

Simplemente deja preparado al animal para que dicho ciclo pueda comenzar cuando exista un nuevo hecho que lo justifique.

---

## Caso 7. Venta o muerte del animal

La venta o la muerte no constituyen acontecimientos reproductivos.

Sin embargo, afectan directamente al seguimiento del ciclo.

Cuando alguno de estos eventos ocurre, el sistema deja de realizar seguimiento reproductivo sobre ese animal.

Si existía un ciclo abierto, este se cierra.

No porque el proceso reproductivo haya finalizado biológicamente, sino porque deja de tener sentido continuar gestionándolo dentro de la explotación.

Esta diferencia refleja nuevamente uno de los principios fundamentales del modelo.

El ciclo representa el conocimiento útil para la gestión de la explotación.

No pretende describir toda la realidad biológica del animal más allá de ese contexto.

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

---

## El ciclo reproductivo tampoco se gestiona manualmente

Del mismo modo que ocurre con el estado reproductivo, el usuario nunca crea ni cierra un ciclo de forma explícita.

Los ciclos aparecen y desaparecen automáticamente conforme evoluciona el conocimiento sobre el proceso reproductivo.

Esta decisión garantiza que todos los eventos pertenecen siempre a un único ciclo y evita inconsistencias difíciles de detectar posteriormente.

---

## Los estados representan conocimiento, no fases biológicas

Una de las primeras decisiones adoptadas durante el diseño del modelo consistió en abandonar la idea de representar directamente las fases biológicas de la reproducción.

En su lugar, los estados describen aquello que la explotación sabe sobre el animal en cada momento.

Esto explica por qué dos animales pueden encontrarse en el mismo estado reproductivo aun habiendo seguido recorridos diferentes.

Lo importante no es reconstruir exactamente la biología, sino representar correctamente el conocimiento disponible.

---

## El modelo distingue entre historia y proyección

La historia reproductiva está formada exclusivamente por hechos registrados mediante eventos.

Las proyecciones, en cambio, representan la interpretación que el sistema realiza de esa historia para facilitar la gestión diaria.

Ambos conceptos cumplen responsabilidades distintas y nunca deben confundirse.

Modificar una proyección no altera la historia.

Del mismo modo, registrar un nuevo evento no modifica los acontecimientos anteriores, sino que amplía el conocimiento disponible para construir nuevas proyecciones.

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

Esta filosofía explica decisiones como permitir iniciar un ciclo mediante una confirmación de gestación y, al mismo tiempo, impedir registrar posteriormente una cubrición perteneciente a ese mismo proceso reproductivo.

---

# Conclusión

El modelo reproductivo constituye el lenguaje común sobre el que se construyen todas las funcionalidades relacionadas con la reproducción dentro de la aplicación.

Su propósito no consiste únicamente en almacenar eventos ni en describir el estado biológico de los animales.

Su verdadera responsabilidad es representar de forma coherente el conocimiento reproductivo que posee la explotación y proporcionar una base sólida sobre la que puedan construirse nuevas funcionalidades sin perder consistencia.

Esta visión permite que eventos, estados, ciclos y proyecciones evolucionen conjuntamente manteniendo siempre una misma filosofía: representar únicamente el conocimiento confirmado, preservar la historia registrada y ofrecer una gestión reproductiva comprensible para el usuario.
