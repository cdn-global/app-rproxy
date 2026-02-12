import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback } from "react"
import useCustomToast from "./useCustomToast"
import { handleError } from "@/utils"
import type { ApiError } from "@/client"

// These types will be auto-generated after running npm run generate-client
// For now, we'll define them manually to match our backend API
interface ChatMessage {
  role: string
  content: string
}

interface ChatCompletionRequest {
  model_id: string
  messages: ChatMessage[]
  conversation_id?: string
  max_tokens?: number
  temperature?: number
}

interface ChatCompletionResponse {
  id: string
  conversation_id: string
  message_id: string
  content: string
  model: string
  input_tokens: number
  output_tokens: number
  cost: number
}

interface StreamChunk {
  id: string
  conversation_id: string
  message_id?: string
  content: string
  model: string
  input_tokens?: number
  output_tokens?: number
  cost?: number
  done: boolean
  error?: string
}

export const useLLMInference = () => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedContent, setStreamedContent] = useState("")

  const chatMutation = useMutation({
    mutationFn: async (request: ChatCompletionRequest): Promise<ChatCompletionResponse> => {
      const response = await fetch("/v2/llm/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to create chat completion")
      }

      return response.json()
    },
    onSuccess: (data) => {
      showToast("Success", "Message sent successfully", "success")
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
      queryClient.invalidateQueries({ queryKey: ["messages", data.conversation_id] })
    },
    onError: (err: Error) => {
      showToast("Error", err.message, "error")
    },
  })

  const sendStreamingMessage = useCallback(
    async (
      request: ChatCompletionRequest,
      onChunk: (content: string) => void,
      onComplete?: (data: { conversation_id: string; message_id: string; cost: number }) => void,
      onError?: (error: string) => void
    ) => {
      setIsStreaming(true)
      setStreamedContent("")

      try {
        const response = await fetch("/v2/llm/chat/completions/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.detail || "Failed to create streaming chat completion")
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error("Failed to get response reader")
        }

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim()

              // Skip empty data
              if (!data) continue

              try {
                const chunk: StreamChunk = JSON.parse(data)

                if (chunk.error) {
                  onError?.(chunk.error)
                  showToast("Error", chunk.error, "error")
                  break
                }

                if (chunk.content) {
                  setStreamedContent(prev => prev + chunk.content)
                  onChunk(chunk.content)
                }

                if (chunk.done && chunk.message_id) {
                  onComplete?.({
                    conversation_id: chunk.conversation_id,
                    message_id: chunk.message_id,
                    cost: chunk.cost || 0,
                  })
                  queryClient.invalidateQueries({ queryKey: ["conversations"] })
                  queryClient.invalidateQueries({ queryKey: ["messages", chunk.conversation_id] })
                }
              } catch (e) {
                // Only log parse errors for non-empty data
                if (data) {
                  console.error("Failed to parse SSE chunk:", data, e)
                }
              }
            }
          }
        }
      } catch (err) {
        const error = err as Error
        showToast("Error", error.message, "error")
        onError?.(error.message)
      } finally {
        setIsStreaming(false)
      }
    },
    [queryClient, showToast]
  )

  return {
    sendMessage: chatMutation.mutate,
    sendStreamingMessage,
    isLoading: chatMutation.isPending,
    isStreaming,
    streamedContent,
    data: chatMutation.data,
    error: chatMutation.error,
  }
}

export type { ChatMessage, ChatCompletionRequest, ChatCompletionResponse }
