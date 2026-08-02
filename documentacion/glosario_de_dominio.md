# Glosario de Dominio

## Objetivo

Este documento define el **Lenguaje Ubicuo** del proyecto.

Su finalidad es proporcionar una única definición oficial para todos los conceptos utilizados en el sistema, garantizando que desarrolladores, documentación, asistentes de IA y futuras implementaciones utilicen siempre el mismo vocabulario.

No pretende explicar la implementación técnica de cada concepto, sino describir su significado dentro del dominio del negocio.

---

# Alcance

Este glosario únicamente contiene conceptos permanentes del dominio y de la arquitectura funcional.

No incluye:

* tecnologías concretas (Next.js, Supabase, Tailwind…);
* detalles de implementación;
* decisiones temporales;
* convenciones internas de herramientas de IA.

Cada término debe poder seguir siendo válido aunque cambie la tecnología utilizada para implementar el sistema.

---

# Cómo utilizar este documento

Antes de introducir un nuevo término en la documentación, debe comprobarse si ya existe una definición equivalente en este glosario.

Si existe, deberá utilizarse exactamente esa terminología.

Si no existe, deberá añadirse aquí antes de utilizarla en el resto de la Base de Conocimiento.

Este documento constituye la referencia oficial del vocabulario del proyecto.

---

# Estructura de las definiciones

Cada concepto sigue la misma estructura:

* Definición
* Reglas principales
* Conceptos relacionados

---

# Conceptos Fundamentales

## Acción de negocio

### Definición

Operación reconocible por el usuario que representa una intención del mundo real.

Las acciones de negocio son la única forma en que el usuario interactúa con el sistema.

Ejemplos:

* Registrar compra
* Registrar venta
* Registrar parto
* Registrar destete
* Registrar cubrición

### Reglas

* Nunca se almacenan como entidades.
* Se implementan mediante Casos de Uso.
* Una acción puede generar uno o varios eventos.

### Relacionado

* Caso de Uso
* Evento
* Movimiento

---

## Caso de Uso

### Definición

Unidad de aplicación que coordina la ejecución de una acción de negocio.

Orquesta validaciones, reglas de dominio, persistencia y generación de eventos.

### Reglas

* Representa una única intención del usuario.
* No contiene lógica de infraestructura.
* Es el punto de entrada de todas las escrituras.

---

## Evento

### Definición

Hecho que ha ocurrido dentro del negocio.

Constituye la fuente de verdad del sistema.

### Reglas

* Es inmutable.
* Nunca se modifica.
* Nunca se elimina.
* Toda modificación futura se realiza mediante compensaciones.

### Relacionado

* Acción de negocio
* Snapshot
* Proyección
* Compensación

---

## Movimiento

### Definición

Agrupación lógica de varios eventos relacionados que representan una única operación de stock.

Permite mantener la trazabilidad de operaciones complejas.

### Ejemplos

* Destete
* Traslado entre lotes
* Incorporación desde lote

---

## Compensación

### Definición

Corrección realizada creando nuevos eventos que revierten los efectos de otros anteriores.

### Reglas

* Nunca modifica el pasado.
* Nunca elimina eventos.
* Conserva toda la trazabilidad.

---

## Snapshot

### Definición

Estado persistido de una entidad derivado de los eventos registrados.

Su finalidad es optimizar las consultas del sistema.

### Reglas

* Nunca es la fuente de verdad.
* Siempre puede reconstruirse a partir de los eventos.
* No puede modificarse directamente.

---

## Proyección

### Definición

Proceso mediante el cual el sistema calcula un estado derivado a partir de uno o varios eventos.

Una proyección puede actualizar uno o varios snapshots.

---

# Dominio Ganadero

## Animal

Entidad individual identificable dentro de la explotación.

Representa un animal físico sobre el que pueden registrarse eventos.

---

## Lote

Conjunto de animales gestionados como una única unidad.

Puede representar diferentes fases productivas según la especie.

---

## Tipo Productivo

Clasificación funcional que indica el destino productivo de un animal.

Ejemplos:

* Recría
* Engorde
* Reproductora
* Semental

No representa un estado biológico.

---

## Estado Vital

Estado derivado que representa la situación actual del animal.

Ejemplos:

* Vivo
* Vendido
* Muerto

Se calcula automáticamente a partir de los eventos.

---

## Entrada

Evento de stock que incrementa la cantidad de animales de una entidad.

Siempre requiere un motivo.

---

## Salida

Evento de stock que reduce la cantidad de animales de una entidad.

Siempre requiere un motivo.

---

## Motivo

Clasificación que explica por qué se produce un movimiento de stock.

Ejemplos:

* Compra
* Venta
* Muerte
* Destete
* Adopción

---

## Ajuste

Evento utilizado para corregir errores excepcionales de inventario.

Debe utilizarse únicamente cuando no sea posible representar la corrección mediante un proceso normal del dominio.

---

# Dominio Reproductivo

## Ciclo Reproductivo

Representa el ciclo biológico completo de una hembra reproductora.

Agrupa todos los eventos reproductivos relacionados.

---

## Estado Reproductivo

Estado derivado calculado automáticamente a partir del historial reproductivo.

Ejemplos:

* Vacía
* Cubierta
* Gestante
* Lactante

---

## Cubrición

Evento biológico que registra una monta o inseminación.

Inicia o actualiza la información reproductiva del ciclo.

---

## Confirmación de Gestación

Evento biológico que confirma que el sistema conoce la existencia de una gestación.

Puede registrarse sobre una cubrición previa o como primer hecho conocido del ciclo reproductivo,
cuando la cubrición no fue registrada (habitual en explotaciones extensivas).
En este segundo caso, el formulario solicita una estimación de la edad gestacional en meses
para permitir calcular la fecha prevista de parto.

---

## Parto

Evento biológico que registra el nacimiento de nuevas crías.

Su comportamiento depende de la especie.

---

## Destete

Evento biológico que representa la separación definitiva de las crías de la madre.

Puede implicar movimientos de stock y cierre del ciclo reproductivo.

---

## Aborto

Evento biológico que representa la pérdida de la gestación antes del parto.

Cierra el ciclo reproductivo activo y deja al animal en estado vacía.

---

# Dominio Financiero

## Venta

Operación comercial derivada de uno o varios eventos físicos.

Representa la realidad económica de una salida comercial.

---

## Línea de Venta

Unidad comercial que enlaza un evento físico con una operación económica.

Constituye el puente entre el dominio ganadero y el financiero.

---

## Factura

Documento fiscal que formaliza una operación económica.

Constituye la fuente de verdad documental del dominio financiero.

---

## Transacción

Representación simplificada de un movimiento económico.

Se utiliza para consultas, balances y análisis financieros.

---

# Mantenimiento

Cuando aparezca un nuevo concepto permanente del dominio deberá añadirse primero a este documento antes de utilizarse en cualquier otra parte de la Base de Conocimiento.

El objetivo es mantener un único lenguaje compartido para todo el proyecto.
