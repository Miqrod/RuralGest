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

> **El ciclo reproductivo permanece abierto mientras exista al menos una dependencia funcional madre-cría activa derivada de él.**

Por tanto:

```text
                         CICLO REPRODUCTIVO
                                  │
                                  ▼
                         ¿Existen vínculos
                         maternos activos?
                           /             \
                         SÍ               NO
                         │                │
                         ▼                ▼
                    ciclo abierto    ciclo finaliza
```

El Destete es uno de los hechos que puede hacer desaparecer un vínculo.

No es, por sí mismo, la definición del cierre del ciclo.

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
0 vínculos
      ↓
fin del ciclo
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
       evaluación de todos los vínculos
                    ↓
        ¿queda alguno ACTIVO?
             /              \
           SÍ                NO
           │                 │
           ▼                 ▼
    ciclo continúa       ciclo finaliza
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
| Cierre del ciclo         | Consecuencia derivada de que desaparezcan todos los vínculos funcionales activos |
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

---

# 10. Regla central de continuidad

La regla puede expresarse así:

```text
Vínculo relevante =
    tipo_productivo = CRÍA
    AND estado_vital = VIVO
    AND estado_vinculo_materno = ACTIVO
```

Y:

```text
ciclo continúa
    si existe al menos un vínculo relevante
```

Mientras que:

```text
ciclo finaliza
    si existen 0 vínculos relevantes
```

---

# 11. Diagrama completo del modelo

Este esquema resume la relación entre el modelo ganadero, el contexto reproductivo y la decisión sobre el ciclo:

```text
                    MODELO GANADERO
                          │
             ┌────────────┴────────────┐
             │                         │
         madre_id              estado_vinculo_materno
         genealogía              dependencia funcional
             │                         │
             └────────────┬────────────┘
                          ↓
                 REPRODUCTIVE CONTEXT
                          ↓
                  REPRODUCTIVE RULES
                          ↓
              ¿quedan vínculos activos?
                    │             │
                   SÍ             NO
                    │              │
                    ▼              ▼
             continúa ciclo    finaliza ciclo
                                   ↓
                       ¿sigue siendo reproductora?
                              │             │
                             SÍ             NO
                              │              │
                              ▼              ▼
                      nuevo ciclo        termina
                         VACÍA
```

Este diagrama no representa una secuencia de eventos.

Representa **cómo el dominio obtiene conocimiento suficiente para determinar la continuidad del ciclo**.

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
        ├── crear nuevo ciclo VACÍA si corresponde
        │
        └── actualizar proyecciones/snapshots
        │
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

Cuando se seleccionan todas las crías elegibles:

```text
Madre
├── Cría A → FINALIZADO
├── Cría B → FINALIZADO
└── Cría C → FINALIZADO
```

el dominio vuelve a evaluar el conjunto:

```text
¿Existe alguna cría CRÍA + VIVA + ACTIVA?
```

Resultado:

```text
NO
```

Por tanto:

```text
último vínculo finalizado
        ↓
0 vínculos activos
        ↓
finaliza ciclo
```

El cierre se deduce.

No se registra como evento independiente.

---

# 18. Destete de la última cría

El caso más habitual será probablemente una madre con una sola cría.

```text
Madre
└── Cría A
      │
      ├── CRÍA
      ├── VIVO
      └── ACTIVO
```

Se registra el Destete.

Resultado:

```text
Cría A
├── tipo_productivo = RECRÍA
├── estado_vinculo_materno = FINALIZADO
└── estado_vital = VIVO
```

Después:

```text
0 vínculos activos
```

Por tanto:

```text
ciclo actual
     ↓
finaliza
     ↓
madre = VACÍA
     ↓
si continúa siendo REPRODUCTORA
     ↓
nuevo ciclo = VACÍA
```

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
Confirmación
Parto
Destete
```

Después del Destete, el dominio puede determinar:

```text
ciclo anterior = finalizado
nuevo ciclo = VACÍA
```

pero no añade:

```text
Cierre de ciclo
Inicio de ciclo
```

al historial.

---

# 20. Por qué no registrar el cierre

Registrar "cierre de ciclo" sería redundante.

El usuario puede deducir el cambio mediante:

* el último hecho del ciclo;
* el estado reproductivo actual;
* el nuevo ciclo mostrado en el historial reproductivo;
* la siguiente Cubrición cuando llegue.

Además, el cierre no es un hecho independiente ocurrido en la explotación.

Es una **interpretación del estado de conocimiento del sistema**.

Por tanto:

```text
Destete
   ↓
