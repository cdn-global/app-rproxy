import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/services/llm-inference-api' as any)({
  component: LlmInferenceApi,
})

function LlmInferenceApi() {
  return (
    <div className="p-2">
      <h3>LLM Inference API</h3>
    </div>
  )
}
