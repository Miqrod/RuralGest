# PRD011 — Aborto y pérdida de gestación

# 1. Contexto

Este PRD continúa la evolución del dominio reproductivo desarrollada durante:

- PRD007 — Cubrición.
- PRD008 — Confirmación de Gestación.
- PRD009 — Parto.
- PRD010 — Finalización del Ciclo Reproductivo y Gestión de la Dependencia Madre-Cría.

El objetivo de PRD011 es incorporar el Aborto como un hecho reproductivo explícito y consolidar su efecto sobre el ciclo reproductivo de la madre.

Este PRD debe apoyarse en la documentación permanente vigente y en las decisiones consolidadas durante los PRD anteriores. La documentación histórica se utiliza como contexto y no prevalece sobre las decisiones posteriores ya validadas.

## Documentación de referencia obligatoria

### Especificaciones

- `product_spec.md`
- `backend_spec.md`
- `frontend_spec.md`

### Modelo

- `documentacion/modelo/modelo_reproductivo.md`
- `documentacion/modelo/modelo_ganadero.md`

### Arquitectura

- `documentacion/arquitectura/overview.md`
- `documentacion/arquitectura/domains/reproductive.md`
- `documentacion/arquitectura/patterns/context-rules-projection.md`
- `documentacion/arquitectura/patterns/action-usecase-event.md`
- `documentacion/arquitectura/patterns/rpc-transaccional.md`

### Flujos reproductivos

- `documentacion/flujos/reproductivos/README.md`, si existe.
- `documentacion/flujos/reproductivos/cubricion.md`
- `documentacion/flujos/reproductivos/confirmacion-gestacion.md`, o su equivalente vigente.
- `documentacion/flujos/reproductivos/parto.md`
- `documentacion/flujos/reproductivos/destete.md`
- `documentacion/flujos/reproductivos/aborto.md`

### Documentación pendiente

- `documentacion/pending_documentation.md`

### Documentación histórica

- `CHAT03.02-CICLO REPRODUCTIVO.txt`

---

# 2. Filosofía del PRD

El sistema representa conocimiento operativo, no una simulación biológica.

Por tanto, registrar un Aborto significa registrar un hecho conocido por la explotación:

> Se ha producido una pérdida de la gestación antes del Parto.

El sistema no pretende determinar ni almacenar información que no haya sido realmente conocida por el usuario, como:

- causa veterinaria;
- edad fetal;
- momento exacto de la muerte fetal;
- número de fetos;
- diagnóstico clínico;
- mecanismo biológico de la pérdida.

Los principios que deben mantenerse son:

- Event First.
- Los eventos son la única fuente de verdad.
- Los estados son proyecciones derivadas.
- Context → Rules → Projection.
- La interfaz trabaja con acciones de negocio.
- El dominio trabaja con eventos.
- La lógica de negocio permanece centralizada.
- No duplicar reglas entre Frontend, Application y Domain.
- User First.

---

# 3. Objetivo del PRD

Implementar el flujo completo de registro de Aborto dentro del dominio reproductivo, manteniendo la coherencia temporal e histórica del ciclo y sin introducir conceptos biológicos que el sistema no pueda conocer.

El resultado esperado es:

```text
CUBIERTA / GESTANTE
        ↓
      ABORTO
        ↓
  ciclo actual cerrado
        ↓
¿la madre continúa siendo reproductora?
      /              \
    SÍ                NO
    ↓                  ↓
nuevo ciclo         sin ciclo activo
VACÍA
```

El Aborto debe ser el único hecho histórico registrado para representar esta pérdida de gestación. El cierre del ciclo y la eventual creación de un nuevo ciclo son consecuencias derivadas del dominio.

---

# 4. Definición funcional de Aborto

## 4.1 Qué representa

El Aborto es un evento reproductivo independiente que representa una pérdida de gestación antes de que se produzca un Parto.

El evento afecta a:

- la madre;
- el ciclo reproductivo actual.

No afecta a:

- una Cubrición concreta;
- una cría;
- la genealogía;
- los vínculos madre-cría existentes.

