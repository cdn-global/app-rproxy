import { createFileRoute } from "@tanstack/react-router"

function InstanceDetailsPage() {
  return (
    <div className="p-2">
      <h3>Instance Details</h3>
    </div>
  )
}

export const Route = createFileRoute('/_layout/managed-database/instance')({
  component: InstanceDetailsPage,
})
