import { createFileRoute } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import SummaryMetric from "@/components/Common/SummaryMetric"

const mockDatabaseResources = [
  {
    id: "db-master",
    name: "Primary Database Server",
    type: "PostgreSQL 14",
    vcpu: 8,
    ram: "32GB",
    storage: "1TB SSD",
    price: 400,
  },
  {
    id: "db-replica",
    name: "Read Replica",
    type: "PostgreSQL 14",
    vcpu: 4,
    ram: "16GB",
    storage: "1TB SSD",
    price: 180,
  },
  {
    id: "db-backup",
    name: "Backup Storage",
    type: "Blob Storage",
    storage: "5TB",
    price: 60,
  },
]

function InstanceDetailsPage() {
  const totalCost = mockDatabaseResources.reduce(
    (acc, resource) => acc + resource.price,
    0,
  )
  const totalResources = mockDatabaseResources.length
  const primaryServer = mockDatabaseResources.find(
    (r) => r.id === "db-master",
  )

  const summaryMetrics = [
    {
      label: "Monthly cost",
      value: `$${totalCost.toFixed(2)}`,
      description: "Based on provisioned resources.",
    },
    {
      label: "Total resources",
      value: totalResources,
      description: "Includes primary, replica, and storage.",
    },
    {
      label: "Primary vCPU",
      value: primaryServer?.vcpu ?? "N/A",
      description: "Virtual CPU cores for the primary server.",
    },
    {
      label: "Primary RAM",
      value: primaryServer?.ram ?? "N/A",
      description: "Memory for the primary server.",
    },
  ]

  const costPoints = [60, 55, 70, 80, 75, 90, 95, 100]
  const costSparkPath = costPoints
    .map((point, index) => {
      const x = (index / (costPoints.length - 1)) * 180
      const y = 110 - point
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")

  const utilizationPoints = [40, 50, 45, 60, 70, 85, 80, 90]
  const utilizationSparkPath = utilizationPoints
    .map((point, index) => {
      const x = (index / (utilizationPoints.length - 1)) * 180
      const y = 110 - point
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")

  const uptimePoints = [100, 100, 99.9, 100, 99.8, 100, 100, 100]
  const uptimeSparkPath = uptimePoints
    .map((point, index) => {
      const x = (index / (uptimePoints.length - 1)) * 180
      const y = 110 - (point - 99) * 100
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")

  return (
    <div className="space-y-12">
      <div className="rounded-[32px] border border-slate-200/70 bg-white/85 px-6 py-8 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)]">
        <div className="space-y-4">
          <Badge className="rounded-full border border-indigo-200/70 bg-indigo-500/10 px-4 py-1 text-[0.65rem] uppercase tracking-[0.22em] text-indigo-700 dark:border-indigo-500/30 dark:text-indigo-100">
            Managed Database
          </Badge>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              PostgreSQL Instance
            </h1>
            <Badge variant="outline" className="rounded-full border-slate-200/70 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-600/60 dark:text-slate-300">
              High Availability Cluster
            </Badge>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Review your provisioned database resources, cost breakdown, and utilization metrics.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryMetrics.map((metric) => (
            <SummaryMetric
              key={metric.label}
              label={metric.label}
              value={metric.value.toString()}
              description={metric.description}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
              Total Cost
            </div>
            <div className="mt-2 text-2xl font-semibold">$550.00</div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              +5.6% vs last 30 days
            </p>
            <div className="mt-4">
              <svg viewBox="0 0 180 110" className="h-24 w-full">
                <path
                  d={`${costSparkPath} L 180 110 L 0 110 Z`}
                  fill="rgba(14,165,233,0.16)"
                  className="stroke-none"
                />
                <path
                  d={costSparkPath}
                  stroke="rgba(56,189,248,0.9)"
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <CardHeader>
            <CardTitle>Resource Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
              CPU Usage
            </div>
            <div className="mt-2 text-2xl font-semibold">78%</div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Avg utilization over last 24 hours
            </p>
            <div className="mt-4">
              <svg viewBox="0 0 180 110" className="h-24 w-full">
                <path
                  d={`${utilizationSparkPath} L 180 110 L 0 110 Z`}
                  fill="rgba(14,165,233,0.16)"
                  className="stroke-none"
                />
                <path
                  d={utilizationSparkPath}
                  stroke="rgba(56,189,248,0.9)"
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <CardHeader>
            <CardTitle>Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
              Last 7 days
            </div>
            <div className="mt-2 text-2xl font-semibold">99.98%</div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              SLA: 99.95%
            </p>
            <div className="mt-4">
              <svg viewBox="0 0 180 110" className="h-24 w-full">
                <path
                  d={`${uptimeSparkPath} L 180 110 L 0 110 Z`}
                  fill="rgba(14,165,233,0.16)"
                  className="stroke-none"
                />
                <path
                  d={uptimeSparkPath}
                  stroke="rgba(56,189,248,0.9)"
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <CardHeader>
            <CardTitle>Resource Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>vCPU</TableHead>
                  <TableHead>RAM</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDatabaseResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>{resource.name}</TableCell>
                    <TableCell>{resource.type}</TableCell>
                    <TableCell>{resource.vcpu ?? "N/A"}</TableCell>
                    <TableCell>{resource.ram ?? "N/A"}</TableCell>
                    <TableCell>{resource.storage}</TableCell>
                    <TableCell className="text-right">
                      ${resource.price.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export const Route = createFileRoute("/_layout/managed-database/instance")({
  component: InstanceDetailsPage,
})