hecho real

Cierre del ciclo
   ↓
consecuencia derivada
```

---

# 21. Creación del siguiente ciclo

Cuando un ciclo finaliza, el dominio determina si la madre continúa siendo elegible para participar en un nuevo ciclo.

Si continúa siendo `REPRODUCTORA`:

```text
ciclo actual
    ↓
finaliza
    ↓
nuevo ciclo
    ↓
estado = VACÍA
```

El nuevo ciclo se crea inmediatamente.

Esto permite mantener una representación sencilla y continua de la situación reproductiva de la madre.

---

# 22. Por qué se crea el nuevo ciclo

El nuevo ciclo no pretende representar:

* ovulación;
* ciclo menstrual;
* actividad hormonal;
* fertilidad;
* momento óptimo de inseminación;
* ninguna otra realidad biológica no registrada.

Representa únicamente una nueva unidad operativa de seguimiento reproductivo.

Su significado es:

> "La madre ha dejado de estar vinculada funcionalmente a las crías del ciclo anterior y continúa siendo una reproductora disponible para un nuevo proceso reproductivo."

---

# 23. Estado `VACÍA`

Cuando se crea el nuevo ciclo:

```text
estado_reproductivo = VACÍA
```

Esto significa que el sistema no conoce actualmente una gestación o dependencia materna activa para la nueva unidad reproductiva.

No significa que el sistema esté afirmando ninguna situación biológica concreta.

Es un estado de conocimiento operativo.

---

# 24. Si la madre deja de ser reproductora

El cierre del ciclo no implica siempre la creación de otro.

Después de finalizar el ciclo:

```text
¿sigue siendo REPRODUCTORA?
```

Si:

```text
NO
```

entonces:

```text
ciclo finaliza
↓
no se crea nuevo ciclo
```

Esto permite que la continuidad del historial reproductivo respete la clasificación productiva vigente de la madre.

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

```text
0 vínculos activos
```

El dominio puede determinar que el ciclo ha finalizado.

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

En este caso el ciclo permanece abierto hasta:

```text
28/05
```

si C era el último vínculo activo.

La duración del ciclo no se determina por el primer Destete.

Se determina por la desaparición del último vínculo relevante.

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

El ciclo termina cuando C deja de estar vinculada.

Pero la historia completa es:

```text
3 crías nacidas
├── 1 destetada
├── 1 fallecida antes del destete
└── 1 destetada
```

Por eso no debe resumirse el ciclo únicamente como:

```text
resultado = Destete
```

La historia de cada vínculo aporta información diferente.

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

# 39. No existe un "resultado único" obligatorio

El ciclo no debe depender de un único campo que diga:

```text
resultado = parto
```

o:

```text
resultado = destete
```

si ese valor obliga a perder información.

La proyección puede determinar que el ciclo finalizó, pero la explicación de por qué terminó debe construirse a partir de la historia de los vínculos.

Esto evita que:

```text
última cría murió
```

se convierta artificialmente en:

```text
ciclo terminado por muerte
```

como si esa muerte explicara por sí sola toda la historia.

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

Es la consecuencia de esta condición:

```text
0 vínculos maternos funcionalmente activos
```

Por tanto:

```text
cierre del ciclo
=
resultado de evaluar el contexto después de procesar un hecho
```

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
5. determina si el ciclo continúa o finaliza;
6. si corresponde, crea el siguiente ciclo.

No se necesita un proceso periódico para determinar el cierre.

---

# 43. No existe un cron de cierre

El sistema no debe ejecutar un proceso periódico para cerrar ciclos simplemente porque haya pasado tiempo.

No existe actualmente:

```text
cron
 ↓
buscar ciclos antiguos
 ↓
cerrarlos
```

Tampoco existe:

```text
EVENTO = TIMEOUT
```

La detección de discontinuidades temporales queda fuera de este flujo.

---

# 44. Discontinuidad temporal como evolución futura

En el futuro podría detectarse una situación como:

```text
Cubrición
      ↓
mucho tiempo sin hechos
      ↓
nueva Cubrición
```

El dominio podría determinar que existe una discontinuidad temporal suficiente para considerar que la historia anterior pertenece a otro ciclo.

Pero esa capacidad:

* no forma parte del Destete;
* no se implementa mediante cron;
* no genera actualmente un evento `TIMEOUT`;
* no forma parte del PRD010.

Se conserva como evolución futura del dominio.

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
evaluar dependencias restantes
              ↓
¿queda alguna?
       │              │
      sí              no
       │              │
       ▼              ▼
   continúa        finaliza
```

