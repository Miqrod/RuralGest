# PRD-CORRECTIVO --- Contrato del nuevo modelo reproductivo

> Documento de refactor conceptual y técnico. Define el contrato del
> dominio reproductivo que debe utilizarse para refactorizar la
> implementación actual antes de retomar el PRD011 --- Aborto.

## 1. Objetivo

La implementación actual mezcló dos historias que deben permanecer
separadas:

-   la **historia reproductiva de la madre**, organizada en ciclos;
-   la **historia de maternidad**, organizada mediante vínculos
    madre-cría.

El refactor debe hacer que ambas historias puedan coexistir y
evolucionar de forma independiente.

El objetivo no es añadir una nueva funcionalidad de negocio, sino
alinear la implementación existente con el modelo reproductivo
consolidado.

## 2. Principios que permanecen vigentes

Se mantienen:

-   Event First.
-   Los eventos son la fuente de verdad.
-   Los estados son proyecciones derivadas.
-   La interfaz trabaja con acciones de negocio.
-   La lógica de negocio permanece centralizada.
-   No duplicar reglas entre Frontend, Application y Domain.
-   Los eventos históricos no se eliminan para simplificar una
    proyección.
-   El usuario no debe conocer `ciclo_id`, `last_ciclo_id`, snapshots,
    RPCs ni mecanismos internos de proyección.

## 3. Nueva definición del ciclo reproductivo

> **Un ciclo reproductivo es la unidad de historial que agrupa los
> hechos correspondientes a una oportunidad reproductiva de una hembra,
> desde su inicio hasta su desenlace. El ciclo alcanza su desenlace
> cuando se produce Parto, Aborto, Machorra o una finalización manual
> del ciclo. Si la hembra continúa siendo reproductora, tras el
> desenlace se inicia un nuevo ciclo en estado `VACÍA`.**

Debe acompañarse de:

> **La lactación, los vínculos madre-cría y el Destete no determinan la
> duración del ciclo reproductivo. Son hechos y estados funcionales que
> pueden coexistir temporalmente con uno o varios ciclos reproductivos
> posteriores.**

Y:

> **El ciclo reproductivo representa la historia reproductiva de la
> madre. La maternidad y la lactación representan una relación funcional
> que puede prolongarse más allá del ciclo que originó las crías y
> coexistir con ciclos reproductivos posteriores.**

## 4. Cambio conceptual fundamental

Queda obsoleto el modelo:

``` text
CUBRICIÓN
↓
GESTACIÓN
↓
PARTO
↓
LACTANTE
↓
DESTETE
↓
FIN DEL CICLO
```

El modelo correcto es:

``` text
CICLO N
│
├── Cubrición
├── Confirmación
├── Gestación
│
└── PARTO
      │
      ├── desenlace del Ciclo N
      ├── creación de Ciclo N+1 si procede
      └── creación de vínculos madre-cría
```

Después del Parto pueden coexistir:

``` text
Ciclo N cerrado como oportunidad reproductiva
+
Ciclo N+1 actual
+
vínculos madre-cría originados en N
```

## 5. LACTANTE deja de ser estado reproductivo

`LACTANTE` queda obsoleto como valor de `estado_reproductivo`.

Los estados reproductivos son:

``` text
VACÍA
CUBIERTA
GESTANTE
```

y `NULL` cuando el estado reproductivo no sea aplicable.

La lactación no se persiste como estado de la madre.

Se deriva de:

``` text
existe al menos un vínculo madre-cría activo
```

Por tanto, no se debe persistir tampoco `NO_LACTANTE`.

`NO LACTANTE` no necesita mostrarse al usuario.

Son válidas combinaciones como:

``` text
VACÍA + vínculo activo
CUBIERTA + vínculo activo
GESTANTE + vínculo activo
```

## 6. Ciclo y maternidad son historias paralelas

El Parto conecta ambas historias:

``` text
PARTO
│
├── historia reproductiva
│     └── desenlace del ciclo anterior
│
└── maternidad
      └── creación de vínculos
```

Ningún desenlace reproductivo debe modificar automáticamente los
vínculos madre-cría.

Esto incluye:

-   Parto;
-   Aborto;
-   Machorra;
-   Cierre manual.

El cambio de tipo productivo tampoco modifica los vínculos.

## 7. Parto

El Parto:

1.  registra el hecho histórico;
2.  crea las entidades nacidas;
3.  crea los vínculos madre-cría cuando corresponda;
4.  marca el desenlace del ciclo anterior como `PARTO`;
5.  crea un nuevo ciclo si la madre continúa siendo reproductora;
6.  inicia ese nuevo ciclo en `VACÍA`;
7.  utiliza la misma fecha para el Parto y el inicio del nuevo ciclo.

Estas operaciones deben ser atómicas.

### Parto de cría muerta

Una cría nacida muerta sigue siendo un nacimiento:

``` text
PARTO
↓
Animal
↓
estado_vital = MUERTO
tipo_productivo = NULL
```

No es Aborto.

Si todas las crías nacen muertas, no quedan vínculos madre-cría activos
y la historia del ciclo puede quedar finalizada inmediatamente.

## 8. Destete

El Destete:

``` text
DESTETE
↓
finaliza vínculo madre-cría
```

No:

``` text
DESTETE
↓
finaliza ciclo reproductivo
```

Los Destetes pertenecen al `ciclo_id` del ciclo que originó las crías.

Puede haber, por ejemplo:

``` text
Ciclo 2025
└── Parto
    └── crías

Ciclo 2026
└── Gestante

Ciclo 2025
└── Destete
```

Esto es válido.

Un Destete parcial tampoco afecta al ciclo reproductivo actual.

## 9. Desenlace y finalización histórica

Debe distinguirse entre:

### Desenlace reproductivo

``` text
PARTO
ABORTO
MACHORRA
CIERRE_MANUAL
```

### Finalización histórica

Momento en que ya no quedan hechos pendientes que deban registrarse en
ese `ciclo_id`.

Después de un Parto puede existir:

``` text
resultado = PARTO
fecha_fin = NULL
```

mientras existan vínculos madre-cría y puedan producirse Destetes.

Cuando desaparezca el último vínculo y no queden eventos pendientes, se
informa `fecha_fin`.

Si todas las crías del Parto nacen muertas, el ciclo puede tener
`fecha_fin = fecha_parto`.

En Aborto, Machorra y Cierre manual no se esperan eventos posteriores
pertenecientes a la oportunidad reproductiva, por lo que el desenlace y
la finalización histórica coinciden.

## 10. `ciclo_id`

Regla fundamental:

> **`ciclo_id` identifica la historia reproductiva a la que pertenece un
> evento. No significa necesariamente el ciclo actual.**

`last_ciclo_id` identifica el ciclo reproductivo más reciente creado
para el animal.

Un ciclo anterior puede seguir recibiendo eventos que históricamente le
pertenecen.

Ejemplo:

  Evento                               `ciclo_id`
  ------------------------------------ --------------------------------
  Cubrición después del Parto          nuevo
  Confirmación posterior               nuevo
  Parto siguiente                      nuevo
  Destete de cría del parto anterior   anterior
  Muerte de cría todavía vinculada     anterior
  Venta de cría después del Destete    no afecta al ciclo de la madre

## 11. Un único ciclo actual

Se mantiene:

> **Solo existe un ciclo reproductivo actual por animal.**

Pero esto NO significa que los ciclos anteriores queden bloqueados.

El modelo correcto es:

``` text
Ciclo anterior
├── historial completo
└── puede recibir eventos pendientes históricamente pertenecientes a él

Último ciclo
└── ciclo reproductivo actual
```

Por tanto, evitar usar "ciclo abierto/cerrado" como concepto principal
de UX.

`last_ciclo_id` es el ciclo actual.

Los ciclos anteriores siguen formando parte de la historia.

## 12. Inicio de nuevos ciclos

### Se convierte en reproductora

``` text
NO REPRODUCTORA
↓
REPRODUCTORA
↓
nuevo ciclo
↓
VACÍA
```

Esto ocurre incluso si todavía existen vínculos madre-cría activos.

### Parto

``` text
PARTO
↓
nuevo ciclo si sigue siendo reproductora
↓
VACÍA
```

### Aborto

``` text
ABORTO
↓
nuevo ciclo si sigue siendo reproductora
↓
VACÍA
```

### Machorra

``` text
MACHORRA
↓
nuevo ciclo si sigue siendo reproductora
↓
VACÍA
```

### Cierre manual

``` text
REPRODUCTORA
↓
NO REPRODUCTORA
↓
CIERRE_MANUAL
↓
sin nuevo ciclo
```

