import { useCallback, useMemo, useState } from "react"
import { Link as RouterLink, createFileRoute } from "@tanstack/react-router"
import { FiArrowLeft, FiArrowUpRight, FiCreditCard, FiExternalLink } from "react-icons/fi"
import SummaryMetric from "@/components/Common/SummaryMetric"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  hostingServers,
  type HostingServer,
} from "@/data/hosting"
import useCustomToast from "@/hooks/useCustomToast"
import PageScaffold, { PageSection } from "../../../components/Common/PageLayout"

const servers: HostingServer[] = hostingServers

const ELASTIC_IP_FEE_PER_MONTH = 5
const STORAGE_COST_PER_GB_MONTH = 0.2
const ROTATING_IP_FEE_PER_MONTH = 7.0
const BACKUP_FEE_PER_MONTH = 7.0
const MONITORING_FEE_PER_MONTH = 11.0
const MANAGED_SUPPORT_FEE_PER_MONTH = 40.0
const SUBSCRIPTION_COST_PER_MONTH = 299

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const percentageFormatter = (value: number) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`

interface Service {
  name: string
  getMonthlyCost: (server: HostingServer) => number
}

const services: Service[] = [
  { name: "Compute", getMonthlyCost: (s) => s.monthlyComputePrice },
  {
    name: "Storage",
    getMonthlyCost: (s) => s.storageSizeGB * STORAGE_COST_PER_GB_MONTH,
  },
  { name: "Elastic IP", getMonthlyCost: () => ELASTIC_IP_FEE_PER_MONTH },
  {
    name: "Rotating IP",
    getMonthlyCost: (s) =>
      s.hasRotatingIP ? ROTATING_IP_FEE_PER_MONTH * 2 : 0,
  },
  {
    name: "Backup",
    getMonthlyCost: (s) => (s.hasBackup ? BACKUP_FEE_PER_MONTH : 0),
  },
  {
    name: "Monitoring",
    getMonthlyCost: (s) => (s.hasMonitoring ? MONITORING_FEE_PER_MONTH : 0),
  },
  {
    name: "Managed Support",
    getMonthlyCost: (s) =>
      s.hasManagedSupport ? MANAGED_SUPPORT_FEE_PER_MONTH : 0,
  },
]

interface Month {
  name: string
  start: Date
  end: Date
}

const months: Month[] = [
  {
    name: "April 2025",
    start: new Date(2025, 3, 1),
    end: new Date(2025, 3, 30),
  },
  { name: "May 2025", start: new Date(2025, 4, 1), end: new Date(2025, 4, 31) },
  {
    name: "June 2025",
    start: new Date(2025, 5, 1),
    end: new Date(2025, 5, 30),
  },
  {
    name: "July 2025",
    start: new Date(2025, 6, 1),
    end: new Date(2025, 6, 31),
  },
  {
    name: "August 2025",
    start: new Date(2025, 7, 1),
    end: new Date(2025, 7, 31),
  },
  {
    name: "September 2025",
    start: new Date(2025, 8, 1),
    end: new Date(2025, 8, 30),
  },
  {
    name: "October 2025",
    start: new Date(2025, 9, 1),
    end: new Date(2025, 9, 31),
  },
  {
    name: "November 2025",
    start: new Date(2025, 10, 1),
    end: new Date(2025, 10, 30),
  },
  {
    name: "December 2025",
    start: new Date(2025, 11, 1),
    end: new Date(2025, 11, 31),
  },
]

function calculateTotalsForMonth(month: Month) {
  const activeServers = servers.filter((server) => new Date(server.activeSince) <= month.end)

  const totals = services.reduce(
    (acc, service) => {
      const chargedTotal = activeServers.reduce((sum, server) => {
        if (server.isTrial && service.name === "Compute") {
          return sum
        }
        return sum + service.getMonthlyCost(server)
      }, 0)

      const count = activeServers.filter((server) => {
        if (server.isTrial && service.name === "Compute") {
          return false
        }
        return service.getMonthlyCost(server) > 0
      }).length

      acc[service.name] = { total: chargedTotal, count }
      return acc
    },
    {} as Record<string, { total: number; count: number }>,
  )

  const fullPriceTotals = services.reduce(
    (acc, service) => {
      const fullTotal = activeServers.reduce((sum, server) => {
        if (service.name === "Compute" && server.isTrial) {
          return sum + server.fullMonthlyComputePrice
        }
        return sum + service.getMonthlyCost(server)
      }, 0)

      const count = activeServers.filter((server) => {
        if (service.name === "Compute" && server.isTrial) {
          return server.fullMonthlyComputePrice > 0
        }
        return service.getMonthlyCost(server) > 0
      }).length

      acc[service.name] = { total: fullTotal, count }
      return acc
    },
    {} as Record<string, { total: number; count: number }>,
  )

  const perServerTotals = activeServers.reduce(
    (acc, server) => {
      const charged = server.isTrial
        ? 0
        : services.reduce((sum, service) => sum + service.getMonthlyCost(server), 0)
      acc[server.name] = charged
      return acc
    },
    {} as Record<string, number>,
  )

  const fullPricePerServerTotals = activeServers.reduce(
    (acc, server) => {
      const fullPrice = services.reduce((sum, service) => {
        if (service.name === "Compute" && server.isTrial) {
          return sum + server.fullMonthlyComputePrice
        }
        return sum + service.getMonthlyCost(server)
      }, 0)
      acc[server.name] = fullPrice
      return acc
    },
    {} as Record<string, number>,
  )

  const subscriptionStart = new Date(2025, 3, 1)
  const isSubscriptionActive = month.start >= subscriptionStart
  const subscriptionCost = isSubscriptionActive ? SUBSCRIPTION_COST_PER_MONTH : 0

  const grandTotal = Object.values(totals).reduce((sum, { total }) => sum + total, 0) + subscriptionCost
  const fullGrandTotal =
    Object.values(fullPriceTotals).reduce((sum, { total }) => sum + total, 0) + subscriptionCost

  return {
    totals,
    grandTotal,
    fullPriceTotals,
    fullGrandTotal,
    activeServers,
    perServerTotals,
    fullPricePerServerTotals,
  }
}

const fetchBillingPortal = async (token: string) => {
  try {
    const response = await fetch(
      "https://api.ROAMINGPROXY.com/v2/customer-portal",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    )
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    if (!data.portal_url) {
      throw new Error("No portal URL received in response")
    }
    return data.portal_url
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    throw new Error(`Failed to fetch billing portal: ${message}`)
  }
}

interface PaymentRecord {
  month: Month
  total: number
  invoiceId: string
  paymentDate: string
  paymentMethod: string
  description: string
  status: "Succeeded" | "Pending" | "Failed" | "Canceled"
}

const paymentHistory: PaymentRecord[] = [
  {
    month: months[7],
    total: 391.14,
    invoiceId: "pi_3SW8vcLqozOkbqR80sI1UzZ8",
    paymentDate: "November 27, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Payment for Invoice",
    status: "Succeeded",
  },
  {
    month: months[7],
    total: 381.56,
    invoiceId: "pi_3SVmS3LqozOkbqR81zMjd8tl",
    paymentDate: "November 27, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Payment for Invoice",
    status: "Succeeded",
  },
  {
    month: months[7],
    total: 484.13,
    invoiceId: "pi_3SW8vcLqozOkbqR80sI1UzZ8",
    paymentDate: "November 22, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "pi_3SW8vcLqozOkbqR80sI1UzZ8",
    status: "Succeeded",
  },
  {
    month: months[7],
    total: 491.93,
    invoiceId: "pi_3SVmS3LqozOkbqR81zMjd8tl",
    paymentDate: "November 21, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "pi_3SVmS3LqozOkbqR81zMjd8tl",
    status: "Succeeded",
  },
  {
    month: months[7],
    total: 412.87,
    invoiceId: "pi_3STbakLqozOkbqR80q95SMhg",
    paymentDate: "November 18, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Payment for Invoice",
    status: "Succeeded",
  },
  {
    month: months[7],
    total: 299.0,
    invoiceId: "pi_3STF7DLqozOkbqR81xgsCKSf",
    paymentDate: "November 15, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Subscription update",
    status: "Succeeded",
  },
  {
    month: months[7],
    total: 494.6,
    invoiceId: "pi_3SSgZJLqozOkbqR81edqCR9t",
    paymentDate: "November 15, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "pi_3STbakLqozOkbqR80q95SMhg",
    status: "Succeeded",
  },
  {
    month: months[7],
    total: 494.01,
    invoiceId: "pi_3S5MosLqozOkbqR8Bx8H7FYy",
    paymentDate: "November 14, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "pi_3STF7DLqozOkbqR81xgsCKSf",
    status: "Succeeded",
  },
  {
    month: months[7],
    total: 484.13,
    invoiceId: "pi_3S4MosLqozOkbqR8Bx8H7FYy",
    paymentDate: "November 12, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Payment for Invoice",
    status: "Canceled",
  },
  {
    month: months[7],
    total: 479.86,
    invoiceId: "pi_3S2MosLqozOkbqR8Bx8H7FYy",
    paymentDate: "November 10, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Payment for Invoice",
    status: "Succeeded",
  },
  {
    month: months[7],
    total: 482.39,
    invoiceId: "pi_3S1MosLqozOkbqR8Bx8H7FYy",
    paymentDate: "November 3, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Payment for Invoice",
    status: "Succeeded",
  },
  {
    month: months[6],
    total: 483.29,
    invoiceId: "pi_3S0MosLqozOkbqR8Bx8H7FYy",
    paymentDate: "October 24, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Payment for Invoice",
    status: "Succeeded",
  },
  {
    month: months[6],
    total: 210.6,
    invoiceId: "pi_3RZMosLqozOkbqR8Bx8H7FYy",
    paymentDate: "October 17, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Payment for Invoice",
    status: "Succeeded",
  },
  {
    month: months[6],
    total: 192.63,
    invoiceId: "pi_3RYMosLqozOkbqR8Bx8H7FYy",
    paymentDate: "October 16, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Payment for Invoice",
    status: "Succeeded",
  },
  {
    month: months[6],
    total: 299.0,
    invoiceId: "pi_3RXMosLqozOkbqR8Bx8H7FYy",
    paymentDate: "October 15, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Subscription update",
    status: "Succeeded",
  },
  {
    month: months[6],
    total: 493.7,
    invoiceId: "pi_3RWMosLqozOkbqR8Bx8H7FYy",
    paymentDate: "October 9, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Payment for Invoice",
    status: "Succeeded",
  },
  {
    month: months[5],
    total: 299.0,
    invoiceId: "pi_3RVMosLqozOkbqR8Bx8H7FYy",
    paymentDate: "September 15, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Subscription update",
    status: "Succeeded",
  },
  {
    month: months[5],
    total: 193.7,
    invoiceId: "pi_3RUMosLqozOkbqR8Bx8H7FYy",
    paymentDate: "September 10, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Payment for Invoice",
    status: "Succeeded",
  },
  {
    month: months[5],
    total: 449.0,
    invoiceId: "pi_3RTMosLqozOkbqR8Bx8H7FYy",
    paymentDate: "September 9, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Payment for Invoice",
    status: "Succeeded",
  },
  {
    month: months[5],
    total: 299.0,
    invoiceId: "28B73F19-0023",
    paymentDate: "September 15, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "HTTPs Request API - Plus Tier Subscription",
    status: "Succeeded",
  },
  {
    month: months[5],
    total: 193.7,
    invoiceId: "pm_1Rihl8LqozOkbqR8mWtaIvNZ",
    paymentDate: "September 10, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Unlimited IP Rotation VPS - Multi-Region",
    status: "Succeeded",
  },
  {
    month: months[5],
    total: 449.0,
    invoiceId: "in_1S5MosLqozOkbqR8Bx8H7FYy",
    paymentDate: "September 9, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Unlimited IP Rotation VPS - Multi-Region",
    status: "Succeeded",
  },
  {
    month: months[4],
    total: 318.81,
    invoiceId: "in_1S5MosLqozOkbqR8Bx8H7FZa",
    paymentDate: "August 15, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "HTTPs Request API - Plus Tier Subscription",
    status: "Succeeded",
  },
  {
    month: months[3],
    total: 318.81,
    invoiceId: "in_1S5MosLqozOkbqR8Bx8H7FZb",
    paymentDate: "July 15, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "HTTPs Request API - Plus Tier Subscription",
    status: "Succeeded",
  },
  {
    month: months[2],
    total: 299.0,
    invoiceId: "in_1S5MosLqozOkbqR8Bx8H7FZc",
    paymentDate: "June 10, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "HTTPs Request API - Plus Tier Subscription",
    status: "Succeeded",
  },
  {
    month: months[1],
    total: 299.0,
    invoiceId: "in_1S5MosLqozOkbqR8Bx8H7FZd",
    paymentDate: "May 10, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "HTTPs Request API - Plus Tier Subscription",
    status: "Succeeded",
  },
  {
    month: months[0],
    total: 322.92,
    invoiceId: "in_1S5MosLqozOkbqR8Bx8H7FZe",
    paymentDate: "April 10, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "HTTPs Request API - Plus Tier Subscription",
    status: "Succeeded",
  },
]

const BillingPage = () => {
  const [selectedMonth, setSelectedMonth] = useState<Month>(months.at(-1) ?? {
    name: "Current Month",
    start: new Date(),
    end: new Date(),
  })

  const {
    totals: currentTotals,
    activeServers: currentActiveServers,
    perServerTotals,
    grandTotal,
    fullPriceTotals,
    fullGrandTotal,
    fullPricePerServerTotals,
  } = useMemo(() => calculateTotalsForMonth(selectedMonth), [selectedMonth])

  const [token] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null,
  )
  const [isLoading, setIsLoading] = useState(false)
  const showToast = useCustomToast()

  const handleBillingClick = useCallback(async () => {
    if (!token) {
      showToast(
        "Sign in required",
        "Log in again to open your Stripe customer portal.",
        "warning",
      )
      return
    }
    setIsLoading(true)
    try {
      const portalUrl = await fetchBillingPortal(token)
      window.location.href = portalUrl
    } catch (error) {
      console.error("Error accessing customer portal", error)
      showToast(
        "Unable to open portal",
        error instanceof Error
          ? error.message
          : "Please try again in a few moments.",
        "error",
      )
    } finally {
      setIsLoading(false)
    }
  }, [token, showToast])

  const succeededInvoices = paymentHistory.filter((item) => item.status === "Succeeded")
  const invoicedAmount = succeededInvoices
    .filter(({ month }) => month.name === selectedMonth.name)
    .reduce((sum, { total }) => sum + total, 0)
  const pendingInvoices = paymentHistory.filter((item) => item.status === "Pending")

  const outstandingBalance = useMemo(() => {
    const priorPending = paymentHistory
      .filter(({ month, status }) => month.name !== selectedMonth.name && status === "Pending")
      .reduce((sum, { total }) => sum + total, 0)
    return grandTotal + priorPending - invoicedAmount
  }, [grandTotal, invoicedAmount])

  const allTimeTotal = paymentHistory.reduce((sum, { total }) => sum + total, 0)
  const averageMonthly = allTimeTotal / months.length
  const previousMonthTotal = paymentHistory
    .filter(({ month }) => month.name === "August 2025")
    .reduce((sum, { total }) => sum + total, 0)
  const monthOverMonthChange = previousMonthTotal
    ? ((grandTotal - previousMonthTotal) / previousMonthTotal) * 100
    : 0

  const summaryMetrics = [
    {
      label: "Charged total",
      value: currencyFormatter.format(grandTotal),
      description: `${currentActiveServers.length} active nodes (trials excluded).`,
    },
    {
      label: "Full-price total",
      value: currencyFormatter.format(fullGrandTotal),
      description: "List pricing with trials factored back in.",
    },
    {
      label: "Average monthly",
      value: currencyFormatter.format(averageMonthly),
      description: `${months.length} months tracked in this view.`,
    },
    {
      label: "MoM change",
      value: percentageFormatter(monthOverMonthChange),
      description: `${selectedMonth.name} vs August 2025.`,
    },
  ]

  const billingAddress = {
    name: "Nik Popov",
    email: "apispopov@gmail.com",
    line1: "599 Broadway, floor 3",
    city: "New York",
    state: "NY",
    postalCode: "10012",
    country: "United States",
    phone: "(212) 595-3915",
  }

  return (
    <PageScaffold sidebar={null}>
    <div className="space-y-12">
        <PageSection
          id="billing-cycle"
          title="Billing cycle"
          description="View charges and usage for this period."
          actions={
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Month:</span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedMonth.name}
                onChange={(e) => {
                  const month = months.find((m) => m.name === e.target.value)
                  if (month) setSelectedMonth(month)
                }}
              >
                {months.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          }
        >
      <div className="rounded-[32px] border border-slate-200/70 bg-white/85 px-6 py-8 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)]">
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryMetrics.map((metric) => (
            <SummaryMetric
              key={metric.label}
              label={metric.label}
              value={metric.value}
              description={metric.description}
            />
          ))}
        </div>
      </div>
      </PageSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Server Charges */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Server Charges
            </h3>
            <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
              <div className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                      <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                        <TableHead>Server</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Charged (USD)</TableHead>
                        <TableHead className="text-right">Full (USD)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentActiveServers.map((server) => {
                        const charged = perServerTotals[server.name] ?? 0
                        const full = fullPricePerServerTotals[server.name] ?? 0
                        return (
                          <TableRow
                            key={server.name}
                            className="border-slate-200/70 transition-colors hover:bg-slate-100/60 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                          >
                            <TableCell className="font-medium text-slate-900 dark:text-slate-50">
                              {server.name}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                              {server.ip}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={server.isTrial ? "outline" : "success"}
                                className="rounded-full px-3 py-1 text-xs font-semibold"
                              >
                                {server.isTrial ? "Trial" : "Active"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold text-slate-900 dark:text-slate-50">
                              {currencyFormatter.format(charged)}
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold text-slate-900 dark:text-slate-50">
                              {currencyFormatter.format(full)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Server total
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {currencyFormatter.format(grandTotal - SUBSCRIPTION_COST_PER_MONTH)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {currencyFormatter.format(fullGrandTotal - SUBSCRIPTION_COST_PER_MONTH)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
            </div>
          </div>

          {/* Service Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Service Breakdown
            </h3>
            <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
              <div className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                      <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                        <TableHead>Service</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Charged (USD)</TableHead>
                        <TableHead className="text-right">Full (USD)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.name}>
                          <TableCell className="font-medium text-slate-900 dark:text-slate-50">
                            {service.name}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                            × {currentTotals[service.name].count}
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold text-slate-900 dark:text-slate-50">
                            {currencyFormatter.format(currentTotals[service.name].total)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold text-slate-900 dark:text-slate-50">
                            {currencyFormatter.format(fullPriceTotals[service.name].total)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-medium text-slate-900 dark:text-slate-50">
                          HTTPS API Subscription (Plus)
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 dark:text-slate-400">× 1</TableCell>
                        <TableCell className="text-right text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {currencyFormatter.format(SUBSCRIPTION_COST_PER_MONTH)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {currencyFormatter.format(SUBSCRIPTION_COST_PER_MONTH)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2} className="text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Total
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {currencyFormatter.format(grandTotal)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {currencyFormatter.format(fullGrandTotal)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Balance / Payment Status */}
          <div className="space-y-4">
             <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Payment Status
            </h3>
            <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
              {outstandingBalance > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-600 dark:text-slate-400">Outstanding</span>
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {currencyFormatter.format(outstandingBalance)}
                    </span>
                  </div>
                  <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-200">
                    Payment pending for {selectedMonth.name} usage.
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleBillingClick}>
                    Pay Now
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <FiCreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">All caught up</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      No outstanding balance
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Snapshot */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Subscription
            </h3>
            <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
              <div className="flex flex-wrap items-center gap-4 border-b border-slate-200/70 p-6 dark:border-slate-700/60">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Enterprise
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Managed hosting + API
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto rounded-full border-slate-200/70 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-600/60 dark:text-slate-300">
                  Active
                </Badge>
              </div>
              <div className="space-y-4 p-6 pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Included:
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li className="flex justify-between">
                      <span>HTTPS API (Plus)</span>
                      <span className="font-mono">{currencyFormatter.format(SUBSCRIPTION_COST_PER_MONTH)}</span>
                    </li>
                    {services
                      .filter((service) => currentTotals[service.name]?.count > 0)
                      .map((service) => (
                        <li key={service.name} className="flex justify-between">
                          <span>{service.name} (×{currentTotals[service.name].count})</span>
                          <span className="font-mono">{currencyFormatter.format(currentTotals[service.name].total)}</span>
                        </li>
                      ))}
                  </ul>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2 rounded-full border-slate-200/80 text-sm font-semibold shadow-sm hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
                  onClick={handleBillingClick}
                >
                  <FiExternalLink className="h-4 w-4" />
                  Manage Plan
                </Button>
              </div>
            </div>
          </div>

          {/* Invoice History */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Recent Invoices
            </h3>
            <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
              <div className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableBody>
                      {succeededInvoices.slice(0, 5).map((record) => (
                        <TableRow key={record.invoiceId} className="border-slate-200/70 dark:border-slate-700/60">
                          <TableCell className="font-medium text-slate-900 dark:text-slate-50">
                            <div className="flex flex-col">
                              <span>{record.month.name}</span>
                              <span className="text-xs text-slate-500 font-normal">{record.paymentDate}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {currencyFormatter.format(record.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-4 border-t border-slate-200/70 dark:border-slate-700/60">
                  <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                      onClick={handleBillingClick}
                  >
                    View All Invoices
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          asChild
          variant="outline"
          className="gap-2 rounded-full border-slate-200/80 px-5 py-2 text-sm font-semibold shadow-sm hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
        >
          <RouterLink to="..">
            <FiArrowLeft className="h-4 w-4" />
            Back to hosting
          </RouterLink>
        </Button>
      </div>
    </div>
    </PageScaffold>
  )
}

export const Route = createFileRoute("/_layout/hosting/billing")({
  component: BillingPage,
})
