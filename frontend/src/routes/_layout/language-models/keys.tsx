import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import PageScaffold, { PageSection } from "@/components/Common/PageLayout"
import useCustomToast from "@/hooks/useCustomToast"
import { getApiBaseUrl, safeJson } from "@/lib/utils"

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  request_count: number
  last_used_at: string | null
  is_active: boolean
  created_at: string
}

interface ApiKeyCreated extends ApiKey {
  full_key: string
}

const baseUrl = getApiBaseUrl()

function ApiKeysPage() {
  const showToast = useCustomToast()
  const queryClient = useQueryClient()
  const [newKeyName, setNewKeyName] = useState("")
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  }

  const { data, isLoading } = useQuery<{ data: ApiKey[]; count: number }>({
    queryKey: ["user-api-keys"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/v2/api-keys/`, {
        headers: authHeaders,
      })
      if (!res.ok) throw new Error("Failed to fetch API keys")
      return res.json()
    },
  })

  const keys = data?.data ?? []

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`${baseUrl}/v2/api-keys/`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Failed to create API key")
      }
      return res.json() as Promise<ApiKeyCreated>
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
        headers: authHeaders,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Failed to toggle API key")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-api-keys"] })
    },
    onError: (err: Error) => showToast("Error", err.message, "error"),
  })

  const deleteMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const res = await fetch(`${baseUrl}/v2/api-keys/${keyId}`, {
        method: "DELETE",
        headers: authHeaders,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Failed to delete API key")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-api-keys"] })
      showToast("Success", "API key deleted", "success")
    },
    onError: (err: Error) => showToast("Error", err.message, "error"),
  })

  const handleCopy = () => {
    if (revealedKey) {
      navigator.clipboard.writeText(revealedKey)
      setCopied(true)
      showToast("Copied", "API key copied to clipboard", "success")
    }
  }

  return (
    <PageScaffold sidebar={null}>
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              API Keys
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Create and manage API keys for programmatic access to the REST API
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/language-models">← Models</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/language-models/api">API Docs</Link>
            </Button>
          </div>
        </div>

        {/* Create Key */}
        <PageSection
          id="create"
          title="Create API Key"
          description="Generate a new key to authenticate REST API requests"
        >
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 dark:border-slate-700/60 dark:bg-slate-900/70">
            <div className="flex gap-3">
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g. Production, CI/CD)"
                className="max-w-sm"
              />
              <Button
                onClick={() => createMutation.mutate(newKeyName)}
                disabled={
                  !newKeyName.trim() || createMutation.isPending
                }
              >
                {createMutation.isPending
                  ? "Creating..."
                  : "Create Key"}
              </Button>
            </div>

            {revealedKey && (
              <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
                <p className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Copy your API key now. You won't be able to see it again.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-slate-900 px-3 py-2 text-sm text-green-400 dark:bg-slate-950">
                    {revealedKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                  Use this key as a Bearer token:{" "}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                    Authorization: Bearer {revealedKey.substring(0, 14)}...
                  </code>
                </p>
              </div>
            )}
          </div>
        </PageSection>

        {/* Keys List */}
        <PageSection
          id="keys"
          title="Your API Keys"
          description="Manage existing keys. Keys with logged requests cannot be deleted."
        >
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                  <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : keys.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No API keys yet. Create one above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    keys.map((k) => (
                      <TableRow
                        key={k.id}
                        className="border-slate-200/70 dark:border-slate-700/60"
                      >
                        <TableCell className="font-medium">
                          {k.name}
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                            {k.key_prefix}...
                          </code>
                        </TableCell>
                        <TableCell>
                          {k.request_count.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {k.last_used_at
                            ? new Date(k.last_used_at).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              k.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {k.is_active ? "Active" : "Disabled"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {new Date(k.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() =>
                                toggleMutation.mutate(k.id)
                              }
                            >
                              {k.is_active ? "Disable" : "Enable"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-xs"
                              disabled={k.request_count > 0}
                              title={
                                k.request_count > 0
                                  ? "Cannot delete keys with logged requests"
                                  : "Delete this key"
                              }
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete API key "${k.name}"?`
                                  )
                                ) {
                                  deleteMutation.mutate(k.id)
                                }
                              }}
                            >
                              Delete
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

        {/* Usage */}
        <PageSection
          id="usage"
          title="How to Use"
          description="Authenticate API requests with your key"
        >
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 dark:border-slate-700/60 dark:bg-slate-900/70">
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              1. Log in with your email and password to get a session token, or create an API key above.
            </p>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              2. Pass your API key as a Bearer token in every request:
            </p>
            <pre className="mb-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100 dark:bg-slate-950">
              <code>{`curl -X POST "${baseUrl}/v2/llm/chat/completions" \\
  -H "Authorization: Bearer rp_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model_id": "...", "messages": [{"role": "user", "content": "Hello"}]}'`}</code>
            </pre>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Every request made with your API key is logged. Keys with usage history cannot be deleted — only disabled.
            </p>
          </div>
        </PageSection>
      </div>
    </PageScaffold>
  )
}

export const Route = createFileRoute("/_layout/language-models/keys")({
  component: ApiKeysPage,
})
