# Frontend Patterns

## Objetivo

Este documento define los patrones frontend oficiales del proyecto.

Su objetivo NO es imponer rigidez.

Su objetivo es:

* mantener consistencia
* evitar complejidad accidental
* reducir decisiones repetitivas
* proteger la arquitectura
* mejorar mantenibilidad

---

# Filosofía general

El frontend NO contiene la verdad del sistema.

El frontend:

* guía al usuario
* representa estado
* ejecuta intención
* muestra información

Pero:

* el backend decide
* la DB protege
* el dominio interpreta

---

# Principios frontend

## 1. SSR-first

Priorizar siempre:

* Server Components
* carga en servidor
* fetch server-side
* simplicidad

Usar Client Components solo cuando realmente haga falta:

* interacción
* estado local
* formularios
* eventos UI
* componentes interactivos

---

## 2. El frontend NO accede directamente a la DB

Nunca:

```ts
page.tsx → supabase
```

Siempre:

```text
page → use case → repository
```

La UI no conoce:

* SQL
* estructura DB
* queries
* Supabase internals

---

## 3. UI ≠ DB

Nunca usar directamente:

```ts
Database['public']['Tables']['animal']['Row']
```

La UI debe trabajar con:

```ts
AnimalListItem
```

O:

```ts
AnimalDetailView
```

Objetivo:

* desacoplar frontend
* evitar coupling
* permitir evolución del schema
* permitir proyecciones específicas

---

## 4. Componentes pequeños y explícitos

Priorizar:

* componentes simples
* nombres claros
* composición
* props explícitas

Evitar:

* mega componentes
* abstracciones prematuras
* componentes ultra-genéricos

---

## 5. Server Components por defecto

Por defecto:

```tsx
export default async function Page() {}
```

Convertir a Client Component solo cuando sea necesario.

---

# Estructura recomendada

## app/

Contiene:

* rutas
* layouts
* pages
* loading
* error
* navegación

NO contiene:

* lógica de negocio
* queries complejas
* reglas importantes

---

## ui/ dentro de módulos

Cada módulo puede tener:

```text
modules/
  ganadero/
    animales/
      ui/
```

Aquí viven:

* tablas
* formularios
* cards
* widgets
* componentes específicos del módulo

---

## shared/ui/

Componentes reutilizables globales:

```text
shared/ui/
```

Ejemplos:

* Button
* PageHeader
* EmptyState
* DataTable base
* LoadingSpinner

---

# Patrones de páginas

## Patrón recomendado

```tsx
export default async function AnimalesPage() {
  const animales = await listarAnimales()

  return <AnimalesTable animales={animales} />
}
```

La página:

* carga datos
* coordina render
* delega UI

NO:

* contiene lógica compleja
* hace transformaciones grandes
* habla directamente con infraestructura

---

# Patrones de tablas

## Objetivo de DataTable

La DataTable debe:

* reutilizarse
* ser simple
* ser typed
* permitir composición

NO debe convertirse en:

```text
framework dentro del framework
```

---

## Patrón recomendado

```tsx
<DataTable
  columns={columns}
  data={animales}
/>
```

Las columnas viven cerca del módulo:

```text
animales/ui/table/columns.tsx
```

---

## Mantener proyecciones simples

Para listados usar:

```ts
AnimalListItem
```

NO usar:

```ts
Animal completo
```

El listado solo debe cargar lo necesario.

---

# Patrones de formularios

## Librerías

Usar:

* react-hook-form
* zod

---

## Reglas

### Validación UX

Frontend valida:

* formato
* feedback inmediato
* ergonomía

Pero:

* el backend sigue validando todo

---

## Formularios largos

Para formularios complejos:

* dividir por secciones
* usar componentes pequeños
* evitar formularios gigantes

---

# Patrones de loading

## loading.tsx

Usar loading states reales.

Cada ruta importante debe tener:

```text
loading.tsx
```

---

## Skeletons simples

Preferir:

* skeletons simples
* placeholders ligeros

Evitar:

* animaciones excesivas
* loaders complejos

---

# Patrones de error

## error.tsx

Las rutas importantes deben tener:

```text
error.tsx
```

---

## UX de errores

Mostrar:

* mensaje claro
* contexto útil
* posibilidad de reintentar

Evitar:

* errores técnicos crudos
* stack traces
* mensajes ambiguos

---

# Patrones de navegación

## Sidebar

La navegación debe:

* reflejar bounded contexts
* mantener consistencia
* evitar profundidad excesiva

Ejemplo:

```text
Vacuno
  Animales
  Lotes
  Eventos

Finanzas
  Ventas
  Facturas
```

---

# Patrones de estado

## Estado local primero

Priorizar:

* estado local React
* props explícitas
* composición

NO introducir:

* Zustand
* Redux
* stores globales

hasta que exista una necesidad real.

---

## React Query

NO introducir prematuramente.

Mientras SSR cubra el caso:

* mantener simplicidad
* evitar capas extra

---

# Patrones de acciones

## Mutaciones futuras

Cuando lleguen formularios reales:

Priorizar:

* Server Actions
* use cases backend
* invalidación simple

Evitar lógica de negocio en cliente.

---

# Patrones visuales

## Diseño

Priorizar:

* claridad
* densidad moderada
* velocidad de lectura
* consistencia

La app es:

```text
herramienta operacional
```

NO:

```text
landing visual experimental
```

---

## Componentes UI

Usar:

* shadcn/ui
* Tailwind
* composición simple

Evitar:

* wrappers innecesarios
* sistemas visuales ultraabstractos

---

# Patrones de naming

## Componentes

Usar nombres explícitos:

```text
AnimalTable
VentaForm
FacturaDetailCard
```

Evitar:

```text
Manager
Handler
Processor
Container
```

---

# Anti-patrones

## ❌ CRUD thinking

No pensar:

```text
tabla → formulario → editar → borrar
```

Pensar:

```text
caso de uso → intención → flujo operacional
```

---

## ❌ Lógica en frontend

Nunca:

* reglas importantes
* invariantes
* cálculos críticos

---

## ❌ Mega componentes

Si un componente crece demasiado:

* dividir
* extraer subcomponentes
* simplificar responsabilidades

---

## ❌ UI hiperabstracta

Evitar:

* factories complejas
* config-driven UI extrema
* componentes mágicos

---

# Prioridades frontend

Priorizar siempre:

1. claridad
2. mantenibilidad
3. simplicidad
4. consistencia
5. UX operacional

Por encima de:

* sofisticación
* micro-optimizaciones
* abstracciones complejas
* flexibilidad extrema

---

# Resultado esperado

El frontend debe sentirse:

* estable
* predecible
* rápido
* entendible
* fácil de extender

Y debe permitir que:

```text
la complejidad viva en el dominio,
no en la UI
```

