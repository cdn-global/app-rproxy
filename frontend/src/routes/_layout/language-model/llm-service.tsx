import LlmService from '@/components/LanguageModel/LlmService'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/language-model/llm-service')({
  component: LlmService,
})
