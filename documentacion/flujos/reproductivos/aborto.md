# Flujo reproductivo — Aborto

> Documento permanente de la Base de Conocimiento.
>
> Este documento define qué significa el Aborto dentro del dominio reproductivo, cuándo puede registrarse, cómo se relaciona con el ciclo reproductivo y qué consecuencias tiene sobre la historia reproductiva de la madre.
>
> El documento describe el flujo y las reglas de dominio consolidadas. No describe tareas de implementación, arquitectura técnica, RPC, QA ni planificación de un PRD.

---

# 1. Propósito

El Aborto representa el hecho reproductivo mediante el cual una gestación termina antes de que se produzca un Parto.

Dentro del sistema, registrar un Aborto significa que la explotación conoce que se ha producido una pérdida de la gestación.

El sistema representa conocimiento operativo. No pretende reconstruir las circunstancias biológicas o veterinarias que produjeron la pérdida.

El flujo básico es:

```text
CUBRICIÓN
    ↓
CUBIERTA
    ↓
CONFIRMACIÓN DE GESTACIÓN (opcional)
    ↓
GESTANTE
    ↓
ABORTO
```

El Aborto finaliza el ciclo reproductivo actual.

Si la madre continúa siendo reproductora, inmediatamente después se inicia un nuevo ciclo en estado `VACÍA`.

```text
                    ABORTO
                       │
                       ▼
              ciclo actual finaliza
                       │
                       ▼
               nuevo ciclo abierto
                       │
                       ▼
                     VACÍA
```

---

# 2. Qué significa Aborto

La definición operativa del dominio es:

> **Aborto = pérdida de una gestación antes del Parto, sin nacimiento registrado.**

El Aborto es un hecho reproductivo que afecta a la madre y al ciclo reproductivo al que pertenece.

No representa:

- un nacimiento;
- una cría;
- una dependencia madre-cría;
- una Cubrición concreta;
- un diagnóstico veterinario;
- un cierre de ciclo como hecho independiente.

La distinción fundamental es:

```text
ABORTO
    ↓
hecho reproductivo registrado
```

frente a:

```text
ciclo cerrado
    ↓
consecuencia derivada del Aborto
```

y:

```text
VACÍA
    ↓
situación reproductiva del nuevo ciclo
```

El Aborto es el hecho. El cierre del ciclo y el nuevo estado reproductivo son consecuencias del dominio.

---

# 3. El Aborto como conocimiento operativo

El sistema no intenta simular el proceso biológico completo.

Por ello, registrar un Aborto no implica conocer:

- la causa de la pérdida;
- la edad fetal;
- las semanas exactas de gestación;
- el momento exacto de la muerte fetal;
- el número de fetos;
- un diagnóstico veterinario;
- el mecanismo biológico que produjo la pérdida.

El conocimiento que necesita representar el dominio es:

```text
existía un proceso reproductivo compatible
                ↓
se produjo una pérdida de gestación
                ↓
no hubo nacimiento registrado
```

Por tanto:

> **El sistema registra que hubo un Aborto, no reconstruye cómo se produjo.**

---

# 4. Condiciones para registrar un Aborto

El Aborto requiere simultáneamente:

1. un ciclo reproductivo abierto;
2. un estado reproductivo `CUBIERTA` o `GESTANTE`.

La regla puede expresarse como:

```text
ciclo abierto
AND
(
    estado_reproductivo = CUBIERTA
    OR
    estado_reproductivo = GESTANTE
)
```

Por tanto:

```text
CUBIERTA ──────┐
               ├──→ ABORTO
GESTANTE ──────┘
```

Ser reproductora no es por sí solo suficiente. Debe existir además un ciclo abierto cuyo estado actual sea compatible con el registro de una pérdida de gestación.

---

# 5. Aborto desde CUBIERTA

El Aborto puede registrarse directamente desde `CUBIERTA`.

```text
CUBRICIÓN
    ↓
CUBIERTA
    ↓
ABORTO
```

No es necesario que exista previamente una Confirmación de Gestación.

Esto es coherente con el significado de `CUBIERTA`: existe una Cubrición registrada, pero todavía no se ha registrado una Confirmación de Gestación.

