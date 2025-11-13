import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { Link as RouterLink, createFileRoute } from "@tanstack/react-router"
import { useCallback, useMemo, useState } from "react"
import {
  FaBook,
  FaCreditCard,
  FaGlobe,
  FaSearch,
  FaServer,
} from "react-icons/fa"
import { FiArrowUpRight, FiDatabase, FiUserCheck } from "react-icons/fi"
import type { IconType } from "react-icons"

import ActiveServicesGrid from "../../components/Dashboard/ActiveServicesGrid"
import DashboardHeader from "../../components/Dashboard/DashboardHeader"
import InfrastructureTable from "../../components/Dashboard/InfrastructureTable"
import QuickActionsGrid from "../../components/Dashboard/QuickActionsGrid"
import StatHighlights from "../../components/Dashboard/StatHighlights"
import type {
  DashboardStat,
  DisplayedFeature,
  QuickActionLink,
  ServerNode,
} from "../../components/Dashboard/types"
import ProtectedComponent from "../../components/Common/ProtectedComponent"

type FeatureMeta = {
  name: string
  description: string
  icon: IconType
  path: string
  gradient: string
  period?: string
}

type FeatureKey = "proxy-api" | "vps-hosting" | "serp-api"

const featureDetails: Record<FeatureKey, FeatureMeta> = {
  "proxy-api": {
    name: "Web Scraping API",
    description:
      "Low-latency rotating proxies with smart routing, retry logic, and geo-targeting out of the box.",
    icon: FaGlobe,
    path: "/web-scraping-tools/https-api",
    gradient: "linear(to-br, rgba(99,102,241,0.16), rgba(14,165,233,0.1))",
    period: "Aug 15 – Sep 15, 2025",
  },
  "vps-hosting": {
    name: "Managed VPS Fleet",
    description:
      "Monitor health, snapshots, and failover orchestration across your managed RoamingProxy compute footprint.",
    icon: FaServer,
    path: "/hosting",
    gradient: "linear(to-br, rgba(34,197,94,0.16), rgba(6,182,212,0.12))",
    period: "Sep 9 – Oct 9, 2025",
  },
  "serp-api": {
    name: "SERP Intelligence",
    description:
      "Fresh structured search results with localized keywords, device targeting, and historical snapshots.",
    icon: FaSearch,
    path: "/web-scraping-tools/serp-api",
    gradient: "linear(to-br, rgba(251,191,36,0.18), rgba(99,102,241,0.12))",
    period: "Available for activation",
  },
}

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

  const displayedFeatures = useMemo<DisplayedFeature[]>(() => {
    const enabled = new Set<FeatureKey>()
    activeSubscriptions.forEach((sub) => {
      sub.enabled_features?.forEach((feature) => {
        if (featureDetails[feature]) {
          enabled.add(feature)
        }
      })
    })

    if (enabled.size === 0) {
      ("proxy-api,vps-hosting,serp-api".split(",") as FeatureKey[]).forEach(
        (feature) => {
          if (featureDetails[feature]) {
            enabled.add(feature)
          }
        },
      )
    }

    return Array.from(enabled).reduce<DisplayedFeature[]>((acc, slug) => {
      const meta = featureDetails[slug]
      if (!meta) return acc
      acc.push({
        slug,
        name: meta.name,
        description: meta.description,
        icon: meta.icon,
        path: meta.path,
        gradient: meta.gradient,
        period: meta.period,
      })
      return acc
    }, [])
  }, [activeSubscriptions])

  const nextRenewalLabel = nextRenewal
    ? dateFormatter.format(nextRenewal)
    : "No renewal scheduled"

  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const toast = useToast()

  const handleBillingClick = useCallback(async () => {
    if (!token) {
      toast({
        title: "Sign in required",
        description: "Log in again to open the customer billing portal.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setIsPortalLoading(true)
    try {
      const portalUrl = await fetchBillingPortal(token)
      window.location.href = portalUrl
    } catch (error) {
      console.error("Error accessing customer portal:", error)
      toast({
        title: "Unable to open portal",
        description:
          "Something went wrong loading billing. Please try again shortly.",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsPortalLoading(false)
    }
  }, [toast, token])

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

  let content: React.ReactNode

  if (isLoading) {
    content = (
      <Card variant="outline" borderRadius="2xl" borderColor="transparent" p={8}>
        <Stack align="center" spacing={4}>
          <Spinner size="lg" color="primary" thickness="4px" />
          <Text fontSize="sm" color="fg.muted">
            Loading your dashboard...
          </Text>
        </Stack>
      </Card>
    )
  } else if (error) {
    content = (
      <Alert
        status="error"
        variant="left-accent"
        borderRadius="2xl"
        bg="rgba(248, 113, 113, 0.08)"
        borderColor="rgba(248, 113, 113, 0.45)"
        alignItems="flex-start"
      >
        <AlertIcon />
        <Stack spacing={1}>
          <Heading size="sm">We couldn&apos;t load your workspace</Heading>
          <Text fontSize="sm" color="fg.muted">
            {error instanceof Error
              ? error.message
              : "Unexpected error loading subscriptions. Please refresh and try again."}
          </Text>
        </Stack>
      </Alert>
    )
  } else if (activeSubscriptions.length === 0) {
    content = (
      <Card
        variant="outline"
        borderRadius="2xl"
        p={10}
        bgGradient="linear(to-br, rgba(99,102,241,0.14), rgba(14,165,233,0.12))"
        boxShadow="0 32px 70px -38px rgba(15,23,42,0.45)"
      >
        <Stack spacing={6} align="center" textAlign="center">
          <Badge
            colorScheme="brand"
            borderRadius="full"
            px={4}
            py={1.5}
            bg="rgba(99, 102, 241, 0.18)"
          >
            No active subscriptions yet
          </Badge>
          <Heading size="lg">Activate your first service</Heading>
          <Text maxW="2xl" color="fg.muted">
            Provision global rotating proxies, managed VPS infrastructure, and SERP datasets in minutes. Choose a plan that matches your throughput and scale instantly when workloads spike.
          </Text>
          <HStack spacing={4}>
            <Button
              as={RouterLink}
              to="/pricing"
              colorScheme="brand"
              rightIcon={<FiArrowUpRight />}
            >
              Explore plans
            </Button>
            <Button as={RouterLink} to="/contact" variant="outline" rightIcon={<FiArrowUpRight />}>
              Talk with sales
            </Button>
          </HStack>
        </Stack>
      </Card>
    )
  } else {
    content = (
      <Stack spacing={12}>
        <DashboardHeader
          servicesCount={displayedFeatures.length}
          nextRenewalLabel={nextRenewalLabel}
          apiKeyCount={apiKeyCount}
          averageRequestsPerKey={averageRequestsPerKey}
          onBillingClick={handleBillingClick}
          isBillingLoading={isPortalLoading}
          apiConsoleTo="/web-scraping-tools/https-api"
        />

        <StatHighlights stats={statHighlights} />

        <SimpleGrid columns={{ base: 1, xl: 2 }} gap={10} alignItems="start">
          <Stack spacing={5}>
            <Heading size="md">Active services</Heading>
            <Text color="fg.muted" fontSize="sm">
              Keep tabs on throughput, activation windows,
              and available feature sets across your workspace.
            </Text>
            <ActiveServicesGrid features={displayedFeatures} />
          </Stack>

          <Stack spacing={5}>
            <Heading size="md">Quick actions</Heading>
            <Text color="fg.muted" fontSize="sm">
              Jump straight into the tools your team relies on most.
            </Text>
            <QuickActionsGrid actions={quickActions} />
          </Stack>
        </SimpleGrid>

        <InfrastructureTable
          servers={servers.slice(0, 6)}
          totals={infrastructureTotals}
          formatCurrency={formatCurrency}
          ctaTo="/hosting"
        />
      </Stack>
    )
  }

  return (
    <ProtectedComponent>
      <Box mb={10}>{content}</Box>
    </ProtectedComponent>
  )
}

export const Route = createFileRoute("/_layout/")({ component: HomePage })
export default HomePage
