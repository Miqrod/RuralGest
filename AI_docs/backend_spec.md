# Backend Spec

## 1. Objetivo

Este documento define la arquitectura backend, las reglas estructurales y los principios técnicos del sistema.

Es la fuente de verdad para:

* lógica backend
* persistencia
* invariantes
* integridad
* organización arquitectónica

Debe leerse junto con:

* `product_spec.md`
* `frontend_spec.md`

---

# 2. Filosofía del sistema

El sistema NO es CRUD.

Es un sistema basado en:

* eventos
* invariantes
* trazabilidad
* estados derivados

Principios fundamentales:

1. Eventos = fuente de verdad
2. Estados = derivados
3. Backend = autoridad del negocio
4. DB = guardián estructural
5. Frontend = intención del usuario
6. No mutar el pasado
7. Correcciones mediante compensación
8. Evitar duplicación lógica

---

# 3. Separación de responsabilidades

## Frontend

Responsable de:

* UX
* formularios
* navegación
* guiar al usuario

NO debe contener:

* lógica crítica
* invariantes
* reglas complejas de negocio

---

## Backend

Responsable de:

* validaciones
* casos de uso
* creación de eventos
* consistencia del sistema
* aplicación de reglas de negocio
* orquestación

Toda lógica importante vive aquí.

---

## Database (Supabase/PostgreSQL)

Responsable de:

* persistencia
* constraints
* foreign keys
* integridad estructural
* índices
* RLS

NO debe contener:

* lógica compleja de dominio
* workflows
* automatizaciones centrales
* estados derivados importantes

Triggers:

* mínimos
* defensivos
* simples

---

# 4. Arquitectura backend

La aplicación debe organizarse alrededor de CASOS DE USO.

NO alrededor de:

* CRUDs genéricos
* tablas
* repositories abstractos innecesarios

Ejemplos válidos:

* CreateEventoSalidaAnimal
* CreateVenta
* CreateFactura
* CreateTransaccionFromFactura

---

# 5. Arquitectura por capas

## Domain

Responsable de:

* entidades
* reglas puras
* invariantes conceptuales

---

## Application

Responsable de:

* casos de uso
* orquestación
* validaciones
* coordinación

---

## Infrastructure

Responsable de:

* Supabase
* persistencia
* adaptadores
* storage
* servicios externos

---

## UI

Responsable de:

* interacción
* presentación
* formularios

---

# 6. Base de datos

## Principios

La base de datos debe:

* proteger integridad
* ser reproducible
* ser versionada
* evitar corrupción

---

## Reglas obligatorias

### 1. Todo cambio estructural mediante migrations

NO crear tablas manualmente desde la UI.

Toda modificación debe hacerse mediante:

* migrations SQL
* archivos versionados
* cambios reproducibles

---

### 2. Priorizar constraints sobre triggers

Usar:

* foreign keys
* check constraints
* unique constraints
* índices

Evitar triggers complejos.

---

### 3. Tipado TypeScript generado

Los tipos deben generarse desde la DB.

La DB es la fuente de verdad estructural.

---

# 7. Inmutabilidad

## Eventos

* NO editables
* NO eliminables

## Transacciones

* NO editables
* NO mutar importes históricos

Correcciones:

* mediante compensación
* nunca mediante modificación destructiva

---

# 8. Estados derivados

Los estados:

* NO se editan manualmente
* se calculan desde eventos

Ejemplos:

* estado vital
* estado reproductivo
* stock

---

# 9. Principios de implementación

Priorizar:

* claridad
* simplicidad
* mantenibilidad
* código explícito

Evitar:

* abstracciones prematuras
* complejidad innecesaria
* “smart code”
* sobreingeniería

---

# 10. Principios de aprendizaje

El desarrollo será incremental y pedagógico.

Siempre:

* explicar decisiones
* justificar arquitectura
* explicar riesgos
* mostrar cambios realizados

El objetivo NO es solo construir el sistema.
El objetivo también es entenderlo.