## 4.2 Qué no representa

El Aborto no debe confundirse con:

- Cubrición fallida;
- ausencia de Confirmación de Gestación;
- TIMEOUT;
- muerte fetal registrada como una entidad independiente;
- Parto de una cría muerta;
- muerte de una cría después del nacimiento.

La distinción fundamental es:

```text
ABORTO
    ↓
no hubo nacimiento registrado
```

frente a:

```text
PARTO DE CRÍA MUERTA
    ↓
sí hubo nacimiento registrado
    ↓
se crea Animal
    ↓
estado_vital = MUERTO
```

---

# 5. Contexto válido para registrar Aborto

El Aborto requiere simultáneamente:

1. un ciclo reproductivo abierto;
2. un estado reproductivo `CUBIERTA` o `GESTANTE`.

Regla:

```text
ciclo abierto
AND
estado_reproductivo ∈ {CUBIERTA, GESTANTE}
```

## 5.1 Desde CUBIERTA

Permitido.

La Confirmación de Gestación es opcional y no es requisito para registrar el Aborto.

```text
CUBRICIÓN
    ↓
CUBIERTA
    ↓
ABORTO
```

## 5.2 Desde GESTANTE

Permitido.

```text
CUBRICIÓN
    ↓
CUBIERTA
    ↓
CONFIRMACIÓN DE GESTACIÓN
    ↓
GESTANTE
    ↓
ABORTO
```

## 5.3 Desde LACTANTE

No permitido.

El estado `LACTANTE` implica que ya se ha registrado un Parto y, por tanto, la gestación anterior ha terminado.

## 5.4 Desde VACÍA

No permitido.

`VACÍA` únicamente es un estado válido dentro de un ciclo reproductivo abierto. No representa una gestación pendiente de pérdida.

## 5.5 Sin ciclo abierto

No permitido.

No puede registrarse un Aborto fuera de un ciclo reproductivo.

---

# 6. Relación con las Cubriciones

El Aborto pertenece al ciclo reproductivo y no a una Cubrición concreta.

Un mismo ciclo puede contener varias Cubriciones:

```text
Ciclo N
├── Cubrición 1
├── Cubrición 2
├── Cubrición 3
└── Aborto
```

No debe modelarse como:

```text
Cubrición 3
└── Aborto
```

El hecho de que la última Cubrición pueda utilizarse como referencia temporal en determinadas reglas no crea una relación histórica Aborto → Cubrición.

Las Cubriciones anteriores permanecen intactas y no son modificadas por el Aborto.

---

# 7. Efecto sobre el ciclo reproductivo

El registro del Aborto cierra el ciclo reproductivo actual.

El cierre es una consecuencia derivada del evento y no un evento histórico independiente.

```text
CICLO ABIERTO
      ↓
    ABORTO
      ↓
CICLO CERRADO
```

El ciclo debe quedar interpretado como finalizado por Aborto.

El historial no debe generar eventos artificiales como:

- `CIERRE_CICLO`;
- `FIN_CICLO`;
- `INICIO_CICLO`.

La historia debe contener únicamente el hecho real:

```text
ABORTO
```

---

# 8. Nuevo ciclo después del Aborto

Una vez cerrado el ciclo por Aborto, la posibilidad de crear un nuevo ciclo depende de si la madre continúa siendo reproductora.

## 8.1 Madre que continúa siendo reproductora

Se crea inmediatamente un nuevo ciclo reproductivo abierto en estado `VACÍA`.

```text
Ciclo N
    ↓
ABORTO
    ↓
cerrado
    ↓
Ciclo N+1
    ↓
VACÍA
```

El nuevo ciclo comienza el mismo día del Aborto.

## 8.2 Madre que ya no es reproductora

No se crea un nuevo ciclo.

```text
Ciclo N
    ↓
ABORTO
    ↓
cerrado
    ↓
NO REPRODUCTORA
    ↓
sin ciclo reproductivo activo
```

El Aborto no provoca ningún cambio adicional sobre vínculos madre-cría ni crea una nueva entidad Animal.

---

