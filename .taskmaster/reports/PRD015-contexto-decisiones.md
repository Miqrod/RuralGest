# PRD015 — Contexto y decisiones resueltas

Este documento complementa los tres documentos principales de PRD015:
- `PRD015 — Revisión reproductiva, Machorra y Analítica Reproductiva.md`
- `objetivos_fase15.md`
- `PRD015-Anexo-Modelo-Explotacion-y-Parametrizacion.md`

Recoge todas las decisiones técnicas y de diseño resueltas antes de la planificación de tareas.
Las decisiones aquí documentadas son vinculantes y deben aplicarse sin interpretación alternativa.

---

## 1. Estado del RPC registrar_machorra — COMPLETO, CERO TRABAJO PENDIENTE

El RPC `registrar_machorra` ya implementa todo lo que PRD015 requiere:
- Usa `CURRENT_DATE` (sin fecha de usuario) ✓
- Valida `es_reproductora = true` ✓
- Bloquea el estado `gestante` ✓
- Cierra el ciclo con `resultado = 'machorra'` ✓
- Abre nuevo ciclo en `vacia` ✓
- Actualiza proyección del animal ✓
- Atómico con `FOR UPDATE` ✓

**No hay que modificar el RPC.**

## 2. Estado de getAvailableActions — CORRECTO

`getAvailableActions` en `modules/ganadero/animales/domain/availableActions.ts` ya tiene la condición exacta:
```typescript
if (esReproductora && tieneCicloAbierto && (estadoReproductivo === 'vacia' || estadoReproductivo === 'cubierta')) {
  acciones.add('machorra')
}
```

Lo único que necesita esta función para PRD015 es un nuevo input `diasEnCicloActual` (número)
para que la advertencia de revisión reproductiva pueda calcularse en la capa de dominio.
**No cambia la lógica de disponibilidad de acciones.**

## 3. Modelo multi-explotación — NO EXISTE, NO SE IMPLEMENTA

El sistema es estrictamente single-tenant:
- No hay tabla `explotacion` (se crea en PRD015)
- No hay `explotacion_id` en ninguna tabla de dominio
- Las políticas RLS son `USING (true)` para todos los usuarios autenticados
- **No se añade `explotacion_id` a ninguna tabla en PRD015**
- La entidad `explotacion` es un singleton (una sola fila)

## 4. Tabla explotacion — SINGLETON

Schema decidido:
```sql
CREATE TABLE explotacion (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           TEXT NOT NULL,
  nombre_comercial TEXT NULL,
  email            TEXT NULL,
  telefono         TEXT NULL,
  direccion        TEXT NULL,
  codigo_postal    TEXT NULL,
  municipio        TEXT NULL,
  provincia        TEXT NULL,
  pais             TEXT NULL,
  latitud          DECIMAL NULL,
  longitud         DECIMAL NULL,
  logo_storage_path TEXT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT now(),
  updated_at       TIMESTAMP NOT NULL DEFAULT now()
);
```

**Seed obligatorio en la misma migración:**
```sql
INSERT INTO explotacion (nombre) VALUES ('Hermanos Rodríguez');
```

**Coordenadas**: el mecanismo de selección es el mismo que ya existe para instalaciones —
clic sobre el mapa rellena automáticamente los campos `latitud` y `longitud`.
NO implementar entrada manual de coordenadas; reutilizar el componente de mapa existente.

## 5. Tabla parametrizacion — Schema exacto

```sql
CREATE TYPE categoria_parametrizacion_enum AS ENUM ('REPRODUCTIVO', 'FINANCIERO', 'OPERATIVO');
CREATE TYPE tipo_valor_parametrizacion_enum AS ENUM ('INTEGER', 'DECIMAL', 'BOOLEAN', 'TEXT', 'DATE');
CREATE TYPE unidad_parametrizacion_enum AS ENUM ('DIAS', 'EUROS', 'PORCENTAJE', 'KG', 'UNIDADES');

CREATE TABLE parametrizacion (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  valor       TEXT NOT NULL,
  especie     especie_enum NULL,   -- IMPORTANTE: especie_enum, NO especie_id FK
  categoria   categoria_parametrizacion_enum NOT NULL,
  tipo_valor  tipo_valor_parametrizacion_enum NOT NULL,
  unidad      unidad_parametrizacion_enum NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP NOT NULL DEFAULT now(),
  created_by  UUID NULL,
  updated_by  UUID NULL
);
```

**DECISIÓN CRÍTICA sobre el tipo de la columna especie:**
Se usa `especie especie_enum NULL` (el enum existente), NO `especie_id UUID`.
No existe tabla `especie`. El sistema usa `especie_enum` en todas las tablas.
Esta decisión es definitiva para PRD015. Si en el futuro se crean especies configurables
por el usuario, se migrará todo el modelo simultáneamente en un PRD dedicado.

**Unicidad con NULL — dos índices parciales (no UNIQUE constraint simple):**
```sql
CREATE UNIQUE INDEX uq_param_codigo_especie
  ON parametrizacion(codigo, especie)
  WHERE especie IS NOT NULL;

CREATE UNIQUE INDEX uq_param_codigo_sin_especie
  ON parametrizacion(codigo)
  WHERE especie IS NULL;
```
Razón: en PostgreSQL, `NULL != NULL` en UNIQUE constraints estándar.

**Nombres de auditoría**: usar `created_by`/`updated_by` (consistente con el resto del schema).
NO usar `user_created`/`user_updated`.

**No hay `explotacion_id` en parametrizacion.** Contexto singleton.

