# Objetivos de la fase

## Fase actual

Fase 8: Confirmación de gestación y consolidación del dominio reproductivo.

---

# Preparación

## Objetivo

Evolucionar el dominio reproductivo implementado durante PRD007 para alinearlo completamente con el modelo reproductivo definitivo.

La arquitectura del dominio ya existe.

Esta fase no debe introducir nuevos patrones arquitectónicos.

Toda la implementación deberá reutilizar el dominio existente ampliando exclusivamente su conocimiento.

---

# Objetivo principal

Completar la implementación del flujo de gestación permitiendo registrar una Confirmación de gestación tanto cuando exista una Cubrición previa como cuando ésta constituya el primer hecho conocido del ciclo reproductivo.

El objetivo no consiste únicamente en ampliar un formulario.

La finalidad de la fase es consolidar definitivamente las reglas del dominio relacionadas con la gestación y preparar el sistema para implementar el Parto sin introducir cambios estructurales en la arquitectura.

---

# Contexto funcional

Actualmente el sistema ya permite registrar:

```text
Cubrición

↓

Confirmación

↓

GESTANTE
```

Durante esta fase dicho comportamiento deberá mantenerse íntegramente.

La evolución consistirá en soportar además el siguiente recorrido:

```text
Confirmación

↓

Creación del ciclo

↓

GESTANTE
```

Ambos escenarios deberán reutilizar exactamente la misma infraestructura del dominio.

---

# Decisiones arquitectónicas obligatorias

## 1. No crear un nuevo caso de uso

La Confirmación de gestación ya existe.

Su comportamiento deberá evolucionar.

No deberá implementarse una acción alternativa.

---

## 2. No crear nuevos eventos

El modelo Event First permanece inalterado.

Nunca deberán generarse eventos ficticios para reconstruir información no registrada.

---

## 3. Reutilizar el dominio existente

Toda la evolución funcional deberá implementarse ampliando:

- ReproductiveContext
- ReproductiveEligibilityRules
- ReproductiveCycleRules
- ReproductiveProjection

No deberán aparecer implementaciones paralelas para resolver el nuevo escenario.

---

## 4. Mantener la compatibilidad

Todo el comportamiento implementado durante PRD007 deberá continuar funcionando exactamente igual.

Las nuevas reglas únicamente ampliarán las capacidades del dominio.

---

# Bloque 0 - Adaptación del modelo de datos

## Objetivo

Adaptar el modelo persistente para soportar completamente el flujo de Confirmación de gestación definido por el modelo reproductivo.

---

## Implementar

Revisar todas las entidades implicadas en el proceso reproductivo para garantizar que soportan los nuevos escenarios sin introducir información redundante.

Entre otros:

- ciclo_reproductivo
- eventos reproductivos
- snapshots derivados
- tipos compartidos
- DTOs
- validaciones

No deberá persistirse ninguna información que pueda reconstruirse mediante proyecciones.

---

## Verificación

El modelo de datos continúa alineado con el principio Event First y no incorpora nuevos estados persistentes innecesarios.

---

# Bloque 1 - Adaptación del dominio

## Objetivo

Actualizar el dominio reproductivo para soportar el inicio de un ciclo mediante Confirmación de gestación.

---

## Implementar

El dominio deberá ser capaz de distinguir entre:

- Confirmación sobre una Cubrición existente.
- Confirmación como primer conocimiento del ciclo.

---

## Verificación

Ambos escenarios utilizan exactamente el mismo dominio sin duplicar reglas.

---

# Bloque 2 - Evolución de ReproductiveEligibilityRules

## Objetivo

Ampliar las reglas de elegibilidad para soportar el nuevo escenario funcional.

---

## Responsabilidades

Permitir:

- Confirmación sobre Cubrición previa.
- Confirmación sin Cubrición previa.

Impedir:

- registrar posteriormente una Cubrición dentro de un ciclo iniciado mediante Confirmación.

---

## Verificación

Todas las validaciones permanecen centralizadas dentro del dominio.

---

# Bloque 3 - Evolución de ReproductiveCycleRules

## Objetivo

Permitir que un ciclo reproductivo pueda iniciarse mediante una Confirmación de gestación.

---

## Responsabilidades

El dominio deberá decidir automáticamente:

- reutilizar un ciclo existente;
- crear un nuevo ciclo;
- asociar correctamente el evento.

---

## Verificación

El ciclo permanece consistente independientemente del evento que haya iniciado el seguimiento.

---

# Bloque 4 - Evolución de ReproductiveProjection

## Objetivo

Actualizar las proyecciones derivadas del ciclo.

---

## Implementar

Cuando exista Cubrición:

- reutilizar el comportamiento existente.

Cuando no exista:

- reconstruir internamente una línea temporal aproximada utilizando la edad gestacional estimada.

La edad gestacional nunca deberá persistirse.

Además deberá:

- recalcular la fecha prevista de parto;
- recalcular los días restantes;
- recalcular el estado reproductivo;
- mantener el mismo formato de snapshot utilizado por PRD007;
- no diferenciar externamente entre un ciclo iniciado mediante Cubrición o mediante Confirmación.

---

## Verificación

Ambos recorridos generan exactamente el mismo snapshot observable.

---

# Bloque 5 - Evolución del caso de uso

## Objetivo

Adaptar el caso de uso existente de Confirmación de gestación.

---

## Responsabilidades

El Use Case continuará limitándose a:

- construir el contexto;
- coordinar el dominio;
- persistir el resultado mediante RPC.

No deberá incorporar reglas reproductivas.

---

## Verificación

Toda la lógica del dominio permanece encapsulada dentro del patrón Context → Rules → Projection.

---

# Bloque 6 - Adaptación del formulario

## Objetivo

Ampliar el formulario existente.

---

## Implementar

Mostrar un bloque específico cuando no exista una Cubrición previa.

El bloque deberá:

- mostrar un aviso explicativo;
- solicitar una estimación aproximada de los meses de gestación;
- impedir introducir días o semanas;
- ocultarse completamente cuando exista una Cubrición previa.

---

## Verificación

La experiencia de usuario permanece idéntica para el flujo ya existente.

---

## Confirmación asistida

Cuando la Confirmación de gestación se registre sin una Cubrición previa, el formulario deberá mostrar un aviso explicativo antes de solicitar la edad gestacional estimada.

La finalidad del aviso consiste en garantizar que el usuario comprende el escenario que está registrando.

El comportamiento implementado deberá mantenerse completamente transparente para el usuario.

---

# Criterios de aceptación

- La Confirmación de gestación continúa funcionando cuando existe una Cubrición previa.
- Puede iniciarse un ciclo directamente mediante una Confirmación.
- Nunca se generan eventos ficticios.
- Nunca se persiste la edad gestacional estimada.
- La reconstrucción temporal del ciclo únicamente existe durante el procesamiento del evento.
- El snapshot continúa siendo completamente derivado.
- Todo el comportamiento permanece centralizado en el dominio.
- El sistema queda preparado para implementar el Parto sin modificar la arquitectura existente.
- La interfaz nunca solicita una edad gestacional en días o semanas.
- El usuario introduce únicamente una estimación aproximada en meses.
- La edad gestacional nunca se persiste.
- La reconstrucción temporal únicamente existe durante el procesamiento del evento.
- Nunca se generan eventos ficticios.
- Nunca se modifica la historia registrada.
- El flujo iniciado mediante Confirmación reutiliza exactamente las mismas Rules y Projection que el flujo iniciado mediante Cubrición.
- El snapshot resultante es indistinguible para el resto del sistema.

---

# Dependencias para la siguiente fase

Al finalizar PRD008 el dominio reproductivo deberá encontrarse completamente preparado para incorporar el evento Parto.

La siguiente fase únicamente deberá ampliar las reglas existentes reutilizando íntegramente la arquitectura consolidada durante PRD007 y PRD008.

---

# Bloque 7 - Adaptación de la experiencia de usuario

## Objetivo

Traducir la complejidad del dominio reproductivo a una experiencia sencilla para el usuario.

---

## Implementar

Cuando la Confirmación inicie directamente un ciclo:

- mostrar un mensaje informativo;
- explicar las implicaciones de esta decisión;
- explicar por qué se solicita una estimación de meses de gestación;
- utilizar exclusivamente lenguaje de negocio;
- evitar exponer conceptos internos del dominio.

---

## Verificación

La interfaz guía correctamente al usuario sin necesidad de comprender el funcionamiento interno del modelo reproductivo.

---

# Bloque 8 - Compatibilidad con PRD007

## Objetivo

Garantizar que la evolución del dominio no modifica el comportamiento existente.

---

## Verificar

- Confirmación con Cubrición continúa funcionando igual.
- Projection genera los mismos resultados cuando existe Cubrición.
- Los snapshots anteriores siguen siendo válidos.
- Las acciones disponibles no cambian.
- No aparecen regresiones funcionales.

---

# Bloque 9 - Validación funcional

Verificar, como mínimo, los siguientes recorridos completos.

## Escenario 1

Cubrición

↓

Confirmación

↓

GESTANTE

---

## Escenario 2

Confirmación

↓

GESTANTE

---

## Escenario 3

Confirmación

↓

Intento de Cubrición

↓

Rechazado

---

## Escenario 4

Confirmación

↓

Parto

---

## Escenario 5

Cubrición

↓

Parto