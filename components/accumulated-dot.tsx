"use client"

import { motion } from "framer-motion"

type AccumulatedDotProps = {
  dot: {
    id: string
    locationId: string
    x: number
    y: number
    size: number
  }
}

export default function AccumulatedDot({ dot }: AccumulatedDotProps) {
  const { x, y, size } = dot

  return (
    <motion.div
      className="absolute rounded-full bg-orange-500 opacity-70 z-10 border border-white"
      style={{
        x,
        y,
        translateX: "-50%",
        translateY: "-50%",
        width: `${size}px`,
        height: `${size}px`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.7, scale: 1 }}
      transition={{ duration: 0.3 }}
    />
  )
}
