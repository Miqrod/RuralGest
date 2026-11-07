# Flujo reproductivo — Destete y finalización del ciclo

> Documento permanente de la Base de Conocimiento.
>
> Este documento describe el significado del Destete dentro del modelo ganadero y reproductivo, la gestión de la dependencia funcional madre-cría y las reglas mediante las cuales el dominio determina la continuidad o finalización de un ciclo reproductivo.
>
> El documento no trata el cierre del ciclo como un evento independiente. El cierre es una consecuencia derivada del estado de los vínculos funcionales existentes después de procesar los hechos registrados.
>
> El objetivo es que este documento pueda ser entendido tanto por una persona que conozca la aplicación como por una persona técnica que necesite implementar correctamente el comportamiento del dominio.

---

# 1. Propósito

El Destete representa el hecho mediante el cual una cría deja de depender funcionalmente de su madre.

En el sistema, esta acción no debe interpretarse simplemente como:

> "La madre ha sido destetada."

La realidad que el modelo necesita representar es más precisa:

> "Una o varias crías que dependían funcionalmente de la madre han dejado de depender de ella."

Esta diferencia es fundamental porque una madre puede tener:

* una sola cría;
* varias crías;
* crías destetadas en fechas diferentes;
* crías que mueren antes del Destete;
* crías que son vendidas antes del Destete.

Por tanto, el Destete se aplica individualmente sobre las crías aunque la acción de negocio se inicie desde la ficha de la madre.

---

# 2. Principio fundamental

El principio central del flujo es:

> **El ciclo histórico que contiene un Parto puede permanecer abierto mientras existan dependencias funcionales activas originadas por ese nacimiento.**

El Destete es uno de los hechos que puede finalizar una de esas dependencias.

La continuidad de cada ciclo histórico debe evaluarse exclusivamente a partir de las dependencias y de los hechos que pertenecen a su propia historia.

```text
Ciclo histórico que contiene PARTO
                 │
                 ▼
      ¿Quedan dependencias activas
       originadas por ese Parto?
             /             \
           SÍ               NO
           │                 │
           ▼                 ▼
    ciclo histórico     puede finalizar
      continúa          históricamente
```

Esta regla no significa que la madre carezca de otro ciclo reproductivo actual.

Si la madre continúa siendo `REPRODUCTORA`, puede coexistir un ciclo actual en estado `VACÍA`, `CUBIERTA` o `GESTANTE` con uno o varios ciclos históricos que permanezcan abiertos por dependencias pendientes.

Por tanto, deben distinguirse:

- **Dependencia funcional:** relación activa entre una madre y una cría.
- **Ciclo histórico:** contexto reproductivo al que pertenece el Parto que originó esa cría.
- **Ciclo actual:** ciclo que representa la situación reproductiva actual de la madre.

El Destete finaliza el vínculo de la cría afectada. No crea un ciclo nuevo ni modifica automáticamente el estado reproductivo actual de la madre.

---

# 3. Por qué no debemos decir "el Destete cierra el ciclo"

La formulación:

```text
Destete → cerrar ciclo
```

es demasiado simple.

Funciona aparentemente bien cuando existe una única cría:

```text
Madre
└── Cría A
      ↓
    Destete
      ↓
0 dependencias activas originadas
por el Parto correspondiente
      ↓
Evaluar las demás condiciones
de cierre del ciclo histórico
      ↓
¿Puede finalizar?
    /       \
  SÍ         NO
  │           │
  ▼           ▼
Cierre      Permanece
derivado    abierto
```

Pero deja de funcionar cuando existen varias crías:

```text
Madre
├── Cría A
├── Cría B
└── Cría C
```

Si se desteta únicamente A:

```text
Madre
├── Cría A → FINALIZADO
├── Cría B → ACTIVO
└── Cría C → ACTIVO
```

el ciclo debe continuar.

Por tanto:

```text
Destete individual
       ≠
finalización del ciclo
```

La regla correcta es:

```text
Finalización individual del vínculo
             ↓
 Identificar el ciclo histórico de origen
             ↓
Evaluar las dependencias de ese ciclo
             ↓
¿Quedan dependencias activas
originadas por ese Parto?
         /          \
       SÍ            NO
       │              │
       ▼              ▼
Ciclo histórico   Evaluar las demás
permanece abierto condiciones de cierre
                       │
                       ▼
              ¿Puede finalizar?
                  /       \
                SÍ         NO
                │           │
                ▼           ▼
        Cierre derivado   Permanece abierto
```

---

# 4. Conceptos fundamentales

El flujo utiliza varios conceptos que deben permanecer diferenciados.

| Concepto                 | Significado                                                                      |
| ------------------------ | -------------------------------------------------------------------------------- |
| `madre_id`               | Relación genealógica permanente                                                  |
| `estado_vinculo_materno` | Estado derivado de la dependencia funcional                                      |
| `CRÍA`                   | Tipo productivo correspondiente a la etapa de dependencia                        |
| `RECRÍA`                 | Tipo productivo posterior al Destete                                             |
| Destete                  | Hecho que finaliza la dependencia funcional de una cría                          |
| Ciclo reproductivo       | Unidad que agrupa la historia reproductiva de la madre                           |
| Cierre del ciclo         | Consecuencia derivada de la evaluación de las dependencias y demás condiciones de cierre del ciclo histórico correspondiente |
| Historial de eventos     | Registro puro de hechos ocurridos                                                |
| Historial reproductivo   | Proyección agregada que interpreta la evolución del ciclo                        |

La separación fundamental es:

```text
madre_id
   ↓
genealogía

estado_vinculo_materno
   ↓
dependencia funcional

tipo_productivo
   ↓
clasificación productiva

ciclo_reproductivo
   ↓
contexto de la historia reproductiva
```

---

# 5. El vínculo madre-cría

El vínculo funcional se establece cuando nace una cría viva vinculada a una madre.

En ese momento:

```text
madre_id = madre conocida
estado_vinculo_materno = ACTIVO
tipo_productivo = CRÍA
estado_vital = VIVO
```

El vínculo no constituye una entidad independiente.

Forma parte del conocimiento derivado del `Animal`.

```text
ANIMAL
├── madre_id
├── tipo_productivo
├── estado_vital
└── estado_vinculo_materno
```

No existe una tabla independiente:

```text
VINCULO_MADRE_CRIA
```

ni debe crearse únicamente para representar esta relación.

---

# 6. Genealogía frente a dependencia

La genealogía y la dependencia tienen naturalezas diferentes.

## Genealogía

`madre_id` responde:

> ¿Quién es la madre de este animal?

Es permanente.

## Dependencia

`estado_vinculo_materno` responde:

> ¿Sigue existiendo una dependencia funcional entre este animal y su madre?

Es temporal.

Por tanto:

```text
PARTO
  ↓
madre_id = M
vínculo = ACTIVO
  ↓
DESTETE
  ↓
madre_id = M
vínculo = FINALIZADO
```

La relación genealógica nunca desaparece como consecuencia del Destete.

---

# 7. Estados del vínculo

`estado_vinculo_materno` puede tener tres valores:

| Valor        | Significado                                                                           |
| ------------ | ------------------------------------------------------------------------------------- |
| `NULL`       | El sistema no dispone de conocimiento suficiente para determinar un vínculo funcional |
| `ACTIVO`     | Existe una dependencia funcional conocida                                             |
| `FINALIZADO` | El sistema conoce que la dependencia funcional ha terminado                           |

Este campo es:

* derivado;
* técnico;
* no editable;
* no visible directamente para el usuario.

La interfaz no debe pedir al ganadero que indique manualmente si el vínculo está activo.

El sistema lo determina a partir de los hechos registrados.

Aclaración: 
- FINALIZADO indica que no existe una dependencia funcional madre-cría vigente. No implica necesariamente que el vínculo haya estado previamente activo. En el caso de un nacimiento muerto, el vínculo se registra directamente como FINALIZADO, ya que el sistema conoce que nunca llegó a existir una dependencia funcional.
- por tanto, un nacido muerto queda directamente fuera del estado ACTIVO.
- de esta manera, NULL queda reservado para verdadera ausencia de conocimiento histórico.

---

# 8. Qué animales participan en la regla de continuidad

No todas las relaciones genealógicas deben ser comprobadas continuamente.

Para determinar si existe una dependencia funcional relevante para el ciclo de la madre se consideran las crías que cumplen simultáneamente:

```text
tipo_productivo = CRÍA
estado_vital = VIVO
estado_vinculo_materno = ACTIVO
```

Por tanto:

```text
CRÍA + VIVO + ACTIVO
```

representa una dependencia funcional relevante para la continuidad del ciclo.

La combinación anterior identifica las dependencias funcionales que pueden mantener abierto el ciclo histórico del Parto que originó a la cría.

Para evaluar un ciclo concreto, no basta con contar las crías activas de la madre. Es necesario determinar qué crías y dependencias pertenecen históricamente a ese ciclo.

