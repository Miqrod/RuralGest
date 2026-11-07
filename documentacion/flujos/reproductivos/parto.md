# Flujo reproductivo — Parto

> Documento permanente de la Base de Conocimiento.
>
> Este documento describe el significado del Parto dentro del modelo ganadero y reproductivo, el flujo de negocio asociado, las reglas que lo gobiernan y las consecuencias que produce sobre la madre, las nuevas crías y el ciclo reproductivo.
>
> No sustituye a la especificación técnica de un PRD concreto. Los PRD implementan estas reglas; este documento conserva el conocimiento de dominio una vez consolidado.

---

# 1. Propósito

El Parto representa el hecho reproductivo mediante el cual una hembra da a luz a una o varias crías.

Dentro del sistema, registrar un Parto no significa únicamente cambiar el estado reproductivo de la madre.

Es un acontecimiento que puede modificar simultáneamente varias partes del modelo:

```text
                                PARTO
                                  │
           ┌──────────────────────┼──────────────────────┐
           │                      │                      │
           ▼                      ▼                      ▼
         MADRE             CICLO DEL PARTO               CRÍAS
           │                      │                      │
           ▼                      ▼                      ▼
     Nuevo ciclo actual   Ciclo histórico          Nuevas entidades
        VACÍA*             asociado al                ANIMAL
                            nacimiento                   │
                                 │                 ┌─────┴──────┐
                                 ▼                 │            │
                          Permanece abierto      Vivas       Muertas
                          mientras existan         │            │
                          dependencias           CRÍA         MUERTO
                          activas de origen      + vínculo
                          en ese Parto           activo
```

\* Si la madre continúa clasificada como `REPRODUCTORA` y corresponde iniciar un nuevo ciclo según las reglas generales del dominio.

El Parto constituye, por tanto, un **evento reproductivo generador de nuevas entidades**.

La creación de las crías forma parte de la consecuencia del mismo hecho y no constituye un proceso independiente.

---

# 2. Principios fundamentales

El flujo de Parto se rige por los principios generales del proyecto.

## 2.1 El modelo representa conocimiento

El sistema no intenta reconstruir una realidad biológica que no conoce.

Solo representa hechos y conocimiento que pueden justificarse a partir de la información registrada.

Cuando el usuario registra un Parto, el sistema conoce:

* que se ha producido un nacimiento;
* quién es la madre;
* cuántos nacimientos se han registrado;
* qué nacimientos han sido registrados como vivos;
* qué nacimientos han sido registrados como muertos;
* la fecha del Parto;
* el ciclo reproductivo al que pertenece el evento;
* la información disponible sobre el padre, cuando exista.

La información que todavía no se conoce no debe ser inventada.

---

## 2.2 La existencia del animal es independiente de la completitud de su información

Una cría existe desde el momento en que su nacimiento constituye un hecho conocido.

No es necesario conocer inmediatamente:

* crotal;
* sexo;
* nombre;
* todos sus datos administrativos.

Por tanto:

```text
nacimiento conocido
       ↓
ANIMAL existe
       ↓
información administrativa
puede completarse posteriormente
```

No existen conceptos como:

* "animal provisional";
* "animal pendiente de crear";
* "nacimiento pendiente de convertir en animal".

La entidad `Animal` existe desde el momento en que el Parto queda registrado.

---

## 2.3 El Parto es un evento, no un estado

El Parto se registra como un hecho ocurrido.

No debe confundirse:

```text
evento = PARTO
```

con un supuesto estado reproductivo de lactación.

La lactación y la dependencia madre-cría describen una situación funcional que puede coexistir con el estado reproductivo actual de la madre.

El modelo distingue:

- **Evento `PARTO`:** hecho reproductivo que registra el nacimiento.
- **Ciclo histórico del Parto:** contexto reproductivo al que pertenece el nacimiento y al que se atribuyen los acontecimientos posteriores relacionados con ese Parto.
- **Estado reproductivo actual:** estado derivado del ciclo reproductivo actual de la madre, que puede ser `VACÍA`, `CUBIERTA` o `GESTANTE`.
- **Vínculo madre-cría:** dependencia funcional de cada cría respecto a su madre.

El evento constituye la fuente de verdad. Los estados, ciclos y vínculos se mantienen conforme a las reglas del dominio y se proyectan a partir de los hechos registrados.

---

## 2.4 El Parto no cierra el ciclo histórico al que pertenece

El Parto no finaliza automáticamente el ciclo reproductivo al que pertenece.

El ciclo histórico que contiene el Parto puede permanecer abierto mientras existan dependencias madre-cría activas originadas por ese nacimiento.

```text
Ciclo histórico del Parto
   │
   ├── Cubrición, si existe
   ├── Confirmación de gestación, si existe
   ├── Parto
   └── Acontecimientos posteriores de las crías
           │
           ▼
   Finalización de las dependencias
           │
           ▼
   Posible finalización del ciclo histórico
```

La finalización de ese ciclo histórico no determina por sí misma el estado reproductivo actual de la madre.

