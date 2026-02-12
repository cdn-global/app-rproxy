import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import PageScaffold, { PageSection } from "@/components/Common/PageLayout"
import useCustomToast from "../../hooks/useCustomToast"
import { safeJson, getApiBaseUrl } from "@/lib/utils"
import {
  FiArrowLeft,
  FiDollarSign,
  FiCpu,
  FiZap,
  FiSend,
  FiAlertCircle,
  FiCheckCircle,
  FiKey,
  FiShield,
  FiCopy,
  FiPlus,
  FiTrash2,
  FiExternalLink,
  FiActivity,
  FiLayers,
  FiHash,
  FiTerminal,
} from "react-icons/fi"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InferenceModel {
  id: string
  name: string
  display_name?: string
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

interface RestApiKey {
  id: string
  name: string
  key_prefix: string
  request_count: number
  last_used_at: string | null
  is_active: boolean
  created_at: string
}

interface RestApiKeyCreated extends RestApiKey {
  full_key: string
}

const baseUrl = getApiBaseUrl()
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
})

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function LlmService({ initialModelId }: LlmServiceProps) {
  const showToast = useCustomToast()
  const [activeTab, setActiveTab] = useState("playground")

  return (
    <PageScaffold sidebar={null}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
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

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Inference Playground
              </h1>
              <p className="mt-1.5 text-slate-600 dark:text-slate-400">
                Test models and configure REST API access
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="gap-2 rounded-full">
                <Link to="/language-models/billing">
                  <FiActivity className="h-3.5 w-3.5" />
                  Usage
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2 rounded-full">
                <Link to="/language-models/api">
                  <FiTerminal className="h-3.5 w-3.5" />
                  API Docs
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-11 w-full justify-start gap-1 rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/60">
            <TabsTrigger value="playground" className="gap-2 rounded-lg data-[state=active]:shadow-md">
              <FiCpu className="h-3.5 w-3.5" />
              Playground
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="gap-2 rounded-lg data-[state=active]:shadow-md">
              <FiShield className="h-3.5 w-3.5" />
              REST API Keys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="playground" className="mt-6">
            <PlaygroundTab initialModelId={initialModelId} showToast={showToast} />
          </TabsContent>

          <TabsContent value="api-keys" className="mt-6">
            <RestApiKeysTab showToast={showToast} />
          </TabsContent>
        </Tabs>
      </div>
    </PageScaffold>
  )
}

// ---------------------------------------------------------------------------
// Tab 1 – Playground
// ---------------------------------------------------------------------------

