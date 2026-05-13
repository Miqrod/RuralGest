## 1. Core Philosophy

Every UI element must represent domain meaning.

The interface must never feel like:

- spreadsheets with colors
- generic admin panels
- SaaS dashboards
- ERP CRUD screens

The interface must feel like:

- an operational livestock control center
- a biological timeline
- a narrative system
- a traceability-first platform

---

## 2. Domain Entity Representation

### Animal

An animal is NOT a row.

An animal is:

- a living entity
- a temporal entity
- an operational entity
- a biological narrative
- a sequence of immutable events

The UI representation of an animal must always preserve:

- identity
- chronology
- status clarity
- biological context
- operational relevance

The UI must prioritize:

1. current operational relevance
2. biological status
3. recent events
4. traceability
5. metadata

Never prioritize decorative information over operational meaning.

---

### Lote (Batch)

A batch is:

- an operational grouping
- a contextual abstraction
- a dynamic organizational unit

A batch is NOT:

- merely a collection table
- a static grouping

Batch screens should emphasize:

- collective state
- operational actions
- movement history
- aggregated health
- timeline events
- alerts and deviations

---

### Event

Events are the source of truth.

Events are:

- immutable
- timestamped
- causal
- traceable

Events are NEVER:

- silently editable
- visually hidden
- secondary to derived state

Every important state shown in UI should be explainable by events.

---

### Derived State

Derived states are computed.

Examples:

- active
- gestating
- sold
- quarantined
- under treatment

Derived state must:

- appear secondary to events
- never behave as editable truth
- visually indicate computed nature when relevant

The UI should avoid creating the illusion that derived states are manually controlled.

---

### Operational Action

An operational action is:

- user intention
- high-level interaction
- domain-oriented operation

The user should never manipulate technical events directly.

The frontend translates:

user intention -> domain action -> backend event generation

---