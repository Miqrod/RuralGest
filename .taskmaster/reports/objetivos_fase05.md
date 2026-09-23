# Current Phase

## Fase actual

Fase 5: Registro de entrada de animal vacuno.

---

# Objetivo principal

Implementar el primer flujo completo de escritura del sistema mediante el registro de una entrada de animal vacuno.

El objetivo NO es crear animales mediante un CRUD tradicional.

El objetivo es validar el modelo central de la aplicación:

```text
Evento
↓
Animal
```

siguiendo la regla fundamental del dominio:

```text
Primero ocurre un evento.
Después existe el animal en el sistema.
```

Esta fase representa la transición desde:

```text
Modelo de lectura
```

hacia:

```text
Primer flujo de escritura basado en eventos
```

---

# Contexto funcional

En el modelo ganadero:

```text
No existe un evento ALTA.
```

El alta de un animal es una consecuencia de determinados eventos.

Para esta fase trabajaremos únicamente con:

```text
Evento ENTRADA
motivo = compra
```

que representa la incorporación de un animal comprado a la explotación.

---

# Modelo de dominio validado en esta fase

La operación que se valida es:

```text
Entrada de animal
↓
Evento ENTRADA
↓
Motivo COMPRA
↓
Creación del animal
↓
Asociación evento-animal
```

El objetivo es demostrar que:

```text
Un evento puede generar una entidad derivada.
```

sin necesidad de crear previamente el animal.

---

# Objetivos específicos

## 1. Acceso desde el listado de animales

Añadir una acción visible en:

```text
/vacuno/animales
```

Ejemplo:

```text
Registrar entrada
```

o equivalente.

El objetivo es que el flujo comience desde una acción de negocio reconocible por el usuario.

Evitar terminología tipo:

```text
Nuevo animal
```

ya que empuja hacia un modelo CRUD que no refleja correctamente el dominio.

---

## 2. Primer flujo de escritura real

Implementar el primer flujo completo de mutación del sistema.

Validar:

```text
Listado
↓
Registrar entrada
↓
Formulario
↓
Use Case
↓
Evento
↓
Persistencia
↓
Actualización UI
```

---

## 3. Registrar evento de entrada

Implementar la creación de un evento:

```text
tipo_evento = ENTRADA
motivo = compra
```

Este evento será el origen del alta del animal.

No debe existir creación independiente del animal fuera de este flujo.

---

## 4. Crear animal derivado del evento

Implementar la lógica necesaria para:

```text
Evento ENTRADA
↓
Crear animal
```

Manteniendo la trazabilidad entre ambos elementos.

---

## 5. Registrar asociación evento-animal

Crear la relación correspondiente en:

```text
evento_animales
```

permitiendo identificar qué evento originó la incorporación del animal.

Rol recomendado:

```text
sujeto
```

El objetivo es mantener consistencia con futuros eventos que involucren múltiples animales.

---

## 6. Primer caso de uso de escritura

Implementar un caso de uso específico.

Ejemplo:

```text
RegisterAnimalEntry
```

o nombre equivalente.

Responsabilidades:

* validar datos
* crear evento
* crear animal
* crear asociación evento-animal
* garantizar consistencia

---

## 7. Formulario de entrada

Implementar una pantalla para registrar la entrada de un animal.

Ejemplo:

```text
/ vacuno / animales / entrada
```

o ruta equivalente.

---

### Comportamiento del formulario

El usuario NO debe seleccionar:

```text
tipo_evento
```

El sistema conoce de antemano que se trata de:

```text
ENTRADA
```

---

### Motivo de entrada

El usuario debe seleccionar:

```text
Motivo
```

mediante un desplegable.

Inicialmente se validará el flujo:

```text
Compra
```

pero el diseño debe permitir añadir nuevos motivos en el futuro.

Ejemplos:

```text
Compra
Adopción
Nacimiento
...
```

---

### Datos mínimos iniciales

El formulario debe recoger únicamente los datos necesarios para registrar la entrada.

Ejemplos:

* crotal
* sexo
* raza
* fecha nacimiento
* fecha entrada
* motivo

No diseñar todavía formularios complejos.

---

### Evolución futura

El formulario debe quedar preparado conceptualmente para mostrar distintos campos según el motivo seleccionado.

Ejemplo:

```text
Compra
↓
importe
proveedor

Nacimiento
↓
madre
padre

Adopción
↓
origen
```

Esta lógica NO debe implementarse todavía.

---

## 8. Validaciones iniciales

### Frontend

Validaciones orientadas a UX:

* campos obligatorios
* formatos básicos
* feedback inmediato

### Backend

Validaciones reales:

* coherencia de datos
* reglas mínimas de dominio
* integridad del flujo

La autoridad sigue siendo el backend.

---

## 9. Navegación operacional

Permitir el flujo:

```text
Listado animales
↓
Registrar entrada
↓
Guardar
↓
Ficha animal
```

La experiencia debe sentirse simple y coherente.

---

## 10. Estados de carga y error

Implementar gestión adecuada de:

* carga
* validaciones fallidas
* error inesperado
* éxito

---

## 11. Consolidar arquitectura de escritura

Validar la arquitectura definida para el proyecto:

```text
Page
↓
Form
↓
Use Case
↓
Repository
↓
DB
```

Manteniendo:

```text
Frontend guía
Backend decide
DB protege
```

---

# Alcance de esta fase

## ✅ Incluir

* botón "Registrar entrada"
* formulario de entrada
* selector de motivo
* validaciones básicas
* caso de uso de escritura
* evento ENTRADA
* motivo COMPRA
* creación de animal
* asociación evento-animal
* persistencia real
* navegación post-creación
* estados de carga y error

---

## ❌ NO incluir todavía

### Lotes

NO implementar:

* selección de lote
* movimientos entre lotes
* stock de lotes
* evento_lotes

---

### Movimientos complejos

NO implementar:

* movimiento_id
* agrupación de eventos
* compensaciones

---

### Reproducción

NO implementar:

* parto
* cubrición
* aborto
* destete

---

### Eventos sanitarios

NO implementar:

* tratamientos
* enfermedades
* observaciones sanitarias

---

### Edición

NO implementar:

* edición de animales
* modificación de eventos
* corrección de datos

---

### Financiero

NO implementar:

* transacciones
* gastos
* facturas
* generación automática de movimientos económicos

Aunque el motivo COMPRA sea monetizable, esta fase únicamente valida el flujo ganadero.

---

# Reglas arquitectónicas

## 1. Evento primero

El flujo correcto es:

```text
Evento
↓
Animal
```

Nunca:

```text
Animal
↓
Evento
```

---

## 2. Mantener separación de capas

Siempre:

```text
Page
↓
Use Case
↓
Repository
↓
DB
```

Nunca:

```text
Page
↓
Supabase
```

---

## 3. Backend decide

Toda lógica importante debe vivir en:

```text
Application
Domain
```

No en:

```text
Frontend
```

---

## 4. Simplicidad primero

Esta fase busca validar el modelo.

No introducir:

* abstracciones complejas
* automatismos avanzados
* optimizaciones prematuras

---

## 5. Código pedagógico

Priorizar:

* claridad
* trazabilidad
* nombres explícitos
* facilidad de comprensión

Por encima de:

* sofisticación técnica
* concisión extrema

---

# Entregables esperados

La fase debe terminar con:

* botón "Registrar entrada" operativo
* formulario operativo
* evento ENTRADA persistido
* motivo COMPRA asociado
* animal creado correctamente
* relación evento-animal creada
* navegación completa
* primer flujo de escritura validado
* arquitectura mantenida

---

# Riesgos a evitar

* convertir la entrada en un CRUD simple
* crear animales sin evento
* introducir lógica de negocio en frontend
* acoplar UI directamente a Supabase
* introducir conceptos de lotes prematuramente
* añadir complejidad innecesaria

---

# Prioridad máxima

Priorizar:

1. consistencia arquitectónica
2. validación del modelo basado en eventos
3. simplicidad
4. mantenibilidad
5. aprendizaje del flujo completo

Por encima de:

* refinamiento visual
* optimización prematura
* funcionalidades futuras

---

# Resultado esperado real

Al finalizar esta fase, la aplicación debe demostrar:

```text
Un evento ENTRADA (motivo compra)
puede generar correctamente el alta
de un animal en el sistema.
```

La aplicación evolucionará desde:

```text
Modelo de lectura
```

hacia:

```text
Primer flujo de escritura basado en eventos
```

validando el principio fundamental del proyecto:

```text
Los eventos son la fuente de verdad.
```
