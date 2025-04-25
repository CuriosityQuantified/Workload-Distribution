"use client"

import { useState } from "react"
import WorkloadVisualization from "@/components/workload-visualization"
import ConfigurationPanel from "@/components/configuration-panel"
import SimulationHistory from "@/components/simulation-history"
import { Cloud, Server, Home, Radio, Wifi, Cpu, Laptop } from "lucide-react"
import type { WorkloadCountDistribution } from "./workload-count-distribution"

// Define the different locations with evenly spaced angles (360° / 7 ≈ 51.43° between each)
const locations = [
  { id: "public-cloud", name: "Public Cloud", icon: Cloud, angle: 0 },
  { id: "colocation", name: "Colocation", icon: Server, angle: 51.43 },
  { id: "on-premises", name: "On Premises", icon: Home, angle: 102.86 },
  { id: "near-edge", name: "Near Edge", icon: Radio, angle: 154.29 },
  { id: "far-edge", name: "Far Edge", icon: Wifi, angle: 205.72 },
  { id: "functional-edge", name: "Functional Edge", icon: Cpu, angle: 257.15 },
  { id: "pc", name: "PC", icon: Laptop, angle: 308.58 },
]

// Types for configuration
export type OriginConfig = {
  [locationId: string]: {
    percentage: number
  }
}

export type ExecutionConfig = {
  [originLocationId: string]: {
    [targetLocationId: string]: {
      enabled: boolean
      percentage: number
    }
  }
}

export type SimulationConfig = {
  numSamples: number
  speed: number
  instantMode: boolean
  workloadCountDistribution: WorkloadCountDistribution
}

export type SimulationResult = {
  id: string
  timestamp: string
  name: string
  originConfig: OriginConfig
  executionConfig: ExecutionConfig
  simulationConfig: SimulationConfig
  stats: {
    [locationId: string]: {
      originated: number
      executed: number
    }
  }
}

export default function WorkloadSimulator() {
  // Initialize origin configuration (equal distribution by default)
  const [originConfig, setOriginConfig] = useState<OriginConfig>(() => {
    const config: OriginConfig = {}
    const equalPercentage = Math.floor(100 / locations.length)
    const remaining = 100 - equalPercentage * locations.length

    locations.forEach((location, index) => {
      // Add the remaining percentage to the first location
      const percentage = index === 0 ? equalPercentage + remaining : equalPercentage
      config[location.id] = { percentage }
    })

    return config
  })

  // Initialize execution configuration (all enabled with equal distribution)
  const [executionConfig, setExecutionConfig] = useState<ExecutionConfig>(() => {
    const config: ExecutionConfig = {}

    locations.forEach((originLocation) => {
      config[originLocation.id] = {}
      const equalPercentage = Math.floor(100 / locations.length)
      const remaining = 100 - equalPercentage * locations.length

      locations.forEach((targetLocation, index) => {
        // Add the remaining percentage to the first location
        const percentage = index === 0 ? equalPercentage + remaining : equalPercentage
        config[originLocation.id][targetLocation.id] = {
          enabled: true,
          percentage,
        }
      })
    })

    return config
  })

  // Initialize workload count distribution with a bell curve
  const initialWorkloadCountDistribution = (() => {
    const distribution: WorkloadCountDistribution = {}
    const maxWorkloads = 20

    for (let i = 1; i <= maxWorkloads; i++) {
      // Create a bell curve centered around 5-6 workloads
      const distance = Math.abs(i - 5.5)
      const percentage = Math.max(1, Math.round(20 * Math.exp(-0.3 * distance)))
      distribution[i] = percentage
    }

    // Normalize to ensure sum is 100%
    const total = Object.values(distribution).reduce((sum, value) => sum + value, 0)
    for (const count in distribution) {
      distribution[count] = Math.round((distribution[count] / total) * 100)
    }

    // Handle rounding errors
    const normalizedTotal = Object.values(distribution).reduce((sum, value) => sum + value, 0)
    if (normalizedTotal !== 100) {
      distribution[5] += 100 - normalizedTotal
    }

    return distribution
  })()

  // Simulation configuration
  const [simulationConfig, setSimulationConfig] = useState<SimulationConfig>({
    numSamples: 10000,
    speed: 1,
    instantMode: false,
    workloadCountDistribution: initialWorkloadCountDistribution,
  })

  // Simulation name
  const [simulationName, setSimulationName] = useState("Simulation 1")

  // Simulation results history
  const [simulationHistory, setSimulationHistory] = useState<SimulationResult[]>([])

  // Current simulation state
  const [isRunning, setIsRunning] = useState(false)

  // Handle running a new simulation
  const runSimulation = (name: string) => {
    // Only start a new simulation if one isn't already running
    if (!isRunning) {
      setSimulationName(name)
      setIsRunning(true)
    }
  }

  // Handle saving simulation results
  const handleSaveResults = (stats: SimulationResult["stats"]) => {
    // Create a new simulation result with current configuration
    const newSimulation: SimulationResult = {
      id: `sim-${Date.now()}`,
      timestamp: new Date().toISOString(),
      name: simulationName,
      originConfig: JSON.parse(JSON.stringify(originConfig)), // Deep copy to ensure independence
      executionConfig: JSON.parse(JSON.stringify(executionConfig)),
      simulationConfig: JSON.parse(JSON.stringify(simulationConfig)),
      stats: JSON.parse(JSON.stringify(stats)),
    }

    // Add to history
    setSimulationHistory((prev) => [newSimulation, ...prev])

    // Increment simulation name for next run
    const match = simulationName.match(/^Simulation (\d+)$/)
    if (match) {
      const num = Number.parseInt(match[1], 10)
      setSimulationName(`Simulation ${num + 1}`)
    }
  }

  // Handle simulation completion
  const handleSimulationComplete = () => {
    // Reset the running state when simulation completes
    setIsRunning(false)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-[1600px]">
      {/* Left side: Visualization */}
      <div className="flex-1">
        <WorkloadVisualization
          locations={locations}
          originConfig={originConfig}
          executionConfig={executionConfig}
          simulationConfig={simulationConfig}
          isRunning={isRunning}
          simulationName={simulationName}
          onSaveResults={handleSaveResults}
          onSimulationComplete={handleSimulationComplete}
        />
      </div>

      {/* Right side: Configuration and History */}
      <div className="w-full lg:w-[400px]">
        <ConfigurationPanel
          locations={locations}
          originConfig={originConfig}
          setOriginConfig={setOriginConfig}
          executionConfig={executionConfig}
          setExecutionConfig={setExecutionConfig}
          simulationConfig={simulationConfig}
          setSimulationConfig={setSimulationConfig}
          onRunSimulation={runSimulation}
          isRunning={isRunning}
          simulationName={simulationName}
          setSimulationName={setSimulationName}
        />

        <SimulationHistory history={simulationHistory} locations={locations} />
      </div>
    </div>
  )
}