Si la madre continúa siendo `REPRODUCTORA`, el modelo establece un nuevo ciclo actual en `VACÍA` cuando corresponde, conforme a las reglas generales del dominio. Ese ciclo puede coexistir con el ciclo histórico del Parto mientras este último conserve dependencias pendientes.

Por tanto, deben distinguirse dos conceptos:

- **Ciclo histórico del Parto:** conserva la historia reproductiva y los acontecimientos vinculados a ese nacimiento.
- **Ciclo reproductivo actual de la madre:** representa su situación reproductiva actual.

El Destete puede contribuir a finalizar el ciclo histórico de origen, pero no crea por sí mismo un nuevo ciclo ni modifica automáticamente el estado reproductivo actual de la madre.

---

# 3. Conceptos implicados

El flujo de Parto conecta varios conceptos que conviene mantener diferenciados.

| Concepto                         | Significado                                                              |
| -------------------------------- | ------------------------------------------------------------------------ |
| `PARTO`                          | Hecho reproductivo registrado                                            |
| `ciclo_reproductivo`             | Contexto al que pertenece el Parto                                       |
| `Animal`                         | Entidad que representa cada animal individual                            |
| `madre_id`                       | Relación genealógica permanente                                          |
| `tipo_productivo = CRÍA`         | Clasificación productiva inicial de una cría viva dependiente            |
| `estado_reproductivo`            | Estado reproductivo actual de la madre: `VACÍA`, `CUBIERTA` o `GESTANTE` |
| `estado_vinculo_materno`         | Estado derivado de la dependencia funcional madre-cría                   |
| `evento_parto`                   | Información estructurada específica del nacimiento                       |
| `estado_identificacion`          | Grado de completitud de la identificación administrativa                 |

Es importante no mezclar estos conceptos.

Por ejemplo:

```text
madre_id ≠ estado_vinculo_materno
```

y:

```text
tipo_productivo ≠ estado_vinculo_materno
```

y:

```text
PARTO ≠ LACTANTE
```

---

# 4. Condiciones para registrar un Parto

El Parto debe poder registrarse cuando existe conocimiento reproductivo suficiente para justificarlo.

Actualmente existen dos situaciones válidas.

## 4.1 Existe una Cubrición

```text
CUBRICIÓN
   ↓
ciclo reproductivo
   ↓
PARTO
```

El Parto puede registrarse aunque no se haya realizado una Confirmación de Gestación.

Esto permite representar el caso en el que el usuario registra directamente el nacimiento después de haber registrado la Cubrición.

---

## 4.2 Existe una Confirmación de Gestación

```text
CONFIRMACIÓN
   ↓
ciclo reproductivo
   ↓
PARTO
```

La Confirmación puede constituir el primer hecho reproductivo conocido del ciclo cuando no existe una Cubrición registrada.

Por tanto, la existencia de una Cubrición previa no es un requisito universal para registrar un Parto.

---

## 4.3 No existe conocimiento reproductivo suficiente

Si no existe:

* Cubrición;
* ni Confirmación de Gestación;

el sistema no dispone de suficiente contexto reproductivo para registrar directamente el Parto.

En ese caso debe registrarse previamente la Confirmación de Gestación correspondiente.

Esta regla evita que un Parto aparezca aislado dentro de una historia reproductiva sin contexto suficiente.

---

# 5. Inicio del flujo

Desde el punto de vista del usuario, la acción es sencilla:

```text
Ficha de la madre
       ↓
Registrar Parto
```

El usuario no necesita conocer:

* `ReproductiveContext`;
* `ReproductiveRules`;
* snapshots;
* proyecciones;
* relaciones entre eventos y ciclos.

La interfaz expresa una acción de negocio.

La complejidad necesaria para determinar qué ciclo se ve afectado y qué consecuencias deben producirse pertenece al dominio.

---

# 6. Flujo arquitectónico

El flujo sigue el patrón general:

```text
Acción de negocio
Registrar Parto
        │
        ▼
Use Case
RegistrarParto
        │
        ▼
Contexto reproductivo
        │
        ▼
Reglas del dominio
        │
        ▼
Validación
        │
        ▼
Evento PARTO
        │
        ├────────────────────┐
        │                    │
        ▼                    ▼
   Ciclo histórico         Crías
   que contiene PARTO         │
        │                    ▼
        │              Crear entidades
        │                 ANIMAL
        │                    │
        │              ┌─────┴─────┐
        │              │           │
        │              ▼           ▼
        │           Genealogía   Vínculo
        │                       materno
        │
        ▼
Si corresponde y la madre
sigue siendo REPRODUCTORA:
crear ciclo actual VACÍA
        │
        ▼
Proyecciones y snapshots
        │
        ▼
Historial reproductivo
```

Toda la operación debe ejecutarse de forma atómica.

Si el Parto queda registrado correctamente, sus consecuencias esenciales deben quedar consolidadas en la misma operación.

No debe ser posible terminar con:

```text
PARTO registrado
+
crías sin crear
```

ni:

```text
crías creadas
+
PARTO inexistente
```

---

# 7. Información específica del Parto

El evento genérico `EVENTO` representa el hecho, pero el Parto contiene información específica que debe poder consultarse de forma estructurada.