No debe existir un flujo normal de `CIERRE_MANUAL` para una reproductora
que continúa siendo reproductora. Para una finalización de temporada sin
cambio de uso existe `MACHORRA`.

## 13. Cambio de tipo productivo

### Reproductora → no reproductora + VACÍA

Puede finalizarse automáticamente el ciclo mediante `CIERRE_MANUAL`,
explicando al usuario la consecuencia.

### Reproductora → no reproductora + CUBIERTA

Debe permitirse una decisión consciente del usuario antes de finalizar
el ciclo.

### Reproductora → no reproductora + GESTANTE

No se debe cerrar el ciclo por el cambio de tipo productivo.

La historia continúa hasta:

``` text
PARTO
```

o:

``` text
ABORTO
```

### Con vínculos madre-cría

El cambio de tipo productivo no afecta a los vínculos.

Puede existir:

``` text
NO REPRODUCTORA
+
vínculos activos
```

## 14. Cubrición

Una Cubrición no debe crear un ciclo como comportamiento normal.

El ciclo debe existir previamente:

``` text
NO REPRODUCTORA
↓
REPRODUCTORA
↓
nuevo ciclo VACÍA
↓
Cubrición
```

Dentro de un ciclo pueden existir múltiples Cubriciones:

``` text
Ciclo N
├── Cubrición A
├── Cubrición B
└── Cubrición C
```

Todas permanecen en el historial.

La proyección puede utilizar la última Cubrición relevante para cálculos
derivados.

El Aborto afecta al ciclo, no a una Cubrición concreta.

## 15. Confirmación de gestación

La Confirmación puede existir sin Cubrición registrada.

Si ya existe ciclo:

``` text
Confirmación
↓
GESTANTE
```

Si no existe porque el animal no participa actualmente en reproducción:

``` text
REPRODUCTORA
↓
nuevo ciclo VACÍA
↓
Confirmación
↓
GESTANTE
```

La Confirmación no debe cambiar silenciosamente el tipo productivo.

## 16. Secuencialidad temporal

Deben distinguirse dos niveles.

### Dentro de un ciclo

Los eventos de una misma historia deben mantener una secuencia temporal
coherente.

### Entre ciclos

El nuevo ciclo comienza en la fecha de su desenlace originador:

``` text
Parto
↓
nuevo ciclo
fecha_inicio = fecha_parto
```

Pero no se exige que todos los eventos del ciclo anterior sean
cronológicamente anteriores a todos los eventos del nuevo ciclo.

Puede ocurrir:

``` text
Ciclo 2025
Parto
Destete posterior

Ciclo 2026
Cubrición
Gestación
```

El Destete de 2025 puede ser posterior a eventos del Ciclo 2026.

### Regla crítica

> **La validación temporal de un evento debe realizarse respecto a la
> historia reproductiva a la que pertenece el evento, no respecto al
> último evento cronológico registrado para el animal.**

## 17. Eventos en ciclos anteriores

Deben permitirse cuando históricamente pertenezcan a ellos.

Principalmente:

-   Destete;
-   muerte de una cría todavía vinculada;
-   otros hechos futuros relacionados con vínculos madre-cría.

Una vez finalizado el vínculo:

``` text
Cría
↓
RECRÍA
+
vínculo FINALIZADO
```

sus posteriores:

-   venta;
-   muerte;
-   traslado;

no afectan al ciclo de la madre.

## 18. Estados reproductivos

No debe utilizarse una máquina lineal:

``` text
VACÍA
↓
CUBIERTA
↓
GESTANTE
↓
LACTANTE
```

La dimensión reproductiva queda:

  -----------------------------------------------------------------------
  Estado                              Significado
  ----------------------------------- -----------------------------------
  `VACÍA`                             No existe gestación conocida en el
                                      ciclo actual

  `CUBIERTA`                          Existe una cubrición registrada sin
                                      confirmación de gestación

  `GESTANTE`                          Existe confirmación de gestación

  `NULL`                              No existe estado reproductivo
                                      aplicable
  -----------------------------------------------------------------------

La lactación es independiente.

## 19. Resultados del ciclo

Resultados válidos:

``` text
PARTO
ABORTO
MACHORRA
CIERRE_MANUAL
```

Eliminar:

``` text
DESCONOCIDO
VENTA
MUERTE
```

### Venta y muerte de la madre

Venta y muerte son hechos del animal, no resultados reproductivos.

La interfaz puede mostrar:

> Historia reproductiva finalizada por venta.

