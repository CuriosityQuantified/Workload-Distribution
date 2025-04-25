"use client"

import { useState, useEffect, useRef } from "react"
import { AnimatePresence } from "framer-motion"
import { Play, Pause, RefreshCw, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import LocationNode from "@/components/location-node"
import WorkloadDot from "@/components/workload-dot"
import SubstepDot from "@/components/substep-dot"
import AccumulatedDot from "@/components/accumulated-dot"
import StatsPanel from "@/components/stats-panel"
import type { OriginConfig, ExecutionConfig, SimulationConfig } from "./workload-simulator"
import type { LucideIcon } from "lucide-react"

// Generate coordinates based on angle and radius
const getCoordinates = (angle: number, radius: number) => {
  const radians = (angle - 90) * (Math.PI / 180)
  return {
    x: radius * Math.cos(radians),
    y: radius * Math.sin(radians),
  }
}

// Calculate positions for accumulated dots in concentric arcs around location icons
const calculateAccumulatedPosition = (centerX: number, centerY: number, index: number, totalDots: number) => {
  // Minimum safe distance from the center to avoid overlapping with the location icon
  // Location icon is 16x16 with padding and border, so we start at 50px radius to be safe
  const minRadius = 50

  // Maximum radius to avoid going too far from the location
  const maxRadius = 120

  // Calculate how many dots we can fit in each arc
  // We'll use a formula that increases the number of dots per arc as the radius increases
  const getDotsPerArc = (arcIndex: number) => {
    // Start with 8 dots in the first arc, increase by 4 for each subsequent arc
    return 8 + arcIndex * 4
  }

  // Find which arc this dot belongs to
  let arcIndex = 0
  let dotsBeforeCurrentArc = 0
  let dotsInCurrentArc = getDotsPerArc(arcIndex)

  while (index >= dotsBeforeCurrentArc + dotsInCurrentArc) {
    dotsBeforeCurrentArc += dotsInCurrentArc
    arcIndex++
    dotsInCurrentArc = getDotsPerArc(arcIndex)

    // Safety check to prevent infinite loops with very large numbers of dots
    if (arcIndex > 20) break
  }

  // Calculate the position within the current arc
  const positionInArc = index - dotsBeforeCurrentArc

  // Calculate radius for this arc (increase by 10px for each arc)
  const radius = Math.min(minRadius + arcIndex * 10, maxRadius)

  // Calculate angle based on position in arc
  // We'll distribute dots in a 270-degree arc (from -135° to +135°)
  // This leaves the bottom area clear for the location name
  const arcStartAngle = -135 * (Math.PI / 180)
  const arcEndAngle = 135 * (Math.PI / 180)
  const arcLength = arcEndAngle - arcStartAngle
  const angle = arcStartAngle + (positionInArc / dotsInCurrentArc) * arcLength

  // Calculate position
  const x = centerX + radius * Math.cos(angle)
  const y = centerY + radius * Math.sin(angle)

  // Dynamic sizing based on total dots and arc index
  // Start with larger dots and make them smaller as density increases
  const baseSize = 8
  const densityFactor = Math.min(1, 100 / totalDots) // Reduce size as total dots increases
  const arcFactor = Math.max(0.5, 1 - arcIndex * 0.1) // Reduce size as arc index increases
  const size = Math.max(4, Math.round(baseSize * densityFactor * arcFactor)) // Ensure minimum size of 4px

  return { x, y, size }
}

// Calculate a safe position for a workload dot around a location
// This ensures the dot doesn't overlap with the location icon or name
const calculateSafeWorkloadPosition = (locationX: number, locationY: number, index: number, total: number) => {
  // Minimum safe distance from center of location icon (icon is 16x16 with padding and border)
  const safeRadius = 50

  // If there's only one dot or no index provided, use a random angle
  const angle =
    total <= 1 || index === undefined ? Math.random() * 2 * Math.PI : (index / Math.max(1, total)) * 2 * Math.PI

  // Calculate offset position
  const x = locationX + safeRadius * Math.cos(angle)
  const y = locationY + safeRadius * Math.sin(angle)

  return { x, y }
}

type Workload = {
  id: string
  originLocationId: string
  substeps: Substep[]
  status: "originating" | "distributing" | "completed"
  x?: number // Add optional x position
  y?: number // Add optional y position
  size?: number // Add optional size
}

type Substep = {
  id: string
  targetLocationId: string
  status: "pending" | "moving" | "completed"
  originX: number
  originY: number
  targetX: number
  targetY: number
  isAtOrigin?: boolean
  size?: number // Add optional size
}

type AccumulatedDotType = {
  id: string
  locationId: string
  x: number
  y: number
  size: number
}

type Stats = {
  [locationId: string]: {
    originated: number
    executed: number
  }
}

type WorkloadVisualizationProps = {
  locations: {
    id: string
    name: string
    icon: LucideIcon
    angle: number
  }[]
  originConfig: OriginConfig
  executionConfig: ExecutionConfig
  simulationConfig: SimulationConfig
  isRunning: boolean
  simulationName: string
  onSaveResults: (stats: Stats) => void
  onSimulationComplete: () => void
}

export default function WorkloadVisualization({
  locations,
  originConfig,
  executionConfig,
  simulationConfig,
  isRunning,
  simulationName,
  onSaveResults,
  onSimulationComplete,
}: WorkloadVisualizationProps) {
  // Calculate position for each location
  const locationPositions = locations.map((location) => {
    const { x, y } = getCoordinates(location.angle, 200)
    return {
      ...location,
      x,
      y,
    }
  })

  const [workloads, setWorkloads] = useState<Workload[]>([])
  const [accumulatedDots, setAccumulatedDots] = useState<AccumulatedDotType[]>([])
  const [stats, setStats] = useState<Stats>(() => {
    const initialStats: Stats = {}
    locations.forEach((location) => {
      initialStats[location.id] = { originated: 0, executed: 0 }
    })
    return initialStats
  })
  const [isPaused, setIsPaused] = useState(false)
  const workloadIdCounter = useRef(0)
  const substepIdCounter = useRef(0)
  const accumulatedDotCounter = useRef(0)
  const samplesProcessed = useRef(0)
  const simulationCompleted = useRef(false)
  const isFirstRender = useRef(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Track accumulated dots per location for positioning calculations
  const dotsPerLocation = useRef<Record<string, number>>({})

  // Track active workloads per location for positioning calculations
  const activeWorkloadsPerLocation = useRef<Record<string, number>>({})

  // Store the current configs in refs to avoid triggering effects when they change
  const originConfigRef = useRef(originConfig)
  const executionConfigRef = useRef(executionConfig)
  const simulationConfigRef = useRef(simulationConfig)

  // Update refs when props change, but don't trigger effects
  useEffect(() => {
    originConfigRef.current = originConfig
    executionConfigRef.current = executionConfig

    // Check if simulation speed has changed
    const speedChanged =
      simulationConfigRef.current?.speed !== simulationConfig.speed ||
      simulationConfigRef.current?.instantMode !== simulationConfig.instantMode

    // Update the simulation config ref
    simulationConfigRef.current = simulationConfig

    // If the simulation is running and the speed has changed, restart the interval
    if (isRunning && !isPaused && speedChanged && !simulationConfig.instantMode) {
      // Clear the existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      // Start a new interval with the updated speed
      startGenerationInterval()
    }
  }, [originConfig, executionConfig, simulationConfig, isRunning, isPaused])

  // Function to start the generation interval with the current speed
  const startGenerationInterval = () => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Calculate the interval based on the simulation speed
    // At 1x speed, generate 1 sample per second
    const intervalTime = 1000 / simulationConfigRef.current.speed

    // Start a new interval
    intervalRef.current = setInterval(() => {
      if (samplesProcessed.current < simulationConfigRef.current.numSamples) {
        generateWorkload()
      } else if (!simulationCompleted.current) {
        simulationCompleted.current = true
        onSimulationComplete()

        // Clear the interval when all samples are processed
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }, intervalTime)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }

  // Select an origin location based on configuration
  const selectOriginLocation = () => {
    // Create an array of location IDs weighted by their configured percentages
    const weightedLocations: string[] = []
    const currentOriginConfig = originConfigRef.current

    locations.forEach((location) => {
      const percentage = currentOriginConfig[location.id]?.percentage || 0
      const count = Math.round(percentage)

      for (let i = 0; i < count; i++) {
        weightedLocations.push(location.id)
      }
    })

    // If no locations are configured, fall back to random selection
    if (weightedLocations.length === 0) {
      return locations[Math.floor(Math.random() * locations.length)].id
    }

    // Select a random location from the weighted array
    return weightedLocations[Math.floor(Math.random() * weightedLocations.length)]
  }

  // Select target locations for substeps based on configuration
  const selectTargetLocations = (originLocationId: string, numSubsteps: number) => {
    const targetLocations: string[] = []
    const currentExecutionConfig = executionConfigRef.current
    const originConfig = currentExecutionConfig[originLocationId] || {}

    // Create an array of enabled target locations weighted by their configured percentages
    const weightedLocations: string[] = []

    locations.forEach((location) => {
      const config = originConfig[location.id]

      if (config?.enabled) {
        const percentage = config.percentage || 0
        const count = Math.round(percentage)

        for (let i = 0; i < count; i++) {
          weightedLocations.push(location.id)
        }
      }
    })

    // If no locations are enabled, fall back to the origin location
    if (weightedLocations.length === 0) {
      for (let i = 0; i < numSubsteps; i++) {
        targetLocations.push(originLocationId)
      }
      return targetLocations
    }

    // Select random locations from the weighted array
    for (let i = 0; i < numSubsteps; i++) {
      targetLocations.push(weightedLocations[Math.floor(Math.random() * weightedLocations.length)])
    }

    return targetLocations
  }

  // Select number of substeps based on workload count distribution
  const selectNumberOfSubsteps = () => {
    const distribution = simulationConfigRef.current.workloadCountDistribution

    // Create a weighted array based on the distribution
    const weightedCounts: number[] = []

    for (const [count, percentage] of Object.entries(distribution)) {
      const countValue = Number.parseInt(count)
      const weight = Math.round(percentage)

      for (let i = 0; i < weight; i++) {
        weightedCounts.push(countValue)
      }
    }

    // If distribution is empty, fall back to random between 2-10
    if (weightedCounts.length === 0) {
      return Math.floor(Math.random() * 9) + 2
    }

    // Select a random count from the weighted array
    return weightedCounts[Math.floor(Math.random() * weightedCounts.length)]
  }

  // Add accumulated dot at a location
  const addAccumulatedDot = (locationId: string) => {
    const location = locationPositions.find((loc) => loc.id === locationId)
    if (!location) return

    // Initialize or increment the dot count for this location
    if (!dotsPerLocation.current[locationId]) {
      dotsPerLocation.current[locationId] = 0
    }

    // Get the current count and increment for next time
    const dotIndex = dotsPerLocation.current[locationId]
    dotsPerLocation.current[locationId]++

    // Get the total dots across all locations for density calculations
    const totalDots = Object.values(dotsPerLocation.current).reduce((sum, count) => sum + count, 0)

    // Calculate position for the new dot
    const { x, y, size } = calculateAccumulatedPosition(location.x, location.y, dotIndex, totalDots)

    // Add new accumulated dot
    const newDot: AccumulatedDotType = {
      id: `accumulated-${accumulatedDotCounter.current++}`,
      locationId,
      x,
      y,
      size,
    }

    setAccumulatedDots((prev) => [...prev, newDot])
  }

  // Generate a new workload
  const generateWorkload = () => {
    const currentSimulationConfig = simulationConfigRef.current

    // Prevent generating more workloads if we've already processed all samples
    if (samplesProcessed.current >= currentSimulationConfig.numSamples) {
      if (!simulationCompleted.current) {
        simulationCompleted.current = true
        onSimulationComplete()

        // Clear the interval when all samples are processed
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
      return
    }

    // Increment samples processed FIRST to prevent race conditions
    samplesProcessed.current++

    // Check again after incrementing to ensure we don't exceed the limit
    if (samplesProcessed.current > currentSimulationConfig.numSamples) {
      samplesProcessed.current = currentSimulationConfig.numSamples
      simulationCompleted.current = true
      onSimulationComplete()

      // Clear the interval when all samples are processed
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const originLocationId = selectOriginLocation()
    const originLocation = locationPositions.find((loc) => loc.id === originLocationId)

    if (!originLocation) return

    // Initialize or increment the active workload count for this location
    if (!activeWorkloadsPerLocation.current[originLocationId]) {
      activeWorkloadsPerLocation.current[originLocationId] = 0
    }
    activeWorkloadsPerLocation.current[originLocationId]++

    // Get the current count for positioning
    const workloadIndex = activeWorkloadsPerLocation.current[originLocationId]
    const totalWorkloads = activeWorkloadsPerLocation.current[originLocationId]

    const workloadId = `workload-${workloadIdCounter.current++}`

    // Update stats for origination
    setStats((prevStats) => ({
      ...prevStats,
      [originLocationId]: {
        ...prevStats[originLocationId],
        originated: prevStats[originLocationId].originated + 1,
      },
    }))

    // In instant mode, we don't need to create visual workloads
    if (currentSimulationConfig.instantMode) {
      // Generate substeps and update stats directly
      const numSubsteps = selectNumberOfSubsteps()
      const targetLocationIds = selectTargetLocations(originLocationId, numSubsteps)

      targetLocationIds.forEach((targetLocationId) => {
        setStats((prevStats) => ({
          ...prevStats,
          [targetLocationId]: {
            ...prevStats[targetLocationId],
            executed: prevStats[targetLocationId].executed + 1,
          },
        }))

        // Add accumulated dot for each execution
        addAccumulatedDot(targetLocationId)
      })

      // Decrement the active workload count for this location
      if (activeWorkloadsPerLocation.current[originLocationId]) {
        activeWorkloadsPerLocation.current[originLocationId]--
      }

      // Check if we've processed all samples
      if (samplesProcessed.current >= currentSimulationConfig.numSamples) {
        simulationCompleted.current = true
        onSimulationComplete()

        // Clear the interval when all samples are processed
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }

      return
    }

    // Calculate a safe position for the workload dot that avoids the location icon
    const { x, y } = calculateSafeWorkloadPosition(
      originLocation.x,
      originLocation.y,
      workloadIndex - 1,
      totalWorkloads,
    )

    // Calculate dynamic size based on number of active workloads
    // Start with a larger size and only decrease if necessary
    const baseSize = 16 // Larger base size for better visibility
    const minSize = 12 // Minimum size to ensure visibility
    const totalActiveWorkloads = Object.values(activeWorkloadsPerLocation.current).reduce(
      (sum, count) => sum + count,
      0,
    )

    // Only decrease size if there are many active workloads
    const dynamicSize = Math.max(minSize, baseSize - Math.min(4, Math.floor(totalActiveWorkloads / 20)))

    const newWorkload: Workload = {
      id: workloadId,
      originLocationId,
      substeps: [],
      status: "originating",
      // Add position and size properties
      x,
      y,
      size: dynamicSize,
    }

    setWorkloads((prevWorkloads) => [...prevWorkloads, newWorkload])

    // After a delay, break down into substeps
    // Use a fixed delay for the animation, independent of simulation speed
    setTimeout(() => {
      const numSubsteps = selectNumberOfSubsteps()
      const targetLocationIds = selectTargetLocations(originLocationId, numSubsteps)
      const substeps: Substep[] = []

      // Track how many substeps target each location
      const targetCounts: Record<string, number> = {}

      // First pass: count how many substeps will target each location
      targetLocationIds.forEach((targetLocationId) => {
        // Initialize or increment the count for this target location
        targetCounts[targetLocationId] = (targetCounts[targetLocationId] || 0) + 1
      })

      // Second pass: create substeps with proper offsets
      const targetIndexes: Record<string, number> = {}

      targetLocationIds.forEach((targetLocationId, i) => {
        const targetLocation = locationPositions.find((loc) => loc.id === targetLocationId)

        if (!targetLocation) return

        // Initialize index counter for this target if needed
        if (targetIndexes[targetLocationId] === undefined) {
          targetIndexes[targetLocationId] = 0
        }

        // Calculate a safe position for the substep dot
        const { x: targetX, y: targetY } = calculateSafeWorkloadPosition(
          targetLocation.x,
          targetLocation.y,
          targetIndexes[targetLocationId],
          targetCounts[targetLocationId],
        )

        // Increment the index for this target location
        targetIndexes[targetLocationId]++

        substeps.push({
          id: `substep-${substepIdCounter.current++}`,
          targetLocationId,
          status: "pending",
          originX: newWorkload.x || originLocation.x, // Use the workload's position if available
          originY: newWorkload.y || originLocation.y,
          targetX,
          targetY,
          isAtOrigin: targetLocationId === originLocationId,
          size: dynamicSize - 4, // Make substeps slightly smaller than workloads but still visible
        })

        // Update stats for execution
        setStats((prevStats) => ({
          ...prevStats,
          [targetLocationId]: {
            ...prevStats[targetLocationId],
            executed: prevStats[targetLocationId].executed + 1,
          },
        }))
      })

      setWorkloads((prevWorkloads) =>
        prevWorkloads.map((wl) => (wl.id === workloadId ? { ...wl, substeps, status: "distributing" } : wl)),
      )

      // After all substeps are distributed, mark workload as completed
      // Use a fixed animation duration regardless of simulation speed
      setTimeout(() => {
        // Add accumulated dots for each substep
        substeps.forEach((substep) => {
          addAccumulatedDot(substep.targetLocationId)
        })

        setWorkloads((prevWorkloads) =>
          prevWorkloads.map((wl) => (wl.id === workloadId ? { ...wl, status: "completed" } : wl)),
        )

        // Remove completed workload after a fixed delay
        setTimeout(() => {
          // Decrement the active workload count for this location
          if (activeWorkloadsPerLocation.current[originLocationId]) {
            activeWorkloadsPerLocation.current[originLocationId]--
          }

          setWorkloads((prevWorkloads) => prevWorkloads.filter((wl) => wl.id !== workloadId))

          // Check if we've processed all samples
          if (samplesProcessed.current >= currentSimulationConfig.numSamples && !simulationCompleted.current) {
            simulationCompleted.current = true
            onSimulationComplete()

            // Clear the interval when all samples are processed
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
          }
        }, 500) // Fixed cleanup delay
      }, 1500) // Fixed animation duration
    }, 800) // Increased delay for starting animation to make blue dots more visible
  }

  // Reset for a new simulation
  useEffect(() => {
    // Skip the first render to prevent auto-starting
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (isRunning) {
      // Reset state
      setWorkloads([])
      setAccumulatedDots([])
      setStats(() => {
        const initialStats: Stats = {}
        locations.forEach((location) => {
          initialStats[location.id] = { originated: 0, executed: 0 }
        })
        return initialStats
      })
      setIsPaused(false)
      workloadIdCounter.current = 0
      substepIdCounter.current = 0
      accumulatedDotCounter.current = 0
      samplesProcessed.current = 0
      simulationCompleted.current = false
      dotsPerLocation.current = {}
      activeWorkloadsPerLocation.current = {}

      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      // Start the simulation
      if (simulationConfigRef.current.instantMode) {
        // In instant mode, process all samples at once
        for (let i = 0; i < simulationConfigRef.current.numSamples; i++) {
          generateWorkload()
        }
      } else {
        // Start the generation interval for normal mode
        startGenerationInterval()
      }
    } else {
      // If simulation is stopped, clear the interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    // Clean up on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, locations])

  // Handle pause/resume
  useEffect(() => {
    if (isRunning && !simulationConfigRef.current.instantMode) {
      if (isPaused) {
        // Pause the simulation by clearing the interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        // Resume the simulation by starting a new interval
        startGenerationInterval()
      }
    }

    // Clean up on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPaused, isRunning])

  // Reset stats
  const resetStats = () => {
    setStats(() => {
      const resetStats: Stats = {}
      locations.forEach((location) => {
        resetStats[location.id] = { originated: 0, executed: 0 }
      })
      return resetStats
    })
    setAccumulatedDots([])
    samplesProcessed.current = 0
    simulationCompleted.current = false
    accumulatedDotCounter.current = 0
    dotsPerLocation.current = {}
    activeWorkloadsPerLocation.current = {} // Reset active workloads tracking
  }

  // Handle saving results
  const handleSaveResults = () => {
    // Create a deep copy of the stats to avoid reference issues
    const statsCopy = JSON.parse(JSON.stringify(stats))
    onSaveResults(statsCopy)
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between items-center w-full mb-4">
        <h2 className="text-xl font-semibold">Workload Visualization</h2>
        <div className="flex gap-2">
          {isRunning && !simulationConfigRef.current.instantMode && (
            <Button variant="outline" onClick={() => setIsPaused(!isPaused)}>
              {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
              {isPaused ? "Resume" : "Pause"}
            </Button>
          )}
          <Button variant="outline" onClick={resetStats}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Stats
          </Button>
        </div>
      </div>

      <div className="relative w-full h-[550px] bg-white rounded-lg shadow-sm border border-gray-100">
        {/* Center point for reference */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {/* Accumulated dots (render first so they appear behind location nodes) */}
          {accumulatedDots.map((dot) => (
            <AccumulatedDot key={dot.id} dot={dot} />
          ))}

          {/* Location nodes */}
          {locationPositions.map((location) => (
            <LocationNode key={location.id} location={location} stats={stats[location.id]} />
          ))}

          {/* Workload dots and their connections */}
          <AnimatePresence>
            {workloads.map((workload) => {
              const originLocation = locationPositions.find((loc) => loc.id === workload.originLocationId)

              if (!originLocation) return null

              // Use workload's position if available, otherwise use origin location position
              const x = workload.x !== undefined ? workload.x : originLocation.x
              const y = workload.y !== undefined ? workload.y : originLocation.y

              return (
                <div key={workload.id}>
                  {/* Origin workload dot */}
                  <WorkloadDot
                    x={x}
                    y={y}
                    status={workload.status}
                    size={workload.size}
                    pulseEffect={workload.status === "originating"}
                  />

                  {/* Substep dots with connection lines */}
                  {workload.status === "distributing" &&
                    workload.substeps.map((substep) => (
                      <SubstepDot
                        key={substep.id}
                        substep={{
                          ...substep,
                          size: substep.size,
                        }}
                        showTrail={true}
                      />
                    ))}
                </div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Progress indicator */}
        {isRunning && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="bg-white px-4 py-2 rounded-full shadow-md">
              <span className="font-medium">
                {samplesProcessed.current} / {simulationConfigRef.current.numSamples} samples
              </span>
            </div>
          </div>
        )}
      </div>

      <StatsPanel stats={stats} locations={locations} />

      {/* Save Results Button */}
      <Button
        className="w-full mt-6 py-6 text-lg"
        onClick={handleSaveResults}
        disabled={isRunning && !simulationCompleted.current}
      >
        <Save className="mr-2 h-6 w-6" />
        Save Results as "{simulationName}"
      </Button>
    </div>
  )
}
