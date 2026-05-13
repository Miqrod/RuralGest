import {
  Banknote,
  BarChart3,
  Beef,
  BookOpen,
  Calendar,
  ClipboardList,
  FileBarChart2,
  FileText,
  Home,
  Layers,
  PiggyBank,
  PlusCircle,
  Receipt,
  Settings,
  TrendingUp,
  Warehouse,
} from 'lucide-react'

import type { NavItem, WorldConfig, WorldId } from '@/types/navigation'

export const WORLDS: Record<WorldId, WorldConfig> = {
  default: { id: 'default', color: '#166534' },
  vacuno: { id: 'vacuno', color: '#800000' },
  porcino: { id: 'porcino', color: '#ff7700' },
  financiero: { id: 'financiero', color: '#3377aa' },
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/home', label: 'Inicio', icon: Home, world: 'default' },
  { href: '/calendario', label: 'Calendario', icon: Calendar, world: 'default' },
  {
    label: 'Vacuno',
    icon: Beef,
    world: 'vacuno',
    children: [
      { href: '/vacuno/animales', label: 'Listado de animales', icon: ClipboardList, world: 'vacuno' },
      { href: '/vacuno/nuevo', label: 'Añadir animal', icon: PlusCircle, world: 'vacuno' },
      { href: '/vacuno/ficha', label: 'Ficha de animal', icon: FileText, world: 'vacuno' },
      { href: '/vacuno/lotes', label: 'Gestión de lotes', icon: Layers, world: 'vacuno' },
    ],
  },
  {
    label: 'Porcino',
    icon: PiggyBank,
    world: 'porcino',
    children: [
      { href: '/porcino/animales', label: 'Listado de animales', icon: ClipboardList, world: 'porcino' },
      { href: '/porcino/nuevo', label: 'Añadir animal', icon: PlusCircle, world: 'porcino' },
      { href: '/porcino/ficha', label: 'Ficha de animal', icon: FileText, world: 'porcino' },
      { href: '/porcino/lotes', label: 'Gestión de lotes', icon: Layers, world: 'porcino' },
    ],
  },
  {
    label: 'Finanzas',
    icon: Banknote,
    world: 'financiero',
    children: [
      { href: '/finanzas/resumen', label: 'Resumen financiero', icon: BarChart3, world: 'financiero' },
      { href: '/finanzas/transacciones', label: 'Transacciones', icon: TrendingUp, world: 'financiero' },
      { href: '/finanzas/facturas', label: 'Facturas', icon: Receipt, world: 'financiero' },
      { href: '/finanzas/informes', label: 'Informes', icon: FileBarChart2, world: 'financiero' },
    ],
  },
  { href: '/instalaciones', label: 'Instalaciones', icon: Warehouse, world: 'default' },
  { href: '/docs', label: 'Documentación', icon: BookOpen, world: 'default' },
  { href: '/configuracion', label: 'Configuración', icon: Settings, world: 'default' },
]

export function getWorldForPath(pathname: string): WorldId {
  for (const item of NAV_ITEMS) {
    if (item.href && pathname.startsWith(item.href)) return item.world
    if (item.children) {
      const child = item.children.find((c) => c.href && pathname.startsWith(c.href))
      if (child) return child.world
    }
  }
  return 'default'
}
