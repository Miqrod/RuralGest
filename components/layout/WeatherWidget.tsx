// TODO: conectar a API meteorológica externa (ej. OpenWeatherMap, AEMET)
// Este componente recibirá los datos via props una vez integrada la API.

import { Cloud } from 'lucide-react'

export interface WeatherData {
  temp: number       // temperatura en °C
  description: string
  icon?: string      // código de icono de la API
}

interface Props {
  data?: WeatherData
}

export function WeatherWidget({ data }: Props) {
  if (!data) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-ink-muted text-sm font-medium">
        <Cloud className="w-4 h-4" />
        <span className="text-xs">--°C</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-ink-muted hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-sm font-medium cursor-default">
      <Cloud className="w-4 h-4" />
      <span className="text-xs font-bold">{data.temp}°C</span>
    </div>
  )
}
