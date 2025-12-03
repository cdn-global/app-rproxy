import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import ProtectedComponent from "../../../components/Common/ProtectedComponent"
import ApiKeyModule from "../../../components/ScrapingTools/ApiKey"
import PlaygroundSerpApi from "../../../components/ScrapingTools/PlaygroundSerp"

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

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.detail || `Request failed (${response.status})`)
  }

  return response.json() as Promise<T>
}

const fetchSubscriptions = (token: string) =>
  requestFromApi<Subscription[]>("/customer/subscriptions", token)

const fetchProxyApiAccess = (token: string) =>
  requestFromApi<ProxyApiAccess>("/serp-api/access", token)

const SerpApiPage = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") || "" : ""

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
        <Card className="relative overflow-hidden rounded-[28px] border border-transparent text-slate-900 shadow-[0_34px_88px_-48px_rgba(245,158,11,0.62)] dark:text-slate-100">
          <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.68),_transparent_55%),_radial-gradient(circle_at_bottom_right,_rgba(129,140,248,0.52),_transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/80 via-white/55 to-white/35 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-slate-900/40" />
          <CardHeader className="relative space-y-4 rounded-[24px] bg-white/78 p-6 shadow-[0_22px_46px_-30px_rgba(15,23,42,0.42)] backdrop-blur dark:bg-slate-900/70">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-4 py-1 text-[0.65rem] uppercase tracking-[0.25em] text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/70">
              <span>Web Scraping</span>
              <span className="h-1 w-1 rounded-full bg-slate-400" aria-hidden="true" />
              <span>SERP API</span>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Search Engine Results
              </CardTitle>
              <CardDescription>
                Monitor access, rotate keys, and launch our interactive playground to validate SERP requests before shipping to production.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <Badge variant="outline">Managed proxy</Badge>
              <Badge variant="outline">Rotating keys</Badge>
              <Badge variant="outline">JSON responses</Badge>
            </div>
          </CardHeader>
        </Card>

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
              Subscribe to an eligible plan to unlock SERP API access for this workspace.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-8">
            {!proxyApiAccess?.has_access ? (
              <Alert className="border-amber-300/40 bg-amber-100/60 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                <AlertTitle>SERP API not included in your plan</AlertTitle>
                <AlertDescription>
                  {proxyApiAccess?.message ||
                    "Upgrade to a plan that bundles SERP API usage, or contact support to enable access."}
                </AlertDescription>
              </Alert>
            ) : null}

            <ApiKeyModule token={token} />

            <Card className="border border-slate-200/70 bg-white/80 shadow-[0_40px_90px_-60px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-2xl">Interactive playground</CardTitle>
                <CardDescription>
                  Experiment with live requests, inspect responses, and export ready-made snippets for your stack.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlaygroundSerpApi />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedComponent>
  )
}

export const Route = createFileRoute("/_layout/web-scraping-tools/serp-api")({
  component: SerpApiPage,
})

export default SerpApiPage
