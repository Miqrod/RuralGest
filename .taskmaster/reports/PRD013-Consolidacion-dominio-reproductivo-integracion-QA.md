# PRD013 — Consolidación del dominio reproductivo, integración y QA

> **Documento primario para Taskmaster.**
> Este es el PRD que debe usarse como fuente para generar las tareas del PRD013.
> `objetivos_fase13.md` es un documento de contexto complementario, no el primario.

## 1. Propósito

PRD013 cierra el primer bloque del dominio reproductivo tras PRD007–PRD012.

El objetivo NO es implementar automáticamente un `ReproductiveEngine`.

El objetivo es:

1. consolidar lo aprendido en los PRD anteriores;
2. comprobar que el dominio reproductivo actual es coherente y está correctamente integrado;
3. establecer un contrato claro entre `Use Case`, `Context`, `Rules` y `Projection`;
4. construir una regresión reproducible del dominio;
5. validar persistencia, RPCs, atomicidad, concurrencia e invariantes;
6. decidir, con evidencia, si existe una responsabilidad compartida cuya centralización justifique un `ReproductiveEngine`.

La decisión final puede ser:
- implementar `ReproductiveEngine`;
- no implementarlo todavía;
- extraer únicamente una parte concreta del comportamiento.

No existe obligación de implementar el Engine.

---

## 2. Contexto y prioridad documental

Antes de modificar código, revisar el contexto generado del proyecto y, como mínimo:

### Specs
- `AI_docs/product_spec.md`
- `AI_docs/backend_spec.md`
- `AI_docs/frontend_spec.md`
- `AI_docs/frontend_patterns.md`

### Modelo
- `documentacion/base_conocimiento/modelo/modelo_reproductivo.md`
- `documentacion/base_conocimiento/modelo/modelo_ganadero.md`

### Arquitectura
- `documentacion/base_conocimiento/arquitectura/overview.md`
- `documentacion/base_conocimiento/dominios/reproductivo.md`
- `documentacion/base_conocimiento/arquitectura/patterns/context-rules-projection-pattern.md`
- `documentacion/base_conocimiento/arquitectura/patterns/action-usecase-event.md`
- `documentacion/base_conocimiento/arquitectura/patterns/rpc-transaccional.md`

### Flujos reproductivos
Revisar los documentos existentes de:
- Cubrición (no existe documentación explícita, revisar .taskmaster/reports/PRD007-Inicio_Modulo_Reproductivo_y_Registro_Cubricion.md)
- Confirmación de gestación (no existe documentación explícita, revisar .taskmaster/reports/PRD008-Confirmación de gestación y consolidación del dominio reproductivo.md)
- Parto
- Destete
- Aborto
- Cambio de tipo productivo (no existe documentación, se ha hecho mediante prompts directos a Claude)
- Salida de animal (no existe documentación explícita, revisar PRD006-SalidaAnimal_RPC_y_FichaOperacional.md)

NOTA: en caso de discrepancias, tendrá prevalencia lo que se diga en PRD con numeración más alta.

### Histórico y decisiones
- PRD007
- PRD008
- PRD009
- PRD010
- PRD011
- PRD012
- `documentacion/pending_documentation.md`
- documentación histórica relevante

### Regla de prevalencia

La documentación existente puede estar desfasada.

Los PRD y documentos más recientes tienen prevalencia sobre documentos anteriores cuando exista contradicción. No aplicar ciegamente una regla antigua solo porque esté en `modelo_*`, `spec` o documentación histórica.

En particular, revisar críticamente `documentacion/pending_documentation.md`: contiene decisiones pendientes y también referencias históricas que pueden haber quedado obsoletas.

Cuando exista una contradicción no resuelta entre documentos recientes, código y modelo, detenerse, identificarla y explicarla antes de imponer una solución.

---

## 3. Estado de partida

PRD013 parte de los casos principales ya implementados:

- Cubrición
- Confirmación de gestación
- Parto
- Destete y dependencia madre-cría
- Aborto
- Cambio de tipo productivo con consecuencias reproductivas
- Venta/Muerte del animal y finalización asociada

El dominio debe seguir respetando:

```text
Eventos = fuente de verdad
Estados = proyecciones/snapshots derivados
Use Cases = operaciones de negocio
Context → Rules → Projection = patrón de dominio
Frontend = intención y representación
Backend = autoridad del negocio
DB = protección estructural e invariantes
```

Los eventos son inmutables y las correcciones no deben destruir la trazabilidad.

---

## 4. Objetivo 1 — Auditoría y consolidación

El módulo principal a auditar es `modules/ganadero/reproductivo/`. Inspeccionar también las integraciones en `app/(main)/vacuno/animales/[id]/` que coordinan los Use Cases desde la UI.

Antes de refactorizar:

1. inspeccionar la implementación real;
2. localizar reglas reproductivas duplicadas;
3. localizar reglas repartidas indebidamente entre Use Cases;
4. identificar inconsistencias entre `Context`, `Rules`, `Projection` y persistencia;
5. identificar código de compatibilidad que todavía sea necesario;
6. diferenciar comportamiento vigente de decisiones históricas.