o:

> Historia reproductiva finalizada por muerte.

Pero no:

``` text
resultado = VENTA
resultado = MUERTE
```

## 20. Cierre manual

`CIERRE_MANUAL` queda reservado al flujo de cambio de uso productivo
cuando existe una historia reproductiva que debe finalizarse.

No utilizarlo para:

-   sustituir Aborto;
-   sustituir Machorra;
-   cerrar una gestación;
-   resolver TIMEOUT;
-   cerrar ciclos arbitrariamente.

`MACHORRA` es un desenlace reproductivo diferente:

``` text
MACHORRA
↓
ciclo finaliza
↓
nuevo ciclo VACÍA
```

`CIERRE_MANUAL`:

``` text
cambio de uso
↓
ciclo finaliza
↓
sin nuevo ciclo
```

## 21. TIMEOUT

Queda completamente obsoleto.

No implementar:

-   cron;
-   cierre automático por tiempo;
-   evento `TIMEOUT`;
-   resultado `DESCONOCIDO`;
-   cierre por inactividad.

La falta prolongada de desenlace no es por sí misma un resultado.

## 22. Carrusel

El carrusel muestra un slide por `ciclo_id`.

Debe mostrarse si el animal ha tenido al menos un ciclo, aunque
actualmente ya no sea reproductora.

Un animal sin historial reproductivo puede no mostrar el widget.

### Slide actual

``` text
last_ciclo_id
```

### Slides anteriores

Siguen siendo consultables y pueden recibir eventos históricamente
pertenecientes a ellos.

Ejemplo:

``` text
Ciclo 2027 · actual
VACÍA

Ciclo 2026
Gestante
ABORTO

Ciclo 2025
Parto
Crías
Destetes pendientes
```

## 23. Widget de crías dependientes

Mientras exista al menos un vínculo madre-cría activo puede mostrarse un
widget adicional:

``` text
CRÍAS DEPENDIENTES
2 crías mantienen vínculo activo con esta madre.
```

Cuando desaparezca el último vínculo, el widget deja de mostrarse.

Este widget no forma parte del estado del ciclo.

## 24. Historial de eventos

El historial debe permanecer puro.

No crear:

``` text
CIERRE_CICLO
INICIO_CICLO
TIMEOUT
```

El usuario debe ver hechos reales:

``` text
Cubrición
Confirmación
Parto
Aborto
Destete
```

Las consecuencias internas se expresan mediante proyecciones.

## 25. ReproductiveEngine

No implementar `ReproductiveEngine` en este refactor.

Las reglas deben quedar correctamente separadas y centralizadas, pero la
consolidación en un Engine queda para PRD013.

## 26. Temporada reproductiva

Queda completamente fuera de este PRD-Correctivo.

No implementar:

-   temporada;
-   calendario;
-   planificación;
-   inicio/fin global;
-   consecuencias globales;
-   sugerencias automáticas de Machorra.

El núcleo reproductivo no debe depender de la existencia de una
temporada.

## 27. Qué debe eliminarse o refactorizarse

Buscar y eliminar cualquier lógica basada en:

### Obsoleto: Destete cierra ciclo

``` text
Destete
↓
cierre
↓
nuevo ciclo
```

### Obsoleto: LACTANTE es estado reproductivo

``` text
estado_reproductivo = LACTANTE
```

### Obsoleto: ciclo cerrado bloquea eventos

``` text
ciclo cerrado
↓
rechazar evento
```

### Obsoleto: `ciclo_id` = ciclo actual

``` text
ciclo_id = ciclo abierto
```

### Obsoleto: último evento global para validar fechas

``` text
último evento de animal
↓
validación
```

### Obsoleto: Cubrición crea ciclo

``` text
Cubrición
↓
crear ciclo
```

### Obsoleto: resultados

``` text
DESCONOCIDO
VENTA
MUERTE
```

### Obsoleto: eventos artificiales

``` text
CIERRE_CICLO
INICIO_CICLO
TIMEOUT
```

## 28. Áreas que deben revisarse

### Backend

-   Use Cases de Cubrición;
-   Confirmación;
-   Parto;
-   Destete;
-   reglas de elegibilidad;
-   reglas de transición;
-   reglas de ciclo;
-   proyecciones;
-   resolución de `ciclo_id`;
-   `last_ciclo_id`;
-   validaciones temporales;
-   RPCs;
-   creación de ciclos.

### Frontend

