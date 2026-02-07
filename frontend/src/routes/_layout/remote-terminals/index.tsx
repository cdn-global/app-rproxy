import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import PageScaffold, { PageSection } from "../../../components/Common/PageLayout"
import CreateServer from "../../../components/Servers/CreateServer"
import useCustomToast from "../../../hooks/useCustomToast"

export const Route = createFileRoute("/_layout/remote-terminals/")({
  component: RemoteTerminalsPage,
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

function RemoteTerminalsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RemoteServer | null>(null)
  const queryClient = useQueryClient()
  const showToast = useCustomToast()

  const { data: servers, isLoading } = useQuery<{ data: RemoteServer[]; count: number }>({
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

  const stopMutation = useMutation({
    mutationFn: async (serverId: string) => {
      const response = await fetch(`/api/v2/servers/${serverId}/stop`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
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
    mutationFn: async (serverId: string) => {
      const response = await fetch(`/api/v2/servers/${serverId}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
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
    mutationFn: async (serverId: string) => {
      const response = await fetch(`/api/v2/servers/${serverId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      running: "default",
      stopped: "secondary",
      provisioning: "outline",
      error: "destructive",
      terminated: "destructive",
    }
    return (
      <Badge variant={variants[status] || "outline"}>
        {status}
      </Badge>
    )
  }

  return (
    <PageScaffold sidebar={null}>
      <div className="space-y-10">
        <PageSection
          id="servers"
          title="Remote Servers"
          description="Manage your remote SSH, GPU, and inference servers"
          actions={
            <Button onClick={() => setCreateOpen(true)}>
              Create Server
            </Button>
          }
        >
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>CPU/Memory</TableHead>
                    <TableHead>GPU</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hourly Rate</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servers?.data && servers.data.length > 0 ? (
                    servers.data.map((server) => (
                      <TableRow key={server.id}>
                        <TableCell className="font-medium">{server.name}</TableCell>
                        <TableCell>{server.server_type}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {server.hosting_provider === "aws" ? "AWS" : "Docker"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {server.cpu_cores} cores / {server.memory_gb} GB
                        </TableCell>
                        <TableCell>{server.gpu_type || "-"}</TableCell>
                        <TableCell>{getStatusBadge(server.status)}</TableCell>
                        <TableCell>${server.hourly_rate.toFixed(2)}/hr</TableCell>
                        <TableCell>
                          {new Date(server.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {server.status === "running" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <Link to="/remote-terminals/terminal" search={{ serverId: server.id }}>
                                    Connect
                                  </Link>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
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
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(server)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No servers found. Create your first server to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </PageSection>

        <PageSection
          id="quickstart"
          title="Quick Start"
          description="Create a new remote server for your workload"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">SSH Server</h3>
              <p className="text-sm text-muted-foreground mb-4">
                General purpose Linux server with SSH access
              </p>
              <Button variant="outline" className="w-full" onClick={() => setCreateOpen(true)}>
                Create SSH Server
              </Button>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">GPU Server</h3>
              <p className="text-sm text-muted-foreground mb-4">
                High-performance GPU server for ML/AI workloads
              </p>
              <Button variant="outline" className="w-full" onClick={() => setCreateOpen(true)}>
                Create GPU Server
              </Button>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">Inference Server</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Optimized for model inference and serving
              </p>
              <Button variant="outline" className="w-full" onClick={() => setCreateOpen(true)}>
                Create Inference Server
              </Button>
            </div>
          </div>
        </PageSection>
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
