import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import useCustomToast from "../../hooks/useCustomToast"

interface InferenceModel {
  id: string
  name: string
  provider: string
  model_id: string
  capabilities?: string[]
  input_token_price?: number
  output_token_price?: number
  max_tokens: number
  is_active: boolean
}

interface LlmServiceProps {
  initialModelId?: string
}

function LlmService({ initialModelId }: LlmServiceProps) {
  const showToast = useCustomToast()
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId ?? "")
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")

  const { data: modelsData } = useQuery<{ data: InferenceModel[]; count: number }>({
    queryKey: ["llm-models"],
    queryFn: async () => {
      // Use the base URL from window location
      const baseUrl = window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : `https://${window.location.hostname.replace("-5173", "-8000")}`;

      // Only fetch active models for the playground
      const res = await fetch(`${baseUrl}/v2/llm-models/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      })
      if (!res.ok) throw new Error("Failed to fetch models")
      return res.json()
    },
  })

  const models = (modelsData?.data ?? []).filter(m => m.is_active)

  // Auto-select: use initialModelId if valid, otherwise first active model
  if (models.length > 0 && !models.find(m => m.id === selectedModelId)) {
    setSelectedModelId(models[0].id)
  }

  const selectedModel = models.find((m) => m.id === selectedModelId)

  const inferMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/v2/llm/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          model_id: selectedModelId,
          messages: [{ role: "user", content: prompt }],
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
      setResponse(data.content)
    },
    onError: (err: Error) => {
      showToast("Error", err.message, "error")
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Inference Playground</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Send prompts to any model and see responses in real time.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/language-models">← Back to Models</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/language-models/billing">View Billing</Link>
          </Button>
        </div>
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
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pricing (per 1M tokens)</p>
                <p className="text-sm font-medium">
                  ${(selectedModel.input_token_price || 0).toFixed(2)} in / ${(selectedModel.output_token_price || 0).toFixed(2)} out
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Max tokens</p>
                <p className="text-sm font-medium">{selectedModel.max_tokens.toLocaleString()}</p>
              </div>
              {selectedModel.capabilities && selectedModel.capabilities.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Capabilities</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedModel.capabilities.map((cap) => (
                      <Badge key={cap} variant="outline" className="text-xs">{cap}</Badge>
                    ))}
                  </div>
                </div>
              )}
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
            <div className="space-y-2">
              <div className="flex gap-4 text-xs text-slate-500">
                <span>Input tokens: {inferMutation.data.input_tokens}</span>
                <span>Output tokens: {inferMutation.data.output_tokens}</span>
                <span>Cost: ${inferMutation.data.cost.toFixed(6)}</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">
                ✓ Usage tracked in billing report
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LlmService
