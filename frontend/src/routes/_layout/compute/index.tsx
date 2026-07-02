import { createFileRoute } from '@tanstack/react-router'
import { FiCpu } from "react-icons/fi"
import { Card, CardContent } from "@/components/ui/card"
import ActiveServicesGrid from "@/components/Dashboard/ActiveServicesGrid"
import { computeServers } from "@/data/compute"
import { DisplayedFeature } from "@/components/Dashboard/types"
import useAuth from "@/hooks/useAuth"
import { isDemoAccount } from "@/utils"
import PageScaffold, { PageSection } from "../../../components/Common/PageLayout"

export const Route = createFileRoute("/_layout/compute/")({
  component: ComputeComponent,
})

function ComputeComponent() {
  const { user } = useAuth()
  const services = isDemoAccount(user?.email) ? computeServers : []
  const computeFeatures: DisplayedFeature[] = services.map((server) => ({
    slug: server.name,
    name: server.name,
    description: `A server with ${server.vCPUs} vCPUs and ${server.ramGB}GB RAM.`,
    icon: FiCpu,
    path: `/compute/${server.name}`,
  }))

  return (
    <PageScaffold sidebar={null}>
      <PageSection
        id="services"
        title="Compute Services"
        description="Deploy and manage your managed cloud functions."
      >
        <ActiveServicesGrid features={computeFeatures} />
      </PageSection>
    </PageScaffold>
  )
}
