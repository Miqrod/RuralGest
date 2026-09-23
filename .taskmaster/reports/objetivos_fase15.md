# Objetivos Fase 15 — Revisión reproductiva, Machorra y Analítica Reproductiva

## 1. Objetivo general

Implementar una primera versión completa, sencilla y auditable de la revisión reproductiva y de la analítica reproductiva del ganado vacuno.

La fase debe:

* detectar reproductoras que requieren revisión;
* integrar correctamente la acción Machorra con el ciclo reproductivo existente;
* crear la primera sección de Analítica de la aplicación;
* diferenciar claramente situación actual y actividad histórica;
* permitir consultar actividad mediante un periodo temporal configurable;
* permitir filtrar los acontecimientos históricos por instalación;
* proporcionar seguimiento de las crías nacidas durante el periodo hasta su destete;
* evitar atribuciones artificiales cuando una métrica no pueda relacionarse inequívocamente con una dimensión.

La implementación debe respetar la arquitectura Event First, mantener las reglas de negocio en backend y proporcionar una experiencia User First.

---

## 2. Contexto y documentación obligatoria

Antes de comenzar las tareas revisar:

### Specs

* `AI_docs/product_spec.md`
* `AI_docs/backend_spec.md`
* `AI_docs/frontend_spec.md`
* `AI_docs/frontend_patterns.md`

### Modelo

* `documentacion/base_conocimiento/modelo/modelo_ganadero.md`
* `documentacion/base_conocimiento/modelo/modelo_reproductivo.md`

### Arquitectura

* `documentacion/base_conocimiento/arquitectura/overview.md`
* `documentacion/base_conocimiento/dominios/reproductivo.md`
* `documentacion/base_conocimiento/arquitectura/patterns/context-rules-projection-pattern.md`
* `documentacion/base_conocimiento/arquitectura/patterns/action-usecase-event.md`
* `documentacion/base_conocimiento/arquitectura/patterns/rpc-transaccional.md`

### Flujos reproductivos

* Cubrición
* Confirmación de Gestación
* Parto
* Destete
* Aborto
* Machorra

### Instalaciones

* PRD014
* documentación permanente de instalaciones y `CAMBIO_UBICACION`

### Precedencia

Las decisiones consolidadas en PRD015 prevalecen sobre documentación histórica anterior.

---

# 3. Objetivos funcionales

## Revisión reproductiva

1. Crear un parámetro configurable `umbral_revision_reproductiva_dias`.
2. Establecer inicialmente el valor en 240 días.
3. Detectar reproductoras vivas con ciclo abierto.
4. Limitar la detección a estados `VACÍA` y `CUBIERTA`.
5. Considerar alerta únicamente cuando el ciclo supere el umbral.
6. No generar eventos ni modificar estados.
7. Mostrar animales que requieren revisión en el dashboard.
8. Mostrar la advertencia en la ficha animal.
9. Facilitar desde la ficha la decisión de registrar Machorra cuando corresponda.
10. Hacer que la alerta desaparezca automáticamente cuando deje de cumplirse la condición.

---

## Machorra

11. Mantener `machorra` como resultado de ciclo reproductivo.
12. No crear un contador persistido de machorridades.
13. Permitir la acción desde `VACÍA`.
14. Permitir la acción desde `CUBIERTA`.
15. Impedir la acción desde `GESTANTE`.
16. Utilizar la fecha de ejecución del sistema.
17. No solicitar fecha al usuario.
18. Mantener la operación atómica.
19. Proteger el resultado del ciclo frente a sobrescrituras.
20. Mantener las reglas actuales de apertura/cierre de ciclos.
21. No implementar un sistema genérico de corrección de eventos.

---

# 4. Objetivos de Analítica

22. Crear una nueva sección global:

```text
/analitica
```

23. Crear el módulo inicial:

```text
/analitica/reproduccion
```

24. Mantener Analítica separada del dashboard operativo.
25. Mostrar la situación actual como primer bloque.
26. Mantener la situación actual independiente del periodo.
27. Establecer `Año actual` como periodo inicial.
28. Hacer obligatorio un rango temporal para los datos históricos.
29. Utilizar exclusivamente:

```text
fecha_desde
fecha_hasta
```

como representación real del periodo.
30. Hacer que los presets modifiquen esas fechas.
31. Actualizar los campos visibles inmediatamente al cambiar un preset.
32. Convertir el periodo en `Personalizado` cuando el usuario modifique las fechas manualmente.
33. Utilizar exactamente las fechas visibles como parámetros backend.

---

# 5. Presets temporales

Implementar inicialmente:

* Últimos 30 días;
* Últimos 3 meses;
* Últimos 6 meses;
* Últimos 12 meses;
* Año actual;
* Año anterior;
* Personalizado.

Los presets no deben persistirse como filtros de negocio.

Son solamente atajos de UX.

---

# 6. Dimensiones

34. Aplicar las dimensiones después de establecer el periodo.
35. Implementar inicialmente:

```text
Instalación
```

36. Preparar conceptualmente futuras dimensiones:

* raza;
* edad;
* semental;
* otras dimensiones reproductivas válidas.

37. No implementar todavía filtros de `tipo_productivo` para la analítica reproductiva.
38. No crear una abstracción genérica de filtros antes de necesitarla.

---

# 7. Actividad histórica

39. Implementar métricas basadas directamente en eventos:

* cubriciones;
* confirmaciones de gestación;
* abortos;
* partos.

40. Calcular nacidos a partir de los animales asociados al parto.
41. Separar:

```text
nacidos vivos
nacidos muertos
```

42. Utilizar la fecha del evento como fecha de inclusión en el periodo.
43. No utilizar la ubicación actual para interpretar hechos históricos.

---

# 8. Instalaciones

44. Cuando se filtre por instalación, evaluar la ubicación histórica del animal en la fecha del acontecimiento.

45. Permitir filtrar por instalación:

* cubriciones;
* gestaciones confirmadas;
* abortos;
* partos;
* crías nacidas;
* crías nacidas vivas;
* crías nacidas muertas.

46. Para `PARTO`, utilizar la ubicación histórica de la madre en la fecha del parto.
47. Atribuir las crías del parto al contexto de instalación de su nacimiento para las métricas de nacimiento.
48. No utilizar la ubicación actual de la cría para alterar esta atribución.

---

# 9. Seguimiento de las crías

49. Crear un bloque diferenciado:

> Seguimiento de las crías durante el periodo

50. Seleccionar como población de referencia las crías nacidas vivas de partos pertenecientes al periodo.
51. Seguir cada cría hasta alcanzar un desenlace.
52. Utilizar `DESTETE` como evento natural de finalización del seguimiento.
53. No utilizar ventanas temporales arbitrarias.
54. Permitir que el destete ocurra fuera del rango temporal original.
55. Identificar crías todavía pendientes.
56. Identificar muertes anteriores al destete.
57. Distinguir otros cierres del vínculo de la muerte.
58. Contabilizar las crías destetadas.
59. Mostrar el resultado como información global.

---

# 10. Restricción de instalación para seguimiento

60. No filtrar las métricas de seguimiento por instalación.
61. Mantenerlas invariantes ante cambios de instalación.
62. Explicar al usuario que el motivo es que una cría puede cambiar de instalación durante la lactancia.
63. No atribuir el éxito del seguimiento a la instalación de nacimiento.
64. No atribuirlo a la instalación de destete.

---

# 11. Situación actual

65. Mostrar:

* reproductoras;
* vacías;
* cubiertas;
* gestantes;
* animales que requieren revisión.

66. Calcular estos datos sobre la realidad actual.
67. No modificar sus valores al cambiar el periodo histórico.
68. Mantenerlos visibles mientras se consulta la actividad histórica siempre que el diseño responsive lo permita.

---

# 12. Arquitectura de lectura

69. Crear proyecciones específicas para:

```text
ReproductiveCurrentSituation
ReproductiveHistoricalActivity
ReproductiveOffspringFollowUp
```

70. No reutilizar `AnimalDetail` para la analítica.
71. No exponer modelos de base de datos directamente a la UI.
72. Mantener el flujo:

```text
Page
 ↓
Application Query
 ↓
Repository
 ↓
Supabase
```

73. No permitir acceso directo a Supabase desde componentes visuales.

---

# 13. Backend

74. Centralizar las reglas de negocio.
75. Implementar queries específicas para la analítica.
76. Recibir siempre:

```text
fecha_desde
fecha_hasta
```

77. Recibir `instalacion_id` como filtro opcional.
78. Aplicar la ubicación histórica para hechos pasados.
79. Mantener las consultas libres de efectos secundarios.
80. No crear agregados persistentes innecesarios.

---

# 14. Base de datos

81. No crear tablas de temporadas reproductivas.
82. No crear snapshots anuales de actividad.
83. No crear contadores de machorridades.
84. No crear tablas de cohortes persistentes.
85. Derivar los resultados de los eventos y relaciones existentes.
86. Crear migrations únicamente si una necesidad real de persistencia aparece durante la implementación.
87. Priorizar constraints e índices sobre triggers.

---

# 15. Testing

88. Testear todos los presets.
89. Testear rangos personalizados.
90. Testear sincronización entre fechas visibles y parámetros backend.
91. Testear independencia de situación actual.
92. Testear filtrado histórico por instalación.
93. Testear ubicación histórica en la fecha del evento.
94. Testear parto con crías vivas y muertas.
95. Testear seguimiento hasta destete fuera del periodo.
96. Testear crías pendientes.
97. Testear muerte antes del destete.
98. Testear cambio de instalación durante lactancia.
99. Testear que el seguimiento no cambia con el filtro de instalación.
100. Testear elegibilidad de Machorra.
101. Testear bloqueo de Machorra en `GESTANTE`.
102. Testear umbral de 239/240/241 días.
103. Testear desaparición dinámica de la revisión cuando cambia el estado.
104. Testear concurrencia y doble ejecución de `registrar_machorra`.

---

# 16. Criterios de aceptación globales

La fase estará completada cuando:

* el usuario vea la situación actual al entrar en Analítica;
* pueda seleccionar un periodo mediante presets;
* las fechas visibles representen exactamente el rango consultado;
* pueda editar manualmente el rango;
* pueda filtrar por instalación;
* los eventos históricos respondan correctamente a ambos filtros;
* los datos actuales permanezcan independientes;
* los nacimientos puedan atribuirse correctamente al lugar donde ocurrieron;
* las crías nacidas vivas puedan seguirse hasta destete;
* las crías todavía pendientes sean visibles;
* el seguimiento no se segmente artificialmente por instalación;
* la revisión reproductiva funcione mediante umbral configurable;
* Machorra respete las reglas del ciclo;
* no exista ninguna entidad de temporada reproductiva;
* no se introduzcan agregados persistidos innecesarios;
* la solución siga siendo comprensible y extensible.

---

# 17. Fronteras explícitas

PRD015 deja preparadas las bases para futuras fases, pero no implementa:

```text
Analítica
├── Reproducción       ← PRD015
├── Finanzas           ← futuro
├── Ganadero           ← futuro
└── Operaciones        ← futuro
```

Dentro de Reproducción quedan futuras posibilidades como:

```text
Reproductoras
├── actividad
├── resultados
├── supervivencia
└── evolución

Sementales
└── descendencia
```

No se deben implementar por anticipación.

---

# 18. Principio de diseño de la fase

La implementación debe conservar cuatro reglas:

```text
1. El periodo define qué actividad histórica estudiamos.

2. Los eventos definen qué ocurrió.

3. Las dimensiones solo se aplican cuando explican correctamente
   el acontecimiento.

4. Las crías se siguen hasta su evento natural de cierre:
   DESTETE.
```

Y una quinta regla transversal:

```text
La situación actual siempre representa el presente.
No es una foto histórica.
```

La fase debe priorizar la exactitud semántica de las métricas sobre la cantidad de métricas disponibles.
