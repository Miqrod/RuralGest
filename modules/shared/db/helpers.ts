import type { Database } from './database.types'

// Acceso directo a los tipos de persistencia del schema public.
// Usar solo en infrastructure/ — nunca en domain/ ni application/.

export type DbRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type DbInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type DbUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type DbEnum<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