Por ello existe una entidad especializada:

```text
evento
   │
   └── evento_parto
```

La relación es:

```text
EVENTO 1 ───────── 1 EVENTO_PARTO
```

## Información inicial

`evento_parto` puede contener, según el modelo persistente vigente:

| Dato             | Significado                             |
| ---------------- | --------------------------------------- |
| `evento_id`      | Evento de dominio al que pertenece      |
| `numero_nacidos` | Número total de nacimientos registrados |
| `numero_vivos`   | Número de nacimientos vivos             |
| `numero_muertos` | Número de nacimientos muertos           |
| `tipo_parto`     | Tipo de parto conocido                  |
| `observaciones`  | Información adicional                   |

La entidad especializada evita sobrecargar la tabla genérica de eventos y permite evolucionar la información específica del nacimiento sin recurrir a estructuras genéricas.

---

# 8. Registro de nacimientos

El número de nacimientos registrado en el Parto determina cuántas entidades `Animal` deben crearse.

Conceptualmente:

```text
numero_nacidos = N
        ↓
crear N animales
```

Cada nacimiento constituye una entidad individual.

Por tanto:

```text
Parto
├── Animal 1
├── Animal 2
└── Animal 3
```

No se crea una única entidad "camada" para representar a los animales individuales.

La información común del nacimiento pertenece al evento Parto.

La identidad y evolución posterior pertenecen a cada `Animal`.

---

# 9. Creación de las nuevas crías

Las nuevas crías se crean automáticamente como consecuencia del Parto.

Cada cría recibe únicamente la información que el sistema conoce en ese momento.

## Información de origen

Cuando se dispone de ella, la nueva entidad conserva:

* `madre_id`;
* `padre_id`;
* fecha de nacimiento;
* origen;
* referencia al evento que originó su creación;
* información de raza calculada;
* estado vital;
* tipo productivo;
* estado de identificación.

La pertenencia al ciclo reproductivo se mantiene a través de la relación del evento de Parto con el ciclo.

No se introduce un `ciclo_reproductivo_id` independiente en `Animal`.

La relación conceptual es:

```text
Animal
   │
   └── parto_evento_id
             │
             ▼
        EVENTO PARTO
             │
             ▼
      ciclo_reproductivo
```

Esto evita duplicar la relación entre animales, eventos y ciclos.

---

# 10. Genealogía de la nueva cría

Cuando el Parto genera una cría, la relación con la madre se establece mediante:

```text
madre_id
```

Esta relación es genealógica y permanente.

```text
MADRE
  │
  │ madre_id
  ▼
CRÍA
```

`madre_id` responde a:

> ¿Quién es la madre de este animal?

No responde a:

> ¿Sigue dependiendo actualmente de su madre?

Esta segunda pregunta corresponde a:

```text
estado_vinculo_materno
```

---

# 11. Nacimiento y vínculo materno

Cuando nace una cría viva y el sistema conoce la relación materna, el nacimiento crea simultáneamente el contexto inicial de dependencia funcional.

La situación inicial es:

```text
tipo_productivo = CRÍA
estado_vinculo_materno = ACTIVO
estado_vital = VIVO
```

Conceptualmente:

```text
                  PARTO
                    │
                    ▼
                 CRÍA
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
     madre_id              vínculo
     permanente             ACTIVO
```

El vínculo funcional no sustituye a la genealogía.

Ambos conceptos coexisten.

---

# 12. `madre_id` y `estado_vinculo_materno`

La diferencia debe mantenerse durante toda la vida del animal.

### En el nacimiento

```text
madre_id = M
estado_vinculo_materno = ACTIVO
```

### Después del Destete

```text
madre_id = M
estado_vinculo_materno = FINALIZADO
```

### Después de una muerte o venta antes del Destete

```text
madre_id = M
estado_vinculo_materno = FINALIZADO
```

En ningún caso se elimina `madre_id`.

La genealogía permanece aunque la dependencia funcional haya terminado.

---

# 13. Tipo productivo inicial

Una cría viva nacida mediante Parto se crea inicialmente con:

```text
tipo_productivo = CRÍA
```

`CRÍA` identifica la categoría productiva inicial del animal dentro del modelo ganadero.

La dependencia funcional respecto a la madre se representa de forma independiente mediante `estado_vinculo_materno`.

En el nacimiento de una cría viva dependiente:

```text
tipo_productivo = CRÍA
estado_vinculo_materno = ACTIVO
```

La evolución productiva habitual es:

```text
PARTO
  ↓
CRÍA
  ↓
DESTETE
  ↓
RECRÍA
```

El cambio de `CRÍA` a `RECRÍA` corresponde al flujo de Destete. No se realiza durante el Parto.

La genealogía tampoco depende de la vigencia del vínculo: `madre_id` se conserva aunque la dependencia funcional finalice.

Por tanto, no deben utilizarse indistintamente `tipo_productivo` y `estado_vinculo_materno` para representar la misma información.

---

# 14. Animales nacidos muertos

Un nacimiento muerto sigue siendo un hecho confirmado.

Por tanto, el sistema crea también una entidad `Animal` para conservar su existencia histórica y su trazabilidad.