**Seed obligatorio — primer parámetro:**
```sql
INSERT INTO parametrizacion (codigo, descripcion, valor, especie, categoria, tipo_valor, unidad)
VALUES (
  'umbral_revision_reproductiva_dias',
  'Días para sugerir revisión reproductiva',
  '240',
  'vacuno',
  'REPRODUCTIVO',
  'INTEGER',
  'DIAS'
);
```

## 6. Consulta de parametrización — SIEMPRE (codigo, especie)

El backend NUNCA consulta por código solo. Siempre:
```typescript
getParametrizacion({ codigo: 'umbral_revision_reproductiva_dias', especie: 'vacuno' })
```

En SQL usar `IS NOT DISTINCT FROM` para manejar NULL:
```sql
WHERE codigo = $1 AND especie IS NOT DISTINCT FROM $2
```

## 7. Índice en eventos para ubicación histórica

Verificar que existe índice `(animal_id, fecha)` sobre la tabla de eventos (o la tabla equivalente
de cambios de ubicación). Si no existe, crearlo en la misma migración de PRD015.
Esto es necesario para que la query de instalación histórica no haga full scans.

## 8. Navegación — WorldId analitica

La sección Analítica va **entre Finanzas e Instalaciones** en el sidebar (nivel principal).
Ruta: `/analitica/reproduccion`

Cambios en Configuración:
- Unhide `{ href: '/configuracion/explotacion', label: 'Datos de la explotación' }`
- Añadir `{ href: '/configuracion/parametrizaciones', label: 'Parametrizaciones' }`
- `sectionLabel: 'GESTIÓN DE LA EXPLOTACIÓN'` en el primer ítem visible de esa sección

## 9. Componente ImageUploadCropper — INCLUIDO EN PRD015

La subida de logo de la explotación requiere un componente reutilizable con:
- Librería: `react-easy-crop`
- Zoom, pan/arrastre, recorte con aspect ratio predefinido
- Aspect ratios: `'square' | 'round' | '16:9' | '4:3'`
- Upload a Supabase Storage bucket `images`
- Props: `aspectRatio`, `storageBucket`, `storagePath`, `currentUrl?`, `onUploadComplete(url)`
- Estados: idle, selecting, cropping, uploading, error
- Componente en `components/ui/image-upload-cropper.tsx`
- Crear bucket `images` en Supabase Storage si no existe, con RLS adecuada

Este componente es reutilizable para futuros casos (fotos de animales, documentos, etc.).

## 10. Página /configuracion/explotacion — DESDE CERO

No existe ningún archivo en `app/(main)/configuracion/explotacion/`.
Hay que crear todo: `page.tsx`, Server Actions, queries.
El punto de menú ya existe en `lib/navigation.ts` pero está `hidden: true` — unhidearlo.

## 11. Regla de revisión reproductiva — umbral ESTRICTO

La condición es `dias_en_ciclo > umbral` (estrictamente mayor, no mayor o igual):
- 239 días con umbral 240 → NO requiere revisión
- 240 días con umbral 240 → NO requiere revisión
- 241 días con umbral 240 → SÍ requiere revisión

El umbral se obtiene de `parametrizacion`, nunca hardcodeado.

## 12. Query getOffspringFollowUp — DOS FASES OBLIGATORIAS

Esta query NO es un filtro simple por fecha. Tiene dos fases:

**Fase 1** — Población de seguimiento:
Crías nacidas vivas cuyos partos tienen `fecha BETWEEN fechaDesde AND fechaHasta`

**Fase 2** — Desenlace SIN LÍMITE DE FECHA:
Para cada cría de la fase 1, buscar en el historial COMPLETO:
- Existe DESTETE → DESTETADA
- Existe muerte antes de destete → MUERTA_ANTES_DESTETE
- Otro cierre del vínculo → OTRO_CIERRE_VINCULO
- Ninguno → PENDIENTE

Una cría nacida en diciembre y destetada en marzo del año siguiente SÍ cuenta como destetada.
El periodo NO limita la búsqueda del desenlace.

Esta query NO acepta `instalacion_id` — es métrica global invariante.

## 13. Atribución histórica de instalación — NO usar ubicacion_actual_id

Para filtrar eventos históricos por instalación:
1. Tomar la fecha del evento
2. Buscar el último `CAMBIO_UBICACION` del animal con `fecha <= fecha_evento`
3. Comparar con la instalación seleccionada
4. **NUNCA usar `animal.ubicacion_actual_id`** para hechos históricos

## 14. Situación actual — INDEPENDIENTE del periodo

`getCurrentReproductiveSituation` no recibe parámetros de fecha.
Representa el estado actual de la explotación.
Cambiar el rango de fechas en la pantalla de analítica NO debe modificar estos valores.
Las dos proyecciones (actual e histórica) se consultan SIEMPRE por separado.

## 15. Categoría categoria_parametrizacion_enum — enum, no TEXT

`categoria` es un enum controlado. Valores iniciales: REPRODUCTIVO, FINANCIERO, OPERATIVO.
No usar TEXT libre.

## 16. Specs y documentación obligatoria antes de implementar

Revisar siempre antes de implementar cualquier tarea:
- `AI_docs/product_spec.md`
- `AI_docs/backend_spec.md`
- `AI_docs/frontend_spec.md`
- `AI_docs/frontend_patterns.md`
- `documentacion/base_conocimiento/modelo/modelo_reproductivo.md`
- `documentacion/base_conocimiento/arquitectura/patterns/context-rules-projection-pattern.md`
- `documentacion/base_conocimiento/arquitectura/patterns/rpc-transaccional.md`
