import { useCallback, useMemo, useState } from "react"
import { Copy, Download, Eye, Send, Trash2 } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import useCustomToast from "@/hooks/useCustomToast"

interface CodeBlockProps {
  code: string
  language: string
  maxHeight?: string
}

interface RequestInfo {
  url: string
  region: string
}

interface ResultsData {
  requestInfo: RequestInfo
  jsonResponse: string
  htmlPreview: string
  headers: string
}

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

const API_URL = "https://api.ROAMINGPROXY.com/v2/proxy"

const CODE_TEMPLATES = [
  {
    id: "curl",
    label: "cURL",
    language: "bash",
    build: ({ url, region, apiKey }: { url: string; region: string; apiKey: string }) => `curl -X POST "${API_URL}/fetch?region=${region}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{"url": "${url}"}'`,
  },
  {
    id: "python",
    label: "Python",
    language: "python",
    build: ({ url, region, apiKey }: { url: string; region: string; apiKey: string }) =>
      `import requests\nimport json\n\napi_key = '${apiKey}'\nregion = '${region}'\nurl_to_fetch = '${url}'\n\napi_url = f'${API_URL}/fetch?region={region}'\n\nheaders = {\n    'Content-Type': 'application/json',\n    'x-api-key': api_key\n}\npayload = {'url': url_to_fetch}\n\nresponse = requests.post(api_url, headers=headers, data=json.dumps(payload))\n\nif response.status_code == 200:\n    print(json.dumps(response.json(), indent=2))\nelse:\n    print(f"Error: {response.status_code}")\n    print(response.text)`,
  },
  {
    id: "nodejs",
    label: "Node.js",
    language: "javascript",
    build: ({ url, region, apiKey }: { url: string; region: string; apiKey: string }) =>
      `const axios = require('axios');\n\nconst apiKey = '${apiKey}';\nconst region = '${region}';\nconst searchUrl = '${url}';\n\nconst apiUrl = '${API_URL}/fetch?region=${region}';\n\nconst headers = {\n  'Content-Type': 'application/json',\n  'x-api-key': apiKey\n};\nconst payload = { url: searchUrl };\n\naxios.post(apiUrl, payload, { headers })\n  .then(response => {\n    console.log(JSON.stringify(response.data, null, 2));\n  })\n  .catch(error => {\n    console.error('Error:', error.response ? error.response.data : error.message);\n  });`,
  },
] as const

const CodeBlock = ({ code, language, maxHeight = "60vh" }: CodeBlockProps) => (
  <SyntaxHighlighter
    language={language}
    style={vscDarkPlus}
    customStyle={{
      margin: 0,
      borderRadius: "0.75rem",
      padding: "1rem",
      maxHeight: maxHeight === "none" ? undefined : maxHeight,
      overflow: "auto",
      background: "#0f172a",
    }}
    wrapLongLines
  >
    {code}
  </SyntaxHighlighter>
)

const ResultsDialog = ({ open, onOpenChange, data }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ResultsData | null
}) => {
  const toast = useCustomToast()
  const [tab, setTab] = useState<"response" | "request">("response")

  if (!data) {
    return null
  }

  const { requestInfo, jsonResponse, htmlPreview, headers } = data

  const handleDownload = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const notifyCopy = (payload: string, label: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast("Copy unavailable", "Clipboard access is not available in this environment.", "error")
      return
    }

    navigator.clipboard.writeText(payload).then(() => {
      toast(`${label} copied`, "Content is ready in your clipboard.", "success")
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl rounded-3xl border border-slate-200/70 bg-white/95 p-0 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.75)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/95">
        <DialogHeader className="border-b border-slate-200/60 px-6 py-5 dark:border-slate-800/60">
          <DialogTitle className="text-2xl font-semibold">API call results</DialogTitle>
          <DialogDescription>
            Inspect the JSON payload, render the HTML preview, and review the response headers.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 px-6 py-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={tab === "response" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setTab("response")}
            >
              Response
            </Button>
            <Button
              type="button"
              variant={tab === "request" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setTab("request")}
            >
              Request & headers
            </Button>
          </div>

          {tab === "response" ? (
            <div className="space-y-6">
              <Card className="border border-slate-200/60 bg-slate-950 text-slate-100 dark:border-slate-700/60">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-100">
                      JSON response
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-300">
                      Structured data returned from the proxy endpoint.
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
                            onClick={() => notifyCopy(jsonResponse, "JSON")}
                            aria-label="Copy JSON"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy JSON</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-9 w-9 rounded-full"
                      onClick={() => handleDownload(jsonResponse, "response.json", "application/json")}
                      aria-label="Download JSON"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <CodeBlock code={jsonResponse} language="json" maxHeight="45vh" />
                </CardContent>
              </Card>

              <Card className="border border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/80">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-semibold">HTML preview</CardTitle>
                    <CardDescription className="text-xs">
                      Rendered content provided by the upstream page.
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
                            onClick={() => notifyCopy(htmlPreview, "HTML")}
                            aria-label="Copy HTML"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy HTML</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-9 w-9 rounded-full"
                      onClick={() => handleDownload(htmlPreview, "preview.html", "text/html")}
                      aria-label="Download HTML"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-2xl border border-slate-200/70 shadow-sm dark:border-slate-700/60">
                    <iframe
                      title="HTML Preview"
                      srcDoc={htmlPreview}
                      className="h-[65vh] w-full"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="border border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/80">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Request details</CardTitle>
                  <CardDescription className="text-xs">
                    Parameters submitted to the proxy fetch endpoint.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">URL</p>
                    <p className="mt-1 break-all font-mono text-sm text-foreground">{requestInfo.url}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Region</p>
                    <p className="mt-1 font-medium text-foreground">{requestInfo.region}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Method</p>
                    <p className="mt-1 font-medium text-foreground">POST</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/60 bg-slate-950 text-slate-100 dark:border-slate-700/60">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-100">Response headers</CardTitle>
                    <CardDescription className="text-xs text-slate-300">
                      Key metadata returned from the edge network.
                    </CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-9 w-9 rounded-full"
                          onClick={() => notifyCopy(headers, "Headers")}
                          aria-label="Copy headers"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy headers</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardHeader>
                <CardContent className="p-0">
                  <CodeBlock code={headers} language="json" />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        <DialogFooter className="border-t border-slate-200/60 px-6 py-4 dark:border-slate-800/60">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const PlaygroundHttps = () => {
  const toast = useCustomToast()
  const [url, setUrl] = useState("https://www.google.com/search?q=flowers&udm=2")
  const [region, setRegion] = useState(REGIONS[0])
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [resultsData, setResultsData] = useState<ResultsData | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeCode, setActiveCode] = useState<(typeof CODE_TEMPLATES)[number]["id"]>("curl")
  const [showLiveTest, setShowLiveTest] = useState(false)

  const displayApiKey = apiKey.trim() || "YOUR_API_KEY"

  const codeTabs = useMemo(
    () =>
      CODE_TEMPLATES.map((template) => ({
        id: template.id,
        label: template.label,
        language: template.language,
        code: template.build({ url, region, apiKey: displayApiKey }),
      })),
    [url, region, displayApiKey],
  )

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast("Copy unavailable", "Clipboard access is not available in this environment.", "error")
      return
    }

    navigator.clipboard.writeText(text).then(() => {
      toast(`${label} copied`, "The snippet is on your clipboard.", "success")
    })
  }

  const handleTestRequest = async () => {
    setIsLoading(true)
    setError("")
    setResponseTime(null)

    try {
      const startTime = typeof performance !== "undefined" ? performance.now() : 0
      const response = await fetch(`${API_URL}/fetch?region=${region}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ url }),
      })
      const endTime = typeof performance !== "undefined" ? performance.now() : startTime
      setResponseTime(Math.round(endTime - startTime))

      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const body = await response.json()
      if (!response.ok) {
        throw new Error(body.detail || `HTTP error! status: ${response.status}`)
      }

      setResultsData({
        requestInfo: { url, region },
        jsonResponse: JSON.stringify(body, null, 2),
        htmlPreview: body.result || "<!-- No HTML content in response -->",
        headers: JSON.stringify(responseHeaders, null, 2),
      })
      setDialogOpen(true)
    } catch (err) {
      setResultsData(null)
      setError(err instanceof Error ? err.message : "Unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const activeCodeSnippet = codeTabs.find((tab) => tab.id === activeCode) ?? codeTabs[0]

  const handleShowLiveTest = useCallback(() => {
    setShowLiveTest(true)
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        const target = document.getElementById("https-live-test")
        target?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    }
  }, [])

  const handleHideLiveTest = useCallback(() => {
    setShowLiveTest(false)
    setDialogOpen(false)
    setResultsData(null)
    setError("")
  }, [])

  const cardClassName = showLiveTest
    ? "rounded-[32px] border border-slate-200/70 bg-white/95 shadow-[0_44px_110px_-66px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85"
    : "rounded-[32px] border border-slate-200/70 bg-gradient-to-br from-white/95 via-white/92 to-indigo-50/60 shadow-[0_34px_95px_-58px_rgba(15,23,42,0.6)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-gradient-to-br dark:from-slate-950/88 dark:via-slate-900/78 dark:to-slate-900/68"

  return (
    <div className="space-y-10">
      <Card id="https-live-test" className={cardClassName}>
        {showLiveTest ? (
          <>
            <CardHeader className="gap-4 px-8 pt-8 pb-0 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">Interactive playground</CardTitle>
                <CardDescription>
                  Configure a live HTTPS fetch, inspect the structured response, and grab the exact code you need—without leaving this screen.
                </CardDescription>
              </div>
              <Button variant="outline" className="rounded-full" onClick={handleHideLiveTest}>
                Back to overview
              </Button>
            </CardHeader>
            <CardContent className="space-y-10 px-8 pb-0 pt-6">
              <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr),minmax(0,1fr)]">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground" htmlFor="url">
                      Search URL
                    </label>
                    <Input
                      id="url"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="https://www.google.com/search?q=flowers&udm=2"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-[2fr_1fr_auto]">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground" htmlFor="api-key">
                        API key
                      </label>
                      <Input
                        id="api-key"
                        type="password"
                        value={apiKey}
                        onChange={(event) => setApiKey(event.target.value)}
                        placeholder="Enter your API key"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground" htmlFor="region">
                        Region
                      </label>
                      <select
                        id="region"
                        value={region}
                        onChange={(event) => setRegion(event.target.value)}
                        className="h-11 w-full rounded-2xl border border-slate-200/70 bg-white/90 px-3 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-100"
                      >
                        {REGIONS.map((reg) => (
                          <option key={reg} value={reg}>
                            {reg}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        className="w-full rounded-full px-6"
                        onClick={handleTestRequest}
                        disabled={isLoading || !url.trim() || !apiKey.trim()}
                        isLoading={isLoading}
                        loadingText="Testing…"
                      >
                        {!isLoading ? (
                          <span className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Test request
                          </span>
                        ) : null}
                      </Button>
                    </div>
                  </div>

                  {error ? (
                    <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
                      <AlertTitle>Request failed</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : null}

                  {resultsData && !error ? (
                    <Alert className="border-emerald-400/40 bg-emerald-500/10">
                      <AlertTitle>Request completed</AlertTitle>
                      <AlertDescription className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                          Response time: {responseTime ?? "—"} ms. Open the modal to inspect the payload or dismiss to reset.
                        </span>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            className="rounded-full"
                            onClick={() => setResultsData(null)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Dismiss
                          </Button>
                          <Button type="button" className="rounded-full" onClick={() => setDialogOpen(true)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View response
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </div>

                <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-slate-950/95 text-slate-100 shadow-[0_26px_70px_-48px_rgba(15,23,42,0.75)] dark:border-slate-700/60">
                  <div className="flex flex-col gap-3 border-b border-slate-800/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-100">Generated code</h3>
                      <p className="text-xs text-slate-300">
                        Snippets refresh instantly as parameters change.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {codeTabs.map((tab) => (
                        <Button
                          key={tab.id}
                          variant={activeCode === tab.id ? "default" : "secondary"}
                          className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.18em]"
                          onClick={() => setActiveCode(tab.id)}
                        >
                          {tab.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute right-4 top-4 h-9 w-9 rounded-full"
                      onClick={() => handleCopy(activeCodeSnippet.code, activeCodeSnippet.label)}
                      aria-label="Copy code"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <CodeBlock code={activeCodeSnippet.code} language={activeCodeSnippet.language} maxHeight="none" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 rounded-b-[26px] border-t border-slate-200/70 bg-gradient-to-r from-white/70 via-white/65 to-white/70 px-8 py-6 text-sm text-slate-600 dark:border-slate-800/70 dark:from-slate-900/70 dark:via-slate-900/65 dark:to-slate-900/70 dark:text-slate-300 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Need help accelerating integration?</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dive into detailed docs or connect with support engineers for guided onboarding.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline" className="rounded-full">
                  <a href="/documentation/serp-api" target="_blank" rel="noreferrer">
                    Documentation
                  </a>
                </Button>
                <Button asChild className="rounded-full">
                  <a href="/support" target="_blank" rel="noreferrer">
                    Support center
                  </a>
                </Button>
              </div>
            </CardFooter>
          </>
        ) : (
          <CardContent className="flex flex-col gap-6 p-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl space-y-4">
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-300">
                Live HTTPS endpoint tester
              </span>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                HTTPS Fetch Playground
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-300">
                Explore the proxy workflow, review generated snippets, and launch a live test whenever you&apos;re ready.
              </p>
              <div className="flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/60 px-3 py-1 dark:border-slate-700/60 dark:bg-slate-900/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  Live requests
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/60 px-3 py-1 dark:border-slate-700/60 dark:bg-slate-900/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
                  Response inspector
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/60 px-3 py-1 dark:border-slate-700/60 dark:bg-slate-900/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden="true" />
                  Copyable code
                </span>
              </div>
            </div>
            <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white/70 p-6 text-sm text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-300">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Get started in three steps
                </p>
                <ol className="mt-3 space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100">1.</span>
                    Enter a target URL and API key.
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100">2.</span>
                    Choose the region that matches your test.
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100">3.</span>
                    Trigger a live request and inspect every detail.
                  </li>
                </ol>
              </div>
              <Button className="w-fit rounded-full px-6" onClick={handleShowLiveTest}>
                Begin live test
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <ResultsDialog open={dialogOpen} onOpenChange={setDialogOpen} data={resultsData} />
    </div>
  )
}

export default PlaygroundHttps
