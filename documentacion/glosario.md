# 📚 Glosario del Sistema Ganadero

> Documento canónico de términos y conceptos del sistema.
>
> Objetivo:
> - unificar lenguaje
> - evitar ambigüedades
> - mejorar trazabilidad semántica
> - facilitar reasoning de IA y humanos
> - servir como fuente de verdad conceptual

---

# A

## Acción de negocio

Operación reconocible por el usuario en la UX.

Ejemplos:
- destetar
- registrar parto
- seleccionar reproductor
- mover animales a engorde

⚠️ Importante:
Las acciones de negocio NO son eventos ni movimientos.
Son comandos de alto nivel que el backend traduce internamente.

Ejemplo:
```text
UX: "Destetar"
↓
Backend:
- EVENTO DESTETE
- MOVIMIENTO
- EVENTO SALIDA
- EVENTO ENTRADA
```

---

## Ajuste

Evento especial utilizado para corregir errores operativos reales.

NO corrige datos descriptivos.
NO modifica eventos anteriores.

Siempre:
- crea nuevos eventos
- deja trazabilidad
- requiere motivo
- debe auditarse

Ejemplos válidos:
- se informó la muerte del animal equivocado
- error en cantidad de un lote

Ejemplos NO válidos:
- corregir crotal
- cambiar raza
- corregir sexo

Esos casos pertenecen al historial de cambios.

---

## Animal

Entidad individual identificable.

Puede representar:
- vacuno
- porcino reproductor

Características:
- identidad persistente
- crotal único
- historial trazable
- estados derivados de eventos

---

## Animal reproductor

Animal capaz de participar en el ciclo reproductivo.

Se identifica mediante:
```text
es_reproductora = true
```

Permite:
- validar eventos biológicos
- abrir ciclos reproductivos
- filtrar animales reproductivos

⚠️ Importante:
No depende de inferencias ni memoria humana.
Es una decisión explícita del sistema.

---

# B

## Backend

Capa responsable de:
- lógica de negocio
- validaciones
- decisiones
- coordinación de eventos
- aplicación de reglas

Principio fundamental:
```text
Backend decide
DB protege
Frontend ejecuta intención
```

---

# C

## Ciclo reproductivo

Narrativa estructurada de los eventos reproductivos de una hembra.

Agrupa:
- cubriciones
- partos
- abortos
- destetes

Objetivos:
- entender estado reproductivo
- calcular métricas
- detectar problemas
- ordenar eventos biológicos

Reglas clave:
- máximo 1 ciclo abierto por animal
- el ciclo NO depende de la cubrición
- el ciclo se cierra por:
  - destete
  - aborto
  - muerte
  - venta
  - timeout

---

## Compensación

Mecanismo para revertir errores SIN modificar el pasado.

Nunca:
- borra eventos
- modifica eventos

Siempre:
- crea nuevos eventos inversos
- preserva trazabilidad

Ejemplo:
```text
destete incorrecto
↓
crear movimiento inverso
↓
crear eventos compensatorios
```

---

## Contexto generado

Conjunto de documentos, memoria y conocimiento estructurado que se entrega a la IA para contextualizar decisiones.

Incluye:
- specs
- invariantes
- decisiones previas
- arquitectura
- patrones

Su objetivo es evitar:
- respuestas aisladas
- inconsistencias
- pérdida de contexto

---

# D

## Destete

Evento biológico asociado al final de la lactancia.

Vacuno:
- cierra ciclo reproductivo

Porcino:
- cierra ciclo reproductivo
- genera movimiento interno
- mueve animales:
  - camada → post-destete

⚠️ Importante:
El destete NO es un traslado genérico.

---

## Documento externo

Entidad generada fuera del sistema.

Ejemplos:
- factura
- ticket
- justificante

Representa realidad documental/legal.

---

# E

## Estado derivado

Valor calculado automáticamente a partir de eventos.

NO editable manualmente.

Ejemplos:
- estado_vital
- estado_reproductivo
- cantidad_actual
- estado_lote

Principio clave:
```text
evento = verdad
estado = proyección
```

---

## Evento

Unidad mínima de realidad del sistema.

Representa algo que realmente ocurrió.

Ejemplos:
- parto
- venta
- muerte
- cubrición
- entrada
- salida

Principios:
- inmutable
- trazable
- auditable
- fuente de verdad

El sistema se reconstruye desde eventos.

---

## Evento biológico

Evento relacionado con reproducción o fisiología.

Ejemplos:
- parto
- aborto
- cubrición
- destete

Permiten:
- gestionar ciclos
- calcular estados reproductivos
- aplicar reglas biológicas

---

## Evento operativo

Evento relacionado con operación o gestión.

Ejemplos:
- sanitario
- cambio ubicación
- ajuste

---

## Evento de stock

Evento que modifica cantidades físicas.

Ejemplos:
- entrada
- salida
- ajuste

---

# F

## Factura

Documento económico/legal externo.

Representa:
```text
lo que realmente se ha facturado
```

Es:
- fuente de verdad económica
- base contable
- referencia legal

⚠️ Importante:
Factura ≠ venta.

---

## Fuente de verdad

Entidad considerada autoritativa dentro del sistema.

Ejemplos:
- EVENTOS → verdad operativa
- FACTURA → verdad económica

---

# G

## Graphify

Herramienta/capa orientada a mapear:
- arquitectura
- relaciones
- contexto
- dominio

Se utiliza para:
- comprensión sistémica
- reasoning estructural
- navegación conceptual

---

# H

## Historial de cambios

Registro de modificaciones sobre datos NO derivados de eventos.

Ejemplos:
- crotal
- raza
- sexo

NO almacena cambios de realidad.
Solo correcciones descriptivas.

---

# I

## IA dirigida

