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
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="-ml-2 h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                asChild
              >
                <RouterLink to="/web-scraping-tools/https-api">
                  <FiArrowLeft className="h-4 w-4" />
                </RouterLink>
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
                Billing & Usage
              </h1>
            </div>
            <p className="ml-8 text-slate-500 dark:text-slate-400">
              Manage your scraping subscriptions, invoices, and payment methods.
            </p>
          </div>
          <div className="flex gap-3 ml-8 md:ml-0">
            <Button
              variant="outline"
              className="gap-2 border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              onClick={handlePortalRedirect}
              disabled={isRedirecting}
            >
              <FiCreditCard className="h-4 w-4" />
              <span>{isRedirecting ? "Loading..." : "Manage Payment Method"}</span>
            </Button>
            <Button className="gap-2 bg-indigo-600 shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg dark:bg-indigo-500 dark:hover:bg-indigo-400">
              <FiArrowUpRight className="h-4 w-4" />
              <span>Upgrade Plan</span>
            </Button>
          </div>
        </div>

        <PageSection
          id="current-cycle"
          title={`Usage in ${selectedMonth.name}`}
          description="Estimated cost based on your current plan usage and overages."
          actions={
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Month:</span>
              <select
                className="h-9 rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:text-slate-200"
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
          }
        >
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                    <TableRow className="border-slate-100 dark:border-slate-800">
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
                        <TableRow key={service.name} className="border-slate-100 dark:border-slate-800">
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
                  <TableFooter className="border-t border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/50">
                    <TableRow>
                      <TableCell colSpan={2} className="font-semibold text-slate-900 dark:text-slate-100">
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

            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Plan Breakdown
                </h3>
                <div className="space-y-3">
                  {Object.entries(perPlanTotals).map(([name, cost]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span className="truncate text-slate-600 dark:text-slate-300" title={name}>
                        {name}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
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
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow className="border-slate-100 dark:border-slate-800">
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((payment) => (
                  <TableRow key={payment.invoiceId} className="border-slate-100 dark:border-slate-800">
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
                        className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
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
        </PageSection>
      </div>
    </PageScaffold>
  )
}

export const Route = createFileRoute('/_layout/web-scraping-tools/billing')({
  component: WebScrapingToolsBillingPage,
})

export default WebScrapingToolsBillingPage
