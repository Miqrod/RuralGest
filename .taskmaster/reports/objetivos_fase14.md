# Objetivos Fase 14 — Instalaciones y Reubicación de Animales

## 1. Objetivo general

Implementar una primera versión completa, sencilla y auditable del gestión de instalaciones de la explotación y las ubicaciones operativas de los recursos, centrada en animales identificados y preparada estructuralmente para la futura gestión de ubicaciones de lotes.

La implementación debe respetar la arquitectura Event First, mantener las reglas de negocio en backend y ofrecer una experiencia User First.

---

## 2. Contexto y documentación obligatoria

Antes de comenzar las tareas, revisar:

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

### Precedencia

Las decisiones consolidadas en PRDs posteriores prevalecen sobre documentación anterior. PRD014 debe actualizar explícitamente cualquier documentación permanente que haya quedado obsoleta.

---

## 3. Objetivos funcionales

1. Consultar instalaciones.
2. Obtener el detalle de una instalación.
3. Gestionar administrativamente la creación y edición de instalaciones.
4. Activar y desactivar instalaciones con las reglas de negocio correspondientes.
5. Configurar usos operativos mediante `admite_animales` y `admite_stock`.
6. Mantener estos datos de configuración fuera de la edición operativa de la ficha y protegerlos mediante permisos de backend.
7. Impedir desactivación cuando existan animales vivos o lotes activos ubicados allí.
8. Permitir reactivar instalaciones.
9. Calcular `animales_count` en cada consulta, contando únicamente animales vivos.
10. Visualizar instalaciones en un mapa básico.
11. Configurar coordenadas de instalaciones mediante mapa + marcador.
12. Configurar coordenadas base de la explotación para inicializar mapas en la zona habitual.
13. Permitir instalaciones sin coordenadas.
14. Establecer una primera sección de Gestión/Configuración para administrar instalaciones y sus usos operativos.
15. Registrar reubicaciones de uno o varios animales.
16. Consultar historial de ubicación.
17. Proporcionar una pantalla `Instalaciones` con mapa y listado ordenable.
18. Proporcionar un `Detalle de instalación` accesible desde el listado y el mapa.
19. Proporcionar una pantalla global `Reubicaciones` para cualquier animal.
20. Permitir reubicación contextual desde la ficha animal y desde el dashboard de pendientes.
21. Mantener un único mecanismo de negocio para todos los flujos: `registrar_reubicacion_animales`.
22. Generar la ubicación inicial de las crías vivas.
23. Generar la ubicación inicial de animales comprados.
24. Finalizar la ubicación de animales vendidos o fallecidos.
25. Mantener coherente `animal.ubicacion_actual_id` con los eventos.

## 4. Decisión arquitectónica central

> Toda ubicación operativa de un animal comienza, cambia o finaliza mediante `CAMBIO_UBICACION`.

Esto implica:

```text
PARTO
  → CAMBIO_UBICACION inicial de la cría viva

COMPRA
  → CAMBIO_UBICACION inicial

REUBICACIÓN
  → CAMBIO_UBICACION A → B

VENTA
  → CAMBIO_UBICACION A → NULL

MUERTE
  → CAMBIO_UBICACION A → NULL
```

No convertir estos eventos de negocio en eventos de ubicación.

---

## 5. Modelo de datos

Mantener `rol_evento_animal_enum` y añadir:

```text
self
```

`self` significa que el evento se aplica al propio animal y no expresa una relación con otro animal. Es un valor interno y no se muestra al usuario.

Crear `instalacion` con:

- id;
- nombre;
- tipo;
- activo;
- `admite_animales`;
- `admite_stock`;
- coordenadas opcionales;
- observaciones;
- auditoría básica.

`tipo` es descriptivo. Los usos operativos los determinan los booleanos de configuración.

`activo`, `admite_animales` y `admite_stock` son configuración explícita, no datos derivados. Su modificación se realiza desde Gestión/Configuración y requiere permisos administrativos en backend.

Cambiar `admite_animales=false` no modifica la ubicación de los animales existentes.

