import { describe, it } from 'vitest'
describe('EVAL: Destete de cerda', () => { it.todo('pendiente de implementar destetarCerda') })

// EVAL PENDIENTE: Destete de cerda
//
// Este eval define los casos de prueba para el flujo de destete.
// Está comentado porque el use case `destetarCerda` no está implementado aún.
//
// Cuándo activar: al implementar el módulo de destete (porcino).
// Módulo esperado: application/use-cases/destetar.ts (o equivalente en la arquitectura de módulos)
// Ver también: documentacion/flujos/destete.md (cuando se cree)
//
// Casos de prueba a restaurar:
//
// import { describe, it, expect } from 'vitest'
// import { destetarCerda } from '@/application/use-cases/destetar'
//
// describe('EVAL: Destete completo', () => {
//
//   it('flujo correcto', async () => {
//     const input = {
//       madreId: '1',
//       loteId: 'camada-1',
//       cantidad: 10
//     }
//     const result = await destetarCerda(input)
//     expect(result.success).toBe(true)
//     expect(result.eventos.length).toBeGreaterThan(0)   // debe generar al menos un evento
//     expect(result.estadoFinal).toBe('VACIA')           // la madre pasa a estado VACIA tras el destete
//   })
//
//   it('bloquea destete inválido', async () => {
//     // No se puede destetar si la madre está GESTANTE (no LACTANTE)
//     const input = {
//       madreId: '1',
//       loteId: 'camada-1',
//       cantidad: 10,
//       estadoActual: 'GESTANTE'
//     }
//     await expect(destetarCerda(input)).rejects.toThrow()
//   })
//
// })
