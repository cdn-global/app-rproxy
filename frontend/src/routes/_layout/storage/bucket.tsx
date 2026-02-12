import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import PageScaffold, { PageSection } from "../../../components/Common/PageLayout"
import {
  useBucketDetail,
  useBucketObjects,
  useStorageBuckets,
  type StorageBucket,
} from "@/hooks/useStorageAPI"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function BucketDetailsPage() {
  const { bucketId } = Route.useSearch()
  const [queryPrefix, setQueryPrefix] = useState("")

  // If bucketId is provided, fetch that bucket directly; otherwise show first bucket
  const { data: singleBucket, isLoading: singleLoading } = useBucketDetail(bucketId)
  const { data: bucketsData, isLoading: bucketsLoading } = useStorageBuckets()

  const bucket: StorageBucket | undefined = bucketId
    ? singleBucket
    : bucketsData?.data?.[0]

  const { data: objectsData, isLoading: objectsLoading } = useBucketObjects(bucket?.id)
  const objects = objectsData?.data ?? []

  const filteredObjects = queryPrefix
    ? objects.filter((o) => o.object_key.toLowerCase().includes(queryPrefix.toLowerCase()))
    : objects

  const isLoading = singleLoading || bucketsLoading

  if (isLoading) {
    return (
      <PageScaffold sidebar={null}>
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-500">Loading bucket details...</div>
        </div>
      </PageScaffold>
    )
  }

  if (!bucket) {
    return (
      <PageScaffold sidebar={null}>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-slate-500">No bucket found.</div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/storage">Back to Storage</Link>
          </Button>
        </div>
      </PageScaffold>
    )
  }

  const monthlyCost = bucket.storage_gb_used * bucket.monthly_rate_per_gb

  return (
    <PageScaffold sidebar={null}>
      <div className="space-y-10">
        <PageSection
          id="overview"
          title={bucket.bucket_name}
          description="Bucket overview, credentials, and object listing."
          actions={
            <Button asChild variant="outline" className="rounded-full px-5 text-sm font-semibold">
              <Link to="/storage">Back to Storage</Link>
            </Button>
          }
        >
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
            <div className="space-y-4 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full border border-indigo-200/70 bg-indigo-500/10 px-4 py-1 text-[0.65rem] uppercase tracking-[0.22em] text-indigo-700 dark:border-indigo-500/30 dark:text-indigo-100">
                  {bucket.storage_backend}
                </Badge>
                <Badge
                  variant={bucket.status === "active" ? "default" : "outline"}
                  className="rounded-full capitalize"
                >
                  {bucket.status}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full border-slate-200/70 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-600/60 dark:text-slate-300"
                >
                  {bucket.region}
                </Badge>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 p-6 pt-0">
              <SummaryTile
                label="Storage used"
                value={`${bucket.storage_gb_used.toFixed(2)} GB`}
                description={`${bucket.object_count} objects stored`}
              />
              <SummaryTile
                label="Monthly cost"
                value={currencyFormatter.format(monthlyCost)}
                description={`$${bucket.monthly_rate_per_gb}/GB rate`}
              />
              <SummaryTile
                label="Storage class"
                value={bucket.storage_class}
                description="Current storage tier"
              />
              <SummaryTile
                label="Created"
                value={new Date(bucket.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                description="Bucket creation date"
              />
            </div>
          </div>
        </PageSection>

        {/* Connection info */}
        <PageSection
          id="settings"
          title="User Settings"
          description="Connection details and bucket configuration."
        >
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Bucket Name
                </Label>
                <Input readOnly value={bucket.bucket_name} className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Region
                </Label>
                <Input readOnly value={bucket.region} className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Endpoint URL
                </Label>
                <Input
                  readOnly
                  value={bucket.endpoint_url || "Managed by AWS"}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Backend
                </Label>
                <Input readOnly value={bucket.storage_backend} className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Storage Class
                </Label>
                <Input readOnly value={bucket.storage_class} className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Rate per GB
                </Label>
                <Input
                  readOnly
                  value={`$${bucket.monthly_rate_per_gb}/GB/month`}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </PageSection>

        {/* Query Sandbox */}
        <PageSection
          id="query-sandbox"
          title="Query Sandbox"
          description="Search and filter objects in this bucket by key prefix."
        >
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
            <div className="space-y-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="query-prefix" className="text-sm font-medium">
                    Object key filter
                  </Label>
                  <Input
                    id="query-prefix"
                    placeholder="e.g. images/ or report-2026"
                    value={queryPrefix}
                    onChange={(e) => setQueryPrefix(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  className="rounded-full px-5"
                  onClick={() => setQueryPrefix("")}
                >
                  Clear
                </Button>
              </div>

              <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-700/40 dark:bg-slate-800/30">
                <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
                  <span className="text-slate-400">$</span> aws s3 ls s3://{bucket.bucket_name}/{queryPrefix && `--prefix "${queryPrefix}"`}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {filteredObjects.length} object{filteredObjects.length !== 1 ? "s" : ""} matched
                  {queryPrefix && ` for "${queryPrefix}"`}
                </p>
              </div>
            </div>
          </div>
        </PageSection>

        {/* Object listing */}
        <PageSection
          id="objects"
          title="Objects"
          description={`${bucket.object_count} objects in this bucket.`}
        >
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
            <div className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                    <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                      <TableHead>Key</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Last Modified</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {objectsLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                          Loading objects...
                        </TableCell>
                      </TableRow>
                    ) : filteredObjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                          {queryPrefix
                            ? `No objects matching "${queryPrefix}".`
                            : "No objects in this bucket yet."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredObjects.map((obj) => (
                        <TableRow
                          key={obj.id}
                          className="border-slate-200/70 transition-colors hover:bg-slate-100/60 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                        >
                          <TableCell className="font-mono text-sm text-slate-900 dark:text-slate-50">
                            {obj.object_key}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                            {formatBytes(obj.size_bytes)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                            {obj.content_type || "-"}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(obj.last_modified).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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
    <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
  </div>
)

export const Route = createFileRoute("/_layout/storage/bucket")({
  component: BucketDetailsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    bucketId: (search.bucketId as string) || undefined,
  }),
})
