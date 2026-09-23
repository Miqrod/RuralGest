# PRD009 — Registro de Parto y Consolidación del Nacimiento como Evento Reproductivo

---

# 1. Contexto

Este PRD continúa la evolución del módulo reproductivo iniciada en:

- PRD007 — Registro de Cubrición
- PRD008 — Confirmación de Gestación

No debe interpretarse como una funcionalidad aislada, sino como la siguiente etapa en la consolidación del dominio reproductivo.

Antes de iniciar cualquier implementación deberán revisarse y respetarse los principios, patrones y decisiones arquitectónicas ya definidos en la documentación permanente del proyecto.

Especialmente:

## Especificaciones generales

- `product_spec.md`
- `frontend_spec.md`
- `backend_spec.md`

## Modelo de dominio

- `documentacion/modelo/modelo_ganadero.md`
- `documentacion/modelo/modelo_reproductivo.md`

## Arquitectura

- `documentacion/arquitectura/overview.md`
- `documentacion/arquitectura/domains/reproductive.md`
- `documentacion/arquitectura/patterns/context-rules-projection.md`
- `documentacion/arquitectura/patterns/action-usecase-event.md`

## Documentación histórica de análisis

- `CHAT03.02-CICLO REPRODUCTIVO.txt`

Las decisiones contenidas en dichos documentos tienen prioridad sobre cualquier interpretación realizada durante la implementación.

En particular, este PRD asume como ya consolidados los siguientes principios:

- El modelo representa conocimiento, no biología.
- Los eventos constituyen la única fuente de verdad (Event First).
- El dominio reproductivo sigue el patrón Context → Rules → Projection.
- La interfaz trabaja mediante acciones de negocio; el dominio trabaja mediante eventos.
- El ciclo reproductivo constituye la unidad narrativa que agrupa todos los eventos reproductivos de una misma historia.
- El Parto no cierra el ciclo reproductivo. Únicamente modifica el estado reproductivo de la madre a **LACTANTE**.
- El resultado del ciclo únicamente se consolida cuando éste finaliza mediante el **Destete**.

Hasta PRD008 el dominio reproductivo gestionaba exclusivamente la evolución reproductiva de un único animal (la madre).

PRD009 supone un cambio cualitativo en el modelo: por primera vez un evento reproductivo no solo modifica el estado de una entidad existente, sino que origina automáticamente nuevas entidades `Animal`, iniciando una nueva generación dentro de la explotación.

El objetivo de este PRD no consiste únicamente en registrar un Parto.

Su finalidad es consolidar el nacimiento como un evento reproductivo completo, capaz de:

- actualizar el estado reproductivo de la madre;
- mantener la coherencia del ciclo reproductivo;
- crear automáticamente las nuevas crías;
- establecer relaciones permanentes entre madre e hijos;
- iniciar el proceso de identificación progresiva de las nuevas crías;
- preparar el dominio para la evolución futura hacia genealogía, productividad reproductiva y gestión completa de la descendencia.

Todas las decisiones adoptadas en este PRD deberán preservar la simplicidad de uso para el ganadero, manteniendo la filosofía **User First** del proyecto y evitando introducir complejidad innecesaria en la interfaz.

---

# 2. Filosofía del PRD

Este PRD continúa desarrollando la filosofía establecida en los anteriores.

El modelo sigue representando conocimiento.

No intenta reconstruir toda la realidad biológica.

No intenta inferir acontecimientos no registrados.

Toda la información gestionada por el sistema debe derivar exclusivamente de hechos conocidos.

El nacimiento constituye uno de esos hechos.

Cuando el usuario registra un parto, el sistema conoce con certeza:

- que ha existido un parto;
- cuántas crías han nacido;
- cuántas han nacido vivas;
- cuántas han nacido muertas;
- quién es la madre;
- a qué ciclo reproductivo pertenece ese parto.

Aunque todavía no se conozcan algunos datos individuales de las crías (sexo, crotal...), su existencia constituye un hecho confirmado.

Por tanto, dichas crías deben pasar a existir inmediatamente como entidades Animal.

