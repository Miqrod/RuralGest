// Punto de entrada raíz — aquí irá el login en el futuro.
// Por ahora redirige a /home.
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/home')
}
