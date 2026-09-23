# objetivos_fase06.md

# Current Phase

## Fase actual

Fase 6: Registro de salida de animal y consolidación de escrituras transaccionales.

---

# Objetivo principal

Implementar el segundo flujo completo de escritura del sistema mediante el registro de una salida de animal.

El objetivo NO es únicamente registrar una venta o una muerte.

El objetivo es validar simultáneamente:

```text
Evento
↓
Estado derivado
```

y consolidar la arquitectura definitiva de escritura:

```text
Frontend
↓
Use Case
↓
Repository
↓
RPC
↓
DB
```

Esta fase completa el primer ciclo de vida funcional del animal:

```text
Entrada
↓
Animal vivo
↓
Salida
```

---

# Contexto funcional

En PRD005 se validó:

```text
Evento ENTRADA
↓
Creación de animal
```

En esta fase se validará:

```text
Animal vivo
↓
Evento SALIDA
↓
Cambio de estado derivado
```

El objetivo es demostrar que los eventos continúan siendo la fuente de verdad del sistema y que los estados son consecuencias derivadas de dichos eventos.

---

# Nueva regla arquitectónica

A partir de esta fase:

```text
Toda operación que:

- cree eventos
- cree entidades derivadas
- modifique snapshots derivados

debe ejecutarse mediante RPC transaccional.
```

Esta regla será aplicable a:

```text
Compra
Venta
Muerte
Parto
Cubrición
Destete
Eventos sanitarios
Selección reproductiva
```

---

# Modelo de dominio validado

## Venta

```text
Animal vivo
↓
Evento SALIDA
motivo = venta
↓
estado_vital = vendido
```

## Muerte

```text
Animal vivo
↓
Evento SALIDA
motivo = muerte
↓
estado_vital = muerto
```

---

# Decisiones arquitectónicas obligatorias

## 1. Eventos como fuente de verdad

Los eventos siguen siendo la fuente de verdad.

Nunca considerar:

```text
animal.estado_vital
```

como origen de información histórica.

---

## 2. estado_vital es snapshot derivado

Debe entenderse como:

```text
Snapshot persistido
Derivado de eventos
```

No como fuente de verdad.

---

## 3. Validación en dos niveles

Las reglas críticas deben validarse:

### Nivel 1

Use Case

Ejemplo:

```ts
assertAnimalPuedeSalir()
```

### Nivel 2

RPC

Ejemplo:

```sql
FOR UPDATE
```

más validación de:

```text
estado_vital = vivo
```

La lógica guía el flujo.

La base de datos protege la consistencia.

---

## 4. Use Cases separados por intención

Mantener:

```text
registrarVentaAnimal
registrarMuerteAnimal
```

aunque internamente compartan implementación.

---

## 5. RPC separados únicamente cuando diverja la implementación

Mantener:

```text
registrar_salida_animal
```

mientras venta y muerte compartan operaciones de base de datos.

---

## 6. La ficha es el centro operacional

Las acciones futuras deben ejecutarse preferentemente desde la ficha.

Evitar pantallas específicas innecesarias.

---

# Estructura objetivo

## Domain

```text
domain/
├── types.ts
└── rules.ts
```

### types.ts

Añadir:

```ts
RegistrarVentaAnimalInput
RegistrarMuerteAnimalInput
```

### rules.ts

Añadir:

```ts
assertAnimalPuedeSalir()
```

---

## Application

```text
application/actions/
```

Mantener:

```text
registrarCompraAnimal.ts
```

Añadir:

```text
registrarVentaAnimal.ts
registrarMuerteAnimal.ts
```

---

## Infrastructure

```text
infrastructure/
├── mapper.ts
└── repository.ts
```

---

## UI

```text
ui/
├── ficha/
│   └── SeccionAcciones.tsx
└── salida/
    └── FormSalidaAnimal.tsx
```

---

# Bloque 1 - Helpers SQL

## Objetivo

Evitar repetir lógica de resolución de catálogos en cada RPC.

---

## Crear

```sql
_resolve_tipo_evento_id()
```

Responsabilidad:

```text
codigo
↓
UUID
```

---

## Crear

```sql
_resolve_motivo_id()
```

Responsabilidad:

```text
nombre
↓
UUID
```

---

## Verificación

Las funciones devuelven el UUID correcto para registros existentes.

---

# Bloque 2 - Conversión de compra a RPC

## Objetivo

Eliminar la secuencia de inserciones desde TypeScript.

---

## Crear

```sql
registrar_compra_animal()
```

Responsabilidades:

* crear evento
* crear animal
* crear asociación evento-animal

en una única transacción.

---

## Mapper

Sustituir:

```text
mapCompraInputToEventoInsert
mapCompraInputToAnimalInsert
```

por:

```ts
mapCompraInputToRpcArgs()
```

---

## Repository

Mantener:

```ts
insertarCompraAnimal()
```

pero migrar internamente a:

```ts
supabase.rpc(...)
```

---

## Resultado esperado

El comportamiento funcional no cambia.

Solo cambia la estrategia de persistencia.

---

# Bloque 3 - RPC de salida

## Crear

```sql
registrar_salida_animal()
```

Parámetros:

```text
p_animal_id
p_motivo
p_fecha
```

---

## Responsabilidades

### 1

Bloquear fila:

```sql
FOR UPDATE
```

---

### 2

Validar:

```text
estado_vital = vivo
```

---

### 3

Crear evento SALIDA

---

### 4

Crear evento_animal

---

### 5

Actualizar snapshot:

```text
vendido
o
muerto
```

---

## Resultado

La operación completa debe ser atómica.

---

# Bloque 4 - Dominio y aplicación

## Tipos

Crear:

```ts
RegistrarVentaAnimalInput
RegistrarMuerteAnimalInput
```

---

## Regla

Crear:

```ts
assertAnimalPuedeSalir()
```

---

## Repository

Crear:

```ts
insertarSalidaAnimal()
```

Internamente:

```ts
supabase.rpc(
  'registrar_salida_animal'
)
```

---

## Use Case - Venta

```text
registrarVentaAnimal
```

Flujo:

```text
obtener animal
↓
validar
↓
RPC
↓
retornar eventoId
```

---

## Use Case - Muerte

```text
registrarMuerteAnimal
```

Mismo flujo.

---

# Bloque 5 - UI

## Objetivo

Convertir la ficha en centro operacional.

---

## Crear

```tsx
SeccionAcciones
```

Responsabilidad:

Mostrar acciones disponibles para el animal.

---

## Crear

```tsx
FormSalidaAnimal
```

Formulario inline.

---

## UX

```text
Ficha
↓
Registrar salida
↓
Accordion
↓
Formulario
↓
Guardar
↓
Actualizar ficha
```

---

## Campos actuales

```text
Motivo
Fecha salida
```

---

## Evolución futura

### Venta

```text
Precio
Comprador
Factura
```

### Muerte

```text
Causa
```

No implementar todavía.

---

# Criterios de aceptación

## Venta

```text
Animal vivo
↓
Registrar venta
↓
Evento creado
↓
evento_animal creado
↓
estado_vital = vendido
```

---

## Muerte

```text
Animal vivo
↓
Registrar muerte
↓
Evento creado
↓
evento_animal creado
↓
estado_vital = muerto
```

---

## Concurrencia

Dos peticiones simultáneas.

Resultado esperado:

```text
Una operación tiene éxito.
La otra falla.
```

---

## Compra

La compra sigue funcionando exactamente igual tras migrar a RPC.

---

# Riesgos a evitar

* Tratar estado_vital como fuente de verdad.
* Crear rutas específicas para salida.
* Introducir modales complejos.
* Duplicar RPCs sin necesidad.
* Mover reglas al frontend.
* Introducir lógica financiera.
* Crear abstracciones prematuras.

---

# Entregables esperados

* RPC registrar_compra_animal.
* RPC registrar_salida_animal.
* Helpers SQL reutilizables.
* Compra migrada a RPC.
* registrarVentaAnimal.
* registrarMuerteAnimal.
* FormSalidaAnimal.
* SeccionAcciones.
* Ficha operacional.
* Concurrencia protegida.
* Base preparada para PRD007 (Historial de eventos).

```
```
