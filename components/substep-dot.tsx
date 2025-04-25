"use client"

import { motion } from "framer-motion"

type SubstepProps = {
  substep: {
    id: string
    originX: number
    originY: number
    targetX: number
    targetY: number
    status: "pending" | "moving" | "completed"
    isAtOrigin?: boolean
    size?: number
  }
  showTrail?: boolean
}

export default function SubstepDot({ substep, showTrail = true }: SubstepProps) {
  const { originX, originY, targetX, targetY, isAtOrigin, size = 10 } = substep

  return (
    <>
      {/* The orange execution dot */}
      <motion.div
        className="absolute rounded-full bg-orange-500 shadow-md z-25 border-2 border-white"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          translateX: "-50%",
          translateY: "-50%",
        }}
        initial={{
          x: originX,
          y: originY,
          opacity: 0,
          scale: 0,
        }}
        animate={{
          x: targetX,
          y: targetY,
          opacity: 1,
          scale: 1,
        }}
        transition={{
          duration: 1.5,
          ease: "easeInOut",
        }}
      />

      {/* Trail effect connecting origin to target */}
      {showTrail && (
        <motion.div
          className="absolute bg-orange-300 z-20 origin-left"
          style={{
            height: "2px",
            left: originX,
            top: originY,
          }}
          initial={{
            width: 0,
            rotate: 0,
          }}
          animate={{
            width: Math.sqrt(Math.pow(targetX - originX, 2) + Math.pow(targetY - originY, 2)),
            rotate: Math.atan2(targetY - originY, targetX - originX) * (180 / Math.PI),
          }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
          }}
        />
      )}
    </>
  )
}
