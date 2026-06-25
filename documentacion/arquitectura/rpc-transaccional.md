# Patrón RPC transaccional

## Por qué RPC y no inserciones secuenciales

Las operaciones de escritura del dominio ganadero tocan varias tablas en un mismo flujo:

```
eventos
evento_animales
animal (INSERT o UPDATE)
```

Con inserciones secuenciales desde el cliente JS, un fallo en el paso 2 o 3 deja
registros huérfanos imposibles de detectar automáticamente. La atomicidad solo puede
garantizarse en el servidor Postgres mediante una función que ejecute todas las
operaciones dentro de una única transacción.

**Regla arquitectónica:** toda operación que cree eventos, cree entidades derivadas
o modifique snapshots derivados debe ejecutarse mediante RPC transaccional.

---

## Estructura de una función RPC

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

Para evitar repetir resolución de IDs de catálogo en cada RPC, se definen
funciones privadas reutilizables (prefijo `_`):

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

`STABLE` indica que la función no modifica la DB y devuelve el mismo resultado
para los mismos parámetros dentro de una misma transacción — permite optimización.

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

El Use Case valida contra el snapshot en memoria.
El RPC valida dentro de la transacción con el dato real bloqueado.

---

## estado_vital como snapshot derivado

`animal.estado_vital` NO es la fuente de verdad del sistema. Es un campo persistido
que el RPC mantiene sincronizado como última operación de cada transacción:

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

La separación a nivel de **Use Case** sigue la semántica de negocio (venta ≠ muerte),
independientemente de si comparten RPC.

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

El repositorio no resuelve IDs de catálogo ni calcula estados derivados —
toda esa lógica vive en el RPC. El repositorio es un delegador fino.

---

## Flujos que usarán este patrón

Aplica a cualquier operación que combine evento + entidad + snapshot:

- Compra de animal (`registrar_compra_animal`) ← PRD006
- Salida por venta o muerte (`registrar_salida_animal`) ← PRD006
- Parto (`registrar_parto_animal`) ← futuro
- Cubrición (`registrar_cubricion`) ← futuro
- Destete (`registrar_destete`) ← futuro
- Evento sanitario (`registrar_evento_sanitario`) ← futuro
