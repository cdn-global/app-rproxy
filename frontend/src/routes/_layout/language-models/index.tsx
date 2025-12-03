import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { createFileRoute } from "@tanstack/react-router"
import LanguageModel from "@/components/LanguageModel/Index"
import LlmService from "@/components/LanguageModel/LlmService"
import Billing from "@/components/LanguageModel/Billing"

function LanguageModelsIndexPage() {
  return (
    <div className="space-y-10 py-10">
      <Tabs defaultValue="language-model">
        <TabsList>
          <TabsTrigger value="language-model">Language Model</TabsTrigger>
          <TabsTrigger value="llm-service">LLM Service</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="language-model">
          <LanguageModel />
        </TabsContent>
        <TabsContent value="llm-service">
          <LlmService />
        </TabsContent>
        <TabsContent value="billing">
          <Billing />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export const Route = createFileRoute('/_layout/language-models/')({
  component: LanguageModelsIndexPage,
})