La ausencia de confirmación no impide registrar posteriormente el hecho conocido de que se ha producido un Aborto.

---

# 6. Aborto desde GESTANTE

El Aborto también puede registrarse desde `GESTANTE`.

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

En este caso existe una Confirmación de Gestación previa.

La consecuencia del Aborto sobre el ciclo es la misma que cuando se registra desde `CUBIERTA`.

---

# 7. La Confirmación de Gestación es opcional

La Confirmación de Gestación representa un aumento del nivel de conocimiento disponible, pero no es un requisito para que pueda existir posteriormente un Aborto.

Son válidos ambos recorridos:

```text
CUBRICIÓN
    ↓
CUBIERTA
    ↓
ABORTO
```

y:

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

La aplicación no debe inventar una Confirmación de Gestación cuando nunca se registró.

---

# 8. El Aborto no es una Cubrición fallida

No debe confundirse la ausencia de una Confirmación de Gestación con un Aborto.

```text
CUBRICIÓN
    ↓
CUBIERTA
    ↓
no se confirma gestación
```

no significa:

```text
ABORTO
```

La falta de confirmación únicamente indica que ese conocimiento no fue registrado.

No permite concluir que:

- hubo una gestación;
- no hubo una gestación;
- se produjo una pérdida;
- se produjo un Aborto.

El Aborto existe cuando se registra explícitamente ese hecho.

---

# 9. Estados desde los que puede y no puede registrarse

| Estado reproductivo | Aborto permitido | Motivo |
|---|---:|---|
| `CUBIERTA` | Sí | Existe un ciclo abierto compatible con una pérdida de gestación |
| `GESTANTE` | Sí | Existe una gestación confirmada dentro del ciclo |
| `LACTANTE` | No | Ya se ha producido un Parto |
| `VACÍA` | No | No existe una gestación abierta que pueda terminar en Aborto |
| `NULL` | No | El módulo reproductivo no aplica al animal |
| Otro estado | No | No representa un contexto reproductivo compatible |

La regla esencial es:

> **El Aborto requiere un ciclo reproductivo abierto y un estado reproductivo `CUBIERTA` o `GESTANTE`.**

---

# 10. Aborto desde LACTANTE

No puede registrarse un Aborto desde `LACTANTE`.

```text
LACTANTE
    ↓
ABORTO
```

no es un flujo válido.

`LACTANTE` implica que ya se ha producido un Parto.

La gestación que dio lugar a ese Parto ya terminó.

Una pérdida posterior de una cría no debe reinterpretarse como un Aborto. Ese hecho pertenece a la historia de la cría y a los flujos que gestionan la dependencia madre-cría.

---

# 11. Aborto desde VACÍA

Tampoco puede registrarse un Aborto desde `VACÍA`.

```text
VACÍA
    ↓
ABORTO
```

no es válido.

`VACÍA` representa el estado basal de un ciclo reproductivo activo en el que no existe actualmente una gestación conocida.

La secuencia correcta después de un Aborto es:

```text
ABORTO
    ↓
VACÍA
    ↓
nueva Cubrición
    ↓
CUBIERTA
```

El siguiente Aborto, si se produce, pertenecerá al siguiente ciclo.

---

# 12. Aborto sobre un ciclo cerrado

El estado reproductivo no es la única condición que determina la posibilidad de registrar un Aborto.

El ciclo también debe estar abierto.

```text
ciclo abierto
    ↓
puede recibir hechos reproductivos compatibles
```

mientras que:

```text
ciclo cerrado
    ↓
no recibe nuevos hechos reproductivos
```

Una vez registrado el Aborto, el ciclo termina y ya no puede recibir nuevos eventos reproductivos.

---

# 13. Relación del Aborto con el ciclo reproductivo

El Aborto pertenece al ciclo reproductivo actual.

El ciclo agrupa los hechos que forman una misma historia reproductiva.

Por ejemplo:

```text
Ciclo 8
│
├── Cubrición 1
├── Cubrición 2
├── Confirmación de gestación
└── Aborto
```

El Aborto constituye el hecho que pone fin a este ciclo.

La relación es:

```text
CICLO
  │
  ├── CUBRICIÓN
  ├── CUBRICIÓN
  ├── CONFIRMACIÓN
  └── ABORTO
           ↓
       fin del ciclo
```

