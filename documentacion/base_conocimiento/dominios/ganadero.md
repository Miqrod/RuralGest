# Dominio Ganadero

## Introducción

El dominio ganadero constituye el **Core Domain** de la aplicación.

Representa la realidad física y operativa de una explotación ganadera y proporciona el lenguaje común sobre el que se construyen todos los demás dominios del sistema.

Su propósito no consiste en almacenar animales ni en mantener una base de datos de registros.

Su propósito consiste en representar la explotación de la forma más fiel posible, preservando su historia, su evolución y el significado de cada uno de los hechos que ocurren en ella.

Toda la arquitectura del sistema nace de esta decisión.

Los dominios reproductivo, sanitario, financiero u operacional no describen una realidad distinta. Todos observan la misma explotación desde perspectivas diferentes y construyen conocimiento especializado a partir de una representación común.

Este documento describe la filosofía, los principios y las responsabilidades que definen el dominio ganadero.

La representación técnica de estos conceptos mediante entidades, relaciones, estados y estructuras de datos se documenta en `modelo/modelo_ganadero.md`.

---

# Objetivo del dominio

El objetivo del dominio ganadero consiste en representar digitalmente la realidad de una explotación ganadera.

Esta representación debe cumplir cuatro propiedades fundamentales:

- ser fiel a la realidad observada;
- preservar la historia completa de la explotación;
- mantener un lenguaje de negocio único para toda la aplicación;
- permitir que otros dominios construyan conocimiento especializado sin reinterpretar la realidad.

El dominio ganadero no pretende resolver todos los problemas de negocio.

Su responsabilidad consiste en proporcionar una representación común, coherente y estable de aquello que realmente ocurre dentro de la explotación.

En este sentido, constituye el núcleo conceptual de toda la aplicación.

---

# La explotación como centro del modelo

La aplicación no está diseñada alrededor de animales.

Está diseñada alrededor de una explotación ganadera.

Puede parecer una diferencia sutil, pero condiciona completamente el modelo.

Una explotación está formada por animales, lotes, movimientos, nacimientos, compras, ventas, muertes, cambios productivos y muchos otros hechos relacionados entre sí.

Todos estos elementos forman parte de una misma realidad.

Por este motivo, el dominio ganadero no representa una base de datos de animales.

Representa la evolución completa de una explotación.

Los animales constituyen únicamente uno de los elementos que permiten describir dicha realidad.

El resto de dominios especializados parten siempre de esta misma representación compartida.

---

# Filosofía del dominio

La filosofía del dominio ganadero puede resumirse en una idea muy sencilla:

> El sistema no intenta simplificar la realidad de la explotación.
>
> Intenta representarla.

Esta decisión tiene consecuencias importantes sobre todo el diseño del sistema.

En primer lugar, la aplicación diferencia claramente entre la realidad observada y la información derivada de ella.

La realidad está formada por hechos.

La información utilizada para operar diariamente es una interpretación de esos hechos.

En segundo lugar, la aplicación considera que la historia de la explotación posee tanto valor como su estado actual.

Conocer únicamente el estado presente no permite comprender cómo se ha llegado hasta él.

Por ello, el sistema preserva permanentemente la evolución de la explotación y evita sustituir la historia por fotografías instantáneas del estado actual.

Finalmente, el dominio busca que toda la aplicación comparta una única interpretación del negocio.

Cada hecho tiene un único significado.

Cada concepto pertenece a un único dominio.

Cada responsabilidad posee un único propietario.

De esta manera se evita que distintos módulos construyan interpretaciones incompatibles de una misma realidad.

---

# Lenguaje Ubicuo

El dominio ganadero define el lenguaje ubicuo de la aplicación.

Conceptos como Animal, Lote, Evento, Movimiento o Tipo productivo tienen un único significado compartido por todos los dominios.

Ningún módulo especializado redefine estos conceptos; únicamente los utiliza y los complementa con conocimiento propio.

---

# La realidad evoluciona mediante hechos

Una explotación ganadera cambia constantemente.

Nacen animales.

Se compran.

Se venden.

Se agrupan.

Se separan.

Mueren.

Cambian de finalidad productiva.

Todos estos cambios forman parte de la realidad de la explotación.

El dominio ganadero entiende que la realidad no evoluciona modificando estados.

Evoluciona porque ocurren nuevos hechos.