La identificación individual podrá completarse posteriormente.

---

# 3. Objetivos

Este PRD persigue cinco objetivos principales.

## 3.1 Consolidar el Parto como evento reproductivo

Registrar correctamente un parto asociado a un ciclo reproductivo existente.

Actualizar el estado reproductivo de la madre.

Mantener abierto el ciclo reproductivo hasta el Destete.

---

## 3.2 Crear automáticamente la nueva generación

Cada parto generará automáticamente tantas entidades Animal como crías nacidas hayan sido registradas.

Estas entidades existirán desde el mismo momento del parto aunque todavía no dispongan de toda su información administrativa.

---

## 3.3 Incorporar el concepto de identificación progresiva

Las nuevas crías podrán incorporarse al sistema con información parcial.

La identificación completa se realizará posteriormente mediante una operación específica.

Esto permitirá mantener la trazabilidad desde el mismo momento del nacimiento sin obligar al usuario a completar inmediatamente toda la información.

---

## 3.4 Consolidar la relación madre-hijos

Cada nueva cría deberá quedar vinculada desde el momento de su creación con:

- su madre;
- el ciclo reproductivo en el que nació;
- el evento de parto que originó su nacimiento.

Esta relación deberá formar parte permanente del modelo.

---

## 3.5 Mejorar la experiencia de usuario

El registro de un parto no debe finalizar únicamente con un cambio de estado.

Debe guiar al usuario hacia la siguiente acción natural:

la identificación de las nuevas crías.

---

# 4. Principios de dominio

Este PRD incorpora un nuevo principio permanente al proyecto.

## La creación de una entidad no implica disponer de toda su información

La existencia de una entidad y su nivel de conocimiento son conceptos diferentes.

Cuando la existencia de un animal constituye un hecho confirmado, dicho animal debe existir inmediatamente en el sistema aunque todavía no se conozca toda su información administrativa.

La completitud del registro se gestionará mediante un estado independiente del modelo de negocio.

Este principio podrá reutilizarse en otros procesos futuros como:

- compras rápidas;
- importaciones;
- integraciones externas;
- altas incompletas.

## Evolución prevista del dominio

La arquitectura definida en este PRD mantiene las reglas reproductivas distribuidas entre los Use Cases y el Contexto Reproductivo existente.

Se considera prevista la futura incorporación de un `ReproductiveEngine` que centralice la ejecución de reglas compartidas cuando la complejidad del dominio lo justifique.

La implementación de dicho motor queda expresamente fuera del alcance de este PRD para evitar introducir complejidad innecesaria antes de disponer del conjunto completo de funcionalidades reproductivas.

---

# 5. Alcance

Este PRD incluye:

- registro del evento Parto;
- actualización del estado reproductivo;
- creación automática de las nuevas crías;
- creación de relaciones madre-hijos;
- creación del nuevo estado administrativo de identificación;
- nuevo flujo de identificación progresiva;
- incorporación del widget Historial reproductivo;
- primer Drawer del sistema;
- primer widget del futuro Dashboard.

Quedan explícitamente fuera del alcance:

- genealogía completa;
- árbol familiar;
- estadísticas reproductivas avanzadas;
- gestión genética;
- dashboard completo;
- edición avanzada del historial reproductivo.

---

# 6. Flujo funcional

El flujo funcional queda definido de la siguiente forma:

Acción del usuario

↓

Registrar Parto

↓

Use Case

↓

Contexto Reproductivo

↓

Rules

↓

Validaciones

↓

Creación Evento Parto

↓

Projection

↓

Actualización de la madre

↓

Creación automática de las crías

↓

Actualización de snapshots

↓

Respuesta al usuario

## 6.1 Flujo arquitectónico

El siguiente diagrama resume la arquitectura completa implicada durante el registro de un Parto.

