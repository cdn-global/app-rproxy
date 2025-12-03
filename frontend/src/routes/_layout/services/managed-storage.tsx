import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/services/managed-storage')({
  component: ManagedStorage,
})

function ManagedStorage() {
  return (
    <div className="p-2">
      <h3>Managed Storage</h3>
    </div>
  )
}