Por este motivo, el sistema registra los hechos que ocurren y permite que los estados cambien como consecuencia de ellos.

Nunca ocurre al revés.

Esta decisión constituye uno de los principios fundamentales de la arquitectura.

Los estados no representan la historia.

Representan únicamente el resultado de interpretarla en un momento determinado.

Gracias a este enfoque, cualquier estado observable puede reconstruirse nuevamente recorriendo la secuencia completa de hechos registrados.

La historia deja de ser un simple registro histórico para convertirse en la verdadera representación de la explotación.

# Las acciones son una forma de registrar hechos

El dominio representa la evolución de la explotación mediante hechos.

Sin embargo, los usuarios no interactúan directamente con dichos hechos.

Los usuarios realizan acciones propias de su trabajo diario, como comprar un animal, registrar un parto, vender un lote o cambiar el tipo productivo de un animal.

Cada una de estas acciones provoca el registro de uno o varios hechos dentro del dominio.

De esta forma, la aplicación permite que el usuario trabaje utilizando un lenguaje cercano a su actividad cotidiana mientras el dominio mantiene una representación consistente y trazable de la realidad.

Las acciones constituyen la forma de interacción con el sistema.

Los hechos constituyen la forma en que el dominio representa esa interacción.

# El evento como unidad de conocimiento

El dominio ganadero representa la realidad mediante **eventos**.

Un evento representa un hecho del negocio que ha ocurrido realmente dentro de la explotación.

No representa una operación técnica.

No representa una acción realizada por un usuario.

No representa un cambio de estado.

Representa un hecho de la realidad.

Un nacimiento, una compra, una venta, una muerte, un destete o un cambio de tipo productivo no existen porque el sistema los haya registrado.

El sistema los registra porque han ocurrido.

Esta diferencia es fundamental.

El objetivo del dominio no consiste en modificar registros.

Consiste en documentar la evolución real de la explotación.

Cada nuevo evento amplía el conocimiento disponible sobre dicha explotación.

Nunca sustituye el conocimiento anterior.

---

## El significado de los hechos

El dominio ganadero no solamente registra hechos.

También define qué significan.

Es el único responsable de establecer la interpretación de los acontecimientos que describen la realidad física de la explotación.

Por ello:

- un nacimiento tiene un único significado;
- una venta tiene un único significado;
- una muerte tiene un único significado;
- un cambio de tipo productivo tiene un único significado;
- un movimiento tiene un único significado.

Los dominios especializados reutilizan estos hechos.

Nunca modifican su interpretación.

Por ejemplo, el dominio reproductivo utiliza un parto para gestionar un ciclo reproductivo.

El dominio financiero puede utilizar una venta para generar información económica.

Sin embargo, ninguno de ellos redefine qué significa un parto o una venta.

Existe una única interpretación compartida para toda la aplicación.

Esta responsabilidad pertenece exclusivamente al dominio ganadero.

---

# Los estados son observables, no editables

Los usuarios trabajan diariamente con estados.

Necesitan saber si un animal está vivo, vendido o muerto.

Necesitan conocer su ubicación actual.

Su tipo productivo.

Su estado reproductivo.

Su situación sanitaria.

Sin embargo, el dominio distingue claramente entre un **hecho** y un **estado**.

Un hecho forma parte de la historia.

Un estado representa una observación realizada sobre esa historia.

Por este motivo, los estados nunca constituyen la fuente de verdad del sistema.

Son únicamente una proyección construida para facilitar la operación diaria.

El usuario consulta estados.

El dominio interpreta hechos.

Esta separación permite mantener un modelo mucho más consistente.

Los estados pueden reconstruirse.

Pueden recalcularse.

Pueden evolucionar cuando aparecen nuevos hechos.

La historia, en cambio, permanece intacta.

---

## Los estados resumen la historia

El estado actual de un animal no constituye información independiente.

Es un resumen de todo aquello que ha ocurrido previamente.

Por ejemplo, un animal puede encontrarse actualmente en estado **vendido**.

Ese estado no existe por sí mismo.

Existe porque anteriormente se registró un evento de venta.

Del mismo modo, un animal puede aparecer como **reproductora**.

Ese dato no representa una característica biológica permanente.

Representa la consecuencia observable de una decisión registrada anteriormente.

Cada estado observable puede explicarse recorriendo los hechos que lo originaron.

---

