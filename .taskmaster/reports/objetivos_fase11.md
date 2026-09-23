# Objetivos Fase 11 — Aborto y pérdida de gestación

# Objetivo general

Implementar el Aborto como un evento reproductivo completo dentro del dominio ganadero, representando la pérdida de una gestación antes del Parto y consolidando correctamente sus consecuencias sobre el ciclo reproductivo de la madre.

La implementación deberá reutilizar el Contexto Reproductivo y los patrones ya establecidos durante PRD007, PRD008, PRD009 y PRD010, sin introducir una nueva arquitectura ni anticipar la creación del `ReproductiveEngine`.

El objetivo de esta fase no consiste únicamente en añadir una acción y registrar un nuevo evento.

Su finalidad es garantizar que el Aborto:

- se registre como un hecho histórico independiente;
- pueda producirse desde `CUBIERTA` o `GESTANTE`;
- cierre correctamente el ciclo reproductivo actual;
- cree un nuevo ciclo en `VACÍA` cuando la madre continúe siendo reproductora;
- no cree un nuevo ciclo cuando la madre ya no sea reproductora;
- mantenga intactas las Cubriciones y los vínculos madre-cría;
- conserve una historia reproductiva comprensible para el usuario.

---

# Objetivos funcionales

- Incorporar la acción de negocio `Registrar aborto`.
- Permitir registrar un Aborto desde la ficha de una hembra con ciclo reproductivo abierto.
- Permitir registrar un Aborto desde estado `CUBIERTA`.
- Permitir registrar un Aborto desde estado `GESTANTE`.
- Impedir registrar un Aborto desde `LACTANTE`.
- Impedir registrar un Aborto desde `VACÍA`.
- Impedir registrar un Aborto cuando no exista ciclo reproductivo abierto.
- Solicitar únicamente la información necesaria para representar el hecho: fecha y observaciones opcionales.
- Mostrar una aclaración User First sobre el significado de la acción.
- Mostrar una advertencia sobre el carácter irreversible de la operación dentro del modelo actual.
- Mantener el historial del ciclo después del Aborto.
- Mostrar el Aborto como hecho independiente en el historial y carrusel reproductivo.

---

# Objetivos de dominio

Consolidar el Aborto como evento reproductivo capaz de finalizar un ciclo.

La implementación deberá garantizar que:

- `ABORTO` representa una pérdida de gestación antes del Parto.
- El Aborto pertenece al ciclo reproductivo y no a una Cubrición concreta.
- Las Cubriciones existentes no se modifican.
- La Confirmación de Gestación previa es opcional.
- El Aborto no crea una entidad `Animal`.
- El Aborto no crea vínculos madre-cría.
- El Aborto no modifica vínculos madre-cría existentes.
- El ciclo actual queda cerrado por Aborto.
- El cierre del ciclo no genera un evento adicional.
- El resultado del ciclo queda determinado como Aborto.

---

# Objetivos de continuidad del ciclo

Implementar correctamente las consecuencias posteriores al cierre del ciclo.

## Si la madre continúa siendo reproductora

- Crear un nuevo ciclo reproductivo.
- Iniciarlo el mismo día del Aborto.
- Establecerlo como ciclo abierto.
- Situar el estado reproductivo en `VACÍA`.

## Si la madre no continúa siendo reproductora

- No crear un nuevo ciclo.
- Mantener cerrado el ciclo anterior.
- Dejar al animal sin ciclo reproductivo activo.
- Mantener consultable su historial reproductivo.

---

# Objetivos de reglas transversales consolidadas durante PRD011

PRD011 deberá dejar implementadas y protegidas dos reglas que serán reutilizadas por los siguientes PRD reproductivos.

## Regla 1 — Cambio de condición durante un ciclo abierto

Cambiar de `REPRODUCTORA` a `NO REPRODUCTORA` no debe cerrar un ciclo reproductivo abierto.

El ciclo continuará hasta su propio desenlace.

Ejemplo:

```text
Ciclo abierto
    ↓
REPRODUCTORA → NO REPRODUCTORA
    ↓
el ciclo continúa
    ↓
Destete / Aborto / otro desenlace compatible
    ↓
ciclo cerrado
    ↓
no se crea nuevo ciclo
```

La implementación no debe utilizar el cambio de `tipo_productivo` como mecanismo artificial de cierre de ciclo.

## Regla 2 — Reactivación reproductiva

Cuando un animal no tenga un ciclo reproductivo abierto y pase a ser `REPRODUCTORA`, deberá iniciarse un nuevo ciclo reproductivo abierto en estado `VACÍA`.

```text
sin ciclo activo
    ↓
tipo_productivo = REPRODUCTORA
    ↓
nuevo ciclo
    ↓
VACÍA
```

Esta transición no genera un evento reproductivo artificial.

Estas reglas deberán quedar protegidas mediante pruebas para evitar que los siguientes PRD introduzcan comportamientos contradictorios.

---

# Objetivos de modelo de estado

Mantener la diferencia entre:

```text
VACÍA
```

y:

```text
NULL / sin ciclo reproductivo activo
```

`VACÍA` significa:

> hembra reproductora con ciclo abierto y sin gestación conocida.

La ausencia de ciclo significa:

> el módulo reproductivo no tiene actualmente un ciclo abierto para ese animal.

La interfaz no deberá establecer directamente ninguno de estos estados.

---

# Objetivos de historial reproductivo y carrusel

El historial reproductivo deberá depender de la existencia de historia reproductiva, no de la condición reproductiva actual.

La regla de visibilidad será conceptualmente:

```text
número de ciclos registrados > 0
        ↓
mostrar historial reproductivo
```

Por tanto:

- un animal sin ciclos no mostrará el widget;
- un animal con ciclos históricos mostrará el widget aunque actualmente no sea reproductor;
- un animal con ciclo activo mostrará el ciclo actual y los anteriores;
- un animal con ciclos históricos pero sin ciclo activo mostrará el historial y un contexto final equivalente a `Sin ciclo reproductivo activo`.

El carrusel no deberá mostrar eventos artificiales como `CIERRE_CICLO` o `INICIO_CICLO`.

---

# Objetivos de arquitectura

Reutilizar el patrón arquitectónico consolidado:

```text
Acción
   ↓
Use Case
   ↓
Context
   ↓
Rules
   ↓
Evento
   ↓
Projection
   ↓
Snapshot
   ↓
UI
```

La lógica de negocio deberá permanecer centralizada.

No introducir reglas de negocio en:

- componentes React;
- formularios;
- drawers/modales;
- carrusel;
- widgets de historial;
- consultas de UI.

El Frontend deberá consumir las acciones y proyecciones proporcionadas por el dominio.

---

# Objetivos de persistencia

Implementar la persistencia necesaria para representar el nuevo evento sin duplicar información que ya pueda derivarse del modelo existente.

El diseño deberá respetar:

- eventos como fuente de verdad;
- inmutabilidad de eventos;
- un único ciclo abierto por animal como máximo;
- pertenencia del evento al ciclo mediante el mecanismo existente;
- estados derivados;
- coherencia temporal;
- integridad referencial.

No crear una relación específica Aborto → Cubrición.

La pertenencia al ciclo será suficiente para representar el hecho.

No crear eventos artificiales para representar el cierre o inicio de ciclos.

---

# Objetivos de transaccionalidad

El registro del Aborto y sus consecuencias esenciales deberán consolidarse de forma atómica.

La operación no deberá dejar situaciones parciales como:

```text
ABORTO registrado
+
ciclo todavía abierto
```

o:

```text
ABORTO registrado
+
nuevo ciclo creado incorrectamente
```

La implementación deberá reutilizar el patrón transaccional vigente del proyecto.

---

# Objetivos de coherencia temporal

La fecha del Aborto deberá validarse antes de persistir.

Debe cumplirse como mínimo:

```text
fecha_aborto >= último evento reproductivo compatible del ciclo
```

La implementación deberá impedir que un Aborto se sitúe temporalmente antes del último hecho reproductivo ya registrado dentro del ciclo activo.

No se implementará en esta fase un sistema general de corrección retrospectiva de eventos.

---

# Objetivos de UX

La acción deberá presentarse como una operación sencilla y explícita.

Nombre de acción:

**Registrar aborto**

El formulario deberá contener como mínimo:

- fecha;
- observaciones opcionales.

Debe incluir una aclaración equivalente a:

> Registra la pérdida de una gestación antes del parto.

Debe incluir una advertencia clara sobre las consecuencias de la acción.

