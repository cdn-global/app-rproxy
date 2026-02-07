import { useMemo } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { FiArrowUpRight } from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import PageScaffold, { PageSection } from "../../../components/Common/PageLayout"

const numberFormatter = new Intl.NumberFormat("en-US")
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

interface DatabaseInstance {
  id: string
  user_id: string
  instance_name: string
  postgres_version: string
  storage_gb: number
  cpu_cores: number
  memory_gb: number
  status: string
  monthly_rate: number
  storage_rate_per_gb: number
  created_at: string
}

function ManagedDatabaseIndexPage() {
  const { data, isLoading } = useQuery<{ data: DatabaseInstance[]; count: number }>({
    queryKey: ["database-instances"],
    queryFn: async () => {
      const response = await fetch("/api/v2/database-instances/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch database instances")
      return response.json()
    },
  })

  const instances = data?.data ?? []

  const databaseSummary = useMemo(() => {
    return instances.reduce(
      (acc, db) => {
        acc.totalDatabases += 1
        acc.totalVCPUs += db.cpu_cores
        acc.totalRAM += db.memory_gb
        acc.totalStorage += db.storage_gb
        acc.monthlyPrice += db.monthly_rate + db.storage_gb * db.storage_rate_per_gb
        return acc
      },
      {
        totalDatabases: 0,
        totalVCPUs: 0,
        totalRAM: 0,
        totalStorage: 0,
        monthlyPrice: 0,
      },
    )
  }, [instances])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      running: "default",
      stopped: "secondary",
      provisioning: "outline",
      error: "destructive",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  return (
    <PageScaffold sidebar={null}>
    <div className="space-y-10">
      <div className="space-y-8">
        <PageSection
          id="fleet"
          title="Fleet intelligence"
          description="Summaries of capacity, health, and monthly run rate."
          actions={
            <Button
              asChild
              variant="outline"
              className="gap-2 rounded-full border-slate-200/80 bg-white/60 px-5 py-2 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
            >
              <Link to="/managed-database/instance">
                <span>New Database</span>
                <FiArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryTile
                label="Total databases"
                value={numberFormatter.format(databaseSummary.totalDatabases)}
                description="All databases active"
              />
              <SummaryTile
                label="Avg vCPUs"
                value={
                  databaseSummary.totalDatabases > 0
                    ? numberFormatter.format(databaseSummary.totalVCPUs / databaseSummary.totalDatabases)
                    : "0"
                }
                description="Across all databases"
              />
              <SummaryTile
                label="Avg RAM"
                value={
                  databaseSummary.totalDatabases > 0
                    ? `${numberFormatter.format(databaseSummary.totalRAM / databaseSummary.totalDatabases)} GB`
                    : "0 GB"
                }
                description="Across all databases"
              />
              <SummaryTile
                label="Monthly run rate"
                value={currencyFormatter.format(databaseSummary.monthlyPrice)}
                description="Across all databases"
              />
            </div>
        </PageSection>

        <PageSection
          id="instances"
          title="Database Instances"
          description="Administer your managed relational databases."
        >
        <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <div className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                  <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>PostgreSQL</TableHead>
                    <TableHead>vCPUs</TableHead>
                    <TableHead>RAM</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : instances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No database instances. Create your first one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    instances.map((db) => (
                      <TableRow
                        key={db.id}
                        className="border-slate-200/70 transition-colors hover:bg-slate-100/60 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                      >
                        <TableCell className="align-top font-medium text-slate-900 dark:text-slate-50">
                          {db.instance_name}
                        </TableCell>
                        <TableCell>{getStatusBadge(db.status)}</TableCell>
                        <TableCell>v{db.postgres_version}</TableCell>
                        <TableCell>{db.cpu_cores}</TableCell>
                        <TableCell>{db.memory_gb} GB</TableCell>
                        <TableCell>{db.storage_gb} GB</TableCell>
                        <TableCell>
                          {currencyFormatter.format(db.monthly_rate + db.storage_gb * db.storage_rate_per_gb)}/mo
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full border-slate-300/80 px-3 py-1 text-xs font-semibold hover:border-slate-400"
                            asChild
                          >
                            <Link to="/managed-database/instance">
                              Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        </PageSection>
      </div>
            <div className="mt-10 border-t border-slate-200/60 pt-10 dark:border-slate-800">
              <div className="mb-6 space-y-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Jump to
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Quick links to page sections.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Link
                  to="/"
                  className="group flex flex-col justify-between space-y-2 rounded-xl border border-slate-200/60 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Workspace
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Subscriptions, average usage, and quick billing actions.
                    </div>
                  </div>
                </Link>

                <a
                  href="#analytics"
                  className="group flex flex-col justify-between space-y-2 rounded-xl border border-slate-200/60 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Usage insights
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Traffic, spend, and throughput metrics.
                    </div>
                  </div>
                </a>

                <Link
                  to="/"
                  className="group flex flex-col justify-between space-y-2 rounded-xl border border-slate-200/60 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Tool directory
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Explore every workspace module in one place.
                    </div>
                  </div>
                </Link>
              </div>
            </div>
    </div>
    </PageScaffold>
  )
}

const SummaryTile = ({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) => (
  <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-[0_18px_40px_-35px_rgba(15,23,42,0.45)] dark:border-slate-700/60 dark:bg-slate-900/60">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
      {label}
    </p>
    <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
      {value}
    </p>
    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
      {description}
    </p>
  </div>
)

export const Route = createFileRoute("/_layout/managed-database/")({
  component: ManagedDatabaseIndexPage,
})
