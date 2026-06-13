'use client'

import { useState } from 'react'
import { format, parse, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

interface DatePickerProps {
  value?: string                          // ISODate: YYYY-MM-DD
  onChange?: (value: string | undefined) => void
  placeholder?: string
  disabled?: boolean
  // Cuando se pasa, bloquea la selección y la navegación a partir de esa fecha.
  // Usar new Date() para impedir fechas futuras.
  maxDate?: Date
  className?: string
  'aria-invalid'?: boolean
}

// Convierte ISODate → Date para react-day-picker, y Date → ISODate de vuelta.
// Nunca usa el constructor Date(string) directamente porque interpreta la fecha
// como UTC y puede producir el día anterior en zonas horarias negativas.
function isoToDate(iso: string): Date {
  return parse(iso, 'yyyy-MM-dd', new Date())
}

function dateToIso(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

// Año mínimo del selector: animales no nacen antes del año 2000 en este contexto
const FROM_YEAR = 2000

export function DatePicker({
  value,
  onChange,
  placeholder = 'Selecciona una fecha',
  disabled = false,
  maxDate,
  className,
  'aria-invalid': ariaInvalid,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const selected = value ? isoToDate(value) : undefined
  const displayValue =
    selected && isValid(selected)
      ? format(selected, 'dd/MM/yyyy', { locale: es })
      : null

  // endMonth: si hay maxDate la usamos; si no, permitimos navegar 2 años hacia adelante
  const endMonth = maxDate ?? new Date(new Date().getFullYear() + 2, 11)

  function handleSelect(date: Date | undefined) {
    onChange?.(date ? dateToIso(date) : undefined)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={(isOpen) => setOpen(isOpen)}>
      {/* El trigger imita exactamente el estilo del componente Input */}
      <PopoverTrigger
        disabled={disabled}
        aria-invalid={ariaInvalid}
        className={cn(
          'flex w-full cursor-pointer items-center gap-2 rounded-lg border border-input bg-transparent px-3.5 py-2.5 text-sm transition-colors duration-200 ease-in outline-none',
          'hover:border-stone-400 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
          !displayValue && 'text-muted-foreground',
          className,
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left">{displayValue ?? placeholder}</span>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          locale={es}
          autoFocus
          // Dropdown de mes+año: evita tener que navegar mes a mes
          captionLayout="dropdown"
          startMonth={new Date(FROM_YEAR, 0)}
          endMonth={endMonth}
          // Si maxDate está definido, bloquea selección de fechas posteriores
          disabled={maxDate ? { after: maxDate } : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}
