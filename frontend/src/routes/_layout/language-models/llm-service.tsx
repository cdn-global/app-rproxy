import LlmService from '@/components/LanguageModel/LlmService'
import { createFileRoute } from '@tanstack/react-router'

interface LlmServiceSearch {
  modelId?: string
}

export const Route = createFileRoute('/_layout/language-models/llm-service')({
  validateSearch: (search: Record<string, unknown>): LlmServiceSearch => ({
    modelId: search.modelId as string | undefined,
  }),
  component: function LlmServiceRoute() {
    const { modelId } = Route.useSearch()
    return <LlmService initialModelId={modelId} />
  },
})
