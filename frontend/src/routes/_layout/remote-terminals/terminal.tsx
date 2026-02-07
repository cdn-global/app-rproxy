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
          <span className={`inline-block h-2 w-2 rounded-full ${connected && !error ? "bg-green-500" : "bg-red-500"}`} />
        </div>
        {(!connected || error) && (
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
        )}
      </div>
      <div className="flex-1 rounded-lg border border-slate-700 bg-[#0f172a] overflow-hidden">
        {connected && (
          <XTerminal
            serverId={serverId}
            onDisconnect={() => {
              setConnected(false)
              setError("Connection closed. Server may not have terminal access configured.")
            }}
          />
        )}
      </div>
    </div>
  )
}
