import LanguageModel from '@/components/LanguageModel/Index'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/language-model/')({
  component: LanguageModel,
})
