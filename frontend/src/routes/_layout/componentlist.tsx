import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
// Replaced Tremor charts with lightweight placeholders to avoid extra dependency
import { DollarSign, ExternalLink, Globe, HardDrive, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// Use native select instead of missing UI select component
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PageScaffold, { PageSection } from "@/components/Common/PageLayout"

const usageData = [
  { date: "2023-01-03", "Avg. response time": 320, "Total requests": 2100 },
  { date: "2023-01-04", "Avg. response time": 280, "Total requests": 2500 },
  { date: "2023-01-05", "Avg. response time": 310, "Total requests": 2300 },
  { date: "2023-01-06", "Avg. response time": 290, "Total requests": 2400 },
  { date: "2023-01-07", "Avg. response time": 300, "Total requests": 2200 },
  { date: "2023-01-08", "Avg. response time": 310, "Total requests": 2500 },
  { date: "2023-01-09", "Avg. response time": 330, "Total requests": 2600 },
  { date: "2023-01-10", "Avg. response time": 290, "Total requests": 2300 },
]

const chartData = [
  {
    date: "Jan 23",
    "New York": 2890,
    "London": 2338,
  },
  {
    date: "Feb 23",
    "New York": 2756,
    "London": 2103,
  },
  {
    date: "Mar 23",
    "New York": 3322,
    "London": 2194,
  },
  {
    date: "Apr 23",
    "New York": 3470,
    "London": 2108,
  },
  {
    date: "May 23",
    "New York": 3475,
    "London": 1812,
  },
  {
    date: "Jun 23",
    "New York": 3129,
    "London": 1726,
  },
  {
    date: "Jul 23",
    "New York": 3490,
    "London": 1982,
  },
  {
    date: "Aug 23",
    "New York": 2903,
    "London": 2012,
  },
  {
    date: "Sep 23",
    "New York": 2643,
    "London": 2342,
  },
  {
    date: "Oct 23",
    "New York": 2837,
    "London": 2473,
  },
  {
    date: "Nov 23",
    "New York": 2954,
    "London": 3848,
  },
  {
    date: "Dec 23",
    "New York": 3239,
    "London": 3736,
  },
]

function valueFormatter(value: number) {
  return new Intl.NumberFormat("us").format(value).toString()
}

const WorkspacePulsePage = () => {
  const [checkboxChecked, setCheckboxChecked] = useState(true)
  const [selectedEnvironment, setSelectedEnvironment] = useState("production")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <PageScaffold className="py-8" sidebar={null}>
      <div className="space-y-6">
        <div className="mx-auto w-full max-w-4xl space-y-4 text-center">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Workspace</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Subscriptions, average usage, and quick billing actions.
          </p>
        </div>
        <Tabs defaultValue="tools" className="w-full">
          <TabsList>
            <TabsTrigger value="tools">Tool directory</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="tools">
            <PageSection
              id="tool-directory"
              title="Tool directory"
              description="A visual sweep of available tools and services for your workspace."
            >
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
                  <div className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold leading-none tracking-tight">Data pipeline</h3>
                        <p className="text-xs text-muted-foreground mt-1">ETL & reverse-ETL</p>
                      </div>
                      <Zap className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <Button size="sm" variant="outline" className="rounded-full px-4">
                      Configure
                    </Button>
                  </div>
                </div>
                <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
                  <div className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold leading-none tracking-tight">Geoproxy</h3>
                        <p className="text-xs text-muted-foreground mt-1">Proxy & scraper</p>
                      </div>
                      <Globe className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <Button size="sm" variant="outline" className="rounded-full px-4">
                      Manage
                    </Button>
                  </div>
                </div>
                <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
                  <div className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold leading-none tracking-tight">Storage</h3>
                        <p className="text-xs text-muted-foreground mt-1">Object & file</p>
                      </div>
                      <HardDrive className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <Button size="sm" variant="outline" className="rounded-full px-4">
                      Connect
                    </Button>
                  </div>
                </div>
              </div>
            </PageSection>
          </TabsContent>
          <TabsContent value="analytics">
            <PageSection
              id="infrastructure"
              title="Infrastructure"
              description="A high-level overview of your workspace's infrastructure."
            >
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-2">
                  <div className="px-1">
                    <h3 className="font-medium">Regional usage</h3>
                    <p className="text-xs text-muted-foreground">A breakdown of usage by region.</p>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
                    <div className="flex items-center justify-end mb-4">
                      <label htmlFor="metric-select" className="sr-only">Select metric</label>
                      <select id="metric-select" defaultValue="requests" className="w-48 rounded-full border px-3 py-1 text-sm bg-transparent">
                        <option value="requests">Requests</option>
                        <option value="latency">Latency</option>
                        <option value="errors">Errors</option>
                      </select>
                    </div>
                    <div className="h-48 w-full flex items-center justify-center text-sm text-slate-500">
                      <div className="text-center">Bar chart placeholder (install @tremor/react for full charts)</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="px-1">
                    <h3 className="font-medium">Service status</h3>
                    <p className="text-xs text-muted-foreground">The current status of your workspace's services.</p>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-emerald-500" />
                          <p>Data pipeline</p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Operational</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-emerald-500" />
                          <p>Geoproxy</p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Operational</p>
                      </div>
                      <div className="flex items-center justify--between">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-amber-500" />
                          <p>Storage</p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Degraded performance</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </PageSection>
            <div className="grid gap-6 xl:grid-cols-5 mt-6">
              <div className="xl:col-span-3 space-y-2">
                <div className="px-1">
                  <h3 className="font-medium">Usage overview</h3>
                  <p className="text-xs text-muted-foreground">A snapshot of your workspace's usage patterns over time.</p>
                </div>
                <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
                  <div className="h-72 w-full flex items-center justify-center text-sm text-slate-500">
                    <div className="text-center">Area chart placeholder (install @tremor/react for full charts)</div>
                  </div>
                </div>
              </div>
              <div className="xl:col-span-2 space-y-2">
                 <div className="px-1 invisible">
                  <h3 className="font-medium">Stats</h3>
                  <p className="text-xs text-muted-foreground">Hidden spacer</p>
                </div>
                <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80 h-[calc(100%-3rem)]">
                  <div className="grid gap-4">
                    <div className="flex items-center gap-4 rounded-lg bg-slate-100/60 p-4 dark:bg-slate-800/60">
                      <div className="flex aspect-square h-12 w-12 items-center justify-center rounded-lg bg-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold">Data pipeline</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">2.4M requests</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-lg bg-slate-100/60 p-4 dark:bg-slate-800/60">
                      <div className="flex aspect-square h-12 w-12 items-center justify-center rounded-lg bg-sky-200 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                        <Globe className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold">Geoproxy</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">1.9M requests</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <PageSection
          id="billing"
          title="Billing"
          description="Manage your subscription, view invoices, and update payment details."
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-2">
              <div className="px-1">
                <h3 className="font-medium">Current plan</h3>
                <p className="text-xs text-muted-foreground">You are currently on the Team plan.</p>
              </div>
              <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
                <div className="space-y-4">
                  <div className="rounded-lg bg-slate-100/60 p-6 dark:bg-slate-800/60">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">$1,250</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">/ month</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Your next invoice is on December 1, 2025.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button className="rounded-full px-4">Upgrade plan</Button>
                    <Button variant="outline" className="rounded-full px-4">
                      Update payment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="px-1">
                <h3 className="font-medium">Recent invoices</h3>
                <p className="text-xs text-muted-foreground">A record of your recent payments and charges.</p>
              </div>
              <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="sr-only">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Nov 1, 2025</TableCell>
                      <TableCell>$1,250.00</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">Paid</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <a href="#">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Oct 1, 2025</TableCell>
                      <TableCell>$1,250.00</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">Paid</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <a href="#">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Sep 1, 2025</TableCell>
                      <TableCell>$1,250.00</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">Paid</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <a href="#">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </PageSection>
        <PageSection id="links" title="Links" description="A collection of useful links for your workspace.">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Documentation</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Read the docs, and get started with our API.
                </p>
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold leading-none tracking-tight">API playground</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Explore the API and make requests in real-time.
                </p>
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Support</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Get in touch with our team for help.
                </p>
              </div>
            </div>
          </div>
        </PageSection>
      </div>
    </PageScaffold>
  )
}

export const Route = createFileRoute("/_layout/componentlist")({ component: WorkspacePulsePage })

export default WorkspacePulsePage
