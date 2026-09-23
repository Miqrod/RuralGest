# Objetivos Fase 09 — Registro de Parto y Consolidación del Nacimiento como Evento Reproductivo

---

# Objetivo general

Implementar el registro de Parto como un evento reproductivo completo, consolidando el nacimiento de una nueva generación de animales dentro del dominio ganadero.

La implementación deberá apoyarse íntegramente en la arquitectura desarrollada durante PRD007 y PRD008, reutilizando el Contexto Reproductivo existente y ampliándolo para soportar la creación automática de nuevas entidades Animal, su identificación progresiva y la evolución de la interfaz hacia un flujo de trabajo guiado.

El objetivo de esta fase no consiste únicamente en registrar un nuevo evento.

Su finalidad es transformar el nacimiento en un proceso completo que acompañe al usuario desde el registro del Parto hasta la incorporación efectiva de las nuevas crías a la explotación.

---

# Objetivos funcionales

- Permitir registrar un evento Parto desde la ficha de una hembra reproductora.
- Actualizar correctamente el estado reproductivo de la madre.
- Mantener abierto el ciclo reproductivo hasta el Destete.
- Crear automáticamente todas las crías nacidas.
- Relacionar permanentemente madre e hijos.
- Incorporar el proceso de identificación progresiva de las nuevas crías.
- Mostrar el historial reproductivo directamente desde la ficha del animal.
- Facilitar la identificación inmediata de las crías mediante un Drawer específico.

---

# Objetivos de dominio

Consolidar el nacimiento como un hecho capaz de modificar simultáneamente varias entidades del dominio.

La implementación deberá garantizar que:

- el Parto continúa siendo un Evento;
- el ciclo reproductivo mantiene su coherencia;
- las nuevas entidades Animal se crean automáticamente;
- las relaciones madre-hijos quedan establecidas desde el nacimiento;
- todas las reglas permanecen centralizadas dentro del dominio.

La creación automática de las crías forma parte del propio evento Parto y no constituye un proceso independiente.

---

# Objetivos de arquitectura

Reutilizar completamente el patrón:

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

Sin introducir lógica de negocio en:

- componentes Frontend;
- formularios;
- Drawer;
- Dashboard.

Toda la lógica continuará concentrándose en el dominio.

---

# Objetivos de calidad

Esta fase marca el momento en el que el proyecto comienza a requerir mecanismos sistemáticos de protección frente a regresiones.

A partir de PRD009 toda nueva funcionalidad deberá incorporar las comprobaciones necesarias para garantizar que el comportamiento previamente implementado continúa funcionando correctamente.

Siempre que resulte posible deberán añadirse pruebas automatizadas para las reglas de dominio, los casos de uso y los flujos reproductivos.

Cuando una funcionalidad afecte a procesos existentes, deberán revisarse expresamente dichos procesos antes de considerar finalizada la implementación.

El objetivo no consiste únicamente en validar la nueva funcionalidad, sino en asegurar que ninguna funcionalidad previamente consolidada haya dejado de funcionar.

---

# Objetivos de modelo de datos

Incorporar los cambios necesarios para representar correctamente el nacimiento.

Entre ellos:

- nueva tabla `evento_parto`;
- nuevo campo `estado_identificacion`;
- nuevo campo `parto_evento_id`;
- utilización de `madre_id`;
- utilización de `padre_id`;

Preparar el modelo para futuras funcionalidades relacionadas con genealogía y productividad reproductiva.

---

# Objetivos Backend

Implementar:

- RegistrarPartoUseCase.
- actualización del Contexto Reproductivo.
- ampliación de AnimalReproductiveRules.
- AnimalIdentificationRules.
- AnimalIdentificationStatus.
- creación automática de las nuevas entidades Animal.
- cálculo automático de la raza.
- asignación automática del tipo productivo inicial.
- persistencia transaccional de todo el proceso.
- Crear un dataset de desarrollo suficientemente rico para validar todas las situaciones contempladas por el dominio reproductivo.

El dataset deberá incluir, al menos:

- varios ciclos reproductivos;
- cubriciones;
- confirmaciones de gestación;
- partos simples;
- partos múltiples;
- abortos;
- animales vivos;
- animales nacidos muertos;
- crías pendientes de identificar;
- crías correctamente identificadas.

Este conjunto de datos permitirá validar correctamente el Historial reproductivo, el Dashboard y futuras funcionalidades sin necesidad de generar información manualmente durante el desarrollo.

---

# Objetivos Frontend

Incorporar:

- formulario Registrar Parto;
- nuevo widget Historial reproductivo;
- Drawer Identificar;
- nueva acción rápida de identificación;
- actualización de la ficha del animal.

