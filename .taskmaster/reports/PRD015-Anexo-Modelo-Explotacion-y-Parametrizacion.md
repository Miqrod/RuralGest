# ANEXO PRD015-A — Modelo de Explotación y Parametrización

## 1. Propósito del anexo

Este anexo complementa el PRD015 — Revisión reproductiva, Machorra y Analítica Reproductiva.

No modifica ni sustituye las decisiones funcionales definidas en el PRD015. Su objetivo es resolver una necesidad transversal que aparece al implementar la parametrización de reglas de negocio, especialmente el requisito de que el umbral de días para proponer una revisión reproductiva no quede hardcodeado.

El anexo define:

- el modelo inicial de `explotacion`;
- la pantalla de configuración de los datos de la explotación;
- el modelo de `parametrizacion`;
- las reglas de identificación y consulta de parámetros;
- los tipos de valor y unidades;
- la organización funcional de las parametrizaciones;
- las reglas de backend y base de datos;
- la relación de este modelo con el umbral de revisión reproductiva definido en PRD015.

La decisión general es introducir únicamente la infraestructura necesaria ahora, evitando convertirla prematuramente en un sistema multi-explotación, un catálogo completo de especies/razas o un motor genérico de configuración.

---

# 2. Contexto

En PRD015 se estableció que el umbral utilizado para determinar cuándo una hembra reproductora requiere revisión reproductiva debe ser configurable.

La regla funcional es:

- hembra;
- `tipo_productivo = REPRODUCTORA`;
- animal vivo;
- ciclo reproductivo abierto;
- `estado_reproductivo IN (VACÍA, CUBIERTA)`;
- el ciclo supera el umbral configurado de días.

El valor inicial acordado es de **240 días**.

Este valor no debe aparecer como un literal hardcodeado dentro de la lógica de negocio.

Por tanto, el sistema necesita una fuente de configuración persistente desde la que el backend pueda obtener el valor correspondiente.

El modelo de parametrización definido en este anexo cubre esta necesidad y establece una base reutilizable para futuros parámetros de otras áreas del sistema.

---

# 3. Alcance

## 3.1 Incluido

Se incorpora al modelo:

1. Entidad `explotacion`.
2. Pantalla de configuración de datos de la explotación.
3. Entidad `parametrizacion`.
4. Gestión de parámetros definidos por la aplicación.
5. Consulta de parámetros por código y contexto de especie.
6. Tipado de valores mediante `tipo_valor`.
7. Unidades controladas mediante `unidad`.
8. Agrupación funcional mediante `categoria`.
9. Parametrización inicial del umbral de revisión reproductiva de vacuno.

## 3.2 No incluido

No se implementa en este alcance:

- multi-explotación;
- `explotacion_id` en las entidades de dominio existentes;
- catálogo completo de especies y razas;
- gestión de nuevas definiciones de parámetros desde la UI;
- sistema de configuración arbitrariamente extensible por el usuario;
- motor genérico de parametrización;
- histórico funcional de cambios de parámetros;
- versionado de configuraciones;
- parametrización por instalación;
- parametrización por animal;
- parametrización por usuario.

Estas capacidades podrán estudiarse posteriormente si aparecen necesidades reales que las justifiquen.

---

# 4. Modelo de Explotación

## 4.1 Objetivo

`explotacion` representa la explotación ganadera gestionada por la aplicación.

La aplicación actual trabaja con una única explotación. Por tanto, la entidad no se utiliza actualmente como mecanismo de aislamiento multi-tenant ni como discriminador que deba propagarse a todas las tablas.

Su finalidad inicial es centralizar información propia de la explotación que necesita la aplicación y proporcionar un contexto común para futuras funcionalidades.

---

# 5. Modelo de datos de `explotacion`

Modelo inicial:

```text
explotacion
────────────────────────
id
nombre
nombre_comercial?
email
telefono

direccion
codigo_postal
municipio
provincia
pais

latitud
longitud

logo_storage_path

created_at
updated_at
```

## 5.1 Identidad

`id`

Identificador único de la explotación.

