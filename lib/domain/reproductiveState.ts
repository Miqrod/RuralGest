
export function validarTransicion(
  evento: string,
  estadoActual: string
) {
  switch (evento) {
    case 'CUBRICION':
      if (!['VACIA', 'NO_REPRODUCTIVA'].includes(estadoActual))
        throw Error('Cubrición inválida')
      return 'GESTANTE'

    case 'PARTO':
      if (estadoActual !== 'GESTANTE')
        throw Error('Parto inválido')
      return 'LACTANTE'

    case 'DESTETE':
      if (estadoActual !== 'LACTANTE')
        throw Error('Destete inválido')
      return 'VACIA'

    case 'ABORTO':
      if (estadoActual !== 'GESTANTE')
        throw Error('Aborto inválido')
      return 'VACIA'

    default:
      return estadoActual
  }
}