La relación entre la cría y el ciclo de origen se obtiene a partir del Parto que la originó. El Destete debe atribuirse a ese mismo ciclo histórico, aunque la madre tenga otro ciclo reproductivo actual.

---

# 9. Qué animales NO mantienen abierto el ciclo

La regla de continuidad no se aplica a cualquier animal que tenga o haya tenido una madre.

Solo mantienen abierto el ciclo las crías que continúan representando una **dependencia funcional activa**.

Por tanto, no mantienen abierto el ciclo:

### Cría destetada

El Destete implica necesariamente la finalización del vínculo materno y la transición de la cría a `RECRÍA`.

Por tanto, estas dos condiciones forman parte de una misma transición:

```text
CRÍA
+
VÍNCULO ACTIVO
        │
        │ DESTETE
        ▼
RECRÍA
+
VÍNCULO FINALIZADO
```

Una vez producida esta transición, el animal deja de participar en la comprobación de continuidad del ciclo de su madre.

No debe tratarse "cría destetada" y "recría" como situaciones diferentes: **una cría destetada es, por definición dentro del modelo, una cría que ha pasado a `RECRÍA` y cuyo vínculo materno ha finalizado.**

---

### Cría vendida antes del Destete

Si una cría es vendida mientras todavía mantiene un vínculo activo:

```text
CRÍA
+
VIVO
+
ACTIVO
        │
        │ VENTA
        ▼
CRÍA
+
VENDIDA
+
FINALIZADO
```

el vínculo deja de existir funcionalmente.

El animal puede seguir siendo `CRÍA` porque no ha pasado por el Destete, pero ya no participa en la continuidad del ciclo.

---

### Cría muerta antes del Destete

Si una cría muere mientras todavía mantiene un vínculo activo:

```text
CRÍA
+
VIVO
+
ACTIVO
        │
        │ MUERTE
        ▼
CRÍA
+
MUERTA
+
FINALIZADO
```

también deja de existir la dependencia funcional.

El animal puede seguir conservando `tipo_productivo = CRÍA`, pero su vínculo ya no está activo.

---

### Nacido muerto

Un animal nacido muerto nunca llega a establecer una dependencia funcional activa.

Por tanto:

```text
nacimiento muerto
       ↓
Animal
       ↓
estado_vital = MUERTO
tipo_productivo = NULL
estado_vinculo_materno = FINALIZADO
       ↓
sin vínculo materno activo
```

No participa en la continuidad del ciclo.

---

### Regla resumida

La condición relevante para mantener abierto el ciclo es exclusivamente:

```text
tipo_productivo = CRÍA
AND
estado_vital = VIVO
AND
estado_vinculo_materno = ACTIVO
```

Todo animal que deje de cumplir esta combinación deja de ser relevante para la continuidad del ciclo reproductivo de la madre.

Esto permite distinguir claramente dos situaciones:

```text
CRÍA + VIVO + ACTIVO
        ↓
mantiene abierto el ciclo
```

frente a:

```text
CRÍA + VIVO + FINALIZADO
CRÍA + MUERTO + FINALIZADO
CRÍA + VENDIDO + FINALIZADO
RECRÍA + VIVO + FINALIZADO
        ↓
no mantienen abierto el ciclo
```

Que una cría deje de mantener una dependencia activa no significa que todos los ciclos de su madre puedan finalizar.

La consecuencia afecta al ciclo histórico al que pertenece la dependencia. La continuidad de los demás ciclos se evalúa de forma independiente.

---

# 10. Regla central de continuidad

Para determinar si una dependencia mantiene abierto un ciclo histórico, se consideran las crías que cumplen simultáneamente:

```text
tipo_productivo = CRÍA
AND estado_vital = VIVO
AND estado_vinculo_materno = ACTIVO
```

Además, la dependencia debe estar originada por el Parto que pertenece al ciclo evaluado.

Por tanto:

```text
ciclo histórico continúa
    si existe al menos una dependencia activa
    originada por el Parto de ese ciclo
```

Cuando ya no quedan dependencias activas originadas por ese Parto, el ciclo histórico puede finalizar si no quedan otros hechos pendientes que deban registrarse en él.

Esta regla no modifica automáticamente el ciclo reproductivo actual de la madre ni implica crear otro ciclo.

---

# 11. Diagrama completo del modelo

Este esquema resume la relación entre el modelo ganadero, el contexto reproductivo y la decisión sobre el ciclo:

```text
             PARTO DE ORIGEN
                    │
                    ▼
           CICLO HISTÓRICO
                    │
                    ▼
       Dependencias madre-cría
                    │
                    ▼
        ¿Quedan dependencias
        activas de ese Parto?
             │             │
            SÍ             NO
             │              │
             ▼              ▼
       Ciclo histórico   Evaluar si quedan
         continúa        otros hechos pendientes
                              │
                              ▼
                     Puede finalizar el
                     ciclo histórico


       CICLO REPRODUCTIVO ACTUAL
                    │
                    ▼
         VACÍA / CUBIERTA /
              GESTANTE
```

El diagrama representa dos dimensiones independientes:

- El ciclo histórico conserva el Parto y los acontecimientos posteriores que le pertenecen.
- El ciclo actual representa la situación reproductiva vigente de la madre.

La finalización de un ciclo histórico por desaparición de sus dependencias no implica crear un nuevo ciclo actual ni modificar el estado reproductivo de la madre.

---

# 12. Acción de negocio: Registrar Destete

Desde el punto de vista del usuario, la acción se inicia desde la ficha de la madre.

```text
Ficha de la madre
       ↓
Registrar Destete
       ↓
seleccionar crías
       ↓
confirmar
```

El usuario trabaja con la madre porque es el contexto natural de la operación.

Sin embargo, el dominio debe procesar cada cría afectada individualmente.

Esta separación es importante:

```text
                    USUARIO
                       │
                       ▼
             madre como contexto
                       │
                       ▼
                Registrar Destete
                       │
                       ▼
              crías seleccionadas
                       │
                       ▼
                  DOMINIO
                       │
              ┌────────┼────────┐
              ▼        ▼        ▼
            cría A   cría B   cría C
```

---

# 13. Destete individual

Cada cría destetada constituye una modificación individual del vínculo.

Para cada cría:

```text
estado_vinculo_materno:
ACTIVO → FINALIZADO
```

y:

```text
tipo_productivo:
CRÍA → RECRÍA
```

La transición debe producirse conjuntamente.

No debe existir un estado persistente en el que una cría ya esté funcionalmente destetada pero continúe clasificada como `CRÍA`.

---

# 14. Atomicidad del Destete

El registro de un Destete es una operación compuesta que afecta como mínimo a dos perspectivas del mismo hecho:

* la cría que deja de depender de su madre;
* la madre desde cuya explotación o ficha se ha registrado la operación.

Por tanto, **cada Destete individual debe quedar registrado en la historia de la cría y en la historia de la madre**.

Esto es importante incluso cuando una misma operación afecta a varias crías.

Por ejemplo:

```text
Registrar Destete desde la ficha de la madre
                    │
          ┌─────────┴─────────┐
          │                   │
        Cría A              Cría B
          │                   │
          ▼                   ▼
      evento DESTETE      evento DESTETE
          │                   │
          └─────────┬─────────┘
                    │
                    ▼
             historial madre
          ├── Destete → Cría A
          └── Destete → Cría B
```

Cada cría conserva su propio hecho de Destete y la madre conserva la trazabilidad de los Destetes realizados sobre sus crías.

El evento debe identificar inequívocamente la cría afectada para que el historial de la madre pueda responder:

> ¿Qué cría fue destetada?

---

## 14.1 Consecuencias sobre la cría

Para cada cría seleccionada:

```text
CRÍA
+
VIVO
+
VÍNCULO ACTIVO
        │
        │ DESTETE
        ▼
RECRÍA
+
VIVO
+
VÍNCULO FINALIZADO
```

La transición del vínculo y el cambio de tipo productivo forman parte de la misma operación de negocio.

---

## 14.2 Consecuencias sobre la madre

La madre debe recibir también la representación del mismo hecho en su historial.

No se trata de crear un "destete de la madre" diferente del Destete de la cría.

Existe **un único hecho de negocio**, pero debe poder ser consultado desde ambas entidades:

```text
                    DESTETE
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
           MADRE                CRÍA
             │                   │
             ▼                   ▼
       historial madre      historial cría
       + crotal cría       + referencia madre
```

La representación en la madre debe conservar la identificación de la cría afectada.

Esto resulta especialmente importante cuando una madre tiene varias crías y los Destetes se producen en fechas diferentes.

---

## 14.3 Destete múltiple

Si una misma operación afecta a varias crías:

```text
Registrar Destete
       │
       ├── Cría A
       ├── Cría B
       └── Cría C
```