Aunque actualmente exista una única explotación, la entidad mantiene identidad propia para no convertir sus datos en una colección de constantes distribuidas por el sistema.

## 5.2 Nombre

`nombre`

Nombre de la explotación.

Es el nombre principal utilizado por la aplicación.

## 5.3 Nombre comercial

`nombre_comercial`

Campo opcional.

Permite diferenciar el nombre de la explotación de una eventual denominación comercial.

No se introduce de momento una modelización adicional de titulares, propietarios o sociedades.

## 5.4 Datos de contacto

```text
email
telefono
```

Datos de contacto generales de la explotación.

## 5.5 Dirección

```text
direccion
codigo_postal
municipio
provincia
pais
```

Representan los datos de dirección asociados a la explotación.

Estos campos no deben confundirse con las coordenadas geográficas utilizadas como referencia funcional para mapas y meteorología.

## 5.6 Coordenadas base

```text
latitud
longitud
```

Representan las **coordenadas base de la explotación**.

No son necesariamente las coordenadas exactas de la dirección administrativa o fiscal.

Su finalidad es proporcionar un punto geográfico de referencia para funcionalidades como:

- inicialización y centrado del mapa de instalaciones;
- meteorología de la explotación;
- otras funcionalidades geográficas futuras.

Las instalaciones disponen de sus propias coordenadas cuando corresponda.

Por tanto:

```text
explotacion.latitud / longitud
        ↓
punto geográfico de referencia general

instalacion.latitud / longitud
        ↓
posición concreta de cada instalación
```

No se debe utilizar la coordenada de la explotación para sustituir la coordenada de una instalación.

## 5.7 Logo

`logo_storage_path`

Referencia al recurso almacenado en Supabase Storage.

No se almacena el binario de la imagen dentro de la tabla.

---

# 6. Configuración de la explotación

La navegación prevista queda organizada inicialmente de la siguiente forma:

```text
Configuración
│
├── Gestión de la explotación
│   ├── Datos de la explotación
│   ├── Especies y razas        [futuro]
│   ├── Instalaciones
│   └── Parametrizaciones
│
└── Acceso y seguridad
    └── Usuarios y permisos
```

## 6.1 Datos de la explotación

Permite consultar y modificar los datos de `explotacion`.

## 6.2 Especies y razas

No se implementa ahora.

Aunque el modelo ganadero contempla especies y razas, todavía no se considera necesario crear una pantalla específica de configuración para ellas.

La evolución del dominio determinará posteriormente si debe convertirse en un módulo configurable.

## 6.3 Instalaciones

Se mantiene dentro de la gestión de la explotación y continúa desarrollándose según las decisiones de PRD014.

## 6.4 Parametrizaciones

Inicialmente se mantiene dentro de `Gestión de la explotación`.

La pantalla puede presentar todos los parámetros en una única vista, agrupados por categoría funcional.

Por ejemplo:

```text
Parametrizaciones

REPRODUCTIVO
────────────────────────
Días para sugerir revisión reproductiva
[ 240 ] días

FINANCIERO
────────────────────────
...

OPERATIVO
────────────────────────
...
```

No se crea inicialmente una navegación compleja por submódulos.

Si el número de parámetros crece significativamente, `Parametrizaciones` podrá convertirse posteriormente en un apartado de primer nivel con subsecciones.

---

# 7. Modelo de Parametrización

## 7.1 Objetivo

La tabla `parametrizacion` almacena valores configurables utilizados por la lógica de negocio.

Su función no es permitir que el usuario cree nuevas reglas de negocio, sino permitir modificar los valores de aquellas reglas que la aplicación ya conoce.

Por tanto:

> Las definiciones de los parámetros pertenecen al producto; sus valores pueden ser configurados.

Esto evita que la UI se convierta en un editor genérico de reglas de negocio.

---

# 8. Modelo de datos de `parametrizacion`

Modelo acordado:

```text
parametrizacion
────────────────────────────────────
id
codigo
descripcion
valor
especie_id       nullable
categoria
tipo_valor
unidad           nullable
created_at
updated_at
user_created
user_updated
```

---

# 9. Identidad funcional del parámetro

