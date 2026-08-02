# Patrón RPC transaccional

# Introducción

El proyecto adopta una arquitectura **Event First**.

En este modelo, una operación de negocio no consiste simplemente en insertar o modificar un registro, sino en registrar un hecho del dominio y mantener sincronizadas todas las estructuras que derivan de él.

Como consecuencia, una única operación rara vez modifica una sola tabla. Habitualmente debe actualizar varias estructuras que representan responsabilidades diferentes:

- eventos (fuente de verdad);
- relaciones entre entidades;
- snapshots derivados.

Todas ellas forman parte de una única operación lógica y deben evolucionar de forma coherente.

Esta necesidad convierte la atomicidad en un requisito arquitectónico, no únicamente técnico.

El patrón **RPC transaccional** garantiza que toda la operación se ejecute como una única unidad indivisible, evitando estados intermedios e inconsistencias en la persistencia.

---

## Por qué RPC y no inserciones secuenciales

Las operaciones de escritura del dominio ganadero tocan varias tablas en un mismo flujo:

```
eventos
evento_animales
animal (INSERT o UPDATE)
```

Con inserciones secuenciales desde el cliente JS, un fallo en el paso 2 o 3 deja registros huérfanos imposibles de detectar automáticamente. La atomicidad solo puede garantizarse en el servidor Postgres mediante una función que ejecute todas las operaciones dentro de una única transacción.

# Principio arquitectónico: 

toda operación que 

- cree eventos
- cree entidades derivadas 
- o modifique snapshots derivados 

debe ejecutarse mediante RPC transaccional.

---

# Por qué aparece este patrón

En las primeras fases del proyecto, una operación de escritura podía limitarse a insertar o modificar un único registro.

Por ejemplo, una operación sencilla podría consistir únicamente en crear un animal o actualizar un dato concreto.

Sin embargo, la evolución del modelo hacia una arquitectura **Event First** cambia completamente esta situación.

Una única operación de negocio pasa a generar varias consecuencias inseparables:

- registrar un evento como fuente de verdad;
- mantener las relaciones necesarias para la trazabilidad;
- actualizar los snapshots derivados que optimizan la lectura.

Estas operaciones ya no pueden ejecutarse de forma independiente.

Todas representan una única intención de negocio y deben persistirse conjuntamente.

En este momento aparece el patrón **RPC transaccional**, cuya responsabilidad consiste en garantizar que toda la operación se complete o no se complete en absoluto.

---

# Una intención, una transacción

El usuario realiza una única acción sobre el dominio.

Esa acción puede implicar múltiples operaciones internas sobre la base de datos, pero todas ellas representan una única intención de negocio.

Por este motivo, la persistencia también debe comportarse como una única operación indivisible.

No importa cuántas tablas intervengan.

Lo importante es que ninguna pueda quedar actualizada de forma parcial.

La unidad de trabajo del dominio debe coincidir con la unidad de trabajo de la persistencia.

Este principio puede resumirse de la siguiente manera:

> **Una intención de negocio debe ejecutarse mediante una única transacción.**

---

# Relación con Event First

El patrón RPC transaccional constituye el mecanismo de persistencia natural de la arquitectura **Event First**.

Los eventos continúan siendo la única fuente de verdad del sistema.

El RPC no modifica este principio.

Su responsabilidad consiste únicamente en garantizar que todos los cambios derivados de un mismo evento se persistan de forma atómica.

De forma simplificada, el flujo queda representado así:

Evento

↓

Relaciones

↓

Snapshots

↓

Commit único

El RPC asegura que ninguna de estas operaciones pueda quedar aplicada de forma parcial.

Gracias a ello, los snapshots permanecen sincronizados con los eventos y la trazabilidad del sistema nunca queda incompleta.

---

## Estructura de una función RPC

La estructura concreta puede variar entre dominios, pero el orden lógico de las operaciones debe mantenerse.

```sql
CREATE OR REPLACE FUNCTION registrar_X(
  -- parámetros del dominio
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_evento_id UUID;
  -- otras variables locales
BEGIN
  -- 1. Validación defensiva dentro de la transacción (anti-concurrencia)
  --    FOR UPDATE bloquea la fila: si dos peticiones llegan simultáneamente
  --    para el mismo animal, la segunda verá el estado ya actualizado.
  SELECT ... INTO ... FROM animal WHERE id = p_animal_id FOR UPDATE;
  IF <condición inválida> THEN
    RAISE EXCEPTION 'Mensaje de negocio claro';
  END IF;

  -- 2. Resolver IDs de catálogo con helpers privados
  v_tipo_evento_id := _resolve_tipo_evento_id('SALIDA');
  v_motivo_id      := _resolve_motivo_id(p_motivo);

  -- 3. Insertar el evento (fuente de verdad)
  INSERT INTO eventos (...) VALUES (...) RETURNING id INTO v_evento_id;

  -- 4. Registrar la asociación evento ↔ entidad
  INSERT INTO evento_animales (evento_id, animal_id, rol)
  VALUES (v_evento_id, p_animal_id, 'sujeto');

  -- 5. Actualizar el snapshot derivado (DESPUÉS del evento, nunca antes)
  UPDATE animal SET estado_vital = ... WHERE id = p_animal_id;

  RETURN v_evento_id;
END;
$$;
```