Las coordenadas de la instalación se establecen mediante mapa + marcador, no mediante latitud/longitud como entrada primaria. Pueden quedar en `NULL`.

Las coordenadas base de la explotación son un dato general de configuración, independiente de las instalaciones.

Añadir a `eventos`:

- `ubicacion_origen_id`;
- `ubicacion_destino_id`.

Completar FK de:

- `animal.ubicacion_actual_id`;
- `lote.ubicacion_actual_id`.

No incluir perímetros, PostGIS, un sistema genérico/dinámico de capacidades ni jerarquías de instalaciones.

---

## 6. RPC de reubicación

Implementar:

```text
registrar_reubicacion_animales
```

Debe ser el **único mecanismo de backend utilizado para cualquier reubicación de animales**, independientemente de la pantalla de origen y de que afecte a uno o varios animales.

### Entrada

- `animal_ids[]`;
- `ubicacion_destino_id`;
- `fecha`.

### Reglas

Una operación agrupa:

```text
N animales + 1 destino + 1 fecha
```

No se permiten destinos ni fechas diferentes dentro de la misma operación.

Validar:

- lista no vacía;
- animales existentes;
- animales vivos;
- destino existente;
- destino activo y `admite_animales=true`;
- destino distinto del origen cuando ambos existen;
- fecha no futura;
- fecha no anterior al último `CAMBIO_UBICACION` de cada animal.

El origen se obtiene de `animal.ubicacion_actual_id`.

La operación completa es atómica.

Cada animal genera su propio evento.

No utilizar `MOVIMIENTO`.

No introducir `operation_id`.

## 7. Último cambio de ubicación

Determinar el último evento mediante:

```sql
ORDER BY fecha DESC, created_at DESC
LIMIT 1
```

La fecha nueva debe ser igual o posterior a la fecha del último cambio.

Se permiten varios cambios en el mismo día.

En selección múltiple, mostrar la última fecha de cambio de ubicación de cada animal.

Para el datepicker de una operación múltiple, puede utilizarse como mínimo común:

```text
MAX(última fecha de cambio de ubicación
    de los animales seleccionados)
```

El frontend puede utilizar esta regla para prevenir errores antes de confirmar, pero el RPC debe repetir la validación dentro de la transacción.

La última fecha de ubicación es informativa y nunca editable.

## 8. Extender RPCs existentes

### `registrar_parto`

Para cada cría viva:

```text
crear animal
→ CAMBIO_UBICACION inicial
→ actualizar ubicacion_actual_id
```

Usar la ubicación de la madre.

Madre sin ubicación:

```text
NULL → NULL
```

Cría nacida muerta: sin evento de ubicación.

### `registrar_compra_animal`

Añadir ubicación inicial opcional:

```text
NULL → ubicación
```

o:

```text
NULL → NULL
```

### `registrar_salida_animal`

Con ubicación:

```text
ubicación → NULL
```

Sin ubicación: no generar cambio adicional.

Mantener la atomicidad con la operación de salida.

---

## 9. Contexto del historial

Los cambios automáticos pueden incluir en `metadata_json`:

```json
{ "contexto": "parto" }
```

y equivalentes para:

- compra;
- venta;
- muerte.

La UI muestra la coletilla correspondiente.

No utilizar `evento_referencia_id` para causalidad ordinaria. Mantener su semántica actual para correcciones/compensaciones futuras.

---

## 10. Use Cases

### Consulta y operación

```text
listarInstalaciones
obtenerDetalleInstalacion
registrarReubicacionAnimales
getHistorialUbicacionesAnimal
```

### Administración / Configuración

```text
crearInstalacion
actualizarInstalacion
activarInstalacion
desactivarInstalacion
configurarUsosInstalacion
```

La implementación puede consolidar `configurarUsosInstalacion` dentro de `actualizarInstalacion` si el contrato administrativo resulta más claro. En cualquier caso, el backend debe autorizar las operaciones según los permisos del usuario.

No crear Use Case específico para el mapa.

## 11. Activación, desactivación y usos

`activo`, `admite_animales` y `admite_stock` son configuraciones independientes.

### `admite_animales`

