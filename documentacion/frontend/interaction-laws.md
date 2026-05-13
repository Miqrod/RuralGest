## 1. Interaction Philosophy

Interactions should feel:

- deliberate
- traceable
- contextual
- calm
- trustworthy

Never:

- noisy
- overly animated
- hyper-reactive
- gamified

---

## 2. Interaction Laws

### Law 1: Intention Over Mechanics

The UI represents:

- operational intent

NOT:

- technical implementation
- event internals
- database structure

Example:

GOOD:
"Registrar tratamiento"

BAD:
"Crear treatment_event"

---

### Law 2: Events Are Immutable

Users do not edit historical events.

Corrections happen through:

- compensations
- reversals
- follow-up events

Never allow inline silent rewriting of operational history.

---

### Law 3: Traceability Has Priority

The system must preserve:

- chronology
- source
- causality
- operational responsibility

Minimalism must never destroy traceability.

---

### Law 4: Derived State Is Secondary

Current status is useful.

But the historical chain explaining that status is more important.

The interface should always make the path to explanation discoverable.

---

### Law 5: Critical Actions Require Context

Before executing critical actions, the UI should explain:

- operational consequences
- biological consequences
- financial consequences
- affected entities

The system should reduce accidental irreversible operations.

---

### Law 6: Operational Density Is Good

Whitespace is valuable.

But excessive simplification is dangerous.

The interface should optimize:

- scanning
- cognition
- operational rhythm

NOT aesthetic emptiness.

---

### Law 7: Visual Priority Reflects Operational Priority

Critical information should dominate visually.

The UI hierarchy should follow:

1. alerts
2. operational blockers
3. active workflows
4. biological status
5. historical context
6. secondary metadata

---