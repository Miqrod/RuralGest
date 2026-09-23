# Current Phase

## Fase actual

Fase 4: Ficha individual de animal vacuno.

---

# Objetivo principal

Profundizar el modelo de lectura y navegación operacional del sistema mediante la implementación de:

```text
/vacuno/animales/[id]
```

El objetivo NO es implementar todavía edición completa ni workflows de escritura.

El objetivo es validar:

* routing dinámico
* SSR individual
* proyecciones de detalle
* composición UI modular
* navegación lista → detalle
* arquitectura de lectura
* reutilización de componentes visuales

utilizando una entidad central del dominio:

```text
animal
```

---

# Objetivos específicos

## 1. Routing dinámico

Implementar:

```text
/vacuno/animales/[id]
```

Usando:

* App Router
* Server Components
* carga SSR

El objetivo es validar navegación operacional real.

---

## 2. Primer modelo de detalle

Definir:

```ts
AnimalDetail
```

Separado de:

```ts
AnimalListItem
```

La ficha NO debe reutilizar automáticamente la proyección de listado.

El objetivo es:

* separar contextos UI
* evitar coupling
* validar múltiples representaciones de una misma entidad

---

## 3. Use case de detalle

Implementar:

```text
getAnimalDetail(id)
```

El use case debe:

* cargar datos necesarios
* preparar proyección de detalle
* coordinar acceso a datos
* mantener separación de capas

---

## 4. Repository y mapper

Extender repository y mapper existentes.

Objetivo:

* validar queries individuales
* mantener encapsulación infraestructura
* mantener separación DB ↔ dominio

---

## 5. Navegación lista → detalle

Permitir navegar desde:

```text
/vacuno/animales
```

hasta:

```text
/vacuno/animales/[id]
```

La navegación debe sentirse:

* clara
* rápida
* operacional

---

## 6. Estados visuales reutilizables

Implementar representación visual de estados:

* estado vital
* estado reproductivo
* otros estados simples si aplica

Usar:

* badges
* pills
* colores consistentes

El objetivo NO es decoración visual.

El objetivo es:

* lectura rápida
* densidad informativa
* reutilización futura

---

## 7. Componentes UI modulares

Extraer componentes reutilizables.

Ejemplos:

```text
AnimalHeader
AnimalInfoCard
EstadoVitalBadge
```

Objetivo:

* composición
* claridad
* reutilización

Evitar componentes gigantes.

---

## 8. Estados de loading y error

Implementar:

* loading.tsx
* error.tsx
* not-found.tsx

La UX debe contemplar:

* animal inexistente
* carga lenta
* error inesperado

---

## 9. Layout operacional simple

La ficha debe priorizar:

* claridad
* velocidad de lectura
* jerarquía visual
* densidad moderada

NO crear todavía:

* dashboards complejos
* tabs avanzadas
* timelines completas

---

# Alcance de esta fase

## ✅ Incluir

* routing dinámico
* SSR detalle
* use case detalle
* proyección AnimalDetail
* navegación lista → detalle
* badges reutilizables
* cards simples
* loading/error/not-found
* composición modular

---

## ❌ NO incluir todavía

### Escritura completa

NO implementar:

* edición
* guardado
* acciones complejas
* mutaciones

---

### Eventos y timeline

NO implementar todavía:

* timeline de eventos
* historial completo
* trazabilidad avanzada

---

### Relaciones complejas

NO implementar todavía:

* genealogía completa
* reproducción avanzada
* finanzas relacionadas
* analytics

---

### Arquitectura de escritura

NO introducir todavía:

* Server Actions complejas
* invalidaciones sofisticadas
* caches avanzadas
* optimistic updates

---

# Reglas arquitectónicas

## 1. SSR-first

La ficha debe renderizarse en servidor.

Priorizar simplicidad.

---

## 2. La UI NO conoce Supabase

Siempre:

```text
page → use case → repository
```

Nunca:

```text
page → supabase
```

---

## 3. Mantener separación de proyecciones

```ts
AnimalListItem
```

NO es:

```ts
AnimalDetail
```

Cada vista define sus necesidades.

---

## 4. Componentes pequeños

Priorizar:

* composición
* nombres explícitos
* responsabilidades simples

---

## 5. Estados visuales reutilizables

La representación visual de estados debe:

* centralizarse
* reutilizarse
* mantener consistencia

---

## 6. Backend decide

El frontend representa.

NO implementar:

* reglas de negocio críticas
* cálculos importantes
* invariantes

---

# Entregables esperados

La fase debe terminar con:

* `/vacuno/animales/[id]` funcionando
* navegación completa lista → detalle
* SSR operativo
* use case detalle operativo
* AnimalDetail definido
* badges reutilizables
* loading/error/not-found implementados
* composición UI modular
* arquitectura de lectura consolidada

---

# Forma de implementación

Trabajar incrementalmente.

Cada paso debe:

* tener un único objetivo
* ser pequeño
* ser validable
* mantener coherencia arquitectónica

---

# Riesgos a evitar

* convertir la ficha en dashboard gigante
* reutilizar incorrectamente AnimalListItem
* introducir lógica de negocio en frontend
* acoplar UI a DB
* crear componentes demasiado genéricos
* introducir escritura prematuramente
* crear tabs complejas demasiado pronto

---

# Prioridad máxima

Priorizar:

1. claridad
2. composición
3. mantenibilidad
4. arquitectura de lectura
5. reutilización simple
6. UX operacional

Por encima de:

* sofisticación visual
* optimización prematura
* abstracciones complejas
* features avanzadas

---

# Resultado esperado real

Al finalizar esta fase, la aplicación debe demostrar:

```text
“una entidad puede explorarse mediante múltiples vistas coherentes”
```

El sistema debe pasar de:

```text
listado simple
```

A:

```text
navegación operacional real
```

Esta fase consolida:

* arquitectura frontend modular
* proyecciones de lectura
* navegación operacional
* composición UI

Y prepara la entrada futura a:

```text
acciones y escritura
```
