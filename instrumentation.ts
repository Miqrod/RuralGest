// Next.js llama a register() una vez al arrancar cada instancia del servidor,
// antes de atender peticiones.

// Zona horaria de la explotación. Debe coincidir con la de la BD
// (migration 20261106000000_timestamptz_y_zona_horaria.sql).
const ZONA_EXPLOTACION = 'Europe/Madrid'

export function register() {
  // Solo el runtime Node.js calcula fechas de negocio ("hoy") con new Date().
  // El runtime Edge no se usa para esa lógica y su zona no es configurable.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  // Solo en producción: en desarrollo el equipo ya está en Madrid y no queremos
  // bloquear a quien trabaje desde otra zona.
  if (process.env.NODE_ENV !== 'production') return

  // Por qué fallar en lugar de avisar: con otra zona, entre la medianoche de Madrid
  // y la del servidor, "hoy" se calcula como el día anterior (revisión reproductiva,
  // edades, días hasta parto, periodos de analítica). Es un error silencioso que solo
  // aparece de madrugada. Impedir el arranque lo convierte en un fallo visible en el
  // momento del despliegue, que se corrige definiendo TZ y redesplegando.
  const zona = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (zona !== ZONA_EXPLOTACION) {
    throw new Error(
      `Zona horaria del servidor: "${zona}". Debe ser "${ZONA_EXPLOTACION}". ` +
      `Define la variable de entorno TZ=${ZONA_EXPLOTACION} en el despliegue.`,
    )
  }
}