# 9. Regla transversal consolidada durante PRD011: cambio de condición reproductora durante un ciclo abierto

Durante el análisis de PRD011 se consolida una regla transversal que deberá ser respetada por los siguientes flujos reproductivos.

> **Cambiar de `REPRODUCTORA` a `NO REPRODUCTORA` no cierra un ciclo reproductivo que ya está abierto.**

La condición de reproductora determina la posibilidad de iniciar un nuevo ciclo cuando el ciclo actual haya terminado, pero no invalida ni cierra retrospectivamente un ciclo que ya estaba en curso.

Ejemplo:

```text
Ciclo N
│
├── Cubrición
├── Gestación
│
├── el animal deja de ser REPRODUCTORA
│
├── Parto
└── Destete
       ↓
   ciclo cerrado
       ↓
   NO nuevo ciclo
```

El ciclo continúa hasta su desenlace correspondiente aunque el animal deje de estar clasificado como reproductora durante su desarrollo.

Esta regla es especialmente relevante para Destete, Venta, Muerte y para la futura consolidación del `ReproductiveEngine`.

---

# 10. Regla transversal consolidada durante PRD011: reactivación reproductiva

También se consolida durante PRD011 la siguiente regla para los casos en los que un animal tiene historial reproductivo pero no existe un ciclo abierto.

> **Cuando un animal sin ciclo reproductivo abierto pasa a ser `REPRODUCTORA`, se inicia un nuevo ciclo reproductivo abierto en estado `VACÍA`.**

La secuencia es:

```text
Ciclo N
    ↓
fin del ciclo
    ↓
NO REPRODUCTORA
    ↓
sin ciclo activo
    ↓
tipo_productivo = REPRODUCTORA
    ↓
nuevo ciclo
    ↓
VACÍA
```

Este cambio no debe generar un evento reproductivo artificial.

La creación del nuevo ciclo es una consecuencia derivada de la nueva condición reproductiva del animal.

La regla evita que exista una hembra clasificada como `REPRODUCTORA` durante un periodo en el que no existe ningún ciclo reproductivo abierto.

---

# 11. Estado reproductivo

El Aborto no debe establecer directamente estados derivados desde la interfaz.

La consecuencia del evento debe ser determinada por las reglas del dominio.

Cuando se crea un nuevo ciclo tras el Aborto:

```text
estado_reproductivo = VACÍA
```

Cuando no se crea nuevo ciclo porque la madre no es reproductora:

```text
no existe ciclo reproductivo activo
estado_reproductivo = NULL
```

Esto mantiene la distinción entre:

```text
VACÍA
```

que significa:

> animal reproductor con un ciclo abierto y sin gestación conocida;

frente a:

```text
NULL
```

que significa:

> el módulo reproductivo no aplica actualmente al animal.

No debe utilizarse `VACÍA` para representar un animal sin ciclo reproductivo activo.

---

# 12. Vínculos madre-cría

El Aborto no crea vínculos madre-cría.

Tampoco rompe ni modifica vínculos existentes.

```text
ABORTO
    ↓
no hay nacimiento
    ↓
no hay nueva cría
    ↓
no hay nuevo vínculo
```

Los vínculos existentes pertenecen a otros hechos reproductivos y deben conservar su significado.

El Aborto afecta únicamente a la madre y al ciclo reproductivo en el que se registra.

---

# 13. Historial de eventos

El historial de eventos de la madre debe registrar:

```text
ABORTO
```

como un elemento independiente.

Ejemplo:

```text
Ciclo 8

12/04  Cubrición
18/04  Cubrición
25/04  Confirmación de gestación
10/06  Aborto
```

No se deben añadir eventos artificiales para representar el cierre del ciclo o la creación del siguiente.

---

# 14. Historial reproductivo y carrusel

El carrusel interpreta la historia reproductiva agregada del animal.

El Aborto debe aparecer como un hecho del ciclo actual:

```text
Ciclo 8
├── Cubrición
├── Confirmación de gestación
└── Aborto
```

El carrusel no muestra como elementos independientes:

