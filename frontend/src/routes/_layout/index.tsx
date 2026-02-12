import {
  FaBook,
  FaBrain,
  FaBox,
  FaCreditCard,
  FaDatabase,
  FaGlobe,
  FaSearch,
  FaServer,
} from "react-icons/fa"
import type { IconType } from "react-icons"
import {
  FiUserCheck,
  FiKey,
  FiDatabase as FiDatabaseAlt,
  FiSettings,
  FiShield,
  FiArrowUpRight,
} from "react-icons/fi"
import { AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useQuery } from "@tanstack/react-query"
import { Link as RouterLink, createFileRoute } from "@tanstack/react-router"
import { useCallback, useMemo, useState } from "react"
import PageScaffold, {
  PageSection,
  SectionNavigation,
  type SectionNavItem,
} from "@/components/Common/PageLayout"
import ActiveServicesGrid from "@/components/Dashboard/ActiveServicesGrid"
import DashboardHeader from "@/components/Dashboard/DashboardHeader"
import InfrastructureTable from "@/components/Dashboard/InfrastructureTable"
import QuickActionsGrid from "@/components/Dashboard/QuickActionsGrid"
import StatHighlights from "@/components/Dashboard/StatHighlights"
import type {
  DashboardStat,
  DisplayedFeature,
  QuickActionLink,
  ServerNode,
} from "@/components/Dashboard/types"
import ProtectedComponent from "@/components/Common/ProtectedComponent"
import UsageInsights from "@/components/Dashboard/UsageInsights"
import ChartsSection from "@/components/Dashboard/ChartsSection"
import { calculateDashboardStats } from "@/lib/dashboardUtils"
import useCustomToast from "@/hooks/useCustomToast"

type FeatureMeta = {
  name: string
  description: string
  icon: IconType
  path: string
  gradient: string
  period?: string
}

type FeatureKey =
  | "proxy-api"
  | "vps-hosting"
  | "compute"
  | "serp-api"
  | "llm-inference-api"
  | "managed-storage"
  | "managed-database"
  | "serverless-compute"

type ToolCatalogEntry = {
  label: string
  description: string
  category: string
  icon: IconType
  to?: string
  href?: string
  featureSlug?: FeatureKey
}

const defaultFeatureSlugs: FeatureKey[] = [
  "proxy-api",
  "vps-hosting",
  "serp-api",
  "llm-inference-api",
  "managed-storage",
  "managed-database",
  "compute",
  "serverless-compute",
]

const featureDetails: Record<FeatureKey, FeatureMeta> = {
  "proxy-api": {
    name: "Web Scraping API",
    description:
      "Low-latency rotating proxies with smart routing, retry logic, and geo-targeting out of the box.",
    icon: FaGlobe,
    path: "/web-scraping-tools/https-api",
    gradient:
      "linear-gradient(135deg, rgba(99,102,241,0.16), rgba(14,165,233,0.1))",
    period: "Aug 15 – Sep 15, 2025",
  },
  "vps-hosting": {
    name: "Managed VPS Fleet",
    description:
      "Monitor health, snapshots, and failover orchestration across your managed RoamingProxy compute footprint.",
    icon: FaServer,
    path: "/hosting",
    gradient:
      "linear-gradient(135deg, rgba(34,197,94,0.16), rgba(6,182,212,0.12))",
    period: "Sep 9 – Oct 9, 2025",
  },
  "compute": {
    name: "Managed Compute",
    description:
      "Deploy and manage your serverless functions.",
    icon: FaServer,
    path: "/compute",
    gradient:
      "linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(239, 68, 68, 0.1))",
    period: "ACTIVE",
  },
  "serp-api": {
    name: "SERP Intelligence",
    description:
      "Fresh structured search results with localized keywords, device targeting, and historical snapshots.",
    icon: FaSearch,
    path: "/web-scraping-tools/serp-api",
    gradient:
      "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(99,102,241,0.12))",
    period: "ACTIVE",
  },
  "llm-inference-api": {
    name: "LLM Inference API",
    description:
      "Integrate powerful language models into your applications.",
    icon: FaBrain,
    path: "/llm-inference-api",
    gradient:
      "linear-gradient(135deg, rgba(139, 92, 246, 0.16), rgba(236, 72, 153, 0.1))",
    period: "ACTIVE",
  },
  "managed-storage": {
    name: "Managed Storage",
    description:
      "Manage your scalable object storage buckets and files.",
    icon: FaBox,
    path: "/storage",
    gradient:
      "linear-gradient(135deg, rgba(252, 165, 165, 0.16), rgba(251, 211, 141, 0.1))",
    period: "ACTIVE",
  },
  "managed-database": {
    name: "Managed Database",
    description:
      "Administer your managed relational databases.",
    icon: FaDatabase,
    path: "/database",
    gradient:
      "linear-gradient(135deg, rgba(134, 239, 172, 0.16), rgba(59, 130, 246, 0.1))",
    period: "ACTIVE",
  },
   "serverless-compute": {
    name: "Serverless Compute",
    description: "Deploy and manage your serverless functions.",
    icon: FaServer,
    path: "/serverless-compute",
    gradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.16), rgba(219, 39, 119, 0.1))",
    period: "ACTIVE",
  },
}