No refactorizar por estética.

Toda modificación debe responder a una mejora concreta de coherencia, mantenibilidad o seguridad del dominio.

---

## 5. Objetivo 2 — Contrato del dominio reproductivo

Consolidar conceptualmente:

```text
ReproductiveContext
        ↓
ReproductiveRules
        ↓
ReproductiveProjection
```

Determinar con precisión:

### Context
Qué información necesita el dominio para tomar decisiones.

### Rules
Qué invariantes y transiciones son responsabilidad del dominio.

### Projection
Qué estado e información derivada produce.

### Use Case
Qué operación de negocio coordina la interacción entre dominio, persistencia y eventos.

La extracción no debe introducir una nueva capa solo por razones de nomenclatura.

---

## 6. Objetivo 3 — Evaluación del ReproductiveEngine

Esta evaluación es una parte obligatoria del PRD.

### Pregunta principal

> ¿Existe una responsabilidad transversal real cuya centralización reduzca complejidad y duplicación sin ocultar el comportamiento del dominio?

Analizar como mínimo:

- lógica compartida entre los Use Cases reproductivos;
- reglas de apertura/asignación/cierre de ciclos;
- validaciones reproductivas;
- evolución del estado reproductivo;
- proyecciones;
- coordinación `Context → Rules → Projection`;
- dependencia con eventos;
- dependencia con persistencia;
- puntos de duplicación actuales;
- facilidad para añadir nuevos Use Cases.

### El Engine NO debe convertirse en:

- un CRUD genérico;
- un `switch` gigante de eventos;
- una capa obligatoria para toda operación reproductiva;
- un contenedor de lógica ganadera no reproductiva;
- una abstracción diseñada alrededor del catálogo actual de eventos;
- una fachada que oculte reglas importantes.

### Test de extensibilidad

Simular al menos tres escenarios:

1. nuevo Use Case que reutiliza reglas existentes;
2. nuevo Use Case que introduce una regla reproductiva nueva;
3. nuevo Use Case que revela que una regla existente estaba mal modelada.

Determinar si cada escenario requiere:
- ningún cambio;
- ampliación normal del dominio;
- modificación estructural del Engine.

Un Engine no debe considerarse frágil simplemente porque evolucione. La señal negativa es que cada nuevo Use Case obligue a modificar una estructura central llena de condiciones específicas.

### Test multi-especie

Sin implementar todavía el modelo reproductivo porcino completo, analizar qué parte de las reglas actuales parece pertenecer al dominio reproductivo común y qué parte pertenece a consecuencias específicas de especie.

No crear una abstracción genérica solo por prever porcino.

---

## 7. Decisión arquitectónica

Al finalizar el análisis debe existir una decisión explícita:

### Opción A — Implementar Engine
Solo si existe evidencia suficiente de que reduce complejidad real.

### Opción B — No implementarlo
Si los Use Cases y el patrón `Context → Rules → Projection` siguen siendo más claros sin él.

### Opción C — Extracción parcial
Si solo una responsabilidad concreta merece centralización.

La decisión debe explicar:
- qué problema resuelve;
- qué responsabilidad posee;
- qué queda fuera;
- cómo se comportará ante nuevos Use Cases;
- cómo encaja con futuras especies.

Si no se implementa, documentar la decisión como una elección arquitectónica consciente, no como deuda técnica.

---

## 8. Objetivo 4 — Integración y persistencia

Consolidar y probar la integración real:

```text
UI
 ↓
Use Case
 ↓
Domain
 ↓
RPC / persistencia
 ↓
PostgreSQL
```

Verificar:

- atomicidad de operaciones que producen varios cambios;
- rollback ante errores;
- invariantes protegidas en DB;
- coherencia entre eventos y snapshots;
- máximo un ciclo abierto por animal;
- consistencia de `ciclo_id`;
- consistencia temporal según las reglas vigentes;
- idempotencia cuando corresponda;
- comportamiento ante concurrencia.

No trasladar lógica de dominio compleja a triggers.

---

## 9. Objetivo 5 — Regresión reproductiva

Crear una batería de pruebas reproducible que cubra, como mínimo:

### Cubrición
- primer ciclo;
- nueva cubrición dentro del ciclo;
- reutilización del ciclo correcto.

### Confirmación
- confirmación después de cubrición;
- confirmación sin cubrición previa;
- restricciones posteriores coherentes.

### Parto
- parto desde `CUBIERTA`;
- parto desde `GESTANTE`;
- actualización a `LACTANTE`;
- ciclo todavía abierto.

### Destete
- una cría;
- destete parcial;
- varias crías en fechas diferentes;
- cierre cuando desaparece la última dependencia activa;
- transición `CRÍA → RECRÍA`;
- creación del siguiente ciclo cuando corresponda.

### Aborto
- aborto dentro de un ciclo válido;
- cierre correcto del ciclo;
- estado reproductivo posterior;
- nuevo ciclo cuando corresponda;
- distinción frente a parto de cría muerta.

