import { useState, useEffect } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import useCustomToast from "../../hooks/useCustomToast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UpdateAPIKeyForm {
  anthropic_api_key?: string
  openai_api_key?: string
  google_api_key?: string
}

interface APIKeyStatus {
  has_anthropic_key: boolean
  has_openai_key: boolean
  has_google_key: boolean
}

const ApiKeySettings = () => {
  const showToast = useCustomToast()
  const queryClient = useQueryClient()
  const [showAnthropicKey, setShowAnthropicKey] = useState(false)
  const [showOpenAIKey, setShowOpenAIKey] = useState(false)
  const [showGoogleKey, setShowGoogleKey] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateAPIKeyForm>({
    mode: "onBlur",
  })

  // Fetch API key status
  const { data: apiKeyStatus, isLoading: isLoadingStatus } = useQuery<APIKeyStatus>({
    queryKey: ["apiKeyStatus"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token")
      if (!token) {
        throw new Error("Not authenticated")
      }
      const response = await fetch("/v2/users/me/api-key-status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch API key status")
      }
      return response.json()
    },
  })

  // Determine which providers to show
  const hasAnyKey = apiKeyStatus?.has_anthropic_key || apiKeyStatus?.has_openai_key || apiKeyStatus?.has_google_key
  const [showAllProviders, setShowAllProviders] = useState(false)

  // If no keys configured, show all fields. If keys exist, only show configured ones (unless user clicks "add more")
  const showAnthropicField = !hasAnyKey || apiKeyStatus?.has_anthropic_key || showAllProviders
  const showOpenAIField = !hasAnyKey || apiKeyStatus?.has_openai_key || showAllProviders
  const showGoogleField = !hasAnyKey || apiKeyStatus?.has_google_key || showAllProviders

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateAPIKeyForm) => {
      console.log("[API_KEY_SAVE] Attempting to save API keys:", Object.keys(data).filter(k => data[k as keyof UpdateAPIKeyForm]))

      const token = localStorage.getItem("access_token")
      if (!token) {
        throw new Error("Not authenticated - please log in again")
      }

      const response = await fetch("/v2/users/me/api-key", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      console.log("[API_KEY_SAVE] Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[API_KEY_SAVE] Error response:", errorText)
        try {
          const error = JSON.parse(errorText)
          throw new Error(error.detail || `Failed to update API key (${response.status})`)
        } catch {
          throw new Error(`Failed to update API key: ${response.status} ${response.statusText}`)
        }
      }

      return response.json()
    },
    onSuccess: () => {
      console.log("[API_KEY_SAVE] Successfully saved API keys")
      showToast("Success!", "API keys updated successfully.", "success")
      reset()
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      queryClient.invalidateQueries({ queryKey: ["apiKeyStatus"] })
    },
    onError: (err: Error) => {
      console.error("[API_KEY_SAVE] Error:", err.message)
      showToast("Error", err.message, "error")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/v2/users/me/api-key", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to delete API key")
      }

      return response.json()
    },
    onSuccess: () => {
      showToast("Success!", "API key removed successfully.", "success")
      reset()
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      queryClient.invalidateQueries({ queryKey: ["apiKeyStatus"] })
    },
    onError: (err: Error) => {
      showToast("Error", err.message, "error")
    },
  })

  const onSubmit: SubmitHandler<UpdateAPIKeyForm> = async (data) => {
    updateMutation.mutate(data)
  }

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to remove your API key? You won't be able to use LLM features without it.")) {
      deleteMutation.mutate()
    }
  }

  const errorText = (field?: { message?: string }) =>
    field?.message ? (
      <p className="text-xs text-destructive">{field.message}</p>
    ) : null

  if (isLoadingStatus) {
    return (
      <div className="rounded-[28px] border border-slate-200/70 bg-white/80 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.65)]">
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/80 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.65)]">
      <div className="space-y-2 border-b border-slate-200/70 p-6 dark:border-slate-700/60">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          LLM Provider API Keys
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Set your API keys for different LLM providers. Your keys are stored securely and only used for your requests.
        </p>
        <div className="mt-3 rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
          <p className="text-xs text-green-700 dark:text-green-300">
            <strong>Note:</strong> All usage is tracked, including playground and API calls. Configure your API keys below to enable LLM features.
          </p>
        </div>
      </div>
      <div className="p-6">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Show "Add Provider" button if user has keys but not all providers are shown */}
          {hasAnyKey && !showAllProviders && (
            <div className="mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAllProviders(true)}
                className="text-sm"
              >
                + Add Another Provider
              </Button>
            </div>
          )}

          {/* Anthropic API Key */}
          {showAnthropicField && (
          <div className="space-y-2">
            <Label htmlFor="anthropic_api_key" className="text-sm font-medium">
              Anthropic API Key
            </Label>
            <div className="relative">
              <Input
                id="anthropic_api_key"
                type={showAnthropicKey ? "text" : "password"}
                autoComplete="off"
                placeholder="sk-ant-..."
                {...register("anthropic_api_key", {
                  validate: {
                    minLength: (value) => {
                      if (!value) return true
                      return value.length >= 10 || "API key is too short"
                    },
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
              >
                {showAnthropicKey ? "Hide" : "Show"}
              </button>
            </div>
            {errorText(errors.anthropic_api_key)}
            <p className="text-xs text-muted-foreground">
              Get your API key from{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Anthropic Console
              </a>
            </p>
          </div>
          )}

          {/* OpenAI API Key */}
          {showOpenAIField && (
          <div className="space-y-2">
            <Label htmlFor="openai_api_key" className="text-sm font-medium">
              OpenAI API Key
            </Label>
            <div className="relative">
              <Input
                id="openai_api_key"
                type={showOpenAIKey ? "text" : "password"}
                autoComplete="off"
                placeholder="sk-proj-..."
                {...register("openai_api_key", {
                  minLength: {
                    value: 10,
                    message: "API key is too short",
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
              >
                {showOpenAIKey ? "Hide" : "Show"}
              </button>
            </div>
            {errorText(errors.openai_api_key)}
            <p className="text-xs text-muted-foreground">
              Get your API key from{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>
          )}

          {/* Google API Key */}
          {showGoogleField && (
          <div className="space-y-2">
            <Label htmlFor="google_api_key" className="text-sm font-medium">
              Google Gemini API Key
            </Label>
            <div className="relative">
              <Input
                id="google_api_key"
                type={showGoogleKey ? "text" : "password"}
                autoComplete="off"
                placeholder="AIza..."
                {...register("google_api_key", {
                  minLength: {
                    value: 10,
                    message: "API key is too short",
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowGoogleKey(!showGoogleKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
              >
                {showGoogleKey ? "Hide" : "Show"}
              </button>
            </div>
            {errorText(errors.google_api_key)}
            <p className="text-xs text-muted-foreground">
              Get your API key from{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>
          )}

          {/* Hide extra providers button */}
          {hasAnyKey && showAllProviders && (
            <div className="mb-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAllProviders(false)}
                className="text-sm text-muted-foreground"
              >
                ↑ Show Only Active Providers
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting || updateMutation.isPending}>
              {isSubmitting || updateMutation.isPending ? "Saving…" : "Save API Keys"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removing…" : "Remove All Keys"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ApiKeySettings