El código identifica el concepto funcional del parámetro.

Ejemplo:

```text
codigo = umbral_revision_reproductiva_dias
```

La especie no se incorpora al código.

Por tanto, no se utilizarán códigos como:

```text
umbral_revision_reproductiva_vacuno_dias
```

La especie es un contexto independiente:

```text
codigo      = umbral_revision_reproductiva_dias
especie_id  = VACUNO
```

Esto permite reutilizar el mismo concepto para otras especies:

```text
codigo      = umbral_revision_reproductiva_dias
especie_id  = VACUNO

codigo      = umbral_revision_reproductiva_dias
especie_id  = PORCINO
```

La semántica es:

> `codigo` identifica el parámetro; `especie_id` determina el contexto en el que se aplica.

---

# 10. Regla obligatoria de consulta

El backend **no debe consultar una parametrización únicamente por `codigo`**.

Toda consulta debe proporcionar siempre el contexto de especie:

```text
(codigo, especieId)
```

Ejemplos:

```text
getParametrizacion({
  codigo: "umbral_revision_reproductiva_dias",
  especieId: VACUNO
})
```

o, para un parámetro general:

```text
getParametrizacion({
  codigo: "parametro_general",
  especieId: null
})
```

`NULL` no significa que el parámetro pueda ignorar la dimensión de especie.

Significa explícitamente:

> este parámetro es general y no está asociado a una especie concreta.

---

# 11. Tratamiento de `NULL` en especie

Desde el punto de vista funcional existen dos contextos:

```text
especie_id = VACUNO
```

Parámetro específico de vacuno.

```text
especie_id = NULL
```

Parámetro general.

El backend debe tratar ambos contextos de forma explícita.

En PostgreSQL no debe utilizarse una comparación simple:

```sql
especie_id = NULL
```

para buscar parámetros generales, ya que `NULL` no se compara de esa forma.

Una consulta que permita ambos casos puede utilizar, por ejemplo:

```sql
WHERE codigo = $1
  AND especie_id IS NOT DISTINCT FROM $2
```

De esta forma:

```text
VACUNO + VACUNO   → coincide
NULL + NULL       → coincide
VACUNO + NULL     → no coincide
NULL + VACUNO     → no coincide
```

---

# 12. Unicidad del parámetro

La identidad lógica del registro es:

```text
(codigo, especie_id)
```

Por tanto, no debe existir más de una definición activa para la misma combinación.

Debe existir una restricción de base de datos que impida duplicados incluso cuando `especie_id` sea `NULL`.

No es suficiente confiar exclusivamente en el backend.

En PostgreSQL esto puede resolverse mediante una restricción/indexación que trate los `NULL` como iguales, o mediante índices únicos parciales equivalentes.

La implementación concreta se decidirá en la migración de Supabase/PostgreSQL.

---

# 13. Valor del parámetro

Se establece:

```text
valor TEXT
tipo_valor ENUM
```

No se utiliza JSONB.

El valor se almacena como texto y `tipo_valor` determina cómo debe interpretarse y validarse.

Ejemplo:

```text
valor      = "240"
tipo_valor = INTEGER
```

El backend interpreta el valor como:

```text
240
```

y no como una cadena arbitraria.

---

# 14. Tipos de valor

El enum inicial de `tipo_valor` contempla:

```text
INTEGER
DECIMAL
BOOLEAN
TEXT
DATE
```

Podrán añadirse nuevos tipos cuando exista una necesidad funcional real.

La aplicación no debe asumir que cualquier cadena almacenada en `valor` es válida.

El backend debe validar que:

```text
valor
```

es compatible con:

```text
tipo_valor
```

Por ejemplo:

```text
tipo_valor = INTEGER
valor = "240"
```

es válido.

Mientras que:

```text
tipo_valor = INTEGER
valor = "abc"
```

debe rechazarse.

La validación de semántica de tipo pertenece al backend.

---

# 15. Unidad

`unidad` es opcional y se modela mediante un enum.

Ejemplos iniciales:

```text
DIAS
EUROS
PORCENTAJE
KG
UNIDADES
```

