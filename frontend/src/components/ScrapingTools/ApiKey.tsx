import { Copy, KeyRound, Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import useCustomToast from "../../hooks/useCustomToast"

// --- Interfaces ---
interface ApiKey {
  key_preview: string
  created_at: string
  expires_at: string
  is_active: boolean
  request_count?: number
}

interface ApiKeyProps {
  token: string | null
  variant?: "card" | "plain"
}

const API_URL = "https://api.ROAMINGPROXY.com/v2/proxy"

// --- START: New helper function to truncate the key display ---
/**
 * Truncates a long string by showing the start and end characters,
 * separated by an ellipsis.
 * @param {string} key The API key to truncate.
 * @param {number} startChars Number of characters to show from the start.
 * @param {number} endChars Number of characters to show from the end.
 * @returns {string} The truncated key.
 */
const truncateApiKey = (
  key: string | null,
  startChars = 12,
  endChars = 8,
): string => {
  if (!key || key.length <= startChars + endChars) {
    return key || ""
  }
  const start = key.substring(0, startChars)
  const end = key.substring(key.length - endChars)
  return `${start}...${end}`
}
// --- END: New helper function ---

const ApiKeyModule = ({ token, variant = "card" }: ApiKeyProps) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fullKey, setFullKey] = useState<string | null>(null)
  const [hasProxyApiAccess, setHasProxyApiAccess] = useState<boolean | null>(
    null,
  )

  // --- START: New state for modal and countdown ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [countdown, setCountdown] = useState(15)
  // --- END: New state ---

  const toast = useCustomToast()

  // --- START: New handler to close the modal ---
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setFullKey(null) // Clear the key so the modal doesn't re-open
  }, [])
  // --- END: New handler ---

  // --- START: New useEffect for countdown timer ---
  useEffect(() => {
    if (!isModalOpen) return

    if (countdown <= 0) {
      handleCloseModal()
      return
    }

    const timerId = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timerId)
  }, [isModalOpen, countdown, handleCloseModal])
  // --- END: New useEffect ---

  useEffect(() => {
    if (token) {
      setApiKeys([])
      setFullKey(null)
      setError(null)
      setLoading(true)

      const fetchInitialData = async () => {
        await fetchProxyApiAccess()
        await fetchApiKeys()
        setLoading(false)
      }
      fetchInitialData()
    }
  }, [token])

  const fetchProxyApiAccess = async () => {
    if (!token) return
    try {
      const response = await fetch(
        "https://api.ROAMINGPROXY.com/v2/proxy-api/access",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      if (!response.ok) throw new Error("Failed to fetch subscription status.")
      const data = await response.json()
      setHasProxyApiAccess(data.has_access)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      )
      setHasProxyApiAccess(false)
    }
  }

  const fetchApiKeys = async () => {
    if (!token) return
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api-keys`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok)
        throw new Error(`Failed to fetch API keys: ${response.status}`)
      const data: ApiKey[] = await response.json()
      const sortedData = data.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      setApiKeys(sortedData)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred fetching keys.",
      )
    }
  }

  const generateKey = async () => {
    if (!token) return
    setIsGenerating(true)
    setFullKey(null)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/generate-api-key`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.detail || `Failed to generate API key: ${response.status}`,
        )
      }
      const newKeyData = await response.json()

      // --- START: Modified key generation success logic ---
      setFullKey(newKeyData.api_key)
      setCountdown(15) // Reset countdown
      setIsModalOpen(true) // Open the modal
      await fetchApiKeys()
      // --- END: Modified key generation success logic ---
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred during key generation.",
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const deleteApiKey = async (key: ApiKey) => {
    if (!token) return
    setKeyToDelete(key.key_preview)
    setError(null)

    try {
      const parts = key.key_preview.split("...")
      if (parts.length !== 2 || parts[1].length !== 8)
        throw new Error("Invalid key preview format.")

      const response = await fetch(`${API_URL}/api-keys/${parts[1]}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.detail || `Failed to delete API key: ${response.status}`,
        )
      }
      toast("Key deleted", "The API key was removed successfully.", "success")
      await fetchApiKeys()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred during key deletion.",
      )
    } finally {
      setKeyToDelete(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast("Copied", "Full API key copied to clipboard.", "success")
  }

  if (!token) {
    return (
      <Alert variant="destructive" className="border-gray-300/40 bg-gray-100/60 text-gray-900 dark:border-gray-500/40 dark:bg-gray-500/10 dark:text-gray-100">
        <AlertTitle>Authentication required</AlertTitle>
        <AlertDescription>
          Please sign in to manage your API keys.
        </AlertDescription>
      </Alert>
    )
  }

  const generateButton = (
    <Button
      type="button"
      className="rounded-full"
      onClick={generateKey}
      disabled={isGenerating || hasProxyApiAccess === false}
    >
      {isGenerating ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-[2px] border-emerald-200 border-t-emerald-600" />
          Generating…
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Generate key
        </span>
      )}
    </Button>
  )

  const content = (
    <>
      {hasProxyApiAccess === false ? (
        <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
          <AlertTitle>Upgrade required</AlertTitle>
          <AlertDescription>
            Your current plan does not include Proxy API features. Upgrade your subscription to enable key management.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-700/60">
        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <Spinner size={32} />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="flex h-48 items-center justify-center bg-slate-50/60 text-sm text-muted-foreground dark:bg-slate-900/40">
            No API keys found. Generate one to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key preview</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.key_preview}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                      <KeyRound className="h-4 w-4 text-slate-400" />
                      {key.key_preview}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(key.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(key.expires_at).toLocaleDateString()}</TableCell>
                  <TableCell>{key.request_count ?? 0}</TableCell>
                  <TableCell>
                    <span className={key.is_active ? "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-600" : "rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive"}>
                      {key.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10"
                            onClick={() => deleteApiKey(key)}
                            disabled={
                              (key.request_count != null && key.request_count > 0) ||
                              keyToDelete === key.key_preview
                            }
                            aria-label="Delete key"
                          >
                            {keyToDelete === key.key_preview ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-[2px] border-destructive/40 border-t-destructive" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {key.request_count && key.request_count > 0
                            ? "Keys with usage can’t be deleted"
                            : "Delete API key"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  )

  const isPlain = variant === "plain"

  return (
    <div className={cn("space-y-6", isPlain ? "w-full" : "")}>
      <Dialog open={isModalOpen} onOpenChange={(next) => (next ? setIsModalOpen(true) : handleCloseModal())}>
        <DialogContent className="max-w-md rounded-3xl border border-emerald-300/60 bg-white/95 shadow-[0_40px_120px_-60px_rgba(16,185,129,0.35)] backdrop-blur-xl dark:border-emerald-500/40 dark:bg-slate-950/95">
          <DialogHeader>
            <DialogTitle className="text-xl">New key generated</DialogTitle>
            <DialogDescription>
              Copy this key now. For security reasons it will never be displayed again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-200/70 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100">
            <span className="font-mono text-xs uppercase tracking-[0.25em]">
              {truncateApiKey(fullKey)}
            </span>
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-full"
              onClick={() => fullKey && copyToClipboard(fullKey)}
              aria-label="Copy full key"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Window closes automatically in {countdown}s.
          </p>
        </DialogContent>
      </Dialog>

      {isPlain ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                API keys
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Generate and rotate credential tokens for programmatic access. Keys expire after 365 days.
              </p>
            </div>
            {generateButton}
          </div>
          <div className="space-y-4">
            {content}
          </div>
        </div>
      ) : (
        <Card className="border border-slate-200/70 bg-white/80 shadow-[0_32px_90px_-60px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                API keys
              </CardTitle>
              <CardDescription>
                Generate and rotate credential tokens for programmatic access. Keys expire after 365 days.
              </CardDescription>
            </div>
            {generateButton}
          </CardHeader>
          <CardContent className="space-y-4">
            {content}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ApiKeyModule