const toolCatalogEntries: ToolCatalogEntry[] = [
  {
    label: "HTTPS Proxy API",
    description:
      "Inspect live requests, rotate endpoints, and manage credentials.",
    category: "Web scraping",
    icon: FaGlobe,
    to: "/web-scraping-tools/https-api",
    featureSlug: "proxy-api",
  },
  {
    label: "SERP Intelligence",
    description:
      "Replay keyword snapshots, targeting controls, and localized exports.",
    category: "Web scraping",
    icon: FaSearch,
    to: "/web-scraping-tools/serp-api",
    featureSlug: "serp-api",
  },
  {
    label: "User Agents Library",
    description:
      "Curated desktop, mobile, and crawler fingerprints ready to drop in.",
    category: "Web scraping",
    icon: FiUserCheck,
    to: "/web-scraping-tools/user-agents",
  },
  {
    label: "API Keys",
    description: "Create, rotate and manage secret API keys for this workspace.",
    category: "Web scraping",
    icon: FiKey,
    to: "/web-scraping-tools/api-keys",
  },
  {
    label: "LLM Inference API",
    description:
      "Integrate powerful language models into your applications. Open",
    category: "AI Services",
    icon: FaBrain,
    to: "/llm-inference-api",
    featureSlug: "llm-inference-api",
  },
  {
    label: "Managed Storage",
    description: "Manage your scalable object storage buckets and files. Open",
    category: "Storage",
    icon: FaBox,
    to: "/storage",
    featureSlug: "managed-storage",
  },
  {
    label: "Managed Database",
    description: "Administer your managed relational databases. Open",
    category: "Database",
    icon: FaDatabase,
    to: "/database",
    featureSlug: "managed-database",
  },
  {
    label: "Serverless Compute",
    description: "Deploy and manage your serverless functions.",
    category: "Compute",
    icon: FaServer,
    to: "/serverless-compute",
    featureSlug: "serverless-compute",
  },
  {
    label: "Managed VPS Fleet",
    description:
      "Provision, monitor, and snapshot compute capacity across regions.",
    category: "Hosting",
    icon: FaServer,
    to: "/hosting",
    featureSlug: "vps-hosting",
  },
  {
    label: "Managed Compute",
    description: "Deploy and manage your serverless functions.",
    category: "Compute",
    icon: FaServer,
    to: "/compute",
    featureSlug: "compute",
  },
  {
    label: "Items Catalog",
    description:
      "Manage internal runbooks, snippets, and ops metadata in one place.",
    category: "Operations",
    icon: FaDatabase,
    to: "/items",
  },
  {
    label: "Workspace Settings",
    description:
      "Manage authentication, SSO, API tokens, and role assignments.",
    category: "Administration",
    icon: FiSettings,
    to: "/settings",
  },
  {
    label: "Admin Console",
    description:
      "Review user access, invitations, and compliance oversight.",
    category: "Administration",
    icon: FiShield,
    to: "/admin",
  },
  {
    label: "API Reference",
    description:
      "Full REST and SDK documentation with live examples and guides.",
    category: "Reference",
    icon: FaBook,
    href: "https://docs.roamingproxy.com/",
  },
]

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

interface Subscription {
  id: string
  status: string
  plan_id: string | null
  plan_name: string | null
  product_id: string | null
  product_name: string | null
  current_period_start: number | null
  current_period_end: number | null
  trial_start: number | null
  trial_end: number | null
  cancel_at_period_end: boolean
  enabled_features: FeatureKey[]
}

