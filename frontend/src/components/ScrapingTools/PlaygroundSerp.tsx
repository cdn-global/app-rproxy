import { Copy, Download, Eye, Send } from "lucide-react"
import { useState } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import useCustomToast from "../../hooks/useCustomToast"

// Define regions and search engines
const REGIONS = [
  "us-east",
  "us-west",
  "us-central",
  "northamerica-northeast",
  "southamerica",
  "asia",
  "australia",
  "europe",
  "middle-east",
]

// CORRECTED: Matched search engines to backend support
const SEARCH_ENGINES = [
  { value: "google", label: "Google" },
  { value: "bing", label: "Bing" },
  { value: "duckduckgo", label: "DuckDuckGo" },
]

// Define interface for structured result
interface SerpResult {
  position: number
  title: string
  link: string
  snippet: string
}

// CORRECTED: Changed endpoint to match the backend router prefix
const API_URL = "/v2/proxy/serp"

const CodeBlock = ({ code }: { code: string }) => (
  <SyntaxHighlighter
    language="javascript"
    style={vscDarkPlus}
    customStyle={{
      margin: 0,
      borderRadius: "0.75rem",
      padding: "1rem",
      minHeight: "260px",
      background: "#0f172a",
    }}
    wrapLongLines
  >
    {code}
  </SyntaxHighlighter>
)