La lista debe crecer únicamente cuando aparezcan necesidades reales.

No se crea un valor artificial:

```text
SIN_UNIDAD
```

Cuando el parámetro no tenga unidad:

```text
unidad = NULL
```

Por tanto:

```text
unidad = DIAS
```

significa que el valor tiene unidad de días.

```text
unidad = NULL
```

significa que no se ha definido una unidad.

---

# 16. Categoría funcional

`categoria` sirve para organizar las parametrizaciones en la interfaz.

Ejemplos:

```text
REPRODUCTIVO
FINANCIERO
OPERATIVO
```

No debe confundirse con `tipo_valor`.

La diferencia es:

```text
categoria
    → ¿a qué área funcional pertenece?

tipo_valor
    → ¿cómo se interpreta el valor?

unidad
    → ¿qué unidad tiene?
```

La categoría es principalmente una dimensión funcional y de presentación.

---

# 17. Parámetro inicial de PRD015

El primer parámetro necesario será:

```text
codigo:
umbral_revision_reproductiva_dias

descripcion:
Días para sugerir revisión reproductiva

valor:
240

especie_id:
VACUNO

categoria:
REPRODUCTIVO

tipo_valor:
INTEGER

unidad:
DIAS
```

La descripción puede mostrar la especie en la interfaz si se considera útil, pero la especie no debe formar parte del código.

---

# 18. Integración con la revisión reproductiva

La regla de PRD015 permanece sin cambios.

La única diferencia es de dónde obtiene el backend el valor `X`.

Antes de ejecutar la regla:

```text
X = 240
```

como literal hardcodeado.

Con este anexo:

```text
X = getParametrizacion(
      codigo = "umbral_revision_reproductiva_dias",
      especieId = VACUNO
    )
```

El flujo conceptual queda:

```text
PRD015
   │
   │ necesita X días
   ▼
Parametrización
   │
   │ codigo + especie
   ▼
240 días
   │
   ▼
Regla de revisión reproductiva
```

La lógica de negocio continúa siendo:

```text
dias_ciclo > X
```

Por tanto, con:

```text
X = 240
```

se mantiene la regla acordada:

```text
239 días → no requiere revisión
240 días → no requiere revisión
241 días → requiere revisión
```

Modificar el parámetro a otro valor no requiere modificar código de negocio.

---

# 19. Responsabilidad del backend

El backend es la autoridad sobre las parametrizaciones.

Debe ser responsable de:

1. obtener el parámetro;
2. validar su existencia;
3. validar su tipo;
4. convertirlo al tipo esperado;
5. validar las restricciones de negocio que correspondan;
6. utilizar el valor en las reglas de dominio.

La UI no debe interpretar por su cuenta el significado de:

```text
tipo_valor
unidad
codigo
```

La UI presenta y edita.

El backend valida y aplica.

---

# 20. Definición de parámetros frente a edición de valores

No se habilita inicialmente un botón:

```text
+ Nuevo parámetro
```

Los parámetros disponibles forman parte del contrato funcional de la aplicación.

Por tanto:

```text
Migración / código
        ↓
define parámetro
        ↓
UI
        ↓
permite modificar su valor
```

No:

```text
Usuario
   ↓
crea parámetro arbitrario
   ↓
aplicación intenta descubrir qué significa
```

Esta decisión evita que la parametrización se convierta en un motor genérico de reglas difícil de validar y mantener.

---

# 21. Explotación y parametrización

No se introduce `explotacion_id` en `parametrizacion`.

La razón es arquitectónica.

La aplicación actual no es multi-explotación y el modelo de dominio existente tampoco utiliza `explotacion_id` como discriminador transversal.

Añadirlo únicamente a `parametrizacion` introduciría una inconsistencia:

```text
parametrizacion
    → tendría explotacion_id

animal
instalacion
evento
ciclo_reproductivo
...
    → no tendrían explotacion_id
```

No existe actualmente un beneficio suficiente que justifique esa complejidad.

La explotación se considera por ahora un contexto singleton de la aplicación.

Si en el futuro se necesitara soportar varias explotaciones dentro de una misma instancia, deberá realizarse una decisión arquitectónica transversal.

