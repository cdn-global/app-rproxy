import { Link } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useStorageBuckets, useStorageUsageSummary } from "@/hooks/useStorageAPI"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const FileStoreSettings = () => {
  const { data: bucketsData, isLoading: bucketsLoading } = useStorageBuckets()
  const { data: usageSummary, isLoading: summaryLoading } = useStorageUsageSummary()

  const buckets = bucketsData?.data ?? []

  if (bucketsLoading || summaryLoading) {
    return (
      <div className="rounded-[28px] border border-slate-200/70 bg-white/80 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.65)]">
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/80 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.65)]">
      <div className="space-y-2 border-b border-slate-200/70 p-6 dark:border-slate-700/60">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          File Store
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          S3-compatible object storage provisioned via AWS. Manage your buckets and monitor usage.
        </p>
      </div>
      <div className="p-6 space-y-6">
        {buckets.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500 mb-4">
              No storage buckets configured. Visit the storage page to get started.
            </p>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/storage">Go to File Store</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-700/40 dark:bg-slate-800/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Buckets
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {buckets.length}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-700/40 dark:bg-slate-800/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Storage
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {(usageSummary?.total_storage_gb ?? 0).toFixed(2)} GB
                </p>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-700/40 dark:bg-slate-800/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Monthly Cost
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {currencyFormatter.format(usageSummary?.monthly_cost ?? 0)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {buckets.map((bucket) => (
                <div
                  key={bucket.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white/60 p-4 dark:border-slate-700/40 dark:bg-slate-800/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
                        {bucket.bucket_name}
                      </span>
                      <Badge
                        variant={bucket.status === "active" ? "default" : "outline"}
                        className="capitalize text-[0.6rem]"
                      >
                        {bucket.status}
                      </Badge>
                      <Badge variant="outline" className="text-[0.6rem]">
                        {bucket.storage_backend}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {bucket.region} &middot; {bucket.storage_gb_used.toFixed(2)} GB &middot;{" "}
                      {bucket.object_count} objects
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
                    <Link to="/storage/bucket" search={{ bucketId: bucket.id }}>
                      Manage
                    </Link>
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/storage">View All Storage</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default FileStoreSettings
