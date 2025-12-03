import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/services/serverless-compute')({
  component: ServerlessCompute,
})

function ServerlessCompute() {
  return (
    <div className="p-2">
      <h3>Serverless Compute</h3>
    </div>
  )
}
