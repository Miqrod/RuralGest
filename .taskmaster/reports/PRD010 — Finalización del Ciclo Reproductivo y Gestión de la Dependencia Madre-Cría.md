# PRD010 — Finalización del Ciclo Reproductivo y Gestión de la Dependencia Madre-Cría

## 1. Contexto

PRD010 continúa la evolución del dominio reproductivo iniciada en:

* PRD007 — Cubrición.
* PRD008 — Confirmación de Gestación.
* PRD009 — Parto y consolidación del nacimiento.

El objetivo de esta fase no es simplemente implementar un formulario de Destete.

Durante el diseño de PRD009 se consolidó que el Parto crea nuevas entidades `Animal` y establece la relación genealógica permanente `madre_id`.

Las crías vivas nacen como:

```text
tipo_productivo = CRÍA
```

y mantienen una dependencia funcional respecto de la madre durante la lactancia.

El problema que resuelve PRD010 es representar cuándo esa dependencia deja de existir y utilizar ese conocimiento para determinar la continuidad o finalización del ciclo reproductivo.

La regla fundamental es:

> **El ciclo reproductivo permanece abierto mientras exista al menos una cría viva, funcionalmente dependiente de la madre y con vínculo materno activo.**

Cuando desaparece la última dependencia funcional:

```text
0 vínculos maternos activos
        ↓
finalización del ciclo actual
        ↓
si la madre continúa siendo reproductora
        ↓
nuevo ciclo en estado VACÍA
```

El cierre del ciclo no constituye un hecho histórico y, por tanto, **no genera un evento**.

---

# 2. Documentación de contexto obligatoria

Antes de implementar cualquier tarea de PRD010, Taskmaster deberá revisar:

## Especificaciones

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

## Flujos reproductivos

* `documentacion/flujos/reproductivo/parto.md`
* `documentacion/flujos/reproductivo/destete.md`

`destete.md` contiene las reglas permanentes del dominio y debe considerarse la referencia funcional principal para esta fase.

`parto.md` define el origen de las crías y el establecimiento inicial de la dependencia.

## Documentación pendiente

* `documentacion/pending_documentation.md`

Debe revisarse para identificar decisiones ya consolidadas que todavía estén pendientes de incorporación en documentación permanente.

## Documentación histórica

* `CHAT03.02-CICLO REPRODUCTIVO.txt`
* documentación histórica relevante de PRD007, PRD008 y PRD009.

La documentación histórica puede contener reglas ya sustituidas.

Cuando exista contradicción, prevalece la documentación permanente vigente y el modelo consolidado.

## Estado actual de implementación

Taskmaster deberá inspeccionar también las implementaciones actuales relacionadas con:

* `Animal`;
* `tipo_productivo`;
* `es_reproductora`;
* `estado_reproductivo`;
* `ciclo_reproductivo`;
* `registrar_parto`;
* eventos y `evento_animales`;
* proyecciones de lectura del historial reproductivo;
* acciones disponibles.

En particular deberá localizar y revisar la migración actual que introdujo `CRÍA` y el RPC vigente de Parto antes de modificar cualquiera de ellos.

---

# 3. Decisiones de dominio que deben respetarse

PRD010 implementa las decisiones consolidadas en `destete.md`.

No debe redefinirlas.

## 3.1 Genealogía

```text
madre_id
```

es genealogía permanente.

Nunca se modifica como consecuencia de:

* Destete;
* Venta;
* Muerte.

---

## 3.2 Dependencia funcional

`Animal` incorpora:

```text
estado_vinculo_materno
```

con:

```text
NULL
ACTIVO
FINALIZADO
```

El campo es:

* interno;
* derivado;
* no editable;
* no visible directamente para el usuario.

`NULL` significa que el sistema no dispone de conocimiento suficiente para afirmar una dependencia funcional.

`ACTIVO` significa que existe una dependencia funcional conocida.

`FINALIZADO` significa que no existe una dependencia funcional vigente.

Un nacido muerto se crea directamente como:

```text
estado_vinculo_materno = FINALIZADO
```

porque el sistema conoce que nunca llegó a existir una dependencia funcional.

---

## 3.3 Cría viva nacida en Parto

Una cría viva creada por Parto debe quedar:

```text
madre_id = madre
tipo_productivo = CRÍA
estado_vital = VIVO
estado_vinculo_materno = ACTIVO
```

Esto requiere modificar el flujo de Parto actualmente existente.

---

## 3.4 Destete

El Destete produce:

```text
CRÍA → RECRÍA
ACTIVO → FINALIZADO
```

de forma atómica.

El mismo hecho debe poder trazarse desde:

* la madre;
* la cría afectada.

