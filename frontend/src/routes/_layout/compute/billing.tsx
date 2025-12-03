import { createFileRoute } from "@tanstack/react-router"
import ComingSoon from "@/components/Common/ComingSoon"

export const Route = createFileRoute("/_layout/compute/billing")({
  component: ComputeBilling,
})

function ComputeBilling() {
  return <ComingSoon />
}