- cierre del ciclo;
- inicio del siguiente ciclo;
- snapshots;
- reglas internas;
- RPC;
- identificadores técnicos.

## 14.1 Si después del Aborto existe nuevo ciclo

```text
Ciclo 8
├── Cubrición
├── Confirmación
└── Aborto

Ciclo 9
└── VACÍA
```

## 14.2 Si después del Aborto no existe nuevo ciclo

```text
Ciclo 8
├── Cubrición
├── Confirmación
└── Aborto

Sin ciclo reproductivo activo
```

El segundo elemento no representa un evento ni un ciclo adicional. Es una situación contextual derivada que permite explicar que la historia reproductiva continúa siendo consultable aunque actualmente no exista un ciclo abierto.

---

# 15. Regla de visibilidad del historial reproductivo

Durante PRD011 se consolida también una regla de lectura que deberá mantenerse en los siguientes PRD.

El widget de historial reproductivo no debe depender de que el animal sea actualmente reproductor.

Debe mostrarse cuando el animal haya tenido al menos un ciclo reproductivo registrado.

```text
¿ha tenido algún ciclo?
        │
   ┌────┴────┐
  NO         SÍ
  │           │
  ▼           ▼
no mostrar   mostrar historial
```

Por tanto:

- un animal sin ningún ciclo no necesita mostrar el widget;
- un animal con ciclos históricos debe poder consultar su historia aunque actualmente no sea reproductor;
- un animal con ciclos históricos y un ciclo activo muestra el ciclo actual junto con los anteriores;
- un animal con ciclos históricos pero sin ciclo activo muestra la historia y el contexto `Sin ciclo reproductivo activo`.

Esta regla no forma parte del evento Aborto en sí, pero queda consolidada en este PRD porque el Aborto introduce explícitamente el caso en el que un ciclo puede terminar sin que se cree otro.

---

# 16. Situación "Sin ciclo reproductivo activo"

Cuando existe historial reproductivo pero no existe un ciclo abierto, el carrusel puede finalizar con un contexto informativo equivalente a:

**Sin ciclo reproductivo activo**

El texto definitivo de UX deberá mantener un lenguaje comprensible para el ganadero y evitar explicar reglas técnicas internas.

La finalidad del contexto es comunicar que:

- el historial anterior se conserva;
- actualmente no existe un ciclo reproductivo abierto;
- el animal no está actualmente seleccionado como reproductor, cuando esa sea la causa conocida.

Este contexto no debe convertirse en un evento `SIN_CICLO`, `FIN_REPRODUCCION` ni equivalente.

---

# 17. Fecha del Aborto

La fecha registrada representa la fecha del hecho, no la fecha de introducción del dato.

Debe respetar la coherencia temporal del ciclo.

La regla mínima de PRD011 es:

```text
fecha_aborto >= fecha_último_evento_reproductivo_compatible_del_ciclo
```

El Aborto no puede situarse temporalmente antes del último evento reproductivo ya registrado en el ciclo activo.

Ejemplo válido:

```text
10/04  Cubrición
25/04  Confirmación
20/05  Aborto
```

Ejemplo inválido:

```text
10/04  Cubrición
25/04  Confirmación
15/04  Aborto
```

PRD011 no introduce un sistema general de corrección retrospectiva de eventos.

---

# 18. Consecuencias posteriores al Aborto

Una vez registrado el Aborto:

1. El evento queda registrado en la historia de la madre.
2. El evento pertenece al ciclo reproductivo abierto actual.
3. El ciclo queda finalizado por Aborto.
4. No se pueden registrar nuevos eventos reproductivos sobre ese ciclo.
5. Si la madre es reproductora, se abre un nuevo ciclo en `VACÍA`.
6. Si la madre no es reproductora, no se abre nuevo ciclo.
7. El historial reproductivo permanece consultable si existe al menos un ciclo registrado.

---

# 19. Casos válidos

## Caso A — Cubierta → Aborto → nuevo ciclo

```text
Ciclo 1
Cubrición
CUBIERTA
Aborto
    ↓
cierre Ciclo 1
    ↓
nuevo Ciclo 2
    ↓
VACÍA
```