```text
Acción de negocio
Registrar Parto
        │
        ▼
Use Case
RegistrarPartoUseCase
        │
        ▼
Reproductive Context
        │
        ▼
AnimalReproductiveRules
        │
        ▼
Evento
PARTO
        │
        ▼
Projection
        │
        ├──────────────► Actualizar estado reproductivo de la madre
        │
        ├──────────────► Actualizar ciclo reproductivo
        │
        ├──────────────► Crear entidades Animal
        │
        ├──────────────► Crear relaciones madre-hijos
        │
        └──────────────► Actualizar snapshots
                               │
                               ▼
Interfaz de usuario
```

Todo el proceso deberá ejecutarse dentro de una única transacción para garantizar la coherencia del dominio.

---

# 7. Reglas funcionales del Parto

El evento Parto podrá registrarse cuando:

- exista una Cubrición registrada;
- o exista una Confirmación de Gestación.

No será posible registrar un Parto si no existe ningún conocimiento previo del ciclo.

En ese caso será obligatorio registrar previamente una Confirmación de Gestación.

El Parto:

- NO cierra el ciclo reproductivo;
- NO determina todavía el resultado del ciclo;
- únicamente cambia el estado reproductivo del animal a LACTANTE.

El resultado definitivo continuará consolidándose exclusivamente mediante el Destete.

Esta decisión mantiene intacto el modelo definido en PRD008.

---

# 8. Modelo de datos

El registro de un Parto introduce por primera vez la necesidad de almacenar información específica del propio nacimiento.

Hasta ahora la tabla `evento` ha sido suficiente para representar los hechos ocurridos en el dominio.

Sin embargo, el Parto incorpora información propia que no pertenece al modelo genérico de eventos y que deberá poder consultarse posteriormente de forma estructurada.

Por este motivo se incorpora una nueva entidad especializada.

## Nueva tabla `evento_parto`

Relación 1:1 con la tabla `evento`.

Esta tabla contendrá exclusivamente la información específica del nacimiento.

Campos iniciales:

- evento_id (PK/FK)
- numero_nacidos
- numero_vivos
- numero_muertos
- tipo_parto
    - natural
    - asistido
- observaciones (nullable)

Esta estructura permitirá evolucionar el dominio reproductivo sin sobrecargar la tabla genérica de eventos ni recurrir a estructuras JSON para información que previsiblemente será consultada y utilizada por múltiples funcionalidades futuras.

La tabla `evento_parto` almacena exclusivamente información específica del nacimiento.

La relación con el ciclo reproductivo no se persiste nuevamente, ya que ésta ya queda representada mediante la relación:

evento_parto → evento → ciclo_reproductivo.

Este diseño evita duplicar información y garantiza la existencia de una única fuente de verdad para la pertenencia de un evento a un ciclo reproductivo.

---

# 9. Creación automática de las crías

El registro de un Parto deberá provocar automáticamente la creación de tantas entidades `Animal` como nacimientos hayan sido registrados.

Esta creación constituye una consecuencia directa del evento Parto y deberá realizarse dentro de la misma transacción.

El usuario no tendrá que crear posteriormente cada animal de forma manual.

## Filosofía

El sistema representa conocimiento.

Cuando el usuario registra un parto, el nacimiento de las crías constituye un hecho confirmado.

Aunque todavía no se conozca toda la información individual de cada una de ellas, su existencia ya forma parte del conocimiento de la explotación.

Por tanto:

- las crías existirán inmediatamente como entidades Animal;
- su información podrá completarse posteriormente.

No existirán conceptos como:

- animal provisional;
- animal pendiente de crear;
- nacimiento pendiente de registrar.

Las crías serán animales desde el mismo instante en que el Parto quede registrado.

---

# 10. Información inicial de las nuevas crías

Cada nuevo Animal se creará automáticamente con toda la información conocida en el momento del registro del Parto.

Entre ella:

- fecha_nacimiento;
- origen = INTERNO;
- madre_id;
- padre_id (*cuando el padre sea conocido, como ocurre actualmente en la monta natural*);
- parto_evento_id;
- evento_creacion_id;
- estado_vital;
- estado_identificacion;
- tipo_productivo = RECRÍA;
- raza.

## Tipo productivo

