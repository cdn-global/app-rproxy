import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import ChatInterface from "@/components/LLM/ChatInterface"
import PageScaffold from "@/components/Common/PageLayout"
import { Button } from "@/components/ui/button"
import { FiArrowLeft, FiInfo, FiDollarSign, FiCpu, FiZap } from "react-icons/fi"

interface LLMModel {
  id: string
  name: string
  display_name: string
  provider?: string
  model_id: string
  input_token_price: number
  output_token_price: number
  max_tokens: number
  is_active: boolean
  capabilities?: string[]
}

function ModelChatPage() {
  const { modelName } = Route.useParams()
  const decodedModelName = decodeURIComponent(modelName)

  // Fetch model details
  const { data: modelsData } = useQuery({
    queryKey: ["llm-models"],
    queryFn: async () => {
      const response = await fetch("/v2/llm-models/", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch models")
      return response.json() as Promise<{ data: LLMModel[]; count: number }>
    },
  })

  // Find the specific model by name
  const model = modelsData?.data.find(
    m => m.display_name === decodedModelName || m.name === decodedModelName
  )

  return (
    <PageScaffold sidebar={null}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-2 -ml-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <Link to="/language-models">
                <FiArrowLeft className="h-4 w-4" />
                <span>Back to Models</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                {model?.display_name || decodedModelName}
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {model?.provider || "Anthropic"} • {model?.model_id || decodedModelName}
              </p>
            </div>
          </div>
        </div>

        {/* Model Info Cards */}
        {model && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              icon={FiDollarSign}
              label="Input Price"
              value={`$${model.input_token_price.toFixed(2)}`}
              description="Per million tokens"
            />
            <InfoCard
              icon={FiDollarSign}
              label="Output Price"
              value={`$${model.output_token_price.toFixed(2)}`}
              description="Per million tokens"
            />
            <InfoCard
              icon={FiCpu}
              label="Max Tokens"
              value={`${(model.max_tokens / 1000).toFixed(0)}K`}
              description="Context window"
            />
            <InfoCard
              icon={FiZap}
              label="Status"
              value={model.is_active ? "Active" : "Inactive"}
              description={model.is_active ? "Ready to use" : "Configure API key"}
              highlight={model.is_active}
            />
          </div>
        )}

        {/* Status Banner for Inactive Model */}
        {model && !model.is_active && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/30">
            <div className="flex items-start gap-3">
              <FiInfo className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                  Model Not Available
                </h4>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                  This model requires a {model.provider || "provider"} API key.{" "}
                  <Link
                    to="/profile"
                    className="font-semibold underline hover:no-underline"
                  >
                    Configure your API key →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
          <div className="h-[calc(100vh-400px)] min-h-[600px]">
            <ChatInterface />
          </div>
        </div>
      </div>
    </PageScaffold>
  )
}

const InfoCard = ({
  icon: Icon,
  label,
  value,
  description,
  highlight = false,
}: {
  icon: React.ElementType
  label: string
  value: string
  description: string
  highlight?: boolean
}) => (
  <div className={`rounded-xl border p-4 transition-all ${
    highlight
      ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-900/30 dark:from-emerald-950/20 dark:to-slate-900"
      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/50"
  }`}>
    <div className="flex items-start gap-3">
      <div className={`rounded-lg p-2 ${
        highlight
          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
          {label}
        </p>
        <p className={`mt-1 text-xl font-semibold ${
          highlight
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-slate-900 dark:text-slate-100"
        }`}>
          {value}
        </p>
        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </div>
    </div>
  </div>
)

export const Route = createFileRoute("/_layout/language-models/$modelName")({
  component: ModelChatPage,
})
