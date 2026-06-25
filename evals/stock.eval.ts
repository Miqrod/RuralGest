import { describe, it } from 'vitest'
describe('EVAL: Movimiento de stock', () => { it.todo('pendiente de implementar crearMovimiento') })

// EVAL PENDIENTE: Movimiento de stock entre lotes
//
// Este eval define los casos de prueba para el flujo de movimiento de animales entre lotes.
// Está comentado porque el use case `crearMovimiento` no está implementado aún.
//
// Cuándo activar: al implementar el módulo de movimientos de lote.
// Módulo esperado: application/use-cases/movimiento.ts (o equivalente en la arquitectura de módulos)
// Ver también: documentacion/flujos/movimiento-lote.md (cuando se cree)
//
// Invariante clave a preservar: el stock no puede quedar negativo en el lote origen.
// El use case debe validar que `cantidad <= stock disponible en loteOrigen` antes de ejecutar.
//
// Casos de prueba a restaurar:
//
// import { describe, it, expect } from 'vitest'
// import { crearMovimiento } from '@/application/use-cases/movimiento'
//
// describe('EVAL: Movimiento de stock', () => {
//
//   it('mantiene coherencia entrada/salida', async () => {
//     const result = await crearMovimiento({
//       origen: 'loteA',
//       destino: 'loteB',
//       cantidad: 5
//     })
//     expect(result.success).toBe(true)
//     // loteA debe tener 5 animales menos, loteB 5 más
//   })
//
//   it('bloquea stock negativo', async () => {
//     // Si se intenta mover más animales de los que hay en el lote origen, debe lanzar
//     await expect(
//       crearMovimiento({
//         origen: 'loteA',
//         destino: 'loteB',
//         cantidad: 999
//       })
//     ).rejects.toThrow()
//   })
//
// })