cada cría debe procesarse individualmente.

Por tanto, conceptualmente existen tres hechos individuales:

```text
Madre ← Destete → Cría A
Madre ← Destete → Cría B
Madre ← Destete → Cría C
```

aunque puedan haber sido registrados en una única acción de usuario y compartan fecha u otros datos comunes.

La historia de la madre debe conservar la trazabilidad individual:

```text
Destete → Cría A
Destete → Cría B
Destete → Cría C
```

No debe reducirse la operación a un único registro genérico:

```text
Destete → 3 crías
```

si ello impide identificar individualmente qué animal fue afectado.

---

## 14.4 Atomicidad de toda la operación

La persistencia debe garantizar que las consecuencias esenciales del Destete se produzcan conjuntamente.

Conceptualmente:

```text
BEGIN TRANSACTION
        │
        ├── registrar hecho de Destete para Cría A
        │
        ├── registrar su representación en Madre
        │
        ├── finalizar vínculo de Cría A
        │
        ├── cambiar CRÍA → RECRÍA
        │
        ├── repetir para cada cría seleccionada
        │
        ├── evaluar vínculos maternos restantes
        │
        ├── determinar continuidad o finalización del ciclo
        │
        ├── preservar el ciclo reproductivo actual de la madre
        │
        └── persistir los cambios y proyecciones correspondientes

COMMIT
```

No debe ser posible finalizar correctamente una operación dejando, por ejemplo:

```text
Cría:
    RECRÍA + vínculo finalizado

pero

Madre:
    sin evento de Destete
```

ni:

```text
Madre:
    evento de Destete registrado

pero

Cría:
    CRÍA + vínculo activo
```

La operación debe conservar la coherencia entre:

* hecho registrado;
* madre;
* cría;
* vínculo;
* tipo productivo;
* continuidad del ciclo.

---

## 14.5 La madre es el contexto de la acción, no necesariamente el sujeto único

La interfaz inicia la acción desde la madre porque es el contexto natural para el usuario:

```text
Ficha de la madre
        ↓
Registrar Destete
        ↓
seleccionar crías
```

Pero el dominio debe tratar cada cría como una entidad afectada individualmente.

Por tanto:

```text
CONTEXTO DE USUARIO
        ↓
      MADRE
        ↓
  acción de negocio
        ↓
      CRÍAS
        ↓
consecuencias individuales
        ↓
evaluación del ciclo de la madre
```

Esta distinción permite mantener simultáneamente:

* una UX sencilla y natural;
* trazabilidad individual;
* historial completo en madre y cría;
* reglas de dominio centralizadas.

---

# 15. Destete parcial

El Destete puede afectar únicamente a una parte de las crías vinculadas.

Ejemplo:

```text
Madre
├── Cría A → ACTIVO
├── Cría B → ACTIVO
└── Cría C → ACTIVO
```

El usuario selecciona:

```text
Cría A
```

Después:

```text
Madre
├── Cría A → FINALIZADO / RECRÍA
├── Cría B → ACTIVO / CRÍA
└── Cría C → ACTIVO / CRÍA
```

El ciclo continúa.

---

# 16. Destete de varias crías

La misma operación puede afectar a varias crías.

Cuando se seleccionan todas las crías elegibles para Destete, el dominio procesa individualmente cada cría y finaliza sus dependencias funcionales.

Por ejemplo:

```text
Madre
├── Cría A → ACTIVO
├── Cría B → ACTIVO
└── Cría C → ACTIVO
```

El usuario selecciona:

```text
Cría A
Cría B
```

Resultado:

```text
Madre
├── Cría A → FINALIZADO / RECRÍA
├── Cría B → FINALIZADO / RECRÍA
└── Cría C → ACTIVO / CRÍA
```

El ciclo continúa porque queda un vínculo activo.

---

# 17. Destete total

Cuando se seleccionan todas las crías elegibles para Destete, el dominio procesa individualmente cada cría y finaliza sus dependencias funcionales.

```text
Madre
├── Cría A → FINALIZADO / RECRÍA
├── Cría B → FINALIZADO / RECRÍA
└── Cría C → FINALIZADO / RECRÍA
```

Después de procesar todas las crías seleccionadas, se evalúan exclusivamente las dependencias funcionales originadas por el Parto del ciclo histórico afectado.

```text
¿Queda alguna dependencia funcional activa
originada por ese Parto?
```

Si la respuesta es afirmativa, el ciclo histórico permanece abierto.

Si la respuesta es negativa, el dominio evalúa las demás condiciones necesarias para determinar si el ciclo histórico puede finalizar.

Esta evaluación no modifica automáticamente el ciclo reproductivo actual de la madre ni crea un nuevo ciclo.

El Destete no crea un nuevo ciclo reproductivo ni modifica automáticamente el estado reproductivo actual de la madre.

---

# 18. Destete de la última cría

El caso más habitual será probablemente una madre con una sola cría.

```text
Madre
└── Cría A
      │
      ├── tipo_productivo = CRÍA
      ├── estado_vital = VIVO
      └── estado_vinculo_materno = ACTIVO
```

Se registra el Destete.

Resultado:

```text
Cría A
├── tipo_productivo = RECRÍA
├── estado_vinculo_materno = FINALIZADO
└── estado_vital = VIVO
```

Después, al ser esta la última dependencia activa originada por el Parto:

```text
0 vínculos activos
```

Por tanto:

```text
0 dependencias activas de ese Parto
                 │
                 ▼
Evaluar la finalización del
ciclo histórico correspondiente
```

La madre puede tener ya otro ciclo reproductivo actual. El Destete no debe cerrarlo ni crear un ciclo adicional.

---

# 19. El cierre del ciclo no es un evento

Este principio debe quedar especialmente claro.

No existe:

```text
EVENTO = CIERRE_CICLO
```

ni:

```text
EVENTO = INICIO_CICLO
```

El historial conserva únicamente hechos que ocurrieron realmente.

Por ejemplo:

```text
Cubrición
Confirmación de gestación
Parto
Destete
```

Después del Destete, si finalizan las dependencias originadas por un Parto, el dominio puede determinar que su ciclo histórico ha terminado.

Esta conclusión NO añade eventos artificiales al historial.

La finalización histórica es una consecuencia derivada del conjunto de hechos y dependencias conocidos.

---

# 20. Por qué no registrar el cierre

Registrar un evento de cierre de ciclo sería redundante cuando la finalización puede deducirse de los hechos registrados y de las reglas del dominio.

Por tanto:

Destete
   │
   ▼
Finalización del vínculo afectado
   │
   ▼
Evaluación de las dependencias del
ciclo histórico de origen
   │
   ▼
Posible finalización histórica

 La aplicación debe distinguir esta conclusión de la situación reproductiva actual de la madre.

Un ciclo histórico puede finalizar mientras otro ciclo de la misma madre continúa abierto.

No deben modificarse eventos históricos ni generar hechos artificiales para simplificar su representación.

---

# 21. Creación del ciclo reproductivo actual

El Destete no crea el siguiente ciclo reproductivo de la madre.

La creación de un ciclo actual se rige por las reglas generales del dominio reproductivo, no por la finalización de las dependencias madre-cría.

Si la madre continúa siendo REPRODUCTORA, el ciclo actual que corresponda puede coexistir con el ciclo histórico del Parto:

Ciclo histórico del Parto
└── PARTO
    └── dependencias pendientes
        └── DESTETE

Ciclo reproductivo actual
└── VACÍA / CUBIERTA / GESTANTE

Si ya existe un ciclo actual, el Destete no debe crear otro.

La finalización del último vínculo materno tampoco debe modificar automáticamente el estado reproductivo actual.

---

# 22. Por qué existe un ciclo reproductivo actual independiente

El ciclo actual representa la situación reproductiva de la madre, no la duración de su dependencia funcional respecto a las crías.

No pretende representar por sí mismo:

ovulación;

ciclo menstrual;

actividad hormonal;

fertilidad;

momento óptimo de inseminación;

ninguna otra realidad biológica no registrada.

Su función es representar la oportunidad reproductiva vigente conforme a los hechos registrados y las reglas del dominio.

La dependencia madre-cría tiene su propia evolución y puede prolongarse durante uno o varios ciclos reproductivos posteriores de la madre.

---

# 23. Estado `VACÍA`

Cuando las reglas generales del dominio determinan la creación de un ciclo reproductivo actual, este comienza en el estado que corresponda según dichas reglas. Cuando procede iniciar un ciclo vacío:

```text
estado_reproductivo = VACÍA
```

VACÍA representa el estado reproductivo de un ciclo actual cuando no existe una gestación conocida ni una cubrición vigente que determine otro estado.

No significa que no existan crías dependientes de la madre.

Por tanto, es válido que coexistan:

* estado_reproductivo = VACÍA 
y:
* existen dependencias madre-cría activas