# Las decisiones también forman parte de la realidad

No toda la realidad de una explotación está formada por procesos biológicos.

Una parte importante corresponde a decisiones tomadas por el propio ganadero.

Seleccionar una reproductora.

Cambiar un animal de engorde a reposición.

Vender un animal.

Agrupar varios animales en un lote.

Todas estas decisiones modifican el funcionamiento de la explotación.

Por tanto, también forman parte de la realidad que el sistema debe representar.

El dominio ganadero no diferencia entre hechos "naturales" y hechos "empresariales".

Ambos modifican la explotación.

Ambos forman parte de su historia.

Ambos deben quedar registrados con el mismo nivel de trazabilidad.

Esta decisión permite que la evolución de la explotación refleje no sólo aquello que ha sucedido, sino también las decisiones que han llevado a esa situación.

---

# La historia es inmutable

La historia constituye el activo más valioso del dominio ganadero.

Una vez registrado un hecho, pasa a formar parte de la evolución conocida de la explotación.

El sistema evita modificar retrospectivamente esa historia porque hacerlo supondría alterar la explicación de cómo se ha llegado al estado actual.

En lugar de sustituir hechos anteriores, el dominio incorpora nuevos hechos que complementan, rectifican o amplían la información existente.

La historia deja de ser una fotografía del pasado.

Se convierte en una narración continua de la evolución de la explotación.

Cada nuevo evento añade contexto.

Nunca elimina el anterior.

Este principio garantiza que cualquier estado presente pueda explicarse completamente recorriendo la secuencia de hechos que lo originaron.

---

# Corrección de errores mediante eventos correctores

La realidad puede registrarse de forma incorrecta.

Puede introducirse un dato erróneo.

Puede registrarse una venta equivocada.

Puede asignarse un animal al lote incorrecto.

Puede producirse un error humano durante la introducción de información.

Cuando esto ocurre, el objetivo del sistema no consiste en ocultar el error.

Consiste en documentar correctamente lo sucedido.

Siempre que sea posible, la corrección debe realizarse mediante nuevos eventos que expliquen la realidad correctamente.

El error pasa a formar parte de la historia de la explotación.

También lo hace la decisión que permitió corregirlo.

De esta manera el sistema conserva el contexto completo de lo sucedido y evita perder información que posteriormente pueda resultar necesaria para comprender una situación concreta.

Modificar directamente un hecho histórico constituye siempre la última alternativa y únicamente debería contemplarse cuando el error impida mantener una representación coherente de la realidad.

El principio general del dominio es claro:

> **La historia se corrige incorporando nuevos hechos, no reescribiendo los anteriores.**

---

# La trazabilidad como consecuencia natural

La trazabilidad no constituye una funcionalidad adicional del sistema.

Es la consecuencia directa de la forma en que el dominio representa la realidad.

Como toda evolución queda documentada mediante hechos y éstos nunca sustituyen la historia anterior, el sistema puede responder en cualquier momento preguntas como:

- ¿Qué ocurrió?
- ¿Cuándo ocurrió?
- ¿Por qué ocurrió?
- ¿Sobre qué animales o lotes ocurrió?
- ¿Qué hechos condujeron a la situación actual?
- ¿Qué decisiones modificaron posteriormente esa situación?

La trazabilidad no persigue únicamente facilitar auditorías.

Su verdadero objetivo consiste en hacer comprensible el presente.

El estado actual sólo adquiere sentido cuando puede explicarse mediante la historia que lo ha construido.

Por ello, la trazabilidad no constituye una característica aislada del dominio.

Es una propiedad emergente de toda su filosofía de diseño.

# Conceptos fundamentales

Una vez establecida la filosofía del dominio, los conceptos fundamentales representan las piezas con las que el sistema describe la realidad de la explotación.

Cada uno posee una responsabilidad claramente definida.

El dominio evita que un mismo concepto tenga varios significados o que una misma responsabilidad aparezca duplicada en distintos lugares del sistema.

Esta separación constituye uno de los principios que permiten mantener un modelo estable a medida que la aplicación evoluciona.

---

## La explotación

La explotación constituye la unidad real que el dominio intenta representar.

Todos los demás conceptos existen para describir distintos aspectos de su funcionamiento.

No existe ningún elemento aislado del resto.

Los animales pertenecen a una explotación.

Los lotes organizan parte de esa explotación.

