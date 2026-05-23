import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Leer .env.local manualmente
const env = readFileSync('.env.local', 'utf8')
const get = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^["']|["']$/g, '')

const url = get('NEXT_PUBLIC_SUPABASE_URL')
const key = get('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if (!url || !key) {
  console.error('❌ Faltan variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local')
  process.exit(1)
}

console.log(`🔌 Conectando a: ${url}`)

const supabase = createClient(url, key)

// getSession es una llamada ligera que no necesita tablas
const { error } = await supabase.auth.getSession()

if (error) {
  console.error('❌ Error de conexión:', error.message)
  process.exit(1)
}

console.log('✅ Conexión con Supabase correcta')