Modelo de uso de IA donde:
- la IA acelera
- el humano decide

La IA:
- propone
- estructura
- ejecuta
- revisa

Pero:
- NO define dominio
- NO toma decisiones estratégicas

---

## Inmutabilidad

Principio según el cual ciertos elementos nunca se modifican.

Aplica especialmente a:
- eventos
- transacciones

Los cambios se realizan mediante:
- compensaciones
- nuevos eventos

Nunca mediante edición destructiva.

---

## Invariante

Regla crítica que el sistema nunca puede violar.

Ejemplos:
- stock no negativo
- máximo un ciclo abierto
- cantidad movida ≤ disponible

Las invariantes:
- se validan en backend
- se protegen en DB

---

# L

## Lote

Agrupación de animales gestionados colectivamente.

Puede tener:
- finalidad legal
- finalidad operativa

Tipos:
- camada
- post-destete
- engorde

---

## Lote camada

Lote asociado a una cerda tras un parto.

Características:
- animales anónimos
- ligado a la madre
- desaparece con el destete

---

## Lote legal

Lote cuya función principal es cumplir requisitos normativos.

Ejemplo:
- lote post-destete

Características:
- crotal compartido
- identidad colectiva
- persistencia legal

---

## Lote operativo

Lote utilizado por motivos prácticos/productivos.

Ejemplo:
- lote de engorde

Características:
- agrupación semántica
- flexible
- orientado a manejo

---

## Lote post-destete

Lote legal generado tras el destete.

Características:
- crotal colectivo
- persistencia legal
- puede mezclarse operacionalmente

---

## Lote de engorde

Lote operativo orientado a producción.

Puede:
- mezclar animales
- reorganizarse
- cambiar composición

---

# M

## Memoria

Persistencia de decisiones, contexto y conocimiento histórico.

Objetivos:
- evitar rediscusión
- mantener coherencia
- acumular aprendizaje

---

## Metadata

Información adicional contextual asociada a entidades/eventos.

Usada para:
- flexibilidad
- trazabilidad
- extensibilidad

---

## Movimiento

Agrupador lógico de eventos coordinados.

NO es la fuente de verdad.
Los eventos siguen siendo la verdad.

Se utiliza para:
- trazabilidad
- atomicidad
- coherencia operativa

Ejemplo:
```text
SALIDA + ENTRADA
↓
mismo movimiento_id
```

---

# P

## Parto

Evento biológico asociado al nacimiento.

Vacuno:
- crea animales

Porcino:
- crea lote camada

---

## Proyección

Representación derivada calculada desde eventos.

Ejemplos:
- estado actual
- stock actual
- ubicación actual

⚠️ Importante:
La proyección NO es la verdad.
La verdad son los eventos.

---

# R

## RAG

Retrieval-Augmented Generation.

Mecanismo mediante el cual la IA recupera:
- documentos
- memoria
- specs
- contexto

antes de responder o ejecutar.

Objetivo:
- razonamiento contextual
- coherencia
- reducción de alucinaciones

---

## Reconciliación

Comparación entre:
- previsión económica
- realidad facturada

Detecta diferencias entre:
```text
esperado vs real
```

---

# S

## Snapshot

Persistencia materializada de un estado derivado.

Objetivo:
- evitar recalcular constantemente
- mejorar rendimiento

Ejemplo:
```text
cantidad_actual
estado_reproductivo
```

---

## Spec

Definición estructurada de una feature o comportamiento.

Debe describir:
- realidad de negocio
- eventos
- invariantes
- edge cases
- estados afectados

⚠️ Regla:
No implementar sin SPEC.

---

## Stock

Cantidad física disponible de animales o lotes.

Se modifica mediante:
- entradas
- salidas
- ajustes

---

# T

## Timeout reproductivo

Cierre automático de ciclo reproductivo por ausencia prolongada de resultado.

Condiciones:
- hay cubrición
- no hay parto
- no hay aborto
- ha pasado demasiado tiempo

Resultado:
```text
resultado = desconocido
```

---

## Trazabilidad

Capacidad del sistema para reconstruir:
- qué ocurrió
- cuándo ocurrió
- por qué ocurrió
- qué lo originó

Es uno de los principios centrales del modelo.

---

## Transacción

Representación de movimiento económico.

Puede ser:
- previsión
- real
- manual

NO es la verdad documental.
La verdad documental es la factura.

---

# U

## UX guiada

Diseño de interfaz orientado a:
- reducir errores
- ocultar complejidad
- dirigir decisiones válidas

El usuario trabaja con:
- acciones de negocio

NO con:
- eventos
- movimientos
- estructuras internas

---

# V

## Venta

Unidad comercial del sistema.

Representa:
```text
el acuerdo comercial
```

NO representa:
- dinero
- factura
- evento físico

Agrupa:
- venta_linea

---

## Venta_linea

Puente entre:
- realidad física
- operación comercial

Conecta:
```text
evento ↔ venta
```

Es una de las entidades más importantes del sistema.

---

# Principios Fundamentales del Sistema

## 1. Eventos como fuente de verdad

Todo cambio relevante nace de eventos.

---

## 2. Estados derivados

Los estados nunca se editan manualmente.

---

## 3. Inmutabilidad

El pasado no se modifica.

---

## 4. Compensación sobre mutación

Los errores se corrigen creando nuevos eventos.

---

## 5. Backend centralizado

La lógica vive en backend.

---

## 6. DB defensiva

La base de datos protege invariantes.

---

## 7. UX orientada a intención

El usuario expresa intención, no estructura técnica.

---

## 8. Trazabilidad total

Todo debe poder reconstruirse.

---

## 9. IA como copiloto

La IA acelera, pero el humano mantiene control.

---

## 10. Dominio primero

La realidad del negocio manda sobre la implementación.
