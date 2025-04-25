"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { AlertCircle, BarChart3, ChevronUp, ChevronDown } from "lucide-react"
import { Card } from "@/components/ui/card"

export type WorkloadCountDistribution = {
  [count: number]: number // count -> percentage
}

type WorkloadCountDistributionProps = {
  distribution: WorkloadCountDistribution
  onChange: (distribution: WorkloadCountDistribution) => void
  maxWorkloads?: number
}

export default function WorkloadCountDistribution({
  distribution,
  onChange,
  maxWorkloads = 20,
}: WorkloadCountDistributionProps) {
  const [expanded, setExpanded] = useState(false)
  const [localDistribution, setLocalDistribution] = useState<WorkloadCountDistribution>(distribution)

  // Initialize with default values if not provided
  useEffect(() => {
    const counts = Object.keys(distribution).map(Number)
    if (counts.length === 0) {
      // Default to bell curve-like distribution if no distribution is provided
      const defaultDistribution: WorkloadCountDistribution = {}
      for (let i = 1; i <= maxWorkloads; i++) {
        // Create a bell curve centered around 5-6 workloads
        const distance = Math.abs(i - 5.5)
        const percentage = Math.max(1, Math.round(20 * Math.exp(-0.3 * distance)))
        defaultDistribution[i] = percentage
      }

      // Normalize to ensure sum is 100%
      normalizeDistribution(defaultDistribution)
      setLocalDistribution(defaultDistribution)
      onChange(defaultDistribution)
    } else {
      setLocalDistribution(distribution)
    }
  }, [])

  // Calculate total percentage
  const totalPercentage = Object.values(localDistribution).reduce((sum, value) => sum + value, 0)

  // Update a specific count's percentage
  const updatePercentage = (count: number, percentage: number) => {
    const newDistribution = { ...localDistribution }
    newDistribution[count] = Math.max(0, Math.min(100, percentage))
    setLocalDistribution(newDistribution)
    onChange(newDistribution)
  }

  // Normalize distribution to ensure sum is 100%
  const normalizeDistribution = (dist: WorkloadCountDistribution = localDistribution) => {
    const total = Object.values(dist).reduce((sum, value) => sum + value, 0)
    if (total === 0) return dist

    const normalized: WorkloadCountDistribution = {}
    for (const [count, percentage] of Object.entries(dist)) {
      normalized[Number(count)] = Math.round((percentage / total) * 100)
    }

    // Handle rounding errors to ensure sum is exactly 100
    const normalizedTotal = Object.values(normalized).reduce((sum, value) => sum + value, 0)
    if (normalizedTotal !== 100) {
      // Find the largest value and adjust it
      let maxCount = 1
      let maxPercentage = 0
      for (const [count, percentage] of Object.entries(normalized)) {
        if (percentage > maxPercentage) {
          maxCount = Number(count)
          maxPercentage = percentage
        }
      }
      normalized[maxCount] += 100 - normalizedTotal
    }

    return normalized
  }

  // Distribute evenly
  const distributeEvenly = () => {
    const newDistribution: WorkloadCountDistribution = {}
    const equalPercentage = Math.floor(100 / maxWorkloads)
    const remaining = 100 - equalPercentage * maxWorkloads

    for (let i = 1; i <= maxWorkloads; i++) {
      newDistribution[i] = i === 1 ? equalPercentage + remaining : equalPercentage
    }

    setLocalDistribution(newDistribution)
    onChange(newDistribution)
  }

  // Apply bell curve distribution
  const applyBellCurve = () => {
    const newDistribution: WorkloadCountDistribution = {}
    const center = maxWorkloads / 2

    for (let i = 1; i <= maxWorkloads; i++) {
      // Create a bell curve centered around the middle
      const distance = Math.abs(i - center)
      const percentage = Math.max(1, Math.round(20 * Math.exp(-0.2 * distance)))
      newDistribution[i] = percentage
    }

    // Normalize to ensure sum is 100%
    const normalized = normalizeDistribution(newDistribution)
    setLocalDistribution(normalized)
    onChange(normalized)
  }

  // Apply normalized distribution
  const applyNormalized = () => {
    const normalized = normalizeDistribution()
    setLocalDistribution(normalized)
    onChange(normalized)
  }

  // Get the maximum percentage for scaling the chart
  const maxPercentage = Math.max(...Object.values(localDistribution), 1)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Workload Count Distribution</h3>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${totalPercentage === 100 ? "text-green-600" : "text-red-600"}`}>
            Total: {totalPercentage}%{totalPercentage !== 100 && <AlertCircle className="inline ml-1 h-4 w-4" />}
          </span>
          <Button variant="outline" size="sm" onClick={applyNormalized}>
            Normalize
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={distributeEvenly}>
          Distribute Evenly
        </Button>
        <Button variant="outline" size="sm" onClick={applyBellCurve}>
          Bell Curve
        </Button>
        <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Collapse" : "Expand"} Details
          {expanded ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
        </Button>
      </div>

      {/* Visual representation of the distribution */}
      <Card className="p-4">
        <div className="flex items-end h-40 gap-1">
          {Array.from({ length: maxWorkloads }, (_, i) => i + 1).map((count) => {
            const percentage = localDistribution[count] || 0
            const height = `${Math.max(5, (percentage / maxPercentage) * 100)}%`

            return (
              <div
                key={count}
                className="flex-1 flex flex-col items-center"
                title={`${count} workload${count !== 1 ? "s" : ""}: ${percentage}%`}
              >
                <div className="w-full flex justify-center mb-1">
                  <div className="bg-blue-500 rounded-t-sm w-full" style={{ height }}></div>
                </div>
                {count % 5 === 0 || count === 1 || count === maxWorkloads ? (
                  <span className="text-xs">{count}</span>
                ) : null}
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-xs text-gray-500">Workload Count</span>
          <span className="text-xs text-gray-500">
            <BarChart3 className="inline h-3 w-3 mr-1" />
            Probability Distribution
          </span>
        </div>
      </Card>

      {/* Detailed controls when expanded */}
      {expanded && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {Array.from({ length: maxWorkloads }, (_, i) => i + 1).map((count) => {
            const percentage = localDistribution[count] || 0

            return (
              <div key={count} className="space-y-2">
                <Label htmlFor={`workload-count-${count}`} className="text-sm flex justify-between">
                  <span>
                    {count} workload{count !== 1 ? "s" : ""}
                  </span>
                  <span>{percentage}%</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id={`workload-count-${count}`}
                    min={0}
                    max={100}
                    step={1}
                    value={[percentage]}
                    onValueChange={(values) => updatePercentage(count, values[0])}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={percentage}
                    onChange={(e) => updatePercentage(count, Number.parseInt(e.target.value) || 0)}
                    className="w-16 text-right"
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
