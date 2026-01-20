import { createFileRoute } from "@tanstack/react-router"
import ComingSoon from "@/components/Common/ComingSoon"
import PageScaffold from "@/components/ui/PageScaffold"

export const Route = createFileRoute("/_layout/compute/billing")({
  component: ComputeBilling,
})

function ComputeBilling() {
  return (
    <PageScaffold sidebar={null}>
      <ComingSoon />
    </PageScaffold>
  )
}