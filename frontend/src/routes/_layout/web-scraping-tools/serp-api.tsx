import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { FiArrowUpRight } from "react-icons/fi"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import ProtectedComponent from "../../../components/Common/ProtectedComponent"
import PageScaffold, { PageSection } from "../../../components/Common/PageLayout"
import ApiKeyModule from "../../../components/ScrapingTools/ApiKey"
import PlaygroundSerpApi from "../../../components/ScrapingTools/PlaygroundSerp"
import SummaryMetric from "../../../components/Common/SummaryMetric"

// --- Interfaces and Helper Functions ---
interface Subscription {
  id: string
  status: string
}

interface ProxyApiAccess {
  has_access: boolean
  message: string | null
}

const API_URL = "/v2"

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
      <PageScaffold sidebar={null}>
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

            <PageSection
              id="fleet"
              title="Fleet intelligence"
              description="Summaries of capacity, health, and monthly run rate."
              actions={
                <Button
                  asChild
                  variant="outline"
                  className="gap-2 rounded-full border-slate-200/80 bg-white/60 px-5 py-2 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
                >
                  <Link to="/web-scraping-tools/billing">
                    <span>Open billing cycle</span>
                    <FiArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryMetric
                  label="Access Status"
                  value={proxyApiAccess?.has_access ? "Active" : "Inactive"}
                  description="Serp API Access"
                />
                <SummaryMetric
                  label="Subscription"
                  value={hasActiveSubscription ? "Active" : "None"}
                  description="Current Plan Status"
                />
                <SummaryMetric
                  label="Requests"
                  value="--"
                  description="Last 30 days"
                />
                <SummaryMetric
                  label="Success Rate"
                  value="--"
                  description="Global Average"
                />
              </div>
            </PageSection>

            <PageSection id="api-keys" title="">
              <ApiKeyModule token={token} />
            </PageSection>

            <PageSection
              id="playground"
              title="Interactive playground"
              description="Experiment with live requests, inspect responses, and export ready-made snippets for your stack."
            >
            <div className="rounded-[28px] border border-slate-200/70 bg-white/80 shadow-[0_40px_90px_-60px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="p-6">
                <PlaygroundSerpApi />
              </div>
            </div>
            </PageSection>

            <div className="mt-10 border-t border-slate-200/60 pt-10 dark:border-slate-800">
              <div className="mb-6 space-y-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Jump to
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Quick links to page sections.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Link
                  to="/"
                  className="group flex flex-col justify-between space-y-2 rounded-xl border border-slate-200/60 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Workspace
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Subscriptions, average usage, and quick billing actions.
                    </div>
                  </div>
                </Link>

                <a
                  href="#analytics"
                  className="group flex flex-col justify-between space-y-2 rounded-xl border border-slate-200/60 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Usage insights
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Traffic, spend, and throughput metrics.
                    </div>
                  </div>
                </a>

                <Link
                  to="/"
                  className="group flex flex-col justify-between space-y-2 rounded-xl border border-slate-200/60 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Tool directory
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Explore every workspace module in one place.
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </PageScaffold>
    </ProtectedComponent>
  )
}

export const Route = createFileRoute("/_layout/web-scraping-tools/serp-api")({
  component: SerpApiPage,
})

export default SerpApiPage
