import LanguageModels from '@/components/LanguageModel/LanguageModels'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/language-models/')({
  component: LanguageModels,
})
