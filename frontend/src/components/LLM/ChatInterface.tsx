import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLLMInference, type ChatMessage } from "@/hooks/useLLMInference"
import { Link } from "@tanstack/react-router"

interface ChatInterfaceProps {
  conversationId?: string
}

interface LLMModel {
  id: string
  name: string
  display_name: string
  input_token_price: number
  output_token_price: number
  is_active: boolean
}

const ChatInterface = ({ conversationId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [apiKeyError, setApiKeyError] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* API Key Warning */}
      {apiKeyError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h4 className="font-medium text-amber-900 dark:text-amber-100">
                API Key Required
              </h4>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                You need to set your Anthropic API key to use LLM features.{" "}
                <Link
                  to="/profile"
                  className="font-medium underline hover:no-underline"
                >
                  Go to Profile Settings
                </Link>{" "}
                to add your API key.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Model Selector */}
      <div className="rounded-lg border bg-card p-4">
        <label className="mb-2 block text-sm font-medium">Select Model</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        >
          <option value="">Choose a model...</option>
          {modelsData?.data.map((model) => (
            <option key={model.id} value={model.id}>
              {model.display_name} - ${model.input_token_price}/M input, $
              {model.output_token_price}/M output
            </option>
          ))}
        </select>
      </div>

      {/* Messages Display */}
      <div className="flex-1 overflow-y-auto rounded-lg border bg-card p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line, Enter to send)"
            className="min-h-[60px] flex-1 resize-none"
            disabled={isLoading || isStreaming || !selectedModel}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || isStreaming || !input.trim() || !selectedModel}
            className="self-end"
          >
            {isLoading || isStreaming ? "Streaming..." : "Send"}
          </Button>
        </div>
        {!selectedModel && (
          <p className="mt-2 text-sm text-muted-foreground">
            Please select a model to start chatting
          </p>
        )}
      </div>
    </div>
  )
}

export default ChatInterface