También es válido que el ciclo histórico de un Parto anterior permanezca abierto mientras la madre se encuentra en CUBIERTA o GESTANTE dentro de otro ciclo.

La lactación no se representa mediante un estado reproductivo independiente.

---

# 24. Si la madre deja de ser reproductora

La finalización de las dependencias madre-cría no determina por sí misma la clasificación productiva de la madre.

Si la madre deja de ser REPRODUCTORA, no se crea un nuevo ciclo reproductivo actual por esa circunstancia mientras no vuelva a cumplirse la condición general de elegibilidad.

Esta regla no modifica la historia de los ciclos anteriores.

Un ciclo histórico del Parto puede finalizar al desaparecer sus dependencias, independientemente de que la madre siga siendo reproductora.

La venta o muerte de la madre, además, debe gestionarse conforme a sus propios hechos y reglas de dominio. No debe confundirse con el Destete de las crías.

---

# 25. Venta o muerte de una cría antes del Destete

La dependencia funcional también puede terminar sin que exista un Destete.

Por ejemplo:

```text
Madre
├── Cría A → ACTIVO
└── Cría B → ACTIVO
```

Si Cría A muere antes del Destete:

```text
Cría A
├── estado_vital = MUERTO
└── estado_vinculo_materno = FINALIZADO
```

Cría B continúa:

```text
Cría B
├── estado_vital = VIVO
├── tipo_productivo = CRÍA
└── estado_vinculo_materno = ACTIVO
```

Por tanto:

```text
1 vínculo activo
↓
ciclo continúa
```

La muerte de A no se interpreta como Destete de B.

---

# 26. Muerte de la última cría vinculada

Si la madre tiene una única cría:

```text
Madre
└── Cría A → ACTIVO
```

y la cría muere:

```text
Cría A
├── MUERTA
└── FINALIZADO
```

entonces:

0 dependencias activas originadas
por el Parto correspondiente
          ↓
Evaluar las demás condiciones
de cierre del ciclo histórico
          ↓
     ¿Puede finalizar?
        /         \
      SÍ           NO
      │             │
      ▼             ▼
Cierre derivado  Permanece abierto

Esto no convierte la Muerte en un Destete.

El hecho registrado continúa siendo:

```text
MUERTE
```

y el historial debe reflejarlo como tal.

---

# 27. Venta de una cría antes del Destete

La misma lógica se aplica a una Venta.

Si:

```text
Cría A
CRÍA + VIVO + ACTIVO
```

es vendida:

```text
Cría A
CRÍA + VENDIDA + FINALIZADO
```

el vínculo deja de existir funcionalmente.

La Venta no se transforma en Destete.

El historial conserva:

```text
VENTA
```

como hecho real.

---

# 28. Venta o muerte de una cría después del Destete

Este caso es especialmente importante.

Si una cría ya ha sido destetada:

```text
CRÍA
↓
DESTETE
↓
RECRÍA
+
VÍNCULO FINALIZADO
```

posteriormente puede ser:

* vendida;
* muerta;
* trasladada;
* utilizada en otro contexto productivo.

Estos hechos ya no afectan al ciclo reproductivo de la madre.

Por tanto:

```text
RECRÍA
+
VÍNCULO FINALIZADO
+
VENTA
```

no genera ninguna consecuencia reproductiva sobre la madre.

Lo mismo ocurre con:

```text
RECRÍA
+
VÍNCULO FINALIZADO
+
MUERTE
```

Esta regla evita mantener dependencias innecesarias durante toda la vida del animal.

---

# 29. La regla de "solo CRÍA" evita comprobaciones innecesarias

Una vez que una cría pasa a:

```text
RECRÍA
```

el sistema ya no necesita comprobar cada evento futuro de ese animal para determinar si afecta al ciclo de la madre.

La comprobación queda conceptualmente limitada a:

```text
tipo_productivo = CRÍA
AND
estado_vital = VIVO
AND
estado_vinculo_materno = ACTIVO
```

Esto reduce:

* complejidad;
* consultas;
* acoplamiento;
* posibilidades de errores;
* propagación innecesaria de acontecimientos entre animales.

---

# 30. Venta o muerte de la madre

La madre también puede desaparecer antes de que finalicen todos sus vínculos.

Por ejemplo:

```text
Madre
├── Cría A → ACTIVO
├── Cría B → ACTIVO
└── Cría C → ACTIVO
```

Si la madre muere o es vendida:

```text
Madre
   ↓
VENTA / MUERTE
   ↓
finalizan los vínculos funcionales activos
```

La genealogía de las crías no se modifica.

Los animales siguen conservando:

```text
madre_id
```

pero ya no existe una dependencia funcional vigente.

La consecuencia sobre el ciclo de la madre se determina en función de su propia salida y de las reglas del dominio.

---

# 31. Historial de eventos: mantenerlo puro

El historial de eventos debe representar únicamente los hechos realmente registrados.

Para una madre podría aparecer:

```text
Cubrición
Confirmación de gestación
Parto
Destete
```

Para una cría:

```text
Nacimiento / Parto
Destete
```

Y posteriormente:

```text
Venta
```

o:

```text
Muerte
```

si corresponde.

No debemos generar artificialmente:

```text
Fin del vínculo
Cierre del ciclo
Inicio del nuevo ciclo
```

Estos conceptos pertenecen a estados y proyecciones.

---

# 32. El Destete aparece en madre y cría

Aunque la acción se inicia desde la madre, el hecho debe poder trazarse desde ambas perspectivas.

Esto permite que:

```text
Ficha madre
```

muestre que se produjo un Destete sobre una determinada cría.

Y que:

```text
Ficha cría
```

muestre que fue destetada.

Conceptualmente:

```text
                 DESTETE
                    │
             ┌──────┴──────┐
             │             │
             ▼             ▼
           MADRE          CRÍA
             │             │
             ▼             ▼
        hecho registrado  hecho registrado
```

No significa que debamos crear dos hechos independientes.

El sistema debe mantener la correspondencia entre ambas representaciones del mismo hecho de negocio.

---

# 33. Un Destete con varias crías

Cuando una misma operación desteta varias crías:

```text
Registrar Destete
       │
       ├── Cría A
       ├── Cría B
       └── Cría C
```

la trazabilidad debe conservar la correspondencia individual.

Debe poder responderse:

> ¿Qué crías fueron destetadas en esta operación?

y:

> ¿Cuándo fue destetada esta cría?

El dominio no debe reducir la operación a:

```text
Madre → Destete
```

sin conservar las crías afectadas.

---

# 34. Una fecha común no implica una única cría

Varias crías pueden ser destetadas el mismo día.

Eso no significa que deban convertirse en una única entidad lógica.

El modelo conserva:

```text
Cría A → Destete → fecha X
Cría B → Destete → fecha X
Cría C → Destete → fecha X
```

Cada animal mantiene su propia historia.

---

# 35. Fechas diferentes

También pueden existir:

```text
Cría A → Destete → 01/05
Cría B → Destete → 15/05
Cría C → Destete → 28/05
```

La posibilidad de finalizar el ciclo histórico no se determina por el primer Destete ni depende exclusivamente de la desaparición del último vínculo relevante. Debe evaluarse cuando dejan de existir dependencias funcionales activas originadas por el Parto correspondiente, teniendo en cuenta las demás condiciones de cierre definidas por el dominio.

En este caso, el ciclo histórico que contiene el Parto permanece abierto mientras la cría C mantenga una dependencia funcional activa originada por ese Parto.

Si C es la última cría con esa dependencia activa, su Destete puede permitir la finalización del ciclo histórico correspondiente.

La fecha del primer Destete no determina la finalización del ciclo histórico si todavía quedan dependencias activas originadas por el mismo Parto.

La evaluación se realiza sobre las dependencias del ciclo de origen, no sobre el conjunto indiscriminado de crías de la madre.

---

# 36. Lectura correcta de un ciclo con varias crías

Supongamos:

```text
Ciclo 4

Parto
├── Cría A
├── Cría B
└── Cría C
```

Evolución:

```text
Cría A → Destete
Cría B → Muerte
Cría C → Destete
```

La historia de cada vínculo aporta información diferente.

El ciclo histórico que contiene el Parto puede finalizar cuando C deja de mantener una dependencia funcional activa originada por ese Parto y no quedan otras dependencias pendientes que deban mantener abierto ese ciclo.

La historia completa debe conservar los distintos desenlaces de las crías. El resultado histórico no debe reducirse a un único motivo que oculte las muertes, ventas o Destetes que se hayan producido.

La historia completa es:

```text
3 crías nacidas
├── 1 destetada
├── 1 fallecida antes del destete
└── 1 destetada
```

La finalización de este ciclo histórico no implica que haya finalizado el ciclo reproductivo actual de la madre.

---

# 37. Valor analítico de los vínculos

El modelo de dependencia permite conservar información que se perdería si el ciclo tuviera únicamente un motivo de cierre.

