# Modelo de Instalaciones y Ubicaciones

## 1. Propósito y alcance

Este documento define el modelo conceptual de instalaciones y ubicaciones de la explotación ganadera.

Las instalaciones representan los espacios físicos de la explotación y constituyen un modelo transversal que puede ser utilizado por los distintos dominios y módulos de la aplicación.

El objetivo principal de la primera implementación ha sido permitir conocer dónde se encuentran los animales de la explotación y registrar sus cambios de ubicación. Esta primera fase se ha centrado en la gestión de animales individuales, dado que es la necesidad actualmente definida y prioritaria.

El modelo deberá poder evolucionar para dar soporte a otras necesidades, entre ellas:

- La gestión de distintas especies ganaderas.
- La ubicación de animales individualizados y de unidades colectivas, como los lotes de animales anónimos.
- La gestión de existencias y stocks en las instalaciones.
- La utilización de las instalaciones en otros procesos operativos de la explotación.

Estas necesidades futuras no deben considerarse funcionalidades ya definidas ni implementadas. Se documentan como líneas de evolución para evitar que las decisiones provisionales de la primera fase condicionen innecesariamente el desarrollo posterior.

### 1.1. Alcance actual

El alcance implementado y definido actualmente comprende:

- El registro y mantenimiento de instalaciones físicas.
- La clasificación descriptiva de las instalaciones.
- La configuración básica de los usos permitidos.
- La asociación de animales individuales a una instalación.
- El registro de cambios de ubicación mediante eventos.
- La consulta de la ubicación actual y del historial de cambios.
- La representación geográfica básica de las instalaciones mediante coordenadas.

Quedan fuera del alcance actual la gestión de capacidades, aforos, inventario de stocks, reubicación de lotes y las reglas específicas de ubicación de unidades colectivas de animales.

## 2. Naturaleza transversal del modelo

Las instalaciones forman parte de la estructura física de la explotación y no pertenecen en exclusiva a un dominio funcional concreto.

Una instalación existe independientemente de que en un momento determinado contenga animales, stocks u otros recursos. Su identidad y sus características generales son compartidas por los distintos módulos que necesiten utilizarla.

Por tanto, Instalaciones y Ubicaciones se consideran un **modelo transversal de la explotación**.

La responsabilidad sobre las reglas específicas corresponde al dominio que gestiona cada tipo de recurso:

- **Dominio Ganadero:** define las reglas de ubicación de los recursos ganaderos, las condiciones para registrar cambios de ubicación y las restricciones propias de cada especie.
- **Modelo Ganadero:** define cómo se representan y gestionan los animales individuales y las unidades colectivas, así como las particularidades que correspondan a cada especie.
- **Futuro modelo de Stocks:** deberá definir las reglas de ubicación y gestión de existencias, así como la compatibilidad con los distintos tipos de stock.
- **Dominio Operacional:** podrá utilizar las instalaciones como referencia en los procesos operativos que se definan dentro de su alcance.

El modelo transversal proporciona la referencia física común, pero no debe asumir las reglas de negocio específicas de cada dominio.

Esta separación permite que los distintos módulos compartan las instalaciones sin imponer un único modelo de gestión para todos los recursos.

## 3. Conceptos fundamentales

### 3.1. Instalación

Una instalación es una entidad física identificable dentro de la explotación.

Representa un espacio o infraestructura en el que pueden ubicarse recursos de la explotación, de acuerdo con los usos que tenga permitidos.

Ejemplos:

- Cercados y prados.
- Corrales.
- Naves.
- Pocilgas.
- Pajares.
- Almacenes.
- Casetas.
- Embarcaderos.

La instalación tiene identidad propia y permanece registrada aunque cambie su utilización, quede temporalmente vacía o deje de estar operativa.

Una instalación no equivale necesariamente a una ubicación ocupada. Es la referencia física a la que pueden asociarse los recursos.

### 3.2. Ubicación

La ubicación representa la relación entre un recurso de la explotación y una instalación física.

En el modelo actual, la ubicación no constituye una entidad independiente: se resuelve mediante la referencia a una instalación.

Por tanto, cuando se habla de la ubicación de un animal, se está haciendo referencia a la instalación en la que se encuentra.

Esta distinción es importante:

- **Instalación:** entidad física registrada en la explotación.
- **Ubicación:** concepto que expresa dónde se encuentra un recurso.
- **Recurso ubicado:** elemento de la explotación cuya ubicación se puede conocer y gestionar.

