import { Card } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

type StatsProps = {
  stats: {
    [locationId: string]: {
      originated: number
      executed: number
    }
  }
  locations: {
    id: string
    name: string
    icon: LucideIcon
  }[]
}

export default function StatsPanel({ stats, locations }: StatsProps) {
  return (
    <Card className="w-full mt-6 p-4">
      <h2 className="text-xl font-bold mb-4">Workload Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((location) => {
          const locationStats = stats[location.id]
          const Icon = location.icon

          return (
            <div key={location.id} className="flex items-center p-3 border rounded-md">
              <div className="mr-3">
                <Icon className="h-6 w-6 text-gray-700" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">{location.name}</div>
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center">
                      <span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
                      Originated: {locationStats.originated}
                    </span>
                    <span className="inline-flex items-center">
                      <span className="w-3 h-3 bg-orange-500 rounded-full mr-1"></span>
                      Executed: {locationStats.executed}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
