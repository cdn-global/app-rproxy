import { createFileRoute } from "@tanstack/react-router"
import ChatInterface from "@/components/LLM/ChatInterface"
import PageScaffold from "@/components/Common/PageLayout"
import { Button } from "@/components/ui/button"
import { Link } from "@tanstack/react-router"
import { FiArrowLeft } from "react-icons/fi"

function ModelChatPage() {
  const { modelName } = Route.useParams()
  const decodedModelName = decodeURIComponent(modelName)

  return (
    <PageScaffold sidebar={null}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {decodedModelName}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Chat with this language model
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="gap-2 rounded-full border-slate-200/80 bg-white/60 px-5 py-2 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
          >
            <Link to="/language-models">
              <FiArrowLeft className="h-4 w-4" />
              <span>Back to Models</span>
            </Link>
          </Button>
        </div>

        {/* Chat Interface */}
        <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <div className="h-[calc(100vh-300px)] min-h-[500px]">
            <ChatInterface />
          </div>
        </div>
      </div>
    </PageScaffold>
  )
}

export const Route = createFileRoute("/_layout/language-models/$modelName")({
  component: ModelChatPage,
})
