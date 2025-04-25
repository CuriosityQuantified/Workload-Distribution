"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Clock, FileJson, FileSpreadsheet } from "lucide-react"
import type { SimulationResult } from "./workload-simulator"
import type { LucideIcon } from "lucide-react"

type SimulationHistoryProps = {
  history: SimulationResult[]
  locations: {
    id: string
    name: string
    icon: LucideIcon
  }[]
}

export default function SimulationHistory({ history, locations }: SimulationHistoryProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [exportStatus, setExportStatus] = useState<Record<string, string>>({})

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Export simulation results as JSON
  const exportSimulationAsJSON = (simulation: SimulationResult) => {
    try {
      // Create a complete export object with all simulation data
      const exportData = {
        name: simulation.name,
        timestamp: simulation.timestamp,
        configuration: {
          origin: simulation.originConfig,
          execution: simulation.executionConfig,
          simulation: simulation.simulationConfig,
        },
        statistics: simulation.stats,
        metadata: {
          exportedAt: new Date().toISOString(),
          version: "1.0",
        },
      }

      // Convert to JSON string with pretty formatting
      const dataStr = JSON.stringify(exportData, null, 2)

      // Create a Blob with the JSON data
      const blob = new Blob([dataStr], { type: "application/json" })

      // Create a URL for the Blob
      const url = URL.createObjectURL(blob)

      // Create a filename based on the simulation name and timestamp
      const exportFileDefaultName = `${simulation.name.replace(/\s+/g, "-")}-${new Date().getTime()}.json`

      // Create a temporary link element to trigger the download
      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", url)
      linkElement.setAttribute("download", exportFileDefaultName)

      // Append to the document, click it, and remove it
      document.body.appendChild(linkElement)
      linkElement.click()
      document.body.removeChild(linkElement)

      // Clean up the URL object
      URL.revokeObjectURL(url)

      // Update export status
      setExportStatus((prev) => ({
        ...prev,
        [simulation.id]: "JSON exported successfully",
      }))

      // Clear the status message after 3 seconds
      setTimeout(() => {
        setExportStatus((prev) => {
          const newStatus = { ...prev }
          delete newStatus[simulation.id]
          return newStatus
        })
      }, 3000)
    } catch (error) {
      console.error("JSON export failed:", error)
      setExportStatus((prev) => ({
        ...prev,
        [simulation.id]: "JSON export failed",
      }))

      // Clear the error message after 3 seconds
      setTimeout(() => {
        setExportStatus((prev) => {
          const newStatus = { ...prev }
          delete newStatus[simulation.id]
          return newStatus
        })
      }, 3000)
    }
  }

  // Export simulation results as CSV
  const exportSimulationAsCSV = (simulation: SimulationResult) => {
    try {
      // Start building CSV content
      const csvContent = []

      // Add metadata as comments
      csvContent.push(`# Simulation: ${simulation.name}`)
      csvContent.push(`# Date: ${new Date(simulation.timestamp).toLocaleString()}`)
      csvContent.push(`# Samples: ${simulation.simulationConfig.numSamples}`)
      csvContent.push(
        `# Speed: ${simulation.simulationConfig.instantMode ? "Instant" : simulation.simulationConfig.speed + "x"}`,
      )
      csvContent.push(`# Exported: ${new Date().toLocaleString()}`)
      csvContent.push("")

      // Add summary statistics section
      csvContent.push("## SUMMARY STATISTICS")
      csvContent.push("Location,Originated,Executed,Origin %")

      // Add a row for each location with its statistics
      locations.forEach((location) => {
        const stats = simulation.stats[location.id] || { originated: 0, executed: 0 }
        const originPercentage = simulation.originConfig[location.id]?.percentage || 0
        csvContent.push(`${location.name},${stats.originated},${stats.executed},${originPercentage}`)
      })

      csvContent.push("")

      // Add execution distribution section
      csvContent.push("## EXECUTION DISTRIBUTION")

      // Create header row with all locations
      let headerRow = "Origin Location"
      locations.forEach((location) => {
        headerRow += `,${location.name} %`
      })
      csvContent.push(headerRow)

      // Add a row for each origin location with its execution distribution
      locations.forEach((originLocation) => {
        let row = originLocation.name

        // Add execution percentage for each target location
        locations.forEach((targetLocation) => {
          const execConfig = simulation.executionConfig[originLocation.id]?.[targetLocation.id]
          const percentage = execConfig?.enabled ? execConfig.percentage : 0
          row += `,${percentage}`
        })

        csvContent.push(row)
      })

      csvContent.push("")

      // Add raw data section for detailed analysis
      csvContent.push("## RAW DATA")
      csvContent.push("Location ID,Location Name,Originated,Executed,Origin %")

      // Add a row for each location with all data
      locations.forEach((location) => {
        const stats = simulation.stats[location.id] || { originated: 0, executed: 0 }
        const originPercentage = simulation.originConfig[location.id]?.percentage || 0
        csvContent.push(`${location.id},${location.name},${stats.originated},${stats.executed},${originPercentage}`)
      })

      // Join all rows with newlines
      const csvString = csvContent.join("\n")

      // Create a Blob with the CSV data
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8" })

      // Create a URL for the Blob
      const url = URL.createObjectURL(blob)

      // Create a filename based on the simulation name and timestamp
      const exportFileDefaultName = `${simulation.name.replace(/\s+/g, "-")}-${new Date().getTime()}.csv`

      // Create a temporary link element to trigger the download
      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", url)
      linkElement.setAttribute("download", exportFileDefaultName)

      // Append to the document, click it, and remove it
      document.body.appendChild(linkElement)
      linkElement.click()
      document.body.removeChild(linkElement)

      // Clean up the URL object
      URL.revokeObjectURL(url)

      // Update export status
      setExportStatus((prev) => ({
        ...prev,
        [simulation.id]: "CSV exported successfully",
      }))

      // Clear the status message after 3 seconds
      setTimeout(() => {
        setExportStatus((prev) => {
          const newStatus = { ...prev }
          delete newStatus[simulation.id]
          return newStatus
        })
      }, 3000)
    } catch (error) {
      console.error("CSV export failed:", error)
      setExportStatus((prev) => ({
        ...prev,
        [simulation.id]: "CSV export failed",
      }))

      // Clear the error message after 3 seconds
      setTimeout(() => {
        setExportStatus((prev) => {
          const newStatus = { ...prev }
          delete newStatus[simulation.id]
          return newStatus
        })
      }, 3000)
    }
  }

  if (history.length === 0) {
    return (
      <Card className="w-full p-4 mt-4">
        <h2 className="text-xl font-semibold mb-2">Simulation History</h2>
        <p className="text-gray-500">No simulations have been run yet.</p>
      </Card>
    )
  }

  return (
    <Card className="w-full p-4 mt-4">
      <h2 className="text-xl font-semibold mb-4">Simulation History</h2>

      <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="w-full">
        {history.map((simulation) => (
          <AccordionItem key={simulation.id} value={simulation.id}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex flex-col items-start text-left">
                <div className="font-medium text-gray-800">{simulation.name}</div>
                <div className="text-sm text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDate(simulation.timestamp)}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="text-sm">
                    <span className="font-medium">Samples:</span> {simulation.simulationConfig.numSamples}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportSimulationAsJSON(simulation)}
                      className="flex items-center gap-1"
                    >
                      <FileJson className="h-4 w-4" />
                      JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportSimulationAsCSV(simulation)}
                      className="flex items-center gap-1"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV
                    </Button>
                    {exportStatus[simulation.id] && (
                      <span
                        className={`text-xs ${
                          exportStatus[simulation.id].includes("success") ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {exportStatus[simulation.id]}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {locations.map((location) => {
                      const stats = simulation.stats[location.id] || { originated: 0, executed: 0 }
                      const Icon = location.icon

                      return (
                        <div key={location.id} className="flex items-center p-2 border rounded-md">
                          <div className="mr-2">
                            <Icon className="h-5 w-5 text-gray-700" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">{location.name}</div>
                            <div className="text-xs text-gray-600 flex justify-between">
                              <span>
                                <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
                                Originated: {stats.originated}
                              </span>
                              <span>
                                <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-1"></span>
                                Executed: {stats.executed}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Configuration</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="p-2 border rounded-md">
                      <div className="text-sm font-medium text-gray-800">Simulation Settings</div>
                      <div className="text-xs text-gray-600">
                        <div>Samples: {simulation.simulationConfig.numSamples}</div>
                        <div>
                          Speed:{" "}
                          {simulation.simulationConfig.instantMode
                            ? "Instant"
                            : `${simulation.simulationConfig.speed}x`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  )
}
