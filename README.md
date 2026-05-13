# Hermanos Rodríguez

Aplicación de gestión ganadera para explotaciones con vacuno y porcino. Permite registrar animales, eventos, ventas y facturas con trazabilidad completa de ganadero a financiero.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 + CSS variables |
| Componentes UI | shadcn/ui con @base-ui/react |
| Formularios | react-hook-form + zod |
| Tablas | TanStack Table v8 |
| Base de datos | Supabase (pendiente de conectar) |

## Arrancar el proyecto

```bash
npm install
npm run dev       # http://localhost:3000
```

## Scripts disponibles

```bash
npm run dev          # desarrollo con Turbopack
npm run build        # build de producción
npm run lint         # ESLint
npm run format       # Prettier
npm run test         # tests con Vitest
npm run check        # lint + test + evals
```

## Estructura de carpetas

```
app/                  # Rutas Next.js App Router
  (main)/             # Grupo de rutas con layout principal
    home/
    vacuno/
    porcino/
    finanzas/
    ...
components/
  layout/             # AppLayout, Sidebar, Header, Footer, PageContainer
  data-table/         # DataTable genérico con TanStack Table
  ui/                 # Componentes base (shadcn): Button, Input, Field, Table...
hooks/                # useDataTable, useTheme
lib/                  # navigation, format, utils, config
providers/            # SidebarProvider
styles/               # globals.css (Tailwind v4 + CSS variables)
types/                # navigation.ts
documentacion/        # Documentación interna del proyecto
```

## Documentación

→ [`documentacion/`](./documentacion/README.md) — arquitectura, modelo de datos, flujos, decisiones técnicas y componentes.
