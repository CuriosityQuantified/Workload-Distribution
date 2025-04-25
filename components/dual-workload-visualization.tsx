"use client"

import WorkloadVisualization from "@/components/workload-visualization"

export default function DualWorkloadVisualization() {
  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-[1600px]">
      <div className="flex-1">
        <WorkloadVisualization id="visualization-1" title="Scenario 1" />
      </div>
      <div className="flex-1">
        <WorkloadVisualization id="visualization-2" title="Scenario 2" />
      </div>
    </div>
  )
}
