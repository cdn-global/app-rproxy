import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/services/')({
  component: ServicesIndex,
})

function ServicesIndex() {
  return (
    <div className="p-2">
      <h3>Services Index</h3>
    </div>
  )
}