Mantener la filosofía User First.

La interfaz deberá guiar al usuario durante todo el flujo sin exponer la complejidad interna del dominio.

---

# Objetivos UX

Tras registrar correctamente un Parto, el usuario deberá comprender inmediatamente:

- que el Parto ha quedado registrado;
- cuántas crías se han creado;
- qué animales requieren todavía identificación.

La aplicación deberá minimizar el número de acciones necesarias para completar el proceso.

La información mostrada deberá evolucionar automáticamente junto con el ciclo reproductivo.

---

# Objetivos Dashboard

Iniciar la construcción del Dashboard operacional mediante un primer widget.

Implementar:

Animales pendientes de identificar.

Este widget deberá reflejar el número de animales vivos cuyo:

estado_identificacion = PENDIENTE

y servirá como base para la futura evolución del Dashboard.

---

# Orden recomendado de implementación

## Fase 1 — Modelo de datos

- Crear la tabla `evento_parto`.
- Añadir nuevos campos a `animal`.
- Actualizar relaciones.

---

## Fase 2 — Dominio

- RegistrarPartoUseCase.
- AnimalReproductiveRules.
- AnimalIdentificationRules.
- AnimalIdentificationStatus.

---

## Fase 3 — Persistencia

- Registrar el evento Parto.
- Crear automáticamente las nuevas crías.
- Crear relaciones madre-hijos.
- Actualizar snapshots.
- Garantizar la transaccionalidad.

---

## Fase 4 — Frontend

- Formulario Registrar Parto.
- Widget Historial reproductivo.
- Drawer Identificar.
- Acción rápida Identificar.

---

## Fase 5 — Dashboard

- Widget Animales pendientes de identificar.

---

## Fase 6 — Validación

Comprobar todos los casos límite.

Verificar:

- estados reproductivos;
- relaciones madre-hijos;
- identificación;
- transacciones;
- proyecciones.

---

# Principios que NO deben romperse

Durante el desarrollo deberán mantenerse los principios arquitectónicos definidos en el proyecto.

Especialmente:

- Nunca crear animales fuera de la transacción del Parto.
- Nunca modificar manualmente el estado reproductivo.
- Nunca modificar manualmente el estado_identificacion.
- Nunca crear animales "pendientes de crear".
- Nunca cerrar el ciclo reproductivo mediante el Parto.
- Nunca trasladar lógica de AnimalIdentificationRules al Frontend.
- Nunca utilizar el Historial reproductivo como sustituto del Timeline de eventos.

---

# Riesgos

Los principales riesgos funcionales de esta fase son:

- pérdida de coherencia entre Parto y creación de crías;
- relaciones madre-hijos incompletas;
- duplicación de lógica entre Backend y Frontend;
- inconsistencias entre eventos y snapshots;
- estados de identificación incorrectos.

Todas las escrituras deberán realizarse dentro de una única transacción.

---

# Fuera del alcance

Esta fase no incluye:

- genealogía;
- árbol familiar;
- estadísticas reproductivas;
- dashboard completo;
- edición del historial reproductivo;
- cálculo avanzado de razas;
- inseminación artificial;
- reproducción asistida;
- automatizaciones posteriores al Destete.

---

# Checklist final

La fase se considerará completada cuando:

- El Parto pueda registrarse correctamente.
- La madre pase a estado LACTANTE.
- El ciclo reproductivo permanezca abierto.
- Se cree automáticamente una entidad Animal por cada cría nacida.
- Las relaciones madre-hijos se creen correctamente.
- La raza se calcule automáticamente.
- El tipo_productivo inicial sea RECRÍA.
- El estado_identificacion se inicialice correctamente.
- AnimalIdentificationRules funcione correctamente.
- AnimalIdentificationStatus sea reutilizable desde cualquier interfaz.
- El Drawer permita identificar rápidamente las crías.
- El Historial reproductivo funcione correctamente.
- El Dashboard muestre los animales pendientes de identificar.
- Todos los casos límite definidos en el PRD se superen correctamente.

---

# Resultado esperado

Al finalizar esta fase, el dominio reproductivo será capaz de gestionar de forma íntegra el nacimiento de una nueva generación de animales, manteniendo la coherencia del modelo, la trazabilidad entre generaciones y una experiencia de usuario guiada y alineada con la operativa real de una explotación ganadera.

PRD009 marcará el cierre de la primera gran etapa del módulo reproductivo, dejando preparada la arquitectura para abordar futuras funcionalidades como genealogía, productividad reproductiva y gestión avanzada de la descendencia sin necesidad de replantear el modelo de dominio.