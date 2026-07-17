'use client'

import { useState } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

export interface AnimalOption {
  id: string
  label: string     // primera línea: nombre + raza, o el identificador más legible disponible
  sublabel?: string // segunda línea: crotal u otro dato de confirmación
}

interface Props {
  options:       AnimalOption[]
  value:         string | null
  onChange:      (id: string | null) => void
  placeholder?:  string
  searchPlaceholder?: string
  disabled?:     boolean
  'aria-invalid'?: boolean
}

// Selector de animal con búsqueda incremental y renderizado de dos líneas por ítem.
// label = nombre · raza (primera línea, más legible para humanos)
// sublabel = crotal (segunda línea, identificador inequívoco)
export function AnimalSelector({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar animal…',
  searchPlaceholder = 'Buscar por nombre, raza o crotal…',
  disabled,
  'aria-invalid': ariaInvalid,
}: Props) {
  const [open, setOpen] = useState(false)

  const selected = options.find(o => o.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        aria-invalid={ariaInvalid}
        className={cn(
          // Mismo estilo visual que SelectTrigger
          'flex w-full items-center justify-between gap-1.5 rounded-lg border border-input',
          'bg-transparent py-2.5 pr-2.5 pl-3.5 text-sm',
          'transition-colors duration-200 ease-in outline-none select-none',
          'hover:border-stone-400 dark:hover:border-stone-500',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:bg-input/30 dark:hover:bg-input/50',
          ariaInvalid && 'border-destructive ring-3 ring-destructive/20',
        )}
      >
        <span className={cn('truncate text-left', !selected && 'text-muted-foreground')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--anchor-width)] p-0"
        sideOffset={4}
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty className="text-ink-muted">Sin resultados.</CommandEmpty>
            <CommandGroup>
              {options.map(opt => (
                <CommandItem
                  key={opt.id}
                  value={opt.id}
                  keywords={[opt.label, opt.sublabel ?? ''].filter(Boolean)}
                  data-checked={opt.id === value}
                  onSelect={(selectedId) => {
                    onChange(selectedId === value ? null : selectedId)
                    setOpen(false)
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-xs text-muted-foreground">{opt.sublabel}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
