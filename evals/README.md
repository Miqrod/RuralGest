# Evals — Tests de dominio puro

Los evals verifican las **reglas de negocio del dominio** sin acceso a la base de datos.
Son funciones puras: reciben un input, producen un output, no tienen efectos secundarios.

Se ejecutan con [Vitest](https://vitest.dev/) en menos de 1 segundo.

---

## Cómo ejecutar

```bash
npm run evals            # ejecuta todos los evals
npm run evals -- --watch # modo watch: re-ejecuta al guardar
```

---

## Cuándo ejecutar

**Hoy**: solo manualmente.

**Recomendación**: añadir un hook pre-commit con [husky](https://typicode.github.io/husky/).
Los evals tardan ~1s, por lo que no añaden fricción perceptible al flujo de trabajo.

### Setup (una sola vez)

```bash
npm install --save-dev husky
npx husky init
echo "npm run evals" > .husky/pre-commit
git add .husky/pre-commit package.json
```

A partir de ahí, `git commit` lanzará los evals automáticamente antes de crear el commit.
Si algún eval falla, el commit se cancela hasta que se corrija el problema.

> **Importante**: `git commit --no-verify` salta los hooks. Para protección definitiva,
> añadir `npm run evals` como paso obligatorio en el CI (GitHub Actions) ya que ese gate
> no puede bypasearse con un flag local.

---

## Archivos activos

| Archivo | Módulo | Qué protege |
|---------|--------|-------------|
| `compra-animal.eval.ts` | `ganadero/animales` | Fecha de nacimiento obligatoria al comprar + traducción correcta de campos al RPC |
| `salida-animal.eval.ts` | `ganadero/animales` | Solo animales vivos pueden salir + venta y muerte producen el motivo RPC correcto |
| `identificacion-animal.eval.ts` | `ganadero/animales` | Coherencia is_reproductora↔estado_reproductivo + criterios de identificación (crotal, sexo) |
| `confirmacion-gestacion.eval.ts` | `ganadero/reproductivo` | Transiciones, elegibilidad, decisión de ciclo y proyección de fecha de parto para CONFIRMACION_GESTACION |
| `transiciones-reproductivas.eval.ts` | `ganadero/reproductivo` | Todos los eventos (CUBRICION, PARTO, DESTETE, ABORTO): transiciones válidas e inválidas, evalCycleRules, buildSnapshot |
| `destete-vacuno.eval.ts` | `ganadero/reproductivo` | Elegibilidad de destete (canWean), mensajes de bloqueo y cuándo cerrar el ciclo (PRD010) |
| `ventas.eval.ts` | `financiero/ventas` | Una venta debe tener líneas; cada línea debe referenciar su sujeto y tener cantidad positiva |
| `transacciones.eval.ts` | `financiero/transacciones` | Coherencia origen↔referencia (prevision→venta_id, factura→factura_id) + importe no negativo |
| `eventos-ganadero.eval.ts` | `ganadero/eventos` | Inmutabilidad de eventos + tipo activo + motivo requerido cuando corresponde |
| `lotes.eval.ts` | `ganadero/lotes` | Stock no negativo + solo lotes activos participan en movimientos |

**Resumen de cobertura**: 130 tests activos, todos pasan.

---

## Archivos placeholder (pendientes de implementar)

Estos archivos existen como marcador para saber qué falta, pero sus tests están en `.todo`
porque el módulo al que apuntan aún no está implementado.

| Archivo | Cuándo activar |
|---------|----------------|
| `stock.eval.ts` | Al implementar el módulo de movimientos de lote (`crearMovimiento`) |
| `destete.eval.ts` | Al implementar el destete de cerda porcina (`destetarCerda`) |

---

## Qué NO cubren los evals

Los evals son la primera capa de una estrategia de tests de tres capas:

```
Evals (esta carpeta)      — reglas de dominio puras, sin DB, sin red
Integration tests (futuro) — RPCs + Supabase local (Docker), sin UI
E2E tests (futuro)         — flujos completos en navegador con Playwright
```

Los evals **no pueden verificar**:
- Que el RPC de Supabase ejecuta correctamente la transacción
- Que la migración SQL mantiene la integridad referencial
- Que la UI guía al usuario por el flujo correcto
- Condiciones de carrera entre usuarios concurrentes

El plan de integration tests está documentado en `documentacion/pending_documentation.md`.

---

## Cómo añadir un eval nuevo

1. Crear `evals/<nombre>.eval.ts`
2. Importar solo funciones puras del módulo de dominio (`domain/rules`, `domain/rules/*`, `infrastructure/mapper`)
3. Nunca importar desde `application/` ni desde `ui/` — esas capas acceden a la BD o al DOM
4. Añadir una entrada en la tabla de este README
5. Ejecutar `npm run evals` para confirmar que todo pasa
