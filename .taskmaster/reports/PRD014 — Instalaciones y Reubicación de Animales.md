# PRD014 — Instalaciones y Reubicación de Animales

## 1. Objetivo

PRD014 introduce y consolida la gestión de instalaciones físicas de la explotación y de las ubicaciones operativas que dichas instalaciones proporcionan a los recursos y el mecanismo mediante el cual los animales identificados adquieren, cambian y pierden su ubicación operativa.

La solución debe ser sencilla para el usuario, rigurosa en el dominio y coherente con la arquitectura Event First ya consolidada.

La decisión arquitectónica central es:

> **Toda ubicación operativa de un animal comienza, cambia o finaliza mediante un evento `CAMBIO_UBICACION`.**

El PRD no convierte `PARTO`, `COMPRA`, `VENTA` o `MUERTE` en eventos de ubicación. Esas operaciones conservan su propia semántica y, cuando corresponde, generan además el hecho de ubicación necesario.

---

## 2. Contexto y prioridad documental

Antes de modificar código, revisar el contexto generado del proyecto y, como mínimo, los siguientes documentos.

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

### Documentación específica de PRD014

Durante la implementación debe utilizarse también la documentación/spec de ubicaciones disponible en el repositorio, si ya existe, y actualizarla al finalizar la fase.

### Precedencia

La documentación debe interpretarse teniendo en cuenta la evolución del proyecto.

Cuando exista una contradicción:

1. prevalecen las decisiones consolidadas en PRDs posteriores;
2. después, la documentación permanente actualizada;
3. después, la documentación histórica.

PRD014 **sobrescribe explícitamente cualquier definición anterior incompatible con las decisiones aquí consolidadas**.

No recuperar una decisión antigua únicamente porque aparezca en documentación previa.

---

## 3. Alcance

### Incluido

- nueva entidad `instalacion`;
- tipos básicos de instalación;
- activación/desactivación de instalaciones;
- coordenadas opcionales de las instalaciones;
- configuración de usos operativos mediante `admite_animales` y `admite_stock`;
- configuración de coordenadas base de la explotación;
- ubicación actual de animales;
- `CAMBIO_UBICACION` como evento de ubicación;
- uso de `rol_evento_animal = self` cuando el evento se aplica al propio animal;
- ubicación inicial de crías vivas;
- ubicación inicial de animales comprados;
- finalización de ubicación por venta y muerte;
- reubicación de uno o varios animales;
- historial de ubicación;
- contexto de presentación de cambios automáticos;
- pantalla `Instalaciones` con mapa y listado;
- pantalla `Detalle de instalación`;
- pantalla global `Reubicaciones`;
- modos de reubicación desde ficha animal, dashboard y detalle de ubicación;
- selección múltiple de animales con destino y fecha comunes;
- visualización de la última fecha de cambio de ubicación en los listados de selección múltiple;
- validación preventiva de fecha en frontend, manteniendo el RPC como autoridad definitiva;
- contador derivado de animales vivos por ubicación;
- mapa básico mediante coordenadas;
- infraestructura estructural para futuras ubicaciones de lotes;
- actualización del seed.
- primera pieza del entorno de Gestión/Configuración para administrar instalaciones y sus usos operativos;

### Fuera de alcance

- reubicación operativa de lotes;
- utilizar `MOVIMIENTO` para reubicaciones;
- `operation_id`;
- entidad `TRASLADO`;
- sistema genérico/dinámico de capacidades de instalación;
- jerarquías de instalaciones;
- GIS avanzado;
- PostGIS;
- perímetros/polígonos;
- inventario;
- stock;
- alimentación;
- finanzas;
- mecanismo de carga/regularización inicial de animales en producción;
- sistema transversal de corrección de eventos;
- reconstrucción automática de proyecciones como funcionalidad productiva;
- drag & drop de animales sobre el mapa.

---

## 4. Modelo conceptual

Una **instalación** representa un espacio físico de la explotación: por ejemplo, un cercado, corral, nave, pajar o almacén.

Una instalación puede tener uno o varios usos operativos configurados. En particular, `admite_animales` indica si puede utilizarse como destino de nuevas ubicaciones de animales, mientras que `admite_stock` indica si puede utilizarse para ubicar stock. Estos usos son configuración explícita, no datos derivados.

Para los animales, una instalación que admite su presencia actúa como su **ubicación actual**. Por ello, el concepto de ubicación sigue existiendo en el dominio aunque la entidad física se denomine `instalacion`.

