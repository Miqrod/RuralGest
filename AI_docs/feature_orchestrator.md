# 🧠 FEATURE ORCHESTRATOR

## 🎯 Objetivo

Implementar una nueva feature siguiendo el sistema definido:

* dominio primero
* SPEC obligatorio
* ejecución incremental
* control humano

---

## 📦 CONTEXTO (obligatorio)

[PEGAR AQUÍ context.generated.md]

---

## 🧩 FEATURE

Describe la feature:

* Nombre:
* Descripción:
* Objetivo de negocio:

---

## ⚠️ REGLAS

* NO escribir código hasta completar SPEC
* SIEMPRE respetar:

  * eventos como fuente de verdad
  * estados derivados no editables
  * backend decide, DB protege
* SI algo rompe el modelo → detenerse y explicar

---

# 🧠 FASE 1 — COMPRENSIÓN (Graphify)

Usa Graphify.

Analiza:

1. Entidades implicadas
2. Eventos necesarios
3. Estados derivados afectados
4. Relaciones con otros módulos

Output:

* mapa claro del impacto en el sistema

---

# 🧠 FASE 2 — SPEC (SIN CÓDIGO)

Define:

## 1. Qué ocurre en el mundo real

## 2. Eventos generados

## 3. Invariantes afectadas

## 4. Estados derivados

## 5. Edge cases

NO avanzar sin SPEC completo.

---

# 🧠 FASE 3 — VALIDACIÓN DEL MODELO

Verifica:

* ¿respeta event-driven?
* ¿evita lógica en frontend?
* ¿evita duplicación backend/DB?
* ¿mantiene invariantes?

Si hay problemas:
→ detenerse y proponer alternativa

---

# 🎨 FASE 4 — DISEÑO UX (Frontend Design)

Usa Frontend Design.

Define:

* acción de usuario (no eventos)
* flujo UX
* restricciones UX
* validaciones en UI (solo guía, no lógica crítica)

---

# ⚙️ FASE 5 — IMPLEMENTACIÓN (Taskmaster)

Usa Taskmaster.

Implementa en pasos:

1. use case (application service)
2. validaciones
3. creación de eventos
4. actualización de estados derivados

Explica:

* qué haces
* por qué

---

# 🔍 FASE 6 — REVISIÓN (Impeccable)

Usa Impeccable.

Analiza:

* claridad del código
* consistencia con modelo
* edge cases
* fricción UX

Clasifica:

* errores críticos
* mejoras importantes
* mejoras opcionales

---

# 🧠 FASE 7 — DEBUG (opcional, Karpathy)

Si hay problemas complejos:
usa Karpathy para análisis profundo.

---

# 🧠 FASE 8 — TEST MENTAL

Simula:

* casos válidos
* casos inválidos
* edge cases

---

# 🧠 FASE 9 — MEMORIA

Sugiere:

* qué añadir a decisions.md
* qué añadir a patterns.md
* qué añadir a mistakes.md

Formato listo para copiar.

---

# 🧾 FASE 10 — DOCUMENTACIÓN

Genera:

* resumen del módulo
* flujo
* decisiones técnicas

---

## 🧠 OUTPUT FINAL

Debe incluir:

1. SPEC claro
2. implementación
3. revisión
4. test mental
5. memoria sugerida
6. documentación
