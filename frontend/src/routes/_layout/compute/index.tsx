import { createFileRoute } from '@tanstack/react-router'
import { FiCpu } from "react-icons/fi"
import { Card, CardContent } from "@/components/ui/card"
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
      <ActiveServicesGrid features={computeFeatures} />
      <Card className="mt-6">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            Deploy and manage your managed cloud functions.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