La entidad instalación no representa stock, inventario ni una colección persistida de animales.

El estado actual del animal se mantiene como proyección:

```text
animal.ubicacion_actual_id
```

La fuente de verdad es la secuencia de eventos:

```text
CAMBIO_UBICACION
```

La proyección se actualiza en la misma transacción que genera el evento.

No se utilizarán triggers complejos para mantenerla.

### Rol del animal en `evento_animales`

Se mantiene el enum existente `rol_evento_animal_enum` y sus valores actuales `madre` y `cria`.

PRD014 añade el valor:

```text
self
```

`self` indica que el evento se aplica al propio animal sobre el que se registra, sin representar una relación con otro animal.

Ejemplos:

```text
PARTO            → madre
DESTETE          → cria
CAMBIO_UBICACION → self
VENTA             → self
MUERTE            → self
```

El valor es interno y no se muestra al usuario.

---

## 5. Ciclo de vida de la ubicación del animal

### 5.1 Nacimiento

`registrar_parto` mantiene su semántica reproductiva.

Para cada cría viva:

1. crear el animal;
2. obtener la ubicación actual de la madre;
3. generar un `CAMBIO_UBICACION` inicial;
4. actualizar `animal.ubicacion_actual_id`;
5. completar la operación dentro de la misma transacción.

Si la madre tiene ubicación:

```text
NULL → ubicación madre
```

Si la madre no tiene ubicación:

```text
NULL → NULL
```

`NULL → NULL` significa que la cría entra en el sistema sin una ubicación operativa asignada.

Las crías nacidas muertas no reciben `CAMBIO_UBICACION`, porque no adquieren una ubicación operativa.

### 5.2 Compra / entrada

`registrar_compra_animal` debe aceptar una ubicación inicial opcional.

Si se conoce:

```text
NULL → ubicación
```

Si no se conoce:

```text
NULL → NULL
```

En ambos casos se registra el `CAMBIO_UBICACION` inicial.

### 5.3 Reubicación

Una reubicación manual genera:

```text
ubicación actual → nueva ubicación
```

El origen lo determina el backend mediante:

```text
animal.ubicacion_actual_id
```

El frontend no puede proporcionar ni imponer el origen.

### 5.4 Venta / muerte

Cuando un animal deja de tener ubicación operativa en la explotación:

```text
ubicación actual → NULL
```

si tenía una ubicación.

El snapshot queda:

```text
animal.ubicacion_actual_id = NULL
```

Si ya era `NULL`, no se genera otro `CAMBIO_UBICACION`, porque no existe cambio de ubicación que registrar.

La venta o muerte mantiene además su propio evento de negocio.

---

## 6. Semántica de origen y destino

Combinaciones válidas:

| Origen | Destino | Significado |
|---|---|---|
| `NULL` | ubicación | primera ubicación conocida |
| `NULL` | `NULL` | entrada sin ubicación asignada |
| ubicación A | ubicación B | reubicación |
| ubicación A | `NULL` | finalización de ubicación operativa |

No es válida:

```text
A → A
```

porque no existe cambio real.

La única combinación idéntica permitida es:

```text
NULL → NULL
```

y únicamente cuando representa una entrada/inicialización sin ubicación asignada.

---

## 7. Historial y contexto

El historial específico de ubicación se obtiene filtrando eventos `CAMBIO_UBICACION`.

El orden canónico es:

```sql
ORDER BY fecha DESC, created_at DESC
```

Los `CAMBIO_UBICACION` generados automáticamente por otras operaciones pueden mostrar una coletilla contextual:

- `(parto)`
- `(compra)`
- `(venta)`
- `(muerte)`

Ejemplo:

```text
Cambio de ubicación → Corrales Norte (parto)
Cambio de ubicación → Corrales Norte (compra)
Cambio de ubicación → Sin ubicación (venta)
Cambio de ubicación → Sin ubicación (muerte)
```

La coletilla:

- no la introduce el usuario;
- no crea un nuevo concepto de dominio;
- se genera por el RPC que conoce el contexto de la operación;
- se almacena como metadato auxiliar en `metadata_json`.

Ejemplo:

```json
{
  "contexto": "parto"
}
```

`evento_referencia_id` **no se reutiliza para esta finalidad**. Mantiene su semántica actual, concebida para el futuro mecanismo de corrección/compensación de eventos.

---

## 8. Temporalidad

Para determinar el último `CAMBIO_UBICACION` de un animal se utilizará:

```sql
ORDER BY fecha DESC, created_at DESC
LIMIT 1
```

La fecha de una nueva reubicación no puede ser anterior a la fecha del último `CAMBIO_UBICACION`.

Se permiten varios cambios el mismo día.

No se impone un máximo de un cambio diario.

Si existen dos eventos con la misma fecha, `created_at` determina el orden canónico.

La existencia de dos cambios el mismo día no es por sí misma un error de negocio. Si posteriormente se detecta un registro incorrecto, se resolverá mediante el futuro mecanismo transversal de corrección, sin modificar ni eliminar el evento original.

---

## 9. Modelo de datos

### 9.1 Tabla `instalacion`

Crear una entidad física sencilla con:

```text
id
nombre
tipo
activo
admite_animales
admite_stock
coordenadas
observaciones
created_at
created_by
```

`tipo` es una clasificación descriptiva de la instalación. No determina por sí mismo sus usos operativos.

`admite_animales` y `admite_stock` son configuración explícita, no datos derivados. En PRD014 se implementan estos dos usos y se deja abierta la incorporación futura de otros usos mediante nuevos atributos de configuración, sin crear un sistema genérico de capacidades.

Los atributos de uso operativo y `activo` no se editan desde la ficha operativa de la instalación. Su modificación queda reservada al entorno de Gestión/Configuración y requiere permisos administrativos validados por backend.

Las coordenadas son opcionales y se almacenan estructuralmente en la instalación. La interfaz administrativa debe permitir definirlas mediante un mapa y un marcador, evitando que la latitud/longitud manual sea la vía primaria de entrada.

No incluir en v1:

- perímetros;
- PostGIS;
- geometrías complejas;
- jerarquías;
- sistema genérico/dinámico de capacidades.

La configuración general de la explotación tendrá además unas **coordenadas base de explotación**, independientes de las coordenadas de cada instalación. Se utilizarán como punto inicial de los mapas cuando no exista una coordenada específica de instalación.

### 9.2 Tabla `eventos`

Añadir:

```text
ubicacion_origen_id
ubicacion_destino_id
```

como FK a:

```text
ubicacion.id
```

Son datos estructurales del evento y no deben esconderse en `metadata_json`.

### 9.3 Proyecciones

Completar las FK de:

```text
animal.ubicacion_actual_id → instalacion.id
lote.ubicacion_actual_id   → instalacion.id
```

La proyección del animal se actualiza transaccionalmente con el evento.

---

## 10. Activación, desactivación y usos de instalaciones

Una instalación tiene dos dimensiones de configuración independientes:

```text
activo
    ↓
¿Está operativamente habilitada?

admite_animales
    ↓
¿Puede utilizarse como destino de nuevos animales?

admite_stock
    ↓
¿Puede utilizarse para ubicar stock?
```

Estos valores son configuración de la explotación, no datos derivados. Se administran desde el entorno de Gestión/Configuración y su modificación requiere permisos administrativos en backend.

### `admite_animales`

Cambiar:

```text
admite_animales = true
```
a:
```text
admite_animales = false
```
no modifica la ubicación actual de ningún animal, no genera `CAMBIO_UBICACION` y no implica expulsar ni desubicar animales existentes.

Puede existir, por tanto:

```text
Instalación
admite_animales = false

20 animales actualmente ubicados allí
```

Esto significa que la instalación ya no está habilitada como destino para nuevas ubicaciones de animales, pero los animales actuales permanecen allí.

Si se intenta desactivar `admite_animales` y existen animales en la instalación, la interfaz administrativa debe mostrar una confirmación informativa, por ejemplo:

```text
⚠️ Esta instalación tiene actualmente 20 animales.

Desactivar la admisión de animales impedirá utilizarla
como destino para nuevas ubicaciones.

Los animales actuales permanecerán en esta instalación.

[Cancelar] [Confirmar]
```

La ficha de la instalación seguirá mostrando la sección de animales y la posibilidad de reubicarlos mientras existan animales allí, aunque `admite_animales=false`. Cuando ya no queden animales, esa sección operativa dejará de mostrarse.

### `activo`

Desactivar una instalación significa:

```text
activo = false
```

No significa eliminarla. La instalación conserva su identidad, datos, coordenadas, observaciones, histórico y referencias desde eventos.

No se permite establecer `activo=false` mientras exista:

- un animal vivo ubicado allí;
- un lote activo ubicado allí;
- cualquier otro recurso cuya permanencia deba impedir la desactivación según las reglas futuras del modelo.