Todas las crías se crearán inicialmente con:

tipo_productivo = RECRÍA

Esta decisión representa correctamente el uso productivo inicial del animal dentro de la explotación y mantiene la coherencia con el modelo ganadero existente.

La futura selección como reproductora o el paso a engorde continuarán realizándose mediante los procesos ya definidos en el dominio.

## Cálculo de la raza

La raza de cada nueva cría se calculará automáticamente durante el registro del Parto a partir de la raza de sus progenitores.

Inicialmente se aplicarán las siguientes reglas:

- Si ambos progenitores pertenecen a la misma raza, la cría heredará dicha raza.
- Si los progenitores pertenecen a razas distintas, la cría se clasificará automáticamente como **CRUZADA**.

Esta lógica deberá implementarse como una regla del dominio, de forma que pueda evolucionar en el futuro sin afectar al flujo funcional del registro del Parto.

Quedan fuera del alcance de este PRD otros escenarios más complejos, como el cálculo de porcentajes raciales, retrocruces o futuras modalidades reproductivas como la inseminación artificial.

## Información pendiente

Inicialmente permanecerán sin informar, entre otros:

- crotal;
- sexo.

Estos datos se completarán posteriormente mediante el flujo de identificación del animal.

---

# 11. Relación madre – hijos

Este PRD incorpora definitivamente la relación permanente entre una madre y todas sus crías.

Cada Animal nacido mediante un Parto deberá conservar:

- madre_id
- parto_evento_id

Estas relaciones pasarán a formar parte permanente del modelo.

La pertenencia de una cría al ciclo reproductivo podrá obtenerse siempre mediante la relación:

Animal → parto_evento_id → Evento → ciclo_reproductivo_id

Por este motivo no se almacenará `ciclo_reproductivo_id` en la entidad `Animal` ni en `evento_parto`, evitando duplicar relaciones ya representadas por el modelo.

Su finalidad no se limita al módulo reproductivo.

Constituyen la base necesaria para futuras funcionalidades como:

- genealogía;
- productividad reproductiva;
- rendimiento por línea materna;
- navegación entre generaciones;
- estadísticas reproductivas.

La creación de estas relaciones deberá realizarse de forma atómica junto con el registro del Parto y la creación de las nuevas entidades Animal.

En ningún caso podrá existir un Parto registrado sin sus correspondientes crías, ni crías creadas sin el Parto que les dio origen.

---

# 12. Estado de identificación

Las nuevas crías podrán incorporarse al sistema sin disponer todavía de toda la información necesaria para su identificación individual.

Para representar este hecho se incorpora un nuevo campo a la entidad `Animal`:

estado_identificacion

Este campo representa un estado administrativo independiente del modelo ganadero y permitirá conocer si un animal dispone ya de la información mínima necesaria para considerarse correctamente identificado.

Valores posibles:

- PENDIENTE
- COMPLETA

Este estado no representa ninguna característica biológica, sanitaria ni productiva.

Su única finalidad consiste en indicar el grado de identificación administrativa del animal dentro de la explotación.

---

# 13. AnimalIdentificationRules

La determinación del estado de identificación no dependerá de la interfaz.

Será responsabilidad exclusiva del dominio.

Para ello se incorporará un nuevo conjunto de reglas:

AnimalIdentificationRules

Estas reglas serán las únicas responsables de determinar cuándo un animal pasa de:

PENDIENTE

a

COMPLETA.

Inicialmente un animal quedará correctamente identificado cuando disponga, como mínimo, de:

- crotal;
- sexo.

La implementación deberá diseñarse de forma que estos criterios puedan evolucionar en el futuro sin necesidad de modificar la interfaz.

---

# 14. AnimalIdentificationStatus

AnimalIdentificationRules no devolverá únicamente un valor booleano.

El dominio proporcionará una estructura más rica que permita conocer exactamente qué información continúa pendiente.

Conceptualmente:

AnimalIdentificationStatus

contendrá:

- estado de identificación;
- campos pendientes de completar.

Esta decisión permitirá reutilizar las mismas reglas desde:

- Drawer de identificación;
- Dashboard;
- futuras validaciones;
- otros módulos del sistema.

La interfaz nunca decidirá qué significa que un animal esté correctamente identificado.

Únicamente representará el resultado proporcionado por el dominio.

---

# 15. Animales nacidos muertos

Los animales nacidos muertos también deberán crearse automáticamente como entidades Animal.

Su existencia constituye un hecho confirmado y debe formar parte permanente de la historia de la explotación.

Estos animales nacerán directamente con:

estado_vital = MUERTO

No obstante, AnimalIdentificationRules únicamente aplicará a animales vivos.

Por tanto, los animales nacidos muertos pasarán automáticamente a:

estado_identificacion = COMPLETA

ya que no existe ninguna acción pendiente por parte del usuario para completar su identificación administrativa.

Esta decisión evita generar falsos pendientes de identificación y mantiene la coherencia entre el modelo y la operativa diaria de la explotación.

# 15.1 Resumen de cambios sobre el modelo de datos

| Elemento | Cambio |
|----------|---------|
| `evento_parto` | Nueva tabla especializada (1:1 con `evento`) |
| `animal.estado_identificacion` | Nuevo campo |
| `animal.madre_id` | Se utiliza para relacionar madre e hijos |
| `animal.padre_id` | Se informa automáticamente cuando exista (monta natural) |
| `animal.parto_evento_id` | Nuevo campo |
| `animal.tipo_productivo` | Se inicializa como `RECRÍA` |
| `animal.raza` | Se calcula automáticamente según la raza de los progenitores |
| `AnimalIdentificationRules` | Nuevo conjunto de reglas de dominio |
| `AnimalIdentificationStatus` | Nuevo objeto de respuesta del dominio |

---

# 16. Interfaz de usuario

El objetivo principal de la interfaz no consiste únicamente en registrar un Parto.

Debe acompañar al usuario durante todo el proceso de incorporación de una nueva generación de animales a la explotación.

La aplicación deberá minimizar el número de acciones necesarias y guiar al usuario de forma natural hacia la siguiente tarea pendiente.

El usuario nunca deberá preguntarse qué debe hacer después de registrar un Parto.

La propia aplicación deberá indicárselo.

---

# 17. Formulario "Registrar Parto"

La acción **Registrar Parto** continuará representando una única acción de negocio desde el punto de vista del usuario.

El formulario solicitará exclusivamente la información necesaria para registrar el nacimiento.

Campos iniciales:

- Fecha del parto.
- Número de crías nacidas.
- Número de crías vivas.
- Número de crías muertas.
- Tipo de parto.
    - Natural.
    - Asistido.
- Observaciones (opcional).

Al confirmar el formulario, el dominio ejecutará toda la lógica necesaria para:

- registrar el evento;
- actualizar el estado reproductivo de la madre;
- crear automáticamente las nuevas crías;
- establecer las relaciones correspondientes;
- actualizar las proyecciones.

Todo este proceso deberá realizarse de forma transparente para el usuario.

---

# 18. Confirmación del registro

Tras registrar correctamente el Parto, la aplicación mostrará un mensaje de confirmación.

Ejemplo:

> Parto registrado correctamente.
>
> Se han creado automáticamente 4 nuevos animales.

La confirmación no mostrará información relativa a animales pendientes de identificar.

La siguiente pantalla será la encargada de guiar al usuario hacia esa tarea.

---

# 19. Historial reproductivo

La ficha del animal incorporará un nuevo widget denominado:

**Historial reproductivo**

Este widget sustituye la idea inicial de mostrar únicamente información del último parto.

Su objetivo consiste en ofrecer una visión resumida de la evolución reproductiva del animal organizada por ciclos reproductivos.

Internamente cada elemento del carrusel representa un ciclo reproductivo completo.

Este detalle permanece oculto para el usuario.

La interfaz únicamente mostrará un historial reproductivo fácilmente interpretable.

---

## 19.1 Organización

El widget utilizará un carrusel.

