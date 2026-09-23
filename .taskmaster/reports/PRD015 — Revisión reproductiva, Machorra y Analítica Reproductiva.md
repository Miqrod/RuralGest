# PRD015 — Revisión reproductiva, Machorra y Analítica Reproductiva

**Estado:** Definición cerrada para implementación
**Fase:** 15
**Dominio:** Ganadero / Reproductivo
**Especie inicial:** Vacuno
**Dependencias principales:** PRD013, PRD014
**Documentación permanente asociada:** modelo reproductivo, flujo de machorra, analítica reproductiva

**Documentos complementarios obligatorios:**
- `objetivos_fase15.md` — objetivos funcionales detallados y criterios de aceptación
- `PRD015-Anexo-Modelo-Explotacion-y-Parametrizacion.md` — modelo de datos de explotacion y parametrizacion, reglas de unicidad, tipos de valor y UI de configuración
- `PRD015-contexto-decisiones.md` — decisiones técnicas resueltas antes de la implementación: estado del RPC registrar_machorra, especie_enum vs tabla, singleton explotacion, seed rows, ImageUploadCropper, lógica de dos fases en getOffspringFollowUp, y demás invariantes de implementación

---

## 1. Objetivo

PRD015 incorpora tres capacidades relacionadas con la gestión reproductiva del ganado vacuno:

1. **Revisión reproductiva**, para detectar hembras reproductoras cuyo ciclo lleva un tiempo superior al umbral configurado sin alcanzar una gestación confirmada.
2. **Registro de Machorra**, integrando la disponibilidad de esta acción dentro de las reglas actuales del ciclo reproductivo.
3. **Analítica reproductiva**, creando la primera implementación de la futura sección global de Analítica de la explotación.

El objetivo no es construir un sistema de diagnóstico veterinario ni un motor predictivo de fertilidad.

El sistema debe proporcionar al ganadero:

* visibilidad sobre animales que requieren atención;
* una acción explícita para registrar una Machorra cuando corresponda;
* una lectura histórica de la actividad reproductiva;
* información sobre los resultados de los partos y la supervivencia de las crías hasta el destete;
* filtros temporales y dimensionales que permitan analizar la explotación sin atribuir los datos a dimensiones que no puedan explicarlos correctamente.

La implementación debe mantenerse deliberadamente sencilla y alineada con la arquitectura Event First existente.

---

# 2. Documentación obligatoria

Antes de implementar PRD015 se deben revisar:

## Specs

* `product_spec.md`
* `backend_spec.md`
* `frontend_spec.md`
* `frontend_patterns.md`

## Modelo

* `documentacion/base_conocimiento/modelo/modelo_ganadero.md`
* `documentacion/base_conocimiento/modelo/modelo_reproductivo.md`

## Arquitectura

* `documentacion/base_conocimiento/arquitectura/overview.md`
* `documentacion/base_conocimiento/dominios/reproductivo.md`
* `documentacion/base_conocimiento/arquitectura/patterns/context-rules-projection-pattern.md`
* `documentacion/base_conocimiento/arquitectura/patterns/action-usecase-event.md`
* `documentacion/base_conocimiento/arquitectura/patterns/rpc-transaccional.md`

## Flujos

* flujo de Cubrición;
* flujo de Confirmación de Gestación;
* flujo de Parto;
* flujo de Destete;
* flujo de Aborto;
* flujo de Machorra;
* documentación de ubicaciones y reubicaciones de PRD014.

## Histórico de decisiones

* `CHAT03.01-MODELO GANADERO.txt`
* `CHAT03.02-CICLO REPRODUCTIVO.TXT`
* documentación de PRD007–PRD014 cuando sea necesaria para interpretar decisiones anteriores.

Las decisiones consolidadas posteriormente prevalecen sobre documentación histórica que haya quedado obsoleta.

---

# 3. Contexto arquitectónico

La aplicación no es un CRUD tradicional.

La arquitectura se basa en:

```text
EVENTOS
   ↓
fuente de verdad
   ↓
ESTADOS / PROYECCIONES
   ↓
lecturas optimizadas
```

