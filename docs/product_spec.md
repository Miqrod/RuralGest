# Product Spec

## 1. Overview

Aplicación web para la gestión integral de explotaciones ganaderas que
conecta cuatro capas fundamentales:

-   🐄 Realidad física → eventos, animales, lotes
-   💼 Operación comercial → ventas
-   🧾 Documento legal → facturas
-   💰 Dinero → transacciones

Principio fundamental: 👉 Los eventos son la única fuente de verdad del
sistema.

Esto garantiza: - trazabilidad completa - consistencia - escalabilidad -
posibilidad de reconstrucción histórica

------------------------------------------------------------------------

## 2. Core Features

### 2.1 Gestión Ganadera

-   Animales (vacuno, porcino reproductor)
-   Lotes (porcino productivo)
-   Estados derivados (vital, reproductivo, sanitario)
-   Ciclo reproductivo completo

------------------------------------------------------------------------

### 2.2 Sistema de Eventos (core absoluto)

-   Tabla única de eventos
-   Eventos inmutables
-   Acciones UX → generan eventos
-   Sistema de compensación (no edición)

------------------------------------------------------------------------

### 2.3 Ventas (unidad de negocio)

-   Creación manual obligatoria
-   Agrupación de venta_linea
-   Estados:
    -   abierta
    -   parcial
    -   facturada

------------------------------------------------------------------------

### 2.4 Puente Ganadero ↔ Financiero

Entidad clave: venta_linea

Permite: - conectar evento con dinero - trazabilidad completa - análisis
coherente

------------------------------------------------------------------------

### 2.5 Facturación

-   Registro de facturas externas
-   Factura_linea (agregado)
-   Factura_linea_detalle (granular)

------------------------------------------------------------------------

### 2.6 Transacciones

Tipos: - PREVISION (opcional) - FACTURA (real) - MANUAL (gastos)

Reglas: - inmutables - no editables - solo compensación

------------------------------------------------------------------------

### 2.7 Documentos

Tabla única desacoplada: - imágenes - tickets - PDFs

Asociación genérica por entidad_tipo + entidad_id

------------------------------------------------------------------------

### 2.8 Categorías financieras

-   jerárquicas (árbol)
-   análisis multinivel
-   reutilizables

------------------------------------------------------------------------

## 3. User Flows

### 3.1 Flujo principal (ingresos)

EVENTO → VENTA_LINEA → VENTA → FACTURA → TRANSACCIÓN

------------------------------------------------------------------------

### 3.2 Flujo alternativo

Factura llega primero: 1. crear venta 2. crear evento 3. registrar
factura

Regla: ❌ no se permite factura sin venta

------------------------------------------------------------------------

### 3.3 Flujo gastos

Casos:

1.  Con factura: factura → transacción

2.  Con ticket: transacción + documento

3.  Sin documento: transacción manual

------------------------------------------------------------------------

### 3.4 Flujo eventos (ejemplo destete)

-   usuario ejecuta acción
-   backend valida
-   crea eventos
-   crea movimiento
-   actualiza estados

------------------------------------------------------------------------

## 4. UX Principles

### 4.1 UX guiada

-   evitar errores
-   sugerir relaciones (ventas abiertas, etc.)

------------------------------------------------------------------------

### 4.2 Abstracción

Usuario NO ve: - eventos - movimientos

Usuario ve: - acciones de negocio

------------------------------------------------------------------------

### 4.3 Estados derivados

-   no editables
-   calculados desde eventos

------------------------------------------------------------------------

### 4.4 Inmutabilidad

-   eventos → no editables
-   transacciones → no editables

------------------------------------------------------------------------

### 4.5 Validación estricta

-   validar antes de persistir
-   evitar corrupción

------------------------------------------------------------------------

### 4.6 UX educativa

-   explicar decisiones
-   sistema entendible

------------------------------------------------------------------------

## 5. Tech Decisions

### Stack

-   Next.js
-   Supabase
-   Tailwind
-   shadcn/ui

------------------------------------------------------------------------

### Arquitectura

Backend: - lógica de negocio - validaciones

DB: - constraints - integridad

Triggers: - mínimos - defensivos

------------------------------------------------------------------------

### Principios técnicos

-   event-driven
-   modular
-   bajo acoplamiento
-   sin duplicidad lógica

------------------------------------------------------------------------

## 6. Data Model (high level)

### Capas

EVENTO → realidad física\
VENTA → operación\
FACTURA → documento\
TRANSACCIÓN → dinero

------------------------------------------------------------------------

### Relaciones

-   evento (1) → venta_linea (1)
-   venta_linea (N) → venta (1)
-   venta (1) → factura (N)
-   factura (1) → transacción (1)
-   factura_linea → venta_linea

------------------------------------------------------------------------

### Entidades clave

-   animal
-   lote
-   evento
-   venta_linea
-   venta
-   factura
-   factura_linea
-   factura_linea_detalle
-   transaccion
-   tercero
-   categoria_financiera
-   documento

------------------------------------------------------------------------

### Regla fundamental

👉 Todo deriva de eventos\
👉 Nada puede contradecir eventos

------------------------------------------------------------------------

## 7. Invariants (crítico)

-   eventos inmutables
-   stock ≥ 0
-   1 ciclo abierto máximo
-   estados derivados
-   coherencia temporal
-   FK válidas
-   validación previa

------------------------------------------------------------------------

## 8. Edge Cases

-   destete parcial
-   facturación parcial
-   gastos sin documento
-   eventos fuera de orden
-   múltiples facturas por venta

------------------------------------------------------------------------

## 9. Future Scope

### NO ahora

-   conciliación compleja
-   estimaciones automáticas
-   trazabilidad granular de lotes
-   automatismos avanzados

------------------------------------------------------------------------

### Preparado para

-   previsión vs realidad
-   analítica avanzada
-   multi-especie completa
-   permisos

------------------------------------------------------------------------

## 10. Filosofía del sistema

El sistema no es solo CRUD.

Es un sistema basado en: - eventos - invariantes - consistencia

👉 Diseñado para no romperse 👉 Diseñado para escalar 👉 Diseñado para
enseñar al usuario cómo funciona su propio negocio
