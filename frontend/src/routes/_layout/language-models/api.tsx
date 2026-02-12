import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PageScaffold, { PageSection } from "@/components/Common/PageLayout";
import useCustomToast from "@/hooks/useCustomToast";

interface InferenceModel {
  id: string;
  name: string;
  display_name: string;
  provider: string;
  model_id: string;
}

function LanguageModelsApiPage() {
  const showToast = useCustomToast();
  const [selectedModelId, setSelectedModelId] = useState("");
  const [testPrompt, setTestPrompt] = useState("What is the capital of France?");
  const [apiResponse, setApiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get API base URL
  const baseUrl = window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : `https://${window.location.hostname.replace("-5173", "-8000")}`;

  const { data: modelsData } = useQuery<{ data: InferenceModel[]; count: number }>({
    queryKey: ["llm-models-api"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/v2/llm-models/?is_active=true`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch models");
      return res.json();
    },
  });

  const models = modelsData?.data ?? [];
  const selectedModel = models.find((m) => m.id === selectedModelId);

  // Auto-select first model
  if (models.length > 0 && !selectedModelId) {
    setSelectedModelId(models[0].id);
  }

  const handleTestApi = async () => {
    if (!selectedModelId || !testPrompt.trim()) return;

    setIsLoading(true);
    setApiResponse("");

    try {
      const response = await fetch(`${baseUrl}/v2/llm/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          model_id: selectedModelId,
          messages: [{ role: "user", content: testPrompt }],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "API request failed");
      }

      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
      showToast("Success", "API request completed", "success");
    } catch (error: any) {
      showToast("Error", error.message, "error");
      setApiResponse(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const curlExample = selectedModel
    ? `curl -X POST "${baseUrl}/v2/llm/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -d '{
    "model_id": "${selectedModelId}",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ],
    "max_tokens": 1024,
    "temperature": 0.7
  }'`
    : "";

  const pythonExample = selectedModel
    ? `import requests

url = "${baseUrl}/v2/llm/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
data = {
    "model_id": "${selectedModelId}",
    "messages": [
        {"role": "user", "content": "Hello, how are you?"}
    ],
    "max_tokens": 1024,
    "temperature": 0.7
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`
    : "";

  const javascriptExample = selectedModel
    ? `const response = await fetch("${baseUrl}/v2/llm/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ACCESS_TOKEN"
  },
  body: JSON.stringify({
    model_id: "${selectedModelId}",
    messages: [
      { role: "user", content: "Hello, how are you?" }
    ],
    max_tokens: 1024,
    temperature: 0.7
  })
});

const data = await response.json();
console.log(data);`
    : "";

  return (
    <PageScaffold sidebar={null}>
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">LLM API Documentation</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Use our REST API to integrate AI language models into your applications
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

        {/* Authentication */}
        <PageSection id="authentication" title="Authentication" description="All API requests require authentication">
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 dark:border-slate-700/60 dark:bg-slate-900/70">
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Include your access token in the Authorization header of each request:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100 dark:bg-slate-950">
              <code>Authorization: Bearer YOUR_ACCESS_TOKEN</code>
            </pre>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Your access token: <code className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">{localStorage.getItem("access_token")?.substring(0, 20)}...</code>
            </p>
          </div>
        </PageSection>

        {/* API Key Configuration */}
        <PageSection id="api-keys" title="API Key Configuration" description="Required for POST /v2/llm/chat/completions">
          <div className="rounded-[28px] border border-blue-200/70 bg-blue-50/50 p-6 dark:border-blue-700/60 dark:bg-blue-900/20">
            <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">
              Create an API key to call <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">POST /v2/llm/chat/completions</code> programmatically.
              Use your key as a Bearer token in every request.
            </p>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              All requests are logged per key. Keys with usage history cannot be deleted — only disabled.
            </p>
            <div className="flex gap-2">
              <Button variant="default" asChild>
                <Link to="/language-models/keys">Manage API Keys →</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/profile">Provider Keys (OpenAI, Anthropic, Google)</Link>
              </Button>
            </div>
          </div>
        </PageSection>

        {/* Endpoints */}
        <PageSection id="endpoints" title="API Endpoints" description="Available endpoints for LLM inference">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  POST
                </span>
                <code className="text-sm font-medium">/v2/llm/chat/completions</code>
              </div>
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                Create a chat completion (non-streaming)
              </p>
              <div className="space-y-2 text-xs">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Request Body:</p>
                <ul className="ml-4 list-disc space-y-1 text-slate-600 dark:text-slate-400">
                  <li><code>model_id</code> (string, required) - UUID of the model to use</li>
                  <li><code>messages</code> (array, required) - Array of message objects with role and content</li>
                  <li><code>max_tokens</code> (integer, optional) - Maximum tokens to generate (default: 4096)</li>
                  <li><code>temperature</code> (float, optional) - Sampling temperature 0-2 (default: 1.0)</li>
                  <li><code>conversation_id</code> (string, optional) - UUID to continue existing conversation</li>
                </ul>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  POST
                </span>
                <code className="text-sm font-medium">/v2/llm/chat/completions/stream</code>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Create a chat completion with Server-Sent Events (SSE) streaming
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  GET
                </span>
                <code className="text-sm font-medium">/v2/llm-models/</code>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                List all available LLM models with pricing and capabilities
              </p>
            </div>
          </div>
        </PageSection>

        {/* Code Examples */}
        <PageSection id="examples" title="Code Examples" description="Example requests in different languages">
          <div className="space-y-4">
            {/* Model Selector */}
            <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-4 dark:border-slate-700/60 dark:bg-slate-900/70">
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Select Model for Examples:
              </label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>

            {/* cURL */}
            <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 dark:border-slate-700/60 dark:bg-slate-900/70">
              <h3 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">cURL</h3>
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100 dark:bg-slate-950">
                <code>{curlExample}</code>
              </pre>
            </div>

            {/* Python */}
            <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 dark:border-slate-700/60 dark:bg-slate-900/70">
              <h3 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">Python</h3>
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100 dark:bg-slate-950">
                <code>{pythonExample}</code>
              </pre>
            </div>

            {/* JavaScript */}
            <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 dark:border-slate-700/60 dark:bg-slate-900/70">
              <h3 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">JavaScript</h3>
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100 dark:bg-slate-950">
                <code>{javascriptExample}</code>
              </pre>
            </div>
          </div>
        </PageSection>

        {/* API Tester */}
        <PageSection id="tester" title="API Tester" description="Test the API directly from your browser">
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 dark:border-slate-700/60 dark:bg-slate-900/70">
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Test Prompt
              </label>
              <Textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Enter your test prompt..."
                rows={3}
                className="w-full"
              />
            </div>

            <Button onClick={handleTestApi} disabled={isLoading || !selectedModelId} className="mb-4">
              {isLoading ? "Testing..." : "Send Test Request"}
            </Button>

            {apiResponse && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Response
                </label>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100 dark:bg-slate-950">
                  <code>{apiResponse}</code>
                </pre>
              </div>
            )}
          </div>
        </PageSection>

        {/* Response Format */}
        <PageSection id="response" title="Response Format" description="Example API response structure">
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 dark:border-slate-700/60 dark:bg-slate-900/70">
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100 dark:bg-slate-950">
              <code>{`{
  "id": "msg_abc123",
  "conversation_id": "conv_xyz789",
  "message_id": "uuid-1234",
  "content": "The capital of France is Paris.",
  "model": "claude-3-5-sonnet-20241022",
  "input_tokens": 15,
  "output_tokens": 8,
  "cost": 0.000069
}`}</code>
            </pre>
          </div>
        </PageSection>

        {/* Usage Tracking */}
        <PageSection id="tracking" title="Usage Tracking" description="All API requests are tracked for billing">
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 dark:border-slate-700/60 dark:bg-slate-900/70">
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Every API request is automatically logged and tracked in your billing report. You can view detailed usage statistics including:
            </p>
            <ul className="ml-6 list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>Total API requests</li>
              <li>Input and output token counts</li>
              <li>Exact costs per request</li>
              <li>Models used over time</li>
            </ul>
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link to="/language-models/billing">View Usage & Billing →</Link>
              </Button>
            </div>
          </div>
        </PageSection>
      </div>
    </PageScaffold>
  );
}

export const Route = createFileRoute("/_layout/language-models/api")({
  component: LanguageModelsApiPage,
});