const PlaygroundSerpApi = () => {
  const toast = useCustomToast()
  const [query, setQuery] = useState<string>("best pizza in new york")
  const [region, setRegion] = useState<string>(REGIONS[0])
  const [searchEngine, setSearchEngine] = useState<string>(
    SEARCH_ENGINES[0].value,
  )
  const [apiKey, setApiKey] = useState<string>("")
  const [response, setResponse] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [activeCodeId, setActiveCodeId] = useState<string>("curl")

  const generateCurlCommand = () => {
    const params = new URLSearchParams({
      q: query,
      region,
      engine: searchEngine,
    })
    const displayKey = apiKey.trim() || "YOUR_API_KEY"
    return `curl -X GET "${API_URL}?${params.toString()}" \\
  -H "x-api-key: ${displayKey}"`
  }

  const generatePythonCode = () => {
    const displayKey = apiKey.trim() || "YOUR_API_KEY"
    return `import requests

url = "${API_URL}"
params = {
    "q": "${query}",
    "region": "${region}",
    "engine": "${searchEngine}"
}
headers = {
    "x-api-key": "${displayKey}"
}

response = requests.get(url, params=params, headers=headers)
print(response.json())
`
  }

  const generateJsCode = () => {
    const displayKey = apiKey.trim() || "YOUR_API_KEY"
    return `const fetch = require('node-fetch');

const url = new URL("${API_URL}");
url.searchParams.append('q', '${query}');
url.searchParams.append('region', '${region}');
url.searchParams.append('engine', '${searchEngine}');

fetch(url, {
    headers: {
        'x-api-key': '${displayKey}'
    }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
`
  }

  const codeSnippets = [
    { id: "curl", label: "cURL", code: generateCurlCommand() },
    { id: "python", label: "Python", code: generatePythonCode() },
    { id: "javascript", label: "JavaScript", code: generateJsCode() },
  ]

  const handleCopyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast(`${label} copied`, "The snippet is on your clipboard.", "success")
    })
  }

  const handleCopyResponse = () => {
    if (!response) return
    navigator.clipboard.writeText(response).then(() => {
      toast("Response copied", "JSON response has been copied.", "success")
    })
  }

  const handleTestRequest = async () => {
    setIsLoading(true)
    setResponse("")
    setError("")
    setResponseTime(null)

    try {
      const startTime = performance.now()
      const params = new URLSearchParams({
        q: query,
        region,
        engine: searchEngine,
      })
      const requestUrl = `${API_URL}?${params.toString()}`
      const res = await fetch(requestUrl, {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          Accept: "application/json",
        },
      })

      const endTime = performance.now()
      const timeTaken = Math.round(endTime - startTime)
      setResponseTime(timeTaken)

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ detail: `HTTP error! status: ${res.status}` }))
        throw new Error(errorData.detail || "An unknown error occurred.")
      }

      const jsonResponse = await res.json()
      setResponse(JSON.stringify(jsonResponse, null, 2))
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadResponse = () => {
    if (response) {
      const blob = new Blob([response], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "response.json"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleViewFormatted = () => {
    if (response) {
      const newWindow = window.open("", "_blank")
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Formatted Response</title>
              <style>body { font-family: monospace; padding: 20px; } pre { background: #f4f4f4; padding: 20px; border-radius: 8px; }</style>
            </head>
            <body>
              <pre>${JSON.stringify(JSON.parse(response), null, 2)}</pre>
            </body>
          </html>
        `)
        newWindow.document.close()
      } else {
        toast(
          "Popup blocked",
          "Allow popups for this site to view formatted responses.",
          "error",
        )
      }
    }
  }

  return (
    <div className="space-y-8">
      <Card className="border border-slate-200/70 bg-white/80 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
        <CardHeader className="space-y-3">
          <CardTitle className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            SERP Playground
          </CardTitle>
          <CardDescription>
            Prototype search queries against the Roaming Proxy SERP endpoint. Adjust parameters, run live requests, and grab ready-to-use code snippets.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border border-slate-200/70 bg-white/80 shadow-[0_40px_90px_-60px_rgba(15,23,42,0.5)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
        <CardHeader>
          <CardTitle className="text-xl">Build your request</CardTitle>
          <CardDescription>
            Supply a keyword query, choose a region and engine, then execute a live request with your API key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label
              className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
              htmlFor="serp-query"
            >
              Search query
            </label>
            <Input
              id="serp-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="best pizza in new york"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto]">
            <div className="space-y-2">
              <label
                className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
                htmlFor="serp-key"
              >
                API key
              </label>
              <Input
                id="serp-key"
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="Enter your API key"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
                htmlFor="serp-region"
              >
                Region
              </label>
              <select
                id="serp-region"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200/70 bg-white/90 px-3 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-100"
              >
                {REGIONS.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
                htmlFor="serp-engine"
              >
                Search engine
              </label>
              <select
                id="serp-engine"
                value={searchEngine}
                onChange={(event) => setSearchEngine(event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200/70 bg-white/90 px-3 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-100"
              >
                {SEARCH_ENGINES.map((engine) => (
                  <option key={engine.value} value={engine.value}>
                    {engine.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      className="w-full rounded-full px-6"
                      onClick={handleTestRequest}
                      disabled={
                        isLoading ||
                        !query.trim() ||
                        !apiKey.trim() ||
                        !region ||
                        !searchEngine
                      }
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-[2px] border-emerald-200 border-t-emerald-600" />
                          Sending…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Run test
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send test request</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {error ? (
            <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
              <AlertTitle>Request failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {responseTime !== null ? (
            <p className="text-sm text-muted-foreground">
              Response time: {responseTime} ms
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-slate-200/70 bg-white/80 shadow-[0_32px_90px_-58px_rgba(15,23,42,0.65)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg">Response</CardTitle>
              <CardDescription>
                Inspect the raw JSON returned by the SERP endpoint.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-9 w-9 rounded-full"
                      onClick={handleCopyResponse}
                      disabled={!response}
                      aria-label="Copy response"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy response</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                size="icon"
                variant="secondary"
                className="h-9 w-9 rounded-full"
                onClick={handleDownloadResponse}
                disabled={!response}
                aria-label="Download response"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-9 w-9 rounded-full"
                onClick={handleViewFormatted}
                disabled={!response}
                aria-label="Open formatted view"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-72 items-center justify-center">
                <Spinner size={40} />
              </div>
            ) : response ? (
              <pre className="h-72 overflow-hidden overflow-y-auto rounded-2xl border border-slate-200/70 bg-slate-950 p-4 text-xs text-slate-100 dark:border-slate-700/60">
                {response}
              </pre>
            ) : (
              <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-200/70 text-sm text-muted-foreground dark:border-slate-700/60">
                Response will appear here after testing.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-slate-950 text-slate-100 shadow-[0_32px_90px_-58px_rgba(15,23,42,0.75)] dark:border-slate-700/60">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg text-slate-100">Code examples</CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Select your preferred language and copy the generated snippet.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {codeSnippets.map((snippet) => (
                <Button
                  key={snippet.id}
                  variant={activeCodeId === snippet.id ? "default" : "secondary"}
                  className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.2em]"
                  onClick={() => setActiveCodeId(snippet.id)}
                >
                  {snippet.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="relative">
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-4 top-4 h-9 w-9 rounded-full"
              onClick={() =>
                handleCopyCode(
                  codeSnippets.find((snippet) => snippet.id === activeCodeId)?.code ??
                    codeSnippets[0].code,
                  codeSnippets.find((snippet) => snippet.id === activeCodeId)?.label ??
                    codeSnippets[0].label,
                )
              }
              aria-label="Copy code"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <CodeBlock
              code={
                codeSnippets.find((snippet) => snippet.id === activeCodeId)?.code ??
                codeSnippets[0].code
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PlaygroundSerpApi
