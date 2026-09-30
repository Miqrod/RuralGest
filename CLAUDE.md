# CLAUDE.md

Behavioral and architectural guidelines for the Livestock Management application.

This project is domain-driven and highly dependent on conceptual integrity.
The assistant must preserve business meaning, traceability, and architectural coherence above implementation convenience.

The goal is NOT only to produce working code.
The goal is to evolve a long-term maintainable system without semantic corruption.

---

# 1. Think Before Coding

Do not assume business rules silently.

Before implementing:
- State assumptions explicitly.
- Ask when domain meaning is unclear.
- Surface tradeoffs.
- Explain simpler alternatives if they exist.
- Prefer clarification over incorrect interpretation.

Never silently reinterpret:
- financial flows
- livestock flows
- transaction meaning
- invoice meaning
- traceability rules
- entity responsibilities

If multiple interpretations are possible:
- stop
- explain them
- ask

---

# 2. Simplicity First

Prefer the simplest implementation that preserves domain integrity.

Avoid:
- speculative abstractions
- premature generalization
- enterprise-style indirection
- configurable systems not yet needed
- reusable layers for single use cases
- dynamic architectures without clear benefit

This project evolves incrementally.

Do not build:
- generic entity engines
- overengineered factories
- plugin systems
- universal repositories
- “future-proof” abstractions without real usage

A simple explicit implementation is preferred over a flexible abstract one.

Ask yourself:
“Would a senior engineer consider this unnecessarily complex?”

If yes:
- simplify
- reduce layers
- reduce indirection
- reduce files

---

# 3. Surgical Changes

Touch only what is required for the requested task.

Do NOT:
- refactor unrelated code
- rename things unnecessarily
- reorganize folders without reason
- apply formatting changes outside scope
- introduce architectural rewrites silently

Every changed line must trace directly to the user request.

If unrelated issues are discovered:
- mention them
- do not fix them unless asked

Preserve:
- naming conventions
- existing architectural style
- existing UX patterns
- existing modular structure

---

# 4. Goal-Driven Execution

Transform requests into explicit verifiable goals.

Before implementation:
1. Explain approach
2. List affected files
3. Explain risks
4. Define verification criteria

For multi-step tasks:
1. Step
   -> verification
2. Step
   -> verification

Never use vague completion criteria like:
- “done”
- “working”
- “improved”

Always define:
- what was validated
- how correctness is verified
- what invariant is preserved

---

# 5. Domain Integrity First

This project is highly domain-driven.

Business meaning is more important than implementation convenience.

Never collapse conceptually distinct entities just because current behavior overlaps.

Examples:
- factura != transaccion
- evento != venta
- venta != factura
- venta_linea != factura_linea

Even if current implementation appears similar, preserve conceptual separation.

The architecture is intentionally prepared for future evolution:
- estimations
- reconciliation
- analytics
- forecasting
- historical comparisons

Do not remove conceptual layers because they seem redundant today.

---

# 6. Preserve Traceability

Traceability is a core invariant.

The system must preserve the ability to navigate:

factura
→ factura_linea
→ venta_linea
→ evento
→ animal/lote

Never introduce shortcuts that weaken traceability.

Never bypass:
- venta_linea
- factura_linea
- transaction origins

venta_linea is the critical bridge between:
GANADERO ↔ FINANCIERO

Protect this invariant carefully.

---

# 7. Financial Model Rules

These rules are critical and non-negotiable.

## factura vs transaccion

Factura:
- external legal/economic document
- source of economic truth

Transaccion:
- financial movement representation
- analytical layer
- supports future forecasting/reconciliation

Do NOT merge them.

---

## transaction immutability

Transactions are immutable historical facts.

Never:
- edit transaction amounts
- modify transaction category retroactively
- mutate historical economic records

Corrections must create new transactions.

---

## venta restrictions

If a venta has transactions:
- the venta must become immutable

Do not allow silent propagation of changes into historical transactions.

---

## no automatic ventas

The system must NEVER create ventas automatically.

The user explicitly controls:
- creation
- grouping
- association

Protect this rule.

---

## no fake invoices

Do NOT create fake factura records for:
- tickets
- manual expenses
- undocumented expenses

Use:
- transaccion
- documento

without inventing factura entities.

---

# 8. Unified Financial Philosophy

The system intentionally uses a unified financial model for:
- ingresos
- gastos

Do NOT create parallel systems like:
- compra
- compra_linea

unless explicitly requested.

Reuse:
- factura
- transaccion
- categoria_financiera

while respecting domain semantics.

---

# 9. UX Philosophy

UX must guide the user toward coherent data.

Prefer:
- guided flows
- suggested associations
- prevention of invalid states
- explicit validation

Avoid:
- silent automation
- hidden assumptions
- implicit relationships

The user should understand:
- what is happening
- why
- what the consequences are

---

# 10. Backend and Data Safety

Protect invariants at backend level.

Do not rely only on frontend validation.

Critical business rules must be enforced in:
- database constraints
- backend validation
- service logic

Prioritize:
- consistency
- integrity
- auditability

over convenience.

---

# 11. Migration Safety — Redefining Existing Functions

Before writing any migration with `CREATE OR REPLACE FUNCTION` for a function that already exists:

1. Run `./scripts/check-rpc.sh <function_name>` to list all migrations that define it.
2. Read the **most recent** migration as the base. Never the first.
3. Add only the minimum change needed on top of that version.

This rule exists because functions are redefined multiple times across migrations.
Basing on an old version silently loses all intermediate changes.

After writing the migration, run `supabase db reset --local` to verify it applies cleanly.

---

# 12. Evals — Domain Regression Tests

After closing a feature that touches RPC logic or domain rules, add or extend the corresponding eval in `evals/`.

Evals are pure domain tests (no DB, no network). They run in ~1s with `npm run evals`.

Critical invariants to protect with evals:
- RPC argument coherence (e.g. nacidos = vivos + muertos)
- Valid state transitions for each event
- Metadata keys that drive UI rendering (cierre_por_cria, cierre_por_salida, contexto)
- Conditions that guard CAMBIO_UBICACION generation

See `evals/README.md` for the full list and conventions.

---

# 13. Incremental Development Philosophy

This project is intentionally developed step-by-step.

Prefer:
- small changes
- iterative validation
- narrow scope
- progressive evolution

Do not:
- redesign entire systems
- introduce broad refactors
- “improve everything”
- optimize prematurely

The project values:
- understanding
- maintainability
- conceptual clarity

more than speed.

---

# 12. Communication Style

When implementing:
- explain reasoning briefly
- explain tradeoffs
- explain architectural consequences
- warn about invariant risks

If uncertain:
- ask first

Do not confidently invent business logic.

Clarity is more important than speed.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
