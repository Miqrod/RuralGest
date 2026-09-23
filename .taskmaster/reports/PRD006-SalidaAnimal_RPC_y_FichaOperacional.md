# PRD006-SalidaAnimal_RPC_y_FichaOperacional.md

# Fase actual

Fase 6: Registro de salida de animal y consolidación de escrituras transaccionales.

---

# CONTEXTO:
Lee SIEMPRE antes de empezar:

* `AI_docs/product_spec.md`
* `AI_docs/frontend_spec.md`
* `AI_docs/backend_spec.md`

Contexto adicional si aplica:

* `.taskmaster/reports/objetivos_fase06.md`
* `AI_docs/frontend_patterns.md`
* `documentacion/arquitectura/overview.md`

---

# Objetivo principal

Implementar el segundo flujo completo de escritura del sistema mediante el registro de una salida de animal.

El objetivo NO es únicamente registrar una venta o una muerte.

El objetivo es validar el siguiente paso del modelo central de la aplicación:

```text
Evento
↓
Estado derivado
```

siguiendo la misma filosofía establecida en PRD005:

```text
Los eventos son la fuente de verdad.
```

Esta fase representa la transición desde:

```text
Primer flujo de escritura basado en eventos
```

hacia:

```text
Primer ciclo de vida completo del animal
```

---

# Contexto funcional

En PRD005 validamos:

```text
Evento ENTRADA
↓
Creación de animal
```

En esta fase validaremos:

```text
Animal vivo
↓
Evento SALIDA
↓
Cambio de estado derivado
```

El objetivo es demostrar que:

```text
Un evento puede modificar correctamente
el estado operativo de una entidad.
```

manteniendo la trazabilidad completa.

---

# Contexto arquitectónico

PRD005 introdujo el primer flujo de escritura:

```text
Formulario
↓
Use Case
↓
Repositorio
↓
Base de datos
```

Sin embargo, las operaciones de escritura todavía se ejecutan mediante múltiples inserciones secuenciales.

PRD006 introduce una nueva regla arquitectónica para el proyecto:

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

y futuros flujos del dominio.

---

# Modelo de dominio validado en esta fase

La operación que se valida es:

```text
Salida de animal
↓
Evento SALIDA
↓
Motivo
↓
Actualización de estado derivado
```

Motivos incluidos:

```text
Venta
Muerte
```

Estados derivados resultantes:

```text
Venta
↓
estado_vital = vendido

Muerte
↓
estado_vital = muerto
```

---

# Objetivos específicos

## 1. Completar el ciclo de vida básico

Validar:

```text
Entrada
↓
Animal vivo
↓
Salida
```

completando por primera vez el ciclo operativo mínimo de un animal dentro del sistema.

---

## 2. Registrar evento de salida

Implementar la creación de:

```text
tipo_evento = SALIDA
```

asociado a un motivo concreto.

El evento debe seguir siendo la fuente de verdad del sistema.

---

## 3. Actualizar el estado vital

Implementar la lógica necesaria para que:

```text
Evento SALIDA
↓
Actualización estado_vital
```

sea una consecuencia controlada del caso de uso.

---

## 4. Mantener trazabilidad

Registrar:

```text
evento
↓
evento_animal
```

permitiendo reconstruir posteriormente el historial completo del animal.

Esta trazabilidad será utilizada en PRD007.

---

## 5. Consolidar RPC transaccionales

Migrar el flujo de compra implementado en PRD005 hacia RPC.

Crear el flujo de salida directamente sobre RPC.

El objetivo es consolidar una única estrategia de escritura para todo el proyecto.

---

## 6. Convertir la ficha en centro operacional

La ficha del animal dejará de ser una pantalla exclusivamente de consulta.

Debe evolucionar hacia:

```text
Centro de lectura
+
Centro de acciones
```

desde donde se ejecutarán futuros eventos del dominio.

---

## 7. Introducir patrón de acciones inline

Implementar un patrón reutilizable para futuras acciones:

```text
Registrar salida
Registrar cubrición
Registrar parto
Registrar evento sanitario
```

evitando la proliferación de pantallas secundarias y modales complejos.

---

# UX esperada

La interacción principal debe ser:

```text
Ficha animal
↓
Registrar salida
↓
Formulario desplegable
↓
Guardar
↓
Ficha actualizada
```

La salida debe sentirse como una acción natural dentro del contexto del animal.

---

# Alcance de esta fase

## ✅ Incluir

### Salida de animal

* motivo venta
* motivo muerte

### Eventos

* evento SALIDA
* asociación evento-animal

### Estados

* estado_vital = vendido
* estado_vital = muerto

### RPC

* registrar_compra_animal
* registrar_salida_animal

### UI

* sección de acciones
* formulario inline
* actualización de ficha

### Arquitectura