Los movimientos modifican su organización.

Los eventos documentan su evolución.

Los estados observables resumen su situación actual.

El modelo completo gira alrededor de una única realidad compartida.

---

## Animal

El animal representa un individuo físico perteneciente a la explotación.

Su identidad permanece constante durante toda su vida independientemente de los cambios que experimente.

Puede cambiar de lote.

Puede cambiar de finalidad productiva.

Puede venderse.

Puede morir.

Puede participar en procesos reproductivos.

Puede participar en procesos sanitarios.

Sin embargo, continúa siendo el mismo individuo.

El dominio garantiza esta continuidad para preservar toda su historia.

El animal constituye uno de los principales puntos de agregación del conocimiento generado por el resto de dominios.

---

## Lote

El lote representa una agrupación física de animales.

No constituye únicamente una herramienta organizativa.

Representa una realidad existente dentro de la explotación.

Los lotes permiten gestionar conjuntamente animales que comparten una determinada finalidad, ubicación o fase del proceso productivo.

Un lote puede evolucionar con el tiempo.

Puede dividirse.

Puede fusionarse.

Puede desaparecer.

Puede originarse a partir de otros lotes.

Todas estas transformaciones también forman parte de la historia de la explotación.

---

## Movimiento

Un movimiento representa una operación coordinada que afecta simultáneamente a varios elementos de la explotación.

Su finalidad consiste en mantener la coherencia entre distintos eventos relacionados.

Por ejemplo, una venta puede implicar:

- la salida de uno o varios animales;
- la modificación de uno o varios lotes;
- la generación posterior de información financiera.

Cada uno de estos hechos posee su propio significado.

El movimiento los agrupa bajo una única operación de negocio sin alterar la independencia de cada evento.

De esta forma el dominio puede representar operaciones complejas sin perder trazabilidad ni granularidad.

---

## Tipo productivo

El tipo productivo representa la finalidad con la que un animal participa en la explotación.

No describe una característica biológica.

Describe una decisión empresarial.

Esta diferencia resulta fundamental.

Dos animales biológicamente idénticos pueden desempeñar funciones completamente distintas dentro de una explotación.

Uno puede destinarse a engorde.

Otro puede seleccionarse como reproductora.

Otro puede reservarse como semental.

El dominio registra esta decisión porque modifica el funcionamiento futuro de la explotación.

Además, el tipo productivo determina la disponibilidad de determinados procesos especializados.

Por ejemplo, únicamente un animal clasificado como **REPRODUCTORA** podrá iniciar un ciclo reproductivo.

El dominio reproductivo no decide qué animales son reproductores.

Consume una decisión previamente establecida por el dominio ganadero.

---

## Estados observables

El dominio mantiene diferentes estados observables para facilitar la operación diaria.

Estos estados no constituyen entidades independientes.

Son la representación resumida del conocimiento disponible en un instante concreto.

Entre otros, el sistema puede proyectar:

- estado vital;
- ubicación;
- lote actual;
- tipo productivo;
- estado reproductivo;
- estado sanitario;
- cualquier otra proyección necesaria para la operación diaria.

Todos ellos comparten las mismas propiedades:

- nunca constituyen la fuente de verdad;
- nunca se editan directamente;
- siempre pueden recalcularse;
- siempre derivan del historial de hechos registrados.

Esta distinción permite optimizar las consultas sin comprometer la coherencia del modelo.

---

# Límites del dominio

Uno de los principios fundamentales del proyecto consiste en mantener responsabilidades claramente separadas.

El dominio ganadero representa la realidad común de la explotación.

No interpreta dicha realidad desde perspectivas especializadas.

Por ello, este dominio **no** es responsable de:

- gestionar ciclos reproductivos;
- diagnosticar estados sanitarios;
- interpretar operaciones económicas;
- emitir facturas;
- calcular indicadores financieros;
- planificar tareas operativas;
- aplicar reglas específicas de otros dominios.

Estas responsabilidades pertenecen a sus respectivos dominios especializados.

Del mismo modo, dichos dominios tampoco modifican el significado de los conceptos definidos por el Core Domain.

Existe una única interpretación compartida de la realidad física de la explotación.

---

# Relación con los demás dominios

El dominio ganadero constituye el punto de partida de toda la aplicación.

Los demás dominios reutilizan su representación para construir conocimiento adicional.

