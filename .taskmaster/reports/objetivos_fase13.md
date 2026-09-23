# objetivos_fase13 — PRD013

## Misión

Consolidar el dominio reproductivo construido en PRD007–PRD012, validar su integración y decidir con evidencia si debe existir `ReproductiveEngine`.

**No asumir que el Engine debe implementarse.**

---

## 0. Contexto obligatorio

Antes de actuar, leer:

### Specs
- `AI_docs/product_spec.md`
- `AI_docs/backend_spec.md`
- `AI_docs/frontend_spec.md`
- `AI_docs/frontend_patterns.md`

### Modelo y arquitectura
- `documentacion/base_conocimiento/modelo/modelo_reproductivo.md`
- `documentacion/base_conocimiento/modelo/modelo_ganadero.md`
- `documentacion/base_conocimiento/arquitectura/overview.md`
- `documentacion/base_conocimiento/dominios/reproductivo.md`
- patrones `documentacion/base_conocimiento/arquitectura/patterns/context-rules-projection-pattern`, `documentacion/base_conocimiento/arquitectura/patterns/action-usecase-event` y `documentacion/base_conocimiento/arquitectura/patterns/rpc-transaccional`

### PRD y flujos
- PRD007, PRD008, PRD009, PRD010, PRD011 y PRD012
- flujos reproductivos vigentes
- `documentacion/pending_documentation.md`

También revisar el contexto generado del proyecto.

### Prevalencia

Los documentos antiguos pueden estar obsoletos.

Usar como regla:

```text
decisión más reciente
        >
documentación anterior
```

No resolver contradicciones silenciosamente. Si la decisión reciente no es suficientemente clara, detenerse y reportarla.

---

## 1. Auditoría

Inspeccionar primero la implementación real.

Buscar:

- reglas duplicadas;
- lógica reproductiva dispersa;
- diferencias entre modelo y código;
- compatibilidad histórica;
- RPCs y transacciones;
- snapshots derivados;
- invariantes;
- ciclo reproductivo;
- `Context → Rules → Projection`.

No refactorizar por gusto.

---

## 2. Consolidación

Construir una visión única de:

```text
Use Case
   ↓
ReproductiveContext
   ↓
ReproductiveRules
   ↓
ReproductiveProjection
   ↓
persistencia
```

Definir claramente qué responsabilidad pertenece a cada parte.

No introducir nuevas capas si no aportan una responsabilidad real.

---

## 3. Evaluación del ReproductiveEngine

Responder antes de implementarlo:

### ¿Qué problema concreto resolvería?

Identificar la lógica verdaderamente compartida.

Evaluar:

- duplicación actual;
- coordinación de reglas;
- apertura/asignación/cierre de ciclos;
- proyección;
- validaciones;
- facilidad de mantenimiento;
- facilidad para añadir Use Cases.

### Debe superar estos tests

**Nuevo Use Case + reglas existentes**
→ debe poder reutilizar el dominio sin modificar una gran estructura central.

**Nuevo Use Case + regla nueva**
→ debe poder ampliar el dominio de forma localizada.

**Nuevo Use Case + regla anterior incorrecta**
→ debe poder corregirse sin depender de un catálogo cerrado de casos.

### Multi-especie

Analizar qué reglas parecen genuinamente reproductivas y cuáles son consecuencias específicas de especie.

No construir una abstracción solo para anticipar porcino.

### Regla

Un Engine no es bueno porque centralice mucho.

Es bueno si **reduce complejidad real sin ocultar el comportamiento**.

---

## 4. Decisión

Registrar una de estas conclusiones:

```text
A. Implementar ReproductiveEngine
B. No implementarlo todavía
C. Extraer solo una responsabilidad concreta
```

La decisión debe estar justificada.

Si se implementa:

- Engine pequeño;
- responsabilidades explícitas;
- sin `switch` monolítico;
- sin lógica de lotes ni dominio ganadero no reproductivo;
- sin acoplamiento artificial al catálogo actual de eventos.

Si no se implementa:

- mantener CRP y Use Cases;
- documentar por qué;
- no considerarlo deuda técnica.

---

## 5. Integración

Validar operaciones completas:

```text
UI → Use Case → Domain → RPC/persistencia → DB
```

Comprobar:

- atomicidad;
- rollback;
- invariantes;
- consistencia eventos/ciclos/snapshots;
- máximo un ciclo abierto;
- coherencia temporal;
- idempotencia;
- concurrencia.

No mover lógica compleja a triggers.

---

## 6. Regresión

Crear pruebas reproducibles para:

- Cubrición;
- Confirmación;
- Parto;
- Destete parcial y completo;
- Aborto;
- Cambio de tipo productivo;
- Venta/Muerte;
- ciclos;
- estados;
- vínculos madre-cría;
- eventos;
- invariantes.

Probar tanto casos válidos como inválidos y edge cases.

Los tests deben comprobar no solo el resultado visible, sino también eventos, ciclos y persistencia cuando corresponda.

---

## 7. Pending documentation

Al inicio:

- detectar qué pendientes de `documentacion/pending_documentation.md` ya están resueltos;
- detectar referencias históricas obsoletas;
- identificar lo que PRD013 todavía debe resolver.

Al final:

- sanear los pendientes resueltos;
- eliminar referencias sustituidas;
- conservar pendientes reales.

**No actualizar toda la documentación permanente antes de PRD013.**

Primero cerrar el modelo y la arquitectura. Después trasladar las decisiones finales a la documentación permanente.

---

## 8. Documentación final

Preparar las actualizaciones necesarias para:

- modelo reproductivo;
- modelo ganadero;
- arquitectura reproductiva;
- patrones afectados;
- flujos afectados.

No duplicar el PRD.

---

## 9. Fuera de alcance

No introducir:

- modelo reproductivo porcino completo;
- nuevas features reproductivas no necesarias;
- corrección general de eventos;
- nueva infraestructura transversal de `PendingTask`;
- analítica avanzada;
- rediseños generales de UI.

---

## 10. Definition of Done

PRD013 solo se cierra cuando:

- el dominio ha sido auditado;
- las contradicciones relevantes están resueltas;
- existe regresión reproducible;
- integración crítica está cubierta;
- invariantes y atomicidad están verificadas;
- concurrencia/idempotencia han sido evaluadas donde corresponda;
- `Context → Rules → Projection` está claro;
- existe una decisión justificada sobre `ReproductiveEngine`;
- la decisión es razonablemente extensible ante nuevos Use Cases;
- `documentacion/pending_documentation.md` ha quedado saneado;
- quedan identificadas las actualizaciones finales de documentación.

---

## Regla de trabajo

No empezar escribiendo código.

Orden obligatorio:

```text
Contexto
→ Auditoría
→ Contradicciones
→ SPEC
→ Evaluación Engine
→ Decisión
→ Implementación justificada
→ Integración
→ Regresión
→ QA
→ Documentación
```

Si una decisión reciente contradice una antigua, prevalece la reciente.

Si el código contradice una decisión reciente, señalarlo y corregirlo, no adaptar silenciosamente la especificación al código.
