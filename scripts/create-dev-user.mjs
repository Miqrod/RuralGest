// Script de uso único para crear el usuario de desarrollo local.
// Ejecutar: node scripts/create-dev-user.mjs
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL         = 'http://127.0.0.1:54321'
const SERVICE_ROLE_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data, error } = await supabase.auth.admin.createUser({
  email:         'admin@hermanos.local',
  password:      'dev1234',
  email_confirm: true,
})

if (error) {
  console.error('Error:', error.message)
  process.exit(1)
}

console.log('Usuario creado:')
console.log('  email   :', data.user.email)
console.log('  id      :', data.user.id)
console.log('  password: dev1234')
