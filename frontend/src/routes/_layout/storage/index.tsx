import { useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
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
import { useStorageBuckets, useStorageUsageSummary, useDeleteBucket } from "@/hooks/useStorageAPI"
import useCustomToast from "@/hooks/useCustomToast"

const numberFormatter = new Intl.NumberFormat("en-US")
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function StorageIndexPage() {
  const showToast = useCustomToast()
  const queryClient = useQueryClient()
  const [seeding, setSeeding] = useState(false)

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  })

  const { data: bucketsData, isLoading: bucketsLoading } = useStorageBuckets({
    onSuccessCallback: async (result: { data: unknown[]; count: number }) => {
      if (result.count === 0 && !seeding) {
        setSeeding(true)
        try {
          const seedResp = await fetch("/v2/storage/seed", {
            method: "POST",
            headers: authHeaders(),
          })
          if (seedResp.ok) {
            const seedData = await seedResp.json()
            if (seedData.created > 0) {
              queryClient.invalidateQueries({ queryKey: ["storage-buckets"] })
              queryClient.invalidateQueries({ queryKey: ["storage-usage-summary"] })
            }
          }
        } catch {
          // Seed failed silently
        } finally {
          setSeeding(false)
        }
      }
    },
  })
  const { data: usageSummary, isLoading: summaryLoading } = useStorageUsageSummary()
  const deleteBucket = useDeleteBucket()

  const buckets = bucketsData?.data ?? []
  const summary = usageSummary ?? {
    total_buckets: 0,
    total_storage_gb: 0,
    total_objects: 0,
    monthly_cost: 0,
  }

  if (bucketsLoading || summaryLoading || seeding) {
    return (
      <PageScaffold sidebar={null}>
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-500">
            {seeding ? "Setting up your file store..." : "Loading storage data..."}
          </div>
        </div>
      </PageScaffold>
    )
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
              <Link to="/storage/bucket">
                <span>New Bucket</span>
                <FiArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryTile
                label="Total buckets"
                value={numberFormatter.format(summary.total_buckets)}
                description="All buckets active"
              />
              <SummaryTile
                label="Total storage"
                value={`${summary.total_storage_gb.toFixed(2)} GB`}
                description="Across all buckets"
              />
              <SummaryTile
                label="Total objects"
                value={numberFormatter.format(summary.total_objects)}
                description="Files stored"
              />
              <SummaryTile
                label="Monthly run rate"
                value={currencyFormatter.format(summary.monthly_cost)}
                description="Across all buckets"
              />
            </div>
        </PageSection>

        <PageSection
          id="buckets"
          title="Storage Buckets"
          description="S3-compatible object storage provisioned via AWS."
        >
        <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <div className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                  <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                    <TableHead>Name</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Backend</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Objects</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buckets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                        No storage buckets yet. Create your first bucket to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    buckets.map((bucket) => (
                      <TableRow
                        key={bucket.id}
                        className="border-slate-200/70 transition-colors hover:bg-slate-100/60 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                      >
                        <TableCell className="align-top font-medium text-slate-900 dark:text-slate-50">
                          {bucket.bucket_name}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                          {bucket.region}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">
                            {bucket.storage_backend}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={bucket.status === "active" ? "default" : bucket.status === "error" ? "destructive" : "outline"}
                            className="capitalize"
                          >
                            {bucket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{bucket.storage_gb_used.toFixed(2)} GB</TableCell>
                        <TableCell>{numberFormatter.format(bucket.object_count)}</TableCell>
                        <TableCell>
                          {currencyFormatter.format(bucket.storage_gb_used * bucket.monthly_rate_per_gb)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full border-slate-300/80 px-3 py-1 text-xs font-semibold hover:border-slate-400"
                              asChild
                            >
                              <Link to="/storage/bucket" search={{ bucketId: bucket.id }}>
                                Details
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                              onClick={() => {
                                if (confirm(`Delete bucket "${bucket.bucket_name}"?`)) {
                                  deleteBucket.mutate(bucket.id, {
                                    onSuccess: () => showToast("Success", "Bucket deleted.", "success"),
                                    onError: (err: Error) => showToast("Error", err.message, "error"),
                                  })
                                }
                              }}
                              disabled={deleteBucket.isPending}
                            >
                              Delete
                            </Button>
                          </div>
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

                <Link
                  to="/hosting"
                  className="group flex flex-col justify-between space-y-2 rounded-xl border border-slate-200/60 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Hosting
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Manage servers and compute infrastructure.
                    </div>
                  </div>
                </Link>

                <Link
                  to="/settings"
                  className="group flex flex-col justify-between space-y-2 rounded-xl border border-slate-200/60 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Settings
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Configure storage defaults and API keys.
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

export const Route = createFileRoute("/_layout/storage/")({
  component: StorageIndexPage,
})