El primer elemento mostrará siempre el ciclo reproductivo actual.

Los elementos siguientes mostrarán los ciclos anteriores ordenados cronológicamente.

El usuario podrá navegar libremente entre ellos.

---

## 19.2 Adaptación automática del contenido

El nivel de detalle dependerá del momento en que se encuentre el ciclo.

### Ciclo actual antes del Parto

Mientras todavía no exista un Parto registrado, el widget mostrará la información necesaria para gestionar correctamente el ciclo reproductivo.

Entre ella:

- estado reproductivo;
- fecha de cubrición;
- fecha de confirmación de gestación (si existe);
- fecha prevista de parto.

El objetivo consiste en facilitar la toma de decisiones durante el seguimiento de la gestación.

---

### Ciclo actual tras el Parto

Una vez registrado el Parto, el foco operativo deja de estar en la gestación y pasa a estar en las nuevas crías.

Por este motivo el widget modificará automáticamente la información mostrada.

A partir de ese momento presentará el mismo formato que los ciclos históricos.

La información correspondiente a Cubrición o Confirmación de Gestación dejará de mostrarse al usuario, aunque continuará formando parte de la historia del ciclo y permanecerá accesible desde el historial general de eventos.

---

### Ciclos históricos

Los ciclos ya finalizados mostrarán únicamente la información relevante para comprender el resultado reproductivo obtenido.

Entre ella:

- fecha del Parto;
- número de crías nacidas;
- número de muertes (únicamente cuando sea superior a cero);
- listado de las crías asociadas.

Si el ciclo hubiera finalizado mediante un resultado distinto del esperado, el widget mostrará de forma destacada dicho resultado.

Por ejemplo:

- Aborto.
- Venta.
- Muerte.
- Desconocido.

No se mostrará información operativa perteneciente a la fase de gestación de ciclos ya finalizados, ya que deja de aportar valor para la gestión diaria de la explotación.

---

# 20. Listado de crías

Cada ciclo que incluya un Parto mostrará el listado de las crías generadas.

Para cada una de ellas se visualizará, siempre que la información esté disponible:

- crotal;
- nombre (si existe);
- sexo;
- raza.

El orden de presentación será estable y vendrá determinado por:

- created_at;
- id.

Este orden responde exclusivamente a criterios de persistencia y representación.

No representa el orden real de nacimiento de las crías.

El modelo nunca almacenará un supuesto orden de nacimiento cuando dicho conocimiento no exista realmente.

---

# 21. Identificación rápida

Cuando una cría permanezca pendiente de identificación, el widget mostrará una acción rápida:

**Identificar**

Esta acción abrirá un Drawer específico.

No será necesario acceder previamente a la ficha completa del animal.

El objetivo consiste en reducir al mínimo el número de acciones necesarias para completar el proceso iniciado con el Parto.

Esta constituye la primera implementación del patrón Drawer dentro de la aplicación y servirá como referencia para futuras funcionalidades.

---

# 22. Drawer de identificación

El Drawer mostrará toda la información utilizada por AnimalIdentificationRules.

Su finalidad no consiste únicamente en solicitar datos al usuario.

También debe proporcionar el contexto suficiente para comprender qué información ya conoce el sistema y cuál continúa pendiente.

Por este motivo el Drawer mostrará todos los campos pertenecientes a AnimalIdentificationRules.

Los campos ya conocidos aparecerán en modo solo lectura.

Los campos pendientes aparecerán como editables.

Inicialmente el usuario únicamente deberá completar:

- crotal;
- sexo.

Tras guardar los cambios, el dominio volverá a evaluar AnimalIdentificationRules.

Si ya se cumplen todos los criterios definidos por dichas reglas, el estado del animal pasará automáticamente a:

estado_identificacion = COMPLETA

La interfaz nunca decidirá cuándo un animal se considera correctamente identificado.

Únicamente representará el resultado obtenido desde el dominio.

---

# 23. Dashboard v0

Aunque el Dashboard completo no forma parte del alcance de este PRD, el nacimiento del nuevo estado administrativo `estado_identificacion` introduce la necesidad de comenzar a construir el futuro panel operacional de la aplicación.