```text
                    Core Domain
                  Dominio Ganadero
                         │
      ┌──────────────────┼──────────────────┐
      ▼                  ▼                  ▼
 Reproductivo      Sanitario        Financiero
      │                  │                  │
      └──────────────┬───┴──────────────────┘
                     ▼
              Dominio Operacional
```

Cada dominio especializado observa la misma realidad desde una perspectiva distinta.

El dominio reproductivo interpreta procesos biológicos.

El dominio sanitario interpreta la salud de los animales.

El dominio financiero interpreta el impacto económico de determinados hechos.

El dominio operacional coordina el trabajo diario de la explotación.

Ninguno de ellos redefine el significado de los conceptos fundamentales.

Todos amplían el conocimiento construido sobre una misma representación compartida.

Esta organización permite que la aplicación evolucione incorporando nuevos dominios sin modificar el núcleo conceptual del sistema.

# La estabilidad del Core Domain

El dominio ganadero constituye el núcleo conceptual de la aplicación.

Mientras que los dominios especializados evolucionan continuamente para incorporar nuevas funcionalidades, nuevas reglas de negocio o nuevos procesos específicos, el Core Domain debe permanecer deliberadamente estable.

Esta estabilidad no significa que el dominio no pueda evolucionar.

Significa que los conceptos fundamentales sobre los que se construye la aplicación cambian lentamente y únicamente cuando existe una razón de negocio suficientemente importante para hacerlo.

Animal.

Lote.

Evento.

Movimiento.

Tipo productivo.

Estos conceptos representan la realidad básica de una explotación ganadera.

El resto de dominios dependen de ellos.

Por este motivo, cualquier modificación realizada sobre el Core Domain afecta potencialmente a toda la arquitectura del sistema.

El crecimiento de la aplicación debe producirse preferentemente incorporando nuevos dominios especializados que reutilicen este conocimiento compartido antes que ampliando continuamente las responsabilidades del dominio ganadero.

De esta forma se preserva un núcleo pequeño, estable y fácil de comprender sobre el que puede evolucionar el resto del sistema.

---

# Evolución del dominio

El dominio ganadero ha sido diseñado para acompañar el crecimiento de la aplicación durante toda su vida útil.

Su evolución no consiste en incorporar continuamente nuevas funcionalidades.

Consiste en mantener una representación cada vez más precisa de la realidad común compartida por todos los dominios.

Las futuras ampliaciones deberán respetar siempre los principios definidos en este documento.

En particular:

- preservar la historia completa de la explotación;
- registrar los cambios mediante nuevos hechos;
- mantener una única interpretación del lenguaje de negocio;
- evitar la duplicidad de responsabilidades;
- conservar la separación entre hechos, decisiones y estados observables;
- garantizar que toda proyección pueda reconstruirse a partir del historial registrado.

Estos principios constituyen la base sobre la que deberá construirse cualquier nueva funcionalidad del sistema.

---

# Relación con el modelo de software

Este documento describe el dominio desde una perspectiva conceptual.

No pretende explicar cómo se implementa técnicamente.

La representación del dominio mediante entidades, relaciones, proyecciones, estados y estructuras de datos se documenta en:

- `documentacion/modelo/modelo_ganadero.md`

Del mismo modo, las decisiones arquitectónicas reutilizables y los patrones de implementación se documentan en:

- `documentacion/arquitectura/overview.md`
- `documentacion/arquitectura/patterns/`
- ADRs correspondientes

Esta separación permite mantener independientes el conocimiento del negocio y su implementación técnica.

---

# Conclusión

El dominio ganadero constituye la representación digital de una explotación ganadera.

No pretende modelar una base de datos de animales.

No pretende organizar formularios ni pantallas.

No pretende almacenar estados aislados.

Su responsabilidad consiste en representar una realidad viva que evoluciona continuamente mediante hechos, decisiones y relaciones.

Toda la aplicación comparte esta misma representación.

Los dominios especializados no construyen realidades distintas.

Construyen conocimiento adicional sobre una única realidad compartida.

Por ello, el dominio ganadero define el lenguaje común de la aplicación, preserva la historia de la explotación y establece el significado de los hechos que describen su evolución.

Esta responsabilidad convierte al dominio ganadero en el núcleo conceptual del sistema y en el punto de partida sobre el que se construye toda la arquitectura de la aplicación.