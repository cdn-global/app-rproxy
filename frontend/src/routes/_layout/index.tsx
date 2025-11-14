import { AlertCircle } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Link as RouterLink, createFileRoute } from "@tanstack/react-router"
import { useCallback, useMemo, useState } from "react"
import {
  FaBook,
  FaCog,
  FaCreditCard,
  FaGlobe,
  FaSearch,
  FaServer,
} from "react-icons/fa"
import {
  FiArrowUpRight,
  FiDatabase,
  FiSettings,
  FiShield,
  FiUserCheck,
} from "react-icons/fi"
import type { IconType } from "react-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
import useCustomToast from "@/hooks/useCustomToast"

type FeatureMeta = {
  name: string
  description: string
  icon: IconType
  path: string
  gradient: string
  period?: string
}

type FeatureKey = "proxy-api" | "vps-hosting" | "serp-api"

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
  "serp-api": {
    name: "SERP Intelligence",
    description:
      "Fresh structured search results with localized keywords, device targeting, and historical snapshots.",
    icon: FaSearch,
    path: "/web-scraping-tools/serp-api",
    gradient:
      "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(99,102,241,0.12))",
    period: "Available for activation",
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
    label: "Managed VPS Fleet",
    description:
      "Provision, monitor, and snapshot compute capacity across regions.",
    category: "Infrastructure",
    icon: FaServer,
    to: "/hosting",
    featureSlug: "vps-hosting",
  },
  {
    label: "Items Catalog",
    description:
      "Manage internal runbooks, snippets, and ops metadata in one place.",
    category: "Operations",
    icon: FiDatabase,
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
    "https://api.ROAMINGPROXY.com/v2/customer/subscriptions",
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
    "https://api.ROAMINGPROXY.com/v2/customer-portal",
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
    "https://api.ROAMINGPROXY.com/v2/proxy/api-keys",
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

const HomePage = () => {
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

  const totalVCPUs = useMemo(
    () => servers.reduce((sum, s) => sum + (s.vCPUs || 0), 0),
    [],
  )
  const totalRAM = useMemo(
    () => servers.reduce((sum, s) => sum + s.ramGB, 0),
    [],
  )
  const totalStorage = useMemo(
    () => servers.reduce((sum, s) => sum + s.storageSizeGB, 0),
    [],
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
    () => [
      {
        label: "Total Requests",
        value: numberFormatter.format(totalRequests),
        description: "Across active API keys",
        icon: FaGlobe,
        accent: "brand",
      },
      {
        label: "Estimated Transfer",
        value: `${decimalFormatter.format(totalDataGB)} GB`,
        description: "Based on current data egress",
        icon: FiDatabase,
        accent: "ocean",
      },
      {
        label: "Monthly Spend",
        value: currencyFormatter.format(totalMonthlySpend),
        description: "Managed compute and add-ons",
        icon: FaCreditCard,
        accent: "warning",
      },
      {
        label: "Connected Servers",
        value: numberFormatter.format(connectedServers),
        description:
          offlineServers > 0
            ? `${offlineServers} awaiting attention`
            : "All systems healthy",
        icon: FaServer,
        accent: "success",
      },
    ],
    [connectedServers, offlineServers, totalDataGB, totalMonthlySpend, totalRequests],
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

  const formatCurrency = useCallback(
    (value: number) => currencyFormatter.format(value),
    [],
  )

  const infrastructureTotals = useMemo(
    () => ({
      totalCount: servers.length,
      totalVCPUs,
      totalRAM,
      totalStorage,
      totalMonthlySpend,
    }),
    [totalMonthlySpend, totalRAM, totalStorage, totalVCPUs],
  )

  const isLoading = isSubscriptionsLoading || isApiKeysLoading
  const error = subscriptionsError || apiKeysError

  const navigation: SectionNavItem[] = [
    {
      id: "workspace-pulse",
      label: "Workspace pulse",
      description: "Renewals, keys, and account health in a glance.",
    },
    {
      id: "usage-insights",
      label: "Usage insights",
      description: "Traffic, spend, and throughput metrics.",
    },
    {
      id: "services-and-tools",
      label: "Services & tools",
      description: "Active bundles plus the shortcuts your team uses most.",
    },
    {
      id: "infrastructure",
      label: "Infrastructure",
      description: "Managed nodes, capacity, and quick deep links.",
    },
    {
      id: "component-library",
      label: "Component style suite",
      description: "Visual sweep of shadcn/ui primitives in our theme.",
    },
  ]

  const servicesAndToolsSection = (
    <PageSection
      id="services-and-tools"
      title="Services & tools"
      description="Enable new datasets, jump into APIs, or open supporting docs."
      contentClassName="grid gap-10 xl:grid-cols-2 xl:items-start"
    >
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Active services
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Keep tabs on throughput, activation windows, and available feature sets across your workspace.
        </p>
        <ActiveServicesGrid features={displayedFeatures} />
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Quick actions
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Jump straight into the tools your team relies on most.
        </p>
        <QuickActionsGrid actions={quickActions} />
      </div>

      <div className="space-y-3 xl:col-span-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Tool directory
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Explore every workspace module in one place to validate styling and behavior before launch.
        </p>
        <ToolDirectory
          tools={toolCatalogEntries}
          activeFeatureSlugs={activeFeatureSlugs}
        />
      </div>
    </PageSection>
  )

  const componentGallerySection = (
    <PageSection
      id="component-library"
      title="Component style suite"
      description="Spot-check shadcn/ui primitives to ensure consistent theming across pages."
    >
      <ComponentGallery />
    </PageSection>
  )

  const sidebar = (
    <>
      <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/60 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-indigo-500/10 px-4 py-1 text-[0.65rem] uppercase tracking-[0.22em] text-indigo-700 dark:border-indigo-500/30 dark:text-indigo-100">
          Control center
        </div>
        <div className="mt-5 space-y-3">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            RoamingProxy workspace
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Monitor subscriptions, rotate API keys, and coordinate compute capacity without losing context.
          </p>
        </div>
        <dl className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center justify-between">
            <dt className="uppercase tracking-[0.18em] text-xs text-slate-500 dark:text-slate-500">Next renewal</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{nextRenewalLabel}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="uppercase tracking-[0.18em] text-xs text-slate-500 dark:text-slate-500">Active services</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{displayedFeatures.length}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="uppercase tracking-[0.18em] text-xs text-slate-500 dark:text-slate-500">API keys</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{apiKeyCount}</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs text-slate-500 dark:text-slate-500">
          Usage alerts, billing, and infrastructure rollups stay synchronized so you can pivot from experimentation to scale in seconds.
        </p>
      </div>
      <SectionNavigation items={navigation} />
    </>
  )

  const sections: React.ReactNode[] = []

  if (isLoading) {
    sections.push(
      <PageSection
        id="workspace-pulse"
        title="Workspace pulse"
        description="Loading the latest billing, usage, and infrastructure details."
        key="loading"
      >
        <Card className="rounded-[28px] border border-dashed border-slate-200/80 bg-white/70 text-center shadow-none backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60">
          <CardContent className="flex flex-col items-center gap-4 p-10">
            <Spinner size={40} />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Loading your dashboard...
            </p>
          </CardContent>
        </Card>
      </PageSection>,
      servicesAndToolsSection,
    )
  } else if (error) {
    sections.push(
      <PageSection
        id="workspace-pulse"
        title="Workspace pulse"
        description="We could not retrieve your workspace status."
        key="error"
      >
        <Alert
          variant="destructive"
          className="rounded-[24px] border border-red-500/40 bg-red-500/10 text-red-700 backdrop-blur dark:text-red-200"
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
      servicesAndToolsSection,
    )
  } else if (activeSubscriptions.length === 0) {
    sections.push(
      <PageSection
        id="workspace-pulse"
        title="Workspace pulse"
        description="No services are active yet. Choose a starting point below."
        key="empty"
      >
        <Card className="rounded-[28px] border border-indigo-400/30 bg-[linear-gradient(135deg,_rgba(99,102,241,0.14),_rgba(14,165,233,0.12))] text-center text-slate-900 shadow-[0_32px_70px_-38px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-indigo-400/40 dark:text-slate-100">
          <CardContent className="space-y-6 p-10">
            <Badge className="mx-auto inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold tracking-[0.08em] text-indigo-700 dark:bg-white/10 dark:text-indigo-100">
              No active subscriptions yet
            </Badge>
            <h2 className="text-2xl font-semibold">
              Activate your first service
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-700/90 dark:text-slate-200/90">
              Provision global rotating proxies, managed VPS infrastructure, and SERP datasets in minutes. Choose a plan that matches your throughput and scale instantly when workloads spike.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                asChild
                className="gap-2 rounded-full px-6 py-2 text-base font-semibold"
              >
                <RouterLink to="/pricing">
                  <span>Explore plans</span>
                  <FiArrowUpRight className="h-4 w-4" />
                </RouterLink>
              </Button>
              <Button
                asChild
                variant="outline"
                className="gap-2 rounded-full px-6 py-2 text-base font-medium"
              >
                <RouterLink to="/contact">
                  <span>Talk with sales</span>
                  <FiArrowUpRight className="h-4 w-4" />
                </RouterLink>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageSection>,
      servicesAndToolsSection,
    )
  } else {
    sections.push(
      <PageSection
        id="workspace-pulse"
        title="Workspace pulse"
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

      <PageSection
        id="usage-insights"
        title="Usage insights"
        description="Key throughput, data transfer, and spend metrics refreshed automatically."
        key="usage"
      >
        <StatHighlights stats={statHighlights} />
      </PageSection>,

      servicesAndToolsSection,

      <PageSection
        id="infrastructure"
        title="Infrastructure"
        description="Cross-section of managed servers, consumption, and handoff destinations."
        key="infrastructure"
      >
        <InfrastructureTable
          servers={servers.slice(0, 6)}
          totals={infrastructureTotals}
          formatCurrency={formatCurrency}
          ctaTo="/hosting"
        />
      </PageSection>,
    )
  }

  sections.push(componentGallerySection)

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
          <Card
            key={tool.label}
            className="group h-full rounded-[24px] border border-slate-200/70 bg-white/95 shadow-[0_20px_44px_-28px_rgba(15,23,42,0.46)] backdrop-blur-xl transition duration-200 hover:-translate-y-1.5 hover:shadow-[0_32px_60px_-30px_rgba(15,23,42,0.52)] dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_28px_64px_-34px_rgba(15,23,42,0.7)]"
          >
            <CardContent className="flex h-full flex-col gap-5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
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
                      <FiArrowUpRight className="h-4 w-4" />
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
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

const ComponentGallery = () => {
  const [checkboxChecked, setCheckboxChecked] = useState(true)
  const [selectedEnvironment, setSelectedEnvironment] = useState("production")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const analyticsPoints = [38, 62, 54, 78, 92, 66, 105, 98]
  const sparkPath = analyticsPoints
    .map((point, index) => {
      const x = (index / (analyticsPoints.length - 1)) * 180
      const y = 110 - point
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="rounded-[24px] border border-slate-200/70 bg-white/90 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.36)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_20px_50px_-32px_rgba(148,163,184,0.35)]">
        <CardHeader>
          <CardTitle className="text-xl">Feedback & status</CardTitle>
          <CardDescription>
            Alert, badge, and button styling checks with live spinner feedback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Alert className="border border-emerald-400/40 bg-emerald-500/10 text-emerald-700 backdrop-blur dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
            <AlertTitle>All systems operational</AlertTitle>
            <AlertDescription>
              Proxy routing, billing webhooks, and API key rotation are healthy.
            </AlertDescription>
          </Alert>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Primary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="secondary">Secondary</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" className="rounded-full px-4">
              Primary CTA
            </Button>
            <Button size="sm" variant="outline" className="rounded-full px-4">
              Outline CTA
            </Button>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Spinner size={18} />
              <span>Polling usage...</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[24px] border border-slate-200/70 bg-white/90 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.36)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_20px_50px_-32px_rgba(148,163,184,0.35)]">
        <CardHeader>
          <CardTitle className="text-xl">Form controls</CardTitle>
          <CardDescription>
            Validate input, textarea, and checkbox treatments side-by-side.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gallery-email">Contact email</Label>
            <Input
              id="gallery-email"
              type="email"
              placeholder="ops@roamingproxy.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gallery-notes">Internal note</Label>
            <Textarea
              id="gallery-notes"
              placeholder="Document crawl windows, axial rotation, or cache notes."
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="gallery-checkbox"
              checked={checkboxChecked}
              onCheckedChange={(value) => setCheckboxChecked(Boolean(value))}
            />
            <Label htmlFor="gallery-checkbox" className="text-sm font-medium">
              Enable automatic IP rotation
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[24px] border border-slate-200/70 bg-white/90 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.36)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_20px_50px_-32px_rgba(148,163,184,0.35)]">
        <CardHeader>
          <CardTitle className="text-xl">Analytics & charts</CardTitle>
          <CardDescription>
            Metric cards, sparkline trends, and breakdown tags for throughput reviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-[linear-gradient(135deg,_rgba(14,165,233,0.2),_rgba(99,102,241,0.16))] p-5 text-slate-900 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] dark:border-slate-700/60 dark:bg-[linear-gradient(135deg,_rgba(56,189,248,0.28),_rgba(129,140,248,0.22))] dark:text-slate-50">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                Requests
              </div>
              <div className="mt-2 text-2xl font-semibold">4.8M</div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                +12.4% vs last 7 days
              </p>
              <div className="mt-4">
                <svg viewBox="0 0 180 110" className="h-24 w-full">
                  <defs>
                    <linearGradient id="sparkGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(14,165,233,0.5)" />
                      <stop offset="100%" stopColor="rgba(14,165,233,0)" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`${sparkPath} L 180 110 L 0 110 Z`}
                    fill="url(#sparkGradient)"
                    className="stroke-none"
                  />
                  <path
                    d={sparkPath}
                    stroke="rgba(56,189,248,0.9)"
                    strokeWidth={3}
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-[0_16px_36px_-24px_rgba(15,23,42,0.35)] dark:border-slate-700/60 dark:bg-slate-900/60">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Network mix
                </p>
                <div className="mt-2 flex items-baseline gap-2 text-2xl font-semibold">
                  64%
                  <span className="text-xs font-medium text-emerald-500">target proximity</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>Datacenter</span>
                  <Badge className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">
                    42%
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>Residential</span>
                  <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em]">
                    38%
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>ISP</span>
                  <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em]">
                    20%
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[24px] border border-slate-200/70 bg-white/90 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.36)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_20px_50px_-32px_rgba(148,163,184,0.35)]">
        <CardHeader>
          <CardTitle className="text-xl">Tags & pill states</CardTitle>
          <CardDescription>
            Review metadata badges, access labels, and contextual status chips.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Badge className="rounded-full bg-indigo-500/20 px-4 py-1 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/25 dark:text-indigo-100">
              Workspace owner
            </Badge>
            <Badge variant="outline" className="rounded-full px-4 py-1 text-sm">
              Billing admin
            </Badge>
            <Badge variant="secondary" className="rounded-full px-4 py-1 text-sm">
              Read-only
            </Badge>
            <Badge className="rounded-full bg-rose-500/15 px-4 py-1 text-sm font-semibold text-rose-600 dark:bg-rose-500/25 dark:text-rose-200">
              Needs review
            </Badge>
          </div>
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <Badge variant="outline" className="rounded-full px-3 py-1">
              GDPR ready
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              SOC 2
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              HIPAA
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[24px] border border-slate-200/70 bg-white/90 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.36)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_20px_50px_-32px_rgba(148,163,184,0.35)] xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-xl">Menus, overlays & data</CardTitle>
          <CardDescription>
            Dropdowns, tooltips, dialogs, and table styling bundled for quick visual regression.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-500">
              Tooltip
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full px-4">
                    Hover for status
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  All proxy regions within SLA
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-500">
              Dropdown menu
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full px-4">
                  {selectedEnvironment === "production" ? "Production" : "Staging"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Choose environment</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={selectedEnvironment}
                  onValueChange={setSelectedEnvironment}
                >
                  <DropdownMenuRadioItem value="production">
                    Production
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="staging">
                    Staging
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Manage environments</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-500">
              Dialog
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full px-4">
                  Open preview
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle>Rotate credentials?</DialogTitle>
                  <DialogDescription>
                    Confirm to roll proxy credentials across all active regions.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <p>You can download the new key from the API console once generated.</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                    Last rotation · 3 hours ago
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsDialogOpen(false)} className="gap-2">
                    Rotate now
                    <FiArrowUpRight className="h-4 w-4" />
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
            <Table className="min-w-[480px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Node</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">nyc-edge-01</TableCell>
                  <TableCell>
                    <Badge className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">
                      Connected
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-slate-600 dark:text-slate-400">
                    82 ms
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">fra-edge-04</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em]">
                      Draining
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-slate-600 dark:text-slate-400">
                    104 ms
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">sfo-edge-07</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em]">
                      Pending
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-slate-600 dark:text-slate-400">
                    96 ms
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute("/_layout/")({ component: HomePage })
export default HomePage
