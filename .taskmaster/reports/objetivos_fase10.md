# Objetivos Fase 10 — Finalización del Ciclo Reproductivo y Gestión de la Dependencia Madre-Cría

## Objetivo general

Implementar PRD010 utilizando como fuente funcional principal:

```text
documentacion/flujos/reproductivo/destete.md
```

El objetivo técnico es incorporar al sistema la dependencia funcional madre-cría y utilizarla para determinar de forma derivada la continuidad o finalización del ciclo reproductivo.

El PRD debe interpretarse conjuntamente con este documento.

---

# 1. Contexto obligatorio

Antes de comenzar:

## Specs

* `product_spec.md`
* `frontend_spec.md`
* `backend_spec.md`

## Modelo

* `documentacion/modelo/modelo_ganadero.md`
* `documentacion/modelo/modelo_reproductivo.md`

## Arquitectura

* `documentacion/arquitectura/overview.md`
* `documentacion/arquitectura/domains/reproductive.md`
* `documentacion/arquitectura/patterns/context-rules-projection.md`
* `documentacion/arquitectura/patterns/action-usecase-event.md`
* `documentacion/arquitectura/patterns/rpc-transaccional.md`

## Flujos

* `documentacion/flujos/reproductivo/parto.md`
* `documentacion/flujos/reproductivo/destete.md`

## Pendiente de documentación

* `documentacion/pending_documentation.md`

## Histórico

* `CHAT03.02-CICLO REPRODUCTIVO.txt`

Además, inspeccionar el código y las migrations actuales relacionadas con:

* `animal`;
* `tipo_productivo`;
* `es_reproductora`;
* `estado_reproductivo`;
* `ciclo_reproductivo`;
* `registrar_parto`;
* eventos;
* `evento_animales`;
* `AvailableActions`;
* historial reproductivo/carrusel.

---

# 2. Fase 0 — Auditoría previa

Antes de modificar código:

### A1. Comprobar esquema actual

Determinar:

* si `estado_vinculo_materno` existe;
* tipo actual de `Animal`;
* constraints existentes;
* migrations relacionadas con `CRÍA`.

### A2. Comprobar Parto actual

Localizar:

```text
registrar_parto
```

y determinar:

* cómo crea las crías;
* cómo establece `madre_id`;
* cómo establece `tipo_productivo`;
* cómo establece `estado_vital`;
* cómo actualiza el ciclo;
* cómo persiste los eventos.

### A3. Comprobar eventos

Determinar cómo se relacionan actualmente:

```text
EVENTO
EVENTO_ANIMALES
ANIMAL
```

y cómo debe representarse un evento Destete asociado a madre y cría.

### A4. Comprobar ciclo

Determinar cómo se crea actualmente:

```text
ciclo_reproductivo
```

y cómo se cierra.

### A5. Comprobar elegibilidad

Utilizar:

```text
es_reproductora
```

como fuente operacional de elegibilidad para crear nuevo ciclo.

No duplicar esta regla mediante consultas sobre `tipo_productivo`.

### A6. Comprobar carrusel

Determinar si el historial reproductivo/carrusel:

* ya está implementado;
* existe parcialmente;
* solo está documentado.

No asumir ninguna de las tres situaciones.

---

# 3. Fase 1 — Modelo de datos

## O1. Crear `estado_vinculo_materno`

Añadir a `Animal`:

```text
estado_vinculo_materno
```

Valores:

```text
NULL
ACTIVO
FINALIZADO
```

Debe ser nullable.

No debe tener `DEFAULT ACTIVO`.

No debe exponerse como campo editable.

---

## O2. Migration

Crear migration versionada que:

* añada la columna;
* aplique las restricciones necesarias;
* mantenga compatibilidad con animales existentes;
* no introduzca lógica de negocio compleja en triggers.

---

## O3. Backfill

Analizar primero los datos existentes.

Aplicar:

```text
evidencia suficiente de dependencia activa → ACTIVO
evidencia de vínculo terminado → FINALIZADO
sin conocimiento suficiente → NULL
```

