import { useEffect, useRef } from "react"
import { Terminal } from "xterm"
import { FitAddon } from "@xterm/addon-fit"
import { WebLinksAddon } from "@xterm/addon-web-links"
import "xterm/css/xterm.css"

interface XTerminalProps {
  serverId: string
  onDisconnect?: () => void
}

const XTerminal = ({ serverId, onDisconnect }: XTerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!terminalRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      theme: {
        background: "#0f172a",
        foreground: "#e2e8f0",
        cursor: "#10b981",
        selectionBackground: "#334155",
        black: "#0f172a",
        red: "#ef4444",
        green: "#10b981",
        yellow: "#f59e0b",
        blue: "#3b82f6",
        magenta: "#a855f7",
        cyan: "#06b6d4",
        white: "#e2e8f0",
      },
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.open(terminalRef.current)
    fitAddon.fit()

    termRef.current = term
    fitAddonRef.current = fitAddon

    term.writeln("\x1b[1;32mConnecting to server...\x1b[0m")

    // Connect WebSocket
    const token = localStorage.getItem("access_token")
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsHost = window.location.hostname === "localhost"
      ? "localhost:8000"
      : "api.roamingproxy.com"
    const wsUrl = `${wsProtocol}//${wsHost}/v2/terminal/ws/${serverId}?token=${token}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      term.writeln("\x1b[1;32mConnected!\x1b[0m\r\n")
    }

    ws.onmessage = (event) => {
      term.write(event.data)
    }

    ws.onclose = (event) => {
      term.writeln(`\r\n\x1b[1;31mDisconnected (code: ${event.code})\x1b[0m`)
      onDisconnect?.()
    }

    ws.onerror = () => {
      term.writeln("\r\n\x1b[1;31mConnection error\x1b[0m")
    }

    // Send keystrokes to server
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data)
      }
    })

    // Handle resize
    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols, rows }))
      }
    })

    const handleResize = () => {
      fitAddon.fit()
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      ws.close()
      term.dispose()
    }
  }, [serverId, onDisconnect])

  return (
    <div
      ref={terminalRef}
      className="h-full w-full rounded-lg overflow-hidden"
      style={{ minHeight: "400px" }}
    />
  )
}

export default XTerminal
