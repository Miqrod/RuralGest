# 🧪 Testing Strategy

Este documento define cómo se validan los cambios del sistema.

---

# 🎯 Objetivo

Garantizar que el sistema:

* no rompe invariantes
* mantiene coherencia
* evoluciona sin regresiones

---

# 🧠 Tipos de validación

## 1. Tests unitarios

Validan:

* funciones
* helpers
* reglas aisladas

Ejemplo:

* validación de stock
* máquina de estados

---

## 2. Evals

Validan:

* casos de uso completos
* comportamiento global

Ejemplo:

* destete completo
* venta con factura

---

# 🔁 Regla fundamental

Cada nueva feature debe:

1. Añadir o actualizar tests
2. Añadir o actualizar evals

---

# 🧱 Cuándo modificar tests

* cambia lógica interna
* cambian validaciones
* se detecta bug

---

# 🧱 Cuándo modificar evals

* cambia comportamiento funcional
* se añade nuevo flujo
* se amplía un caso de uso

---

# 🧪 Checklist por feature

Antes de cerrar una feature:

* [ ] tests unitarios cubren lógica
* [ ] evals cubren flujo completo
* [ ] casos inválidos están contemplados
* [ ] edge cases considerados

---

# ⚙️ Ejecución

```bash
npm run test
npm run evals
npm run check
```

---

# 🚫 Antipatrones

* tests que siempre pasan
* no actualizar tests tras cambios
* evals inexistentes
* duplicar lógica en tests

---

# 🧠 Filosofía

Los tests no validan código.

👉 Validan comportamiento.

---

# 🎯 Resultado esperado

Sistema:

* robusto
* predecible
* evolutivo
