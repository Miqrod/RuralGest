# Patrón Action → Use Case → Event

## Objetivo

Este patrón define cómo una interacción realizada por el usuario se transforma en hechos de negocio que pasan a formar parte de la historia del sistema.

Su objetivo consiste en separar claramente el lenguaje utilizado por el usuario del modelo interno del dominio, preservando al mismo tiempo la coherencia, la trazabilidad y las reglas de negocio.

Este patrón constituye uno de los principios arquitectónicos fundamentales de la aplicación y es reutilizado por todos los dominios.

---

# Motivación

Los usuarios no trabajan pensando en eventos.

Trabajan pensando en acciones propias de su actividad diaria.

Un ganadero no piensa:

> "Voy a registrar un evento."

Piensa:

- Comprar un animal.
- Vender un animal.
- Registrar un parto.
- Destetar una camada.
- Cambiar el tipo productivo.
- Mover un lote.

La aplicación debe permitir que el usuario utilice este lenguaje natural sin obligarle a conocer la representación interna del dominio.

Por otro lado, el dominio necesita representar la realidad mediante hechos consistentes, trazables e interpretables.

Este patrón conecta ambos mundos.

---

# Principio

Los usuarios interactúan con la aplicación mediante acciones de negocio.

Los dominios representan el resultado de esas acciones mediante hechos.

Esta separación permite mantener una experiencia de usuario sencilla sin comprometer la coherencia del modelo de dominio.

---

# Flujo general

```text
Usuario
    │
    ▼
Acción de negocio
    │
    ▼
Use Case
    │
    ▼
Validación
    │
    ▼
Dominio
    │
    ▼
Evento(s)
    │
    ▼
Projection
    │
    ▼
Estado observable
```

Cada uno de estos pasos posee una responsabilidad diferente.

---

# Acción de negocio

La acción representa aquello que el usuario desea realizar.

Forma parte del lenguaje del negocio.

Ejemplos:

- Comprar animal.
- Vender animal.
- Registrar parto.
- Registrar cubrición.
- Destetar.
- Cambiar tipo productivo.
- Crear lote.
- Dividir lote.

Las acciones constituyen la interfaz conceptual entre el usuario y el sistema.

No modifican directamente el dominio.

---

# Use Case

El Use Case representa la traducción entre la intención del usuario y el modelo del dominio.

Sus responsabilidades incluyen:

- recibir la acción;
- validar los datos recibidos;
- coordinar servicios del dominio;
- garantizar la transaccionalidad;
- construir los eventos correspondientes;
- actualizar las proyecciones necesarias.

El Use Case no contiene conocimiento permanente del negocio.

Su función consiste en orquestar la ejecución de una acción concreta.

---

# Dominio

El dominio interpreta la acción recibida.

Aplica las reglas de negocio.

Valida restricciones.

Construye los hechos que describen correctamente la realidad.

El dominio nunca piensa en botones, formularios o pantallas.

Piensa exclusivamente en hechos del negocio.

---

# Eventos

Los eventos representan la consecuencia persistente de una acción.

Un mismo Use Case puede generar:

- un único evento;
- varios eventos relacionados;
- un movimiento compuesto por múltiples eventos.

Los eventos pasan a formar parte de la historia permanente de la explotación.

Nunca representan una acción del usuario.

Representan aquello que realmente ocurrió.

---

# Proyecciones

Una vez registrados los eventos, el sistema actualiza las proyecciones necesarias para facilitar la operación diaria.

Las proyecciones generan:

- estados observables;
- snapshots;
- indicadores;
- información optimizada para lectura.

Estas estructuras nunca constituyen la fuente de verdad del sistema.

Siempre derivan de los eventos registrados.

---

# Ejemplo

## Acción

```text
Vender animal
```

↓

## Use Case

```text
Registrar salida
```

↓

## Dominio

- validar que el animal puede venderse;
- validar estado vital;
- validar reglas de negocio.

↓

## Eventos

```text
Salida
Motivo = Venta
```

↓

## Proyección

```text
Estado vital = Vendido
```

↓

## Usuario

El animal aparece como vendido.

---

# Relación con AvailableActions

El patrón no impone cómo deben descubrirse las acciones disponibles para el usuario.

La aplicación utiliza el concepto de **AvailableActions** para presentar únicamente aquellas acciones compatibles con el estado observable del dominio.

AvailableActions constituye una proyección contextual del dominio cuyo objetivo es traducir el estado y las reglas de negocio en una experiencia de usuario sencilla. 

No define las acciones existentes ni los permisos del usuario; define las acciones que resulta apropiado presentar en un contexto determinado.

No forma parte del dominio.

Su responsabilidad consiste en traducir el conocimiento del dominio a una experiencia de usuario sencilla e intuitiva.

---

# Beneficios

Este patrón proporciona varias ventajas:

- desacopla la interfaz del dominio;
- permite modificar la experiencia de usuario sin alterar el modelo de negocio;
- mantiene un lenguaje cercano al usuario;
- preserva la trazabilidad completa del sistema;
- evita que el frontend conozca la estructura interna de los eventos;
- facilita la reutilización de reglas de negocio;
- mantiene una única interpretación de la realidad.

---

# Relación con otros patrones

Este patrón complementa otros principios arquitectónicos del proyecto.

- **Event First** define que los hechos constituyen la fuente de verdad.
- **Context → Rules → Projection** define cómo cada dominio interpreta dichos hechos.
- **RPC Transactions** garantiza la atomicidad de cada acción.
- **Snapshots** optimiza la lectura sin alterar la historia.

Action → Use Case → Event representa la puerta de entrada a todos ellos.