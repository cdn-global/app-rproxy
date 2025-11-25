import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { AreaChart, BarChart } from "@tremor/react"
import { DollarSign, ExternalLink, Globe, HardDrive, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Workspace pulse</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Subscriptions, average usage, and quick billing actions.
          </p>
        </div>
        <PageSection
          id="tool-directory"
          title="Tool directory"
          description="A visual sweep of available tools and services for your workspace."
        >
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Card className="rounded-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Data pipeline</CardTitle>
                    <CardDescription className="text-xs">ETL & reverse-ETL</CardDescription>
                  </div>
                  <Zap className="h-5 w-5 text-slate-400" />
                </div>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="outline" className="rounded-full px-4">
                  Configure
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Geoproxy</CardTitle>
                    <CardDescription className="text-xs">Proxy & scraper</CardDescription>
                  </div>
                  <Globe className="h-5 w-5 text-slate-400" />
                </div>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="outline" className="rounded-full px-4">
                  Manage
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Storage</CardTitle>
                    <CardDescription className="text-xs">Object & file</CardDescription>
                  </div>
                  <HardDrive className="h-5 w-5 text-slate-400" />
                </div>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="outline" className="rounded-full px-4">
                  Connect
                </Button>
              </CardContent>
            </Card>
          </div>
        </PageSection>
        <PageSection
          id="infrastructure"
          title="Infrastructure"
          description="A high-level overview of your workspace's infrastructure."
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader className="flex-row items-start justify-between">
                <div>
                  <CardTitle>Regional usage</CardTitle>
                  <CardDescription>A breakdown of usage by region.</CardDescription>
                </div>
                <Select defaultValue="requests">
                  <SelectTrigger className="w-48 rounded-full">
                    <SelectValue placeholder="Select a metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requests">Requests</SelectItem>
                    <SelectItem value="latency">Latency</SelectItem>
                    <SelectItem value="errors">Errors</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={chartData}
                  index="date"
                  categories={["New York", "London"]}
                  colors={["blue", "cyan"]}
                  valueFormatter={valueFormatter}
                  yAxisWidth={48}
                />
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Service status</CardTitle>
                <CardDescription>The current status of your workspace's services.</CardDescription>
              </CardHeader>
              <CardContent>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-amber-500" />
                      <p>Storage</p>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Degraded performance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </PageSection>
        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Usage overview</CardTitle>
                <CardDescription>A snapshot of your workspace's usage patterns over time.</CardDescription>
              </CardHeader>
              <CardContent>
                <AreaChart
                  className="h-72"
                  data={usageData}
                  index="date"
                  categories={["Total requests", "Avg. response time"]}
                  colors={["blue", "cyan"]}
                  yAxisWidth={60}
                />
              </CardContent>
            </Card>
          </div>
          <div className="xl:col-span-2">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Usage insights</CardTitle>
                <CardDescription>A per-service breakdown of your workspace's usage.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
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
              </CardContent>
            </Card>
          </div>
        </div>
        <PageSection
          id="billing"
          title="Billing"
          description="Manage your subscription, view invoices, and update payment details."
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Current plan</CardTitle>
                <CardDescription>You are currently on the Team plan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Recent invoices</CardTitle>
                <CardDescription>A record of your recent payments and charges.</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        </PageSection>
        <PageSection id="links" title="Links" description="A collection of useful links for your workspace.">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Read the docs, and get started with our API.
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">API playground</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Explore the API and make requests in real-time.
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Get in touch with our team for help.
                </p>
              </CardContent>
            </Card>
          </div>
        </PageSection>
      </div>
    </PageScaffold>
  )
}

export const Route = createFileRoute("/_layout/componentlist")({ component: WorkspacePulsePage })

export default WorkspacePulsePage