Por este motivo, PRD009 incorporará el primer widget del Dashboard.

## Widget: Animales pendientes de identificar

El widget mostrará el número total de animales vivos cuyo:

estado_identificacion = PENDIENTE

Su finalidad consiste en recordar al usuario qué animales requieren todavía completar su identificación.

Este widget constituye la primera pieza del futuro Dashboard operacional y establece el patrón que seguirán los siguientes indicadores del sistema.

---

# 24. Reglas generales del dominio

Este PRD incorpora las siguientes reglas permanentes al modelo de dominio.

## Creación automática de entidades

El evento Parto genera automáticamente nuevas entidades Animal.

La creación de estas entidades forma parte del propio evento y deberá realizarse dentro de la misma transacción.

En ningún caso podrá existir un Parto registrado sin sus correspondientes crías ni crías creadas sin el Parto que les dio origen.

---

## Identificación progresiva

La creación de una entidad no implica disponer de toda su información.

El sistema permite la existencia de entidades parcialmente conocidas siempre que su existencia constituya un hecho confirmado.

La identificación constituye un proceso posterior independiente del nacimiento.

---

## Persistencia exclusiva de conocimiento confirmado

El sistema únicamente persistirá conocimiento confirmado.

Cuando sea necesario establecer un orden para facilitar la representación visual, se utilizarán criterios técnicos derivados de la persistencia (por ejemplo `created_at` e `id`) sin convertir dichos criterios en conocimiento del dominio.

---

## Separación entre dominio y estados administrativos

El estado de identificación constituye un estado administrativo.

No representa ninguna característica ganadera.

No deberá mezclarse con:

- estado vital;
- estado reproductivo;
- estado sanitario;
- tipo productivo.

Cada uno de ellos continuará representando conceptos distintos dentro del modelo.

---

# 25. Casos límite

El dominio deberá soportar correctamente, entre otros, los siguientes escenarios.

## Parto simple

Una única cría.

---

## Parto múltiple

Creación automática de tantas entidades Animal como nacimientos hayan sido registrados.

---

## Nacimiento con mortalidad parcial

Las crías vivas permanecerán pendientes de identificación.

Las crías nacidas muertas se crearán automáticamente con:

estado_vital = MUERTO

y

estado_identificacion = COMPLETA.

---

## Parto registrado sin confirmación de gestación

Permitido.

Siempre que exista previamente una Cubrición registrada.

---

## Parto registrado mediante confirmación de gestación sin cubrición previa

Permitido.

Siempre que el ciclo reproductivo haya sido iniciado correctamente mediante una Confirmación de Gestación.

---

## Intento de registrar un Parto sin ningún evento reproductivo previo

No permitido.

El sistema deberá solicitar previamente una Confirmación de Gestación.

---

# 26. Decisiones de diseño

Durante el análisis de este PRD se han adoptado las siguientes decisiones que deberán considerarse consolidadas.

- El Parto crea automáticamente nuevas entidades Animal.
- Las nuevas crías existen desde el momento del nacimiento aunque su identificación sea incompleta.
- El tipo_productivo inicial será RECRÍA.
- La raza se calculará automáticamente a partir de ambos progenitores.
- Los animales nacidos muertos también se crearán como entidades Animal.
- AnimalIdentificationRules únicamente aplica a animales vivos.
- El Historial reproductivo representa ciclos reproductivos, aunque este detalle permanezca oculto para el usuario.
- El nivel de detalle del Historial reproductivo evoluciona automáticamente junto con el ciclo.
- El modelo no duplicará la relación con el ciclo reproductivo en las entidades Animal ni evento_parto. La pertenencia al ciclo se obtendrá siempre a través del evento que originó el nacimiento.

---

# 27. Fuera del alcance

Este PRD no incluye:

- genealogía;
- árbol familiar;
- navegación entre generaciones;
- estadísticas reproductivas avanzadas;
- indicadores de productividad;
- edición del historial reproductivo;
- cálculo avanzado de razas;
- soporte para inseminación artificial;
- reproducción asistida;
- dashboard completo;
- automatización de procesos posteriores al destete.