Principios obligatorios:

* Los eventos son la fuente de verdad.
* Los eventos son inmutables.
* Los estados son derivados.
* El backend es la autoridad del negocio.
* El frontend expresa intención y presenta información.
* Las invariantes críticas no dependen del frontend.
* Las correcciones no modifican ni eliminan eventos históricos.
* Las operaciones relevantes deben ser atómicas.
* La base de datos protege la integridad estructural.
* Evitar triggers complejos y abstracciones prematuras.

PRD015 es principalmente un PRD de **lectura, detección y disponibilidad de acciones**. La analítica no crea nuevos hechos históricos.

---

# 4. Alcance

## Incluido

### Revisión reproductiva

* umbral configurable;
* detección de hembras que requieren revisión;
* presentación en dashboard;
* presentación contextual en ficha animal;
* integración con AvailableActions.

### Machorra

* disponibilidad de la acción según el estado reproductivo;
* integración con la implementación existente de `registrar_machorra`;
* reglas de elegibilidad;
* actualización de la presentación contextual de la acción.

### Analítica reproductiva

* nueva sección de Analítica;
* módulo de Reproducción;
* situación actual;
* actividad histórica;
* filtros temporales;
* filtros por instalación;
* métricas reproductivas;
* seguimiento de crías nacidas durante el periodo;
* seguimiento hasta destete;
* tratamiento explícito de resultados todavía pendientes.

---

# 5. Fuera de alcance

PRD015 no implementa:

* temporadas reproductivas persistidas;
* entidad `epoca_reproductiva`;
* inicio o finalización manual de temporadas;
* pertenencia histórica animal-temporada;
* participantes de temporada;
* snapshots de temporadas;
* reconstrucción de campañas;
* diagnóstico automático de infertilidad;
* clasificación automática de una hembra como Machorra;
* predicción de fertilidad;
* índices avanzados de fertilidad;
* rankings de instalaciones;
* analítica financiera;
* analítica general de producción;
* analítica de sementales como módulo específico;
* analítica porcina;
* un motor genérico de métricas;
* un motor genérico de acciones;
* un sistema BI completo.

La sección Analítica debe quedar preparada para crecer hacia Finanzas, Ganadero, Operaciones y otros dominios, pero PRD015 solo implementa Reproducción.

---

# 6. Principio fundamental de la analítica

La analítica histórica debe seguir esta regla:

> **El periodo define qué actividad histórica queremos estudiar; los eventos definen qué ocurrió; las dimensiones solo se aplican cuando pueden explicar correctamente ese acontecimiento; y las cohortes se siguen hasta alcanzar su evento natural de cierre.**

Este principio evita atribuir datos a dimensiones de manera artificial.

---

# 7. Periodo temporal

El periodo temporal es el **filtro principal, obligatorio y universal** de la analítica histórica.

El estado real de la pantalla se representa únicamente mediante:

```text
fecha_desde
fecha_hasta
```

No se debe utilizar un identificador de preset como fuente de verdad del filtro.

Los presets son únicamente mecanismos de conveniencia para modificar esas dos fechas.

## Presets iniciales

Como mínimo:

* Últimos 30 días
* Últimos 3 meses
* Últimos 6 meses
* Últimos 12 meses
* Año actual
* Año anterior
* Personalizado

Al seleccionar un preset:

```text
preset
   ↓
calcular fecha_desde / fecha_hasta
   ↓
actualizar filtros
   ↓
consultar backend
```

Los campos de fecha visibles en frontend deben reflejar siempre el rango real utilizado.

Si el usuario modifica manualmente cualquiera de las fechas, el periodo pasa a considerarse `Personalizado`.

El backend recibe exactamente:

```text
p_fecha_desde
p_fecha_hasta
```

No recibe "últimos 6 meses", "año actual" ni ningún concepto equivalente.

---

# 8. Orden de aplicación de filtros

La analítica sigue esta jerarquía:

```text
PERIODO
   ↓
actividad histórica del periodo
   ↓
DIMENSIONES
   ├── instalación
   ├── raza
   ├── edad
   ├── semental
   └── futuras dimensiones
```