interface ApiKey {
  key_preview: string
  created_at: string
  expires_at: string
  is_active: boolean
  request_count?: number
}

const servers: ServerNode[] = [
  {
    name: "e-coast-nyc-lower-4core-ssd",
    email: "apis.popov@gmail.com",
    ip: "100.100.95.59",
    version: "1.82.0",
    kernel: "Linux 6.8.0-57-generic",
    status: "Connected",
    type: "VPS",
    os: "ubuntu",
    username: "user",
    password: "5660",
    monthlyComputePrice: 43.6,
    storageSizeGB: 120,
    activeSince: "2025-07-01",
    hasRotatingIP: false,
    hasBackup: true,
    hasMonitoring: true,
    ramGB: 4,
    vCPUs: 4,
    hasManagedSupport: false,
    refIndex: 1,
  },
  {
    name: "e-coast-nyc-midtown-8core-ssd",
    email: "apis.popov@gmail.com",
    ip: "100.114.242.51",
    version: "1.86.2",
    kernel: "Linux 6.8.0-57-generic",
    status: "Connected",
    type: "VPS",
    os: "ubuntu",
    username: "user",
    password: "5660",
    monthlyComputePrice: 87.6,
    storageSizeGB: 240,
    activeSince: "2025-07-01",
    hasRotatingIP: true,
    hasBackup: false,
    hasMonitoring: false,
    ramGB: 16,
    vCPUs: 8,
    hasManagedSupport: false,
    refIndex: 2,
  },
  {
    name: "e-coast-nyc-bk-8core-ssd",
    email: "apis.popov@gmail.com",
    ip: "100.91.158.116",
    version: "1.82.5",
    kernel: "Linux 6.8.0-59-generic",
    status: "Connected",
    type: "VPS",
    os: "ubuntu",
    username: "user",
    password: "5660",
    monthlyComputePrice: 100.6,
    storageSizeGB: 240,
    activeSince: "2025-08-01",
    hasRotatingIP: true,
    hasBackup: true,
    hasMonitoring: true,
    ramGB: 16,
    vCPUs: 8,
    hasManagedSupport: false,
    refIndex: 3,
  },
  {
    name: "e-coast-nyc-lower-4core-hdd",
    email: "apis.popov@gmail.com",
    ip: "100.100.106.3",
    version: "1.80.2",
    kernel: "Linux 6.8.0-55-generic",
    status: "Connected",
    type: "VPS",
    os: "ubuntu",
    username: "user",
    password: "5660",
    monthlyComputePrice: 60.6,
    storageSizeGB: 120,
    activeSince: "2025-09-01",
    hasRotatingIP: false,
    hasBackup: false,
    hasMonitoring: false,
    ramGB: 4,
    vCPUs: 4,
    hasManagedSupport: false,
    refIndex: 4,
  },
  {
    name: "02-NYC-MTM-16core-ssd",
    email: "apis.popov@gmail.com",
    ip: "100.120.30.40",
    version: "1.85.0",
    kernel: "Linux 6.8.0-60-generic",
    status: "Connected",
    type: "VPS",
    os: "ubuntu",
    username: "user",
    password: "5660",
    monthlyComputePrice: 136.6,
    storageSizeGB: 500,
    activeSince: "2025-08-01",
    hasRotatingIP: true,
    hasBackup: true,
    hasMonitoring: true,
    ramGB: 64,
    vCPUs: 16,
    hasManagedSupport: false,
    refIndex: 5,
  },
  {
    name: "e-coast-nyc-bk-2core-ssd",
    email: "apis.popov@gmail.com",
    ip: "100.130.40.50",
    version: "1.87.0",
    kernel: "Linux 6.8.0-61-generic",
    status: "Connected",
    type: "VPS",
    os: "ubuntu",
    username: "user",
    password: "5660",
    monthlyComputePrice: 63.6,
    storageSizeGB: 200,
    activeSince: "2025-09-01",
    hasRotatingIP: true,
    hasBackup: false,
    hasMonitoring: false,
    ramGB: 8,
    vCPUs: 2,
    hasManagedSupport: false,
    refIndex: 6,
  },
]

async function fetchSubscriptions(): Promise<Subscription[]> {
  const token = localStorage.getItem("access_token")
  if (!token) throw new Error("No access token found. Please log in again.")
  const response = await fetch(
    "https://api.roamingproxy.com/v2/customer/subscriptions",
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  )
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || `Failed to fetch subscriptions: ${response.status}`,
    )
  }
  return (await response.json()) as Subscription[]
}