No convertir automáticamente todas las crías vivas a `ACTIVO`.

La estrategia debe basarse en los eventos y datos existentes.

---

# 4. Fase 2 — Consolidar Parto

Actualizar el flujo existente de Parto.

## O4. Cría viva

Toda nueva cría viva:

```text
madre_id = madre
tipo_productivo = CRÍA
estado_vital = VIVO
estado_vinculo_materno = ACTIVO
```

## O5. Nacido muerto

Toda cría nacida muerta:

```text
madre_id = madre
tipo_productivo = NULL
estado_vital = MUERTO
estado_vinculo_materno = FINALIZADO
```

## O6. Atomicidad

El Parto no puede terminar con:

```text
Parto registrado
+
cría creada
+
vínculo incorrecto
```

Actualizar el RPC/use case existente sin crear una segunda implementación paralela.

---

# 5. Fase 3 — Reglas de dominio

## O7. Elegibilidad de Destete

Una cría es elegible si:

```text
tipo_productivo = CRÍA
AND
estado_vital = VIVO
AND
estado_vinculo_materno = ACTIVO
```

## O8. Finalización de vínculo

Crear una única capacidad reutilizable para:

```text
finalizar vínculo materno
```

Debe poder utilizarse desde:

* Destete;
* Venta de cría;
* Muerte de cría;
* Venta de madre;
* Muerte de madre.

No crear cinco implementaciones diferentes.

## O9. Continuidad del ciclo

Crear una única regla:

```text
existe CRÍA + VIVO + ACTIVO
```

→ ciclo continúa.

```text
no existe
```

→ ciclo finaliza.

## O10. Nuevo ciclo

Después del cierre:

```text
es_reproductora = true
```

→ crear nuevo ciclo:

```text
estado = VACÍA
```

Si:

```text
es_reproductora = false
```

→ no crear nuevo ciclo.

---

# 6. Fase 4 — Use Case Registrar Destete

## O11. Acción

Crear:

```text
RegistrarDestete
```

Contexto:

```text
madre_id
crias[]
fecha
observaciones
```

## O12. Selección

Permitir:

* una cría;
* varias crías;
* todas las elegibles.

## O13. Procesamiento individual

Para cada cría:

```text
registrar DESTETE
finalizar vínculo
CRÍA → RECRÍA
```

## O14. Trazabilidad

Cada Destete debe poder consultarse desde:

* madre;
* cría.

Cada cría afectada debe quedar identificada individualmente.

## O15. Operación múltiple

Si N crías son destetadas:

```text
N unidades individuales
```

dentro de la misma operación atómica.

---

# 7. Fase 5 — Persistencia transaccional

## O16. RPC

Implementar el mecanismo transaccional correspondiente siguiendo:

```text
Use Case
↓
Repository
↓
RPC
↓
Postgres
```

Utilizar el patrón definido en:

```text
documentacion/arquitectura/patterns/rpc-transaccional.md
```

## O17. Bloqueos y concurrencia

La validación crítica deberá producirse también dentro de la transacción.

Evitar condiciones de carrera como:

```text
dos Destetes simultáneos
```

sobre la misma cría.

## O18. Atomicidad

Debe ser imposible hacer COMMIT dejando:

* evento sin estado;
* estado sin evento;
* vínculo finalizado sin Destete cuando correspondía;
* `CRÍA` después de un Destete;
* ciclo finalizado incorrectamente.

---

# 8. Fase 6 — Venta y Muerte

No implementar aquí los Use Cases completos si pertenecen a sus propios flujos.

Sí implementar el mecanismo común necesario para que dichos flujos puedan hacer:

```text
finalizar vínculo activo
```

## O19. Cría activa

Venta/Muerte de:

```text
CRÍA + VIVO + ACTIVO
```

→ vínculo `FINALIZADO`.

## O20. Cría ya destetada

Venta/Muerte de:

```text
RECRÍA + FINALIZADO
```

→ ninguna consecuencia sobre la madre.

## O21. Madre

Venta/Muerte de la madre:

→ finalizar vínculos activos restantes.

→ no crear nuevo ciclo.

