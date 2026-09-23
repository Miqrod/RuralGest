# Current Phase

## Fase actual

Fase 7: Inicio del módulo reproductivo.

---

# Preparación

Objetivo:
Crear el nuevo módulo reproductivo e integrar su estructura en el proyecto sin modificar el comportamiento existente.

Verificación:
La aplicación sigue funcionando exactamente igual antes de implementar la primera regla del dominio.

---

# Objetivo principal

Introducir el primer dominio que implementa el patrón para dominios con reglas reutilizables.

Implementar mediante la construcción de la infraestructura necesaria para gestionar el dominio reproductivo.

El Use Case continúa siendo la unidad arquitectónica por defecto del proyecto.

Durante esta fase únicamente se extraerá del Use Case el conocimiento reutilizable correspondiente al dominio reproductivo.

El objetivo NO es únicamente registrar una Cubrición.

El verdadero objetivo consiste en validar simultáneamente:

```text
Evento
↓

Contexto

↓

Rules

↓

Projection

↓

Snapshot
```

demostrando que el dominio puede interpretar correctamente un evento biológico sin que el caso de uso contenga reglas de negocio.

La Cubrición constituye únicamente el primer caso de uso encargado de validar esta arquitectura.

---

# Contexto funcional

En PRD006 se consolidó el modelo definitivo de escritura del sistema:

```text
Frontend

↓

Use Case

↓

(opcional)

Context

↓

Rules

↓

Projection

↓

Repository

↓

RPC
↓

DB
```

En esta fase se mantiene exactamente el mismo flujo de escritura.

La evolución se produce dentro del dominio.

A partir de ahora, antes de persistir un evento reproductivo, será necesario interpretar su significado biológico.

El flujo completo pasa a ser:

```text
Frontend
↓

Use Case

↓

(opcional)

Context

↓

Rules

↓

Projection

↓

Repository

↓

RPC
↓

DB
```

---

# Nuevo modelo de dominio

Todo evento reproductivo deberá seguir el siguiente patrón:

```text
Evento

↓

ReproductiveContext

↓

ReproductiveEligibilityRules

↓

ReproductiveCycleRules

↓

ReproductiveProjection

↓

Snapshot persistido
```

Este patrón pasa a convertirse en la referencia oficial para todo el módulo reproductivo.

---

# Decisiones arquitectónicas obligatorias

## 1. El dominio interpreta

Las reglas reproductivas dejan de vivir en los Use Cases.

Toda interpretación del dominio deberá realizarse dentro del Bounded Context.

---

## 2. El Contexto no contiene reglas

ReproductiveContext únicamente agrupa la información necesaria para interpretar un evento.

Nunca:

- calcula estados;
- modifica ciclos;
- proyecta snapshots.

---

## 3. Las Rules interpretan

Las reglas del dominio se agrupan bajo un único paquete:

```text
ReproductiveRules/

├── ReproductiveEligibilityRules
├── ReproductiveCycleRules
└── ReproductiveProjection
```

No existe una clase llamada:

```text
ReproductiveRules
```

El nombre identifica únicamente el conjunto de reglas del dominio.

---

## 4. Projection construye el snapshot

La proyección no calcula únicamente el estado reproductivo.

Construye toda la información derivada necesaria para lectura.

Inicialmente:

- estado reproductivo;
- ciclo activo;
- fecha prevista de parto;
- días restantes.

---

## 5. El snapshot nunca es fuente de verdad

Los estados reproductivos continúan siendo consecuencia de los eventos.

Nunca deben utilizarse para reconstruir la historia del animal.

---

# Estructura objetivo

## Domain

```text
reproductive/

├── context/
│   └── ReproductiveContext.ts
│
├── rules/
│   ├── ReproductiveEligibilityRules.ts
│   ├── ReproductiveCycleRules.ts
│   └── ReproductiveProjection.ts
│
├── types.ts
└── index.ts
```

---

## Application

```text
application/actions/

└── registrarCubricion.ts
```

---

## Infrastructure

Mantener la estrategia actual basada en:

```text
Repository

↓

RPC
```

La persistencia no debe conocer las reglas del dominio.

---

## UI

Reutilizar la infraestructura existente.

Añadir únicamente:

```text
FormCubricion
```

dentro del panel de acciones de la ficha.

No crear nuevas pantallas.

---

# Bloque 1 - Crear la infraestructura del patrón Context → Rules → Projection

## Objetivo

Crear la infraestructura base del módulo reproductivo.

Todavía no implementar comportamiento complejo.

---

## Crear

La estructura principal del dominio:

```text
reproductive/
```

con sus carpetas y responsabilidades.

---

## Verificación

Debe existir una estructura preparada para incorporar nuevas reglas sin modificar la arquitectura.

---

# Bloque 2 - ReproductiveContext

## Objetivo

Crear el objeto encargado de transportar toda la información necesaria para interpretar un evento reproductivo.

---

## Responsabilidades

Inicialmente deberá poder contener:

- animal;
- ciclo activo;
- último evento biológico;
- evento solicitado.

---

## Restricciones

Nunca:

- realizar cálculos;
- acceder a infraestructura;
- construir snapshots.

Debe comportarse como un contexto de lectura del dominio.

---

## Verificación

El contexto puede construirse completamente antes de ejecutar cualquier regla del dominio.

---

# Bloque 3 - ReproductiveEligibilityRules

## Objetivo

Implementar las validaciones que determinan si un evento reproductivo puede registrarse.

---

## Responsabilidad

Responder únicamente a la pregunta:

```text
¿Puede este animal recibir este evento?
```

---

## Validaciones iniciales

Como mínimo:

- animal reproductivo;
- estado compatible;
- evento permitido.

---

## Restricciones

Nunca:

- modificar ciclos;
- calcular estados;
- persistir información.

---

## Verificación

La Cubrición únicamente podrá continuar cuando todas las reglas de elegibilidad sean válidas.

# Bloque 4 - ReproductiveCycleRules

## Objetivo

Implementar las reglas responsables de interpretar el ciclo reproductivo.

Su misión consiste en determinar cómo afecta el nuevo evento a la narrativa biológica del animal.

---

## Responsabilidades

Inicialmente deberá permitir:

- detectar si existe un ciclo abierto;
- reutilizar el ciclo existente cuando corresponda;
- crear un nuevo ciclo cuando sea necesario;
- asociar correctamente el evento al ciclo.

---

## Restricciones

Nunca:

- proyectar estados;
- calcular fechas previstas;
- construir snapshots;
- persistir información.

Su responsabilidad termina cuando el dominio ya conoce el ciclo reproductivo al que pertenece el evento.

---

## Verificación

Una Cubrición debe quedar correctamente asociada al ciclo reproductivo correspondiente.

---

# Bloque 5 - ReproductiveProjection

## Objetivo

Construir el snapshot reproductivo persistido.

La proyección constituye la última fase de interpretación del dominio antes de la persistencia.

---

## Responsabilidades

Construir una proyección reutilizable que inicialmente contenga:

```text
estado_reproductivo

ciclo_reproductivo_activo

fecha_prevista_parto

dias_restantes
```

---

## Restricciones

Nunca:

- modificar eventos;
- interpretar reglas biológicas;
- acceder a infraestructura.

La proyección únicamente transforma el resultado del dominio en información observable.

---

## Regla general

Toda nueva propiedad añadida a la proyección deberá cumplir simultáneamente las siguientes condiciones:

- ser completamente derivable;
- aportar valor para lectura;
- pertenecer al estado observable del animal.

En caso contrario no deberá persistirse.

---

## Verificación

Tras registrar una Cubrición el snapshot reproductivo debe reflejar correctamente el nuevo estado derivado.

---

# Bloque 6 - Registrar Cubrición

## Objetivo

Implementar el primer caso de uso que valide el nuevo patrón arquitectónico.

---

## Flujo esperado

```text
Construir contexto

↓

Validar elegibilidad

↓

Interpretar ciclo

↓

Construir proyección

↓

Persistir mediante RPC
```

---

## Responsabilidades

El caso de uso debe limitarse a:

- obtener la información necesaria;
- construir el contexto;
- coordinar la ejecución del dominio;
- solicitar la persistencia;
- devolver el resultado.

---

## Restricciones

Nunca:

- interpretar reglas reproductivas;
- calcular estados;
- decidir sobre el ciclo;
- construir snapshots.

Toda esa lógica pertenece al dominio implementado mediante el patrón Context → Rules → Projection.

---

## Resultado esperado

La Cubrición deberá convertirse en el primer evento capaz de recorrer completamente el nuevo dominio reproductivo.

---

# Bloque 7 - UI

## Objetivo

Integrar el registro de Cubrición reutilizando la infraestructura existente.

---

## Crear

```text
FormCubricion
```

como una nueva acción disponible desde la ficha del animal.

---

## UX

```text
Ficha

↓

Registrar evento

↓

Cubrición

↓

Formulario

↓

Guardar

↓

Ficha actualizada
```

---

## Campos iniciales

Como mínimo:

- fecha de cubrición;
- tipo de cubrición (natural o inseminación);
- macho (cuando aplique);
- observaciones (opcional).

---

## Restricciones

No crear:

- nuevas rutas;
- asistentes;
- pantallas específicas;
- flujos paralelos.

La Cubrición debe comportarse igual que el resto de acciones del sistema.

---

# Criterios de aceptación

## Arquitectura

```text
El dominio reproductivo implementa correctamente el patrón Context → Rules → Projection.
```

---

## Contexto

```text
Todo evento reproductivo construye previamente un ReproductiveContext.
```

---

## Elegibilidad

```text
Una Cubrición no válida es rechazada antes de interpretar el dominio.
```

---

## Ciclo

```text
La Cubrición queda correctamente asociada al ciclo reproductivo correspondiente.
```

---

## Snapshot

```text
El snapshot reproductivo refleja automáticamente:

- estado reproductivo;
- ciclo activo;
- fecha prevista de parto;
- días restantes.
```

---

## Persistencia

```text
Toda la operación se ejecuta mediante la estrategia transaccional consolidada en PRD006.
```

---

## UI

```text
La Cubrición puede registrarse desde la ficha del animal sin crear nuevas pantallas.
```

---

# Riesgos a evitar

- mezclar contexto y proyección;
- introducir reglas reproductivas en el Use Case;
- convertir ReproductiveContext en un servicio;
- proyectar estados desde el frontend;
- persistir información derivable;
- duplicar reglas entre componentes;
- crear excepciones específicas para la Cubrición;
- romper el patrón definido en PRD007.

---

# Entregables esperados

- Primera implementación del patrón Context → Rules → Projection en el dominio reproductivo;
- ReproductiveContext;
- ReproductiveEligibilityRules;
- ReproductiveCycleRules;
- ReproductiveProjection;
- registrarCubricion;
- FormCubricion;
- snapshot reproductivo operativo;
- apertura o reutilización automática del ciclo;
- cálculo de fecha prevista de parto;
- cálculo de días restantes;
- arquitectura preparada para los siguientes eventos reproductivos.

---

# Dependencias para la siguiente fase

Al finalizar PRD007 deberá existir una infraestructura capaz de soportar nuevos eventos reproductivos sin modificar la arquitectura.

Las siguientes fases únicamente deberán ampliar el conocimiento del dominio mediante nuevas reglas y proyecciones, reutilizando íntegramente el patrón validado en esta fase.