Conceptualmente:

```text
PARTO
  │
  ├── nacimiento vivo
  │       ↓
  │     Animal
  │     CRÍA
  │
  └── nacimiento muerto
          ↓
        Animal
        tipo_productivo = NULL
        estado_vital = MUERTO
```

Un animal nacido muerto:

* existe como entidad;
* conserva la genealogía conocida;
* forma parte de la historia del Parto;
* no establece una dependencia funcional activa con la madre;
* no participa en la continuidad posterior del ciclo como cría dependiente.

No debe convertirse posteriormente en `RECRÍA`.

---

# 15. Diferencia entre nacimiento muerto y muerte posterior

Es importante distinguir:

### Nacimiento muerto

El animal nace ya muerto.

```text
PARTO
  ↓
Animal
  ↓
estado_vital = MUERTO
```

### Muerte posterior

El animal nace vivo:

```text
PARTO
  ↓
CRÍA
ACTIVO
VIVO
  ↓
MUERTE
  ↓
CRÍA
FINALIZADO
MUERTO
```

El segundo caso sí implica que existió previamente una dependencia funcional madre-cría.

Esta distinción será relevante para la evolución posterior del ciclo y para el análisis de la historia reproductiva.

---

# 16. Cálculo de la raza

La raza de las nuevas crías se calcula automáticamente a partir de la información conocida sobre sus progenitores.

Reglas iniciales:

| Madre                    | Padre      | Resultado                 |
| ------------------------ | ---------- | ------------------------- |
| misma raza               | misma raza | misma raza                |
| raza A                   | raza B     | `CRUZADA`                 |
| información insuficiente | cualquiera | conservar desconocimiento |

El cálculo pertenece al dominio.

La interfaz no debe decidir la raza derivada.

La lógica se mantiene preparada para evolucionar hacia reglas más complejas en el futuro.

No se pretende en esta fase representar:

* porcentajes raciales;
* retrocruces;
* genética avanzada;
* modalidades reproductivas futuras.

---

# 17. Identificación progresiva

El nacimiento y la identificación administrativa son procesos diferentes.

Cuando nace una cría, puede que todavía no se conozca toda la información necesaria para identificarla administrativamente.

Por tanto:

```text
PARTO
  ↓
Animal creado
  ↓
información parcial
  ↓
identificación posterior
```

La aplicación puede crear la entidad y dejar determinados campos pendientes.

---

# 18. Estado de identificación

La identificación administrativa utiliza:

```text
estado_identificacion
```

con valores:

```text
PENDIENTE
COMPLETA
```

Este estado es independiente de:

* estado vital;
* estado reproductivo;
* tipo productivo;
* estado del vínculo materno.

Por ejemplo:

```text
CRÍA
ACTIVO
VIVO
PENDIENTE
```

es un estado válido inmediatamente después del nacimiento si todavía no se ha completado la identificación administrativa.

---

# 19. Reglas de identificación

La interfaz no decide cuándo una cría está correctamente identificada.

El dominio utiliza `AnimalIdentificationRules`.

Inicialmente, para animales vivos, la identificación se considera completa cuando se dispone como mínimo de:

* crotal;
* sexo.

Conceptualmente:

```text
                 Animal
                    │
                    ▼
        AnimalIdentificationRules
                    │
           ┌────────┴────────┐
           │                 │
       información        información
       suficiente          pendiente
           │                 │
           ▼                 ▼
       COMPLETA           PENDIENTE
```

El dominio puede proporcionar además un `AnimalIdentificationStatus` que indique qué información continúa pendiente.

Esto permite reutilizar las mismas reglas desde:

* la ficha del animal;
* el flujo de identificación;
* el historial reproductivo;
* el Dashboard;
* futuras funcionalidades.

---

# 20. Animales nacidos muertos e identificación

Los animales nacidos muertos no requieren una acción administrativa posterior de identificación.

Por tanto, no deben aparecer como tareas pendientes de identificación.

Conceptualmente:

```text
nacimiento muerto
       ↓
Animal
       ↓
estado_vital = MUERTO
       ↓
estado_identificacion = COMPLETA
```

La razón no es que el animal disponga de más información que una cría viva.

La razón es que el proceso administrativo de identificación no debe generar una tarea operativa sobre un animal que ya ha nacido muerto.

---

# 21. Estado reproductivo de la madre

Después de registrar correctamente el Parto, el sistema debe determinar el estado reproductivo actual de la madre conforme a las reglas generales del dominio.

`LACTANTE` no es un estado reproductivo del modelo.

La existencia de crías dependientes se representa mediante los vínculos madre-cría, independientemente del estado reproductivo actual de la madre.

Por tanto, pueden coexistir:

```text
estado_reproductivo = VACÍA
```

y:

```text
existen vínculos madre-cría activos
```

La existencia de esos vínculos no obliga a mantener un estado reproductivo especial ni impide que la madre inicie un nuevo ciclo.

---

# 22. El ciclo reproductivo después del Parto

El evento `PARTO` pertenece al ciclo reproductivo en el que se registra el nacimiento.

