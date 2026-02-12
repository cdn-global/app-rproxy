import { useEffect, useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import XTerminal from "../../../components/Terminal/XTerminal"

export const Route = createFileRoute("/_layout/remote-terminals/terminal")({
  component: TerminalPage,
  validateSearch: (search: Record<string, unknown>) => ({
    serverId: (search.serverId as string) || "",
  }),
})

interface ServerInfo {
  id: string
  name: string
  server_type: string
  hosting_provider: string
  cpu_cores: number
  memory_gb: number
  status: string
  aws_region?: string
  aws_public_ip?: string
  hourly_rate: number
}

function TerminalPage() {
  const { serverId } = Route.useSearch()
  const [connected, setConnected] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")
  const [notConfigured, setNotConfigured] = useState(false)

  const { data: server } = useQuery<ServerInfo>({
    queryKey: ["server", serverId],
    queryFn: async () => {
      const response = await fetch(`/v2/servers/${serverId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Server not found")
      return response.json()
    },
    enabled: !!serverId,
  })

  // Once server info loads, allow the terminal to connect
  useEffect(() => {
    if (server) {
      setReady(true)
      setConnected(true)
    }
  }, [server])

  if (!serverId) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No server selected.</p>
        <Button asChild variant="outline">
          <Link to="/hosting">Back to Servers</Link>
        </Button>
      </div>
    )
  }

  const serverLabel = server
    ? `${server.name} · ${server.aws_region || server.hosting_provider} · ${server.cpu_cores} vCPU / ${server.memory_gb} GB`
    : serverId.slice(0, 8) + "..."

  const statusColor = connected && !error && !notConfigured
    ? "bg-green-500"
    : notConfigured
      ? "bg-yellow-500"
      : !ready
        ? "bg-blue-500 animate-pulse"
        : "bg-red-500"

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/hosting">Back</Link>
          </Button>
          <h2 className="text-lg font-semibold">Terminal</h2>
          <span className="text-sm text-muted-foreground">{serverLabel}</span>
          <span className={`inline-block h-2 w-2 rounded-full ${statusColor}`} />
          {server && <Badge variant="outline" className="text-xs">{server.status}</Badge>}
        </div>
        {notConfigured ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-yellow-500">Terminal access not configured</span>
            <Button asChild variant="outline" size="sm">
              <Link to="/hosting">Configure Server</Link>
            </Button>
          </div>
        ) : (!connected && ready) || error ? (
          <div className="flex items-center gap-3">
            {error && <span className="text-sm text-destructive">{error}</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConnected(true)
                setError("")
                setNotConfigured(false)
              }}
            >
              Reconnect
            </Button>
          </div>
        ) : null}
      </div>
      <div className="flex-1 rounded-lg border border-slate-700 bg-[#0f172a] overflow-hidden relative">
        {connected && ready && (
          <XTerminal
            serverId={serverId}
            onDisconnect={(code, _reason) => {
              setConnected(false)
              if (code === 4005) {
                setNotConfigured(true)
              } else {
                setError(`Connection closed (code: ${code ?? "unknown"}).`)
              }
            }}
          />
        )}
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a]">
            <p className="text-slate-400 text-sm animate-pulse">Loading server info...</p>
          </div>
        )}
        {notConfigured && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0f172a]/90">
            <p className="text-yellow-400 text-lg font-semibold">Terminal Access Not Configured</p>
            <p className="text-slate-400 text-sm max-w-md text-center">
              This server does not have a connection endpoint configured. Please set up SSH or Docker access for this server to use the terminal.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/hosting">Go to Server Settings</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