Esta regla puede ser reutilizada por otros hechos sin modificar el concepto central del ciclo.

---

# 47. Acciones derivadas

El procesamiento del Destete puede producir consecuencias que no son eventos introducidos directamente por el usuario.

Conviene diferenciarlas.

| Tipo                    | Ejemplo                                |
| ----------------------- | -------------------------------------- |
| Evento                  | Destete                                |
| Estado                  | vínculo → `FINALIZADO`                 |
| Estado                  | `CRÍA → RECRÍA`                        |
| Estado                  | madre → `VACÍA`                        |
| Consecuencia de dominio | finalización del ciclo                 |
| Consecuencia de dominio | creación del siguiente ciclo           |
| Proyección              | nuevo slide del historial reproductivo |
| Acción derivada futura  | posible tarea o recomendación          |

Estas categorías no deben mezclarse.

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
0 vínculos activos
```

La aplicación debe traducir esas conclusiones a lenguaje operativo.

Por ejemplo:

> "Todas las crías de este ciclo ya no dependen de la madre. La vaca está disponible para iniciar un nuevo ciclo reproductivo."

La terminología interna pertenece al dominio.

La interfaz debe expresar la consecuencia de forma comprensible.

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
├── ciclo = 4
├── estado_reproductivo = LACTANTE
│
└── Cría A
    ├── tipo_productivo = CRÍA
    ├── estado_vital = VIVO
    └── estado_vinculo_materno = ACTIVO
```

### Registrar Destete

```text
Destete
   ↓
Cría A
```

### Resultado

```text
Cría A
├── tipo_productivo = RECRÍA
├── estado_vital = VIVO
└── estado_vinculo_materno = FINALIZADO
```

### Evaluación

```text
vínculos activos = 0
```

### Consecuencia

```text
ciclo 4 → finalizado
madre → VACÍA
nuevo ciclo → VACÍA
```

No se genera:

```text
EVENTO CIERRE_CICLO
EVENTO INICIO_CICLO
```

---

# 56. Ejemplo completo: tres crías, dos destetadas

### Situación inicial

```text
Madre
│
├── A → CRÍA + VIVO + ACTIVO
├── B → CRÍA + VIVO + ACTIVO
└── C → CRÍA + VIVO + ACTIVO
```

### Operación

Se destetan A y B.

### Resultado

```text
A → RECRÍA + FINALIZADO
B → RECRÍA + FINALIZADO
C → CRÍA + VIVO + ACTIVO
```

### Evaluación

```text
vínculos activos = 1
```

Por tanto:

```text
ciclo continúa
madre = LACTANTE
```

La acción de Destete continúa disponible para C.

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
0 vínculos activos
↓
finalización del ciclo
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
0 vínculos activos
↓
ciclo finaliza
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

```text
                    EVENTO
                      │
                      ▼
              REPRODUCTIVE CONTEXT
                      │
                      ▼
              REPRODUCTIVE RULES
                      │
            ┌─────────┴─────────┐
            │                   │
            ▼                   ▼
     actualizar vínculo     mantener vínculo
            │                   │
            └─────────┬─────────┘
                      ▼
             evaluar dependencias
                      │
                      ▼
              ¿queda alguna activa?
                 │            │
                SÍ            NO
                 │             │
                 ▼             ▼
          mantener ciclo   finalizar ciclo
                               │
                               ▼
                     ¿sigue siendo reproductora?
                          │             │
                         SÍ             NO
                          │              │
                          ▼              ▼
                    nuevo ciclo       terminar
                       VACÍA
```

El patrón es reutilizable porque no depende exclusivamente del evento Destete.

---

# 63. Qué pertenece al Use Case

El Use Case `RegistrarDestete` debe encargarse de orquestar la operación.

Conceptualmente:

```text
RegistrarDestete
│
├── construir contexto
├── validar crías seleccionadas
├── registrar hecho
├── aplicar reglas de vínculo
├── actualizar tipo productivo
├── evaluar continuidad
├── crear siguiente ciclo si corresponde
└── persistir atómicamente
```

Pero las decisiones de negocio no deben quedar codificadas directamente dentro del Use Case.

El Use Case orquesta.

Las reglas deciden.

---

# 64. Qué pertenece a las Rules

Las Rules deben poder responder preguntas como:

> ¿Esta cría puede ser destetada?

> ¿Debe finalizar su vínculo?