El diseño realizado en este PRD deberá facilitar la futura incorporación de dichas funcionalidades sin necesidad de modificar el modelo de dominio.

---

# 28. Impacto sobre funcionalidades existentes

La implementación de este PRD modifica o amplía funcionalidades ya existentes del sistema.

## Backend

- Nuevo caso de uso RegistrarParto.
- Nueva tabla `evento_parto`.
- Actualización del Contexto Reproductivo.
- Ampliación de AnimalReproductiveRules.
- Nuevas proyecciones derivadas del Parto.
- Creación automática de entidades Animal.
- Implementación de AnimalIdentificationRules.
- Implementación de AnimalIdentificationStatus.

## Base de datos

- Nueva tabla `evento_parto`.
- Nuevo campo `estado_identificacion`.
- Nuevo campo `parto_evento_id`.

## Frontend

- Nuevo formulario Registrar Parto.
- Nuevo Drawer de Identificación.
- Nuevo widget Historial reproductivo.
- Nueva acción rápida Identificar.
- Actualización de la ficha del animal.

## Dashboard

- Incorporación del primer widget operacional:
    - Animales pendientes de identificar.

---

# 29. Criterios de aceptación

Se considerará completado este PRD cuando se cumplan todos los siguientes criterios.

## Dominio

- Existe un nuevo evento Parto completamente integrado en el dominio reproductivo.
- El estado reproductivo pasa correctamente a LACTANTE.
- El ciclo reproductivo permanece abierto hasta el Destete.
- El evento Parto queda asociado al ciclo correspondiente.

---

## Persistencia

- Existe la nueva tabla `evento_parto`.
- El Parto genera automáticamente tantas entidades Animal como nacimientos registrados.

Cada nueva cría queda relacionada con:

- madre_id;
- padre_id (cuando exista);
- parto_evento_id.

La pertenencia al ciclo reproductivo deberá poder obtenerse de forma determinista a través del evento de Parto, sin necesidad de persistir dicha relación en la entidad Animal.

---

## Identificación

- Existe el nuevo campo `estado_identificacion` en la entidad Animal.
- Se implementan AnimalIdentificationRules.
- Se implementa AnimalIdentificationStatus.
- Los animales vivos nacen con:
    estado_identificacion = PENDIENTE.
- Los animales nacidos muertos nacen con:
    estado_identificacion = COMPLETA.

---

## Interfaz

- Existe la acción Registrar Parto.
- Existe el formulario correspondiente.
- Se muestra el mensaje de confirmación tras registrar correctamente un Parto.
- La ficha del animal incorpora el widget Historial reproductivo.
- El widget permite navegar entre ciclos reproductivos.
- El widget muestra las crías asociadas al Parto.
- Existe la acción rápida Identificar.
- El Drawer de identificación funciona correctamente.
- El estado de identificación se actualiza automáticamente tras completar la información requerida.

---

## Dashboard

- Existe el widget "Animales pendientes de identificar".
- El widget refleja correctamente el número de animales vivos pendientes de identificación.

---

# 30. Resultado esperado

Al finalizar PRD009 el dominio reproductivo será capaz de gestionar de forma completa el nacimiento de una nueva generación de animales.

El registro de un Parto dejará de ser únicamente un cambio de estado sobre la madre para convertirse en un proceso completo que:

- registra el nacimiento;
- crea automáticamente las nuevas crías;
- mantiene la trazabilidad entre generaciones;
- inicia el proceso de identificación individual;
- prepara el modelo para la futura evolución hacia genealogía, productividad reproductiva y análisis avanzado de la explotación.

Con este PRD queda consolidado el flujo reproductivo comprendido entre la Cubrición y el nacimiento de una nueva generación de animales, manteniendo los principios arquitectónicos del proyecto y priorizando en todo momento una experiencia de usuario sencilla, guiada y adaptada a la realidad operativa de una explotación ganadera.