## Caso B — Gestante → Aborto → nuevo ciclo

```text
Ciclo 1
Cubrición
Confirmación
GESTANTE
Aborto
    ↓
cierre Ciclo 1
    ↓
nuevo Ciclo 2
    ↓
VACÍA
```

## Caso C — Cubierta → Aborto → no reproductora

```text
Ciclo 1
Cubrición
CUBIERTA
Aborto
    ↓
cierre Ciclo 1
    ↓
NO REPRODUCTORA
    ↓
sin ciclo activo
```

## Caso D — Gestante → Aborto → no reproductora

```text
Ciclo 1
Cubrición
Confirmación
GESTANTE
Aborto
    ↓
cierre Ciclo 1
    ↓
NO REPRODUCTORA
    ↓
sin ciclo activo
```

## Caso E — múltiples Cubriciones

```text
Ciclo 1
├── Cubrición 1
├── Cubrición 2
├── Cubrición 3
└── Aborto
```

El Aborto afecta al ciclo completo.

## Caso F — deja de ser reproductora durante un ciclo abierto

```text
Ciclo 1
├── Cubrición
├── Gestación
├── cambio a NO REPRODUCTORA
├── Parto
└── Destete
       ↓
   cierre del ciclo
       ↓
   no nuevo ciclo
```

El cambio de clasificación no cierra el ciclo.

---

# 20. Casos no válidos

No se permite:

```text
VACÍA
  ↓
ABORTO
```

No se permite:

```text
LACTANTE
  ↓
ABORTO
```

No se permite registrar Aborto sin ciclo abierto.

No se permite registrar un segundo Aborto sobre un ciclo ya cerrado.

No se permite registrar un evento reproductivo posterior dentro del ciclo que ya terminó por Aborto.

No se permite convertir la ausencia de Confirmación de Gestación en un Aborto implícito.

No se permite inferir Aborto por TIMEOUT.

---

# 21. Aborto frente a Parto de cría muerta

Esta distinción es una invariante fundamental.

## Aborto

```text
gestación
    ↓
ABORTO
    ↓
no nacimiento
    ↓
no nueva entidad Animal
```

## Parto de cría muerta

```text
gestación
    ↓
PARTO
    ↓
nacimiento
    ↓
nueva entidad Animal
    ↓
estado_vital = MUERTO
```

La existencia de una entidad nacida es la diferencia conceptual fundamental.

---

# 22. TIMEOUT

`TIMEOUT` queda expresamente fuera de alcance.

PRD011 no implementa:

- cron;
- cierre automático por tiempo;
- evento `TIMEOUT`;
- inferencia automática de Aborto;
- cierre por inactividad.

La futura detección de discontinuidades temporales deberá diseñarse como una capacidad transversal posterior.

---

# 23. Corrección de eventos

PRD011 no resuelve:

- errores de fecha;
- eventos registrados por equivocación;
- identificación errónea del animal;
- correcciones retrospectivas;
- edición o sustitución de hechos históricos.

Los eventos permanecen sujetos al principio de inmutabilidad.

El diseño de mecanismos de corrección y trazabilidad compensatoria queda para una fase transversal posterior.

---

# 24. Atomicidad de la operación

El registro del Aborto es una operación compuesta porque un único hecho puede producir varias consecuencias derivadas.

Conceptualmente:

```text
Registrar Aborto
       │
       ├── registrar EVENTO ABORTO
       │
       ├── finalizar ciclo actual
       │
       ├── determinar condición reproductora
       │
       ├── crear nuevo ciclo si corresponde
       │
       └── actualizar proyecciones derivadas
```

Estas consecuencias deben quedar coherentes entre sí.

No debe existir un estado parcialmente consolidado en el que el Aborto figure registrado pero el ciclo permanezca incorrectamente abierto o exista un nuevo ciclo incorrectamente creado.

La implementación concreta de esta atomicidad deberá seguir el patrón transaccional vigente del proyecto.

---

# 25. Acción de negocio

La funcionalidad se expondrá mediante una acción de negocio comprensible para el usuario.

Nombre previsto:

**Registrar aborto**

El formulario deberá ser deliberadamente sencillo.

Información mínima:

- fecha;
- observaciones opcionales.

No se incorporarán campos para:

- edad fetal;
- tipo de aborto;
- diagnóstico;
- causa clínica;
- número de fetos;
- otros datos biológicos no confirmados.

El formulario deberá explicar el significado de la acción mediante una aclaración equivalente a:

> **Registra la pérdida de una gestación antes del parto.**

La interfaz deberá advertir que la acción tiene consecuencias sobre el ciclo reproductivo y se considera irreversible dentro del modelo actual.

El texto definitivo deberá ser User First y evitar terminología técnica.

---

# 26. Reglas que deben permanecer fuera de la interfaz

El Frontend no debe decidir:

- si existe ciclo abierto;
- si el estado permite Aborto;
- si la fecha es temporalmente válida;
- si el ciclo debe cerrarse;
- si debe crearse un nuevo ciclo;
- si el animal debe quedar en `VACÍA`;
- si el historial reproductivo debe considerarse activo.

La interfaz únicamente representa las acciones y los resultados determinados por el dominio.

---

# 27. ReproductiveEngine

PRD011 no implementa `ReproductiveEngine`.

Durante esta fase deben identificarse y mantener centralizadas las reglas que previsiblemente serán reutilizadas posteriormente, pero sin introducir una abstracción prematura.

Entre las reglas que deberán poder extraerse posteriormente se encuentran:

- elegibilidad de eventos reproductivos según contexto;
- identificación del ciclo abierto;
- finalización de ciclo;
- creación de nuevo ciclo;
- condición de reproductora;
- estado reproductivo derivado;
- coherencia temporal entre eventos reproductivos.

La consolidación transversal de estas reglas queda prevista para PRD013.

---

# 28. Dependencias con PRD012

PRD012 abordará las causas no reproductivas que pueden finalizar un ciclo, principalmente:

- Venta de la madre;
- Muerte de la madre.

PRD011 debe dejar preparado el dominio para que estas causas compartan la misma separación conceptual:

```text
hecho real
   ↓
consecuencia sobre ciclo
   ↓
¿se crea nuevo ciclo?
```

La regla transversal consolidada en PRD011 sobre el cambio de `REPRODUCTORA` a `NO REPRODUCTORA` deberá respetarse también en PRD012.

---

# 29. Dependencias con PRD013

PRD013 consolidará:

- `ReproductiveEngine`;
- reglas transversales del dominio reproductivo;
- integración global de los flujos;
- regresión reproductiva completa;
- pruebas de integración;
- atomicidad;
- idempotencia;
- concurrencia;
- coherencia entre eventos, proyecciones y ciclos.

PRD011 no debe intentar resolver de forma anticipada estas necesidades globales.

---

# 30. Criterios de aceptación

## Dominio

- Existe el evento `ABORTO` integrado en el dominio reproductivo.
- Puede registrarse desde `CUBIERTA`.
- Puede registrarse desde `GESTANTE`.
- No puede registrarse desde `LACTANTE`.
- No puede registrarse desde `VACÍA`.
- No puede registrarse sin ciclo abierto.
- El Aborto pertenece al ciclo y no a una Cubrición concreta.
- Las Cubriciones anteriores permanecen intactas.
- El Aborto cierra el ciclo actual.
- El cierre no genera un evento artificial.
- El resultado del ciclo queda determinado como Aborto.

## Nuevo ciclo

- Si la madre continúa siendo reproductora, se crea un nuevo ciclo abierto.
- El nuevo ciclo comienza el mismo día del Aborto.
- El nuevo ciclo comienza en `VACÍA`.
- Si la madre no es reproductora, no se crea nuevo ciclo.
- Si no existe nuevo ciclo, el animal queda sin ciclo reproductivo activo.

## Cambio de condición reproductora

