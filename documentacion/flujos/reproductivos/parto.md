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
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
          MADRE          CICLO          CRÍAS
            │              │              │
            ▼              ▼              ▼
        LACTANTE        continúa       nacen como
                         abierto         ANIMAL
                                           │
                              ┌────────────┼────────────┐
                              │            │            │
                              ▼            ▼            ▼
                         madre_id     tipo_productivo  vínculo
                                      = CRÍA           = ACTIVO
```

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

con:

```text
estado reproductivo de la madre = LACTANTE
```

El evento constituye la fuente de verdad.

El estado `LACTANTE` es una consecuencia derivada del evento y del contexto reproductivo.

---

## 2.4 El Parto no cierra el ciclo

El Parto **no finaliza el ciclo reproductivo**.

El nacimiento inicia una nueva fase del mismo proceso:

```text
gestación
   ↓
PARTO
   ↓
dependencia madre-cría
   ↓
lactancia
   ↓
finalización de los vínculos
   ↓
fin del ciclo
```

La madre pasa a `LACTANTE`, pero el ciclo permanece abierto.

El cierre posterior dependerá de la existencia de vínculos maternos funcionales, según las reglas del dominio reproductivo.

---

# 3. Conceptos implicados

El flujo de Parto conecta varios conceptos que conviene mantener diferenciados.

| Concepto                         | Significado                                                   |
| -------------------------------- | ------------------------------------------------------------- |
| `PARTO`                          | Hecho reproductivo registrado                                 |
| `ciclo_reproductivo`             | Contexto al que pertenece el Parto                            |
| `Animal`                         | Entidad que representa cada animal individual                 |
| `madre_id`                       | Relación genealógica permanente                               |
| `estado_vinculo_materno`         | Estado derivado de la dependencia funcional madre-cría        |
| `tipo_productivo = CRÍA`         | Clasificación productiva inicial de una cría viva dependiente |
| `estado_reproductivo = LACTANTE` | Estado reproductivo proyectado de la madre tras el Parto      |
| `evento_parto`                   | Información estructurada específica del nacimiento            |
| `estado_identificacion`          | Grado de completitud de la identificación administrativa      |

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
Reproductive Context
        │
        ▼
Reproductive Rules
        │
        ▼
Validación
        │
        ▼
Evento PARTO
        │
        ├───────────────┐
        │               │
        ▼               ▼
     Madre            Crías
        │               │
        ▼               ▼
   LACTANTE        nuevas entidades
                        │
                        ▼
                vínculo materno
                        │
                        ▼
                   Proyección
                        │
                        ▼
                  Snapshots / UI
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

Una cría viva nacida mediante Parto se crea inicialmente como:

```text
tipo_productivo = CRÍA
```

`CRÍA` no significa simplemente "animal joven".

Representa un animal que se encuentra en la etapa lactante y mantiene un vínculo funcional activo con su madre.

La evolución normal es:

```text
PARTO
  ↓
CRÍA + ACTIVO
  ↓
DESTETE
  ↓
RECRÍA + FINALIZADO
```

El cambio a `RECRÍA` pertenece al flujo de Destete.

No debe realizarse durante el Parto.

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

Después de registrar correctamente el Parto:

```text
estado_reproductivo = LACTANTE
```

Esto indica que la madre se encuentra en la fase reproductiva asociada al nacimiento y a la dependencia de las crías.

No significa que el ciclo haya terminado.

```text
PARTO
  ↓
LACTANTE
  ↓
ciclo continúa
```

---

# 22. El ciclo reproductivo después del Parto

El Parto pertenece al ciclo reproductivo actual.

No crea un nuevo ciclo.

La secuencia conceptual es:

```text
Ciclo
  │
  ├── Cubrición
  │
  ├── Confirmación (si existe)
  │
  └── Parto
          │
          ▼
       LACTANTE
          │
          ▼
     vínculos madre-cría
          │
          ▼
       Destete /
       Venta /
       Muerte
          │
          ▼
   evaluación de vínculos
