"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, AlertCircle, Play } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { OriginConfig, ExecutionConfig, SimulationConfig } from "./workload-simulator"
import SimulationPresets, { type SimulationPreset } from "./simulation-presets"
import WorkloadCountDistribution from "./workload-count-distribution"

type ConfigurationPanelProps = {
  locations: {
    id: string
    name: string
    icon: LucideIcon
  }[]
  originConfig: OriginConfig
  setOriginConfig: React.Dispatch<React.SetStateAction<OriginConfig>>
  executionConfig: ExecutionConfig
  setExecutionConfig: React.Dispatch<React.SetStateAction<ExecutionConfig>>
  simulationConfig: SimulationConfig
  setSimulationConfig: React.Dispatch<React.SetStateAction<SimulationConfig>>
  onRunSimulation: (name: string) => void
  isRunning: boolean
  simulationName: string
  setSimulationName: React.Dispatch<React.SetStateAction<string>>
}

// Speed options
const speedOptions = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1028]

export default function ConfigurationPanel({
  locations,
  originConfig,
  setOriginConfig,
  executionConfig,
  setExecutionConfig,
  simulationConfig,
  setSimulationConfig,
  onRunSimulation,
  isRunning,
  simulationName,
  setSimulationName,
}: ConfigurationPanelProps) {
  const [activeTab, setActiveTab] = useState("simulation")
  const [activeOrigin, setActiveOrigin] = useState(locations[0]?.id || "")

  // Calculate total percentage for origination
  const originTotal = Object.values(originConfig).reduce((sum, config) => sum + (config.percentage || 0), 0)

  // Calculate total percentage for execution from the active origin
  const executionTotal = activeOrigin
    ? Object.values(executionConfig[activeOrigin] || {}).reduce(
        (sum, config) => sum + (config.enabled ? config.percentage : 0),
        0,
      )
    : 0

  // Update origination percentage
  const updateOriginPercentage = (locationId: string, value: number) => {
    setOriginConfig((prev) => ({
      ...prev,
      [locationId]: {
        ...prev[locationId],
        percentage: Math.max(0, Math.min(100, value)),
      },
    }))
  }

  // Update execution toggle
  const updateExecutionEnabled = (originId: string, targetId: string, enabled: boolean) => {
    setExecutionConfig((prev) => ({
      ...prev,
      [originId]: {
        ...prev[originId],
        [targetId]: {
          ...prev[originId]?.[targetId],
          enabled,
        },
      },
    }))
  }

  // Update execution percentage
  const updateExecutionPercentage = (originId: string, targetId: string, value: number) => {
    setExecutionConfig((prev) => ({
      ...prev,
      [originId]: {
        ...prev[originId],
        [targetId]: {
          ...prev[originId]?.[targetId],
          percentage: Math.max(0, Math.min(100, value)),
        },
      },
    }))
  }

  // Distribute remaining percentage evenly
  const distributeRemaining = (type: "origin" | "execution") => {
    if (type === "origin") {
      const enabledLocations = locations.length
      if (enabledLocations === 0) return

      const equalPercentage = Math.floor(100 / enabledLocations)
      const remaining = 100 - equalPercentage * enabledLocations

      setOriginConfig((prev) => {
        const newConfig = { ...prev }
        locations.forEach((location, index) => {
          const percentage = index === 0 ? equalPercentage + remaining : equalPercentage
          newConfig[location.id] = {
            ...newConfig[location.id],
            percentage,
          }
        })
        return newConfig
      })
    } else if (type === "execution" && activeOrigin) {
      const enabledLocations = Object.values(executionConfig[activeOrigin] || {}).filter(
        (config) => config.enabled,
      ).length
      if (enabledLocations === 0) return

      const equalPercentage = Math.floor(100 / enabledLocations)
      const remaining = 100 - equalPercentage * enabledLocations

      setExecutionConfig((prev) => {
        const newConfig = { ...prev }
        let index = 0

        locations.forEach((location) => {
          if (newConfig[activeOrigin]?.[location.id]?.enabled) {
            const percentage = index === 0 ? equalPercentage + remaining : equalPercentage
            newConfig[activeOrigin] = {
              ...newConfig[activeOrigin],
              [location.id]: {
                ...newConfig[activeOrigin][location.id],
                percentage,
              },
            }
            index++
          }
        })

        return newConfig
      })
    }
  }

  // Update simulation config
  const updateSimulationConfig = (key: keyof SimulationConfig, value: any) => {
    setSimulationConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Handle run simulation
  const handleRunSimulation = () => {
    onRunSimulation(simulationName)
  }

  // Handle preset selection
  const handleSelectPreset = (preset: SimulationPreset) => {
    // Update the origin configuration
    setOriginConfig(preset.originConfig)

    // Update the execution configuration
    setExecutionConfig(preset.executionConfig)

    // Update simulation configuration if available in the preset
    if (preset.simulationConfig) {
      setSimulationConfig(preset.simulationConfig)
    }

    // Update the simulation name based on the preset
    setSimulationName(`${preset.name} Simulation`)

    // Switch to the simulation tab
    setActiveTab("simulation")
  }

  // Handle workload count distribution update
  const handleWorkloadDistributionChange = (distribution: any) => {
    updateSimulationConfig("workloadCountDistribution", distribution)
  }

  // Get current configuration for preset saving
  const currentConfig = {
    originConfig,
    executionConfig,
    simulationConfig,
  }

  return (
    <Card className="w-full p-4 mb-4 sticky top-4">
      <h2 className="text-xl font-semibold mb-4">Configuration</h2>

      <div className="mb-4">
        <SimulationPresets locations={locations} onSelectPreset={handleSelectPreset} currentConfig={currentConfig} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="origination">Origination</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
          <TabsTrigger value="workloads">Workloads</TabsTrigger>
        </TabsList>

        <TabsContent value="simulation" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="simulation-name">Simulation Name</Label>
              <Input
                id="simulation-name"
                value={simulationName}
                onChange={(e) => setSimulationName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="num-samples">Number of Samples</Label>
              <Input
                id="num-samples"
                type="number"
                min="1"
                max="1000000"
                value={simulationConfig.numSamples}
                onChange={(e) => updateSimulationConfig("numSamples", Number.parseInt(e.target.value) || 10000)}
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <Label htmlFor="speed-slider">Simulation Speed</Label>
                <span className="text-sm font-medium">
                  {simulationConfig.instantMode ? "Instantaneous" : `${simulationConfig.speed}x`}
                </span>
              </div>

              <div className="mt-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={simulationConfig.instantMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSimulationConfig("instantMode", true)}
                  >
                    Instant
                  </Button>

                  {speedOptions.map((speed) => (
                    <Button
                      key={speed}
                      variant={
                        !simulationConfig.instantMode && simulationConfig.speed === speed ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        updateSimulationConfig("instantMode", false)
                        updateSimulationConfig("speed", speed)
                      }}
                    >
                      {speed}x
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Button className="w-full mt-4" disabled={isRunning} onClick={handleRunSimulation}>
              <Play className="mr-2 h-4 w-4" />
              Run Simulation
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="origination" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Configure Origination Percentages</h3>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${originTotal === 100 ? "text-green-600" : "text-red-600"}`}>
                Total: {originTotal}%{originTotal !== 100 && <AlertCircle className="inline ml-1 h-4 w-4" />}
              </span>
              <Button variant="outline" size="sm" onClick={() => distributeRemaining("origin")}>
                Distribute Evenly
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {locations.map((location) => {
              const config = originConfig[location.id] || { percentage: 0 }
              const Icon = location.icon

              return (
                <div key={location.id} className="flex items-center p-3 border rounded-md">
                  <div className="mr-3">
                    <Icon className="h-6 w-6 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{location.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1">
                        <Label htmlFor={`origin-${location.id}`} className="sr-only">
                          Percentage
                        </Label>
                        <div className="flex items-center">
                          <Input
                            id={`origin-${location.id}`}
                            type="number"
                            min="0"
                            max="100"
                            value={config.percentage}
                            onChange={(e) => updateOriginPercentage(location.id, Number.parseInt(e.target.value) || 0)}
                            className="w-16 text-right"
                          />
                          <span className="ml-1">%</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateOriginPercentage(location.id, (config.percentage || 0) + 1)}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateOriginPercentage(location.id, (config.percentage || 0) - 1)}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="execution" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-medium">Configure Execution Distribution</h3>
              <p className="text-sm text-gray-500">Select an origin location to configure its execution distribution</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {locations.map((location) => {
                const Icon = location.icon
                return (
                  <Button
                    key={location.id}
                    variant={activeOrigin === location.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveOrigin(location.id)}
                    className="flex items-center gap-1"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden md:inline">{location.name}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {activeOrigin && (
            <>
              <div className="flex justify-between items-center">
                <h4 className="font-medium">
                  Execution from: {locations.find((loc) => loc.id === activeOrigin)?.name}
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${executionTotal === 100 ? "text-green-600" : "text-red-600"}`}>
                    Total: {executionTotal}%{executionTotal !== 100 && <AlertCircle className="inline ml-1 h-4 w-4" />}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => distributeRemaining("execution")}>
                    Distribute Evenly
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {locations.map((location) => {
                  const config = executionConfig[activeOrigin]?.[location.id] || { enabled: false, percentage: 0 }
                  const Icon = location.icon

                  return (
                    <div key={location.id} className="flex items-center p-3 border rounded-md">
                      <div className="mr-3">
                        <Icon className="h-6 w-6 text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <div className="font-medium">{location.name}</div>
                          <Switch
                            checked={config.enabled}
                            onCheckedChange={(checked) => updateExecutionEnabled(activeOrigin, location.id, checked)}
                          />
                        </div>
                        {config.enabled && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1">
                              <Label htmlFor={`exec-${activeOrigin}-${location.id}`} className="sr-only">
                                Percentage
                              </Label>
                              <div className="flex items-center">
                                <Input
                                  id={`exec-${activeOrigin}-${location.id}`}
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={config.percentage}
                                  onChange={(e) =>
                                    updateExecutionPercentage(
                                      activeOrigin,
                                      location.id,
                                      Number.parseInt(e.target.value) || 0,
                                    )
                                  }
                                  className="w-16 text-right"
                                />
                                <span className="ml-1">%</span>
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  updateExecutionPercentage(activeOrigin, location.id, (config.percentage || 0) + 1)
                                }
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  updateExecutionPercentage(activeOrigin, location.id, (config.percentage || 0) - 1)
                                }
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="workloads" className="space-y-4">
          <WorkloadCountDistribution
            distribution={simulationConfig.workloadCountDistribution}
            onChange={handleWorkloadDistributionChange}
            maxWorkloads={20}
          />
        </TabsContent>
      </Tabs>
    </Card>
  )
}
