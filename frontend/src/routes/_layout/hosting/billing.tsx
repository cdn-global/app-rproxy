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
  const currentMonth = months.at(-1) ?? {
    name: "Current Month",
    start: new Date(),
    end: new Date(),
  }

  const {
    totals: currentTotals,
    activeServers: currentActiveServers,
    perServerTotals,
    grandTotal,
    fullPriceTotals,
    fullGrandTotal,
    fullPricePerServerTotals,
  } = useMemo(() => calculateTotalsForMonth(currentMonth), [currentMonth])

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
    .filter(({ month }) => month.name === currentMonth.name)
    .reduce((sum, { total }) => sum + total, 0)
  const pendingInvoices = paymentHistory.filter((item) => item.status === "Pending")

  const outstandingBalance = useMemo(() => {
    const priorPending = paymentHistory
      .filter(({ month, status }) => month.name !== currentMonth.name && status === "Pending")
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
      description: `${currentMonth.name} vs August 2025.`,
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
    <div className="space-y-12">
      <div className="rounded-[32px] border border-slate-200/70 bg-white/85 px-6 py-8 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)]">
        <div className="space-y-4">
          <Badge className="rounded-full border border-indigo-200/70 bg-indigo-500/10 px-4 py-1 text-[0.65rem] uppercase tracking-[0.22em] text-indigo-700 dark:border-indigo-500/30 dark:text-indigo-100">
            Billing cycle
          </Badge>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {currentMonth.name}
            </h1>
            <Badge variant="outline" className="rounded-full border-slate-200/70 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-600/60 dark:text-slate-300">
              Managed hosting + API
            </Badge>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Review usage-based charges, subscription run rate, and settlement history with the same glass aesthetic as the dashboard landing page.
          </p>
        </div>
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

      {outstandingBalance > 0 || pendingInvoices.length > 0 ? (
        <div className="rounded-[28px] border border-amber-300/70 bg-amber-50/80 shadow-[0_24px_60px_-40px_rgba(217,119,6,0.45)] backdrop-blur-xl dark:border-amber-500/60 dark:bg-amber-500/15">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-100">
                Balance snapshot
              </h3>
              <p className="text-sm text-amber-700/90 dark:text-amber-100/80">
                Outstanding items include uninvoiced usage and any prior pending receipts.
              </p>
            </div>
            <Badge variant="warning" className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              Action recommended
            </Badge>
          </div>
          <div className="space-y-4 p-6 pt-0">
            <div className="flex flex-wrap items-end gap-3 text-slate-900 dark:text-slate-100">
              <span className="text-3xl font-semibold">
                {currencyFormatter.format(outstandingBalance)}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Outstanding across current charges
              </span>
            </div>
            {pendingInvoices.length > 0 ? (
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {pendingInvoices.map((invoice) => (
                  <li key={invoice.invoiceId} className="flex items-center justify-between rounded-2xl border border-amber-200/70 bg-white/60 px-4 py-2 dark:border-amber-500/40 dark:bg-amber-500/10">
                    <span>
                      {invoice.description} ({invoice.month.name})
                    </span>
                    <span className="font-semibold">
                      {currencyFormatter.format(invoice.total)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                All invoices for {currentMonth.name} have settled. The balance reflects usage awaiting billing sync.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 border-t border-amber-200/60 bg-white/60 p-6 text-sm text-slate-600 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-slate-400">
            <Button
              variant="outline"
              className="gap-2 rounded-full border-amber-300/70 px-5 py-2 text-sm font-semibold text-amber-700 hover:border-amber-400 hover:text-amber-800 dark:border-amber-500/60 dark:text-amber-100"
              onClick={handleBillingClick}
              isLoading={isLoading}
              loadingText="Redirecting..."
            >
              <FiArrowUpRight className="h-4 w-4" />
              Resolve in Stripe
            </Button>
            <span className="text-xs text-amber-700/80 dark:text-amber-100/70">
              You&apos;ll land directly in the self-service customer portal.
            </span>
          </div>
        </div>
      ) : null}

      <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
        <div className="space-y-2 border-b border-slate-200/70 p-6 dark:border-slate-700/60">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Server charges
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Per-server view of charged vs. list pricing for the month.
          </p>
        </div>
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
                <TableRow>
                  <TableCell colSpan={3} className="text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Subscription
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {currencyFormatter.format(SUBSCRIPTION_COST_PER_MONTH)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {currencyFormatter.format(SUBSCRIPTION_COST_PER_MONTH)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Grand total
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
        <div className="flex flex-wrap items-center gap-4 border-t border-slate-200/70 bg-white/70 p-6 text-xs text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-500">
          Charged totals exclude compute trials; full pricing illustrates what you would pay without promotional credits.
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
        <div className="space-y-2 border-b border-slate-200/70 p-6 dark:border-slate-700/60">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Service breakdown
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Each managed add-on measured against its full list price.
          </p>
        </div>
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
        <div className="flex flex-wrap items-center gap-4 border-t border-slate-200/70 bg-white/70 p-6 text-xs text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-500">
          Storage and elastic IP fees are metered across the active fleet; managed support appears only where enabled.
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
        <div className="flex flex-wrap items-center gap-4 border-b border-slate-200/70 p-6 dark:border-slate-700/60">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Subscription snapshot
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Unlimited HTTPS API Request – Plus Tier · Renews monthly.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full border-slate-200/70 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-600/60 dark:text-slate-300">
            {currencyFormatter.format(SUBSCRIPTION_COST_PER_MONTH)} / month
          </Badge>
        </div>
        <div className="space-y-4 p-6 pt-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Subscribed services:
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-3">
              <li>HTTPS API Subscription</li>
              {services
                .filter((service) => currentTotals[service.name]?.count > 0)
                .map((service) => (
                  <li key={service.name} className="flex items-center gap-2">
                    <span>{service.name}</span>
                    <span className="text-xs text-slate-500">
                      (×{currentTotals[service.name].count})
                    </span>
                  </li>
                ))}
            </ul>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Subscription billing is handled through Stripe; use the portal to adjust plan size, payment method, or invoice recipients.
          </p>
          <Button
            variant="outline"
            className="gap-2 rounded-full border-slate-200/80 px-5 py-2 text-sm font-semibold shadow-sm hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
            onClick={handleBillingClick}
            isLoading={isLoading}
            loadingText="Redirecting..."
          >
            <FiExternalLink className="h-4 w-4" />
            Manage subscription
          </Button>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
        <div className="space-y-2 border-b border-slate-200/70 p-6 dark:border-slate-700/60">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Invoice history
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Direct links into Stripe for deeper detail or PDF exports.
          </p>
        </div>
        <div className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                  <TableHead>Month</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Payment date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((record) => (
                  <TableRow key={record.invoiceId} className="border-slate-200/70 dark:border-slate-700/60">
                    <TableCell className="font-medium text-slate-900 dark:text-slate-50">
                      {record.month.name}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                      {record.invoiceId.slice(0, 12)}…
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                      {record.paymentDate}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-slate-500">
                      {record.paymentMethod}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                      {record.description}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {currencyFormatter.format(record.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={record.status === "Succeeded" ? "success" : "warning"}
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                      >
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/70 bg-white/70 dark:border-slate-700/60 dark:bg-slate-900/50">
          <Button
            variant="outline"
            className="gap-2 rounded-full border-slate-200/80 px-4 py-2 text-sm font-semibold shadow-sm hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
            onClick={handleBillingClick}
            isLoading={isLoading}
            loadingText="Redirecting..."
          >
            <FiArrowUpRight className="h-4 w-4" />
            Manage invoices in Stripe
          </Button>
          <span className="text-xs text-slate-500 dark:text-slate-500">
            Stripe provides PDF exports, receipts, and VAT-compliant billing data.
          </span>
        </CardFooter>
      </Card>

      <Card className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
        <CardHeader className="space-y-2 border-b border-slate-200/70 pb-6 dark:border-slate-700/60">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Payment method & billing address
          </CardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The saved card and remit-to details in Stripe today.
          </p>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-[0_18px_40px_-35px_rgba(15,23,42,0.45)] dark:border-slate-700/60 dark:bg-slate-900/60">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
              Default payment method
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
              American Express ending in 3007
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Expires 11/2027</p>
            <Button
              variant="outline"
              className="mt-4 gap-2 rounded-full border-slate-200/80 px-4 py-2 text-sm font-semibold shadow-sm hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
              onClick={handleBillingClick}
              isLoading={isLoading}
              loadingText="Redirecting..."
            >
              <FiCreditCard className="h-4 w-4" />
              Update payment method
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-[0_18px_40px_-35px_rgba(15,23,42,0.45)] dark:border-slate-700/60 dark:bg-slate-900/60">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
              Billing address
            </p>
            <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{billingAddress.name}</p>
              <p>{billingAddress.line1}</p>
              <p>
                {billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}
              </p>
              <p>{billingAddress.country}</p>
              <p>{billingAddress.phone}</p>
              <p>{billingAddress.email}</p>
            </div>
            <Button
              variant="outline"
              className="mt-4 gap-2 rounded-full border-slate-200/80 px-4 py-2 text-sm font-semibold shadow-sm hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
              onClick={handleBillingClick}
              isLoading={isLoading}
              loadingText="Redirecting..."
            >
              <FiArrowUpRight className="h-4 w-4" />
              Manage billing address
            </Button>
          </div>
        </CardContent>
      </Card>

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
  )
}

export const Route = createFileRoute("/_layout/hosting/billing")({
  component: BillingPage,
})