- Cambiar de `REPRODUCTORA` a `NO REPRODUCTORA` no cierra un ciclo abierto.
- El ciclo abierto continúa hasta su desenlace correspondiente.
- Si el ciclo termina cuando el animal ya no es reproductora, no se crea un nuevo ciclo.
- Si un animal no tiene ciclo abierto y pasa a ser `REPRODUCTORA`, se crea un nuevo ciclo en `VACÍA`.

## Vínculos y nacimiento

- El Aborto no crea ninguna entidad Animal.
- El Aborto no crea vínculos madre-cría.
- El Aborto no modifica vínculos madre-cría existentes.
- Un Parto de cría muerta continúa siendo un Parto y no un Aborto.

## Temporalidad

- La fecha del Aborto no puede ser anterior al último evento reproductivo compatible registrado en el ciclo.
- El ciclo cerrado por Aborto no admite nuevos eventos reproductivos.
- Los eventos posteriores pertenecen al siguiente ciclo cuando exista.

## Historial y carrusel

- El Aborto aparece como evento independiente en el historial de la madre.
- El carrusel muestra el Aborto como último hecho del ciclo correspondiente.
- El carrusel no muestra `CIERRE_CICLO`.
- El carrusel no muestra `INICIO_CICLO`.
- Si existe un nuevo ciclo, este aparece como siguiente ciclo.
- Si no existe nuevo ciclo y existen ciclos históricos, se muestra el contexto `Sin ciclo reproductivo activo`.
- El widget de historial reproductivo se muestra cuando el animal ha tenido al menos un ciclo, independientemente de su condición reproductiva actual.
- Si el animal nunca ha tenido ciclos, el widget no se muestra.

## UX

- Existe la acción `Registrar aborto`.
- El formulario solicita únicamente la información necesaria.
- La fecha es obligatoria.
- Las observaciones son opcionales.
- Se informa al usuario de que está registrando una pérdida de gestación antes del parto.
- Se advierte de las consecuencias irreversibles de la acción dentro del modelo actual.
- La interfaz no contiene reglas de dominio duplicadas.

## Exclusiones

- No se implementa `TIMEOUT`.
- No se implementa corrección general de eventos.
- No se implementa `ReproductiveEngine`.
- No se implementa el flujo completo de Venta o Muerte.
- No se incorporan diagnósticos ni categorías veterinarias de Aborto.

---

# 31. Fuera del alcance

Quedan expresamente fuera de PRD011:

- `TIMEOUT` y automatismos temporales;
- corrección de eventos históricos;
- edición destructiva de eventos;
- Venta de la madre como flujo completo;
- Muerte de la madre como flujo completo;
- ReproductiveEngine;
- arquitectura global de integración reproductiva;
- sistema completo de regresión reproductiva;
- análisis avanzado de fertilidad;
- diagnóstico veterinario;
- clasificación clínica del Aborto;
- ecografías o detección automática de gestación;
- creación de entidades fetales;
- gestión de crías no nacidas;
- cualquier simulación biológica.

---

# 32. Resultado esperado

Al finalizar PRD011, el dominio reproductivo deberá poder representar correctamente la pérdida de una gestación como un hecho explícito y mantener una historia reproductiva coherente.

El flujo consolidado será:

```text
                 CICLO ABIERTO
                       │
              ┌────────┴────────┐
              │                 │
           CUBIERTA          GESTANTE
              │                 │
              └────────┬────────┘
                       │
                     ABORTO
                       │
                       ▼
                 CICLO CERRADO
                       │
              ┌────────┴────────┐
              │                 │
        REPRODUCTORA       NO REPRODUCTORA
              │                 │
              ▼                 ▼
       NUEVO CICLO          SIN CICLO ACTIVO
          VACÍA
```

Además, quedarán consolidadas para los siguientes PRD estas dos reglas transversales:

1. Un cambio de `REPRODUCTORA` a `NO REPRODUCTORA` no cierra un ciclo reproductivo abierto.
2. Un animal sin ciclo reproductivo abierto que pasa a `REPRODUCTORA` inicia un nuevo ciclo en estado `VACÍA`.

Estas reglas podrán incorporarse posteriormente a la documentación permanente consolidada del dominio reproductivo junto con el resto de decisiones acumuladas durante PRD011–PRD013.