Si se destetan N crías, cada cría debe conservar su trazabilidad individual.

---

## 3.5 Venta y Muerte

Cuando una `CRÍA` mantiene un vínculo `ACTIVO` y posteriormente:

* muere;
* es vendida;

el vínculo pasa a `FINALIZADO`.

La cría **no pasa a `RECRÍA`**, porque no ha sido destetada.

Cuando una cría ya es `RECRÍA` y su vínculo está `FINALIZADO`, sus posteriores ventas o muertes no afectan al contexto reproductivo de la madre.

La muerte o venta de la madre finaliza los vínculos funcionales activos restantes.

PRD010 deberá preparar el mecanismo común para estas situaciones, pero no implementará los Use Cases completos de Venta o Muerte si pertenecen a sus propios flujos.

---

# 4. Cambio de modelo de datos

## 4.1 Nueva columna

Debe añadirse a `Animal`:

```text
estado_vinculo_materno
```

con capacidad para representar:

```text
NULL
ACTIVO
FINALIZADO
```

La columna debe ser nullable.

No debe tener un valor `DEFAULT ACTIVO`.

La ausencia de información histórica debe poder conservarse como `NULL`.

---

## 4.2 Migración

La fase debe incluir una migration reproducible que:

1. añada la nueva columna;
2. defina su tipo y restricciones;
3. mantenga `NULL` como valor válido;
4. no permita que la aplicación la trate como campo editable;
5. permita que el RPC de Parto y los casos de uso posteriores puedan establecerla.

La migration deberá ser compatible con la estrategia Local First y quedar versionada en Supabase.

---

## 4.3 Backfill

Debe realizarse un análisis de los animales existentes antes de definir el backfill.

**No se debe establecer `ACTIVO` indiscriminadamente en todas las crías vivas existentes.**

La regla será:

```text
si existe evidencia suficiente de que el animal
es una cría viva que mantiene actualmente
dependencia funcional de su madre
    → ACTIVO

si existe evidencia de que la dependencia
ya terminó
    → FINALIZADO

si no existe información suficiente
    → NULL
```

La evidencia podrá proceder de:

* Partos registrados;
* eventos posteriores;
* estado vital;
* tipo productivo;
* relación `madre_id`;
* historial disponible.

El backfill deberá respetar el principio de que el sistema representa conocimiento y no debe inventar retrospectivamente información que nunca fue registrada.

Taskmaster deberá determinar la estrategia concreta después de inspeccionar el esquema y los datos existentes.

---

# 5. Actualización del flujo de Parto

El RPC/use case de Parto existente debe modificarse.

Actualmente crea las nuevas crías, pero PRD010 requiere además establecer correctamente el vínculo.

Para cada nacimiento:

### Nacimiento vivo

```text
tipo_productivo = CRÍA
estado_vinculo_materno = ACTIVO
```

### Nacimiento muerto

```text
tipo_productivo = NULL
estado_vital = MUERTO
estado_vinculo_materno = FINALIZADO
```

`madre_id` se mantiene en ambos casos cuando la madre es conocida.

Esta modificación es obligatoria.

No es válido implementar PRD010 dejando que los futuros Partos creen crías con `estado_vinculo_materno = NULL`.

---

# 6. Regla de continuidad del ciclo

El dominio deberá disponer de una única regla reutilizable para determinar si existe dependencia funcional suficiente para mantener abierto el ciclo.

Una cría mantiene abierto el ciclo cuando:

```text
tipo_productivo = CRÍA
AND
estado_vital = VIVO
AND
estado_vinculo_materno = ACTIVO
```

Por tanto:

```text
≥ 1
    → ciclo continúa

0
    → ciclo finaliza
```

No debe existir una implementación diferente para:

* último Destete;
* última muerte;
* última venta.

Todos utilizan la misma regla.

---

# 7. Elegibilidad para nuevo ciclo

Cuando el ciclo finaliza, el dominio deberá determinar si la madre continúa siendo elegible para reproducción.

La documentación del modelo establece que esta decisión se expresa mediante:

```text
es_reproductora
```

Por tanto, PRD010 deberá utilizar:

```text
es_reproductora = true
```

como condición para crear inmediatamente el siguiente ciclo.

No debe inferirse la elegibilidad mediante consultas duplicadas sobre sexo, `tipo_productivo` o `estado_reproductivo`.

El modelo ya dispone de un flag operacional específico para esta finalidad.

Resultado:

```text
ciclo finalizado
       │
       ▼
es_reproductora?
    │          │
   sí          no
    │           │
    ▼           ▼
nuevo ciclo    fin
VACÍA
```

---

# 8. Use Case Registrar Destete

Debe implementarse un Use Case específico:

```text
RegistrarDestete
```

La acción se inicia desde la ficha de la madre.

Input conceptual:

```text
madre_id
crias[]
fecha
observaciones opcionales
```

La UI podrá seleccionar:

* una cría;
* varias crías;
* todas las crías elegibles.

El Use Case deberá:

1. cargar el contexto reproductivo;
2. validar la elegibilidad de la madre;
3. validar individualmente las crías;
4. registrar el hecho de Destete;
5. registrar su trazabilidad en madre y cría;
6. finalizar el vínculo;
7. cambiar `CRÍA → RECRÍA`;
8. evaluar los vínculos restantes;
9. finalizar el ciclo si corresponde;
10. crear el siguiente ciclo `VACÍA` si corresponde;
11. actualizar las proyecciones necesarias.

---

# 9. Eventos de Destete

`DESTETE` continúa siendo un evento biológico con entidad propia.

No se tratará como:

```text
SALIDA
```

ni como:

```text
CIERRE_CICLO
```

La arquitectura vigente define `DESTETE` como evento independiente.

Cada cría destetada debe quedar individualmente trazable.

Para cada Destete individual deberá poder conocerse:

```text
madre
cría afectada
fecha
ciclo
```

La representación concreta deberá respetar el modelo actual de `eventos` y `evento_animales`, evitando introducir una estructura paralela innecesaria.

---

# 10. Atomicidad

La operación debe ser atómica.

Para cada cría afectada deben permanecer coherentes:

```text
evento DESTETE
        +
trazabilidad madre/cría
        +
estado_vinculo_materno
        +
tipo_productivo
        +
estado del ciclo
```

Una operación múltiple deberá procesarse dentro de una única transacción.

No debe ser posible:

```text
cría = RECRÍA
vínculo = FINALIZADO
```

sin que exista la correspondiente trazabilidad del Destete.

Tampoco:

```text
evento Destete registrado
```

con:

```text
cría = CRÍA + ACTIVO
```

por un fallo parcial.

La implementación deberá seguir el patrón RPC transaccional ya establecido para operaciones que modifican eventos y snapshots.

---

# 11. Historial de eventos

El historial debe permanecer puro.

No crear:

```text
CIERRE_CICLO
INICIO_CICLO
FINALIZACION_VINCULO
TIMEOUT
```

El historial mostrará los hechos reales:

```text
PARTO
DESTETE
VENTA
MUERTE
```

El cambio de ciclo será una interpretación derivada.

---

# 12. Historial reproductivo y carrusel

PRD010 debe integrar las consecuencias del nuevo modelo en la proyección de lectura del historial reproductivo.

Antes de implementar esta parte, Taskmaster deberá comprobar si el carrusel/proyección ya existe parcialmente como consecuencia de PRD007–PRD009.

La documentación pendiente ya contempla un widget de historial reproductivo en la ficha del animal, con:

* ciclo actual;
* ciclos históricos;
* información de gestación;
* foco posterior en las crías.

Por tanto:

### Si la proyección ya existe

PRD010 deberá ampliarla.

### Si todavía no existe

PRD010 deberá crear la proyección mínima necesaria para representar la historia del ciclo.

No deberá crearse una arquitectura paralela.

La proyección deberá poder representar:

```text
Ciclo
├── Parto
├── Crías
│   ├── Destete
│   ├── Venta
│   └── Muerte
└── estado final del ciclo
```

El usuario no verá `estado_vinculo_materno`.

---

# 13. Acción Registrar Destete

La acción debe integrarse en el sistema de `AvailableActions`.

La UI no decidirá si mostrarla consultando directamente:

```text
estado_vinculo_materno
```

La disponibilidad deberá formar parte de la proyección de acciones que consume el frontend.

La regla conceptual es:

```text
existe al menos una cría elegible
        ↓
acción Registrar Destete disponible
```

Cuando no exista ninguna:

```text
acción no disponible
```

La arquitectura existente establece que `AvailableActions` es la interfaz entre las reglas de negocio y el frontend.

---

# 14. Casos que deben soportarse

### Caso A — Una cría

```text
Parto
→ CRÍA + ACTIVO
→ Destete
→ RECRÍA + FINALIZADO
→ 0 vínculos
→ nuevo ciclo VACÍA
```

### Caso B — Destete parcial

```text
3 vínculos
→ 1 Destete
→ 2 vínculos
→ ciclo continúa
```

### Caso C — Varias crías destetadas en fechas diferentes

El ciclo permanece abierto hasta que desaparezca el último vínculo activo.

### Caso D — Muerte antes del Destete

La cría:

```text
CRÍA + VIVO + ACTIVO
```

pasa a:

```text
CRÍA + MUERTO + FINALIZADO
```

### Caso E — Venta antes del Destete

La cría:

```text
CRÍA + VIVO + ACTIVO
```

pasa a:

```text
CRÍA + VENDIDO + FINALIZADO
```

### Caso F — Venta/Muerte después del Destete

Una `RECRÍA + FINALIZADO` deja de afectar al ciclo de la madre.

### Caso G — Muerte/Venta de la madre

Finalizan los vínculos funcionales restantes.

No se crea un nuevo ciclo.

### Caso H — Nacimiento muerto

```text
Animal
tipo_productivo = NULL
estado_vital = MUERTO
estado_vinculo_materno = FINALIZADO
```

No mantiene abierto el ciclo.

---

# 15. Fuera de alcance

No se implementará en PRD010:

* `TIMEOUT`;
* cron reproductivo;
* cierre automático por paso del tiempo;
* detección de discontinuidad temporal;
* evento `TIMEOUT`;
* flujo completo de Aborto;
* nuevos Use Cases completos de Venta;
* nuevos Use Cases completos de Muerte;
* gestión de ubicación posterior al Destete;
* gestión de lotes posteriores al Destete;
* infraestructura general de acciones derivadas.

Sí se implementará el **mecanismo común de dominio necesario para que Venta y Muerte puedan finalizar una dependencia activa cuando sus respectivos Use Cases lo invoquen**.

Esto no significa implementar en PRD010 las pantallas o flujos completos de Venta y Muerte.

---

# 16. Invariantes

Deben preservarse:

* máximo un ciclo abierto por reproductora;
* eventos inmutables;
* estados derivados;
* `madre_id` inmutable;
* `estado_vinculo_materno` no editable;
* `estado_vinculo_materno` nullable;
* una cría destetada debe ser `RECRÍA + FINALIZADO`;
* una cría vendida/muerta antes del Destete puede permanecer `CRÍA + FINALIZADO`;
* una `RECRÍA + FINALIZADO` no participa en la continuidad del ciclo;
* el ciclo permanece abierto mientras exista `CRÍA + VIVO + ACTIVO`;
* el ciclo finaliza cuando existen cero;
* el cierre no es un evento;
* el nuevo ciclo no es un evento;
* el nuevo ciclo se crea solo si `es_reproductora = true`;
* nacido muerto no genera dependencia activa;
* el Destete es atómico.

---

# 17. Pruebas

Deberán existir pruebas de dominio y de integración suficientes para verificar como mínimo:

### Modelo

* creación de la columna;
* valores `NULL`, `ACTIVO`, `FINALIZADO`;
* backfill conservador;
* crías históricas sin información suficiente permanecen `NULL`.

### Parto

* cría viva → `CRÍA + ACTIVO`;
* nacido muerto → `NULL + FINALIZADO`;
* `madre_id` correctamente establecido;
* Parto futuro no crea crías con vínculo `NULL`.

### Destete

* una cría;
* varias crías;
* Destete parcial;
* Destete total;
* crías en fechas distintas;
* intento de destetar `RECRÍA`;
* intento de destetar cría muerta;
* intento de destetar cría vendida;
* atomicidad;
* idempotencia.

### Continuidad

* queda un vínculo → ciclo abierto;
* quedan varios → ciclo abierto;
* queda cero → ciclo finalizado.

### Nuevo ciclo

* `es_reproductora = true` → nuevo ciclo `VACÍA`;
* `es_reproductora = false` → no nuevo ciclo.

### Venta/Muerte

* cría activa vendida;
* cría activa muerta;
* cría ya destetada vendida;
* cría ya destetada muerta;
* madre vendida;
* madre muerta.

### Historial

* Destete visible desde madre;
* Destete visible desde cría;
* identificación individual de cada cría afectada;
* ausencia de eventos artificiales de cierre/inicio.

---

# 18. Resultado esperado

Al finalizar PRD010, el sistema dispondrá de un mecanismo coherente para representar:

```text
PARTO
  ↓
dependencias madre-cría
  ↓
Destete / Venta / Muerte
  ↓
finalización individual de vínculos
  ↓
evaluación de dependencias
  ↓
0 vínculos
  ↓
fin del ciclo
  ↓
nuevo ciclo VACÍA si es reproductora
```

El historial seguirá representando hechos reales.

Los estados y vínculos representarán conocimiento derivado.

El ciclo proporcionará contexto.

El carrusel explicará la historia agregada.

El usuario trabajará únicamente con acciones de negocio.

PRD010 no introduce un "evento de cierre".

Introduce la capacidad del dominio para **saber cuándo ya no existe ninguna dependencia funcional que justifique mantener abierto el ciclo**.