Ese ciclo conserva la historia del proceso que condujo al Parto y puede permanecer abierto mientras existan dependencias madre-cría activas originadas por ese nacimiento.

Si la madre continúa siendo `REPRODUCTORA`, se crea un nuevo ciclo reproductivo actual en estado `VACÍA` cuando corresponde, de acuerdo con las reglas generales del dominio.

La secuencia conceptual es:

```text
Ciclo histórico
  │
  ├── Cubrición, si existe
  ├── Confirmación, si existe
  └── Parto
          │
          └── dependencias madre-cría
                  │
                  └── acontecimientos históricos
                      atribuidos a este ciclo


Nuevo ciclo actual de la madre
  │
  └── VACÍA
          │
          ├── Cubrición
          └── Confirmación de gestación
```

Ambos ciclos pueden coexistir en el sistema: uno conserva la historia del Parto y sus dependencias pendientes; el otro representa la situación reproductiva actual de la madre.

El Destete, la venta o la muerte de una cría pueden modificar los vínculos y contribuir a la finalización del ciclo histórico de origen. No deben cerrar ni modificar automáticamente el ciclo actual de la madre.

La finalización del ciclo histórico se deriva de las reglas del dominio. No genera un evento artificial de cierre.

---

# 23. Consecuencias sobre la madre y las crías

Las consecuencias del Parto deben interpretarse por entidad.

| Entidad | Consecuencia |
|---|---|
| Madre | Su estado reproductivo actual se determina según las reglas generales del dominio |
| Ciclo histórico del Parto | Conserva el evento y la historia reproductiva del nacimiento |
| Ciclo histórico del Parto | Puede permanecer abierto mientras existan dependencias activas originadas por ese nacimiento |
| Ciclo actual de la madre | Puede coexistir con el ciclo histórico del Parto |
| Cría viva | Nueva entidad `Animal` |
| Cría viva | `tipo_productivo = CRÍA` |
| Cría viva dependiente | `estado_vinculo_materno = ACTIVO` |
| Cría viva | `madre_id = madre` |
| Cría nacida muerta | Nueva entidad histórica `Animal`, con `estado_vital = MUERTO` y `tipo_productivo = NULL` |
| Cría nacida muerta | No crea una dependencia funcional activa |
| Historial | Se registra el evento `PARTO` |
| Identificación | Puede quedar pendiente para las crías vivas |

El estado reproductivo actual de la madre no debe utilizarse para representar la lactación ni para inferir si quedan crías dependientes.

---

# 24. Atomicidad

El registro del Parto es una operación compuesta.

Debe garantizarse que las diferentes consecuencias se consoliden conjuntamente.

Conceptualmente:

```text
BEGIN TRANSACTION
        │
        ├── registrar EVENTO PARTO
        │
        ├── registrar EVENTO_PARTO
        │
        ├── actualizar madre
        │
        ├── crear crías
        │
        ├── establecer genealogía
        │
        ├── establecer vínculo materno
        │
        ├── calcular información derivada
        │
        └── actualizar snapshots
        │
COMMIT
```

Si una parte esencial de la operación falla, el sistema no debe dejar un Parto parcialmente registrado.

Debe evitarse especialmente:

```text
PARTO registrado
+
madre actualizada
+
solo algunas crías creadas
```

o:

```text
PARTO registrado
+
crías creadas
+
sin relación con la madre
```

---

# 25. Historial de eventos

El Parto debe aparecer en el historial puro de eventos de los animales afectados.

La historia de la madre incluirá el evento:

```text
PARTO
```

La existencia de las nuevas crías deriva de ese hecho.

Los eventos posteriores de cada cría pertenecen a su propia historia.

El historial de eventos no debe convertirse en una narración artificial del ciclo.

Por tanto, no se generan eventos adicionales para representar:

* "inicio de vínculo";
* "fin de vínculo";
* "inicio de lactancia";
* "cierre de ciclo".

Estas son consecuencias o estados derivados.

---

# 26. Historial reproductivo

El historial reproductivo es diferente del historial puro de eventos.

Su objetivo es ayudar al usuario a comprender la historia reproductiva de la madre.

Después del Parto, el foco de la información cambia:

```text
ANTES DEL PARTO
────────────────────────
Cubrición
Gestación
Fecha prevista
Días restantes
────────────────────────

DESPUÉS DEL PARTO
────────────────────────
Parto
Crías
Estado de las crías
Evolución del vínculo
────────────────────────
```

El usuario no necesita conocer que internamente existe un `ciclo_reproductivo`.

El carrusel utiliza los ciclos para organizar la historia, pero presenta al usuario hechos y consecuencias comprensibles.

---

# 27. El Parto como punto de transición del carrusel

El Parto marca una transición importante en la información que se muestra.

Antes del Parto, el ciclo responde principalmente a:

> ¿Cómo evoluciona la gestación?

Después del Parto, responde principalmente a:

> ¿Qué ocurrió con las crías?

Por tanto:

```text
                 CICLO
                   │
          ┌────────┴────────┐
          │                 │
       antes              después
      del Parto            del Parto
          │                 │
          ▼                 ▼
      gestación           crías
      cubrición           vínculos
      confirmación        destetes
      fecha prevista      evolución
```