La comprobación debe realizarse de forma segura y dentro de la operación de desactivación. Si existen animales, la UI administrativa debe explicar el motivo del bloqueo, por ejemplo:

```text
⚠️ No se puede desactivar esta instalación porque actualmente contiene 20 animales.

Reubica primero los animales antes de desactivar la instalación.

[Cancelar]
```

Una instalación inactiva no puede seleccionarse para nuevas operaciones operativas. Puede volver a activarse mediante la operación administrativa correspondiente.

## 11. Lotes

Un lote anónimo es una unidad de stock/cantidad, no una colección de animales identificados.

Por tanto:

```text
lote.ubicacion_actual_id
```

representa la ubicación de esa unidad de stock.

Mientras que:

```text
animal.ubicacion_actual_id
```

representa la ubicación del animal identificado.

PRD014 prepara la infraestructura para ambos conceptos, pero no implementa la operativa de reubicación de lotes.

No establecer todavía una regla universal del tipo "la ubicación del animal gana a la del lote". La semántica futura de coexistencia se resolverá cuando se diseñe el bloque porcino correspondiente.

---

## 12. Reubicación de animales

La operación de negocio se denomina **reubicar animales**.

La regla arquitectónica es inviolable:

> **Toda reubicación de uno o varios animales, independientemente de la pantalla desde la que se inicie, se ejecuta exclusivamente mediante `registrar_reubicacion_animales`.**

Las distintas interfaces son únicamente diferentes puntos de entrada y diferentes niveles de contexto para la misma operación de negocio. No existirán mecanismos alternativos de persistencia de una reubicación.

### 12.1 Unidad de operación

Una operación de reubicación puede afectar a uno o varios animales, pero todos los animales incluidos en una misma operación deben compartir:

- una única ubicación de destino;
- una única fecha de reubicación.

Por tanto:

```text
N animales + 1 destino + 1 fecha
```

Si se necesitan destinos o fechas diferentes, se realizan operaciones independientes.

La decisión es deliberada y prioriza rapidez, claridad y reducción de errores en operaciones masivas.

### 12.2 Entrada del RPC

```text
registrar_reubicacion_animales
```

recibe como mínimo:

- lista de IDs de animales;
- ubicación destino;
- fecha de reubicación.

El origen nunca lo proporciona el frontend. El backend lo obtiene de:

```text
animal.ubicacion_actual_id
```

La operación genera un `CAMBIO_UBICACION` individual por animal.

### 12.3 Validaciones de negocio

Validar:

- lista no vacía;
- todos los animales existen;
- todos los animales están vivos;
- destino existente;
- destino activo y `admite_animales=true`;
- destino distinto del origen cuando ambos existen;
- fecha no futura;
- fecha no anterior al último `CAMBIO_UBICACION` de cada animal.

El último evento se determina mediante:

```sql
ORDER BY fecha DESC, created_at DESC
LIMIT 1
```

La validación definitiva pertenece al RPC y se realiza dentro de la transacción.

### 12.4 Atomicidad

La operación completa es transaccional.

Si falla un solo animal:

```text
ROLLBACK
```

No puede existir una reubicación masiva parcialmente aplicada.

Cuando se bloqueen varios animales, hacerlo en orden determinista, por ejemplo por `animal.id`, para reducir el riesgo de deadlocks.

Cada animal genera su propio `CAMBIO_UBICACION`.

Una reubicación masiva no genera un evento agregado ni utiliza `MOVIMIENTO`.

### 12.5 Fecha de reubicación

La fecha:

- no puede ser futura;
- debe ser igual o posterior al último cambio de ubicación del animal;
- puede ser anterior a la fecha actual;
- puede coincidir con la fecha del último cambio;
- puede coincidir con la fecha de otros cambios.

En operaciones individuales, el datepicker puede limitarse directamente al intervalo:

```text
último cambio de ubicación → hoy
```

En operaciones múltiples, el componente puede calcular una fecha mínima común:

```text
MAX(última fecha de cambio de ubicación
    de los animales seleccionados)
```

y utilizarla como mínimo del datepicker.

La última fecha de ubicación de cada animal se muestra en la interfaz de selección y nunca es editable.

La validación preventiva del frontend es una ayuda UX y no sustituye la validación del RPC. Si el estado cambia entre la validación de interfaz y la ejecución, el RPC debe volver a comprobar la regla y mantener el rollback completo.

### 12.6 Componente funcional de reubicación

