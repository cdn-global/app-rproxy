import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import useCustomToast from "../../hooks/useCustomToast"

interface InferenceModel {
  id: string
  name: string
  provider: string
  model_id: string
  capabilities: string[]
  pricing_per_1k_tokens: number
  max_tokens: number
}

function LlmService() {
  const showToast = useCustomToast()
  const [selectedModelId, setSelectedModelId] = useState<string>("")
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")

  const { data: modelsData } = useQuery<{ data: InferenceModel[]; count: number }>({
    queryKey: ["inference-models"],
    queryFn: async () => {
      const res = await fetch("/v2/inference/models", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      })
      if (!res.ok) throw new Error("Failed to fetch models")
      return res.json()
    },
  })

  const models = modelsData?.data ?? []

  // Auto-select first model
  if (models.length > 0 && !selectedModelId) {
    setSelectedModelId(models[0].id)
  }

  const selectedModel = models.find((m) => m.id === selectedModelId)

  const inferMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/v2/inference/infer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          model_id: selectedModelId,
          prompt,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Inference failed")
      }
      return res.json()
    },
    onSuccess: (data) => {
      setResponse(data.completion)
    },
    onError: (err: Error) => {
      showToast("Error", err.message, "error")
    },
  })

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Inference Playground</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Send prompts to any model and see responses in real time.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Model selector */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Model</label>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider})
                </option>
              ))}
            </select>
          </div>

          {selectedModel && (
            <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 space-y-3 dark:border-slate-700/60 dark:bg-slate-900/60">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Provider</p>
                <p className="text-sm font-medium capitalize">{selectedModel.provider}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Price / 1K tokens</p>
                <p className="text-sm font-medium">${selectedModel.pricing_per_1k_tokens.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Max tokens</p>
                <p className="text-sm font-medium">{selectedModel.max_tokens.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Capabilities</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedModel.capabilities.map((cap) => (
                    <Badge key={cap} variant="outline" className="text-xs">{cap}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prompt + Response */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              rows={6}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <Button
            onClick={() => inferMutation.mutate()}
            disabled={!prompt.trim() || !selectedModelId || inferMutation.isPending}
            className="rounded-full px-6"
          >
            {inferMutation.isPending ? "Running..." : "Run Inference"}
          </Button>

          {response && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Response</label>
              <div className="rounded-lg border border-slate-200/70 bg-slate-50/50 p-4 text-sm whitespace-pre-wrap dark:border-slate-700/60 dark:bg-slate-800/50">
                {response}
              </div>
            </div>
          )}

          {inferMutation.data && (
            <div className="flex gap-4 text-xs text-slate-500">
              <span>Prompt tokens: {inferMutation.data.prompt_tokens}</span>
              <span>Completion tokens: {inferMutation.data.completion_tokens}</span>
              <span>Cost: ${inferMutation.data.cost.toFixed(4)}</span>
              <span>Latency: {inferMutation.data.latency_ms}ms</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LlmService