### Cambio de tipo productivo
- entrada/salida del ámbito reproductivo;
- consecuencias sobre el ciclo;
- coherencia de `es_reproductora`;
- historial y proyección.

### Venta/Muerte
- cierre del ciclo propio;
- finalización de vínculos activos;
- ausencia de consecuencias posteriores de crías cuyo vínculo ya terminó.

### Invariantes
- nunca dos ciclos abiertos;
- eventos inmutables;
- estados no editables directamente;
- coherencia entre eventos, ciclos y snapshots.

---

## 10. Objetivo 6 — QA de integración

Implementar la infraestructura de integración pendiente indicada en `documentacion/pending_documentation.md`.

El framework de testing es **Vitest**. El punto de partida concreto es `tests/machorra.test.ts`, que contiene 25 `it.todo` marcados al cierre de PRD012. Estos `it.todo` definen explícitamente los escenarios de integración que necesitan infraestructura real (conexión DB) para ejecutarse. La primera tarea de QA es montar dicha infraestructura y convertir esos `it.todo` en tests ejecutables.

La batería debe poder comprobar operaciones completas y no solo funciones aisladas.

Priorizar:

1. casos válidos;
2. casos inválidos;
3. edge cases;
4. rollback;
5. concurrencia;
6. idempotencia;
7. regresión.

Los tests deben comprobar el estado final y, cuando sea relevante, también los eventos persistidos y sus relaciones.

---

## 11. Compatibilidad y datos existentes

No asumir que todos los datos existentes fueron creados bajo el modelo final.

Durante la auditoría:

- detectar registros históricos compatibles con reglas anteriores;
- identificar mecanismos de compatibilidad todavía necesarios;
- no destruir datos históricos para “limpiar” el modelo;
- separar compatibilidad histórica de comportamiento nuevo.

Si una migración resulta necesaria, debe ser reproducible y justificada.

---

## 12. Pending documentation

`documentacion/pending_documentation.md` debe tratarse como contexto de trabajo, no como fuente de verdad absoluta.

Al inicio del PRD:

- identificar pendientes ya resueltos por PRD010–012;
- identificar referencias históricas obsoletas;
- identificar decisiones que PRD013 debe resolver.

Al final:

- actualizar o preparar la actualización de los pendientes que hayan quedado resueltos;
- eliminar referencias ya sustituidas cuando corresponda;
- conservar únicamente pendientes reales.

La actualización completa de la documentación permanente debe hacerse después de que PRD013 cierre las decisiones del dominio, no antes.

---

## 13. Documentación permanente

PRD013 debe dejar identificados los cambios que deberán trasladarse posteriormente a:

- `documentacion/base_conocimiento/modelo/modelo_reproductivo.md`
- `documentacion/base_conocimiento/modelo/modelo_ganadero.md`
- `documentacion/base_conocimiento/dominios/reproductivo.md`
- documentación de patrones, si procede
- flujos reproductivos afectados

No convertir PRD013 en una copia de la documentación permanente.

El PRD describe el trabajo de consolidación; la documentación final describe el conocimiento ya decidido.

---

## 14. Fuera de alcance

No incluir en PRD013:

- desarrollo completo del dominio reproductivo porcino;
- módulos ganaderos nuevos;
- corrección general de eventos;
- rediseño general de la ficha del animal;
- infraestructura completa de `PendingTask`;
- nuevas funcionalidades reproductivas no necesarias para la consolidación;
- analítica reproductiva avanzada;
- automatizaciones ajenas a la consolidación.

La aparición de un nuevo caso durante la auditoría no implica automáticamente ampliar el alcance. Primero determinar si es:
- una corrección necesaria;
- una consecuencia de una regla existente;
- una decisión pendiente;
- o una feature futura.

---

## 15. Criterios de aceptación

PRD013 estará terminado cuando:

- el dominio reproductivo actual haya sido auditado;
- las reglas vigentes estén consolidadas;
- las contradicciones relevantes estén resueltas;
- exista una estrategia de regresión reproducible;
- las operaciones críticas estén cubiertas por integración;
- atomicidad, invariantes, concurrencia e idempotencia hayan sido evaluadas donde corresponda;
- el contrato `Context → Rules → Projection` esté claro;
- exista una decisión justificada sobre `ReproductiveEngine`;
- la decisión sea compatible con futuros Use Cases;
- la documentación pendiente haya quedado saneada;
- se hayan identificado y preparado las actualizaciones de documentación permanente.

---

## 16. Forma de trabajo

No implementar directamente.

Primero:

```text
leer contexto
↓
auditar código
↓
comparar modelo vs implementación
↓
identificar contradicciones
↓
consolidar SPEC
↓
evaluar Engine
↓
decidir
↓
implementar únicamente lo justificado
↓
integrar
↓
regresión
↓
QA
↓
documentar
```

Si aparece una contradicción entre documentación antigua y una decisión posterior, prevalece la decisión posterior.

Si el código contradice una decisión reciente del PRD, no adaptar silenciosamente el PRD al código: señalar la discrepancia y corregir la implementación o plantear la decisión.

La IA es copiloto. La autoridad sobre dominio y arquitectura permanece en el responsable del proyecto.