La aplicación utilizará una única pieza funcional reutilizable para la selección/configuración de reubicaciones, adaptada visualmente al contexto.

El componente debe separar dos pasos:

**Paso 1 — Selección de animales**

Seleccionar uno o varios animales.

**Paso 2 — Datos de la reubicación**

Seleccionar:

- destino común;
- fecha común.

Después:

```text
Confirmar
```

En los flujos con selección explícita, destino y fecha no se muestran hasta que el usuario haya seleccionado los animales y pulsado `Reubicar`. En el flujo individual de ficha animal, la selección ya está determinada por el contexto y el formulario mínimo puede mostrarse directamente al activar la acción.

### 12.7 Puntos de entrada UX

#### A. Ficha animal

Desde el panel:

```text
ACCIONES → Reubicar animal
```

El formulario se despliega dentro del propio panel, sin drawer ni modal.

Como el animal ya está determinado por la ficha, no se muestra selector de animal ni se repite información sobre animal/origen.

Formulario:

```text
Fecha de reubicación
[ datepicker ]

Selecciona la ubicación de destino
[ select ]

[ Cancelar ] [ Confirmar ]
```

El datepicker se limita al intervalo válido para ese animal.

No se añade un segundo botón de reubicación en el widget que muestra la ubicación actual del animal.

#### B. Dashboard — pendientes de ubicar

El widget permite seleccionar uno o varios animales pendientes de ubicación.

Al pulsar:

```text
Reubicar
```

se abre el segundo paso con:

```text
Destino
Fecha
```

La selección está limitada al subconjunto de animales sin ubicación actual que presenta el widget.

La interfaz puede implementarse como drawer para mantener el contexto del dashboard.

#### C. Pantalla global `Reubicaciones`

Permite reubicar cualquier animal, tenga o no ubicación.

Debe ofrecer:

- listado de animales;
- selección individual mediante checkbox;
- buscador;
- filtros por una o varias ubicaciones;
- opción de mostrar animales sin ubicación;
- filtros de ubicación generados dinámicamente a partir de ubicaciones activas aptas para animales;
- última fecha de cambio de ubicación por animal.

Después de seleccionar animales:

```text
Reubicar
```

abre el segundo paso:

```text
Destino
Fecha
Confirmar
```

No se permite introducir destinos ni fechas diferentes dentro de una misma operación.

#### D. `Detalle de instalación`

La ficha de una instalación concreta debe permitir consultar y operar sobre los animales presentes sin obligar al usuario a abandonar el contexto.

La sección de animales alternará mediante controles claros, por ejemplo:

```text
[ Animales ] [ Reubicar animales ]
```

**Animales** muestra el listado de consulta.

**Reubicar animales** muestra una versión compacta del componente:

- checkbox;
- nombre/crotal;
- última fecha de cambio de ubicación.

No se muestran filtros de ubicación porque el origen ya está determinado por la instalación cuya ficha se está consultando.

Al pulsar:

```text
Reubicar
```

se pasa al segundo paso con destino y fecha comunes.

El origen se pasa al flujo como contexto de interfaz, pero nunca se envía como autoridad al RPC: el backend vuelve a obtener el origen real de cada animal.

### 12.8 Responsive

La reutilización del componente no implica una interfaz visual idéntica en todos los contextos.

En escritorio, la sección de animales del `Detalle de instalación` debe disponer de suficiente ancho para mostrar cómodamente el listado y su modo de reubicación. Como referencia de diseño, puede reservarse aproximadamente la mitad del espacio disponible, ajustándolo a la composición real de la pantalla.

En tablet y móvil la distribución puede pasar a un layout vertical o más compacto.

En móvil no se debe intentar mantener una tabla de escritorio comprimida: el listado puede transformarse en filas/tarjetas donde la selección y la última fecha sigan siendo fácilmente legibles.

La operación debe conservar exactamente la misma secuencia:

```text
selección → Reubicar → destino + fecha → Confirmar
```

### 12.9 Drag & drop

No implementar drag & drop de animales sobre el mapa ni utilizarlo como mecanismo de reubicación.

La prioridad es:

- sencillez;
- claridad;
- eficacia;
- selección múltiple;
- compatibilidad táctil;
- reducción de errores.

El mapa es principalmente una herramienta de consulta y navegación hacia el detalle de la ubicación, no una superficie de edición de ubicaciones de animales.


## 13. Animales sin ubicación

Hay dos estados conceptualmente distintos.