---

## Helpers SQL privados

No existen para ocultar SQL.

Existen para:

- centralizar resolución de catálogos
- eliminar duplicación
- mantener consistencia

Para evitar repetir resolución de IDs de catálogo en cada RPC, se definen funciones privadas reutilizables (prefijo `_`):

```sql
-- Resuelve el id de un tipo_evento por su código de máquina
CREATE OR REPLACE FUNCTION _resolve_tipo_evento_id(p_codigo TEXT)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM tipo_evento WHERE codigo = p_codigo
$$;

-- Resuelve el id de un motivo por su nombre
CREATE OR REPLACE FUNCTION _resolve_motivo_id(p_nombre TEXT)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM motivos_movimiento WHERE nombre = p_nombre
$$;

-- Obtiene la especie de un animal (necesaria para insertar en eventos)
CREATE OR REPLACE FUNCTION _resolve_animal_especie(p_animal_id UUID)
RETURNS especie_enum LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT especie FROM animal WHERE id = p_animal_id
$$;
```

`STABLE` indica que la función no modifica la DB y devuelve el mismo resultado para los mismos parámetros dentro de una misma transacción — permite optimización.

---

## Validación en dos niveles

Las reglas críticas de dominio se validan en dos capas:

```
Use Case (TypeScript)
  assertAnimalPuedeSalir(animal)     ← primera línea: falla rápido, sin roundtrip a DB
       ↓
RPC Postgres
  SELECT ... FOR UPDATE              ← segunda línea: cubre condiciones de carrera
  IF estado_vital != 'vivo' THEN RAISE EXCEPTION
```

No hay duplicación de validaciones.

Hay dos responsabilidades distintas:

- Use Case:
    - feedback rápido

- RPC:
    - protección frente a concurrencia

El Use Case valida contra el snapshot en memoria.

El RPC valida dentro de la transacción con el dato real bloqueado.

---

## estado_vital como snapshot derivado

Este comportamiento sigue el principio definido en snapshots.md.

`animal.estado_vital` NO es la fuente de verdad del sistema. Es un campo persistido que el RPC mantiene sincronizado como última operación de cada transacción:

```
Evento SALIDA (INSERT)   ← fuente de verdad
       ↓
evento_animales (INSERT) ← trazabilidad
       ↓
animal.estado_vital (UPDATE) ← snapshot derivado, actualizado en consecuencia
```

Nunca se actualiza `estado_vital` directamente desde la UI ni desde el Use Case.
Solo el RPC lo modifica, y siempre como consecuencia de haber creado el evento.

---

## RPCs por flujo — cuándo compartir y cuándo separar

Un RPC se separa en dos cuando las **operaciones de DB son distintas**.

Mientras las operaciones sean las mismas, un único RPC con parámetros es suficiente:

| Flujo | RPC | Motivo |
|---|---|---|
| compra | `registrar_compra_animal` | Crea animal nuevo — único |
| venta | `registrar_salida_animal` | UPDATE estado, mismo patrón que muerte |
| muerte | `registrar_salida_animal` | Comparte operaciones con venta |
| parto (futuro) | `registrar_parto_animal` | Crea animal cría + actualiza madre — único |

La separación a nivel de **Use Case** sigue la semántica de negocio (venta ≠ muerte), independientemente de si comparten RPC.

Los Use Cases representan semántica.

Los RPC representan implementación.

---

## Llamada desde el repositorio TypeScript

```ts
export async function insertarSalidaAnimal(
  args: { p_animal_id: UUID; p_motivo: string; p_fecha: ISODate }
): Promise<{ eventoId: UUID }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.rpc('registrar_salida_animal', args)
  if (error) throw error
  return { eventoId: data }
}
```

El repositorio no resuelve IDs de catálogo ni calcula estados derivados — toda esa lógica vive en el RPC. El repositorio es un delegador fino.

---

## Flujos que usarán este patrón

Aplica a cualquier operación que combine evento + entidad + snapshot:

- Compra de animal (`registrar_compra_animal`) 
- Salida por venta o muerte (`registrar_salida_animal`) 
- Parto (`registrar_parto_animal`) 
- Cubrición (`registrar_cubricion`) 
- Destete (`registrar_destete`) 
- Evento sanitario (`registrar_evento_sanitario`) 

---

# Conclusión

El patrón **RPC transaccional** define la estrategia de escritura utilizada por todo el proyecto.

No constituye una decisión tecnológica específica de Supabase o PostgreSQL.

Representa una decisión arquitectónica cuyo objetivo es preservar la coherencia del modelo basado en eventos.

Toda operación que cree eventos, genere entidades derivadas o actualice snapshots deberá ejecutarse mediante una única transacción.

De esta forma, la persistencia refleja siempre una realidad completa y consistente, evitando estados intermedios y manteniendo sincronizados los eventos, las relaciones y las proyecciones derivadas.
