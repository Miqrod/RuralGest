import { AnimalHeader } from './AnimalHeader'
import { SeccionEstados } from './SeccionEstados'
import { SeccionOrigen } from './SeccionOrigen'
import type { AnimalDetail } from '@/modules/ganadero/animales/application/getAnimalDetail'

export function FichaAnimal({ animal }: { animal: AnimalDetail }) {
  return (
    <div>
      <AnimalHeader animal={animal} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SeccionEstados animal={animal} />
        <SeccionOrigen animal={animal} />
      </div>
    </div>
  )
}
