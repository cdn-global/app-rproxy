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

const mockStorageResources = [
  {
    id: "storage-main",
    name: "Main Storage Bucket",
    type: "S3 Standard",
    storage: "2TB",
    price: 50,
  },
  {
    id: "storage-backup",
    name: "Backup Storage Bucket",
    type: "Glacier Deep Archive",
    storage: "10TB",
    price: 10,
  },
  {
    id: "data-transfer",
    name: "Data Transfer",
    type: "Outbound",
    usage: "5TB/month",
    price: 450,
  },
]

function BucketDetailsPage() {
  const totalCost = mockStorageResources.reduce(
    (acc, resource) => acc + resource.price,
    0,
  )
  const totalBuckets = mockStorageResources.filter((r) =>
    r.type.includes("S3"),
  ).length
  const totalStorage = "12TB"
  const dataTransfer = mockStorageResources.find(
    (r) => r.id === "data-transfer",
  )?.usage

  const summaryMetrics = [
    {
      label: "Monthly cost",
      value: `$${totalCost.toFixed(2)}`,
      description: "Based on usage and storage.",
    },
    {
      label: "Total buckets",
      value: totalBuckets,
      description: "S3 Standard and Glacier buckets.",
    },
    {
      label: "Total storage",
      value: totalStorage,
      description: "Across all storage types.",
    },
    {
      label: "Data transfer",
      value: dataTransfer ?? "N/A",
      description: "Outbound data transfer per month.",
    },
  ]

  return (
    <div className="space-y-12">
      <div className="rounded-[32px] border border-slate-200/70 bg-white/85 px-6 py-8 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)]">
        <div className="space-y-4">
          <Badge className="rounded-full border border-indigo-200/70 bg-indigo-500/10 px-4 py-1 text-[0.65rem] uppercase tracking-[0.22em] text-indigo-700 dark:border-indigo-500/30 dark:text-indigo-100">
            Storage
          </Badge>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              S3 Compatible Bucket
            </h1>
            <Badge variant="outline" className="rounded-full border-slate-200/70 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-600/60 dark:text-slate-300">
              Multi-Region
            </Badge>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Review your storage usage, cost breakdown, and other metrics for your S3 compatible bucket.
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
        <div className="lg:col-span-2">
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
                    <TableHead>Usage</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockStorageResources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell>{resource.name}</TableCell>
                      <TableCell>{resource.type}</TableCell>
                      <TableCell>
                        {resource.usage ?? resource.storage}
                      </TableCell>
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
        <div className="space-y-8">
          <Card className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Graph of cost breakdown here</p>
            </CardContent>
          </Card>
          <Card className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
            <CardHeader>
              <CardTitle>Usage Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Graph of usage metrics here</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute("/_layout/storage/bucket")({
  component: BucketDetailsPage,
})