```

El ciclo permanece abierto mientras exista dependencia funcional relevante.

El detalle de la finalización del ciclo pertenece al flujo de Destete y a las reglas generales de dependencia madre-cría.

---

# 23. Consecuencias sobre la madre y las crías

Una forma útil de entender el Parto es separar sus consecuencias por entidad.

| Entidad        | Consecuencia                                |
| -------------- | ------------------------------------------- |
| Madre          | Estado reproductivo → `LACTANTE`            |
| Ciclo          | Permanece abierto                           |
| Cría viva      | Nueva entidad `Animal`                      |
| Cría viva      | `tipo_productivo = CRÍA`                    |
| Cría viva      | `estado_vinculo_materno = ACTIVO`           |
| Cría viva      | `madre_id = madre`                          |
| Cría muerta    | Nueva entidad `Animal`                      |
| Cría muerta    | `estado_vital = MUERTO`                     |
| Cría muerta    | `tipo_productivo = NULL`                    |
| Cría muerta    | No crea dependencia funcional activa        |
| Historial      | Se registra el evento Parto                 |
| Identificación | Puede quedar pendiente para las crías vivas |

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

* que el Parto se ha registrado;
* que las nuevas crías existen;
* cuáles están pendientes de identificación;
* que la madre se encuentra en `LACTANTE`;
* qué acción puede realizarse a continuación.

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

| Pertenece al Parto                         | No pertenece al Parto              |
| ------------------------------------------ | ---------------------------------- |
| Registrar el nacimiento                    | Destetar                           |
| Crear las nuevas crías                     | Cambiar CRÍA → RECRÍA              |
| Establecer `madre_id`                      | Finalizar vínculos posteriormente  |
| Crear vínculo inicial                      | Cerrar el ciclo                    |
| Calcular raza inicial                      | Crear el siguiente ciclo           |
| Establecer estado vital inicial            | Venta posterior                    |
| Estado productivo inicial                  | Muerte posterior                   |
| Estado reproductivo de la madre            | Identificación completa            |
| Registrar información específica del Parto | Gestión posterior de ubicación     |
| Preparar la identificación                 | Decisiones productivas posteriores |

Esta separación es importante porque una consecuencia del Parto puede ser el inicio de otro flujo sin formar parte de él.

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

El Parto crea las condiciones para el futuro Destete.

El flujo es:

```text
PARTO
  ↓
CRÍA + ACTIVO
  ↓
...
  ↓
DESTETE
  ↓
RECRÍA + FINALIZADO
```

El Parto no decide cuándo se produce el Destete.

Tampoco decide cuándo finaliza el ciclo.

Su responsabilidad termina después de haber creado correctamente el nuevo estado de conocimiento derivado del nacimiento.

---

# 35. Casos relevantes

## Caso A — Una cría viva

```text
Parto
↓
1 nacimiento vivo
↓
1 Animal
↓
CRÍA + ACTIVO
↓
Madre = LACTANTE
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

El ciclo permanecerá abierto mientras exista al menos uno de ellos.

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
LACTANTE
```

El flujo es válido.

La ausencia de Cubrición registrada no impide la continuidad posterior del ciclo.

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

### Invariante 7 — El Parto no cierra el ciclo

Después del Parto:

```text
estado_reproductivo = LACTANTE
ciclo = abierto
```

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
             │              PARTO
             │                   │
             └─────────┬─────────┘
                       ↓
              REPRODUCTIVE CONTEXT
                       ↓
              REPRODUCTIVE RULES
                       ↓
                Registrar Parto
                       ↓
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
        MADRE                    CRÍAS
          │                         │
          ▼                         ▼
      LACTANTE              crear Animal
                                    │
                         ┌──────────┼──────────┐
                         │          │          │
                         ▼          ▼          ▼
                     madre_id     CRÍA      vínculo
                                  vivo       ACTIVO
                         │
                         ▼
                    PROJECTION
                         │
                         ▼
                 HISTORIAL REPRODUCTIVO
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

* `estado_reproductivo = LACTANTE`;
* ciclo reproductivo actual;
* crías asociadas al Parto;
* vínculos maternos activos.

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

> **"He registrado que esta vaca ha parido. El sistema ha creado sus crías y las ha relacionado con ella. La vaca está ahora lactando. Las crías que están vivas y dependen de ella aparecen como crías y podrán identificarse y gestionarse posteriormente."**

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
* cierre del ciclo;
* creación del siguiente ciclo;
* Venta;
* Muerte posterior de las crías;
* identificación administrativa completa;
* ubicación posterior;
* selección productiva;
* selección de futuras reproductoras;
* análisis genético avanzado;
* detección de discontinuidad temporal;
* `TIMEOUT`;
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
           MADRE                       NACIMIENTOS
             │                           │
             ▼                           ▼
         LACTANTE                  crear ANIMAL
                                         │
                            ┌────────────┼────────────┐
                            │            │            │
                            ▼            ▼            ▼
                         madre_id       CRÍA       vínculo
                                      si vivo       ACTIVO
                            │
                            ▼
                       proyectar
                            │
                            ▼
                   historial reproductivo
```

El resultado fundamental es:

> **El Parto convierte el conocimiento de una gestación en el conocimiento de una nueva generación de animales y abre la fase de dependencia madre-cría que continuará hasta que otros hechos del dominio modifiquen esa situación.**
