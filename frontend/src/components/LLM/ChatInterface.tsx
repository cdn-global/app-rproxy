import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLLMInference, type ChatMessage } from "@/hooks/useLLMInference"
import { Link } from "@tanstack/react-router"
import { FiSend, FiAlertCircle, FiUser, FiCpu, FiSettings } from "react-icons/fi"

interface ChatInterfaceProps {
  conversationId?: string
}

interface LLMModel {
  id: string
  name: string
  display_name: string
  provider?: string
  input_token_price: number
  output_token_price: number
  is_active: boolean
  max_tokens: number
}

const ChatInterface = ({ conversationId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [apiKeyError, setApiKeyError] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { sendMessage, sendStreamingMessage, isLoading, isStreaming, data: responseData, error } = useLLMInference()

  // Fetch available LLM models
  const { data: modelsData } = useQuery({
    queryKey: ["llm-models"],
    queryFn: async () => {
      const response = await fetch("/v2/llm-models/?is_active=true", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch models")
      return response.json() as Promise<{ data: LLMModel[]; count: number }>
    },
  })

  // Fetch conversation messages if conversationId exists
  const { data: conversationMessages } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return null
      const response = await fetch(`/v2/conversations/${conversationId}/messages`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch messages")
      return response.json() as Promise<{ data: ChatMessage[]; count: number }>
    },
    enabled: !!conversationId,
  })

  // Auto-select first active model
  useEffect(() => {
    if (modelsData?.data && modelsData.data.length > 0 && !selectedModel) {
      setSelectedModel(modelsData.data[0].id)
    }
  }, [modelsData, selectedModel])

  // Update messages from conversation history
  useEffect(() => {
    if (conversationMessages?.data) {
      setMessages(conversationMessages.data)
    }
  }, [conversationMessages])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Update messages when response arrives
  useEffect(() => {
    if (responseData) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: responseData.content,
        },
      ])
      setApiKeyError(false)
    }
  }, [responseData])

  // Check for API key errors
  useEffect(() => {
    if (error?.message.includes("API key")) {
      setApiKeyError(true)
    }
  }, [error])

  const handleSend = () => {
    if (!input.trim() || !selectedModel || isLoading || isStreaming) return

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
    }

    // Add user message to UI immediately
    setMessages((prev) => [...prev, userMessage])
    const allMessages = [...messages, userMessage]
    setInput("")

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Add placeholder for assistant message
    const assistantPlaceholder: ChatMessage = {
      role: "assistant",
      content: "",
    }
    setMessages((prev) => [...prev, assistantPlaceholder])

    // Send to API with streaming
    sendStreamingMessage(
      {
        model_id: selectedModel,
        messages: allMessages,
        conversation_id: conversationId,
      },
      (chunk) => {
        // Update the last message (assistant) with streaming content
        setMessages((prev) => {
          const updated = [...prev]
          const lastMsg = updated[updated.length - 1]
          if (lastMsg.role === "assistant") {
            lastMsg.content += chunk
          }
          return updated
        })
      },
      (data) => {
        // On complete
        setApiKeyError(false)
      },
      (error) => {
        // On error - remove placeholder message
        setMessages((prev) => prev.slice(0, -1))
      }
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const selectedModelData = modelsData?.data.find(m => m.id === selectedModel)

  return (
    <div className="flex h-full flex-col">
      {/* API Key Warning Banner */}
      {apiKeyError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                Provider API Key Required
              </h4>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                You need to configure your provider API key (Anthropic, OpenAI, or Google) to use language models.{" "}
                <Link
                  to="/profile"
                  className="font-semibold underline hover:no-underline"
                >
                  Configure Provider Keys →
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Model Selector */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-blue-400"
            >
              {modelsData?.data && modelsData.data.length > 0 ? (
                modelsData.data.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.display_name} ({model.provider || "Anthropic"})
                  </option>
                ))
              ) : (
                <option value="">No active models available</option>
              )}
            </select>
          </div>
          {selectedModelData && (
            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">In:</span>
                <span className="font-mono">${selectedModelData.input_token_price.toFixed(2)}/M</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Out:</span>
                <span className="font-mono">${selectedModelData.output_token_price.toFixed(2)}/M</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Max:</span>
                <span className="font-mono">{(selectedModelData.max_tokens / 1000).toFixed(0)}K</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Display */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50/50 to-white p-6 dark:border-slate-700 dark:from-slate-900/50 dark:to-slate-900">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 p-4 dark:from-blue-950/30 dark:to-blue-900/20">
                  <FiCpu className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Start a conversation
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Send a message to chat with {selectedModelData?.display_name || "the AI model"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950/30 dark:to-blue-900/20">
                    <FiCpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md"
                      : "border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
                  }`}
                >
                  <p className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${
                    msg.role === "user" ? "text-white" : "text-slate-900 dark:text-slate-100"
                  }`}>
                    {msg.content || (
                      <span className="inline-flex items-center gap-2 text-slate-400">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800">
                    <FiUser className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex gap-3 p-4">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              // Auto-resize textarea
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
            }}
            onKeyDown={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="min-h-[60px] max-h-[200px] flex-1 resize-none border-slate-300 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800"
            disabled={isLoading || isStreaming || !selectedModel}
          />
          <div className="flex flex-col justify-end gap-2">
            <Button
              onClick={handleSend}
              disabled={isLoading || isStreaming || !input.trim() || !selectedModel}
              className="h-[60px] rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 px-6 font-semibold shadow-md transition hover:shadow-lg disabled:opacity-50"
            >
              {isLoading || isStreaming ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Sending</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Send</span>
                  <FiSend className="h-4 w-4" />
                </div>
              )}
            </Button>
          </div>
        </div>
        {!selectedModel && (
          <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
            <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <FiSettings className="h-3.5 w-3.5" />
              <span>
                No models available.{" "}
                <Link to="/profile" className="font-semibold underline hover:no-underline">
                  Configure provider keys
                </Link>{" "}
                to get started.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatInterface
