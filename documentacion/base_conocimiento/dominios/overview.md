# Dominios

## Introducción

Un dominio define el conocimiento de negocio que el sistema debe comprender, proteger y hacer evolucionar.

Mientras que los principios definen las reglas arquitectónicas generales y los patrones proporcionan soluciones reutilizables, los dominios encapsulan el conocimiento específico de cada área funcional de la aplicación.

Cada dominio es responsable de modelar un conjunto coherente de conceptos, reglas de negocio y comportamientos relacionados entre sí, manteniendo una separación clara respecto al resto del sistema.

Su objetivo no es describir cómo se implementa una funcionalidad concreta, sino definir el conocimiento que el sistema debe preservar y hacer evolucionar.

Esta carpeta describe el conocimiento del negocio. La representación de dicho conocimiento mediante entidades, relaciones y estructuras de datos se documenta en la carpeta modelo/.

---

## Relación con la arquitectura

Los dominios se construyen sobre los principios y patrones definidos por la arquitectura.

En particular:

- Los **principios** establecen las reglas universales que todos los dominios deben respetar (por ejemplo, *Event First*).
- Los **patrones** proporcionan mecanismos reutilizables para implementar dicho conocimiento (por ejemplo, *Context → Rules → Projection* o *RPC Transaccional*).
- Los **dominios** aportan las reglas de negocio específicas de cada área funcional.

Cada nivel responde a una pregunta distinta:

| Nivel | Pregunta que responde |
|--------|-----------------------|
| Principios | ¿Qué normas gobiernan toda la arquitectura? |
| Patrones | ¿Cómo resolvemos problemas arquitectónicos recurrentes? |
| Dominios | ¿Qué conocimiento del negocio debe comprender el sistema? |

---

## Organización de los dominios

Cada documento de esta carpeta representa un dominio independiente.

Un dominio puede definir:

- sus conceptos principales;
- las entidades sobre las que opera;
- las reglas de negocio que le pertenecen;
- su relación con otros dominios;
- los patrones arquitectónicos que utiliza cuando resulta necesario.

Los dominios no describen casos de uso concretos ni detalles de implementación técnica. Su responsabilidad consiste en definir el conocimiento permanente del negocio.

---

## Jerarquía de dominios

## Jerarquía de los dominios

Aunque todos los dominios encapsulan conocimiento específico del negocio, no todos desempeñan el mismo papel dentro del sistema.

La arquitectura distingue entre un dominio central (Core Domain) y varios dominios especializados que amplían sus capacidades.

                  Ganadero
                 (Core Domain)
                         │
     ┌──────────┬────────┼─────────┐
     │          │        │         │
Reproductivo  Financiero Sanitario Operacional

El dominio ganadero constituye el núcleo funcional de la aplicación. Es el responsable de representar la realidad física de la explotación (animales, lotes, eventos, movimientos, estados, etc.) y actúa como base sobre la que se construyen el resto de dominios.

---

## Dominios actuales

Actualmente la aplicación se organiza en los siguientes dominios:

| Dominio          | Rol                   | Estado        | Descripción                                                                                                                                                                                                    |
| ---------------- | --------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ganadero**     | **Core Domain**       | En desarrollo | Núcleo del modelo de explotación ganadera. Representa la realidad física de la explotación (animales, lotes, eventos, movimientos y estados) y constituye la base sobre la que se apoyan el resto de dominios. |
| **Reproductivo** | Dominio especializado | Activo        | Gestiona el ciclo reproductivo y las reglas biológicas asociadas, utilizando los conceptos definidos por el dominio ganadero.                                                                                  |
| **Financiero**   | Dominio especializado | Placeholder   | Gestiona el impacto económico derivado de la actividad de la explotación, conectando los eventos ganaderos con las operaciones comerciales y financieras.                                                      |
| **Operacional**  | Dominio especializado | Placeholder   | Gestiona la organización, planificación y ejecución de las actividades operativas de la explotación, apoyándose en la información del dominio ganadero.                                                        |
| **Sanitario**    | Dominio especializado | Placeholder   | Gestiona el estado sanitario, tratamientos, diagnósticos y seguimiento clínico de animales y lotes, complementando la información del dominio ganadero.                                                        |


La definición de cada dominio evolucionará conforme aumente el conocimiento funcional del sistema.

Ningún dominio especializado redefine conceptos pertenecientes al dominio ganadero (es decir, el dominio reproductivo, financiero... NO tiene animales, trabaja sobre animales).


---

## Independencia y colaboración

Los dominios deben mantenerse lo más independientes posible.

Cada uno es propietario de su propio conocimiento y evita incorporar reglas que pertenezcan a otro dominio.

Cuando un dominio necesita utilizar información de otro, debe hacerlo respetando sus responsabilidades y sin duplicar lógica de negocio.

Esta separación favorece la evolución independiente de cada área funcional, mejora la mantenibilidad del sistema y facilita la incorporación de nuevos dominios en el futuro.