---

# 9. Fase 7 — Ciclo reproductivo

## O22. Finalización

Después de cualquier operación relevante:

```text
contar dependencias activas
```

Si:

```text
> 0
```

→ mantener ciclo.

Si:

```text
= 0
```

→ cerrar ciclo.

## O23. Nuevo ciclo

Si:

```text
ciclo cerrado
+
es_reproductora = true
```

→ crear inmediatamente:

```text
nuevo ciclo
estado = VACÍA
```

No crear evento de inicio.

No crear evento de cierre.

---

# 10. Fase 8 — AvailableActions

## O24. Registrar Destete

Integrar la acción en `AvailableActions`.

La acción debe estar disponible cuando exista al menos una cría elegible.

La UI no consultará directamente `estado_vinculo_materno`.

La disponibilidad será calculada por backend.

---

# 11. Fase 9 — Historial reproductivo / carrusel

## O25. Auditoría

Determinar si la proyección ya existe.

### Si existe

Extenderla.

### Si no existe

Crear la proyección mínima necesaria.

## O26. Información

Debe poder representar:

* ciclo;
* Parto;
* crías;
* Destetes;
* ventas;
* muertes;
* situación final;
* nuevo ciclo.

## O27. Lectura

El usuario no verá:

```text
estado_vinculo_materno
```

ni:

```text
0 vínculos activos
```

Verá una interpretación comprensible de la historia.

---

# 12. Fase 10 — Frontend

## O28. Acción

Añadir:

```text
Registrar Destete
```

desde la ficha de la madre.

## O29. Selección múltiple

Mostrar únicamente crías elegibles.

## O30. Confirmación

Mostrar claramente:

* qué crías serán destetadas;
* qué consecuencias tendrá la operación.

No mostrar detalles técnicos del vínculo.

## O31. Resultado

Después de guardar:

* crías → `RECRÍA`;
* vínculo finalizado;
* acción desaparece si no quedan crías elegibles;
* madre refleja la nueva situación reproductiva;
* carrusel actualizado.

---

# 13. Fase 11 — Pruebas de dominio

Implementar pruebas para:

1. una cría + Destete;
2. varias crías + Destete parcial;
3. varias crías + Destete total;
4. Destetes en fechas diferentes;
5. muerte antes del Destete;
6. venta antes del Destete;
7. muerte después del Destete;
8. venta después del Destete;
9. muerte de madre;
10. venta de madre;
11. nacido muerto;
12. cría histórica con vínculo desconocido;
13. intento de Destete sobre `RECRÍA`;
14. intento de Destete sobre cría muerta;
15. intento de Destete sobre cría vendida;
16. dos operaciones concurrentes;
17. idempotencia;
18. rollback por error;
19. creación del nuevo ciclo;
20. madre no reproductora.

---

# 14. Fase 12 — Regresión

Verificar que PRD010 no rompe:

* Cubrición;
* Confirmación de Gestación;
* Parto;
* estado reproductivo;
* ciclo reproductivo;
* creación de crías;
* genealogía;
* `AvailableActions`;
* ficha del animal;
* historial existente.

---

# 15. Fuera de alcance

No implementar:

* TIMEOUT;
* cron;
* detección de discontinuidad temporal;
* Aborto;
* Use Case completo de Venta;
* Use Case completo de Muerte;
* gestión de lotes post-destete;
* ubicación posterior;
* infraestructura genérica de acciones derivadas.

---

# 16. Resultado esperado

Al finalizar la fase:

```text
PARTO
 ↓
CRÍA + ACTIVO
 ↓
DESTETE / VENTA / MUERTE
 ↓
vínculo FINALIZADO
 ↓
evaluar vínculos
 ↓
0
 ↓
ciclo finaliza
 ↓
es_reproductora
 ↓
nuevo ciclo VACÍA
```

El sistema deberá mantener:

```text
EVENTOS = hechos
ESTADOS = conocimiento derivado
CICLO = contexto
CARRUSEL = historia agregada
```

y no deberá introducir eventos artificiales para representar el cierre o inicio de ciclos.