-   AvailableActions;
-   acciones reproductivas;
-   formularios;
-   carrusel;
-   badges;
-   indicadores de lactación;
-   mensajes;
-   navegación entre ciclos.

### Persistencia

Revisar:

-   `estado_reproductivo`;
-   `fecha_inicio`;
-   `fecha_fin`;
-   `resultado`;
-   `ciclo_id`;
-   referencias al último ciclo;
-   constraints;
-   RPCs;
-   consultas que supongan que solo existe un ciclo relevante.

## 29. Casos de regresión obligatorios

Como mínimo:

1.  Parto → nuevo ciclo `VACÍA`.
2.  Parto → vínculos activos.
3.  Nueva gestación mientras la madre sigue lactando.
4.  Destete de ciclo anterior después de iniciar el siguiente.
5.  Aborto mientras lacta.
6.  Machorra mientras lacta.
7.  Parto de cría muerta.
8.  Parto con todas las crías muertas.
9.  Cambio a no reproductora estando `VACÍA`.
10. Cambio a no reproductora estando `CUBIERTA`.
11. Cambio a no reproductora estando `GESTANTE`.
12. Cambio a no reproductora mientras existen vínculos.
13. Volver a reproductora mientras existen vínculos.
14. Machorra → nuevo ciclo.
15. Varias Cubriciones dentro de un mismo ciclo.
16. Confirmación sin Cubrición.
17. Evento pendiente en ciclo anterior.
18. Venta/Muerte de cría después de finalizar el vínculo.
19. Historial visible en animal actualmente no reproductor.
20. Animal sin ciclos sin historial reproductivo.

## 30. Criterios de aceptación

El refactor será aceptable cuando:

-   `LACTANTE` no sea estado del ciclo;
-   la lactación no se persista como estado;
-   pueda coexistir lactación con `VACÍA`, `CUBIERTA` y `GESTANTE`;
-   Destete no cree ni cierre ciclos;
-   Parto cree nuevo ciclo cuando corresponda;
-   Aborto cree nuevo ciclo cuando corresponda;
-   Machorra cree nuevo ciclo cuando corresponda;
-   Cierre manual por cambio de uso no cree nuevo ciclo;
-   vínculos y ciclos sean independientes;
-   eventos puedan pertenecer a ciclos anteriores;
-   `ciclo_id` represente pertenencia histórica;
-   `last_ciclo_id` represente el ciclo más reciente;
-   las validaciones temporales se realicen por historia;
-   Venta y Muerte no sean resultados reproductivos;
-   `DESCONOCIDO` no exista;
-   `TIMEOUT` no exista;
-   no existan eventos artificiales de inicio/cierre;
-   el carrusel represente un slide por ciclo;
-   el historial sea visible aunque el animal ya no sea reproductor si
    tuvo ciclos;
-   los casos de lactación solapada con ciclos posteriores funcionen
    correctamente.

## 31. Fuera de alcance

No implementar en este refactor:

-   Temporada Reproductiva;
-   planificación de temporadas;
-   TIMEOUT;
-   detección automática de discontinuidades;
-   corrección histórica general de eventos;
-   edición avanzada de fechas;
-   ReproductiveEngine;
-   QA global del dominio reproductivo;
-   implementación completa de Aborto;
-   implementación completa de Machorra;
-   nuevas capacidades no necesarias para alinear el modelo.

## 32. Orden de ejecución

``` text
1. localizar el modelo actual
        ↓
2. localizar reglas obsoletas
        ↓
3. refactorizar dominio
        ↓
4. refactorizar persistencia y RPC
        ↓
5. refactorizar proyecciones
        ↓
6. refactorizar AvailableActions
        ↓
7. refactorizar carrusel y UX
        ↓
8. ejecutar regresión
        ↓
9. verificar Cubrición / Confirmación / Parto / Destete
        ↓
10. validar el nuevo modelo
        ↓
11. retomar PRD011 — Aborto
```

## 33. Regla de oro

> **El ciclo reproductivo cuenta la historia de una oportunidad
> reproductiva.**
>
> **Los vínculos madre-cría cuentan la historia de una dependencia
> funcional.**
>
> **Ambas historias nacen relacionadas en el Parto, pero no tienen por
> qué terminar al mismo tiempo.**

La implementación debe adaptarse a esta definición. No debe deformarse
el modelo para conservar comportamientos heredados que ya han quedado
obsoletos.
