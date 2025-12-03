import { createFileRoute } from "@tanstack/react-router"

function BucketDetailsPage() {
  return (
    <div className="p-2">
      <h3>Bucket Details</h3>
    </div>
  )
}

export const Route = createFileRoute('/_layout/storage/bucket')({
  component: BucketDetailsPage,
})
