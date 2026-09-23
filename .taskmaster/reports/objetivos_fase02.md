# Current Phase

## Fase actual

Fase 2: Backend foundation + Supabase integration.

---

# Objetivo principal

Conectar la aplicación con Supabase y preparar la base backend del sistema.

El objetivo NO es implementar funcionalidades completas todavía.

El objetivo es construir una base sólida, versionada y mantenible para el desarrollo futuro.

---

# Objetivos específicos

## 1. Setup Supabase

* crear proyecto Supabase
* configurar variables de entorno
* instalar SDK
* configurar clientes server/client
* preparar estructura inicial

---

## 2. Base de datos versionada

Preparar sistema de migrations.

NO crear tablas manualmente desde la UI de Supabase.

Toda modificación debe realizarse mediante:

* migrations SQL
* archivos versionados
* cambios reproducibles

---

## 3. Definir modelo inicial

Preparar estructura inicial del modelo de datos.

Prioridad actual:

* animal
* lote
* evento
* motivo_movimiento
* venta
* venta_linea
* tercero
* factura
* transaccion

NO implementar todavía:

* lógica avanzada
* conciliación
* automatismos complejos
* realtime
* analytics

---

## 4. Constraints e integridad

Definir:

* foreign keys
* check constraints
* índices
* relaciones
* validaciones estructurales

Priorizar integridad y claridad.

---

## 5. Backend foundation

Preparar estructura backend inicial:

* modules/
* domain/
* application/
* infrastructure/

Organizar lógica alrededor de casos de uso.

NO crear CRUDs genéricos como núcleo del sistema.

---

## 6. TypeScript typing

Generar tipos TypeScript desde Supabase/PostgreSQL.

La DB debe actuar como fuente de verdad estructural.

---

## 7. Seguridad mínima

Preparar:

* auth básica
* RLS mínima
* separación básica usuario/sistema

NO implementar permisos avanzados todavía.

---

# Entregables esperados

La fase debe terminar con:

* Supabase conectado
* migrations funcionando
* estructura backend preparada
* modelo inicial definido
* tipos TS generados
* auth básica funcionando
* arquitectura estable

---

# Forma de implementación

Trabajar de forma incremental.

NO intentar construir todo en un único paso.

Cada tarea debe:

* tener un único objetivo
* ser pequeña
* ser validable
* mantener coherencia arquitectónica

---

# Riesgos a evitar

* lógica de negocio en DB
* exceso de triggers
* CRUD thinking
* sobreingeniería
* avanzar demasiado rápido
* duplicación de lógica
* crear tablas sin diseño previo

---

# Prioridad máxima

Priorizar:

1. consistencia
2. claridad
3. mantenibilidad
4. integridad

Por encima de:

* velocidad
* automatización
* sofisticación
