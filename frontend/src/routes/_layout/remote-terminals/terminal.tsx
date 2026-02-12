import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import XTerminal from "../../../components/Terminal/XTerminal"

export const Route = createFileRoute("/_layout/remote-terminals/terminal")({
  component: TerminalPage,
  validateSearch: (search: Record<string, unknown>) => ({
    serverId: (search.serverId as string) || "",
  }),
})

function TerminalPage() {
  const { serverId } = Route.useSearch()
  const [connected, setConnected] = useState(true)
  const [error, setError] = useState("")
  const [notConfigured, setNotConfigured] = useState(false)

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

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/hosting">Back</Link>
          </Button>
          <h2 className="text-lg font-semibold">Terminal</h2>
          <span className="text-sm text-muted-foreground">
            Server: {serverId.slice(0, 8)}...
          </span>
          <span className={`inline-block h-2 w-2 rounded-full ${connected && !error && !notConfigured ? "bg-green-500" : notConfigured ? "bg-yellow-500" : "bg-red-500"}`} />
        </div>
        {notConfigured ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-yellow-500">Terminal access not configured</span>
            <Button asChild variant="outline" size="sm">
              <Link to="/hosting">Configure Server</Link>
            </Button>
          </div>
        ) : (!connected || error) ? (
          <div className="flex items-center gap-3">
            {error && <span className="text-sm text-destructive">{error}</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConnected(true)
                setError("")
                window.location.reload()
              }}
            >
              Reconnect
            </Button>
          </div>
        ) : null}
      </div>
      <div className="flex-1 rounded-lg border border-slate-700 bg-[#0f172a] overflow-hidden relative">
        {connected && (
          <XTerminal
            serverId={serverId}
            onDisconnect={(code, reason) => {
              setConnected(false)
              if (code === 4005) {
                setNotConfigured(true)
              } else {
                setError(`Connection closed (code: ${code ?? "unknown"}).`)
              }
            }}
          />
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