No se añadirá `explotacion_id` preventivamente.

---

# 22. Relación conceptual entre ambas entidades

El modelo queda:

```text
EXplotación
    │
    ├── Datos generales
    │
    ├── Instalaciones
    │
    └── Parametrizaciones
             │
             ├── REPRODUCTIVO
             ├── FINANCIERO
             └── OPERATIVO
```

Pero esto no implica que todas las entidades de dominio tengan una FK directa hacia `explotacion`.

La relación expresa principalmente el contexto funcional de configuración de la aplicación.

---

# 23. UI de Parametrizaciones

La pantalla inicial puede estructurarse como una única página:

```text
Configuración / Parametrizaciones

REPRODUCTIVO
────────────────────────────────────────────

Días para sugerir revisión reproductiva
[ 240 ] días

Descripción:
Días para sugerir revisión reproductiva

Especie:
Vacuno


FINANCIERO
────────────────────────────────────────────

...


OPERATIVO
────────────────────────────────────────────

...
```

La pantalla debe permitir:

- visualizar parámetros;
- editar sus valores;
- visualizar unidad;
- visualizar especie cuando corresponda;
- visualizar descripción.

No necesita inicialmente:

- creación de parámetros;
- eliminación de parámetros;
- edición del código;
- edición del tipo;
- edición de la categoría;
- edición de la unidad.

Esos elementos forman parte de la definición técnica del parámetro.

---

# 24. Principios de evolución

El modelo debe mantenerse deliberadamente pequeño.

No se incorporarán inicialmente:

- JSONB para valores;
- sistema multi-tenant;
- versionado;
- historial específico de parametrizaciones;
- motor de expresiones;
- reglas dinámicas creadas por usuarios;
- herencia de parámetros entre especies;
- configuración por instalación;
- configuración por animal;
- catálogo completo de especies y razas.

Cada una de estas capacidades deberá aparecer como consecuencia de un requisito real, no como anticipación de necesidades hipotéticas.

---

# 25. Decisiones consolidadas

### Explotación

```text
explotacion
────────────────────────
id
nombre
nombre_comercial?
email
telefono
direccion
codigo_postal
municipio
provincia
pais
latitud
longitud
logo_storage_path
created_at
updated_at
```

### Parametrización

```text
parametrizacion
────────────────────────────────────
id
codigo
descripcion
valor
especie_id       nullable
categoria
tipo_valor
unidad           nullable
created_at
updated_at
user_created
user_updated
```

### Reglas

- No `explotacion_id` en `parametrizacion`.
- No `explotacion_id` transversal en el modelo actual.
- `codigo` identifica el concepto.
- `especie_id` identifica el contexto.
- Toda consulta backend exige `(codigo, especieId)`.
- `NULL` en `especie_id` representa un parámetro general.
- La unicidad lógica es `(codigo, especie_id)`.
- `valor` es `TEXT`.
- `tipo_valor` es `ENUM`.
- `unidad` es `ENUM` nullable.
- `categoria` agrupa funcionalmente.
- Los parámetros son definidos por la aplicación.
- El usuario modifica valores, no crea definiciones.
- El umbral inicial de revisión reproductiva es 240 días.
- La regla de PRD015 continúa siendo `dias_ciclo > umbral`.
- La parametrización elimina el hardcode del umbral sin alterar la lógica funcional del PRD015.

---

# 26. Criterio arquitectónico final

Este anexo introduce una primera capa de configuración de la explotación sin convertirla en una abstracción excesiva.

La decisión central es:

> **Parametrizar valores de reglas conocidas, no parametrizar las propias reglas.**

De esta forma, PRD015 mantiene su definición funcional y obtiene únicamente el dato variable que necesita desde una fuente persistente y controlada.

El resultado permite que:

```text
240 días
```

sea una configuración de negocio modificable, mientras que:

```text
dias_ciclo > umbral
```

continúa siendo una regla de dominio estable implementada en backend.

Esta separación mantiene el sistema flexible sin convertir la lógica de negocio en un sistema genérico de reglas.
