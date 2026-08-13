import { describe, it, expect } from 'vitest'

import {
  assertEventoNoEditable,
  assertTipoEventoActivo,
  assertMotivoRequerido,
} from '@/modules/ganadero/eventos/domain/rules'
import type { TipoEvento, MotivoMovimiento } from '@/modules/ganadero/eventos/domain/types'

// =============================================================================
// EVAL: Eventos ganaderos — reglas de integridad del registro de eventos
//
// Los eventos son el mecanismo central de trazabilidad del sistema:
// representan hechos ocurridos con los animales (entradas, salidas, partos...).
//
// Tres invariantes que deben preservarse en todo momento:
//   1. Inmutabilidad: un evento ya registrado no puede modificarse.
//   2. Tipo activo: solo se pueden registrar eventos de tipos marcados como activos.
//   3. Motivo requerido: algunos tipos de evento obligan a informar el motivo
//      (p.ej. SALIDA requiere saber si es por venta o por muerte).
// =============================================================================

// ── Fixtures ─────────────────────────────────────────────────────────────────

const TIPO_EVENTO_ACTIVO: TipoEvento = {
  id:              'uuid-tipo',
  codigo:          'SALIDA',
  descripcion:     'Salida de animal',
  tipo_tecnico:    'movimiento',
  tipo_negocio:    'salida',
  es_biologico:    false,
  requiere_motivo: true,
  afecta_stock:    true,
  afecta_animales: true,
  afecta_lotes:    false,
  activo:          true,
}

const MOTIVO: MotivoMovimiento = {
  id:             'uuid-motivo',
  nombre:         'Venta',
  tipo_base:      'salida',
  descripcion:    null,
  es_monetizable: true,
  tipo_economico: 'ingreso',
  activo:         true,
}

// ── assertEventoNoEditable ────────────────────────────────────────────────────

describe('EVAL: Eventos — assertEventoNoEditable', () => {

  it('siempre lanza con mensaje de inmutabilidad', () => {
    // Los eventos son hechos históricos: representan algo que ocurrió en el mundo real
    // (un parto, una venta, una muerte). Modificarlos reescribiría la historia del animal
    // y rompería la trazabilidad auditada. La función no tiene parámetros: es incondicional.
    expect(() => assertEventoNoEditable()).toThrow(/no se pueden editar/)
  })

})

// ── assertTipoEventoActivo ────────────────────────────────────────────────────

describe('EVAL: Eventos — assertTipoEventoActivo', () => {

  it('tipo activo → no lanza (el evento puede registrarse)', () => {
    // Un TipoEvento activo es aquel que el administrador ha habilitado para su uso.
    // Esta es la comprobación previa a crear el evento en la BD.
    expect(() => assertTipoEventoActivo(TIPO_EVENTO_ACTIVO)).not.toThrow()
  })

  it('tipo inactivo → lanza incluyendo el código del tipo en el mensaje', () => {
    // Un tipo puede desactivarse cuando se deja de usar (p.ej. tipo legado).
    // El mensaje debe incluir el código para que el usuario o el log identifiquen
    // qué tipo específico ha causado el rechazo.
    expect(() => assertTipoEventoActivo({ ...TIPO_EVENTO_ACTIVO, activo: false }))
      .toThrow(/SALIDA/)
  })

})

// ── assertMotivoRequerido ─────────────────────────────────────────────────────

describe('EVAL: Eventos — assertMotivoRequerido', () => {

  it('requiere_motivo=true con motivo informado → válido', () => {
    // El caso correcto: el ganadero ha seleccionado el motivo que corresponde
    // (p.ej. "Venta" para un evento SALIDA). Todo en orden.
    expect(() => assertMotivoRequerido(TIPO_EVENTO_ACTIVO, MOTIVO)).not.toThrow()
  })

  it('requiere_motivo=true sin motivo → lanza', () => {
    // Para eventos como SALIDA el motivo determina si el animal murió o fue vendido,
    // lo cual afecta el estado_vital y el flujo financiero. Sin motivo es imposible
    // procesar el evento correctamente. La validación debe ser explícita.
    expect(() => assertMotivoRequerido(TIPO_EVENTO_ACTIVO, null))
      .toThrow(/requiere un motivo/)
  })

  it('requiere_motivo=false sin motivo → válido (el motivo es opcional para este tipo)', () => {
    // Algunos eventos no tienen un "porqué" obligatorio (p.ej. PARTO o CUBRICION).
    // Cuando el tipo no lo exige, pasar null debe ser aceptado sin restricciones.
    expect(() => assertMotivoRequerido(
      { ...TIPO_EVENTO_ACTIVO, requiere_motivo: false },
      null,
    )).not.toThrow()
  })

})
