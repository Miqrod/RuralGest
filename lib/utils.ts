import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// clsx — une nombres de clase de forma condicional
// twMerge — resuelve conflictos entre clases de Tailwind
// En resumidas cuentas, clsx une y filtra, y twMerge resuelve conflictos. Juntos hacen que los className condicionales funcionen de forma predecible.

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