### Sin ubicación, con historial

```text
animal.ubicacion_actual_id = NULL
```

y existe:

```text
CAMBIO_UBICACION NULL → NULL
```

Es un estado válido en producción.

Posteriormente puede producirse:

```text
NULL → ubicación A
```

### Sin historial

```text
animal.ubicacion_actual_id = NULL
```

y no existe ningún `CAMBIO_UBICACION`.

No es un estado productivo esperado.

Puede existir en el seed actual porque se trata de datos de desarrollo previos a PRD014.

PRD014 no implementa un mecanismo de regularización.

La futura carga/alta productiva deberá generar correctamente el evento inicial.

---

## 14. Use Cases

Separar la consulta/operación diaria de la administración de la configuración de instalaciones.

### Operación y consulta

```text
listarInstalaciones
obtenerDetalleInstalacion
registrarReubicacionAnimales
getHistorialUbicacionesAnimal
```

`obtenerDetalleInstalacion` alimenta la ficha contextual de una instalación concreta. No existe una pantalla de menú independiente denominada "Ficha de instalación".

### Administración / Configuración

Las operaciones administrativas de instalaciones son: 

```text
crearInstalacion
actualizarInstalacion
activarInstalacion
desactivarInstalacion
configurarUsosInstalacion
```

La implementación puede consolidar `configurarUsosInstalacion` dentro de `actualizarInstalacion` si el contrato administrativo resulta más claro, pero `admite_animales`, `admite_stock` y `activo` deben permanecer protegidos por permisos administrativos en backend.

La configuración de las coordenadas de una instalación forma parte de la administración de la instalación y se realiza mediante mapa + marcador.

La ubicación base de la explotación es un dato general de configuración de la explotación y no una instalación especial.

No crear un Use Case específico para el mapa.

`animales_count` es un dato derivado de consulta y cuenta únicamente animales vivos.

## 15. UX/UI de instalaciones, mapa y reubicación

PRD014 diferencia claramente tres pantallas/ámbitos:

1. `Instalaciones`;
2. `Detalle de instalación`;
3. `Reubicaciones`.

### 15.1 Pantalla `Instalaciones`

Es la pantalla general de consulta de las instalaciones de la explotación. No es una pantalla de administración: la creación, edición y configuración operativa se realizan desde Gestión/Configuración.

Debe combinar:

- mapa;
- listado de instalaciones.

El listado tendrá, como mínimo:

- nombre;
- tipo;
- estado;
- usos operativos relevantes, mostrados como información de consulta;
- contador derivado de animales vivos cuando corresponda;
- otros datos básicos definidos por el modelo.

El nombre será clicable y llevará al `Detalle de instalación`.

El mapa permitirá:

- mostrar las instalaciones que dispongan de coordenadas;
- realizar interacción básica;
- mostrar información resumida al pasar el cursor/hover sobre una instalación;
- acceder al `Detalle de instalación` al clicar sobre ella.

El mapa no es una superficie de edición ni de reubicación de animales.

### 15.2 `Detalle de instalación`

Es la ficha de una instalación concreta y se utiliza para consulta y operación contextual, no para administrar su configuración estructural.

Debe mostrar:

- nombre;
- tipo;
- estado;
- usos operativos, por ejemplo mediante badges o literales simples (`Admite animales`, `Admite stock`);
- coordenadas, cuando existan;
- observaciones.

Las coordenadas se muestran también como valor legible para que el usuario pueda disponer de ellas. No se obliga a que una instalación tenga coordenadas.

No se editan desde esta ficha los datos de configuración con consecuencias operativas (`activo`, `admite_animales`, `admite_stock`). Tampoco se editan datos derivados como el contador de animales.

La ficha incluye una sección de animales presentes actualmente en la instalación.

Si existen animales, la sección permite alternar:

```text
[ Animales ] [ Reubicar animales ]
```

La vista `Animales` es principalmente de consulta.

La vista `Reubicar animales` utiliza el modo compacto del componente común de reubicación, limitado a los animales actualmente ubicados en esa instalación. No se muestran filtros de ubicación porque el origen ya está determinado por el contexto.

Si `admite_animales=false` pero todavía existen animales, la sección y la posibilidad de reubicarlos siguen visibles para permitir vaciar la instalación. Cuando no queden animales, la sección deja de mostrarse.

La ficha puede quedar preparada para futuras secciones de lotes, existencias y otros datos propios de la instalación, sin implementarlos en PRD014.

