import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/services/managed-database')({
  component: ManagedDatabase,
})

function ManagedDatabase() {
  return (
    <div className="p-2">
      <h3>Managed Database</h3>
    </div>
  )
}
