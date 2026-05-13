# 🧪 Evals del Sistema

Los evals validan el comportamiento global del sistema.

No prueban funciones aisladas.
Prueban escenarios reales.

---

# 🎯 Objetivo

Detectar:

* errores de lógica
* violaciones de invariantes
* inconsistencias entre capas
* regresiones

---

# 🧠 Diferencia con tests

Tests:
👉 validan piezas

Evals:
👉 validan el sistema completo

---

# 🧱 Tipos de evals

## 1. Casos de uso válidos

Ejemplo:

* destete correcto
* venta válida

---

## 2. Casos inválidos

Ejemplo:

* destete sin lactancia
* stock negativo

---

## 3. Edge cases

Ejemplo:

* destete parcial
* múltiples eventos seguidos

---

## 4. Invariantes

Siempre comprobar:

* stock ≥ 0
* 1 ciclo abierto máximo
* estados coherentes

---

# 🧠 Regla clave

Un eval debe responder:

👉 “¿El sistema se comporta correctamente en este escenario?”
