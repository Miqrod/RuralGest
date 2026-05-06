# 🔒 Guardrails del Sistema

Este documento define las reglas que NO pueden romperse bajo ninguna circunstancia.

Se aplican a:

* desarrollo
* revisiones
* arquitectura
* base de datos

---

# 🧠 PRINCIPIO BASE

👉 Los EVENTOS son la única fuente de verdad
👉 Todo lo demás es derivado

---

# 🚫 PROHIBICIONES ABSOLUTAS

## 1. Eventos

* ❌ No se pueden editar
* ❌ No se pueden borrar
* ✅ Solo se corrigen mediante eventos compensatorios

---

## 2. Estados derivados

* ❌ No se pueden editar manualmente
* ✅ Se calculan a partir de eventos

Ejemplo:

* estado_reproductivo
* estado_vital
* cantidad_actual

---

## 3. Lógica en frontend

* ❌ Nunca lógica de negocio en frontend
* ❌ Nunca validaciones críticas en frontend

El frontend:
👉 solo muestra datos
👉 solo envía acciones

---

## 4. Duplicación de lógica

* ❌ No duplicar lógica en backend y DB
* ❌ No duplicar lógica entre módulos

Regla:

* Backend → decide
* DB → protege

---

# 🧱 INVARIANTES CRÍTICAS

Estas reglas deben cumplirse SIEMPRE:

* stock ≥ 0
* máximo 1 ciclo reproductivo abierto
* estados coherentes con eventos
* eventos inmutables
* FK válidas

---

# 🧠 RESPONSABILIDADES

| Capa     | Responsabilidad          |
| -------- | ------------------------ |
| Frontend | UI                       |
| Backend  | lógica + validación      |
| DB       | integridad + constraints |

---

# 🧩 CHECKLIST DE DESARROLLO

Antes de aceptar cualquier código:

* [ ] ¿Estoy modificando eventos? → ERROR
* [ ] ¿Estoy editando estado derivado? → ERROR
* [ ] ¿Hay lógica en frontend? → ERROR
* [ ] ¿Hay duplicación de lógica? → ERROR
* [ ] ¿se respetan invariantes? → OBLIGATORIO

---

# 🧪 CHECKLIST DE TESTS

Cada feature debe validar:

* casos válidos
* casos inválidos
* edge cases

---

# 🎯 OBJETIVO

Construir un sistema:

* consistente
* robusto
* imposible de romper por error humano
