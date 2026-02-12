import { useState, useCallback, useEffect } from "react"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FiArrowLeft, FiCopy, FiCheck } from "react-icons/fi"
import { getApiBaseUrl } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import PageScaffold, { PageSection } from "../../../components/Common/PageLayout"
import useCustomToast from "../../../hooks/useCustomToast"

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

interface QueryLogEntry {
  id: string
  query: string
  duration_ms: number
  timestamp: string
  rows_affected: number
  source: string
}

const getStatusVariant = (
  status: string,
): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    running: "default",
    stopped: "secondary",
    provisioning: "outline",
    error: "destructive",
  }
  return variants[status] || "outline"
}

const baseUrl = getApiBaseUrl()

function InstanceDetailsPage() {
  const { instanceId } = Route.useParams()
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopy = useCallback(
    async (value: string, key: string, label: string) => {
      try {
        if (typeof navigator === "undefined" || !navigator.clipboard) {
          throw new Error("Clipboard API unavailable")
        }
        await navigator.clipboard.writeText(value)
        setCopiedKey(key)
        showToast(`${label} copied`, value, "success")
      } catch {
        showToast(
          "Copy failed",
          "We could not copy that value to your clipboard.",
          "error",
        )
      }
    },
    [showToast],
  )

  useEffect(() => {
    if (!copiedKey) return
    const timeout = window.setTimeout(() => setCopiedKey(null), 2000)
    return () => window.clearTimeout(timeout)
  }, [copiedKey])

  const { data: instance, isLoading } = useQuery<DatabaseInstance>({
    queryKey: ["database-instance", instanceId],
    queryFn: async () => {
      const response = await fetch(
        `${baseUrl}/v2/database-instances/${instanceId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        },
      )
      if (!response.ok) throw new Error("Failed to fetch database instance")
      return response.json()
    },
  })

  const {
    data: logsData,
    isLoading: logsLoading,
  } = useQuery<{ data: QueryLogEntry[]; count: number }>({
    queryKey: ["database-instance-logs", instanceId],
    queryFn: async () => {
      const response = await fetch(
        `${baseUrl}/v2/database-instances/${instanceId}/logs`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        },
      )
      if (!response.ok) throw new Error("Failed to fetch query logs")
      return response.json()
    },
    enabled: !!instance,
  })
  const queryLogs = logsData?.data ?? []

  const stopMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${baseUrl}/v2/database-instances/${id}/stop`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to stop database")
      return response.json()
    },
    onSuccess: () => {
      showToast("Success", "Database stopped.", "success")
      queryClient.invalidateQueries({
        queryKey: ["database-instance", instanceId],
      })
      queryClient.invalidateQueries({ queryKey: ["database-instances"] })
    },
    onError: (err: Error) => showToast("Error", err.message, "error"),
  })

  const startMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${baseUrl}/v2/database-instances/${id}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to start database")
      return response.json()
    },
    onSuccess: () => {
      showToast("Success", "Database started.", "success")
      queryClient.invalidateQueries({
        queryKey: ["database-instance", instanceId],
      })
      queryClient.invalidateQueries({ queryKey: ["database-instances"] })
    },
    onError: (err: Error) => showToast("Error", err.message, "error"),
  })

  const backupMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${baseUrl}/v2/database-instances/${id}/backup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to create backup")
      return response.json()
    },
    onSuccess: () => showToast("Success", "Backup started.", "success"),
    onError: (err: Error) => showToast("Error", err.message, "error"),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${baseUrl}/v2/database-instances/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to delete database")
      return response.json()
    },
    onSuccess: () => {
      showToast("Success", "Database deleted.", "success")
      queryClient.invalidateQueries({ queryKey: ["database-instances"] })
      navigate({ to: "/managed-database" })
    },
    onError: (err: Error) => showToast("Error", err.message, "error"),
  })

  if (isLoading) {
    return (
      <PageScaffold sidebar={null}>
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-500">Loading instance details...</div>
        </div>
      </PageScaffold>
    )
  }

  if (!instance) {
    return (
      <PageScaffold sidebar={null}>
        <div className="space-y-6 rounded-[32px] border border-amber-400/40 bg-amber-50/70 px-6 py-10 text-center text-amber-600 shadow-[0_30px_80px_-45px_rgba(217,119,6,0.35)] dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          <h1 className="text-xl font-semibold">Instance not found</h1>
          <p className="text-sm text-amber-700/90 dark:text-amber-100/80">
            We could not locate that database instance in your fleet.
          </p>
          <div className="flex justify-center">
            <Button
              asChild
              variant="outline"
              className="gap-2 rounded-full border-amber-400/60 px-5 py-2 text-sm font-semibold text-amber-600 hover:border-amber-500 hover:text-amber-700 dark:border-amber-500/60 dark:text-amber-100"
            >
              <Link to="/managed-database">
                <FiArrowLeft className="h-4 w-4" />
                Back to list
              </Link>
            </Button>
          </div>
        </div>
      </PageScaffold>
    )
  }

  const totalMonthlyCost =
    instance.monthly_rate + instance.storage_gb * instance.storage_rate_per_gb

  return (
    <PageScaffold sidebar={null}>
      <div className="space-y-10">
        {/* Header */}
        <div className="rounded-[32px] border border-slate-200/70 bg-white/85 px-6 py-8 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {instance.instance_name}
                </h1>
                <Badge
                  variant={getStatusVariant(instance.status)}
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                >
                  {instance.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                PostgreSQL v{instance.postgres_version} &middot; Created{" "}
                {new Date(instance.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <div className="text-xs text-slate-500 dark:text-slate-500">
                {instance.cpu_cores} vCPU &middot; {instance.memory_gb} GB RAM
                &middot; {instance.storage_gb} GB storage
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {instance.status === "running" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4 text-sm font-semibold"
                    onClick={() => stopMutation.mutate(instance.id)}
                    disabled={stopMutation.isPending}
                  >
                    {stopMutation.isPending ? "Stopping..." : "Stop"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4 text-sm font-semibold"
                    onClick={() => backupMutation.mutate(instance.id)}
                    disabled={backupMutation.isPending}
                  >
                    {backupMutation.isPending ? "Backing up..." : "Backup"}
                  </Button>
                </>
              )}
              {instance.status === "stopped" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full px-4 text-sm font-semibold"
                  onClick={() => startMutation.mutate(instance.id)}
                  disabled={startMutation.isPending}
                >
                  {startMutation.isPending ? "Starting..." : "Start"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-4 text-sm font-semibold text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
              <Button
                asChild
                variant="outline"
                className="gap-2 rounded-full border-slate-200/80 bg-white/60 px-5 py-2 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
              >
                <Link to="/managed-database">
                  <FiArrowLeft className="h-4 w-4" />
                  Back to list
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="rounded-full bg-slate-100/80 p-1 dark:bg-slate-800/60">
            <TabsTrigger
              value="overview"
              className="rounded-full px-4 py-1.5 text-sm font-semibold"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="query-logs"
              className="rounded-full px-4 py-1.5 text-sm font-semibold"
            >
              Query Logs
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-full px-4 py-1.5 text-sm font-semibold"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <PageSection
              id="summary"
              title="Instance summary"
              description="Key metrics at a glance."
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <SummaryTile
                  label="Status"
                  value={instance.status}
                  description="Current state"
                />
                <SummaryTile
                  label="Version"
                  value={`v${instance.postgres_version}`}
                  description="PostgreSQL"
                />
                <SummaryTile
                  label="vCPU"
                  value={`${instance.cpu_cores}`}
                  description="Compute cores"
                />
                <SummaryTile
                  label="RAM"
                  value={`${instance.memory_gb} GB`}
                  description="Memory"
                />
                <SummaryTile
                  label="Storage"
                  value={`${instance.storage_gb} GB`}
                  description="SSD"
                />
                <SummaryTile
                  label="Monthly cost"
                  value={currencyFormatter.format(totalMonthlyCost)}
                  description="Compute + storage"
                />
              </div>
            </PageSection>

            <PageSection
              id="connection"
              title="Connection information"
              description="Use these details to connect to your database."
            >
              <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Connection String
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        readOnly
                        value={`postgresql://user:****@${instance.instance_name}.db.managed.local:5432/${instance.instance_name}`}
                        className="flex-1 font-mono text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full border border-transparent text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
                        onClick={() =>
                          handleCopy(
                            `postgresql://user:****@${instance.instance_name}.db.managed.local:5432/${instance.instance_name}`,
                            "connstr",
                            "Connection string",
                          )
                        }
                      >
                        {copiedKey === "connstr" ? (
                          <FiCheck className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <FiCopy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Host
                      </Label>
                      <Input
                        readOnly
                        value={`${instance.instance_name}.db.managed.local`}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Port
                      </Label>
                      <Input
                        readOnly
                        value="5432"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Database
                      </Label>
                      <Input
                        readOnly
                        value={instance.instance_name}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </PageSection>
          </TabsContent>

          {/* Query Logs Tab */}
          <TabsContent value="query-logs">
            <PageSection
              id="query-logs"
              title="Query Logs"
              description="Recent queries executed against this instance."
            >
              <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                      <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                        <TableHead>Query</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Rows</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsLoading ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-8 text-center text-slate-500"
                          >
                            Loading query logs...
                          </TableCell>
                        </TableRow>
                      ) : queryLogs.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-8 text-center text-slate-500"
                          >
                            No query logs available.
                          </TableCell>
                        </TableRow>
                      ) : (
                        queryLogs.map((log) => (
                          <TableRow
                            key={log.id}
                            className="border-slate-200/70 transition-colors hover:bg-slate-100/60 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                          >
                            <TableCell className="max-w-md truncate font-mono text-xs text-slate-900 dark:text-slate-50">
                              {log.query}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                              {log.duration_ms.toFixed(2)} ms
                            </TableCell>
                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                              {log.rows_affected}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="rounded-full text-xs"
                              >
                                {log.source}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                              {new Date(log.timestamp).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
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
            </PageSection>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <PageSection
              id="settings"
              title="Instance Configuration"
              description="Database instance parameters (read-only)."
            >
              <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Instance Name
                    </Label>
                    <Input
                      readOnly
                      value={instance.instance_name}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      PostgreSQL Version
                    </Label>
                    <Input
                      readOnly
                      value={instance.postgres_version}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      vCPU Cores
                    </Label>
                    <Input
                      readOnly
                      value={`${instance.cpu_cores}`}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Memory
                    </Label>
                    <Input
                      readOnly
                      value={`${instance.memory_gb} GB`}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Storage
                    </Label>
                    <Input
                      readOnly
                      value={`${instance.storage_gb} GB`}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Monthly Rate
                    </Label>
                    <Input
                      readOnly
                      value={currencyFormatter.format(instance.monthly_rate)}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Storage Rate
                    </Label>
                    <Input
                      readOnly
                      value={`$${instance.storage_rate_per_gb}/GB/month`}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Created
                    </Label>
                    <Input
                      readOnly
                      value={new Date(instance.created_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </PageSection>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => !open && setDeleteOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Database</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{instance.instance_name}
              &quot;? All data will be permanently lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(instance.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

export const Route = createFileRoute("/_layout/managed-database/$instanceId")({
  component: InstanceDetailsPage,
})