Por ejemplo:

```text
Ciclo A
├── 1 cría
└── Destete
```

y:

```text
Ciclo B
├── 3 crías
├── 1 muerte
├── 1 venta
└── 1 Destete
```

Ambos podrían terminar con:

```text
0 vínculos activos
```

pero su historia reproductiva es muy diferente.

El modelo debe conservar esa diferencia.

---

# 38. El carrusel cuenta la historia agregada

El historial puro de eventos permanece intacto.

La interpretación de la historia completa corresponde al carrusel del ciclo.

Por tanto:

```text
EVENTOS
  ↓
hechos individuales
  ↓
proyección reproductiva
  ↓
carrusel
  ↓
historia agregada del ciclo
```

El carrusel podrá mostrar:

```text
Ciclo 4

Parto
3 crías

Cría A
✓ Destetada

Cría B
✕ Fallecida antes del destete

Cría C
✓ Destetada

Ciclo finalizado
```

El texto exacto y el diseño visual pertenecen a la capa de presentación.

La información necesaria debe proceder del modelo y de los eventos.

---

# 39. El resultado del ciclo no sustituye a la historia de las crías

El campo `resultado` del ciclo reproductivo y la historia de las dependencias madre-cría representan información diferente.

El resultado del ciclo conserva el desenlace reproductivo definido por las reglas del dominio. La historia de las crías permite conocer qué ocurrió individualmente después del Parto.

Por ejemplo:

```text
Ciclo histórico
└── PARTO
    ├── Cría A → DESTETE
    ├── Cría B → MUERTE antes del Destete
    └── Cría C → DESTETE
```

La proyección debe conservar tanto el resultado reproductivo del ciclo como los hechos individuales de las crías.

No debe sustituirse la historia por una conclusión genérica como:

```text
ciclo terminado por Destete
```

si esa frase oculta otros hechos relevantes.

El campo `resultado` no debe modificarse para simplificar la lectura analítica. Su asignación y su inmutabilidad se rigen por las reglas generales del modelo reproductivo.

La explicación agregada del ciclo se construye a partir del resultado registrado, los eventos y las dependencias que pertenecen a su historia.

---

# 40. Estado frente a evento frente a proyección

El flujo utiliza tres niveles diferentes.

## Evento

Hecho ocurrido:

```text
Parto
Destete
Venta
Muerte
```

## Estado

Situación derivada:

```text
estado_vinculo_materno
tipo_productivo
estado_vital
estado_reproductivo
```

## Proyección

Interpretación para lectura:

```text
ciclo finalizado
número de crías
evolución de las crías
historia reproductiva
```

La separación puede resumirse:

```text
               EVENTO
                  │
                  ▼
                REGLAS
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
      ESTADO             PROYECCIÓN
        │                   │
        ▼                   ▼
  situación actual    historia agregada
```

---

# 41. Qué es el cierre del ciclo

El cierre del ciclo es una **conclusión del dominio**.

No es:

* un hecho introducido por el usuario;
* una acción independiente;
* un evento;
* una entidad;
* una decisión manual.

El cierre de un ciclo histórico requiere evaluar las dependencias funcionales y las demás condiciones de cierre que correspondan a ese ciclo.

La evaluación debe limitarse al ciclo histórico afectado y a las dependencias originadas por el Parto que pertenece a su historia.

Por tanto:

- La ausencia de dependencias activas originadas por ese Parto permite evaluar el cierre del ciclo histórico.
- La existencia de dependencias activas de otros ciclos no impide automáticamente cerrar el ciclo histórico evaluado.
- La ausencia de dependencias activas no modifica automáticamente el estado reproductivo actual de la madre ni crea un nuevo ciclo.

El cierre es una conclusión derivada del dominio, no un hecho registrado por el usuario.

---

# 42. Momento de evaluación

La evaluación debe realizarse después de procesar un hecho que pueda afectar a un vínculo.

Ejemplos:

```text
Destete
Venta
Muerte
```

El dominio:

1. procesa el hecho;
2. actualiza el vínculo afectado;
3. actualiza las consecuencias sobre el animal;
4. evalúa los vínculos restantes;
5. evalúa las dependencias restantes del ciclo histórico afectado;
6. determina si el ciclo histórico afectado puede finalizar, sin crear automáticamente otro ciclo ni modificar el estado reproductivo actual de la madre.

No se necesita un proceso periódico para determinar el cierre.

---

# 43. El tiempo no cierra automáticamente los ciclos

El sistema no utiliza un proceso periódico ni un evento `TIMEOUT` para cerrar ciclos reproductivos.

La ausencia prolongada de acontecimientos no constituye por sí misma un hecho reproductivo ni permite concluir automáticamente que un ciclo ha finalizado.

Cuando se supera el umbral de revisión reproductiva parametrizado para la especie, el sistema puede generar una alerta o propuesta de revisión.

Esta revisión no cierra el ciclo ni modifica automáticamente el estado reproductivo del animal.

La finalización de los ciclos históricos continúa dependiendo de los hechos registrados y de las reglas funcionales del dominio.

---

# 44. Revisión reproductiva y continuidad histórica

La revisión reproductiva y la finalización histórica de un ciclo son conceptos diferentes.

La revisión permite señalar que un animal lleva más tiempo del umbral configurado sin una evolución reproductiva que requiera atención.

El umbral se obtiene de la configuración de negocio de la explotación para la especie correspondiente. No debe codificarse como una constante fija.

La revisión:

- no genera un evento reproductivo por sí misma;
- no equivale a un Aborto;
- no finaliza automáticamente un ciclo;
- no crea un nuevo ciclo;
- no sustituye el registro de los hechos reales.

La continuidad y finalización histórica de un ciclo se determinan conforme a las reglas del dominio y a los acontecimientos que realmente se han registrado.

---

# 45. Relación con el aborto

El Aborto es otra posible forma de finalizar una fase reproductiva, pero no debe confundirse con el Destete.

El Destete trabaja sobre:

```text
dependencia madre-cría
```

El Aborto trabaja sobre:

```text
gestación
```

Por tanto:

```text
Destete
    ↓
finalización de vínculos madre-cría

Aborto
    ↓
finalización de una gestación sin nacimiento viable
```

Las reglas completas del Aborto deben documentarse en un flujo específico cuando se implemente.

No deben incorporarse al flujo de Destete únicamente para resolver la necesidad general de cierre de ciclos.

---

# 46. Regla general reutilizable

El aprendizaje arquitectónico más importante del flujo es que el ciclo no debería estar acoplado a un evento concreto.

En lugar de:

```text
Destete → cerrar ciclo
```

el dominio utiliza:

```text
Hecho que puede modificar una dependencia
              ↓
        actualizar vínculo
              ↓
 identificar el ciclo histórico afectado
              ↓
 evaluar sus dependencias y condiciones
              ↓
¿Puede finalizar el ciclo histórico?
         │                 │
        SÍ                 NO
         │                  │
         ▼                  ▼
  cierre derivado    permanece abierto
```

La evaluación se limita al ciclo histórico afectado. La finalización de sus dependencias no modifica automáticamente el ciclo reproductivo actual de la madre ni crea otro ciclo.

Esta regla puede ser reutilizada por otros hechos sin modificar el concepto central del ciclo.

---

# 47. Acciones derivadas

El procesamiento del Destete puede producir consecuencias que no son eventos introducidos directamente por el usuario.

Conviene diferenciarlas.

| Tipo                        | Ejemplo                                    |
| --------------------------- | ------------------------------------------ |
| Evento                      | Destete                                    |
| Estado derivado             | Vínculo materno → `FINALIZADO`             |
| Estado derivado             | `CRÍA` → `RECRÍA`                          |
| Consecuencia de dominio     | Evaluación de las dependencias del ciclo   |
| Consecuencia de dominio     | Posible finalización del ciclo             |
| Ciclo reproductivo actual   | No cambia automáticamente por el Destete   |
| Proyección                  | Historia agregada del ciclo y de sus crías |
| Acción derivada futura      | Posible tarea o recomendación              |

Estas categorías no deben mezclarse.

El Destete modifica la dependencia funcional de la cría afectada. La finalización del ciclo histórico se determina conforme a las reglas del dominio. El ciclo reproductivo actual de la madre conserva su propia evolución.

---

# 48. Acciones derivadas y `PendingTask`

El Destete puede generar en el futuro acciones derivadas.

Por ejemplo:

```text
Destete
   ↓
Cría pasa a RECRÍA
   ↓
puede necesitar una acción operativa posterior
```

Sin embargo, este flujo no define todavía una infraestructura específica para esas acciones.

La existencia de una acción derivada no convierte dicha acción en:

* evento;
* estado;
* proyección.

La infraestructura transversal de `PendingTask` se documentará por separado.

---

# 49. Qué debe ver el usuario

El usuario no debería tener que interpretar:

```text
estado_vinculo_materno = FINALIZADO
```

ni:

```text
0 dependencias activas originadas por el Parto
```

La aplicación debe traducir esas conclusiones a lenguaje operativo.

Por ejemplo:

> "Todas las crías vinculadas a este nacimiento han dejado de depender de la madre."

Si corresponde, la interfaz puede indicar que el ciclo histórico del Parto ha finalizado.

La situación reproductiva actual de la madre debe mostrarse por separado. El Destete no implica automáticamente que la madre esté VACÍA, que esté disponible para una nueva cubrición ni que deba crearse otro ciclo.

La información presentada debe proceder del modelo y de sus proyecciones, sin inferir estados reproductivos a partir de la ausencia de dependencias madre-cría.

---

# 50. Visibilidad de la acción Registrar Destete

La acción de registrar Destete debe estar disponible mientras exista al menos una cría elegible para la operación.

Conceptualmente:

```text
¿Existe alguna cría?
       │
       ▼
tipo_productivo = CRÍA
estado_vital = VIVO
estado_vinculo_materno = ACTIVO
       │
       ├── SÍ → mostrar acción
       │
       └── NO → no mostrar acción
```

Después de destetar la última cría:

```text
0 crías elegibles
       ↓
acción deja de estar disponible
```

Esto es una consecuencia de la misma regla de conocimiento.

---

# 51. La acción se inicia desde la madre

Aunque el evento afecte individualmente a las crías, el contexto de usuario sigue siendo la madre.

Esto es importante desde el punto de vista de User First.

El ganadero piensa:

> "Voy a destetar las crías de esta vaca."

No:

> "Voy a modificar el estado de dependencia funcional de tres entidades Animal."

Por tanto:

```text
UI
↓
Madre
↓
Registrar Destete
↓
seleccionar crías
```

mientras que internamente:

```text
Dominio
↓
procesar crías individualmente
↓
evaluar conjunto
```

---

# 52. Validación de las crías seleccionadas

Una cría solo puede participar en una operación de Destete si cumple las condiciones de elegibilidad definidas por el dominio.

Como regla general:

```text
tipo_productivo = CRÍA
AND
estado_vital = VIVO
AND
estado_vinculo_materno = ACTIVO
```

Una cría:

* ya destetada;
* ya vendida;
* ya muerta;
* ya convertida en `RECRÍA`;

no debe poder seleccionarse nuevamente como Destete.

---

# 53. Idempotencia

El Destete no debe poder producir dos veces la misma transición funcional.

Por ejemplo:

```text
CRÍA + ACTIVO
      ↓
DESTETE
      ↓
RECRÍA + FINALIZADO
```

Una segunda operación sobre la misma cría no debe volver a:

```text
FINALIZADO → FINALIZADO
```

ni crear un segundo hecho de Destete que contradiga la historia.

Las reglas de idempotencia concretas pertenecen a la implementación del Use Case y a la capa transaccional.

---

# 54. Corrección de errores

Los eventos registrados no deben eliminarse para "corregir" la historia.

Si existe un error operativo real en un evento, debe aplicarse el mecanismo de ajuste definido por la arquitectura.

Esto es especialmente importante en el Destete porque puede afectar simultáneamente:

* madre;
* cría;
* vínculo;
* tipo productivo;
* ciclo.

Una corrección no debe resolverse mediante ediciones arbitrarias de snapshots.

---

# 55. Ejemplo completo: una cría

### Situación inicial

```text
Madre
├── ciclo histórico 4
│   └── PARTO
│       └── Cría A
│           ├── tipo_productivo = CRÍA
│           ├── estado_vital = VIVO
│           └── estado_vinculo_materno = ACTIVO
│
└── ciclo reproductivo actual
    └── estado_reproductivo = VACÍA
```

La coexistencia de ambos ciclos es válida: el ciclo histórico conserva el Parto y la dependencia de la cría, mientras que el ciclo actual representa la situación reproductiva vigente de la madre.

### Registrar Destete

Se registra el Destete de la cría A.

```text
Cría A
├── tipo_productivo = RECRÍA
├── estado_vital = VIVO
└── estado_vinculo_materno = FINALIZADO
```

El evento `DESTETE` se atribuye al ciclo histórico que contiene el Parto que originó a la cría.

### Evaluación

```text
Dependencias activas originadas por el Parto = 0
```

El dominio evalúa si el ciclo histórico puede finalizar conforme a sus reglas.

### Consecuencia

```text
Ciclo histórico 4
└── puede finalizar

Ciclo reproductivo actual
└── conserva su estado anterior
```

No se genera un evento artificial de cierre ni de inicio de ciclo.

El Destete no crea un ciclo reproductivo nuevo ni modifica automáticamente el estado actual de la madre.

---

# 56. Ejemplo completo: tres crías, dos destetadas

### Situación inicial

```text
Ciclo histórico 4
└── PARTO
    ├── A → CRÍA + VIVO + ACTIVO
    ├── B → CRÍA + VIVO + ACTIVO
    └── C → CRÍA + VIVO + ACTIVO
```

La madre puede tener, además, otro ciclo reproductivo actual.

### Operación

Se destetan A y B.

### Resultado

```text
A → RECRÍA + FINALIZADO
B → RECRÍA + FINALIZADO
C → CRÍA + VIVO + ACTIVO
```

### Evaluación del ciclo histórico

```text
Dependencias activas originadas por el Parto = 1
```

El ciclo histórico 4 permanece abierto porque C sigue manteniendo una dependencia funcional activa originada por ese Parto.

La madre conserva, de forma independiente, el estado de su ciclo reproductivo actual.

Cuando posteriormente finalice la dependencia de C, se volverá a evaluar el ciclo histórico 4. Esta evaluación no debe cerrar ni modificar automáticamente el ciclo actual de la madre.

---

# 57. Ejemplo completo: muerte y Destete

### Situación inicial

```text
A → CRÍA + VIVO + ACTIVO
B → CRÍA + VIVO + ACTIVO
C → CRÍA + VIVO + ACTIVO
```

B muere.

```text
B → CRÍA + MUERTO + FINALIZADO
```

Después se desteta A.

```text
A → RECRÍA + FINALIZADO
```

C continúa:

```text
C → CRÍA + VIVO + ACTIVO
```

Resultado:

```text
1 vínculo activo
↓
ciclo continúa
```

Cuando posteriormente se destete C:

```text
C → RECRÍA + FINALIZADO
```

Resultado:

```text
0 dependencias activas originadas
por el Parto correspondiente
              ↓
Evaluar las demás condiciones
de cierre del ciclo histórico
              ↓
       ¿Puede finalizar?
          /         \
        SÍ           NO
        │             │
        ▼             ▼
Cierre derivado   Permanece abierto
```

La historia completa conserva:

```text
3 crías
├── 1 muerte
└── 2 destetes
```

---

# 58. Ejemplo completo: venta antes del Destete

```text
A → CRÍA + VIVO + ACTIVO
B → CRÍA + VIVO + ACTIVO
```

A es vendida.

```text
A → CRÍA + VENDIDO + FINALIZADO
```

B continúa activa.

```text
1 vínculo activo
↓
ciclo continúa
```

Posteriormente B es destetada:

```text
B → RECRÍA + FINALIZADO
```

Ahora:

```text
0 dependencias activas originadas
por el Parto correspondiente
              ↓
Evaluar las demás condiciones
de cierre del ciclo histórico
              ↓
       ¿Puede finalizar?
          /         \
        SÍ           NO
        │             │
        ▼             ▼
Cierre derivado   Permanece abierto
```

La historia del ciclo conserva correctamente:

```text
A → Venta
B → Destete
```

y no:

```text
Ciclo → Destete
```

como único resumen.

---

# 59. Ejemplo de una lectura analítica incorrecta

No sería suficiente mostrar:

> "Ciclo finalizado por Destete."

si durante el ciclo ocurrieron:

```text
3 nacimientos
1 muerte
1 venta
1 destete
```

Ese resumen ocultaría información relevante.

La proyección debería poder mostrar:

```text
Ciclo finalizado

Descendencia:
3 crías

Evolución:
• 1 fallecida antes del Destete
• 1 vendida antes del Destete
• 1 destetada
```

El cierre del ciclo es una conclusión.

La historia de los vínculos explica cómo se llegó a esa conclusión.

---

# 60. El ciclo como contenedor de historia

El ciclo no debe entenderse como un objeto que "decide" cómo terminó.

Debe entenderse como una unidad que permite agrupar:

```text
hechos reproductivos
+
descendencia
+
evolución de vínculos
```

Por tanto:

```text
CICLO
│
├── Cubrición
├── Confirmación
├── Parto
│    ├── Cría A
│    ├── Cría B
│    └── Cría C
│
├── Destete A
├── Muerte B
└── Destete C
```

La proyección interpreta todo el conjunto.

---

