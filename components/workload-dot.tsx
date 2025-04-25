"use client"

import { motion } from "framer-motion"

type WorkloadDotProps = {
  x: number
  y: number
  status: "originating" | "distributing" | "completed"
  size?: number
  pulseEffect?: boolean
}

export default function WorkloadDot({ x, y, status, size = 16, pulseEffect = true }: WorkloadDotProps) {
  return (
    <motion.div
      className={`absolute rounded-full bg-blue-500 shadow-md z-30 border-2 border-white ${
        pulseEffect && status === "originating" ? "animate-pulse" : ""
      }`}
      style={{
        x,
        y,
        translateX: "-50%",
        translateY: "-50%",
        width: `${size}px`,
        height: `${size}px`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: status === "completed" ? 0 : 1,
        scale: status === "originating" ? 1 : status === "distributing" ? 0.9 : 0,
      }}
      transition={{
        duration: 0.5,
      }}
    />
  )
}