El periodo no es una dimensión más.

Es el contexto temporal sobre el que se construye el conjunto de datos histórico.

Las dimensiones posteriores permiten segmentar ese conjunto cuando exista una relación semántica válida.

---

# 9. Situación actual

La situación actual representa la realidad de la explotación **en el momento de la consulta**.

No depende de:

```text
fecha_desde
fecha_hasta
```

Por tanto, cambiar el periodo histórico nunca modifica estas métricas.

## Presentación

La situación actual debe aparecer en primer lugar, como cabecera o bloque persistente de la pantalla.

Debe permanecer visible mientras el usuario consulta los datos históricos siempre que el diseño responsive lo permita.

Ejemplo conceptual:

```text
SITUACIÓN ACTUAL

Reproductoras        84
Vacías               21
Cubiertas            13
Gestantes            50
Revisión reproductiva 6
```

Debajo se muestran:

```text
PERIODO

[ Año actual ] [ Últimos 12 meses ] ...

Desde: 01/01/2026
Hasta: 20/09/2026
```

El periodo inicial recomendado al acceder a la pantalla es:

```text
Año actual
```

pero el usuario puede modificarlo libremente.

---

# 10. Métricas históricas

Los datos históricos se dividen conceptualmente en dos grupos.

## 10.1 Métricas filtrables

Son hechos concretos asociados a un evento cuya fecha está perfectamente definida.

Ejemplos:

* Cubriciones;
* Confirmaciones de gestación;
* Abortos;
* Partos;
* Crías nacidas;
* Crías nacidas vivas;
* Crías nacidas muertas.

Estas métricas:

* pertenecen al periodo;
* pueden filtrarse por instalación;
* podrán admitir otras dimensiones futuras.

---

## 10.2 Seguimiento de las crías durante el periodo

No se utilizará como concepto de UI la palabra "cohorte" como terminología principal para el usuario.

La denominación preferida es:

> **Seguimiento de las crías durante el periodo**

Representa el seguimiento de las crías cuyo nacimiento pertenece al periodo seleccionado.

El periodo determina qué nacimientos forman parte del conjunto de seguimiento.

Una vez incluida una cría en ese conjunto, se sigue su evolución hasta que alcanza un desenlace natural:

```text
PARTO
  ↓
CRÍA NACIDA VIVA
  ↓
lactancia
  ↓
DESTETE
```

El periodo seleccionado no limita artificialmente el seguimiento.

Una cría nacida el 20 de diciembre puede destetarse en marzo del año siguiente y ese destete sigue siendo válido para cerrar su seguimiento.

---

# 11. Fin del seguimiento

El evento natural de finalización del seguimiento es:

```text
DESTETE
```

El destete es el punto en que finaliza el vínculo funcional madre-cría y comienza una fase diferente de la vida productiva del animal.

No se utilizarán límites artificiales como:

* 180 días;
* 365 días;
* un año desde nacimiento;
* un año desde destete;
* cualquier otro periodo arbitrario.

El seguimiento reproductivo de la cría termina cuando existe `DESTETE`.

---

# 12. Resultados del seguimiento

Para cada cría nacida viva dentro del periodo se debe determinar, cuando sea posible:

```text
DESTETADA
MUERTA ANTES DEL DESTETE
OTRO CIERRE DEL VÍNCULO
PENDIENTE
```

La categoría `PENDIENTE` significa que la cría todavía no ha alcanzado un evento que permita cerrar el seguimiento.

Una cría no debe considerarse fallida únicamente porque el periodo histórico haya terminado.

Una muerte posterior al nacimiento y anterior al destete constituye un desenlace conocido.

Una venta u otra finalización del vínculo antes del destete debe distinguirse de una muerte. No debe transformarse artificialmente en una muerte ni en un destete.

---

# 13. Métricas de seguimiento

Como mínimo se podrán obtener:

* Crías nacidas vivas;
* Crías destetadas;
* Crías muertas antes del destete;
* Crías con seguimiento pendiente;
* otros cierres de vínculo antes del destete, si existen y resultan relevantes.