# 61. Relación entre ciclo y vínculos

El ciclo no posee necesariamente una relación material independiente con cada cría.

La relación se puede reconstruir mediante:

```text
Parto
  ↓
crías creadas
  ↓
madre_id
  ↓
estado_vinculo_materno
  ↓
eventos posteriores
```

Esto evita duplicar información.

El ciclo proporciona el contexto reproductivo.

El Animal proporciona la genealogía y el estado funcional.

Los eventos proporcionan los hechos.

La proyección los combina.

---

# 62. Patrón arquitectónico

El flujo puede resumirse mediante:

                    EVENTO
                      │
                      ▼
             CONTEXTO REPRODUCTIVO
                      │
                      ▼
               REGLAS DEL DOMINIO
                      │
                      ▼
             ACTUALIZAR DEPENDENCIA
                      │
                      ▼
        IDENTIFICAR EL CICLO HISTÓRICO
               DE ORIGEN
                      │
                      ▼
         EVALUAR SUS DEPENDENCIAS
           Y CONDICIONES DE CIERRE
                      │
                      ▼
            ¿PUEDE FINALIZAR?
                │          │
               SÍ          NO
                │           │
                ▼           ▼
         CIERRE DERIVADO   CONTINÚA
                │
                ▼
      CONSERVAR INDEPENDIENTE
       EL CICLO ACTUAL DE LA MADRE

El patrón es reutilizable porque no depende exclusivamente del evento Destete.

---

# 63. Qué pertenece al Use Case

El Use Case `RegistrarDestete` debe encargarse de orquestar la operación y garantizar que todas sus consecuencias se persistan de forma atómica.

Conceptualmente:

```text
RegistrarDestete
│
├── construir contexto
├── validar crías seleccionadas
├── resolver el ciclo histórico de cada cría
├── registrar los eventos DESTETE
├── finalizar los vínculos correspondientes
├── actualizar el tipo productivo de las crías
├── evaluar la continuidad de cada ciclo histórico afectado
├── cerrar los ciclos históricos que cumplan las condiciones de cierre
└── persistir todos los cambios atómicamente
```

El ciclo histórico de cada cría debe resolverse a partir de su Parto de origen:

```text
cria.parto_evento_id
        ↓
eventos.ciclo_id
        ↓
ciclo histórico al que pertenece el DESTETE
```

La evaluación de continuidad debe realizarse después de procesar todas las crías incluidas en la operación, para que el resultado tenga en cuenta el conjunto completo de cambios.

El cierre de un ciclo histórico solo podrá producirse cuando se cumplan las condiciones de cierre definidas por el dominio. En particular, no debe cerrarse un ciclo que todavía tenga dependencias funcionales activas originadas en su Parto.

El Use Case no debe crear automáticamente otro ciclo ni modificar el estado reproductivo actual de la madre como consecuencia del Destete.

Las decisiones de negocio no deben quedar codificadas directamente dentro del Use Case.

El Use Case orquesta.

Las reglas deciden.

---

# 64. Qué pertenece a las Rules

Las Rules deben centralizar las decisiones de negocio relacionadas con el Destete y la continuidad de los ciclos históricos.

Deben poder responder preguntas como:

> ¿Esta cría puede ser destetada?

> ¿Qué ciclo histórico corresponde a la cría seleccionada?

> ¿Debe finalizar su vínculo materno como consecuencia del Destete?

> ¿Qué dependencias funcionales activas siguen asociadas al ciclo histórico de origen?

> ¿Puede finalizar el ciclo histórico afectado?

> ¿Se cumplen todas las condiciones necesarias para determinar y aplicar el cierre derivado de ese ciclo histórico?

Estas preguntas deben resolverse teniendo en cuenta que una misma madre puede tener varios ciclos abiertos simultáneamente. El ciclo histórico del Parto y el ciclo reproductivo actual de la madre son conceptos distintos.

Por tanto, las Rules no deben identificar automáticamente el ciclo afectado con el ciclo reproductivo actual de la madre.

Tampoco deben inferir, a partir de la finalización de las dependencias maternas, que la madre deba pasar a `VACÍA` o que deba crearse un nuevo ciclo.

La elegibilidad reproductiva y el inicio de un nuevo ciclo pertenecen a sus propias reglas de dominio, no son consecuencias automáticas del Destete.

Estas decisiones no deben resolverse mediante condicionales dispersos por:

* formularios;
* componentes;
* RPC independientes que dupliquen las reglas;
* consultas de UI.

La lógica de dominio debe permanecer centralizada y ser coherente con el modelo reproductivo canónico.

---

# 65. Qué pertenece a Projection

La Projection debe convertir los hechos, estados y vínculos del dominio en información útil para la lectura del historial reproductivo.

Debe distinguir entre el ciclo histórico que contiene el Parto y el ciclo reproductivo actual de la madre.

Por ejemplo, cuando ya no quedan dependencias funcionales activas originadas en un Parto y se cumplen las condiciones de cierre del dominio, la Projection puede representar:

```text
Ciclo histórico del Parto
    → finalizado
```

Esto no implica que el estado reproductivo actual de la madre haya cambiado ni que se haya creado otro ciclo.

La situación actual de la madre debe obtenerse de su propio estado y de su ciclo reproductivo actual, no inferirse a partir de la finalización de las dependencias maternas de un ciclo histórico.

Por otro lado:

```text
3 crías
1 muerte antes del Destete
2 Destetes
```

puede proyectarse como:

```text
Historia de descendencia
3 crías
1 pérdida
2 destetadas
```

La Projection puede presentar conjuntamente los resultados históricos de un ciclo y la situación reproductiva actual de la madre, siempre que mantenga clara la diferencia entre ambos.

La Projection no decide cuándo termina el ciclo ni modifica los estados del dominio.

Representa las decisiones ya determinadas por las reglas de negocio.

---

# 66. Qué pertenece a la interfaz

La interfaz debe:

* iniciar la acción desde la madre;
* mostrar únicamente crías elegibles;
* permitir selección múltiple;
* explicar qué crías serán afectadas;
* confirmar la operación;
* mostrar el resultado de forma comprensible.

No debe:

* decidir si el ciclo termina;
* modificar `estado_vinculo_materno`;
* modificar directamente `tipo_productivo`;
* crear ciclos;
* interpretar eventos históricos.

---

# 67. Regla de User First

El modelo interno es complejo.

La operación para el ganadero debe ser sencilla.

La aplicación debe permitir pensar:

```text
Esta vaca
   ↓
estas crías
   ↓
quiero destetar estas
```

y encargarse internamente de:

```text
eventos
+
vínculos
+
transiciones
+
ciclo
+
proyecciones
```

La complejidad no debe trasladarse al usuario.

---

# 68. Resumen de reglas

| Regla                                                     | Resultado                                                |
| --------------------------------------------------------- | -------------------------------------------------------- |
| Nace cría viva                                            | `CRÍA + ACTIVO`                                          |
| Destetar cría                                             | `RECRÍA + FINALIZADO`                                    |
| Muerte de cría con vínculo activo                         | vínculo → `FINALIZADO`                                   |
| Venta de cría con vínculo activo                          | vínculo → `FINALIZADO`                                   |
| Venta/muerte de cría ya destetada                         | No afecta a la continuidad del ciclo histórico de origen |
| Queda al menos un vínculo activo originado en el Parto    | El ciclo histórico permanece abierto                     |
| No quedan vínculos activos originados en el Parto         | Evaluar el cierre del ciclo histórico según las reglas del dominio |
| Cierre del ciclo histórico                                | No es un evento                                          |
| Estado reproductivo actual de la madre                    | No cambia automáticamente por el Destete                 |
| Creación de un nuevo ciclo                                | No es una consecuencia automática del Destete            |
| TIMEOUT                                                   | No implementado; no existe cierre automático por paso del tiempo |
| Historial                                                 | Conserva los hechos reales registrados                   |
| Carrusel                                                  | Presenta e interpreta la historia sin confundir ciclos históricos y actuales |

El ciclo histórico afectado por un Destete se identifica a partir del Parto que originó a la cría:

```text
cria.parto_evento_id
        ↓
eventos.ciclo_id
        ↓
ciclo histórico de origen
```

La evaluación de continuidad se realiza sobre ese ciclo, no sobre el ciclo reproductivo actual de la madre.

---

# 69. Invariantes

## Invariante 1

`madre_id` no se modifica como consecuencia del Destete.

---

## Invariante 2

El vínculo solo puede considerarse activo cuando existe una dependencia funcional conocida.

---

## Invariante 3

Una cría destetada no vuelve a ser elegible para Destete.

---

## Invariante 4

Una cría que ha pasado a `RECRÍA` no participa en la continuidad del ciclo de su madre.

---

## Invariante 5

Una cría vendida o muerta antes del Destete deja de mantener un vínculo activo.

---

## Invariante 6