Esta transición debe reflejarse en la proyección de lectura.

---

# 28. Crías dentro del historial reproductivo

Cuando el ciclo contiene un Parto, el historial reproductivo debe poder mostrar las crías generadas.

Para cada cría, cuando exista información disponible:

* identificación;
* sexo;
* raza;
* estado vital;
* situación respecto al vínculo materno;
* información relevante de su evolución.

La proyección debe evitar reducir toda la camada a un único valor.

Por ejemplo:

```text
Ciclo 4

Parto
├── Cría A
│   └── Destetada
├── Cría B
│   └── Fallecida antes del destete
└── Cría C
    └── Activa
```

Esta información permitirá posteriormente comprender por qué el ciclo continúa abierto o por qué ha finalizado.

---

# 29. El historial reproductivo no sustituye al Timeline

Deben mantenerse dos conceptos distintos.

## Timeline

Representa hechos:

```text
Cubrición
Confirmación
Parto
Destete
Venta
Muerte
```

## Historial reproductivo

Representa la interpretación agregada de esos hechos dentro de cada ciclo:

```text
Ciclo 4
 ├── gestación
 ├── parto
 ├── crías
 └── evolución posterior
```

El Timeline responde:

> ¿Qué ocurrió?

El historial reproductivo responde:

> ¿Cómo evolucionó esta reproducción?

---

# 30. UX posterior al Parto

El usuario debe percibir que el Parto ha generado una nueva situación operativa.

La aplicación debería mostrar claramente:

- que el Parto se ha registrado;
- cuáles son las nuevas crías;
- cuáles están pendientes de identificación;
- el estado reproductivo actual de la madre, cuando corresponda;
- las dependencias madre-cría que continúan activas;
- qué acción puede realizarse a continuación.

La lactación y la dependencia de las crías NO se representan mediante un estado reproductivo `LACTANTE`. Se muestran como información funcional derivada de los vínculos madre-cría.

La interfaz no debe obligar al usuario a comprender las reglas internas del dominio.

La secuencia natural debe ser:

```text
Registrar Parto
      ↓
Confirmación
      ↓
Nuevas crías visibles
      ↓
Identificar crías cuando corresponda
      ↓
Gestionar posteriormente su evolución
```

---

# 31. Identificación desde la madre

El Parto introduce una relación operativa importante:

```text
Madre
 └── Crías
```

Por ello, la identificación de las nuevas crías puede iniciarse desde la ficha de la madre.

Esto no significa que la identificación pertenezca al flujo de Parto.

Significa que el Parto proporciona el contexto necesario para que la siguiente acción sea fácilmente accesible.

La acción de identificación constituye un Use Case independiente.

---

# 32. Qué pertenece al Parto y qué no

Esta separación debe mantenerse para evitar que el flujo crezca de forma indefinida.

| Pertenece al Parto                              | No pertenece al Parto                             |
| ----------------------------------------------- | ------------------------------------------------- |
| Registrar el nacimiento                         | Destetar                                          |
| Crear las nuevas crías                          | Cambiar CRÍA → RECRÍA                             |
| Establecer `madre_id`                           | Finalizar vínculos posteriormente                 |
| Crear vínculo inicial                           | Finalizar dependencias madre-cría posteriores     |
| Calcular raza inicial                           | Crear el ciclo actual cuando corresponda, según las reglas generales del dominio |
| Establecer estado vital inicial                 | Venta posterior                                   |
| Estado productivo inicial                       | Muerte posterior                                  |
| Consecuencias reproductivas derivadas del Parto | Modificación directa de estados desde la interfaz |
| Registrar información específica del Parto      | Gestión posterior de ubicación                    |
| Preparar la identificación                      | Decisiones productivas posteriores                |

Esta separación es importante porque una consecuencia del Parto puede ser el inicio de otro flujo sin formar parte de él.

El registro del Parto sí puede desencadenar consecuencias reproductivas según las reglas generales. Lo que no debe hacer es imponer un estado artificial de lactación ni convertir la finalización de las dependencias en un evento de cierre de ciclo.

---

# 33. Relación con el flujo de Identificación

El Parto puede dejar una cría en:

```text
estado_identificacion = PENDIENTE
```

Eso no significa que el Parto haya quedado incompleto.

Significa que:

```text
Parto = completado
Identificación = pendiente
```

Son dos operaciones diferentes.

Esta distinción permite que el sistema represente correctamente la realidad:

> el animal existe aunque todavía no se haya completado toda su información administrativa.

---

# 34. Relación con el flujo de Destete

El Parto crea las condiciones para los futuros Destetes y establece el contexto histórico del nacimiento.

```text
Ciclo histórico que contiene el Parto
  │
  └── PARTO
        │
        └── Cría + vínculo activo
                 │
                 ▼
              DESTETE
                 │
                 ├── Finalizar el vínculo de la cría
                 └── Cambiar CRÍA → RECRÍA
```

Cada Destete se atribuye al ciclo histórico que contiene el Parto que originó a la cría, no necesariamente al ciclo reproductivo actual de la madre.