La métrica principal de resultado será:

> **Crías destetadas**

porque representa animales que han completado satisfactoriamente la etapa de dependencia materna.

Podrán existir posteriormente otros indicadores de éxito reproductivo, pero PRD015 no debe convertir una única métrica en un "índice universal de éxito reproductivo".

---

# 14. Naturaleza global del seguimiento

Las métricas de seguimiento de crías son **métricas globales**.

No se deben segmentar por instalación.

Motivo:

```text
PARTO
Instalación A
   ↓
lactancia
   ↓
CAMBIO_UBICACION
Instalación B
   ↓
DESTETE
```

El nacimiento puede atribuirse inequívocamente a A.

El destete ocurrió inequívocamente en B.

Pero ninguno de los dos representa correctamente una supuesta "instalación responsable" del resultado completo de la cría.

Asignarlo a A o B introduciría una interpretación que los datos no contienen.

Por tanto:

> **El seguimiento de las crías se muestra como información global y no varía al aplicar filtros dimensionales como instalación.**

---

# 15. Presentación diferenciada

La interfaz debe diferenciar visualmente:

### Actividad reproductiva

Métricas que responden a los filtros:

```text
Cubriciones
Gestaciones confirmadas
Abortos
Partos
Crías nacidas
Crías nacidas vivas
Crías nacidas muertas
```

### Seguimiento de las crías durante el periodo

Métricas globales:

```text
Crías nacidas vivas
Crías destetadas
Muertes antes del destete
Pendientes
```

El segundo bloque debe dejar claro que no responde al filtro de instalación.

Cuando exista un filtro de instalación, se puede mostrar una explicación contextual:

> El seguimiento de las crías se muestra como dato global porque una cría puede cambiar de instalación antes del destete.

No se debe presentar el valor global como si perteneciera a la instalación seleccionada.

---

# 16. Atribución histórica a instalaciones

PRD014 establece que la ubicación histórica se reconstruye mediante eventos `CAMBIO_UBICACION`.

Para una métrica puntual:

```text
evento
   ↓
fecha del evento
   ↓
ubicación histórica del animal en esa fecha
   ↓
comparación con instalación seleccionada
```

Por tanto, una instalación seleccionada en Analítica no significa:

> "animales que actualmente están en esta instalación".

Significa:

> "acontecimientos que ocurrieron mientras el animal se encontraba en esta instalación".

---

# 17. Instalación en eventos reproductivos

Los eventos reproductivos principales de la madre son:

* CUBRICION;
* CONFIRMACIÓN DE GESTACIÓN;
* ABORTO;
* PARTO.

Todos están asociados a la madre/reproductora.

No se debe crear una distinción artificial entre:

```text
evento del animal
evento de la madre
```

En este contexto, el sujeto reproductivo es la propia reproductora.

Para filtrar por instalación se determina dónde estaba esa reproductora en la fecha del evento.

---

# 18. Instalación del parto y de las crías

El `PARTO` se atribuye a la instalación donde estaba la madre en la fecha del parto.

Las crías nacidas de ese parto se atribuyen analíticamente al mismo contexto de nacimiento:

```text
PARTO
  ↓
instalación histórica de la madre
  ↓
crías nacidas
```

Esto permite calcular:

* partos por instalación;
* crías nacidas por instalación;
* crías nacidas vivas por instalación;
* crías nacidas muertas por instalación.

Esta atribución significa "lugar del nacimiento", no ubicación permanente de la cría.

---

# 19. Obtención de nacidos vivos y muertos

Las crías asociadas a un `PARTO` se identifican mediante su relación con el evento de parto.

Conceptualmente:

```text
animal.parto_evento_id = parto_event_id
```

Después:

```text
estado_vital = vivo
```

o:

```text
estado_vital = muerto
```

permiten separar:

* nacidas vivas;
* nacidas muertas.

No se deben inferir estos datos desde eventos posteriores.

---

# 20. Situación reproductiva actual

La situación actual debe distinguir claramente:

* Reproductoras;
* Vacías;
* Cubiertas;
* Gestantes;
* Animales que requieren revisión reproductiva.

La situación actual no se recalcula históricamente al cambiar el rango.

Representa siempre el estado actual.

---

# 21. Revisión reproductiva

La revisión reproductiva es un mecanismo de **vigilancia operativa**, no un diagnóstico.

Su finalidad es llamar la atención sobre una reproductora que lleva demasiado tiempo en un ciclo sin alcanzar una gestación confirmada.

---

# 22. Criterios de revisión reproductiva

Un animal requiere revisión cuando se cumplen simultáneamente:

1. es hembra;
2. está viva;
3. `tipo_productivo = REPRODUCTORA`;
4. tiene un ciclo reproductivo abierto;
5. su estado reproductivo es:

   * `VACÍA`, o
   * `CUBIERTA`;
6. el ciclo ha superado el umbral configurado.

No se consideran otros factores en PRD015.

No se evalúan:

* número de cubriciones;
* semental;
* instalación;
* raza;
* número de ciclos anteriores;
* fecha de última cubrición;
* temporada;
* predicciones de fertilidad.

---

# 23. Umbral configurable

El umbral debe ser configurable.

Valor inicial:

```text
240 días
```

La comparación debe utilizar la semántica:

> **supera X días**

Por tanto, con X = 240:

```text
239 días → no requiere revisión
240 días → no requiere revisión
241 días → requiere revisión
```

El valor debe almacenarse como configuración de negocio de la explotación.

No debe almacenarse en:

* animal;
* ciclo;
* instalación.

Nombre conceptual recomendado:

```text
umbral_revision_reproductiva_dias
```

La configuración debe poder modificarse desde el área correspondiente de configuración de la explotación.

El valor no debe estar hardcodeado en frontend ni backend.

---

# 24. Naturaleza de la alerta

La revisión reproductiva:

* no crea evento;
* no modifica el ciclo;
* no cambia el estado reproductivo;
* no cierra el ciclo;
* no marca automáticamente una Machorra;
* no crea una tarea persistente;
* no altera la historia.

Es una proyección derivada del estado actual.

Si la hembra pasa a `GESTANTE`, deja de cumplir la condición.

Si el ciclo se cierra, deja de cumplir la condición.

Si deja de ser reproductora o deja de estar viva, deja de cumplir la condición.

---

# 25. Presentación de la revisión

Debe aparecer como mínimo en:

### Dashboard

Widget:

> **Animales que requieren revisión reproductiva**

### Ficha animal

Dentro del contexto de:

> Historial reproductivo

se debe mostrar una advertencia contextual cuando el ciclo supera el umbral.

La advertencia debe permitir acceder a la acción correspondiente cuando el animal sea elegible.

No se crea una lista persistente de "candidatas a machorra".

---

# 26. Machorra

Machorra es un **resultado operativo de un ciclo reproductivo**.

No es un diagnóstico veterinario almacenado.

No significa automáticamente que el animal sea estéril ni que deba abandonar la explotación.

Una misma reproductora puede registrar varias machorridades a lo largo de su vida.

El número de machorridades se obtiene contando ciclos cuyo:

```text
resultado = 'machorra'
```

No se debe crear:

```text
contador_machorridades
```

---

# 27. Elegibilidad para registrar Machorra

La acción puede estar disponible cuando:

* el animal es hembra;
* está vivo;
* `tipo_productivo = REPRODUCTORA`;
* existe ciclo reproductivo abierto;
* el estado reproductivo es `VACÍA` o `CUBIERTA`.

La acción no está disponible desde:

```text
GESTANTE
```

Si existe una gestación confirmada y posteriormente se pierde, el flujo correcto es `ABORTO`.

---

# 28. Fecha de Machorra

El usuario no informa una fecha.

La acción utiliza la fecha de ejecución:

```text
CURRENT_DATE
```

Motivo:

Machorra representa una decisión operativa tomada por el usuario sobre el estado del ciclo. No se pretende afirmar que la infertilidad comenzó exactamente en una fecha determinada.

