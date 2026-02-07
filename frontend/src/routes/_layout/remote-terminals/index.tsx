import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
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
import PageScaffold, { PageSection } from "../../../components/Common/PageLayout"

export const Route = createFileRoute("/_layout/remote-terminals/")({
  component: RemoteTerminalsPage,
})

interface RemoteServer {
  id: string
  name: string
  server_type: string
  cpu_cores: number
  memory_gb: number
  gpu_type?: string
  status: string
  hourly_rate: number
  created_at: string
}

function RemoteTerminalsPage() {
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      running: "default",
      stopped: "secondary",
      provisioning: "outline",
      error: "destructive",
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
            <Button>
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
                            <Button variant="outline" size="sm">
                              Stop
                            </Button>
                            <Button variant="outline" size="sm">
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
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
              <Button variant="outline" className="w-full">
                Create SSH Server
              </Button>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">GPU Server</h3>
              <p className="text-sm text-muted-foreground mb-4">
                High-performance GPU server for ML/AI workloads
              </p>
              <Button variant="outline" className="w-full">
                Create GPU Server
              </Button>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">Inference Server</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Optimized for model inference and serving
              </p>
              <Button variant="outline" className="w-full">
                Create Inference Server
              </Button>
            </div>
          </div>
        </PageSection>
      </div>
    </PageScaffold>
  )
}