El Destete no crea un ciclo nuevo ni modifica automáticamente el estado reproductivo actual de la madre.

Cuando se finaliza la última dependencia activa originada por ese Parto, puede finalizar también el ciclo histórico correspondiente, de acuerdo con las reglas del dominio.

La finalización del ciclo histórico es una consecuencia derivada, no un evento adicional.

El flujo de Parto no determina cuándo debe producirse el Destete. Su responsabilidad consiste en registrar el nacimiento y dejar consolidados los datos necesarios para gestionar posteriormente cada cría y su dependencia materna.

---

# 35. Casos relevantes

## Caso A — Una cría viva

```text
Parto
  ↓
1 nacimiento vivo
  ↓
1 entidad Animal
  ↓
CRÍA + vínculo ACTIVO
  ↓
La madre conserva sus vínculos activos
y tiene el estado reproductivo que corresponda
```

Es el caso habitual.

---

## Caso B — Varias crías vivas

```text
Parto
↓
3 nacimientos vivos
↓
Animal A + Animal B + Animal C
↓
CRÍA + ACTIVO
```

La madre mantiene múltiples vínculos funcionales.

El ciclo histórico que contiene el Parto puede permanecer abierto mientras exista al menos una dependencia activa originada por ese nacimiento.

La madre puede tener simultáneamente un ciclo reproductivo actual y uno o varios ciclos históricos abiertos por dependencias pendientes.

---

## Caso C — Una cría viva y una nacida muerta

```text
Parto
├── Cría A
│   └── CRÍA + ACTIVO + VIVO
│
└── Animal B
    └── NULL + MUERTO
```

Solo la cría viva genera dependencia funcional.

---

## Caso D — Varias crías y padre desconocido

```text
Parto
↓
Madre conocida
↓
Padre = NULL
↓
Crías creadas igualmente
```

La ausencia de padre conocido no impide representar el nacimiento.

---

## Caso E — Parto tras Confirmación sin Cubrición

```text
Confirmación
↓
ciclo creado
↓
GESTANTE
↓
Parto
↓
Ciclo histórico conserva el Parto
↓
Nuevo ciclo actual VACÍA, cuando corresponda
```

El flujo es válido.

La ausencia de una Cubrición registrada no impide la continuidad del proceso si existe una Confirmación de Gestación válida. Las consecuencias posteriores sobre el ciclo se rigen por el modelo general.

---

# 36. Casos que no deben confundirse

## Parto ≠ Destete

El Parto crea la dependencia.

El Destete finaliza una dependencia individual.

---

## Parto ≠ cierre de ciclo

El Parto mantiene abierto el ciclo.

---

## `madre_id` ≠ vínculo activo

Una cría puede conservar:

```text
madre_id = 123
```

y tener:

```text
estado_vinculo_materno = FINALIZADO
```

---

## CRÍA ≠ simplemente animal joven

`CRÍA` representa la etapa funcional en la que el animal continúa vinculado a su madre.

---

## Nacimiento muerto ≠ muerte de una cría

El primero ocurre al nacer.

El segundo ocurre después de haber existido como animal vivo.

---

# 37. Reglas de integridad

El flujo debe preservar las siguientes invariantes.

### Invariante 1 — Todo Parto válido pertenece a un contexto reproductivo

No debe existir un Parto aislado sin suficiente contexto reproductivo.

---

### Invariante 2 — Las crías nacidas existen como animales

Si el Parto confirma un nacimiento, la entidad `Animal` correspondiente debe existir.

---

### Invariante 3 — La genealogía se establece en el nacimiento

Cuando la madre es conocida:

```text
cría.madre_id = madre.id
```

---

### Invariante 4 — La genealogía no se modifica posteriormente por el ciclo

Destete, Venta o Muerte no modifican `madre_id`.

---

### Invariante 5 — Las crías vivas nacen como CRÍA

```text
tipo_productivo = CRÍA
```

---

### Invariante 6 — Las crías vivas dependientes nacen con vínculo activo

```text
estado_vinculo_materno = ACTIVO
```

---

### Invariante 7. El Parto no finaliza automáticamente su ciclo histórico

El Parto no provoca por sí mismo el cierre inmediato del ciclo histórico al que pertenece.

Si existen dependencias madre-cría activas originadas por ese nacimiento, el ciclo histórico puede permanecer abierto mientras esas dependencias sigan vigentes.

Cuando no quedan dependencias activas originadas por ese Parto, el ciclo histórico puede finalizar según las reglas del dominio.

Esta finalización no determina el estado reproductivo actual de la madre ni implica crear otro ciclo si ya existe uno actual.

Si no se genera ninguna dependencia activa, por ejemplo, cuando todos los nacimientos son de crías muertas, el ciclo histórico puede finalizar inmediatamente si no quedan otros hechos pendientes que deban atribuirse a él.

---

### Invariante 8 — La información desconocida permanece desconocida

El sistema no debe inventar:

* padre;
* sexo;
* crotal;
* raza cuando no exista información suficiente.

---

### Invariante 9 — Atomicidad

El registro del Parto y sus consecuencias esenciales se consolidan atómicamente.