La interfaz no deberá solicitar información clínica que el sistema no pueda conocer de forma fiable.

---

# Objetivos de casos límite

La implementación deberá cubrir como mínimo:

- Aborto desde `CUBIERTA`.
- Aborto desde `GESTANTE`.
- Intento desde `LACTANTE`.
- Intento desde `VACÍA`.
- Intento sin ciclo abierto.
- Múltiples Cubriciones dentro del ciclo antes del Aborto.
- Aborto como último evento del ciclo.
- Aborto con madre todavía reproductora.
- Aborto con madre ya no reproductora.
- Animal con historial reproductivo y sin ciclo activo.
- Animal con historial reproductivo que vuelve a ser reproductora.
- Cambio de reproductora a no reproductora durante un ciclo abierto.
- Fecha de Aborto anterior a un evento reproductivo existente.
- Intento de registrar nuevos eventos sobre un ciclo cerrado por Aborto.
- Distinción entre Aborto y Parto de cría muerta.

---

# Objetivos de calidad y pruebas

PRD011 deberá incorporar las pruebas necesarias para garantizar el comportamiento específico del Aborto y proteger las reglas transversales nuevas.

## Pruebas de dominio

Comprobar como mínimo:

- elegibilidad desde `CUBIERTA`;
- elegibilidad desde `GESTANTE`;
- rechazo desde `LACTANTE`;
- rechazo desde `VACÍA`;
- rechazo sin ciclo abierto;
- cierre correcto del ciclo;
- resultado correcto del ciclo;
- creación de nuevo ciclo cuando corresponde;
- ausencia de nuevo ciclo cuando no corresponde;
- nuevo ciclo en `VACÍA`;
- fecha de inicio del nuevo ciclo igual a la fecha del Aborto;
- no modificación de Cubriciones;
- no creación de vínculos madre-cría;
- no creación de animales.

## Pruebas de continuidad reproductiva

Comprobar expresamente:

```text
ciclo abierto
    ↓
REPRODUCTORA → NO REPRODUCTORA
    ↓
ciclo continúa
```

y:

```text
sin ciclo
    ↓
REPRODUCTORA
    ↓
nuevo ciclo VACÍA
```

## Pruebas de historial

Comprobar:

- Aborto visible en historial de la madre;
- Aborto visible como último hecho del ciclo;
- ausencia de eventos artificiales de cierre/inicio;
- historial visible aunque actualmente no sea reproductora;
- historial no mostrado cuando nunca existió ningún ciclo;
- contexto `Sin ciclo reproductivo activo` cuando corresponda.

## Regresión

Deberán comprobarse los flujos reproductivos previamente consolidados que puedan verse afectados por las nuevas reglas.

La estrategia completa de regresión reproductiva e integración se consolidará posteriormente en PRD013.

---

# Objetivos de integración futura

PRD011 debe dejar el dominio preparado para que PRD012 pueda implementar las causas no reproductivas de finalización de ciclo, principalmente Venta y Muerte.

También debe dejar identificadas las reglas transversales que posteriormente serán centralizadas en `ReproductiveEngine` durante PRD013.

No se debe implementar todavía dicho Engine.

---

# Fuera de alcance

No forman parte de esta fase:

- `TIMEOUT`;
- cron o automatismos temporales;
- inferencia automática de Aborto;
- corrección general de eventos;
- edición destructiva del historial;
- Venta de la madre como flujo completo;
- Muerte de la madre como flujo completo;
- `ReproductiveEngine`;
- regresión reproductiva global completa;
- concurrencia avanzada como objetivo específico de integración;
- diagnóstico veterinario;
- causa clínica del Aborto;
- edad fetal;
- número de fetos;
- entidades fetales;
- simulación biológica.

---

# Resultado esperado de la fase

Al finalizar Fase 11, el sistema deberá ser capaz de representar una pérdida de gestación de forma completa, coherente y trazable.

El flujo esperado será:

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

Además, quedarán protegidas las dos reglas transversales incorporadas durante el análisis:

1. Dejar de ser reproductora no cierra un ciclo reproductivo abierto.
2. Volver a ser reproductora cuando no existe un ciclo abierto inicia un nuevo ciclo en `VACÍA`.

La consolidación definitiva de estas reglas junto con el resto del dominio reproductivo se realizará posteriormente en la documentación permanente y en PRD013.