No se permiten fechas futuras ni retrospectivas introducidas por el usuario para esta acción.

---

# 29. Resultado de registrar Machorra

La acción existente debe:

```text
resultado = machorra
fecha_fin = fecha de ejecución
```

y aplicar las reglas de cierre del ciclo reproductivo vigentes.

Si el animal continúa siendo reproductora, el dominio puede iniciar inmediatamente el siguiente ciclo `VACÍA` conforme a las reglas ya consolidadas del modelo reproductivo.

La operación debe mantener la consistencia transaccional existente.

El resultado del ciclo no puede sobrescribirse posteriormente.

---

# 30. Correcciones

PRD015 no crea un sistema genérico de corrección de eventos.

Si se implementa una corrección específica de Machorra, deberá respetar la arquitectura general:

```text
evento histórico
      ↓
NO se modifica
      ↓
evento/operación compensatoria
```

La construcción de un framework genérico de correcciones queda fuera de alcance.

---

# 31. Analítica reproductiva

PRD015 crea la primera implementación de la futura sección:

```text
/analitica
```

La estructura debe permitir crecer hacia:

```text
Analítica
├── Reproducción
├── Ganadero        futuro
├── Finanzas        futuro
└── Operaciones     futuro
```

No se debe implementar todavía una infraestructura genérica de módulos analíticos.

---

# 32. Ruta

La analítica debe estar separada del dashboard operativo.

Conceptualmente:

```text
/analitica
/analitica/reproduccion
```

La primera implementación puede resolver directamente la pantalla de Reproducción, pero debe evitar acoplarla conceptualmente al dashboard.

La diferencia es:

```text
Inicio
→ qué requiere atención ahora

Analítica
→ qué está ocurriendo y qué ocurrió
```

---

# 33. Métricas históricas V1

## Actividad reproductiva

Periodo seleccionado:

* Cubriciones registradas;
* Gestaciones confirmadas;
* Abortos;
* Partos.

## Resultado de partos

* Crías nacidas;
* Crías nacidas vivas;
* Crías nacidas muertas.

## Seguimiento de las crías durante el periodo

* Crías nacidas vivas;
* Crías destetadas;
* Muertes antes del destete;
* Pendientes de desenlace;
* otros cierres de vínculo, si existen.

---

# 34. Métricas que no se implementan inicialmente

No introducir todavía:

* porcentaje de fertilidad;
* tasa de concepción;
* tasa de parto;
* tasa de aborto sobre gestaciones;
* índice compuesto de éxito reproductivo;
* ranking de madres;
* ranking de sementales;
* comparativas complejas;
* métricas predictivas.

El motivo es evitar ratios cuyo denominador o población de referencia no esté perfectamente definido.

PRD015 prioriza hechos observables y métricas fácilmente explicables.

---

# 35. Analítica de sementales

La descendencia de los sementales es una dimensión potencialmente útil, pero no debe mezclarse dentro del bloque principal de analítica de reproductoras.

El modelo debe conservar la capacidad futura de responder preguntas como:

> ¿Cuántas crías ha producido cada semental durante un periodo?

Pero esto se considera una perspectiva analítica diferente:

```text
Reproducción
├── Reproductoras
└── Sementales   futuro
```

No se implementa como módulo independiente en PRD015.

---

# 36. Dimensiones futuras

El diseño debe permitir incorporar posteriormente:

* raza;
* edad;
* semental;
* otras dimensiones reproductivamente relevantes.

La edad, cuando se incorpore, deberá interpretarse respecto al momento del acontecimiento analizado, no respecto a la edad actual del animal.

`tipo_productivo` no se considera una dimensión relevante para esta analítica porque el conjunto de análisis está centrado en reproductoras.

Las diferencias entre tipos productivos podrán analizarse posteriormente desde otros módulos.

---

# 37. Backend y consultas

Las consultas de analítica deben pertenecer a la capa de aplicación correspondiente.

La UI no debe consultar Supabase directamente.

Patrón:

```text
Page
 ↓
Query / Use Case
 ↓
Repository
 ↓
Supabase
```

Las queries deben recibir los criterios de análisis explícitamente:

```text
fecha_desde
fecha_hasta
instalacion_id?
```

Las futuras dimensiones se añadirán de forma incremental.

No crear un objeto genérico de filtros de analítica excesivamente abstracto antes de que exista una necesidad real.

---

# 38. Consulta histórica por instalación

Cuando se selecciona una instalación:

1. se seleccionan los eventos cuyo tipo sea relevante;
2. se limita por `fecha_desde` / `fecha_hasta`;
3. se identifica el animal sujeto del evento;
4. se reconstruye su instalación histórica en la fecha del evento;
5. se compara con la instalación seleccionada;
6. se cuenta únicamente si coincide.

No debe utilizarse:

```text
animal.ubicacion_actual_id
```

para responder preguntas históricas.

Ese campo solo representa la ubicación actual.

---

# 39. Consistencia temporal

Para determinar la ubicación histórica de un animal en una fecha:

```text
último CAMBIO_UBICACION
con fecha <= fecha del acontecimiento
```

ordenado por:

```text
fecha DESC
created_at DESC
```

La existencia de `CAMBIO_UBICACION` como fuente histórica permite realizar esta atribución sin crear una tabla histórica específica de permanencias.

---

# 40. Situación actual y filtros

La respuesta de la pantalla puede dividirse conceptualmente en dos proyecciones:

```text
CurrentReproductiveSituation
```

y:

```text
HistoricalReproductiveAnalytics
```

La primera no recibe el periodo histórico.

La segunda recibe:

```text
fecha_desde
fecha_hasta
dimensiones
```

No mezclar ambas consultas ni hacer que el filtro histórico altere la situación actual.

---

# 41. Proyección recomendada

No reutilizar el modelo de detalle de animal para la analítica.

La analítica debe tener sus propias proyecciones.

Conceptualmente:

```text
ReproductiveCurrentSituation
ReproductiveHistoricalActivity
ReproductiveOffspringFollowUp
```

Cada proyección debe representar exactamente la información que necesita la vista.

No exponer directamente tipos de base de datos a componentes visuales.

---

# 42. UX

La pantalla debe ser clara, informativa y progresiva.

Orden recomendado:

```text
1. Situación actual
2. Selector de periodo
3. Dimensiones
4. Actividad reproductiva
5. Resultado de partos
6. Seguimiento de las crías durante el periodo
```

El usuario debe poder entender siempre:

* qué momento actual está viendo;
* qué periodo histórico está consultando;
* qué filtros tiene activos;
* qué métricas responden a esos filtros;
* qué métricas son globales y no están segmentadas.

---

# 43. Estado inicial

Al entrar en la pantalla:

```text
Periodo = Año actual
Instalación = Todas
```

La situación actual se muestra inmediatamente.

Las métricas históricas se calculan para el año actual.

---

# 44. Invariantes

PRD015 debe garantizar:

### Revisión

* solo reproductoras vivas;
* ciclo abierto;
* estado `VACÍA` o `CUBIERTA`;
* umbral superado;
* nunca modificación del dominio.

### Machorra

* nunca desde `GESTANTE`;
* solo sobre ciclo elegible;
* resultado inmutable;
* fecha generada por el sistema;
* no modificar eventos anteriores.

### Analítica

* periodo siempre definido;
* backend recibe fechas reales;
* situación actual independiente del periodo;
* eventos históricos filtrados por fecha del propio evento;
* instalación histórica, nunca ubicación actual, para eventos pasados;
* seguimiento de crías hasta `DESTETE`;
* no atribuir el resultado de seguimiento a instalaciones.

---

# 45. Atomicidad

Las acciones que modifican dominio deben mantener las reglas transaccionales existentes.

Especialmente:

```text
registrar_machorra
```

debe mantener la consistencia del ciclo y sus proyecciones en una única operación transaccional.

Las consultas analíticas son de lectura y no deben modificar datos.

---

# 46. Rendimiento

La analítica debe diseñarse inicialmente mediante consultas SQL razonables y proyecciones específicas.

No crear:

* tablas de agregados anuales;
* contadores persistidos;
* snapshots históricos;
* materializaciones prematuras.

Los datos deben derivarse de las fuentes de verdad existentes.

Si en el futuro el volumen hace necesario optimizar las lecturas, se podrá introducir una estrategia específica basada en mediciones reales de rendimiento.

---

# 47. Testing

Debe cubrir como mínimo:

## Periodo

* presets generan correctamente `fecha_desde` y `fecha_hasta`;
* modificación manual convierte el periodo en personalizado;
* backend recibe las fechas mostradas;
* rango inválido se rechaza.

## Situación actual

* no cambia al modificar el periodo;
* refleja el estado actual.

## Actividad

* eventos incluidos por fecha;
* eventos fuera del rango excluidos;
* instalación determinada históricamente;
* ubicación actual no utilizada para hechos históricos.

## Partos

* partos atribuidos a instalación de la madre en la fecha del parto;
* nacidos vivos correctamente identificados;
* nacidos muertos correctamente identificados.

## Seguimiento

* parto del periodo genera conjunto de seguimiento;
* destete posterior al periodo cierra correctamente el seguimiento;
* muerte antes de destete genera desenlace conocido;
* cría todavía lactante queda pendiente;
* cambio de instalación no altera su pertenencia al conjunto de seguimiento;
* las métricas de seguimiento no cambian al aplicar instalación.

## Machorra

* disponible en `VACÍA`;
* disponible en `CUBIERTA`;
* no disponible en `GESTANTE`;
* fecha generada por el sistema;
* resultado correcto;
* doble ejecución protegida.

## Revisión

* 239 días con umbral 240 → no alerta;
* 240 días → no alerta;
* 241 días → alerta;
* gestante → no alerta;
* ciclo cerrado → no alerta;
* no reproductora → no alerta.

---

# 48. Criterios de aceptación

PRD015 se considera implementado cuando:

1. existe una pantalla de Analítica separada del dashboard;
2. la situación actual aparece al acceder;
3. la situación actual no depende del periodo;
4. el periodo es obligatorio;
5. los presets actualizan las fechas visibles;
6. las fechas visibles son las utilizadas por backend;
7. el año actual es el periodo inicial;
8. las métricas históricas se obtienen por fecha del evento;
9. la instalación histórica funciona correctamente;
10. las métricas puntuales pueden filtrarse por instalación;
11. el seguimiento de crías se muestra separado;
12. el seguimiento es global y no depende de instalación;
13. una cría se sigue hasta destete;
14. los casos pendientes se identifican explícitamente;
15. la revisión reproductiva utiliza un umbral configurable;
16. el valor inicial es 240 días;
17. la acción Machorra respeta las reglas del ciclo;
18. no se introduce una entidad de temporada reproductiva;
19. no se introducen contadores persistidos de machorridades;
20. las consultas no modifican la fuente de verdad;
21. las pruebas cubren los casos críticos anteriores.

---

# 49. Evolución futura

Quedan preparados conceptualmente:

* analítica por raza;
* analítica por edad;
* analítica por semental;
* análisis de descendencia;
* evolución de reproductoras;
* duración de ciclos;
* comparativas entre periodos;
* analítica ganadera;
* analítica financiera;
* analítica operativa.

Estas extensiones deberán mantener el principio:

```text
hecho → métrica → dimensión válida
```

y no introducir dimensiones únicamente porque técnicamente sea posible filtrarlas.

---

# 50. Principio final

PRD015 no pretende convertir la aplicación en un sistema de Business Intelligence.

Su objetivo es proporcionar una primera capa de analítica útil, explicable y directamente conectada con el modelo de negocio.

La regla central es:

> **El periodo define qué actividad histórica queremos estudiar; los eventos definen qué ocurrió; las dimensiones solo se aplican cuando pueden explicar correctamente ese acontecimiento; y las cohortes se siguen hasta alcanzar su evento natural de cierre.**

La situación actual constituye una lectura independiente y permanente:

> **La actualidad solo es una.**

La analítica histórica permite estudiar el pasado sin alterar ni reinterpretar esa realidad actual.
