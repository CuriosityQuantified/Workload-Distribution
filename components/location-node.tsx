"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

type LocationNodeProps = {
  location: {
    id: string
    name: string
    icon: LucideIcon
    x: number
    y: number
  }
  stats: {
    originated: number
    executed: number
  }
}

export default function LocationNode({ location, stats }: LocationNodeProps) {
  const { x, y, name, icon: Icon } = location

  return (
    <motion.div
      className="absolute flex flex-col items-center z-50" // Highest z-index to ensure visibility
      style={{
        x: x,
        y: y,
        translateX: "-50%",
        translateY: "-50%",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center shadow-md border-3 border-white">
          <Icon className="h-8 w-8 text-gray-700" />
        </div>
        <div className="mt-2 text-sm font-medium text-center text-gray-800 bg-white bg-opacity-95 px-2 py-0.5 rounded-md shadow-sm z-50 border border-gray-200">
          {name}
        </div>
      </div>
    </motion.div>
  )
}