No se debe confundir la ubicación con la pertenencia a un lote. Un lote representa una agrupación ganadera, mientras que una ubicación representa un espacio físico.

### 3.3. Recursos ubicables

El modelo transversal debe poder servir como referencia física para diferentes tipos de recursos.

En la actualidad, el recurso gestionado es principalmente el animal individualizado.

En el futuro podrán utilizarse las instalaciones para ubicar:

- Animales individuales.
- Unidades colectivas de animales, como los lotes de animales anónimos.
- Existencias y stocks.

La naturaleza y las reglas de cada recurso corresponden a su modelo funcional. Este documento no define su composición, ciclo de vida ni procesos de gestión.

## 4. Modelo actual de instalaciones

### 4.1. Atributos generales

La instalación dispone actualmente de los siguientes atributos:

| Atributo | Descripción |
|---|---|
| `id` | Identificador único de la instalación. |
| `nombre` | Nombre identificativo de la instalación. |
| `tipo` | Clasificación descriptiva de la instalación. |
| `activo` | Indica si la instalación está operativa y puede utilizarse como destino. |
| `admite_animales` | Indica si la instalación permite la ubicación de animales. |
| `admite_stock` | Indica si la instalación permite la ubicación de stocks. |
| `coordenadas` | Coordenadas geográficas opcionales. |
| `observaciones` | Información adicional. |
| `created_at` | Fecha de creación. |
| `created_by` | Usuario que registra la instalación. |

Estos atributos describen el modelo implementado actualmente. No todos tienen por qué conservar su forma actual cuando se amplíe la gestión de usos y compatibilidades.

### 4.2. Tipo de instalación

El tipo de instalación es una clasificación descriptiva de su naturaleza física.

Los tipos contemplados actualmente son:

- Corral.
- Nave.
- Prado.
- Cercado.
- Almacén.
- Otro.

El tipo no determina automáticamente los usos permitidos.

Por ejemplo, una instalación clasificada como cercado puede admitir animales, mientras que otra instalación también clasificada como cercado puede estar destinada exclusivamente al almacenamiento.

Por tanto, no se deben deducir las capacidades o usos de una instalación únicamente a partir de su tipo.

La clasificación descriptiva y la configuración funcional de los usos son conceptos independientes.

### 4.3. Usos permitidos: modelo actual

Actualmente se utilizan dos indicadores:

- `admite_animales`
- `admite_stock`

Ambos representan configuraciones explícitas de la instalación y no se deducen de su tipo.

Su finalidad es permitir que los procesos de la aplicación conozcan si una instalación puede utilizarse para alojar animales o stocks.

En la primera implementación, estos indicadores constituyen una solución sencilla para resolver las necesidades prioritarias de ubicación de animales.

No obstante, son una clasificación muy básica y probablemente insuficiente para representar todas las necesidades futuras de la explotación.

La gestión de estos atributos corresponde a la configuración administrativa de las instalaciones. No deben modificarse libremente desde las operaciones habituales de gestión de animales.

## 5. Estado de las instalaciones

Las instalaciones disponen de un atributo `activo` que permite distinguir entre instalaciones operativas y aquellas que han dejado de estar disponibles.

### 5.1. Instalación activa

Una instalación activa puede utilizarse como destino de una operación de ubicación, siempre que cumpla las condiciones funcionales correspondientes.

En el modelo actual, para recibir animales debe cumplir:

- Estar activa.
- Tener `admite_animales = true`.

### 5.2. Instalación inactiva

Una instalación inactiva no puede utilizarse como destino de nuevas ubicaciones.

La desactivación no implica la eliminación de la instalación ni de sus referencias históricas.

Las instalaciones deben conservarse para mantener la trazabilidad de las ubicaciones anteriores.

Actualmente no se permite desactivar una instalación mientras existan animales vivos o lotes activos ubicados en ella.

Para poder desactivarla será necesario resolver previamente esa ocupación.

La reactivación de una instalación desactivada está permitida.

### 5.3. Modificación de los usos permitidos

La modificación de `admite_animales` no implica un cambio automático de ubicación de los animales que ya se encuentren en la instalación.

Si se establece `admite_animales = false`:

- No podrán registrarse nuevas ubicaciones de animales en esa instalación.
- Los animales que ya se encuentren allí conservarán su ubicación.
- Seguirán siendo visibles y gestionables.
- Podrán ser reubicados a otra instalación válida.

Por tanto, los usos permitidos condicionan las nuevas operaciones, pero no modifican retroactivamente la situación de los recursos existentes.

## 6. Ubicación de animales en el modelo actual

### 6.1. Ubicación actual

En la primera implementación, el modelo de ubicación se centra en animales individuales.

El animal dispone de una referencia a su instalación actual mediante `animal.ubicacion_actual_id`.

Esta referencia es una proyección de su situación actual y no constituye la fuente de verdad del cambio de ubicación.

La ubicación actual se deriva del historial de eventos que registran los cambios de ubicación.

### 6.2. Animal sin ubicación asignada

Un animal puede encontrarse temporalmente sin una instalación asignada.

Esto puede ocurrir, por ejemplo, cuando:

- Se registra la compra de un animal sin conocer o indicar su ubicación inicial.
- Se registra un nacimiento cuya ubicación no está determinada.
- Se produce una salida de la explotación.
- Se trata de un registro inicializado sin información de ubicación.

La ausencia de ubicación no debe interpretarse automáticamente como un error.

### 6.3. Ubicación y lote

La pertenencia a un lote y la ubicación física son conceptos distintos.

Un lote representa una agrupación ganadera y puede tener una finalidad organizativa o productiva. Una instalación representa un espacio físico.

La pertenencia de un animal a un lote no implica por sí misma un cambio de ubicación.

Del mismo modo, un cambio de ubicación física no implica necesariamente un cambio de lote.

El modelo actual dispone también de una referencia `lote.ubicacion_actual_id`, pero su semántica y sus reglas de actualización no están completamente definidas para todos los posibles modelos de gestión ganadera.

En particular, no se establece aquí una regla general de precedencia entre la ubicación del animal y la del lote.

## 7. Registro de cambios de ubicación

### 7.1. Evento `CAMBIO_UBICACION`

Los cambios de ubicación se registran mediante el evento `CAMBIO_UBICACION`.

Este evento constituye la fuente de verdad del cambio de ubicación.

La instalación de origen y la instalación de destino se registran mediante referencias a la entidad `instalacion`:

- `ubicacion_origen_id`
- `ubicacion_destino_id`

El evento permite conservar el historial de ubicaciones y reconstruir la situación de un animal a lo largo del tiempo.

La referencia a una instalación no debe tratarse como texto libre ni como un dato meramente descriptivo del evento.

### 7.2. Relación entre eventos y estado

El modelo de la aplicación sigue un enfoque híbrido de eventos y estado:

- Los eventos representan los hechos registrados y constituyen la fuente de verdad.
- El estado representa una proyección derivada que facilita las consultas y operaciones habituales.

En consecuencia, `animal.ubicacion_actual_id` es una proyección del historial de eventos de ubicación.

Un cambio de ubicación debe registrar el evento y actualizar la proyección correspondiente dentro de la misma operación transaccional.

No se debe modificar directamente la ubicación actual de un animal sin registrar el evento que justifica ese cambio.

### 7.3. Semántica de origen y destino

El modelo contempla las siguientes situaciones:

| Origen | Destino | Significado |
|---|---|---|
| Sin ubicación | Instalación A | Primera ubicación conocida. |
| Sin ubicación | Sin ubicación | Entrada o inicialización sin ubicación conocida. |
| Instalación A | Instalación B | Cambio de ubicación física. |
| Instalación A | Sin ubicación | Salida de la ubicación, por ejemplo, por venta o muerte. |
| Instalación A | Instalación A | Operación no válida. |

La transición de una ubicación a ninguna no equivale necesariamente a una salida de la explotación: su significado depende del evento de negocio que la origine.

Una transición de ninguna ubicación a ninguna ubicación solo tiene sentido cuando representa una entrada o inicialización sin ubicación conocida.

### 7.4. Relación con otros eventos de negocio

Los eventos de ubicación pueden estar relacionados temporalmente con otros hechos de la actividad ganadera, pero no deben sustituirlos.

Por ejemplo:

- Una compra puede registrar la entrada de un animal y su ubicación inicial.
- Un nacimiento puede establecer la ubicación inicial de la cría.
- Una venta o muerte puede provocar que el animal deje de tener una ubicación asignada.

El evento de compra, nacimiento, venta o muerte conserva su propio significado de negocio.

El evento `CAMBIO_UBICACION` registra el hecho relativo a la ubicación física.

Cuando una operación de negocio requiere también modificar la ubicación, ambas acciones deben ejecutarse de forma coherente y transaccional.

### 7.5. Historial