### 15.3 Pantalla `Reubicaciones`

Es la herramienta global para reubicar cualquier animal.

Debe permitir:

- buscar animales;
- filtrar por ubicación actual;
- combinar filtros de una o varias ubicaciones;
- seleccionar uno o varios animales;
- consultar la última fecha de cambio de ubicación de cada animal;
- iniciar una operación de reubicación.

Los filtros de ubicación deben generarse dinámicamente a partir de las ubicaciones activas que puedan albergar animales.

No debe ser necesario crear manualmente un filtro cada vez que se crea una ubicación.

La selección de animales constituye el paso 1.

El botón `Reubicar` conduce al paso 2:

```text
Destino
Fecha
```

y posteriormente a la confirmación.

### 15.4 Regla común de interacción

Todos los contextos de reubicación deben converger en la misma secuencia conceptual:

```text
seleccionar animales
        ↓
Reubicar
        ↓
seleccionar destino común
        ↓
seleccionar fecha común
        ↓
Confirmar
        ↓
registrar_reubicacion_animales
```

La ficha animal constituye la excepción visual en cuanto a selección: el animal ya viene determinado por el contexto, por lo que no existe paso de selección explícito.

### 15.5 Mapa

El mapa debe evitar cargas cartográficas innecesarias y ofrecer una inicialización contextual.

La prioridad para el centro/zoom inicial será:

1. si se está mostrando el `Detalle de instalación` y la instalación tiene coordenadas, centrar el mapa en las coordenadas de esa instalación;
2. si no hay coordenadas específicas de instalación pero existen coordenadas base de la explotación, centrar el mapa en ellas;
3. si tampoco existen coordenadas base de la explotación, utilizar una vista amplia por defecto.

En la pantalla general `Instalaciones`, si existen coordenadas base de la explotación, el mapa se inicializa centrado en esa zona y después muestra los marcadores disponibles. Si no existen, utiliza la vista amplia por defecto.

Las coordenadas base de la explotación son un dato general de configuración y no una instalación.

En la administración de instalaciones, las coordenadas de una instalación se establecen mediante un mapa y un marcador. El usuario puede colocar/arrastrar el marcador sobre el punto deseado y el sistema obtiene las coordenadas. La latitud y longitud no son la vía primaria de entrada.

Las coordenadas pueden quedar sin definir (`NULL`). Una instalación sin coordenadas sigue apareciendo en el listado, pero no tiene marcador en el mapa.

El mapa de consulta no permite arrastrar animales ni cambiar su ubicación.

## 16. Seed

Actualizar el seed con:

- 5-6 instalaciones;
- tipos variados y combinaciones variadas de `admite_animales` / `admite_stock`;
- al menos una instalación con coordenadas y, para QA del mapa, posibilidad de instalaciones sin coordenadas;
- variedad de tipos;
- mayoría de animales con ubicación;
- 2-3 animales vivos sin ubicación;
- distribución suficiente para probar reubicaciones;
- datos útiles para probar ubicaciones activas/inactivas.

El seed puede asignar directamente `animal.ubicacion_actual_id` porque no representa una operación productiva.

No crear artificialmente un historial de eventos para simular esa preparación del entorno.

---

## 17. Correcciones

PRD014 no implementa el mecanismo general de corrección de eventos.

Los `CAMBIO_UBICACION` son inmutables.

Un error futuro se resolverá mediante compensación/corrección, respetando la arquitectura ya consolidada.

`evento_referencia_id` se conserva con su semántica actual y no se redefine en PRD014.

---

## 18. MOVIMIENTO y operation_id

### MOVIMIENTO

Se mantiene la semántica original de `MOVIMIENTO`.

No se utilizará para:

```text
CAMBIO_UBICACION
```

ni para agrupar los eventos generados por una reubicación masiva.

### operation_id

No se introduce en PRD014.

La correlación genérica de eventos generados por una misma operación de aplicación no constituye actualmente una necesidad suficiente para añadir esta abstracción.

Si en el futuro aparece una necesidad real, se estudiará independientemente como mecanismo de correlación/idempotencia de operaciones de aplicación.

No será un sustituto de `MOVIMIENTO` ni se convertirá en un `UNIQUE` global de `eventos`.

---

## 19. Criterios de aceptación principales

### Instalaciones

- listar instalaciones;
- obtener detalle de una instalación;
- mostrar tipo como clasificación descriptiva;
- mostrar usos operativos (`admite_animales`, `admite_stock`) como información no editable desde la ficha;
- crear y editar instalaciones desde el entorno de Gestión/Configuración;
- restringir en backend las operaciones administrativas a usuarios con permisos adecuados;
- activar;
- desactivar;
- impedir desactivación con animales vivos o lotes activos;
- mostrar el motivo del bloqueo de desactivación;
- permitir desactivar `admite_animales` aunque existan animales, sin modificar su ubicación;
- mostrar confirmación informativa al desactivar `admite_animales` cuando haya animales;
- mantener visibles los animales y la opción de reubicarlos mientras queden animales en una instalación con `admite_animales=false`;
- ocultar la sección de animales cuando quede vacía;
- conservar histórico;
- impedir uso operativo de instalaciones inactivas;
- permitir reactivación;
- impedir que una instalación con `activo=false` o `admite_animales=false` sea destino de una nueva reubicación;
- mostrar coordenadas cuando existan;
- permitir instalaciones sin coordenadas;
- definir coordenadas mediante mapa + marcador en administración;
- configurar coordenadas base de la explotación desde la configuración general.


### Nacimiento

- cría viva recibe ubicación de la madre;
- se genera `CAMBIO_UBICACION`;
- madre sin ubicación produce `NULL → NULL`;
- cría nacida muerta no recibe cambio de ubicación.

### Compra

- ubicación inicial opcional;
- ubicación conocida produce `NULL → ubicación`;
- ubicación desconocida produce `NULL → NULL`.

### Reubicación

- uno o varios animales;
- operación atómica;
- destino activo y `admite_animales=true`;
- animal vivo;
- destino diferente;
- fecha válida;
- origen calculado por backend;
- un evento por animal;
- destino único por operación;
- fecha única por operación;
- el segundo paso de destino/fecha aparece después de la selección y de pulsar `Reubicar`;
- la última fecha de cambio de ubicación se muestra en selección múltiple y no es editable;
- el frontend puede prevenir fechas incompatibles usando la fecha mínima común;
- el RPC mantiene la validación definitiva y el rollback completo;
- los cuatro puntos de entrada convergen en `registrar_reubicacion_animales`.

### Salida

- venta/muerte con ubicación genera `ubicación → NULL`;
- venta/muerte sin ubicación no genera cambio adicional;
- snapshot queda en `NULL`.

### Historial

- filtra `CAMBIO_UBICACION`;
- ordena por `fecha DESC, created_at DESC`;
- muestra contexto automático cuando corresponda.

### Proyección

El último evento de ubicación y `animal.ubicacion_actual_id` deben permanecer coherentes.

### UX/UI

- pantalla `Instalaciones` con mapa y listado;
- listado ordenable;
- nombre de instalación y punto del mapa llevan al `Detalle de instalación`;
- hover del mapa muestra información básica;
- `Detalle de instalación` permite consultar animales;
- `Detalle de instalación` permite alternar entre `Animales` y `Reubicar animales`;
- pantalla global `Reubicaciones`;
- ficha animal permite reubicar desde `ACCIONES`;
- dashboard permite reubicar pendientes;
- selección múltiple muestra última fecha de ubicación;
- destino y fecha se solicitan en un segundo paso;
- una operación sólo admite un destino y una fecha;
- responsive sin dependencia de drag & drop.

---

## 20. Documentación que debe actualizarse

Al finalizar PRD014, actualizar la documentación permanente afectada para que las decisiones no queden únicamente dentro del PRD.

Como mínimo deben quedar reflejados:

- que la entidad física es `instalacion`, no `ubicacion`;
- que la ubicación sigue siendo un concepto de dominio para expresar dónde se encuentra un recurso;
- los campos `admite_animales` y `admite_stock` y su semántica;
- que los usos operativos y `activo` son configuración administrativa y no datos derivados;
- las reglas de modificación y autorización backend de dicha configuración;
- la semántica de las coordenadas de instalación y de las coordenadas base de la explotación;
- el comportamiento del mapa según la disponibilidad de coordenadas;
- la separación entre consulta/operación y Gestión/Configuración.


- entidad `instalacion`;
- semántica de la ubicación operativa y de `CAMBIO_UBICACION`;
- relación entre instalación/ubicación operativa y parto/compra/venta/muerte;
- semántica de `NULL`;
- regla temporal;
- activación/desactivación;
- ubicación de animales;
- infraestructura futura de lotes;
- exclusión de `MOVIMIENTO` y `operation_id`;
- precedencia de las decisiones de PRD posteriores.




