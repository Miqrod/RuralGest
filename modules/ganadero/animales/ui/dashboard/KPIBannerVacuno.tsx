import Link from 'next/link'
import type { CensoVacunoVivo } from '../../application/queries/getCensoVivo'

interface Props {
  censo: CensoVacunoVivo
}

export function KPIBannerVacuno({ censo }: Props) {
  return (
    <div className="bg-world-gradient rounded-2xl p-8 text-white relative overflow-hidden shadow-md">
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">

        {/* Total — link al listado de animales; -m-3 p-3 cancela el padding en reposo */}
        <Link href="/vacuno/animales" className="block rounded-2xl p-3 -m-3 transition-colors hover:bg-white/10">
          <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 inline-block">
            Vacuno · censo en activo
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-7xl font-extrabold tracking-tighter">{censo.total}</span>
            <span className="text-white/60 text-base font-medium">cabezas</span>
          </div>
        </Link>

        {/* Desglose por tipo productivo */}
        {censo.porTipoProductivo.length > 0 && (
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {censo.porTipoProductivo.map(({ nombre, count }) => (
              <div
                key={nombre}
                className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 min-w-[110px] border border-white/10"
              >
                <span className="text-[10px] opacity-70 block font-bold uppercase tracking-wider mb-1">
                  {nombre}
                </span>
                <span className="text-2xl font-bold">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decoración de fondo */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
    </div>
  )
}