---

# 38. Lectura arquitectónica del flujo

El flujo completo puede resumirse mediante la siguiente cadena:

```text
                 MODELO GANADERO
                       │
             ┌─────────┴─────────┐
             │                   │
          ANIMAL              EVENTOS
             │                   │
             │                 PARTO
             │                   │
             └─────────┬─────────┘
                       ▼
             Contexto reproductivo
                       ▼
               Reglas del dominio
                       ▼
                 Registrar Parto
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
       Ciclo histórico          Crías
       que contiene PARTO         │
             │                   ▼
             │              Crear Animal
             │                   │
             │             ┌─────┴─────┐
             │             │           │
             │             ▼           ▼
             │         madre_id     CRÍA + vínculo
             │                       ACTIVO
             │
             ▼
       Nuevo ciclo actual
       VACÍA, cuando
       corresponda
             │
             ▼
         Proyecciones
             │
             ▼
      Historial reproductivo
```

La clave es que el Parto **no crea una nueva arquitectura**.

Utiliza el patrón ya consolidado:

```text
Context → Rules → Projection
```

---

# 39. Qué información queda derivada después del Parto

Después de procesar el evento, el sistema puede conocer y proyectar:

### Sobre la madre

- Estado reproductivo actual derivado, cuando corresponda: `VACÍA`, `CUBIERTA` o `GESTANTE`.
- Ciclo reproductivo actual, si existe.
- Ciclos históricos que contienen Partos anteriores y que pueden continuar abiertos por dependencias pendientes.
- Crías asociadas a cada Parto.
- Vínculos madre-cría activos.
- Información necesaria para consultar la historia reproductiva sin confundir el ciclo actual con los ciclos históricos.

### Sobre cada cría viva

* existencia;
* madre;
* padre cuando sea conocido;
* raza;
* fecha de nacimiento;
* `tipo_productivo = CRÍA`;
* `estado_vinculo_materno = ACTIVO`;
* estado vital;
* estado de identificación.

### Sobre cada nacimiento muerto

* existencia histórica;
* madre;
* padre cuando sea conocido;
* fecha de nacimiento;
* `estado_vital = MUERTO`;
* `tipo_productivo = NULL`.

---

# 40. Lo que el usuario debe entender

Aunque toda la arquitectura anterior exista internamente, la experiencia del usuario debe poder resumirse de forma mucho más sencilla:

> **«He registrado que esta vaca ha parido. El sistema ha creado sus crías y las ha relacionado con ella. Las crías vivas que dependen de la madre aparecen como crías y podrán identificarse y gestionarse posteriormente. La situación reproductiva actual de la madre se mantiene separada de la lactación y de los vínculos con sus crías».**

El usuario no necesita conocer:

* cómo se proyecta el estado;
* cómo se resuelve el ciclo;
* cómo se persiste el vínculo;
* cómo se relacionan los eventos;
* cómo se determina la proyección.

La complejidad pertenece al dominio.

---

# 41. Evolución futura

El flujo de Parto constituye la base para funcionalidades futuras, entre ellas:

* identificación completa;
* Destete;
* genealogía;
* navegación madre-hijos;
* análisis de descendencia;
* productividad reproductiva;
* estadísticas por ciclo;
* análisis de supervivencia de las crías;
* futuras modalidades reproductivas.

Estas funcionalidades no deben incorporarse artificialmente al flujo de Parto.

El objetivo es que el Parto deje el dominio en un estado suficientemente rico para que puedan construirse sobre él.

---

# 42. Fuera del alcance de este flujo

No forman parte del flujo de Parto:

* Destete;
* Venta;
* Muerte posterior de las crías;
* identificación administrativa completa;
* ubicación posterior;
* selección productiva;
* selección de futuras reproductoras;
* análisis genético avanzado;
* generación de eventos artificiales de cierre o inicio de ciclo.

Estas operaciones utilizan información creada o consolidada por el Parto, pero pertenecen a otros flujos o capacidades.

---

# 43. Resumen operativo

El Parto puede resumirse así:

```text
                    REGISTRAR PARTO
                           │
                           ▼
              validar contexto reproductivo
                           │
                           ▼
                    registrar EVENTO
                           │
                           ▼
                  registrar EVENTO_PARTO
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
      CICLO HISTÓRICO                NACIMIENTOS
      que contiene PARTO                 │
             │                           ▼
             │                      crear ANIMAL
             │                           │
             │                 ┌─────────┴─────────┐
             │                 │                   │
             │                 ▼                   ▼
             │              madre_id          CRÍA + vínculo
             │                                  ACTIVO
             │
             ▼
      crear ciclo actual VACÍA
      cuando corresponda
             │
             ▼
          proyectar
             │
             ▼
      historial reproductivo
```

El resultado fundamental es:

> **El Parto convierte el conocimiento de una gestación en el conocimiento de una nueva generación de animales y abre la fase de dependencia madre-cría que continuará hasta que otros hechos del dominio modifiquen esa situación. El ciclo histórico conserva la historia de ese nacimiento, mientras que la situación reproductiva actual de la madre evoluciona de forma independiente.**
