import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ExternalLink } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { parseApiResponse } from "@/lib/api"
import ProtectedComponent from "../../../components/Common/ProtectedComponent"
import ApiKeyModule from "../../../components/ScrapingTools/ApiKey"
import PlaygroundHttpsProxy from "../../../components/ScrapingTools/PlaygroundHttps"
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

  const statHighlights = calculateDashboardStats(1, 2, 3, [])

  return (
    <ProtectedComponent>
      <div className="space-y-8 py-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <span>Web Scraping</span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            <span>HTTPS Proxy</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Route Requests Through the Roaming Network
          </h1>
          <p className="text-lg text-muted-foreground">
            Ship resilient scrapers by tunneling HTTP/S traffic through our managed proxies with automatic retries and region controls.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Global Egress</Badge>
          <Badge variant="outline">Session Pinning</Badge>
          <Badge variant="outline">Rotating IPs</Badge>
        </div> 

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
            <Tabs defaultValue="playground">
              <TabsList className="mb-4 flex w-fit items-center justify-start gap-2 rounded-lg bg-transparent p-0">
                <TabsTrigger
                  value="analytics"
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:text-primary"
                >
                  Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="playground"
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:text-primary"
                >
                  Playground
                </TabsTrigger>
                <TabsTrigger
                  value="api-key"
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:text-primary"
                >
                  API Key
                </TabsTrigger>
              </TabsList>
              <TabsContent value="analytics" className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Usage Insights</CardTitle>
                    <CardDescription>
                      An overview of your recent API usage and performance.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <UsageInsights stats={statHighlights} />
                    <ChartsSection />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="playground" className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      Interactive Playground
                    </CardTitle>
                    <CardDescription>
                      Verify target URLs, tweak retries, and export ready-made snippets before plugging into your pipelines.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PlaygroundHttpsProxy />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="api-key" className="space-y-8">
                <ApiKeyModule token={token} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </ProtectedComponent>
  )
}

export const Route = createFileRoute("/_layout/web-scraping-tools/https-api")({
  component: HttpsProxyApiPage,
})

export default HttpsProxyApiPage