El ciclo conserva la historia completa. El Aborto no borra ni sustituye los hechos anteriores.

---

# 14. Relación con las Cubriciones

Las Cubriciones pertenecen al ciclo reproductivo.

El Aborto también pertenece al ciclo reproductivo.

Pero el Aborto **no se vincula a una Cubrición concreta**.

Por ejemplo:

```text
Ciclo 8
├── Cubrición 1
├── Cubrición 2
├── Cubrición 3
└── Aborto
```

No debe interpretarse como:

```text
Ciclo 8
├── Cubrición 1
├── Cubrición 2
└── Cubrición 3
      └── Aborto
```

El Aborto afecta al ciclo completo.

No afirma que la pérdida haya sido consecuencia de una Cubrición determinada.

---

# 15. Múltiples Cubriciones dentro del mismo ciclo

El dominio permite varias Cubriciones dentro de un mismo ciclo.

Por ejemplo:

```text
Ciclo 12

01/04  Cubrición 1
15/04  Cubrición 2
28/04  Cubrición 3
20/05  Aborto
```

Todas las Cubriciones permanecen como hechos históricos del ciclo.

El Aborto:

- no elimina ninguna Cubrición;
- no modifica ninguna Cubrición;
- no cambia la fecha de ninguna Cubrición;
- no establece que una Cubrición concreta sea la causa del Aborto.

---

# 16. La última Cubrición como referencia temporal

Cuando sea necesario utilizar una Cubrición como referencia temporal dentro del ciclo, la última Cubrición registrada puede ser la referencia vigente.

Por ejemplo:

```text
Cubrición 1
Cubrición 2
Cubrición 3
Aborto
```

Sin embargo, esto no crea una relación histórica:

```text
Aborto → Cubrición 3
```

El Aborto continúa perteneciendo al ciclo.

La última Cubrición puede ser una referencia temporal del ciclo sin convertirse en la Cubrición afectada por el Aborto.

---

# 17. El Aborto como elemento independiente del historial

Cada hecho reproductivo conserva su identidad dentro del historial.

Una historia puede ser:

```text
Ciclo 8

12/04  Cubrición
18/04  Cubrición
25/04  Confirmación de gestación
10/06  Aborto
```

La lectura correcta es una secuencia de hechos independientes.

No debe transformarse en:

```text
10/06  Aborto de la última Cubrición
```

porque el dominio no necesita afirmar esa relación.

---

# 18. Efecto del Aborto sobre el ciclo

El Aborto finaliza el ciclo reproductivo actual.

```text
CICLO ABIERTO
      ↓
    ABORTO
      ↓
CICLO CERRADO
```

El ciclo finalizado queda identificado por el resultado `ABORTO`.

Conceptualmente:

```text
resultado del ciclo = ABORTO
fecha de finalización = fecha del Aborto
```

El cierre es una consecuencia del hecho registrado.

---

# 19. El cierre del ciclo no es un evento

El cierre del ciclo no constituye un hecho histórico independiente.

El historial registra:

```text
ABORTO
```

No registra además:

```text
CIERRE_CICLO
```

ni:

```text
FIN_CICLO
```

La separación es:

```text
ABORTO
    ↓
hecho histórico
```

frente a:

```text
ciclo cerrado
    ↓
consecuencia derivada
```

Esta distinción mantiene el historial formado exclusivamente por hechos que realmente han ocurrido.

---

# 20. Creación del nuevo ciclo

Si la madre continúa siendo reproductora, el cierre del ciclo por Aborto da lugar a un nuevo ciclo reproductivo abierto.

La secuencia es:

```text
CICLO N
    │
    └── ABORTO
           ↓
        cerrado
           ↓
CICLO N+1
           ↓
         VACÍA
```

El nuevo ciclo comienza el mismo día del Aborto.

Por tanto, conceptualmente:

```text
fecha_fin(Ciclo N) = fecha_aborto
fecha_inicio(Ciclo N+1) = fecha_aborto
```

---

# 21. El inicio del nuevo ciclo no es un evento

El nuevo ciclo no requiere registrar un hecho artificial de `INICIO_CICLO`.

La historia puede representarse así:

```text
Ciclo 6
├── Cubrición
├── Confirmación
└── Aborto

Ciclo 7
└── VACÍA
```

No existe un evento adicional entre ambos ciclos.

El nuevo ciclo es una nueva unidad de seguimiento reproductivo, no un hecho biológico que el usuario haya registrado.

---

# 22. Condición para iniciar un nuevo ciclo

Después del Aborto se comprueba si la madre continúa siendo reproductora.

```text
ABORTO
   ↓
¿es_reproductora = true?
   │
   ├── Sí → nuevo ciclo abierto en VACÍA
   │
   └── No → no se inicia nuevo ciclo
```

La regla mantiene la coherencia con el principio general del dominio: solo las hembras que participan en el módulo reproductivo pueden mantener un ciclo reproductivo.

---

# 23. Estado reproductivo después del Aborto

Cuando se inicia el nuevo ciclo, el estado reproductivo de la madre pasa a `VACÍA`.

Desde `CUBIERTA`:

```text
CUBIERTA
    ↓
ABORTO
    ↓
VACÍA
```

Desde `GESTANTE`:

```text
GESTANTE
    ↓
ABORTO
    ↓
VACÍA
```

`VACÍA` representa el estado basal del nuevo ciclo: la madre continúa participando en el módulo reproductivo, pero ya no existe una gestación conocida.

---

# 24. El Aborto no modifica vínculos madre-cría

El Aborto se produce antes del Parto.

Por definición, no existe un nacimiento asociado al Aborto.

Por tanto, el Aborto:

- no crea una cría;
- no crea una dependencia madre-cría;
- no establece un nuevo vínculo materno;
- no modifica los vínculos madre-cría existentes.

Conceptualmente:

```text
ABORTO
    ↓
no hubo nacimiento
    ↓
no hay nueva cría
    ↓
no hay nuevo vínculo madre-cría
```

El Aborto afecta a la historia reproductiva de la madre y a su ciclo, no al conjunto de dependencias madre-cría.

---

# 25. El Aborto no rompe vínculos madre-cría existentes

El Aborto tampoco debe utilizarse para finalizar vínculos que ya existan.

Su ámbito es:

```text
gestación
+
madre
+
ciclo reproductivo
```

No es un mecanismo para gestionar:

```text
crías existentes
+
dependencias madre-cría
```

La gestión de esos vínculos pertenece a los flujos específicos de nacimiento, dependencia y finalización de vínculos.

---

# 26. Aborto y Parto de cría muerta

La diferencia entre ambos hechos es fundamental.

## Aborto

```text
gestación
    ↓
ABORTO
    ↓
no hubo nacimiento registrado
```

## Parto de cría muerta

```text
gestación
    ↓
PARTO
    ↓
sí hubo nacimiento
    ↓
se crea Animal
    ↓
estado_vital = MUERTO
```

Por tanto:

> **Un nacimiento de cría muerta no es un Aborto.**

La diferencia no depende de que la cría esté viva o muerta.

La diferencia fundamental es si se produjo y se registró un nacimiento.

---

# 27. Muerte fetal y Aborto

En el contexto operativo actual no se realizan ecografías ni se pretende registrar información veterinaria detallada sobre el feto.

Por ello, cuando se conoce que se ha producido una pérdida de la gestación y no existe un nacimiento registrado, el hecho se representa como `ABORTO`.

No se crea una categoría independiente para:

```text
MUERTE_FETAL
```

ni una entidad que represente al feto.

La aplicación no necesita determinar el momento exacto de la muerte fetal.

En este contexto:

```text
pérdida de gestación
+
no hubo nacimiento
        ↓
     ABORTO
```

---

# 28. Aborto frente a Parto

Los dos hechos representan desenlaces diferentes de una gestación.

```text
                    GESTACIÓN
                        │
                ┌───────┴───────┐
                │               │
              PARTO           ABORTO
                │               │
                ▼               ▼
           nacimiento      pérdida de gestación
                │               │
                ▼               ▼
             Animal          no Animal
                │
                ▼
        vínculo madre-cría
                │
                ▼
            LACTANTE
```

El Parto continúa la historia hacia la fase de dependencia madre-cría.

El Aborto finaliza directamente el ciclo reproductivo.

---

# 29. Aborto frente a Destete

El Aborto y el Destete pueden conducir a la finalización de un ciclo, pero representan hechos diferentes.

## Aborto

```text
GESTACIÓN
    ↓
ABORTO
    ↓
ciclo finaliza
    ↓
nuevo ciclo
```

## Destete

```text
PARTO
    ↓
dependencia madre-cría
    ↓
DESTETE
    ↓
finalización del ciclo según las reglas de dependencia
    ↓
nuevo ciclo
```

El Aborto afecta a la gestación.

El Destete afecta a la fase posterior al Parto y a la dependencia madre-cría.

No deben intercambiarse sus significados.

---

# 30. Aborto frente a Venta y Muerte

La Venta y la Muerte de la madre pueden finalizar un ciclo reproductivo, pero no representan una pérdida de gestación.

```text
ABORTO
    ↓
pérdida de gestación
```

```text
VENTA
    ↓
finalización de la participación de la madre
```

```text
MUERTE
    ↓
finalización de la vida de la madre
```

Son hechos diferentes y deben permanecer diferenciados dentro de la historia reproductiva.

La gestión específica de Venta y Muerte pertenece a otros flujos.

---

# 31. Aborto frente a TIMEOUT

El Aborto representa un hecho conocido y registrado explícitamente.

`TIMEOUT` representa una posible discontinuidad temporal en la que no se ha registrado un desenlace reproductivo.

Por tanto:

```text
ABORTO
    ↓
hecho conocido
```

no debe confundirse con:

```text
TIMEOUT
    ↓
ausencia de un desenlace conocido
```

No se debe inferir automáticamente un Aborto por el paso del tiempo.

`TIMEOUT` queda fuera del flujo de Aborto.

---

# 32. Fecha del Aborto

La fecha del Aborto representa la fecha en la que ocurrió el hecho conocido.

No representa:

- la fecha de introducción del dato;
- la fecha de apertura del formulario;
- la fecha de la última Cubrición por defecto.

La fecha pertenece al Aborto como hecho histórico.

---

# 33. Coherencia temporal

La fecha del Aborto debe ser posterior o igual al último evento reproductivo registrado dentro del ciclo activo.

Conceptualmente:

```text
fecha_aborto
    >=
fecha_último_evento_reproductivo_del_ciclo
```

Ejemplo válido:

```text
10/04  Cubrición
25/04  Confirmación
20/05  Aborto
```

Ejemplo no válido:

```text
10/04  Cubrición
25/04  Confirmación
15/04  Aborto
```

En el segundo caso el Aborto quedaría situado antes de un hecho reproductivo posterior del mismo ciclo.

El flujo de Aborto debe mantener esta coherencia temporal y no introducir nuevas incoherencias.

---

# 34. El Aborto termina la secuencia temporal del ciclo

Una vez registrado un Aborto, ese ciclo queda finalizado.

Por tanto, los hechos reproductivos posteriores no pertenecen al ciclo que acaba de terminar.

Ejemplo:

```text
Ciclo 5
├── Cubrición
├── Confirmación
└── Aborto
       ↓
     cerrado

Ciclo 6
└── nuevos hechos reproductivos
```

Una nueva Cubrición posterior al Aborto pertenece al nuevo ciclo, si la madre continúa siendo reproductora.

---

# 35. El Aborto no reabre un ciclo

Una vez que un ciclo ha finalizado por Aborto:

```text
Ciclo 5
    ↓
ABORTO
    ↓
CERRADO
```

ese ciclo no vuelve a estar disponible para nuevos hechos reproductivos.

Los hechos posteriores pertenecen al ciclo siguiente.

Esto mantiene separadas las distintas historias reproductivas de la madre.

---

# 36. Historial de eventos

El historial de la madre conserva el Aborto como un hecho independiente.

Por ejemplo:

```text
Ciclo 8

12/04  Cubrición
18/04  Cubrición
25/04  Confirmación de gestación
10/06  Aborto
```

No se añaden:

```text
10/06  Cierre de ciclo
10/06  Inicio de ciclo
```

porque esos conceptos no representan hechos históricos independientes.

El historial debe permitir comprender qué ocurrió sin mostrar mecanismos internos del ciclo.

---

# 37. Carrusel reproductivo

El carrusel debe contar la historia reproductiva de forma comprensible para el ganadero.

Una historia como:

```text
CUBRICIÓN
↓
CONFIRMACIÓN DE GESTACIÓN
↓
ABORTO
```

debe poder interpretarse como:

> La gestación terminó antes del parto.

El carrusel puede representar el ciclo como:

```text
Ciclo 8

Cubrición
Confirmación de gestación
Aborto
```

El Aborto aparece como un hecho propio dentro de la historia del ciclo.

---

# 38. El carrusel no muestra el cierre del ciclo

El carrusel no debe mostrar un elemento independiente llamado:

```text
Cierre de ciclo
```

Tampoco debe mostrar:

```text
Inicio de nuevo ciclo
```

La existencia de esos estados se entiende a partir de la estructura de los ciclos y de los hechos registrados.

La historia puede representarse simplemente como:

```text
Ciclo 8
├── Cubrición
├── Confirmación
└── Aborto

Ciclo 9
└── ...
```

No se necesitan eventos artificiales para explicar el cambio de ciclo.

---

# 39. El carrusel no muestra mecanismos internos

La representación para el usuario no debe exponer conceptos internos como:

- snapshots;
- proyecciones;
- reglas internas;
- cierre técnico del ciclo;
- creación técnica del siguiente ciclo;
- identificadores internos del ciclo.

El usuario debe poder comprender la historia mediante los hechos reproductivos que conoce.

```text
gestación
    ↓
Aborto
    ↓
fin de este ciclo
```

La explicación debe ser comprensible sin conocer el funcionamiento interno del sistema.

---

# 40. Historia y carrusel

El historial y el carrusel tienen perspectivas diferentes sobre la misma historia.

## Historial

Representa los hechos registrados:

```text
Cubrición
Confirmación
Aborto
```

## Carrusel

Organiza esos hechos dentro de la historia del ciclo:

```text
Ciclo reproductivo
    ↓
gestación
    ↓
Aborto
    ↓
fin del ciclo
```

Ambas representaciones deben mantener el mismo significado.

El carrusel no debe inventar hechos que no existen en el historial.

---

# 41. Ejemplo completo: Aborto desde CUBIERTA

```text
Ciclo 4

12/04  Cubrición
          ↓
        CUBIERTA

20/05  Aborto
          ↓
     ciclo finalizado
          ↓
     resultado = ABORTO
          ↓
     nuevo ciclo
          ↓
        VACÍA
```

No existe una Confirmación de Gestación registrada.

El flujo sigue siendo válido porque `CUBIERTA` es un estado compatible con el registro de Aborto.

---

# 42. Ejemplo completo: Aborto desde GESTANTE

```text
Ciclo 5

12/04  Cubrición
          ↓
        CUBIERTA

25/04  Confirmación de gestación
          ↓
        GESTANTE

20/05  Aborto
          ↓
     ciclo finalizado
          ↓
     resultado = ABORTO
          ↓
     nuevo ciclo
          ↓
        VACÍA
```

La Confirmación de Gestación aporta un hecho adicional, pero no modifica el significado del Aborto ni su efecto sobre el ciclo.

---

# 43. Ejemplo completo: múltiples Cubriciones

```text
Ciclo 6

10/04  Cubrición 1
15/04  Cubrición 2
22/04  Cubrición 3
05/05  Aborto
```

La lectura correcta es:

```text
Ciclo 6
├── Cubrición 1
├── Cubrición 2
├── Cubrición 3
└── Aborto
```

No:

```text
Cubrición 3
└── Aborto
```

El Aborto pertenece al ciclo completo.

---

# 44. Ejemplo completo: nuevo ciclo después del Aborto

```text
Ciclo 6
────────────────────
10/04  Cubrición
05/05  Aborto
        ↓
      cerrado


Ciclo 7
────────────────────
05/05  VACÍA
```

La fecha de finalización del Ciclo 6 y la fecha de inicio del Ciclo 7 coinciden.

No existe un evento entre ambos ciclos.

---

# 45. Ejemplo completo: nueva Cubrición después del Aborto

```text
Ciclo 6

10/04  Cubrición
05/05  Aborto
        ↓
      cerrado


Ciclo 7

05/05  VACÍA

20/07  Cubrición
        ↓
      CUBIERTA
```

La Cubrición del 20/07 pertenece al Ciclo 7.

No puede pertenecer al ciclo que terminó el 05/05.

---

# 46. Ejemplo inválido: Aborto después del Parto

No es válido:

```text
CUBRICIÓN
    ↓
PARTO
    ↓
LACTANTE
    ↓
ABORTO
```

El Parto ya representa el nacimiento.

Una pérdida posterior de una cría no constituye una pérdida de gestación.

---

# 47. Ejemplo inválido: Aborto desde VACÍA

No es válido:

```text
Ciclo nuevo
    ↓
VACÍA
    ↓
ABORTO
```

Para registrar un Aborto debe existir un ciclo abierto cuyo estado sea `CUBIERTA` o `GESTANTE`.

---

# 48. Ejemplo inválido: Aborto sobre un ciclo cerrado

No es válido:

```text
Ciclo 7
    ↓
ABORTO
    ↓
CERRADO
    ↓
nuevo Aborto
```

El segundo Aborto tendría que pertenecer a otro ciclo abierto y compatible.

---

# 49. Continuidad entre ciclos

Cada ciclo representa una unidad independiente de historia reproductiva.

Por tanto:

```text
Ciclo N
   ↓
ABORTO
   ↓
fin
```

no significa que la historia reproductiva de la madre haya terminado definitivamente.

Si continúa siendo reproductora:

```text
Ciclo N+1
   ↓
VACÍA
```

El nuevo ciclo permite comenzar una nueva historia reproductiva sin modificar la anterior.

---

# 50. Estado de la madre después del Aborto

Después del Aborto, si se inicia un nuevo ciclo, la madre queda en estado `VACÍA`.

Esto significa que:

- continúa participando en el módulo reproductivo;
- el ciclo anterior ya terminó;
- no existe una gestación conocida en el nuevo ciclo;
- puede registrarse una nueva Cubrición.

La secuencia es:

```text
ABORTO
   ↓
VACÍA
   ↓
CUBRICIÓN
```

---

# 51. Qué conserva la historia del ciclo

Un ciclo terminado por Aborto conserva todos los hechos que ocurrieron antes de la pérdida.

Por ejemplo:

```text
Ciclo 8

Cubrición 1
Cubrición 2
Confirmación de gestación
Aborto
```

Esta historia permite saber:

- que hubo actividad reproductiva;
- que existieron una o varias Cubriciones;
- si se confirmó la gestación;
- que posteriormente se registró un Aborto;
- que ese ciclo terminó por Aborto.

No es necesario añadir otro hecho para explicar el final del ciclo.

---

# 52. Separación entre evento, estado y ciclo

El flujo mantiene la separación general del dominio reproductivo.

## Evento

```text
ABORTO
```

Representa el hecho registrado.

## Estado reproductivo

```text
VACÍA
```

Representa la situación reproductiva derivada del nuevo ciclo.

## Ciclo

```text
CERRADO
```

Representa la situación derivada del resultado del ciclo.

La relación conceptual es:

```text
                 ABORTO
                    │
                    ▼
             reglas del dominio
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
       ciclo                estado
          │                   │
          ▼                   ▼
      CERRADO               VACÍA
```

El Aborto es la fuente del cambio. Los estados no son introducidos manualmente por el usuario como hechos independientes.

---

# 53. Invariantes del flujo

Las reglas que deben mantenerse siempre son:

1. El Aborto solo puede registrarse sobre un ciclo reproductivo abierto.
2. El estado reproductivo debe ser `CUBIERTA` o `GESTANTE`.
3. La Confirmación de Gestación no es obligatoria para registrar un Aborto.
4. Un Aborto finaliza el ciclo reproductivo actual.
5. El resultado del ciclo finalizado por Aborto es `ABORTO`.
6. Si la madre continúa siendo reproductora, se inicia un nuevo ciclo.
7. El nuevo ciclo comienza en `VACÍA`.
8. El nuevo ciclo comienza el mismo día del Aborto.
9. Las Cubriciones anteriores permanecen intactas.
10. El Aborto pertenece al ciclo, no a una Cubrición concreta.
11. El Aborto no representa un nacimiento.
12. El Aborto no crea una nueva entidad Animal.
13. El Aborto no crea vínculos madre-cría.
14. El Aborto no modifica ni rompe vínculos madre-cría existentes.
15. Un Parto de una cría muerta no es un Aborto.
16. Un ciclo cerrado no puede recibir nuevos eventos reproductivos.
17. El historial no incorpora eventos artificiales de cierre o inicio de ciclo.
18. La ausencia de Confirmación de Gestación no permite inferir un Aborto.
19. El paso del tiempo no permite inferir automáticamente un Aborto.
20. La fecha del Aborto no puede ser anterior al último evento reproductivo del ciclo activo.

---

# 54. Qué no representa el Aborto

El Aborto no representa:

- una Cubrición fallida;
- una ausencia de Confirmación de Gestación;
- un `TIMEOUT`;
- una muerte de la madre;
- una Venta de la madre;
- un Parto;
- un nacimiento de cría muerta;
- una muerte posterior de una cría;
- un diagnóstico veterinario;
- una causa clínica de la pérdida;
- una edad fetal conocida;
- una entidad fetal;
- una nueva cría;
- una dependencia madre-cría;
- un cierre de ciclo como evento independiente;
- un inicio de ciclo como evento independiente.

---

# 55. Fuera del flujo de Aborto

El flujo de Aborto no define el comportamiento de:

- Venta de la madre;
- Muerte de la madre;
- Parto;
- Destete;
- TIMEOUT;
- corrección de eventos históricos;
- compensación de eventos registrados por error;
- reconstrucción de hechos biológicos no conocidos;
- diagnóstico o clasificación veterinaria.

Estos hechos pueden interactuar con la historia reproductiva de la madre, pero tienen sus propios flujos y reglas de dominio.

---

# 56. Relación con otros flujos reproductivos

## Cubrición

La Cubrición puede situar el ciclo en `CUBIERTA`.

Desde ese estado puede producirse un Aborto.

```text
CUBRICIÓN
    ↓
CUBIERTA
    ↓
ABORTO
```

## Confirmación de Gestación

La Confirmación puede situar el ciclo en `GESTANTE`.

Desde ese estado puede producirse un Aborto.

```text
CUBRICIÓN
    ↓
CUBIERTA
    ↓
CONFIRMACIÓN
    ↓
GESTANTE
    ↓
ABORTO
```

## Parto

El Parto representa un nacimiento.

```text
GESTACIÓN
    ↓
PARTO
    ↓
LACTANTE
```

El Aborto representa una pérdida de gestación sin nacimiento registrado.

```text
GESTACIÓN
    ↓
ABORTO
    ↓
fin del ciclo
```

## Destete

El Destete pertenece a la fase posterior al Parto y a la gestión de la dependencia madre-cría.

No forma parte del flujo de Aborto.

## Venta y Muerte

Venta y Muerte pueden finalizar un ciclo por causas no reproductivas.

No deben confundirse con el Aborto.

## TIMEOUT

TIMEOUT representa una posible discontinuidad temporal futura.

No debe utilizarse para inferir automáticamente un Aborto.

---

# 57. Resumen del flujo

El flujo completo puede resumirse así:

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
                               ▼
                       resultado = ABORTO
                               │
                               ▼
                    ¿sigue siendo reproductora?
                         │               │
                        Sí               No
                         │                │
                         ▼                ▼
                 NUEVO CICLO             fin
                         │
                         ▼
                       VACÍA
```

La historia visible para el usuario permanece sencilla:

```text
Ciclo anterior

Cubrición
Confirmación de gestación (si existe)
Aborto

        ↓

Nuevo ciclo

VACÍA
```

El punto esencial es:

> **El Aborto es un hecho reproductivo que representa una pérdida de gestación antes del Parto. Cierra el ciclo actual y, si la madre continúa siendo reproductora, da paso inmediatamente a un nuevo ciclo en estado `VACÍA`.**

No crea una cría, no crea ni rompe vínculos madre-cría, no se vincula a una Cubrición concreta y no necesita eventos artificiales de cierre o inicio de ciclo.
