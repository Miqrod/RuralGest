# Flujo: salida de animal (venta / muerte)

## Qué es una salida

Un animal sale de la explotación por dos motivos posibles:
- **Venta** — el animal se transfiere a un tercero
- **Muerte** — el animal fallece en la explotación

Ambos motivos comparten el mismo flujo de ejecución y el mismo RPC transaccional.
La distinción semántica se preserva a nivel de Use Case y de evento.

---

## Precondición

El animal debe tener `estado_vital = 'vivo'`.
Un animal vendido o muerto no puede salir de nuevo.

---

## Pasos del flujo

```
Usuario (UI)
  1. Abre panel "Acciones" en la ficha del animal
  2. Pulsa "Registrar salida"
  3. Selecciona motivo (venta / muerte)
  4. Selecciona fecha
  5. Pulsa "Continuar" → se valida el formulario (Zod)
  6. Se abre AlertDialog de confirmación → el usuario confirma

Server Action (app/(main)/vacuno/animales/[id]/actions.ts)
  7. submitVentaAnimal(animalId, fecha) ó submitMuerteAnimal(animalId, fecha)

Use Case (application/actions/registrarVentaAnimal.ts ó registrarMuerteAnimal.ts)
  8. Carga el animal con getAnimalById(id)
  9. Valida con assertAnimalPuedeSalir(animal)  ← primera línea de defensa
 10. Llama a insertarVentaAnimal / insertarMuerteAnimal

Repositorio (infrastructure/repository.ts)
 11. Llama a supabase.rpc('registrar_salida_animal', { p_animal_id, p_motivo, p_fecha })

RPC Postgres (migrations/20260618000001_rpcs_transaccionales.sql)
 12. SELECT especie, crotal, estado_vital FROM animal WHERE id = p_animal_id FOR UPDATE
 13. Valida estado_vital = 'vivo'              ← segunda línea de defensa (anti-concurrencia)
 14. Resuelve tipo_evento_id con _resolve_tipo_evento_id('SALIDA')
 15. Resuelve motivo_id con _resolve_motivo_id(p_motivo)
 16. INSERT INTO eventos → v_evento_id
 17. INSERT INTO evento_animales (evento_id, animal_id, rol='sujeto')
 18. UPDATE animal SET estado_vital = <nuevo_estado> WHERE id = p_animal_id
 19. RETURN v_evento_id
     → toda la operación ocurre dentro de una única transacción

UI
 20. revalidatePath('/vacuno/animales/[id]')
 21. router.refresh() → la ficha se recarga con el nuevo estado
 22. SeccionAcciones desaparece (estadoVital !== 'vivo')
```

---

## Determinación del nuevo estado

| motivo  | nuevo estado_vital |
|---------|-------------------|
| `venta` | `vendido`         |
| `muerte`| `muerto`          |

---

## Invariantes protegidos

| Invariante | Dónde se protege |
|---|---|
| Animal debe estar vivo | Use Case + RPC (FOR UPDATE) |
| Evento siempre antes que el UPDATE de estado | Orden explícito dentro del RPC |
| Trazabilidad evento → animal | INSERT en evento_animales dentro del mismo RPC |
| Inmutabilidad del histórico | estado_vital solo se actualiza via RPC, nunca desde UI |
| Concurrencia | FOR UPDATE bloquea la fila; dos peticiones simultáneas se serializan |

---

## Archivos implicados

```
supabase/migrations/20260618000001_rpcs_transaccionales.sql   ← RPC
modules/ganadero/animales/domain/types.ts                     ← RegistrarVentaAnimalInput, RegistrarMuerteAnimalInput
modules/ganadero/animales/domain/rules.ts                     ← assertAnimalPuedeSalir
modules/ganadero/animales/infrastructure/mapper.ts             ← mapVentaInputToRpcArgs, mapMuerteInputToRpcArgs
modules/ganadero/animales/infrastructure/repository.ts        ← insertarVentaAnimal, insertarMuerteAnimal
modules/ganadero/animales/application/actions/registrarVentaAnimal.ts
modules/ganadero/animales/application/actions/registrarMuerteAnimal.ts
app/(main)/vacuno/animales/[id]/actions.ts                    ← Server Actions
modules/ganadero/animales/ui/salida/FormSalidaAnimal.tsx      ← formulario con disclosure progresivo
modules/ganadero/animales/ui/ficha/SeccionAcciones.tsx        ← panel accordion
```

---

## Cómo añadir un nuevo motivo de salida en el futuro

1. Añadir el valor en `motivos_movimiento` (migración SQL)
2. Añadir el valor en el schema Zod de `FormSalidaAnimal`
3. Añadir el nuevo `FECHA_LABEL` en el formulario
4. Crear `RegistrarXAnimalInput` en `domain/types.ts`
5. Crear `registrarXAnimal.ts` use case
6. Crear `submitXAnimal` server action
7. El RPC `registrar_salida_animal` ya soporta cualquier motivo por nombre — no necesita cambios
8. Regenerar tipos: `supabase gen types typescript --local > types/supabase.ts`
