import { createFileRoute, redirect } from "@tanstack/react-router"
import { z } from "zod"
import ComingSoon from "@/components/Common/ComingSoon"

import { computeServers } from "@/data/compute"

export const Route = createFileRoute("/_layout/compute/$serviceName")({
  component: ComputeServiceComponent,
  parseParams: (params) => ({
    serviceName: z.string().parse(params.serviceName),
  }),
  loader: async ({ params: { serviceName } }) => {
    const service = computeServers.find((s) => s.name === serviceName)
    if (!service) {
      throw redirect({ to: "/compute" })
    }
    return { service }
  },
})

function ComputeServiceComponent() {
  return <ComingSoon />
}