Una cría vendida o muerta después del Destete no afecta al ciclo de la madre.

---

## Invariante 7

El ciclo histórico que contiene un Parto permanece abierto mientras exista al menos una dependencia funcional activa originada en ese Parto.

La evaluación debe limitarse a las crías vinculadas a ese ciclo histórico y no debe confundirse con el estado del ciclo reproductivo actual de la madre.

---

## Invariante 8

Cuando ya no existen dependencias funcionales activas originadas en un Parto, el dominio evalúa si puede cerrar el ciclo histórico correspondiente.

La ausencia de vínculos activos no implica por sí sola que la madre deba pasar a VACÍA ni que deba crearse un nuevo ciclo.

---

## Invariante 9

El cierre del ciclo no genera un evento.

---

## Invariante 10

La creación del siguiente ciclo no genera un evento.

---

## Invariante 11

La historia de eventos no se modifica para simplificar la interpretación del ciclo.

---

## Invariante 12

La operación de Destete debe ser atómica.

---

## Invariante 13

El evento DESTETE debe atribuirse al ciclo histórico del Parto que originó a la cría, mediante:

cria.parto_evento_id → eventos.ciclo_id

Nunca debe asignarse automáticamente al ciclo reproductivo actual de la madre por el mero hecho de que el Destete se registre desde su ficha.

Invariante 14

Pueden coexistir varios ciclos abiertos para una misma madre, incluido un ciclo histórico pendiente de finalizar por sus dependencias funcionales y un ciclo reproductivo actual.

Esta coexistencia es válida y no debe corregirse creando cierres o ciclos adicionales de forma automática.

---

# 70. Qué no representa este flujo

Este flujo no pretende representar:

* ciclo menstrual;
* ovulación;
* fertilidad;
* actividad hormonal;
* recuperación biológica;
* momento óptimo de inseminación;
* productividad genética;
* supervivencia como único resultado del ciclo;
* comportamiento biológico no registrado.

El modelo representa una realidad operativa conocida.

---

# 71. Fuera de alcance

Quedan fuera de este flujo:

* Cierre automático de ciclos por el paso del tiempo (TIMEOUT, cron o mecanismos equivalentes). El modelo vigente no utiliza este mecanismo. La revisión reproductiva se gestiona mediante una alerta basada en un umbral configurable por especie, sin cerrar ciclos ni modificar automáticamente el estado reproductivo;
* detección de discontinuidad temporal;
* flujo completo de Aborto;
* flujo completo de Venta;
* flujo completo de Muerte;
* gestión de ubicación posterior al Destete;
* formación de lotes;
* planificación reproductiva;
* inseminación;
* cálculo de fertilidad;
* recomendaciones reproductivas basadas en ciclos;
* infraestructura transversal de `PendingTask`.

Estas funcionalidades podrán reutilizar las reglas y estados definidos aquí.

---

# 72. Evolución futura

El modelo está preparado para que otros hechos puedan finalizar un vínculo sin modificar el concepto fundamental.

Por ejemplo:

```text
                  HECHO
                    │
          ┌─────────┼─────────┐
          │         │         │
       Destete    Venta     Muerte
          │         │         │
          └─────────┼─────────┘
                    ▼
          finalizar vínculo
                    │
                    ▼
          evaluar vínculos restantes
```

El mismo patrón podría utilizarse para nuevos hechos futuros si tienen capacidad de modificar la dependencia funcional.

Esto evita diseñar un mecanismo específico para cada causa.

---

# 73. Relación con otros flujos

## Parto

El Parto crea:

```text
madre_id
estado_vinculo_materno = ACTIVO
tipo_productivo = CRÍA
```

El flujo de Parto es el origen del vínculo.

---

## Identificación

La identificación completa la información administrativa de la cría.

No modifica por sí misma la dependencia materna.

---

## Destete

Finaliza la dependencia funcional como consecuencia del hecho de Destete.

---

## Venta / Muerte

Pueden finalizar un vínculo activo antes del Destete.

Una vez finalizado el vínculo, los acontecimientos posteriores dejan de afectar al contexto reproductivo de la madre.

---

## Aborto

Tiene una lógica reproductiva diferente y deberá documentarse en su propio flujo.

---

# 74. Historia completa de un ciclo

Una representación conceptual debe distinguir la historia del ciclo que originó las crías de la situación reproductiva actual de la madre.

```text
              CICLO HISTÓRICO 4
                      │
                      ▼
                  CUBRICIÓN
                      │
                      ▼
                CONFIRMACIÓN
                      │
                      ▼
                    PARTO
                      │
              ┌───────┼───────┐
              │       │       │
              ▼       ▼       ▼
              A       B       C
             CRÍA    CRÍA    CRÍA
            ACTIVO  ACTIVO  ACTIVO
              │       │       │
              ▼       X       ▼
           DESTETE  MUERTE  DESTETE
              │       │       │
              ▼       ▼       ▼
           RECRÍA  FINALIZADO RECRÍA
                      │
                      ▼
       EVALUAR DEPENDENCIAS DEL CICLO 4
                      │
                      ▼
             ¿QUEDAN ACTIVAS?
                 │         │
                SÍ         NO
                 │         │
                 ▼         ▼
          CICLO HISTÓRICO  EVALUAR CIERRE
          PERMANECE ABIERTO DEL CICLO 4
```

El resultado del ciclo histórico corresponde al hecho reproductivo que lo determina, en este caso el Parto. El Destete no sustituye ese resultado: finaliza la dependencia funcional de cada cría afectada y puede permitir el cierre posterior del ciclo histórico.

La evaluación debe considerar todas las dependencias funcionales originadas en ese Parto. El cierre se deriva de las reglas del dominio y no genera un evento reproductivo adicional.

En paralelo, la madre puede disponer de un ciclo reproductivo actual:

```text
CICLO HISTÓRICO 4
resultado = PARTO
fecha_fin = NULL mientras corresponda
dependencias maternas pendientes
              │
              │ coexistencia válida
              ▼
CICLO REPRODUCTIVO ACTUAL
estado = VACÍA / CUBIERTA / GESTANTE
```

Ambos ciclos pueden coexistir abiertos. Cuando el ciclo histórico termina, no se modifica automáticamente el estado reproductivo actual de la madre ni se crea otro ciclo por efecto del Destete.

# 75. Lectura para el usuario

La aplicación debe transformar la complejidad del dominio en una explicación clara, sin confundir el historial de maternidad con la situación reproductiva actual.

Por ejemplo, ante estos hechos:

```text
3 crías originadas en un mismo Parto
1 vínculo finalizado por muerte
2 vínculos finalizados por Destete
0 vínculos activos originados en ese Parto
```

la aplicación puede presentar:

> **Las tres crías de este parto ya no mantienen una dependencia materna activa. Una falleció antes del Destete y las otras dos fueron destetadas. Se han finalizado los vínculos correspondientes y se ha evaluado el cierre del ciclo histórico.**

Si el ciclo histórico se ha cerrado, la aplicación puede indicarlo expresamente.

La situación reproductiva actual de la madre debe mostrarse por separado, utilizando su estado y su ciclo actual. No debe afirmarse que está `VACÍA`, que está disponible para una nueva cubrición o que se ha creado otro ciclo únicamente porque ya no queden dependencias activas.

Esta separación permite que la aplicación explique tanto lo ocurrido en el pasado como la situación presente del animal, sin inferir hechos que no se hayan producido.

---

# 76. Principio final

El flujo de Destete consolida una idea fundamental del modelo reproductivo:

> **Los eventos registran hechos. Los estados representan conocimiento derivado. Los vínculos representan dependencias funcionales. Los ciclos agrupan la historia reproductiva. Las proyecciones presentan esa historia de forma comprensible.**

El flujo puede representarse así:

```text
EVENTOS
   ↓
HECHOS REGISTRADOS
   ↓
REGLAS DEL DOMINIO
   ↓
ESTADOS + VÍNCULOS
   ↓
EVALUACIÓN DE CONTINUIDAD
DEL CICLO HISTÓRICO AFECTADO
   ↓
CIERRE DERIVADO, SI CORRESPONDE
   ↓
PROYECCIÓN
   ↓
HISTORIA COMPRENSIBLE PARA EL GANADERO
```

El Destete no es el evento que cierra automáticamente el ciclo reproductivo actual de la madre.

Es un hecho que finaliza una dependencia funcional madre-cría y que puede contribuir al cierre del ciclo histórico del Parto que originó a esa cría.

El ciclo histórico se cierra cuando se cumplen las condiciones de cierre establecidas por el dominio y ya no quedan dependencias funcionales que deban mantenerlo abierto.

Ese cierre no implica por sí mismo cambiar el estado reproductivo actual de la madre ni crear un nuevo ciclo.

**La historia del ciclo de origen, las dependencias maternas y la situación reproductiva actual son dimensiones relacionadas, pero distintas.**
