import WorkloadSimulator from "@/components/workload-simulator"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gray-50">
      <h1 className="text-3xl font-bold mb-2 text-center">AI Workload Distribution Simulator</h1>
      <p className="text-gray-600 mb-8 text-center max-w-2xl">
        Monte Carlo simulation of workload origination and execution across distributed environments
      </p>
      <div className="w-full max-w-[1600px]">
        <WorkloadSimulator />
      </div>
    </main>
  )
}
