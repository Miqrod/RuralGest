import type { ReactNode } from 'react'
import Link from 'next/link'
import { FichaSection } from './FichaSection'
import { formatFecha } from '@/lib/format'
import type { AnimalDetail } from '@/modules/ganadero/animales/application/queries/getAnimalDetail'

const ORIGEN_LABEL: Record<string, string> = {
  interno: 'Nacido en la explotación',
  compra:  'Compra externa',
}

function calcularEdad(fechaIso: string): string {
  const nacimiento = new Date(fechaIso)
  const hoy = new Date()
  const dias = Math.floor((hoy.getTime() - nacimiento.getTime()) / (1000 * 60 * 60 * 24))

  if (dias < 30) return `${dias} ${dias === 1 ? 'día' : 'días'}`

  const meses = Math.floor(dias / 30.44)
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`

  const años = Math.floor(meses / 12)
  const mesesRestantes = meses % 12
  const parteAños = `${años} ${años === 1 ? 'año' : 'años'}`
  if (mesesRestantes === 0) return parteAños
  return `${parteAños} y ${mesesRestantes} ${mesesRestantes === 1 ? 'mes' : 'meses'}`
}

function FilaDato({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-divider last:border-0">
      <span className="text-sm text-ink-muted shrink-0">{label}</span>
      <span className="text-sm text-ink text-right">{children}</span>
    </div>
  )
}

function ProgenitorLink({ id, crotal }: { id: string; crotal: string | null }) {
  const label = crotal ?? `#${id.slice(0, 8)}`
  return (
    <Link
      href={`/vacuno/animales/${id}`}
      className="text-world hover:underline underline-offset-2"
    >
      {label}
    </Link>
  )
}

export function SeccionOrigen({ animal }: { animal: AnimalDetail }) {
  const fecha = animal.fecha_nacimiento ?? animal.fecha_nacimiento_estimada
  const esEstimada = !animal.fecha_nacimiento && !!animal.fecha_nacimiento_estimada

  return (
    <FichaSection title="Origen">
      <FilaDato label="Procedencia">
        {ORIGEN_LABEL[animal.origen] ?? animal.origen}
      </FilaDato>

      {fecha && (
        <FilaDato label={esEstimada ? 'F. nac. estimada' : 'F. nac. real'}>
          {formatFecha(fecha)}
          <span className="text-ink-muted ml-2">({calcularEdad(fecha)})</span>
        </FilaDato>
      )}

      <FilaDato label="Madre">
        {animal.madre_id
          ? <ProgenitorLink id={animal.madre_id} crotal={animal.madre_crotal} />
          : <span className="text-ink-muted">Desconocida</span>
        }
      </FilaDato>

      <FilaDato label="Padre">
        {animal.padre_id
          ? <ProgenitorLink id={animal.padre_id} crotal={animal.padre_crotal} />
          : <span className="text-ink-muted">Desconocido</span>
        }
      </FilaDato>
    </FichaSection>
  )
}