async function fetchBillingPortal(token: string): Promise<string> {
  const response = await fetch(
    "https://api.roamingproxy.com/v2/customer-portal",
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  )
  if (!response.ok)
    throw new Error(`Failed to fetch portal: ${response.status}`)
  const data = await response.json()
  if (!data.portal_url) throw new Error("No portal URL received from server.")
  return data.portal_url
}

async function fetchApiKeys(token: string): Promise<ApiKey[]> {
  const response = await fetch(
    "https://api.roamingproxy.com/v2/proxy/api-keys",
    {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    },
  )
  if (!response.ok) {
    if (response.status === 403 || response.status === 404) return []
    throw new Error(`Failed to fetch API keys: ${response.status}`)
  }
  const data = await response.json()
  return (Array.isArray(data) ? data : []).map((key: ApiKey) => ({
    ...key,
    request_count: key.request_count ?? 0,
  }))
}

const Dashboard = () => {
  const analyticsPoints = [38, 62, 54, 78, 92, 66, 105, 98]
  const sparkPath = analyticsPoints
    .map((point, index) => {
      const x = (index / (analyticsPoints.length - 1)) * 180
      const y = 110 - point
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")
  const showToast = useCustomToast()

  const {
    data: subscriptions,
    isLoading: isSubscriptionsLoading,
    error: subscriptionsError,
  } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: fetchSubscriptions,
    staleTime: 5 * 60 * 1000,
  })

  const token = localStorage.getItem("access_token") || ""
  const {
    data: apiKeys,
    isLoading: isApiKeysLoading,
    error: apiKeysError,
  } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: () => fetchApiKeys(token),
    staleTime: 5 * 60 * 1000,
    enabled: !!token,
  })

  const activeSubscriptions = useMemo(
    () =>
      Array.isArray(subscriptions)
        ? subscriptions.filter((sub) =>
            ["active", "trialing", "past_due"].includes(sub.status),
          )
        : [],
    [subscriptions],
  )

  const totalRequests = useMemo(
    () =>
      Array.isArray(apiKeys)
        ? apiKeys.reduce((sum, key) => sum + (key.request_count || 0), 0)
        : 0,
    [apiKeys],
  )

  const totalDataGB = useMemo(
    () => (totalRequests > 0 ? totalRequests * 0.0005 : 0),
    [totalRequests],
  )

  const totalMonthlySpend = useMemo(
    () => servers.reduce((sum, s) => sum + s.monthlyComputePrice, 0),
    [],
  )
  const connectedServers = useMemo(
    () => servers.filter((server) => server.status === "Connected").length,
    [],
  )
  const offlineServers = servers.length - connectedServers
  const apiKeyCount = Array.isArray(apiKeys) ? apiKeys.length : 0
  const averageRequestsPerKey = apiKeyCount
    ? Math.round(totalRequests / apiKeyCount)
    : 0

  const statHighlights = useMemo<DashboardStat[]>(
    () =>
      calculateDashboardStats(
        totalRequests,
        totalDataGB,
        totalMonthlySpend,
        servers,
      ),
    [totalRequests, totalDataGB, totalMonthlySpend],
  )

  const nextRenewal = useMemo(() => {
    const futurePeriods = activeSubscriptions
      .map((sub) => sub.current_period_end)
      .filter((value): value is number => Boolean(value))
    if (futurePeriods.length === 0) {
      return null
    }
    const earliest = Math.min(...futurePeriods)
    return new Date(earliest * 1000)
  }, [activeSubscriptions])

  const { displayedFeatures, activeFeatureSlugs } = useMemo(() => {
    const enabled = new Set<FeatureKey>()
    activeSubscriptions.forEach((sub) => {
      sub.enabled_features?.forEach((feature) => {
        if (featureDetails[feature]) {
          enabled.add(feature)
        }
      })
    })

    // Always surface VPS hosting as an active feature in the dashboard
    // so the hosting tool shows as highlighted and promoted in the UI.
    enabled.add("vps-hosting")
    enabled.add("compute")
    enabled.add("llm-inference-api")
    enabled.add("managed-storage")
    enabled.add("managed-database")
    enabled.add("serp-api")
    enabled.add("serverless-compute")

    const slugs = enabled.size > 0 ? Array.from(enabled) : defaultFeatureSlugs

    return {
      displayedFeatures: slugs.map((slug) => {
        const meta = featureDetails[slug]
        return {
          slug,
          name: meta.name,
          description: meta.description,
          icon: meta.icon,
          path: meta.path,
          gradient: meta.gradient,
          period: meta.period,
        }
      }),
      activeFeatureSlugs: enabled,
    }
  }, [activeSubscriptions])

  const nextRenewalLabel = nextRenewal
    ? dateFormatter.format(nextRenewal)
    : "No renewal scheduled"

  const [isPortalLoading, setIsPortalLoading] = useState(false)

  const handleBillingClick = useCallback(async () => {
    if (!token) {
      showToast(
        "Sign in required",
        "Log in again to open the customer billing portal.",
        "warning",
      )
      return
    }

    setIsPortalLoading(true)
    try {
      const portalUrl = await fetchBillingPortal(token)
      window.location.href = portalUrl
    } catch (error) {
      console.error("Error accessing customer portal:", error)
      showToast(
        "Unable to open portal",
        "Something went wrong loading billing. Please try again shortly.",
        "error",
      )
    } finally {
      setIsPortalLoading(false)
    }
  }, [showToast, token])

  const quickActions = useMemo<QuickActionLink[]>(
    () => [
      {
        label: "HTTP API Console",
        description:
          "Inspect live requests, rotate endpoints, and manage credentials.",
        icon: FaGlobe,
        to: "/web-scraping-tools/https-api",
      },
      {
        label: "User Agents Library",
        description:
          "Download curated desktop, mobile, and search engine agent strings.",
        icon: FiUserCheck,
        to: "/web-scraping-tools/user-agents",
      },
      {
        label: "Customer Billing Portal",
        description:
          "Update payment methods, invoices, and usage caps in seconds.",
        icon: FaCreditCard,
        onClick: handleBillingClick,
        isLoading: isPortalLoading,
      },
      {
        label: "API Reference",
        description: "Review authentication, endpoints, and best practices.",
        icon: FaBook,
        href: "https://docs.roamingproxy.com/",
      },
    ],
    [handleBillingClick, isPortalLoading],
  )

  const isLoading = isSubscriptionsLoading || isApiKeysLoading
  const error = subscriptionsError || apiKeysError

  const navigation: SectionNavItem[] = [
    {
      id: "workspace-pulse",
      label: "Workspace",
      description: "Subscriptions, average usage, and quick billing actions.",
    },
    {
      id: "usage-insights",
      label: "Usage insights",
      description: "Traffic, spend, and throughput metrics.",
    },
    {
      id: "tool-directory",
      label: "Tool directory",
      description: "Explore every workspace module in one place.",
    },
  ]

  const toolDirectorySection = (
    <PageSection
      id="tool-directory"
      title="Tool directory"
      description="Explore every workspace module in one place to validate styling and behavior before launch."
    >
      <ToolDirectory
        tools={toolCatalogEntries}
        activeFeatureSlugs={activeFeatureSlugs}
      />
    </PageSection>
  )

  const chartsSection = (
    <PageSection id="charts" title="Charts" description="Quick visualizations of throughput and capacity." key="charts">
      <ChartsSection />
    </PageSection>
  )

  const sidebar = null
  
  const sections: React.ReactNode[] = []

  if (isLoading) {
    sections.push(
      <PageSection
        id="workspace-pulse"
        title="Workspace"
        description="Loading the latest billing, usage, and infrastructure details."
        key="loading"
      >
        <div className="rounded-[28px] border border-dashed border-slate-200/80 bg-white/70 text-center shadow-none backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60">
          <div className="flex flex-col items-center gap-4 p-10">
            <Spinner size={40} />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Loading your dashboard...
            </p>
          </div>
        </div>
      </PageSection>,
      toolDirectorySection,
    )
  } else if (error) {
    sections.push(
      <PageSection
        id="workspace-pulse"
        title="Workspace"
        description="We could not retrieve your workspace status."
        key="error"
      >
        <Alert
          variant="destructive"
          className="rounded-[24px] border border-gray-500/40 bg-gray-500/10 text-gray-700 backdrop-blur dark:text-gray-200"
        >
          <AlertCircle className="h-5 w-5" />
          <div>
            <AlertTitle>We couldn&apos;t load your workspace</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Unexpected error loading subscriptions. Please refresh and try again."}
            </AlertDescription>
          </div>
        </Alert>
      </PageSection>,
      toolDirectorySection,
    )
  } else if (activeSubscriptions.length === 0) {
    // If the workspace has no active subscriptions, still render key analytics
    // and tool directory so the homepage remains useful for onboarding and QA.
    sections.push(      <PageSection
        id="usage-insights"
        title="Usage insights"
        description="Key throughput, data transfer, and spend metrics (preview)."
        key="usage-empty"
      >
        <StatHighlights stats={statHighlights} />
      </PageSection>,
      <PageSection
        id="workspace-pulse"
        title="Workspace"
        description="No services are active yet. Preview usage insights and available tools."
        key="workspace-empty"
      >
        <DashboardHeader
          servicesCount={displayedFeatures.length}
          nextRenewalLabel={nextRenewalLabel}
          apiKeyCount={apiKeyCount}
          averageRequestsPerKey={averageRequestsPerKey}
          onBillingClick={handleBillingClick}
          isBillingLoading={isPortalLoading}
          apiConsoleTo="/web-scraping-tools/https-api"
        />
      </PageSection>,
      // chartsSection,

      toolDirectorySection,
    )
  } else {
    sections.push( <PageSection
        id="usage-insights"
        title="Usage insights"
        description="Key throughput, data transfer, and spend metrics refreshed automatically."
        key="usage"
      >
        <UsageInsights stats={statHighlights} />
      </PageSection>,

      <PageSection
        id="workspace-pulse"
        title="Workspace"
        description="Subscriptions, average usage, and quick billing actions."
        key="workspace"
      >
        <DashboardHeader
          servicesCount={displayedFeatures.length}
          nextRenewalLabel={nextRenewalLabel}
          apiKeyCount={apiKeyCount}
          averageRequestsPerKey={averageRequestsPerKey}
          onBillingClick={handleBillingClick}
          isBillingLoading={isPortalLoading}
          apiConsoleTo="/web-scraping-tools/https-api"
        />
      </PageSection>,

      // chartsSection,

     
      toolDirectorySection,
    )
  }
  // Add the Jump navigation as the last page section before the footer
  sections.push(
    <PageSection id="jump" title="Jump to" description="Quick links to page sections." key="jump">
      <SectionNavigation items={navigation} title="" />
    </PageSection>,
  )

  const mainContent = <>{sections}</>

  return (
    <ProtectedComponent>
      <PageScaffold sidebar={sidebar}>{mainContent}</PageScaffold>
    </ProtectedComponent>
  )
}
interface ToolDirectoryProps {
  tools: ToolCatalogEntry[]
  activeFeatureSlugs: Set<FeatureKey>
}