* migración compra → RPC
* validación de concurrencia
* patrón de escritura definitivo

---

## ❌ NO incluir todavía

### Financiero

NO implementar:

```text
Precio de venta
Comprador
Factura
Cobros
Pagos
```

---

### Muerte avanzada

NO implementar:

```text
Causa de muerte
Clasificaciones sanitarias
Informes veterinarios
```

---

### Reproducción

NO implementar:

```text
Cubrición
Parto
Aborto
Destete
```

---

### Selección reproductiva

NO implementar:

```text
Movimiento a lote reproductivo
Selección genética
```

---

### Correcciones

NO implementar:

```text
Deshacer eventos
Compensaciones
Edición de eventos
```

---

# Reglas arquitectónicas

## 1. Los eventos siguen siendo la fuente de verdad

La verdad del sistema continúa viviendo en:

```text
eventos
```

No en:

```text
animal.estado_vital
```

---

## 2. estado_vital es un snapshot derivado

El campo:

```text
estado_vital
```

debe entenderse como:

```text
Snapshot persistido
Derivado de eventos
```

Nunca como fuente de verdad.

---

## 3. Backend decide

Toda lógica relevante debe vivir en:

```text
Domain
Application
```

No en el frontend.

---

## 4. DB protege

La base de datos debe proteger:

```text
Consistencia
Concurrencia
Integridad
```

aunque existan validaciones previas en el backend.

---

## 5. Use Cases separados por intención de negocio

Mantener separados:

```text
registrarVentaAnimal
registrarMuerteAnimal
```

aunque internamente compartan implementación.

La separación se realiza por semántica de negocio.

---

## 6. RPC separados únicamente cuando diverge la implementación

Mientras venta y muerte compartan operaciones técnicas:

```text
registrar_salida_animal
```

será suficiente.

La separación futura deberá producirse únicamente cuando las operaciones en base de datos sean distintas.

---

## 7. La ficha es el centro operacional

Las futuras acciones del dominio deben ejecutarse preferentemente desde la ficha.

Evitar crear pantallas específicas cuando la interacción pueda resolverse dentro del contexto del animal.

---

## 8. Validación en dos niveles

Las reglas críticas del dominio deben validarse:

1. en el Use Case
2. en la RPC

Ejemplo:

Animal vivo
↓
assertAnimalPuedeSalir()
↓
registrar_salida_animal()
↓
FOR UPDATE
↓
validación estado_vital

El backend guía el flujo.
La base de datos protege la consistencia.

---

# Entregables esperados

La fase debe terminar con:

* registro de venta operativo
* registro de muerte operativo
* evento SALIDA persistido
* relación evento-animal creada
* estado_vital actualizado
* RPC de compra operativo
* RPC de salida operativo
* ficha operacional funcional
* patrón de acciones inline validado
* arquitectura consolidada

---

# Riesgos a evitar

* tratar estado_vital como fuente de verdad
* duplicar RPCs innecesariamente
* mover reglas de negocio al frontend
* crear nuevas pantallas para cada acción
* introducir lógica financiera prematuramente
* romper la trazabilidad evento-animal
* introducir abstracciones innecesarias

---

# Prioridad máxima

Priorizar siempre:

1. consistencia arquitectónica
2. trazabilidad basada en eventos
3. simplicidad
4. mantenibilidad
5. reutilización futura del patrón

Por encima de:

* refinamiento visual
* optimización prematura
* soporte para casos futuros aún no implementados

---

# Resultado esperado real

Al finalizar esta fase, la aplicación debe demostrar:

```text
Un evento SALIDA

puede modificar correctamente
el estado operativo de un animal

manteniendo la trazabilidad completa

y utilizando una arquitectura
de escritura transaccional basada en RPC.
```

La aplicación evolucionará desde:

```text
Primer flujo de escritura
```

hacia:

```text
Primer ciclo de vida completo
basado en eventos.
```


---

# Forma de trabajo

## 1. NO avanzar más allá de lo pedido

Implementar solo el objetivo actual.

---

## 2. Explicar antes de implementar

Antes de escribir código:

* qué vas a hacer
* por qué
* decisiones técnicas
* posibles riesgos

---

## 3. Trabajar en pasos pequeños

Cada paso debe tener:

* un único objetivo claro
* cambios pequeños y controlados

---

## 4. Mostrar siempre

* archivos creados/modificados
* código completo
* explicación breve
* qué cambia respecto al paso anterior

---

## 5. Documentar

* todo lo que hagamos/decidamos debe quedar documentado al acabar la implementación del PRD
* por tanto, al acabar recuérdame que falta preparar la documentación.

---

# Reglas técnicas

* NO romper nada existente
* reutilizar código existente
* mantener separación de capas
* evitar complejidad innecesaria
* añadir comentarios útiles
* usar nombres explícitos
* preguntar ante dudas importantes