El historial de cambios de ubicación debe conservar los eventos registrados.

No se deben sobrescribir los cambios anteriores para representar una nueva ubicación.

Se permiten varios cambios de ubicación en una misma fecha, siempre que respeten el orden cronológico de los hechos.

La fecha de un nuevo cambio no puede ser anterior a la fecha del último cambio de ubicación registrado para el recurso.

## 8. Reubicación de animales

### 8.1. Concepto

La reubicación es la operación mediante la cual uno o varios animales cambian su ubicación física dentro de la explotación.

En la implementación actual se contempla la reubicación de animales individuales.

La operación permite seleccionar varios animales y asignarles una instalación de destino común y una fecha de cambio.

### 8.2. Reglas actuales

Para registrar una reubicación deben cumplirse las siguientes condiciones:

- Debe existir al menos un animal seleccionado.
- Todos los animales deben existir.
- Los animales deben estar vivos.
- La instalación de destino debe existir.
- La instalación de destino debe estar activa.
- La instalación de destino debe admitir animales.
- La instalación de destino debe ser distinta de la ubicación de origen.
- La fecha del cambio no puede ser futura.
- La fecha no puede ser anterior al último cambio de ubicación registrado para cada animal.

La ubicación de origen se obtiene de la situación actual del animal en backend. No debe ser proporcionada libremente por el frontend.

### 8.3. Atomicidad

Cuando se reubican varios animales en una misma operación, el proceso debe ejecutarse de forma atómica.

Se registra un evento `CAMBIO_UBICACION` por cada animal.

Si alguno de los animales o la instalación de destino no cumple las condiciones, la operación completa debe revertirse.

No se deben producir reubicaciones parciales como resultado de una operación colectiva fallida.

### 8.4. Reubicación y movimiento de animales

La reubicación física no debe confundirse con el movimiento lógico o administrativo de animales entre lotes.

El cambio de ubicación:

- No implica necesariamente un cambio de lote.
- No genera por sí mismo una salida y una entrada de animales en lotes.
- No requiere un evento `MOVIMIENTO`.
- Se registra mediante `CAMBIO_UBICACION`.

Los movimientos entre lotes y las reubicaciones físicas representan hechos diferentes y deben conservar sus respectivas semánticas.

## 9. Ubicación inicial y final de los animales

El modelo actual contempla diferentes situaciones en las que un animal adquiere o pierde una ubicación.

### 9.1. Compra

Al registrar la compra de un animal puede conocerse o no su ubicación inicial.

- Si se conoce, se registra la transición desde ninguna ubicación hasta la instalación correspondiente.
- Si no se conoce, se registra la entrada sin ubicación asignada.

### 9.2. Nacimiento

Cuando nace una cría viva, su ubicación inicial corresponde a la ubicación actual de su madre.

Si la madre no tiene una ubicación asignada, la cría tampoco tendrá una ubicación conocida.

En el caso de una cría nacida muerta, no se registra una ubicación inicial.

### 9.3. Venta y muerte

Cuando un animal sale de la explotación por venta o muerte, deja de tener una ubicación actual.

Si el animal tenía una ubicación asignada, se registra la transición desde esa instalación hasta ninguna ubicación.

Si ya carecía de ubicación, no es necesario generar un cambio adicional de ubicación.

El evento de venta o muerte conserva su propio significado y no queda sustituido por el evento de ubicación.

## 10. Información geográfica

### 10.1. Coordenadas de las instalaciones

Las instalaciones pueden disponer de coordenadas geográficas para facilitar su representación en un mapa.

Las coordenadas son opcionales y no constituyen un requisito para registrar o utilizar una instalación.

La información geográfica permite mejorar la visualización y orientación dentro de la explotación, pero no determina por sí misma las reglas de ubicación.

### 10.2. Coordenadas generales de la explotación

La explotación puede disponer de unas coordenadas geográficas generales, independientes de las coordenadas de cada instalación.

Estas coordenadas permiten situar la explotación en el mapa incluso cuando alguna de sus instalaciones no dispone de una posición específica.

### 10.3. Representación cartográfica

La visualización cartográfica puede utilizar la siguiente prioridad para determinar el centro inicial del mapa:

1. Coordenadas de la instalación seleccionada.
2. Coordenadas generales de la explotación.
3. Vista geográfica amplia por defecto.

El mapa es una herramienta de consulta y orientación.

No constituye por sí mismo un mecanismo de reubicación ni permite modificar la ubicación de los recursos mediante operaciones gráficas de arrastrar y soltar.

### 10.4. Límites geográficos y perímetros

La representación de perímetros, superficies, límites de parcelas, polígonos y otras funcionalidades GIS no forma parte del modelo actual.

Su posible incorporación deberá estudiarse posteriormente, atendiendo a las necesidades reales de la explotación y a la solución geográfica que se adopte.

## 11. Administración de instalaciones

La gestión administrativa de las instalaciones se realiza desde la configuración de la explotación.

Debe distinguirse entre:

- **Administración de instalaciones:** creación, modificación, activación, desactivación y configuración de usos.
- **Operaciones ganaderas:** consulta de ubicaciones y registro de cambios de ubicación de animales.

Los usuarios que puedan administrar las instalaciones deberán disponer de los permisos correspondientes.

Las restricciones de uso y estado deben validarse en backend. La interfaz no constituye una barrera de seguridad ni puede ser la única responsable de impedir operaciones no permitidas.

La modificación de las características de una instalación debe respetar las reglas de integridad y las referencias históricas existentes.

## 12. Evolución prevista del modelo

El modelo actual resuelve las necesidades básicas de ubicación de animales individuales, pero no representa todavía todas las necesidades de la explotación.

Se identifican las siguientes líneas de evolución.

### 12.1. Compatibilidad de instalaciones por especie

La configuración actual `admite_animales` es demasiado genérica para representar correctamente las necesidades de una explotación que gestiona distintas especies.

Por ejemplo:

- Una pocilga podría admitir porcino, pero no vacuno.
- Un cercado podría admitir tanto vacuno como porcino.
- Otras instalaciones podrían admitir únicamente una de las especies.

Se considera una evolución probable permitir configurar explícitamente qué especies puede alojar cada instalación.

Inicialmente, las especies relevantes serían:

- Vacuno.
- Porcino.

El modelo deberá permitir incorporar otras especies en el futuro, si la aplicación amplía su alcance.

La selección de especies permitidas podría sustituir al indicador manual `admite_animales`, puesto que la existencia de al menos una especie permitida ya implicaría que la instalación admite animales.

En ese escenario, `admite_animales` podría conservarse como un indicador interno de la aplicación, derivado de la configuración específica, en lugar de ser un atributo directamente modificable por el usuario.

Este planteamiento es una propuesta de evolución, no una decisión de implementación cerrada.

Quedan pendientes de definición:

- El catálogo definitivo de especies.
- La estructura de configuración de especies permitidas por instalación.
- El tratamiento de instalaciones que no admitan ninguna especie.
- Las reglas de compatibilidad y validación.
- La forma de mantener la compatibilidad con los datos existentes.

### 12.2. Compatibilidad de instalaciones por tipo de stock

La configuración actual `admite_stock` tampoco permite representar adecuadamente las necesidades de almacenamiento.

No todos los almacenes contienen los mismos productos. Una instalación puede estar destinada a paja, otra a pienso y otra a productos sanitarios.

En el futuro se considera conveniente permitir seleccionar los tipos de stock que admite cada instalación.

Algunos ejemplos iniciales podrían ser:

- Paja.
- Pienso.
- Medicamentos y productos sanitarios.
- Otros tipos de existencias que se definan posteriormente.

La selección de uno o varios tipos de stock podría sustituir al indicador manual `admite_stock`.

Al igual que en el caso de los animales, este indicador podría convertirse en una condición interna derivada de la configuración específica, en lugar de ser modificable directamente por el usuario.

Sin embargo, el modelo de stocks todavía no está conceptualizado ni desarrollado. Por tanto, no se establecen aquí catálogos, relaciones, reglas de compatibilidad ni estructuras de datos definitivas.

### 12.3. Capacidades y ocupación

En el futuro podrían ser necesarias reglas de capacidad y ocupación de las instalaciones.

Entre las posibilidades que podrían estudiarse se encuentran:

- Capacidad máxima de animales.
- Capacidad diferenciada por especie.
- Superficie disponible.
- Capacidad de almacenamiento.
- Límites de peso o volumen.
- Ocupación actual y disponibilidad.

No se define todavía ninguna de estas capacidades ni se establece que deban formar parte del modelo definitivo.

Su incorporación dependerá de las necesidades operativas reales y de la definición de los modelos de animales y stocks.

### 12.4. Ubicación de lotes y recursos colectivos

El modelo actual se centra en la ubicación de animales individuales.

Sin embargo, la gestión ganadera de determinadas especies contempla animales que no estarán registrados como individuos en la aplicación.

En estos casos, el lote constituirá la unidad de gestión y seguimiento, por lo que deberá poder ubicarse y reubicarse como una unidad colectiva.

La ubicación de un lote no debe interpretarse como una instrucción para generar cambios de ubicación individuales para todos los animales que lo componen.

Este aspecto deberá definirse dentro del Modelo Ganadero, incluyendo las reglas para:

- Ubicación de lotes.
- Reubicación de lotes.
- División y fusión de lotes.
- Mezcla de animales procedentes de distintos lotes.
- Transiciones entre etapas productivas.

El modelo transversal de instalaciones deberá poder proporcionar las referencias físicas necesarias, sin imponer cómo se gestionan estos procesos.

### 12.5. Gestión de stocks

La ubicación de stocks constituye otra línea de evolución.

La gestión de existencias deberá definir su propia unidad de seguimiento, composición, movimientos y reglas de ubicación.

No se debe asumir que el modelo de ubicación de animales es directamente aplicable al almacenamiento de productos.

La definición de stocks deberá abordar, entre otros aspectos, la compatibilidad de productos con instalaciones, las cantidades, las entradas y salidas, las existencias y las posibles capacidades de almacenamiento.

Hasta entonces, `admite_stock` representa únicamente la configuración básica existente.

## 13. Aspectos expresamente pendientes de definición

Para evitar que las propuestas futuras se interpreten como decisiones ya adoptadas, se identifican expresamente los siguientes puntos pendientes:

| Aspecto | Situación |
|---|---|
| Compatibilidad por especies | Evolución prevista, pendiente de diseño. |
| Catálogo de especies | Inicialmente vacuno y porcino; ampliación futura por determinar. |
| Compatibilidad por tipos de stock | Pendiente de conceptualizar. |
| Modelo de stocks | Pendiente de definición. |
| Capacidades y aforos | Pendiente de análisis. |
| Ubicación de lotes | Pendiente de definición dentro del Modelo Ganadero. |
| Reubicación de lotes | Pendiente de definición dentro del Modelo Ganadero. |
| División y fusión de lotes | Pendiente de definición dentro del Modelo Ganadero. |
| Relación entre ubicación de animales y ubicación de lotes | Sin regla general establecida. |
| Perímetros y funcionalidades GIS | Fuera del alcance actual. |
| Jerarquías entre instalaciones | No definidas. |

## 14. Invariantes del modelo actual

Las siguientes reglas deben mantenerse mientras esté vigente el modelo actual:

1. Una instalación es una entidad física independiente de los recursos que pueda contener.
2. El tipo de instalación es descriptivo y no determina automáticamente sus usos.
3. Los usos permitidos se configuran explícitamente.
4. Una instalación inactiva no puede utilizarse como destino de nuevas ubicaciones.
5. Una instalación no puede desactivarse mientras existan animales vivos o lotes activos ubicados en ella.
6. Deshabilitar la admisión de animales no modifica automáticamente la ubicación de los animales existentes.
7. Los cambios de ubicación se registran mediante eventos `CAMBIO_UBICACION`.
8. La ubicación actual del animal es una proyección derivada de los eventos.
9. No se debe modificar la ubicación actual sin registrar el evento correspondiente.
10. El origen de una reubicación se obtiene de la situación actual del recurso en backend.
11. Una reubicación física no equivale a un movimiento entre lotes.
12. Las reglas específicas de ubicación de cada tipo de recurso corresponden a su modelo funcional.
13. La información histórica de instalaciones y ubicaciones debe conservarse.

## 15. Relación con el resto de la base de conocimiento

Este documento define el modelo transversal de instalaciones y ubicaciones.

Su relación con otros documentos es la siguiente:

- **Modelo Ganadero:** define los conceptos y reglas generales de la gestión ganadera, incluyendo las particularidades de las especies que se vayan incorporando. También define la representación y gestión de animales individuales y unidades colectivas, como los lotes de animales anónimos.
- **Modelo de Stocks:** deberá definir la gestión de existencias y su relación con las instalaciones.
- **Dominio Operacional:** podrá utilizar las instalaciones como referencia para los procesos operativos que se definan.

Este documento no sustituye a los modelos funcionales ni define los procesos de negocio que corresponden a cada uno.

Su responsabilidad es proporcionar una representación común de las instalaciones físicas de la explotación y establecer las reglas generales que permiten utilizarlas como referencia de ubicación.