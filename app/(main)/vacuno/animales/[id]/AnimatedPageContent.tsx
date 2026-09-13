'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function AnimatedPageContent({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="flex flex-col gap-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}
