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
import useCustomToast from "@/hooks/useCustomToast"
import PageScaffold, { PageSection } from "../../../components/Common/PageLayout"

// --- Mock Data for Scraping Tools ---

interface ScrapingPlan {
  id: string
  name: string
  activeSince: string
  status: "Active" | "Inactive" | "Trial"
  monthlyRate: number
  requestsMillions: number // e.g., 5.2 (millions)
  bandwidthGB: number
  premiumIps: boolean
  jobConcurrency: number
  isTrial: boolean
}

const scrapingUsage: ScrapingPlan[] = [
  {
    id: "plan-01",
    name: "Growth Plan - HTTPS API",
    activeSince: "2025-04-10",
    status: "Active",
    monthlyRate: 299,
    requestsMillions: 4.8,
    bandwidthGB: 120,
    premiumIps: true,
    jobConcurrency: 50,
    isTrial: false,
  },
  {
    id: "plan-02",
    name: "SERP Intelligence Starter",
    activeSince: "2025-09-01",
    status: "Active",
    monthlyRate: 149,
    requestsMillions: 1.2,
    bandwidthGB: 45,
    premiumIps: false,
    jobConcurrency: 10,
    isTrial: false,
  },
  {
    id: "plan-trial",
    name: "Experimental - AI Scraper",
    activeSince: "2025-12-01",
    status: "Trial",
    monthlyRate: 0,
    requestsMillions: 0.1,
    bandwidthGB: 5,
    premiumIps: true,
    jobConcurrency: 2,
    isTrial: true,
  },
]

// Costs per unit for overages or breakdown calculation
const REQUEST_COST_PER_MILLION = 20
const BANDWIDTH_COST_PER_GB = 0.5
const PREMIUM_IP_ADDON = 50
const CONCURRENCY_SLOT_COST = 5

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
  getMonthlyCost: (plan: ScrapingPlan) => number
}

const services: Service[] = [
  { name: "Base Plan", getMonthlyCost: (s) => s.monthlyRate },
  {
    name: "Request Overage",
    getMonthlyCost: (s) => Math.max(0, (s.requestsMillions - 2) * REQUEST_COST_PER_MILLION), // Assume 2M limit in base
  },
  {
    name: "Bandwidth Overage",
    getMonthlyCost: (s) => Math.max(0, (s.bandwidthGB - 100) * BANDWIDTH_COST_PER_GB), // Assume 100GB limit
  },
  {
    name: "Premium IPs",
    getMonthlyCost: (s) => (s.premiumIps ? PREMIUM_IP_ADDON : 0),
  },
  {
    name: "High Concurrency",
    getMonthlyCost: (s) => Math.max(0, (s.jobConcurrency - 20) * CONCURRENCY_SLOT_COST),
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
  const activePlans = scrapingUsage.filter((plan) => new Date(plan.activeSince) <= month.end)

  const totals = services.reduce(
    (acc, service) => {
      const chargedTotal = activePlans.reduce((sum, plan) => {
        if (plan.isTrial && service.name === "Base Plan") {
          return sum
        }
        return sum + service.getMonthlyCost(plan)
      }, 0)

      const count = activePlans.filter((plan) => {
        if (plan.isTrial && service.name === "Base Plan") {
          return false
        }
        return service.getMonthlyCost(plan) > 0
      }).length

      acc[service.name] = { total: chargedTotal, count }
      return acc
    },
    {} as Record<string, { total: number; count: number }>,
  )

  const fullPriceTotals = services.reduce(
    (acc, service) => {
      const fullTotal = activePlans.reduce((sum, plan) => {
        return sum + service.getMonthlyCost(plan)
      }, 0)

      const count = activePlans.filter((plan) => {
        return service.getMonthlyCost(plan) > 0
      }).length

      acc[service.name] = { total: fullTotal, count }
      return acc
    },
    {} as Record<string, { total: number; count: number }>,
  )

  const perPlanTotals = activePlans.reduce(
    (acc, plan) => {
      const charged = plan.isTrial
        ? 0
        : services.reduce((sum, service) => sum + service.getMonthlyCost(plan), 0)
      acc[plan.name] = charged
      return acc
    },
    {} as Record<string, number>,
  )

  const fullPricePerPlanTotals = activePlans.reduce(
    (acc, plan) => {
      const fullPrice = services.reduce((sum, service) => sum + service.getMonthlyCost(plan), 0)
      acc[plan.name] = fullPrice
      return acc
    },
    {} as Record<string, number>,
  )

  const grandTotal = Object.values(totals).reduce((sum, { total }) => sum + total, 0)
  const fullGrandTotal = Object.values(fullPriceTotals).reduce((sum, { total }) => sum + total, 0)

  return {
    totals,
    grandTotal,
    fullPriceTotals,
    fullGrandTotal,
    activePlans,
    perPlanTotals,
    fullPricePerPlanTotals,
  }
}

const fetchBillingPortal = async (token: string) => {
  // Mock implementation
  return "https://billing.stripe.com/p/login/mock"
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
    paymentMethod: "Visa •••• 4242",
    description: "Web Scraping Usage - Overage",
    status: "Succeeded",
  },
  {
    month: months[6],
    total: 299.00,
    invoiceId: "pi_3RXMosLqozOkbqR8Bx8H7FYy",
    paymentDate: "October 15, 2025",
    paymentMethod: "Visa •••• 4242",
    description: "Growth Plan Subscription",
    status: "Succeeded",
  },
  {
    month: months[5],
    total: 450.50,
    invoiceId: "pi_3RTMosLqozOkbqR8Bx8H7FYy",
    paymentDate: "September 9, 2025",
    paymentMethod: "Visa •••• 4242",
    description: "Growth Plan + Premium IPs",
    status: "Succeeded",
  },
]

const WebScrapingToolsBillingPage = () => {
  const showToast = useCustomToast()
  const [selectedMonth, setSelectedMonth] = useState<Month>(months.at(-1) ?? {
    name: "Current Month",
    start: new Date(),
    end: new Date(),
  })
  const [isRedirecting, setIsRedirecting] = useState(false)

  const {
    totals: currentTotals,
    grandTotal,
    fullGrandTotal,
    activePlans: currentActivePlans,
    perPlanTotals,
    fullPriceTotals,
    fullPricePerPlanTotals,
  } = useMemo(
    () => calculateTotalsForMonth(selectedMonth),
    [selectedMonth],
  )

  const handlePortalRedirect = async () => {
    setIsRedirecting(true)
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") || "" : ""
    try {
      const url = await fetchBillingPortal(token)
      window.location.href = url
    } catch (error) {
      showToast(
        "Failed to open billing portal",
        error instanceof Error ? error.message : "Unknown error",
        "error",
      )
      setIsRedirecting(false)
    }
  }

  const handleBillingClick = handlePortalRedirect

  const succeededInvoices = paymentHistory.filter((item) => item.status === "Succeeded")
  const invoicedAmount = succeededInvoices
    .filter(({ month }) => month.name === selectedMonth.name)
    .reduce((sum, { total }) => sum + total, 0)

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
      description: `${currentActivePlans.length} active plans (trials excluded).`,
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

  return (
    <PageScaffold sidebar={null}>
      <div className="space-y-12">
        <PageSection
          id="billing-cycle"
          title="Billing cycle"
          description="View charges and usage for this period."
          actions={
            <div className="flex items-center gap-4">
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
              <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex gap-2 rounded-full border-slate-200/80 text-xs font-semibold shadow-sm hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
                  onClick={handleBillingClick}
                >
                  <FiCreditCard className="h-3.5 w-3.5" />
                  Add Payment Method
                </Button>
            </div>
          }
        >
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
    
      </PageSection>

      {/* Payment Status */}
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
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <FiCreditCard className="h-6 w-6" />
              </div>
              <div className="text-center sm:text-left">
                <div className="font-medium text-slate-900 dark:text-slate-100">All caught up</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  No outstanding balance. Your next invoice will be issued on {months[months.length - 1].end.toLocaleDateString()}.
                </div>
              </div>
              <Button 
                variant="outline" 
                className="mt-4 sm:mt-0 sm:ml-auto rounded-full border-slate-200/80"
                onClick={handleBillingClick}
              >
                Manage Payment Methods
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Active Plans */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Active Plans
            </h3>
            <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
              <div className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                      <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                        <TableHead>Plan</TableHead>
                        <TableHead>Since</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Charged (USD)</TableHead>
                        <TableHead className="text-right">Full (USD)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentActivePlans.map((plan) => {
                        const charged = perPlanTotals[plan.name] ?? 0
                        const full = fullPricePerPlanTotals[plan.name] ?? 0
                        return (
                          <TableRow
                            key={plan.name}
                            className="border-slate-200/70 transition-colors hover:bg-slate-100/60 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                          >
                            <TableCell className="font-medium text-slate-900 dark:text-slate-50">
                              {plan.name}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                              {plan.activeSince}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={plan.isTrial ? "outline" : "success"}
                                className="rounded-full px-3 py-1 text-xs font-semibold"
                              >
                                {plan.isTrial ? "Trial" : "Active"}
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
                          Plans total
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
          {/* Plan Overview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Subscription
            </h3>
            <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
              <div className="flex flex-wrap items-center gap-4 border-b border-slate-200/70 p-6 dark:border-slate-700/60">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Growth Plan
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Pro Scraper + API
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
        </div>
      </div>

      {/* Payment History */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Payment History
        </h3>
        <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <div className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                  <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((record) => (
                    <TableRow key={record.invoiceId} className="border-slate-200/70 dark:border-slate-700/60">
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">
                        {record.paymentDate}
                      </TableCell>
                       <TableCell className="text-slate-600 dark:text-slate-400 font-mono text-xs">
                        {record.invoiceId}
                      </TableCell>
                       <TableCell className="text-slate-600 dark:text-slate-400">
                        {record.description}
                      </TableCell>
                      <TableCell>
                         <Badge
                            variant={record.status === "Succeeded" ? "success" : record.status === "Pending" ? "warning" : "destructive"}
                            className="rounded-full px-2 py-0.5 text-[0.65rem] uppercase tracking-wider"
                          >
                            {record.status}
                          </Badge>
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

      <div className="flex justify-end">
        <Button
          asChild
          variant="outline"
          className="gap-2 rounded-full border-slate-200/80 px-5 py-2 text-sm font-semibold shadow-sm hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
        >
          <RouterLink to="..">
            <FiArrowLeft className="h-4 w-4" />
            Back to tools
          </RouterLink>
        </Button>
      </div>
    </div>
    </PageScaffold>
  )
}

export const Route = createFileRoute('/_layout/web-scraping-tools/billing')({
  component: WebScrapingToolsBillingPage,
})

export default WebScrapingToolsBillingPage
