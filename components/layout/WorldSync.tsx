'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getWorldForPath } from '@/lib/navigation'

export function WorldSync() {
  const pathname = usePathname()

  useEffect(() => {
    const world = getWorldForPath(pathname)
    if (world === 'default') {
      document.documentElement.removeAttribute('data-world')
    } else {
      document.documentElement.setAttribute('data-world', world)
    }
  }, [pathname])

  return null
}
