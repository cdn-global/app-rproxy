import Billing from '@/components/LanguageModel/Billing'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/language-models/billing')({
  component: Billing,
})
