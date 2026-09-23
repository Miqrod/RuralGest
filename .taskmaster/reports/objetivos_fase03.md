# Current Phase

## Fase actual

Fase 3: Primer vertical slice funcional — Exploración de animales vacuno.

---

# Objetivo principal

Construir la primera funcionalidad end-to-end real del sistema:

```text
DB → repository → mapper → use case → page → DataTable
```

El objetivo NO es crear todavía un módulo ganadero completo.

El objetivo es validar:

* arquitectura
* flujo de datos
* integración Supabase
* separación de capas
* tipado
* SSR
* navegación
* DataTable reutilizable
* patrón repository/use-case

utilizando una entidad central del dominio:

```text
animal
```

---

# Objetivos específicos

## 1. Vertical slice completo

Implementar el primer flujo completo de lectura de datos reales.

La aplicación debe ser capaz de:

* consultar datos reales desde Supabase
* transformar datos DB → dominio
* ejecutar un use case
* renderizar una página SSR
* mostrar resultados reales en una tabla

El objetivo es validar que toda la arquitectura funciona de forma integrada.

---

## 2. Datos de prueba reproducibles

Preparar datos de desarrollo realistas.

NO insertar datos manualmente desde la UI.

Preparar:

* `seed.sql`

O:

* script reproducible (`seed-dev.ts`)

Los datos deben incluir:

* distintos sexos
* distintos estados
* distintos tipos de animal
* algunos edge cases simples

El objetivo es disponer de un entorno estable para desarrollo y testing.

---

## 3. Mapper DB → Domain

Implementar el primer mapper real del sistema.

Ejemplo:

```ts
mapAnimalRowToDomain()
```

El mapper debe ser:

* puro
* explícito
* sencillo
* único punto DB ↔ dominio

El resto del sistema NO debe conocer directamente tipos de Supabase.

---

## 4. Repository real

Implementar el primer repository conectado a Supabase.

Objetivo:

* encapsular queries
* aislar infraestructura
* ocultar Supabase al resto del sistema

La UI NO debe consultar Supabase directamente.

---

## 5. Primer use case real

Implementar:

```text
listarAnimales
```

El use case debe:

* coordinar acceso a datos
* aplicar proyecciones simples si hace falta
* devolver datos preparados para UI

Aunque el caso sea simple, debe respetar la arquitectura objetivo.

---

## 6. Página SSR

Crear:

```text
/vacuno/animales
```

La página debe:

* ser Server Component
* cargar datos en servidor
* usar el use case
* renderizar DataTable

Priorizar SSR-first.

NO introducir todavía:

* React Query
* caches complejas
* estado global

---

## 7. DataTable integrada

Conectar el DataTable existente con datos reales.

El objetivo NO es crear una tabla ultra-genérica.

El objetivo es:

* validar integración real
* comprobar DX
* validar tipado
* comprobar reutilización básica

Mantener simplicidad.

---

## 8. Navegación funcional

Integrar la nueva pantalla dentro del layout actual.

Debe poder:

* accederse desde sidebar
* cargar correctamente
* mantener sesión/auth
* respetar estructura de navegación

---

## 9. Tipado y proyecciones

NO exponer directamente tipos DB a la UI.

La UI debe trabajar con:

```ts
AnimalListItem
```

NO con:

```ts
Database['public']['Tables']['animal']['Row']
```

Objetivo:

* desacoplar UI
* preparar evolución futura
* evitar coupling con schema DB

---

# Alcance de esta fase

## ✅ Incluir

* listado SSR
* repository
* mapper
* use case
* datos reales Supabase
* DataTable funcional
* navegación
* tipado
* seed reproducible

---

## ❌ NO incluir todavía

### CRUD completo

NO implementar:

* editar
* eliminar
* bulk actions

---

### Formularios complejos

NO implementar todavía:

* alta real de animales
* validaciones complejas
* workflows completos

---

### Lógica ganadera avanzada

NO implementar todavía:

* eventos
* movimientos
* ciclos
* automatismos
* cálculos derivados complejos

---

### Optimización prematura

NO introducir todavía:

* server pagination
* filtros complejos
* búsqueda avanzada
* caches sofisticadas
* realtime
* Zustand
* React Query

---

# Reglas arquitectónicas

## 1. Las páginas NO acceden directamente a Supabase

Siempre:

```text
page → use case → repository
```

---

## 2. El mapper es el único punto DB ↔ dominio

Nunca usar tipos DB fuera de infrastructure.

---

## 3. El dominio NO conoce Supabase

El dominio debe permanecer desacoplado de infraestructura.

---

## 4. UI NO conoce estructura DB

La UI recibe modelos preparados.

Nunca filas DB crudas.

---

## 5. SSR-first

Priorizar:

* Server Components
* renderizado servidor
* simplicidad

---

## 6. Mantener separación de capas

* backend decide
* DB protege
* frontend guía

---

# Entregables esperados

La fase debe terminar con:

* `/vacuno/animales` funcionando
* animales reales cargados desde Supabase
* repository operativo
* mapper operativo
* use case operativo
* DataTable conectada
* navegación integrada
* seeds reproducibles
* tipado estable
* arquitectura validada end-to-end

---

# Forma de implementación

Trabajar incrementalmente.

Cada paso debe:

* tener un único objetivo
* ser pequeño
* ser revisable
* ser validable
* mantener coherencia arquitectónica

---

# Riesgos a evitar

* convertir el sistema en CRUD puro
* acceder a Supabase desde UI
* usar tipos DB directamente en frontend
* sobreabstraer DataTable
* introducir complejidad prematura
* mezclar dominio e infraestructura
* implementar lógica ganadera demasiado pronto

---

# Prioridad máxima

Priorizar:

1. consistencia
2. claridad
3. mantenibilidad
4. validación arquitectónica
5. simplicidad

Por encima de:

* velocidad
* automatización
* abstracciones complejas
* optimizaciones prematuras

---

# Resultado esperado real

Al finalizar esta fase, la aplicación debe demostrar:

```text
“la arquitectura ya funciona con datos reales”
```

Este es el primer milestone técnico importante del proyecto.

A partir de aquí:

* el stack queda validado
* la arquitectura queda aterrizada
* el ritmo de desarrollo acelera
* ya es posible construir features reales encima de una base estable

