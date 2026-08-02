# Patrones arquitectónicos

Este directorio recoge los patrones reutilizables que definen cómo se implementan las distintas partes del sistema.
Cada patrón resuelve un problema arquitectónico concreto y puede combinarse con otros para construir un flujo completo.

Relación entre patrones

Una operación de negocio atraviesa varios niveles de responsabilidad:

Use Case
    ↓
Context
    ↓
Rules
    ↓
Projection
    ↓
RPC Transaccional
    ↓
Persistencia


Cada patrón responde a una pregunta distinta.

| Patrón | Pregunta que responde |
|---|---|
| Context → Rules → Projection | ¿Cómo interpreta el sistema una operación de negocio? |
| RPC Transaccional | ¿Cómo persiste el sistema esa operación de forma segura? |

Los patrones no compiten entre sí.

Se complementan.

Un caso de uso puede utilizar únicamente un patrón o combinar varios dependiendo de la complejidad del dominio.