import { createFileRoute } from "@tanstack/react-router"
import { FiCpu } from "react-icons/fi"
import ActiveServicesGrid from "@/components/Dashboard/ActiveServicesGrid"
import { computeServers } from "@/data/compute"
import { DisplayedFeature } from "@/components/Dashboard/types"

export const Route = createFileRoute("/_layout/compute/")({
  component: ComputeComponent,
})

function ComputeComponent() {
  const computeFeatures: DisplayedFeature[] = computeServers.map((server) => ({
    slug: server.name,
    name: server.name,
    description: `A server with ${server.vCPUs} vCPUs and ${server.ramGB}GB RAM.`,
    icon: FiCpu,
    path: `/compute/${server.name}`,
  }))

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Managed Compute</h1>
      <p className="mb-6 text-muted-foreground">
        Deploy and manage your managed cloud functions.
      </p>

      <ActiveServicesGrid features={computeFeatures} />
    </div>
  )
}