Si se cambia a `false`, la instalación deja de ser destino válido para nuevas reubicaciones, pero los animales existentes permanecen allí y no se generan cambios de ubicación.

Si existen animales al desactivar `admite_animales`, la UI administrativa debe mostrar una confirmación informativa indicando que los animales permanecerán en la instalación y que ésta dejará de admitir nuevos animales.

Mientras existan animales, el `Detalle de instalación` debe seguir mostrando `Animales` y `Reubicar animales`, incluso con `admite_animales=false`. Cuando quede vacía, la sección deja de mostrarse.

### `activo`

Desactivar una instalación (`activo=false`) requiere comprobar dentro de la operación que no existan animales vivos ni lotes activos ubicados allí. Si existen, la operación se rechaza y la UI administrativa debe explicar la causa.

Una instalación inactiva no puede utilizarse como destino operativo. Reactivarla requiere permisos administrativos.

Todas estas operaciones están protegidas por autorización backend.

## 12. Lotes

Preparar la estructura común de ubicación de lotes, pero no implementar:

```text
registrar_reubicacion_lotes
```

La operativa de lotes queda para el bloque porcino.

No establecer todavía precedencia entre ubicación individual y ubicación de lote.

---

## 13. UX/UI de instalaciones, mapa y reubicación

### Pantalla `Instalaciones`

Combina mapa y listado. No es una pantalla de administración.

Debe mostrar datos básicos, usos operativos como información de consulta, estado y contador de animales cuando corresponda. El nombre y los puntos del mapa llevan al `Detalle de instalación`.

El mapa no permite editar instalaciones ni reubicar animales.

### `Detalle de instalación`

Muestra nombre, tipo, estado, usos operativos (`admite_animales`, `admite_stock`), coordenadas cuando existan y observaciones. Los usos se muestran como badges o literales simples y no son editables desde la ficha.

Si existen animales, se muestran:

```text
[ Animales ] [ Reubicar animales ]
```

Si `admite_animales=false` pero quedan animales, estas opciones siguen visibles. Cuando no queden animales, desaparecen.

### Pantalla `Reubicaciones`

Debe permitir listar, buscar, filtrar por una o varias ubicaciones, incluir animales sin ubicación, seleccionar uno o varios y mostrar la última fecha de cambio de ubicación. Los filtros de destino/ubicación operativa se basan en instalaciones activas que admiten animales.

Después de `Reubicar` se solicita el único destino y la única fecha de la operación.

### Dashboard — pendientes de ubicar

Permite seleccionar uno o varios animales sin ubicación y pasar al segundo paso de reubicación.

### Ficha animal

Desde `ACCIONES → Reubicar animal` se despliega el formulario inline, sin drawer ni modal. El animal y el origen ya están determinados por el contexto.

### Mapa y coordenadas

Las coordenadas de cada instalación son opcionales y se configuran en Administración mediante mapa + marcador.

La configuración general de la explotación dispone de coordenadas base, que sirven para centrar inicialmente los mapas. La prioridad es:

1. coordenadas de la instalación concreta, si existen y el contexto es el detalle de esa instalación;
2. coordenadas base de la explotación, si existen;
3. vista amplia por defecto.

Las coordenadas se muestran también como dato legible en la ficha cuando existen.

### Regla común

Todos los flujos convergen en:

```text
registrar_reubicacion_animales
```

En operaciones múltiples:

```text
N animales + 1 destino + 1 fecha
```

No se implementa drag & drop sobre el mapa.

## 14. Seed

Actualizar seed con:

- 5-6 instalaciones;
- tipos variados;
- combinaciones variadas de `admite_animales` / `admite_stock`;
- instalaciones con y sin coordenadas para QA del mapa;
- mayoría de animales ubicados;
- 2-3 animales vivos sin ubicación;
- escenarios útiles para QA.

Puede asignarse directamente `animal.ubicacion_actual_id` en el seed.

No generar eventos artificiales para simular la preparación del entorno.

---

## 15. Estados sin ubicación

Estado productivo válido:

```text
ubicacion_actual_id = NULL
```

con:

```text
CAMBIO_UBICACION NULL → NULL
```

Animal sin historial de ubicación:

```text
ubicacion_actual_id = NULL
```

sin `CAMBIO_UBICACION`.

No es un estado productivo esperado y puede existir únicamente por el seed actual.

No crear en PRD014 un mecanismo de regularización.

La futura carga/alta productiva deberá generar correctamente el evento inicial.

---

## 16. Correcciones

No implementar todavía el sistema transversal de corrección.

Los eventos son inmutables.

Los errores se corregirán mediante compensación en el futuro.

---

## 17. QA mínimo

### Instalaciones

- listar;
- detalle;
- crear/editar desde Administración;
- autorización backend;
- activar/desactivar;
- bloquear desactivación con animales;
- bloquear desactivación con lotes;
- reactivar;
- cambiar `admite_animales` con animales presentes sin desubicarlos;
- confirmación informativa al desactivar `admite_animales`;
- mantener animales/reubicación visibles hasta vaciar la instalación;
- ocultar sección de animales cuando quede vacía;
- conservar histórico;
- impedir destino si `activo=false` o `admite_animales=false`;
- configurar coordenadas mediante mapa + marcador;
- permitir coordenadas NULL;
- centrar mapa en coordenadas de instalación, luego base de explotación y, en último término, vista amplia.

### Reubicación

- un animal;
- varios animales;
- destino válido;
- destino inactivo;
- mismo origen/destino;
- animal muerto;
- animal inexistente;
- lista vacía;
- fecha actual;
- fecha pasada válida;
- fecha futura;
- fecha anterior al último cambio;
- selección múltiple con distintas últimas fechas;
- cálculo de fecha mínima común;
- fecha válida para todos los seleccionados;
- fecha inválida para al menos un seleccionado;
- rollback completo por fallo;
- concurrencia;
- un único destino por operación;
- una única fecha por operación;
- todos los puntos de entrada utilizan `registrar_reubicacion_animales`.

### Inicialización

- parto con madre ubicada;
- parto con madre sin ubicación;
- cría nacida muerta;
- compra con ubicación;
- compra sin ubicación.

### Salida

- venta con ubicación;
- venta sin ubicación;
- muerte con ubicación;
- muerte sin ubicación.

### UX/UI

- pantalla `Instalaciones`;
- ordenación del listado;
- acceso al detalle desde nombre;
- acceso al detalle desde mapa;
- hover con información básica;
- `Detalle de instalación`;
- alternancia `Animales` / `Reubicar animales`;
- pantalla global `Reubicaciones`;
- filtros dinámicos por ubicación;
- búsqueda;
- selección múltiple;
- última fecha visible y no editable;
- segundo paso destino + fecha;
- formulario inline en `ACCIONES` de ficha animal;
- flujo de pendientes de ubicación desde dashboard;
- responsive en escritorio, tablet y móvil;
- ausencia de drag & drop.

### Proyección

Comprobar coherencia entre:

```text
historial CAMBIO_UBICACION
```

y:

```text
animal.ubicacion_actual_id
```

---

## 18. Entregables

1. migrations;
2. tabla `instalacion`;
3. columnas y FK de ubicación;
4. RPC `registrar_reubicacion_animales`;
5. extensiones de `registrar_parto`;
6. extensiones de `registrar_compra_animal`;
7. extensiones de `registrar_salida_animal`;
8. Use Cases;
9. queries;
10. UI de ubicaciones;
11. UI de reubicación;
12. historial;
13. mapa;
14. seed;
25. QA;
25. documentación permanente actualizada.

---

## 19. Restricciones explícitas

No introducir:

- `MOVIMIENTO` para reubicaciones;
- `operation_id`;
- `TRASLADO`;
- perímetros;
- PostGIS;
- sistema genérico/dinámico de capacidades de instalación;
- jerarquías;
- reubicación de lotes;
- correcciones de eventos;
- carga inicial productiva;
- Engine nuevo salvo que una necesidad concreta y demostrada obligue a reconsiderarlo.

La implementación debe seguir el modelo existente antes de crear nuevas abstracciones.
