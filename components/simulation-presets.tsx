"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Cloud, Home, Wifi, Lightbulb, ArrowRight, MoreVertical, Save, Trash, Edit, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { OriginConfig, ExecutionConfig, SimulationConfig } from "./workload-simulator"

// Define preset types
export type SimulationPreset = {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  originConfig: OriginConfig
  executionConfig: ExecutionConfig
  simulationConfig?: SimulationConfig
  isCustom?: boolean
  timestamp?: string
}

type SimulationPresetsProps = {
  locations: {
    id: string
    name: string
  }[]
  onSelectPreset: (preset: SimulationPreset) => void
  currentConfig: {
    originConfig: OriginConfig
    executionConfig: ExecutionConfig
    simulationConfig: SimulationConfig
  }
}

// Local storage key for custom presets
const CUSTOM_PRESETS_STORAGE_KEY = "ai-workload-custom-presets"

export default function SimulationPresets({ locations, onSelectPreset, currentConfig }: SimulationPresetsProps) {
  const [open, setOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [newPresetName, setNewPresetName] = useState("")
  const [newPresetDescription, setNewPresetDescription] = useState("")
  const [customPresets, setCustomPresets] = useState<SimulationPreset[]>([])
  const { toast } = useToast()

  // Load custom presets from localStorage on component mount
  useEffect(() => {
    const loadCustomPresets = () => {
      try {
        const savedPresets = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY)
        if (savedPresets) {
          const parsedPresets = JSON.parse(savedPresets)
          // Convert stored icon string representation back to React elements
          const presetsWithIcons = parsedPresets.map((preset: any) => ({
            ...preset,
            icon: getIconForPreset(preset.name),
          }))
          setCustomPresets(presetsWithIcons)
        }
      } catch (error) {
        console.error("Failed to load custom presets:", error)
        toast({
          title: "Error Loading Presets",
          description: "There was a problem loading your custom presets.",
          variant: "destructive",
        })
      }
    }

    loadCustomPresets()
  }, [toast])

  // Save custom presets to localStorage
  const saveCustomPresetsToStorage = (presets: SimulationPreset[]) => {
    try {
      // Remove the React icon element before storing
      const presetsForStorage = presets.map((preset) => ({
        ...preset,
        icon: null, // Don't store React elements
      }))
      localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(presetsForStorage))
    } catch (error) {
      console.error("Failed to save custom presets:", error)
      toast({
        title: "Error Saving Presets",
        description: "There was a problem saving your custom presets.",
        variant: "destructive",
      })
    }
  }

  // Helper function to get an icon for a preset based on its name
  const getIconForPreset = (presetName: string) => {
    const name = presetName.toLowerCase()
    if (name.includes("cloud")) {
      return <Cloud className="h-8 w-8 text-blue-500" />
    } else if (name.includes("edge")) {
      return <Wifi className="h-8 w-8 text-orange-500" />
    } else if (name.includes("prem") || name.includes("on-prem")) {
      return <Home className="h-8 w-8 text-green-500" />
    } else {
      return <Star className="h-8 w-8 text-yellow-500" />
    }
  }

  // Create predefined presets
  const builtInPresets: SimulationPreset[] = [
    {
      id: "cloud-centric",
      name: "Cloud-Centric",
      description: "Workloads primarily originate and execute in public cloud environments",
      icon: <Cloud className="h-8 w-8 text-blue-500" />,
      originConfig: createOriginConfig({ "public-cloud": 70, colocation: 20, "on-premises": 10 }),
      executionConfig: createExecutionConfig({
        "public-cloud": { "public-cloud": 80, colocation: 15, "on-premises": 5 },
        colocation: { "public-cloud": 60, colocation: 35, "on-premises": 5 },
        "on-premises": { "public-cloud": 50, colocation: 30, "on-premises": 20 },
        "near-edge": { "public-cloud": 90, "near-edge": 10 },
        "far-edge": { "public-cloud": 95, "far-edge": 5 },
        "functional-edge": { "public-cloud": 85, "functional-edge": 15 },
        pc: { "public-cloud": 100 },
      }),
    },
    {
      id: "edge-heavy",
      name: "Edge-Heavy",
      description: "Workloads primarily originate and execute at edge locations",
      icon: <Wifi className="h-8 w-8 text-orange-500" />,
      originConfig: createOriginConfig({
        "near-edge": 30,
        "far-edge": 25,
        "functional-edge": 25,
        pc: 20,
      }),
      executionConfig: createExecutionConfig({
        "public-cloud": { "near-edge": 40, "far-edge": 30, "functional-edge": 30 },
        colocation: { "near-edge": 50, "far-edge": 30, "functional-edge": 20 },
        "on-premises": { "near-edge": 40, "far-edge": 40, "functional-edge": 20 },
        "near-edge": { "near-edge": 80, "far-edge": 10, "functional-edge": 10 },
        "far-edge": { "near-edge": 10, "far-edge": 80, "functional-edge": 10 },
        "functional-edge": { "near-edge": 10, "far-edge": 10, "functional-edge": 80 },
        pc: { pc: 100 },
      }),
    },
    {
      id: "balanced",
      name: "Balanced Distribution",
      description: "Workloads evenly distributed across all environments",
      icon: <Lightbulb className="h-8 w-8 text-yellow-500" />,
      originConfig: createEvenOriginConfig(),
      executionConfig: createEvenExecutionConfig(),
    },
    {
      id: "edge-to-cloud",
      name: "Edge-to-Cloud",
      description: "Workloads originate at edge but execute in the cloud",
      icon: (
        <div className="flex items-center">
          <Wifi className="h-6 w-6 text-orange-500" />
          <ArrowRight className="h-4 w-4 mx-1" />
          <Cloud className="h-6 w-6 text-blue-500" />
        </div>
      ),
      originConfig: createOriginConfig({
        "near-edge": 30,
        "far-edge": 30,
        "functional-edge": 20,
        pc: 20,
      }),
      executionConfig: createExecutionConfig({
        "public-cloud": { "public-cloud": 100 },
        colocation: { "public-cloud": 80, colocation: 20 },
        "on-premises": { "public-cloud": 70, colocation: 20, "on-premises": 10 },
        "near-edge": { "public-cloud": 70, colocation: 20, "near-edge": 10 },
        "far-edge": { "public-cloud": 80, colocation: 15, "far-edge": 5 },
        "functional-edge": { "public-cloud": 75, colocation: 15, "functional-edge": 10 },
        pc: { "public-cloud": 90, pc: 10 },
      }),
    },
    {
      id: "cloud-to-edge",
      name: "Cloud-to-Edge",
      description: "Workloads originate in the cloud but execute at edge locations",
      icon: (
        <div className="flex items-center">
          <Cloud className="h-6 w-6 text-blue-500" />
          <ArrowRight className="h-4 w-4 mx-1" />
          <Wifi className="h-6 w-6 text-orange-500" />
        </div>
      ),
      originConfig: createOriginConfig({
        "public-cloud": 60,
        colocation: 25,
        "on-premises": 15,
      }),
      executionConfig: createExecutionConfig({
        "public-cloud": { "near-edge": 30, "far-edge": 30, "functional-edge": 30, pc: 10 },
        colocation: { "near-edge": 35, "far-edge": 35, "functional-edge": 30 },
        "on-premises": { "near-edge": 40, "far-edge": 30, "functional-edge": 30 },
        "near-edge": { "near-edge": 100 },
        "far-edge": { "far-edge": 100 },
        "functional-edge": { "functional-edge": 100 },
        pc: { pc: 100 },
      }),
    },
    {
      id: "hybrid-cloud",
      name: "Hybrid Cloud",
      description: "Workloads distributed between cloud and on-premises environments",
      icon: (
        <div className="flex items-center">
          <Cloud className="h-6 w-6 text-blue-500" />
          <Home className="h-6 w-6 ml-1 text-green-500" />
        </div>
      ),
      originConfig: createOriginConfig({
        "public-cloud": 40,
        colocation: 20,
        "on-premises": 40,
      }),
      executionConfig: createExecutionConfig({
        "public-cloud": { "public-cloud": 60, "on-premises": 40 },
        colocation: { "public-cloud": 50, colocation: 20, "on-premises": 30 },
        "on-premises": { "public-cloud": 40, "on-premises": 60 },
        "near-edge": { "public-cloud": 50, "on-premises": 50 },
        "far-edge": { "public-cloud": 50, "on-premises": 50 },
        "functional-edge": { "public-cloud": 50, "on-premises": 50 },
        pc: { "public-cloud": 50, "on-premises": 50 },
      }),
    },
    {
      id: "on-prem-protectionist",
      name: "On-Prem Protectionist",
      description: "Strict security boundaries between on-premises and public cloud environments",
      icon: (
        <div className="flex items-center">
          <Home className="h-6 w-6 text-green-500" />
          <div className="mx-1 h-4 w-4 flex items-center justify-center">
            <div className="h-4 w-0.5 bg-red-500 rotate-45"></div>
          </div>
          <Cloud className="h-6 w-6 text-blue-500" />
        </div>
      ),
      originConfig: createOriginConfig({
        "public-cloud": 30,
        colocation: 15,
        "on-premises": 30,
        "near-edge": 10,
        "far-edge": 5,
        "functional-edge": 5,
        pc: 5,
      }),
      executionConfig: createExecutionConfig({
        // Public cloud cannot send workloads to on-premises
        "public-cloud": {
          "public-cloud": 60,
          colocation: 20,
          "near-edge": 10,
          "far-edge": 5,
          "functional-edge": 5,
        },
        // Colocation can send to both but favors public cloud
        colocation: {
          "public-cloud": 40,
          colocation: 40,
          "on-premises": 10,
          "near-edge": 5,
          "far-edge": 5,
        },
        // On-premises cannot send workloads to public cloud
        "on-premises": {
          "on-premises": 70,
          colocation: 15,
          "near-edge": 5,
          "far-edge": 5,
          "functional-edge": 5,
        },
        // Edge locations can send to both but favor their own type
        "near-edge": {
          "near-edge": 50,
          "far-edge": 20,
          "functional-edge": 10,
          "on-premises": 10,
          colocation: 10,
        },
        "far-edge": {
          "far-edge": 50,
          "near-edge": 20,
          "functional-edge": 10,
          "on-premises": 10,
          colocation: 10,
        },
        "functional-edge": {
          "functional-edge": 50,
          "near-edge": 20,
          "far-edge": 10,
          "on-premises": 10,
          colocation: 10,
        },
        // PC favors on-premises
        pc: {
          pc: 40,
          "on-premises": 40,
          "near-edge": 10,
          "far-edge": 10,
        },
      }),
    },
  ]

  // Combine built-in and custom presets
  const allPresets = [...builtInPresets, ...customPresets]

  // Helper function to create origin config with specified percentages
  function createOriginConfig(percentages: Record<string, number>): OriginConfig {
    const config: OriginConfig = {}

    // Initialize all locations with 0%
    locations.forEach((location) => {
      config[location.id] = { percentage: 0 }
    })

    // Set specified percentages
    Object.entries(percentages).forEach(([locationId, percentage]) => {
      if (config[locationId]) {
        config[locationId].percentage = percentage
      }
    })

    return config
  }

  // Helper function to create even origin config
  function createEvenOriginConfig(): OriginConfig {
    const config: OriginConfig = {}
    const equalPercentage = Math.floor(100 / locations.length)
    const remaining = 100 - equalPercentage * locations.length

    locations.forEach((location, index) => {
      // Add the remaining percentage to the first location
      const percentage = index === 0 ? equalPercentage + remaining : equalPercentage
      config[location.id] = { percentage }
    })

    return config
  }

  // Helper function to create execution config with specified percentages
  function createExecutionConfig(originToTargetPercentages: Record<string, Record<string, number>>): ExecutionConfig {
    const config: ExecutionConfig = {}

    // Initialize all origins
    locations.forEach((originLocation) => {
      config[originLocation.id] = {}

      // Initialize all targets for this origin as disabled
      locations.forEach((targetLocation) => {
        config[originLocation.id][targetLocation.id] = {
          enabled: false,
          percentage: 0,
        }
      })
    })

    // Set specified percentages and enable those targets
    Object.entries(originToTargetPercentages).forEach(([originId, targetPercentages]) => {
      if (config[originId]) {
        Object.entries(targetPercentages).forEach(([targetId, percentage]) => {
          if (config[originId][targetId]) {
            config[originId][targetId] = {
              enabled: true,
              percentage,
            }
          }
        })
      }
    })

    return config
  }

  // Helper function to create even execution config
  function createEvenExecutionConfig(): ExecutionConfig {
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
  }

  // Handle preset selection
  const handleSelectPreset = (preset: SimulationPreset) => {
    onSelectPreset(preset)
    setOpen(false)
  }

  // Handle saving current configuration as a new preset
  const handleSaveAsNewPreset = () => {
    if (!newPresetName.trim()) {
      toast({
        title: "Name Required",
        description: "Please provide a name for your preset.",
        variant: "destructive",
      })
      return
    }

    // Check if name already exists
    const nameExists = allPresets.some((preset) => preset.name.toLowerCase() === newPresetName.toLowerCase())
    if (nameExists) {
      toast({
        title: "Name Already Exists",
        description: "Please choose a different name for your preset.",
        variant: "destructive",
      })
      return
    }

    const newPreset: SimulationPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName,
      description: newPresetDescription || `Custom preset created on ${new Date().toLocaleDateString()}`,
      icon: getIconForPreset(newPresetName),
      originConfig: JSON.parse(JSON.stringify(currentConfig.originConfig)),
      executionConfig: JSON.parse(JSON.stringify(currentConfig.executionConfig)),
      simulationConfig: JSON.parse(JSON.stringify(currentConfig.simulationConfig)),
      isCustom: true,
      timestamp: new Date().toISOString(),
    }

    const updatedCustomPresets = [...customPresets, newPreset]
    setCustomPresets(updatedCustomPresets)
    saveCustomPresetsToStorage(updatedCustomPresets)

    toast({
      title: "Preset Saved",
      description: `Your preset "${newPresetName}" has been saved.`,
    })

    // Reset form and close dialog
    setNewPresetName("")
    setNewPresetDescription("")
    setSaveDialogOpen(false)
  }

  // Handle updating an existing custom preset
  const handleUpdatePreset = (presetId: string) => {
    const presetIndex = customPresets.findIndex((preset) => preset.id === presetId)
    if (presetIndex === -1) {
      toast({
        title: "Preset Not Found",
        description: "The preset you're trying to update could not be found.",
        variant: "destructive",
      })
      return
    }

    const updatedPreset = {
      ...customPresets[presetIndex],
      originConfig: JSON.parse(JSON.stringify(currentConfig.originConfig)),
      executionConfig: JSON.parse(JSON.stringify(currentConfig.executionConfig)),
      simulationConfig: JSON.parse(JSON.stringify(currentConfig.simulationConfig)),
      timestamp: new Date().toISOString(),
    }

    const updatedCustomPresets = [...customPresets]
    updatedCustomPresets[presetIndex] = updatedPreset

    setCustomPresets(updatedCustomPresets)
    saveCustomPresetsToStorage(updatedCustomPresets)

    toast({
      title: "Preset Updated",
      description: `Your preset "${updatedPreset.name}" has been updated.`,
    })
  }

  // Handle deleting a custom preset
  const handleDeletePreset = () => {
    if (!selectedPresetId) return

    const updatedCustomPresets = customPresets.filter((preset) => preset.id !== selectedPresetId)
    setCustomPresets(updatedCustomPresets)
    saveCustomPresetsToStorage(updatedCustomPresets)

    toast({
      title: "Preset Deleted",
      description: "The preset has been deleted.",
    })

    setDeleteDialogOpen(false)
    setSelectedPresetId(null)
  }

  // Handle editing a custom preset name and description
  const handleEditPreset = (presetId: string, newName: string, newDescription: string) => {
    const presetIndex = customPresets.findIndex((preset) => preset.id === presetId)
    if (presetIndex === -1) return

    const updatedPreset = {
      ...customPresets[presetIndex],
      name: newName,
      description: newDescription,
      icon: getIconForPreset(newName),
    }

    const updatedCustomPresets = [...customPresets]
    updatedCustomPresets[presetIndex] = updatedPreset

    setCustomPresets(updatedCustomPresets)
    saveCustomPresetsToStorage(updatedCustomPresets)

    toast({
      title: "Preset Updated",
      description: `Your preset has been renamed to "${newName}".`,
    })
  }

  return (
    <>
      <div className="flex gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1">
              <Lightbulb className="mr-2 h-4 w-4" />
              Load Preset
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Simulation Presets</DialogTitle>
              <DialogDescription>
                Select a predefined configuration to quickly set up your simulation.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {allPresets.map((preset) => (
                <Card
                  key={preset.id}
                  className={`p-4 cursor-pointer hover:border-blue-500 transition-colors ${
                    preset.isCustom ? "border-yellow-300" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="mr-3">{preset.icon}</div>
                      <h3 className="font-medium text-lg">{preset.name}</h3>
                    </div>
                    {preset.isCustom && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdatePreset(preset.id)
                            }}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Update with Current Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              // Open edit dialog (not implemented in this example)
                              // You could add a state and dialog for editing
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedPresetId(preset.id)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{preset.description}</p>
                  {preset.isCustom && preset.timestamp && (
                    <p className="text-xs text-gray-400 mt-2">
                      Last modified: {new Date(preset.timestamp).toLocaleString()}
                    </p>
                  )}
                  <Button className="w-full mt-3" variant="outline" onClick={() => handleSelectPreset(preset)}>
                    Load Preset
                  </Button>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" className="flex-1" onClick={() => setSaveDialogOpen(true)}>
          <Save className="mr-2 h-4 w-4" />
          Save as Preset
        </Button>
      </div>

      {/* Save As Preset Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Preset</DialogTitle>
            <DialogDescription>Save your current configuration as a preset for future use.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="My Custom Preset"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preset-description">Description (Optional)</Label>
              <Textarea
                id="preset-description"
                placeholder="Describe your preset configuration..."
                value={newPresetDescription}
                onChange={(e) => setNewPresetDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsNewPreset}>Save Preset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this preset. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePreset} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
