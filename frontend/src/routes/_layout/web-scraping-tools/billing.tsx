import { useCallback, useMemo, useState } from "react"
import { Link as RouterLink, createFileRoute } from "@tanstack/react-router"
import { FiArrowLeft, FiArrowUpRight, FiCreditCard, FiExternalLink } from "react-icons/fi"

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

  const grandTotal = Object.values(totals).reduce((sum, { total }) => sum + total, 0)

  return {
    totals,
    grandTotal,
    activePlans,
    perPlanTotals,
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
  const [selectedMonth, setSelectedMonth] = useState<Month>(months[months.length - 1])
  const [isRedirecting, setIsRedirecting] = useState(false)

  const { totals, grandTotal, activePlans, perPlanTotals } = useMemo(
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

  return (
    <PageScaffold sidebar={null}>
      <div className="space-y-12">
        <PageSection
          id="billing-cycle"
          title={`${selectedMonth.name} Billing cycle`}
          description="Review usage-based charges, subscription run rate, and settlement history."
          actions={
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/50 px-3 py-1 text-sm dark:border-slate-700/60 dark:bg-slate-900/50">
                <span className="text-slate-500 dark:text-slate-400">View:</span>
                <select
                  className="bg-transparent font-medium text-slate-900 focus:outline-none dark:text-slate-100"
                  value={selectedMonth.name}
                  onChange={(e) => {
                    const month = months.find((m) => m.name === e.target.value)
                    if (month) setSelectedMonth(month)
                  }}
                >
                  {months.map((m) => (
                    <option key={m.name} value={m.name} className="dark:bg-slate-800">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="outline"
                className="gap-2 rounded-full border-slate-200/80 bg-white/60 px-4 py-1.5 text-xs font-semibold shadow-sm hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60"
                onClick={handlePortalRedirect}
                disabled={isRedirecting}
              >
                <FiCreditCard className="h-3.5 w-3.5" />
                <span>Payment Method</span>
              </Button>
            </div>
          }
        >
          <div className="rounded-[32px] border border-slate-200/70 bg-white/85 px-6 py-8 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)]">
            <div className="space-y-4">
              <Badge className="rounded-full border border-indigo-200/70 bg-indigo-500/10 px-4 py-1 text-[0.65rem] uppercase tracking-[0.22em] text-indigo-700 dark:border-indigo-500/30 dark:text-indigo-100">
                Web Scraping Billing
              </Badge>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {selectedMonth.name}
                  </h1>
                   <Badge variant="outline" className="rounded-full border-slate-200/70 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-600/60 dark:text-slate-300">
                      Growth Plan + Add-ons
                   </Badge>
                </div>
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
               <SummaryMetric
                 label="Total Cost"
                 value={currencyFormatter.format(grandTotal)}
                 description={`${activePlans.length} active plans/tools`}
               />
               <SummaryMetric
                 label="Plans Active"
                 value={activePlans.length.toString()}
                 description="Includes trials"
               />
               <SummaryMetric
                  label="Invoices"
                  value={paymentHistory.filter(p => p.month.name === selectedMonth.name).length.toString()}
                  description="For this month"
               />
               <SummaryMetric
                  label="Last Payment"
                  value={paymentHistory[0]?.paymentDate || "N/A"}
                  description="Most recent transaction"
               />
            </div>
          </div>
        </PageSection>

        <PageSection
          id="usage-breakdown"
          title="Usage Breakdown"
          description="Detailed view of your scraping usage costs and plan distribution."
        >
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                    <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                      <TableHead className="w-[50%]">Service Item</TableHead>
                      <TableHead>Units / Plans</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => {
                      const { total, count } = totals[service.name]
                      if (total === 0 && count === 0) return null

                      return (
                        <TableRow key={service.name} className="border-slate-200/70 transition-colors hover:bg-slate-100/60 dark:border-slate-700/60 dark:hover:bg-slate-800/50">
                          <TableCell className="font-medium text-slate-700 dark:text-slate-200">
                            {service.name}
                          </TableCell>
                          <TableCell className="text-slate-500 dark:text-slate-400">
                            {count} {count === 1 ? "plan" : "plans"}
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-900 dark:text-slate-100">
                            {currencyFormatter.format(total)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Total estimated cost
                      </TableCell>
                      <TableCell className="text-right text-lg font-bold text-slate-900 dark:text-slate-50">
                        {currencyFormatter.format(grandTotal)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/80 p-6 shadow-inner backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/40">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Plan Breakdown
                </h3>
                <div className="space-y-3">
                  {Object.entries(perPlanTotals).map(([name, cost]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium text-slate-600 dark:text-slate-300" title={name}>
                        {name}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {currencyFormatter.format(cost)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </PageSection>

        <PageSection
          id="invoices"
          title="Payment history"
          description="Download past invoices and view transaction status."
        >
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((payment) => (
                  <TableRow key={payment.invoiceId} className="border-slate-200/70 transition-colors hover:bg-slate-100/60 dark:border-slate-700/60 dark:hover:bg-slate-800/50">
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {payment.paymentDate}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-200">
                      {payment.description}
                      <div className="text-xs font-normal text-slate-500 dark:text-slate-500">
                        {payment.paymentMethod}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {currencyFormatter.format(payment.total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.status === "Succeeded"
                            ? "success"
                            : payment.status === "Pending"
                              ? "outline"
                              : "destructive"
                        }
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-full p-0 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                        asChild
                      >
                        <a
                          href="#"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View invoice ${payment.invoiceId}`}
                        >
                          <FiExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        </PageSection>
      </div>
    </PageScaffold>
  )
}

export const Route = createFileRoute('/_layout/web-scraping-tools/billing')({
  component: WebScrapingToolsBillingPage,
})

export default WebScrapingToolsBillingPage