> ¿Sigue existiendo alguna dependencia funcional?

> ¿Debe finalizar el ciclo?

> ¿La madre puede iniciar otro ciclo?

Estas preguntas no deben resolverse mediante condicionales dispersos por:

* formularios;
* componentes;
* RPC independientes;
* consultas de UI.

---

# 65. Qué pertenece a Projection

La Projection debe convertir las consecuencias del dominio en información útil para lectura.

Por ejemplo:

```text
0 vínculos activos
```

puede proyectarse como:

```text
Ciclo finalizado
Madre VACÍA
```

Y:

```text
3 crías
1 muerte
2 destetes
```

puede proyectarse como:

```text
Historia de descendencia
3 crías
1 pérdida
2 destetadas
```

La Projection no decide cuándo termina el ciclo.

Solo representa la decisión ya determinada por el dominio.

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

| Regla                             | Resultado                       |
| --------------------------------- | ------------------------------- |
| Nace cría viva                    | `CRÍA + ACTIVO`                 |
| Destetar cría                     | `RECRÍA + FINALIZADO`           |
| Muerte de cría activa             | vínculo → `FINALIZADO`          |
| Venta de cría activa              | vínculo → `FINALIZADO`          |
| Venta/muerte de cría ya destetada | no afecta a madre               |
| Queda ≥1 vínculo activo           | ciclo continúa                  |
| Quedan 0 vínculos activos         | ciclo finaliza                  |
| Madre sigue siendo reproductora   | crear nuevo ciclo `VACÍA`       |
| Madre deja de ser reproductora    | no crear nuevo ciclo            |
| Cierre del ciclo                  | no es evento                    |
| Inicio del nuevo ciclo            | no es evento                    |
| TIMEOUT                           | fuera de alcance                |
| Historial                         | conserva hechos reales          |
| Carrusel                          | interpreta la historia agregada |

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

El ciclo permanece abierto mientras exista al menos un vínculo:

```text
CRÍA + VIVO + ACTIVO
```

---

## Invariante 8

El ciclo finaliza cuando existen cero vínculos de ese tipo.

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

* implementación de `TIMEOUT`;
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

Una representación conceptual completa puede ser:

```text
                    CICLO 4
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
              ┌────────┼────────┐
              │        │        │
              ▼        ▼        ▼
             A        B        C
           CRÍA      CRÍA      CRÍA
          ACTIVO    ACTIVO    ACTIVO
              │        │        │
              ▼        X        ▼
          DESTETE    MUERTE   DESTETE
              │        │        │
              ▼        ▼        ▼
           RECRÍA   FINALIZADO RECRÍA
              │
              └────────┬────────┘
                       ▼
                0 VÍNCULOS ACTIVOS
                       │
                       ▼
                 CICLO FINALIZA
                       │
                       ▼
                MADRE = VACÍA
                       │
                       ▼
              NUEVO CICLO = VACÍA
```

La historia completa permite entender mucho más que un simple:

```text
resultado = parto
```

o:

```text
resultado = destete
```

---

# 75. Lectura para el usuario

La aplicación debería ser capaz de transformar esta complejidad:

```text
3 crías
1 vínculo finalizado por muerte
2 vínculos finalizados por Destete
0 vínculos activos
ciclo finalizado
nuevo ciclo creado
```

en una lectura sencilla:

> **"Las 3 crías de este ciclo ya no dependen de la madre. Una falleció antes del destete y las otras dos fueron destetadas. El ciclo reproductivo ha finalizado y la madre está disponible para un nuevo ciclo."**

Esta es la función principal de la proyección del historial reproductivo.

---

# 76. Principio final

El flujo de Destete consolida una idea más general del modelo reproductivo:

> **Los eventos registran hechos. Los estados representan conocimiento derivado. Los vínculos representan dependencias funcionales. El ciclo agrupa la historia. La proyección cuenta esa historia al usuario.**

Por tanto:

```text
EVENTOS
   ↓
HECHOS
   ↓
REGLAS DEL DOMINIO
   ↓
ESTADOS + VÍNCULOS
   ↓
CONTINUIDAD DEL CICLO
   ↓
PROYECCIÓN
   ↓
HISTORIA COMPRENSIBLE PARA EL GANADERO
```

El Destete no es, por tanto, "el evento que cierra el ciclo".

Es el hecho que puede finalizar una o varias dependencias madre-cría.

**El ciclo termina cuando ya no existe ninguna dependencia funcional derivada de él que deba mantenerlo abierto.**
