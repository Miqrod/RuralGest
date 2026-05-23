import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { User } from '@supabase/supabase-js'

// Para usar en Server Components, Server Actions y Route Handlers
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // En Server Components las cookies son de solo lectura.
            // El error es esperado y seguro de ignorar aquí.
          }
        },
      },
    },
  )
}

// Devuelve el usuario autenticado o lanza si no hay sesión.
// Usar en Server Components y Actions que requieren auth.
export async function getUser(): Promise<User> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('No autenticado')
  return user
}
