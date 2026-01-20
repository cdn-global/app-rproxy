import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ExternalLink } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import useCustomToast from "@/hooks/useCustomToast"

import { parseApiResponse } from "@/lib/api"
import ProtectedComponent from "../../../components/Common/ProtectedComponent"
import PlaygroundHttpsProxy from "../../../components/ScrapingTools/PlaygroundHttps"
import ApiKeyModule from "../../../components/ScrapingTools/ApiKey"
import UsageInsights from "../../../components/Dashboard/UsageInsights"
import ChartsSection from "../../../components/Dashboard/ChartsSection"
import { calculateDashboardStats } from "../../../lib/dashboardUtils"

// --- Interfaces and Helper Functions ---
interface Subscription {
  id: string
  status: string
}

interface ProxyApiAccess {
  has_access: boolean
  message: string | null
}

const API_URL = "https://api.ROAMINGPROXY.com/v2"

async function requestFromApi<T>(endpoint: string, token: string) {
  if (!token) {
    throw new Error("No access token found. Please log in again.")
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  return parseApiResponse<T>(response)
}

const fetchSubscriptions = (token: string) =>
  requestFromApi<Subscription[]>("/customer/subscriptions", token)

const fetchProxyApiAccess = (token: string) =>
  requestFromApi<ProxyApiAccess>("/proxy-api/access", token)

const HttpsProxyApiPage = () => {
  const tabTitle = "Interactive API Playground"
  const tabDescription = "Test endpoints, customize requests, and generate code snippets."
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") || "" : ""
  const toast = useCustomToast()

  const {
    data: subscriptions,
    isLoading: subscriptionsLoading,
    error: subscriptionsError,
  } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => fetchSubscriptions(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: proxyApiAccess,
    isLoading: accessLoading,
    error: accessError,
  } = useQuery({
    queryKey: ["proxyApiAccess"],
    queryFn: () => fetchProxyApiAccess(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })

  const isLoading = subscriptionsLoading || accessLoading
  const error = subscriptionsError || accessError
  const hasActiveSubscription = subscriptions?.some((sub) =>
    ["active", "trialing"].includes(sub.status),
  )

  return (
    <ProtectedComponent>
      <div className="space-y-10 py-10">
        {isLoading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <Spinner size={48} />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
            <AlertTitle>Unable to load access details</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Something went wrong while loading your subscription status."}
            </AlertDescription>
          </Alert>
        ) : !hasActiveSubscription ? (
          <Alert className="border-amber-300/40 bg-amber-100/60 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
            <AlertTitle>No active subscription detected</AlertTitle>
            <AlertDescription>
              Subscribe to an eligible plan to unlock HTTPS Proxy API access for this workspace.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-8">
            {!proxyApiAccess?.has_access ? (
              <Alert className="border-amber-300/40 bg-amber-100/60 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                <AlertTitle>HTTPS Proxy not included in your plan</AlertTitle>
                <AlertDescription>
                  {proxyApiAccess?.message ||
                    "Upgrade to a plan that bundles HTTPS proxy usage, or contact support to enable access."}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Interactive API Playground</h2>
                <p className="text-sm text-muted-foreground">{tabDescription}</p>
              </div>
              <div>
                <Button
                  type="button"
                  className="rounded-full"
                  onClick={async () => {
                    if (!token) {
                      toast("Sign in required", "Log in to generate keys.", "warning")
                      return
                    }
                    try {
                      const resp = await fetch(`${API_URL}/proxy/generate-api-key`, {
                        method: "POST",
                        headers: {
                          Accept: "application/json",
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({}),
                      })
                      if (!resp.ok) {
                        const err = await resp.json().catch(() => ({}))
                        throw new Error(err.detail || `Failed to generate key: ${resp.status}`)
                      }
                      const data = await resp.json().catch(() => ({}))
                      window.dispatchEvent(new CustomEvent("apiKeyGenerated", { detail: data }))
                      toast("Key generated", "A new API key was created.", "success")
                    } catch (e) {
                      toast("Unable to generate key", e instanceof Error ? e.message : String(e), "error")
                    }
                  }}
                >
                  Generate key
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Usage Analytics & Insights</CardTitle>
                  <CardDescription>An overview of your recent API usage and performance.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <UsageInsights stats={calculateDashboardStats(1, 2, 3, [])} />
                <ChartsSection />
              </CardContent>
            </Card>

            <Card className="border border-slate-200/70 bg-white/80 shadow-[0_40px_90px_-60px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-2xl">Interactive playground</CardTitle>
                <CardDescription>
                  Experiment with live requests, inspect responses, and export ready-made snippets for your stack.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlaygroundHttpsProxy />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>API Key Management</CardTitle>
                  <CardDescription>Generate and rotate credential tokens for programmatic access. Keys expire after 365 days.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ApiKeyModule token={token} />
              </CardContent>
            </Card>
            {/* Decorative card moved outside the playground so tunneling text sits independently */}
            <Card className="relative overflow-hidden rounded-[20px] border border-transparent text-slate-900 shadow-md dark:text-slate-100">
              <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.68),_transparent_55%),_radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.52),_transparent_55%)]" />
              <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/80 via-white/55 to-white/35 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-slate-900/40" />
              <CardHeader className="relative space-y-2 rounded-lg bg-white/90 p-4 dark:bg-slate-900/70">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-4 py-1 text-[0.65rem] uppercase tracking-[0.25em] text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/70">
                  <span>Web Scraping</span>
                  <span className="h-1 w-1 rounded-full bg-slate-400" aria-hidden="true" />
                  <span>HTTPS Proxy</span>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    Tunnel HTTP/S traffic through
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Tunnel traffic through managed proxies with retries and geo-targeting.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  <Badge variant="outline">Global Egress</Badge>
                  <Badge variant="outline">Session Pinning</Badge>
                  <Badge variant="outline">Rotating IPs</Badge>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}
      </div>
    </ProtectedComponent>
  )
}

export const Route = createFileRoute('/_layout/web-scraping-tools/https-api')({
  component: HttpsProxyApiPage,
})

export default HttpsProxyApiPage
