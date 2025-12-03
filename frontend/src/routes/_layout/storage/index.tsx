import { useMemo } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { FiArrowUpRight } from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { hostingServers } from "@/data/hosting"

const numberFormatter = new Intl.NumberFormat("en-US")
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function StorageIndexPage() {
  const storageSummary = useMemo(() => {
    return hostingServers.reduce(
      (acc, server) => {
        acc.totalBuckets += 1
        acc.totalStorage += server.storageSizeGB
        acc.monthlyPrice += server.monthlyComputePrice
        return acc
      },
      {
        totalBuckets: 0,
        totalStorage: 0,
        monthlyPrice: 0,
      },
    )
  }, [])

  return (
    <div className="space-y-10 py-10">
      <Card className="relative overflow-hidden rounded-[28px] border border-transparent text-slate-900 shadow-[0_34px_88px_-48px_rgba(15,23,42,0.62)] dark:text-slate-100">
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.52),_transparent_55%),_radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.52),_transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/80 via-white/55 to-white/35 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-slate-900/40" />
        <CardHeader className="relative space-y-4 rounded-[24px] bg-white/78 p-6 shadow-[0_22px_46px_-30px_rgba(15,23,42,0.42)] backdrop-blur dark:bg-slate-900/70">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-4 py-1 text-[0.65rem] uppercase tracking-[0.25em] text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/70">
            <span>Storage Services</span>
            <span
              className="h-1 w-1 rounded-full bg-slate-400"
              aria-hidden="true"
            />
            <span>Storage Fleet</span>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
              Managed Storage Buckets
            </CardTitle>
            <CardDescription>
              Administer your managed object storage buckets.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <Badge variant="outline">S3-Compatible</Badge>
            <Badge variant="outline">High Availability</Badge>
            <Badge variant="outline">24/7 Monitoring</Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-8">
        <Card className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Fleet intelligence
            </CardTitle>
            <CardDescription>
              Summaries of capacity, health, and monthly run rate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryTile
                label="Total buckets"
                value={numberFormatter.format(storageSummary.totalBuckets)}
                description="All buckets active"
              />
              <SummaryTile
                label="Total storage"
                value={`${numberFormatter.format(
                  storageSummary.totalStorage,
                )} GB`}
                description="Across all buckets"
              />
              <SummaryTile
                label="Monthly run rate"
                value={currencyFormatter.format(storageSummary.monthlyPrice)}
                description="Across all buckets"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              asChild
              variant="outline"
              className="gap-2 rounded-full border-slate-200/80 bg-white/60 px-5 py-2 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
            >
              <Link to="/storage/bucket">
                <span>New Bucket</span>
                <FiArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <CardHeader className="space-y-2 border-b border-slate-200/70 pb-6 dark:border-slate-700/60">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Storage Buckets
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Administer your managed object storage buckets.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                  <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hostingServers.map((server) => (
                    <TableRow
                      key={server.name}
                      className="border-slate-200/70 transition-colors hover:bg-slate-100/60 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                    >
                      <TableCell className="align-top font-medium text-slate-900 dark:text-slate-50">
                        {server.name}
                      </TableCell>
                      <TableCell>{server.status}</TableCell>
                      <TableCell>{server.storageSizeGB}GB</TableCell>
                      <TableCell>
                        {currencyFormatter.format(server.monthlyComputePrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-slate-300/80 px-3 py-1 text-xs font-semibold hover:border-slate-400"
                          asChild
                        >
                          <Link to="/storage/bucket">
                            Details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
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

export const Route = createFileRoute("/_layout/storage/")({
  component: StorageIndexPage,
})