const ToolDirectory = ({ tools, activeFeatureSlugs }: ToolDirectoryProps) => {
  if (!tools.length) return null

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {tools.map((tool) => {
        const Icon = tool.icon
        const isActive = tool.featureSlug ? activeFeatureSlugs.has(tool.featureSlug) : false

        return (
          <div
            key={tool.label}
            className="group h-full rounded-[24px] border border-slate-200/70 bg-white/95 shadow-[0_20px_44px_-28px_rgba(15,23,42,0.46)] backdrop-blur-xl transition duration-200 hover:-translate-y-1.5 hover:shadow-[0_32px_60px_-30px_rgba(15,23,42,0.52)] dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_28px_64px_-34px_rgba(15,23,42,0.7)]"
          >
            <div className="flex h-full flex-col gap-5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex aspect-square h-11 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {tool.category}
                </Badge>
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {tool.label}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {tool.description}
                </p>
              </div>
              {isActive ? (
                <Badge className="w-fit rounded-full bg-emerald-500/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">
                  Active
                </Badge>
              ) : null}
              <div className="mt-auto pt-1">
                {tool.to ? (
                  <Button
                    asChild
                    variant="outline"
                    className="gap-2 rounded-full px-5 py-2 text-sm font-semibold"
                  >
                    <RouterLink to={tool.to}>
                      <span>Open</span>
                    </RouterLink>
                  </Button>
                ) : tool.href ? (
                  <Button
                    asChild
                    variant="outline"
                    className="gap-2 rounded-full px-5 py-2 text-sm font-semibold"
                  >
                    <a href={tool.href} target="_blank" rel="noopener noreferrer">
                      <span>View docs</span>
                      <FiArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})
export default Dashboard
