import { useCallback, useEffect, useMemo, useState } from "react"
import { Link as RouterLink, createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FiArrowUpRight, FiCheck, FiCopy } from "react-icons/fi"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
import useCustomToast from "@/hooks/useCustomToast"
import CreateServer from "../../../components/Servers/CreateServer"
import PageScaffold, { PageSection } from "../../../components/Common/PageLayout"

const numberFormatter = new Intl.NumberFormat("en-US")
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

interface RemoteServer {
  id: string
  name: string
  server_type: string
  hosting_provider: string
  cpu_cores: number
  memory_gb: number
  gpu_type?: string
  status: string
  hourly_rate: number
  created_at: string
  aws_instance_type?: string
  aws_region?: string
  aws_public_ip?: string
}

function HostingIndexPage() {
  const showToast = useCustomToast()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RemoteServer | null>(null)

  const { data, isLoading } = useQuery<{ data: RemoteServer[]; count: number }>({
    queryKey: ["remote-servers"],
    queryFn: async () => {
      const response = await fetch("/api/v2/servers/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch servers")
      return response.json()
    },
  })

  const servers = data?.data ?? []

  const stopMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v2/servers/${id}/stop`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      })
      if (!response.ok) throw new Error("Failed to stop server")
      return response.json()
    },
    onSuccess: () => {
      showToast("Success", "Server stopped.", "success")
      queryClient.invalidateQueries({ queryKey: ["remote-servers"] })
    },
    onError: (err: Error) => showToast("Error", err.message, "error"),
  })

  const startMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v2/servers/${id}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      })
      if (!response.ok) throw new Error("Failed to start server")
      return response.json()
    },
    onSuccess: () => {
      showToast("Success", "Server started.", "success")
      queryClient.invalidateQueries({ queryKey: ["remote-servers"] })
    },
    onError: (err: Error) => showToast("Error", err.message, "error"),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v2/servers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      })
      if (!response.ok) throw new Error("Failed to delete server")
      return response.json()
    },
    onSuccess: () => {
      showToast("Success", "Server deleted.", "success")
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ["remote-servers"] })
    },
    onError: (err: Error) => showToast("Error", err.message, "error"),
  })

  const fleetSummary = useMemo(() => {
    return servers.reduce(
      (acc, server) => {
        acc.totalServers += 1
        acc.running += server.status === "running" ? 1 : 0
        acc.totalMonthly += server.hourly_rate * 730
        acc.totalVcpus += server.cpu_cores
        acc.totalRam += server.memory_gb
        return acc
      },
      { totalServers: 0, running: 0, totalMonthly: 0, totalVcpus: 0, totalRam: 0 },
    )
  }, [servers])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      running: "default",
      stopped: "secondary",
      provisioning: "outline",
      error: "destructive",
      terminated: "destructive",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  return (
    <PageScaffold sidebar={null}>
    <div className="space-y-8">
        <PageSection
          id="fleet"
          title="Fleet intelligence"
          description="Summaries of capacity, health, and monthly run rate."
          actions={
            <Button
              onClick={() => setCreateOpen(true)}
              variant="outline"
              className="gap-2 rounded-full border-slate-200/80 bg-white/60 px-5 py-2 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
            >
              <span>Create Server</span>
              <FiArrowUpRight className="h-4 w-4" />
            </Button>
          }
        >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryTile
                label="Total servers"
                value={numberFormatter.format(fleetSummary.totalServers)}
                description={`${fleetSummary.running} running`}
              />
              <SummaryTile
                label="Running"
                value={numberFormatter.format(fleetSummary.running)}
                description={fleetSummary.totalServers - fleetSummary.running > 0 ? `${fleetSummary.totalServers - fleetSummary.running} stopped` : "All nodes healthy"}
              />
              <SummaryTile
                label="Monthly run rate"
                value={currencyFormatter.format(fleetSummary.totalMonthly)}
                description="Based on hourly rates"
              />
              <SummaryTile
                label="Provisioned capacity"
                value={`${numberFormatter.format(fleetSummary.totalVcpus)} vCPU`}
                description={`${numberFormatter.format(fleetSummary.totalRam)} GB RAM`}
              />
            </div>
        </PageSection>

        <PageSection
          id="servers"
          title="Servers"
          description="Manage your fleet of SSH, GPU, and inference servers."
        >
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
            <div className="space-y-6 pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                  <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>CPU / RAM</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hourly Rate</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : servers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No servers found. Create your first server to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    servers.map((server) => (
                      <TableRow
                        key={server.id}
                        className="border-slate-200/70 transition-colors hover:bg-slate-100/60 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                      >
                        <TableCell className="font-medium text-slate-900 dark:text-slate-50">
                          {server.name}
                        </TableCell>
                        <TableCell className="capitalize">{server.server_type}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {server.hosting_provider === "aws" ? "AWS" : "Docker"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {server.cpu_cores} vCPU / {server.memory_gb} GB
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                          {server.aws_region || "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(server.status)}</TableCell>
                        <TableCell>${server.hourly_rate.toFixed(3)}/hr</TableCell>
                        <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(server.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {server.status === "running" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full px-3 py-1 text-xs font-semibold"
                                  asChild
                                >
                                  <RouterLink to="/remote-terminals/terminal" search={{ serverId: server.id }}>
                                    Terminal
                                  </RouterLink>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full px-3 py-1 text-xs font-semibold"
                                  onClick={() => stopMutation.mutate(server.id)}
                                  disabled={stopMutation.isPending}
                                >
                                  Stop
                                </Button>
                              </>
                            )}
                            {server.status === "stopped" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full px-3 py-1 text-xs font-semibold"
                                onClick={() => startMutation.mutate(server.id)}
                                disabled={startMutation.isPending}
                              >
                                Start
                              </Button>
                            )}
                            {server.status === "provisioning" && (
                              <Badge variant="outline">Provisioning...</Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full px-3 py-1 text-xs font-semibold text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(server)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {servers.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={9} className="text-right text-sm font-semibold text-slate-600 dark:text-slate-400">
                        {fleetSummary.totalServers} servers · {fleetSummary.running} running · {currencyFormatter.format(fleetSummary.totalMonthly)}/mo
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
            </div>
          </div>
        </PageSection>

        <div className="mt-10 border-t border-slate-200/60 pt-10 dark:border-slate-800">
          <div className="mb-6 space-y-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Jump to</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Quick links to page sections.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <RouterLink to="/" className="group flex flex-col justify-between space-y-2 rounded-xl border border-slate-200/60 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900">
              <div className="space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">Workspace</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Subscriptions, average usage, and quick billing actions.</div>
              </div>
            </RouterLink>
            <a href="#analytics" className="group flex flex-col justify-between space-y-2 rounded-xl border border-slate-200/60 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900">
              <div className="space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">Usage insights</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Traffic, spend, and throughput metrics.</div>
              </div>
            </a>
            <RouterLink to="/" className="group flex flex-col justify-between space-y-2 rounded-xl border border-slate-200/60 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900">
              <div className="space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">Tool directory</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Explore every workspace module in one place.</div>
              </div>
            </RouterLink>
          </div>
        </div>
    </div>

    <CreateServer isOpen={createOpen} onClose={() => setCreateOpen(false)} />

    <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Server</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3">
          <Button
            variant="destructive"
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
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
    <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
  </div>
)

export const Route = createFileRoute("/_layout/hosting/")({
  component: HostingIndexPage,
})
