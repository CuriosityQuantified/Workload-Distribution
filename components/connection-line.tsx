"use client"

import { motion } from "framer-motion"

type ConnectionLineProps = {
  startX: number
  startY: number
  endX: number
  endY: number
  progress?: number
  color?: string
  thickness?: number
}

export default function ConnectionLine({
  startX,
  startY,
  endX,
  endY,
  progress = 1,
  color = "rgba(59, 130, 246, 0.5)", // Default blue with transparency
  thickness = 2,
}: ConnectionLineProps) {
  // Calculate the length and angle of the line
  const dx = endX - startX
  const dy = endY - startY
  const length = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  return (
    <motion.div
      className="absolute origin-left z-15"
      style={{
        left: startX,
        top: startY,
        height: thickness,
        backgroundColor: color,
        width: length * progress,
        transform: `rotate(${angle}deg)`,
      }}
      initial={{ width: 0 }}
      animate={{ width: length * progress }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    />
  )
}