function PlaygroundTab({
  initialModelId,
  showToast,
}: {
  initialModelId?: string
  showToast: ReturnType<typeof useCustomToast>
}) {
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId ?? "")
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")

  const { data: modelsData, isLoading: isLoadingModels } = useQuery<{ data: InferenceModel[]; count: number }>({
    queryKey: ["llm-models"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/v2/llm-models/`, { headers: authHeaders() })
      if (!res.ok) throw new Error("Failed to fetch models")
      return safeJson(res, { data: [], count: 0 })
    },
  })

  const models = (modelsData?.data ?? []).filter((m) => m.is_active)

  useEffect(() => {
    if (models.length > 0 && !selectedModelId) {
      setSelectedModelId(initialModelId || models[0].id)
    }
  }, [models, selectedModelId, initialModelId])

  const selectedModel = models.find((m) => m.id === selectedModelId)

  const inferMutation = useMutation<{ content: string; input_tokens: number; output_tokens: number; cost: number }, Error>({
    mutationFn: async () => {
      const res = await fetch(`${baseUrl}/v2/llm/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          model_id: selectedModelId,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      })
      if (!res.ok) {
        const err = await safeJson<{ detail?: string }>(res, {})
        throw new Error(err.detail || "Inference failed")
      }
      return safeJson(res, { content: "", input_tokens: 0, output_tokens: 0, cost: 0 })
    },
    onSuccess: (data) => {
      setResponse(data.content)
      showToast("Success", "Response generated successfully", "success")
    },
    onError: (err: Error) => showToast("Error", err.message, "error"),
  })

  return (
    <div className="space-y-6">
      {/* No models warning */}
      {!isLoadingModels && models.length === 0 && (
        <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 dark:border-amber-800/40 dark:from-amber-950/30 dark:to-orange-950/20">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/40">
              <FiAlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100">No Active Models</h4>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                Configure your provider API keys to activate models.{" "}
                <Link
                  to="/profile"
                  className="font-semibold underline hover:no-underline"
                >
                  Set up Provider Keys
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoadingModels && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white/95 py-20 dark:border-slate-700/60 dark:bg-slate-900/70">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-emerald-600 dark:border-slate-700 dark:border-t-emerald-400" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading models...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoadingModels && models.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Model Selector Card */}
            <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/40">
                  <FiLayers className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Model
                </label>
              </div>
              <select
                value={selectedModelId}
                onChange={(e) => {
                  setSelectedModelId(e.target.value)
                  setResponse("")
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name || m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>

            {/* Model Details Card */}
            {selectedModel && (
              <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
                <div className="flex items-center gap-2 mb-4">
                  <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-900/40">
                    <FiCpu className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Model Details
                  </h3>
                </div>

                <div className="space-y-3">
                  <InfoRow icon={FiZap} label="Provider" value={selectedModel.provider} />
                  <InfoRow icon={FiHash} label="Model ID" value={selectedModel.model_id} mono />
                  <InfoRow icon={FiCpu} label="Max Tokens" value={selectedModel.max_tokens.toLocaleString()} />

                  <div className="border-t border-slate-200/70 pt-3 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 mb-2">
                      <FiDollarSign className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Pricing (per 1M tokens)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Input</p>
                        <p className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                          ${(selectedModel.input_token_price || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Output</p>
                        <p className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                          ${(selectedModel.output_token_price || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Area */}
          <div className="space-y-4">
            {/* Prompt Card */}
            <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-6 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg bg-violet-100 p-1.5 dark:bg-violet-900/40">
                  <FiSend className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                </div>
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Prompt</label>
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here... Try asking a question or requesting content generation."
                rows={8}
                className="min-h-[200px] resize-none rounded-xl border-slate-200 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-800"
              />
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-slate-400">{prompt.length} characters</p>
                <Button
                  onClick={() => inferMutation.mutate()}
                  disabled={!prompt.trim() || !selectedModelId || inferMutation.isPending}
                  className="gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 font-semibold shadow-md transition hover:shadow-lg hover:from-emerald-700 hover:to-emerald-600 dark:from-emerald-500 dark:to-emerald-400 dark:text-slate-950"
                >
                  {inferMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                      Running...
                    </>
                  ) : (
                    <>
                      Run Inference
                      <FiSend className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Response Card */}
            {response && (
              <div className="rounded-2xl border border-emerald-200/70 bg-white/95 p-6 shadow-sm backdrop-blur-xl dark:border-emerald-800/40 dark:bg-slate-900/70">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/40">
                      <FiCheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Response</label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-full text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(response)
                      showToast("Copied", "Response copied to clipboard", "success")
                    }}
                  >
                    <FiCopy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-900 dark:text-slate-100">
                    {response}
                  </p>
                </div>

                {/* Metrics */}
                {inferMutation.data && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FiCheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        Usage tracked in billing
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <MetricCard label="Input Tokens" value={inferMutation.data.input_tokens.toLocaleString()} />
                      <MetricCard label="Output Tokens" value={inferMutation.data.output_tokens.toLocaleString()} />
                      <MetricCard
                        label="Total Cost"
                        value={`$${inferMutation.data.cost.toFixed(6)}`}
                        highlight
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!response && !inferMutation.isPending && (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300/70 bg-gradient-to-br from-slate-50/80 to-white p-16 dark:border-slate-700/50 dark:from-slate-800/30 dark:to-slate-900/20">
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-blue-100 p-4 dark:from-emerald-900/30 dark:to-blue-900/30">
                      <FiCpu className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Ready to test</h3>
                  <p className="mt-1.5 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                    Enter a prompt and click &quot;Run Inference&quot; to generate a response
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 2 – REST API Keys (RoamingProxy)
// ---------------------------------------------------------------------------

function RestApiKeysTab({ showToast }: { showToast: ReturnType<typeof useCustomToast> }) {
  const queryClient = useQueryClient()
  const [newKeyName, setNewKeyName] = useState("")
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { data, isLoading } = useQuery<{ data: RestApiKey[]; count: number }>({
    queryKey: ["user-api-keys"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/v2/api-keys/`, { headers: authHeaders() })
      if (!res.ok) throw new Error("Failed to fetch API keys")
      return safeJson(res, { data: [], count: 0 })
    },
  })

  const keys = data?.data ?? []

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`${baseUrl}/v2/api-keys/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const err = await safeJson<{ detail?: string }>(res, {})
        throw new Error(err.detail || "Failed to create key")
      }
      return safeJson<RestApiKeyCreated>(res)
    },
    onSuccess: (data) => {
      setRevealedKey(data.full_key)
      setNewKeyName("")
      setCopied(false)
      queryClient.invalidateQueries({ queryKey: ["user-api-keys"] })
      showToast("Success", "API key created", "success")
    },
    onError: (err: Error) => showToast("Error", err.message, "error"),
  })

  const toggleMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const res = await fetch(`${baseUrl}/v2/api-keys/${keyId}/toggle`, {
        method: "PATCH",
        headers: authHeaders(),
      })
      if (!res.ok) {
        const err = await safeJson<{ detail?: string }>(res, {})
        throw new Error(err.detail || "Failed to toggle key")
      }
      return safeJson(res)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-api-keys"] }),
    onError: (err: Error) => showToast("Error", err.message, "error"),
  })

  const deleteMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const res = await fetch(`${baseUrl}/v2/api-keys/${keyId}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      if (!res.ok) {
        const err = await safeJson<{ detail?: string }>(res, {})
        throw new Error(err.detail || "Failed to delete key")
      }
      return safeJson(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-api-keys"] })
      showToast("Success", "API key deleted", "success")
    },
    onError: (err: Error) => showToast("Error", err.message, "error"),
  })

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 dark:border-blue-800/40 dark:from-blue-950/30 dark:to-indigo-950/20">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/40">
            <FiShield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">RoamingProxy REST API Keys</h4>
            <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
              Use these keys to authenticate programmatic requests to the RoamingProxy API.
              Every request is logged and metered.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-full shrink-0">
            <Link to="/language-models/api">
              <FiExternalLink className="h-3.5 w-3.5" />
              Docs
            </Link>
          </Button>
        </div>
      </div>

      {/* Create Key */}
      <PageSection id="create-key" title="Create API Key" description="Generate a new key to authenticate REST API requests">
        <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-6 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
          <div className="flex gap-3">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g. Production, CI/CD)"
              className="max-w-sm rounded-xl"
            />
            <Button
              onClick={() => createMutation.mutate(newKeyName)}
              disabled={!newKeyName.trim() || createMutation.isPending}
              className="gap-2 rounded-full"
            >
              <FiPlus className="h-3.5 w-3.5" />
              {createMutation.isPending ? "Creating..." : "Create Key"}
            </Button>
          </div>

          {revealedKey && (
            <div className="mt-4 rounded-xl border border-amber-300/70 bg-amber-50 p-4 dark:border-amber-700/50 dark:bg-amber-950/30">
              <p className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                Copy your API key now &mdash; you won&apos;t see it again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm text-emerald-400 dark:bg-slate-950">
                  {revealedKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-full"
                  onClick={() => {
                    navigator.clipboard.writeText(revealedKey)
                    setCopied(true)
                    showToast("Copied", "API key copied to clipboard", "success")
                  }}
                >
                  <FiCopy className="h-3 w-3" />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                Use as Bearer token:{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
                  Authorization: Bearer {revealedKey.substring(0, 14)}...
                </code>
              </p>
            </div>
          )}
        </div>
      </PageSection>

      {/* Keys Table */}
      <PageSection id="keys-list" title="Your API Keys" description="Manage existing keys. Keys with logged requests cannot be deleted.">
        <div className="rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200/70 bg-slate-50/50 dark:border-slate-700/60 dark:bg-slate-800/30">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Key</TableHead>
                  <TableHead className="font-semibold">Requests</TableHead>
                  <TableHead className="font-semibold">Last Used</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                        <span className="text-slate-500">Loading keys...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : keys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                          <FiKey className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500">No API keys yet. Create one above.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  keys.map((k) => (
                    <TableRow key={k.id} className="border-slate-200/70 dark:border-slate-700/60">
                      <TableCell className="font-medium">{k.name}</TableCell>
                      <TableCell>
                        <code className="rounded-md bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                          {k.key_prefix}...
                        </code>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{k.request_count.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            k.is_active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${k.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {k.is_active ? "Active" : "Disabled"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs"
                            onClick={() => toggleMutation.mutate(k.id)}
                          >
                            {k.is_active ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                            disabled={k.request_count > 0}
                            title={k.request_count > 0 ? "Keys with usage can't be deleted" : "Delete key"}
                            onClick={() => {
                              if (window.confirm(`Delete API key "${k.name}"?`)) {
                                deleteMutation.mutate(k.id)
                              }
                            }}
                          >
                            <FiTrash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </PageSection>

      {/* Usage Snippet */}
      <PageSection id="usage" title="Quick Start" description="Authenticate API requests with your key">
        <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-6 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm leading-relaxed text-slate-100 dark:bg-slate-950">
            <code>{`curl -X POST "${baseUrl}/v2/llm/chat/completions" \\
  -H "Authorization: Bearer rp_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model_id": "...", "messages": [{"role": "user", "content": "Hello"}]}'`}</code>
          </pre>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Every request is logged. Keys with usage history cannot be deleted &mdash; only disabled.
          </p>
        </div>
      </PageSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
        <p className={`mt-0.5 text-sm font-medium capitalize truncate ${mono ? "font-mono text-xs" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

function MetricCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl p-3.5 ${
        highlight
          ? "bg-emerald-50 dark:bg-emerald-950/30"
          : "bg-slate-50 dark:bg-slate-800/50"
      }`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-wider ${
          highlight ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-lg font-semibold ${
          highlight ? "text-emerald-900 dark:text-emerald-300" : "text-slate-900 dark:text-slate-100"
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export default LlmService
