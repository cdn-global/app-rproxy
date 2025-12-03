import { useCallback, useEffect, useMemo, useState } from "react"
import { Link as RouterLink, createFileRoute } from "@tanstack/react-router"
import { FiArrowUpRight, FiCheck, FiCopy } from "react-icons/fi"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription,CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { hostingServers } from "@/data/hosting"
import useCustomToast from "@/hooks/useCustomToast"


const numberFormatter = new Intl.NumberFormat("en-US")
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function ComputeIndexPage() {
  const showToast = useCustomToast()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const fleetSummary = useMemo(() => {
    return hostingServers.reduce(
      (acc, server) => {
        acc.totalServers += 1
        acc.connected += server.status === "Connected" ? 1 : 0
        acc.trial += server.isTrial ? 1 : 0
        acc.totalMonthlyCharged += server.isTrial ? 0 : server.monthlyComputePrice
        acc.totalMonthlyList += server.fullMonthlyComputePrice
        acc.totalVcpus += server.vCPUs ?? 0
        acc.totalRam += server.ramGB
        acc.totalStorage += server.storageSizeGB
        acc.rotating += server.hasRotatingIP ? 1 : 0
        acc.backup += server.hasBackup ? 1 : 0
        acc.monitoring += server.hasMonitoring ? 1 : 0
        acc.managed += server.hasManagedSupport ? 1 : 0
        return acc
      },
      {
        totalServers: 0,
        connected: 0,
        trial: 0,
        totalMonthlyCharged: 0,
        totalMonthlyList: 0,
        totalVcpus: 0,
        totalRam: 0,
        totalStorage: 0,
        rotating: 0,
        backup: 0,
        monitoring: 0,
        managed: 0,
      },
    )
  }, [])

  const offlineCount = fleetSummary.totalServers - fleetSummary.connected

  const handleCopy = useCallback(
    async (value: string, label: string, key: string) => {
      try {
        if (typeof navigator === "undefined" || !navigator.clipboard) {
          throw new Error("Clipboard API unavailable")
        }
        await navigator.clipboard.writeText(value)
        setCopiedKey(key)
        showToast(`${label} copied`, value, "success")
      } catch (error) {
        console.error("Unable to copy value", error)
        showToast("Copy failed", "We could not copy that value to your clipboard.", "error")
      }
    },
    [showToast],
  )

  useEffect(() => {
    if (!copiedKey) return
    const timeout = window.setTimeout(() => setCopiedKey(null), 2000)
    return () => window.clearTimeout(timeout)
  }, [copiedKey])

  const analyticsPoints = [38, 62, 54, 78, 92, 66, 105, 98]
  const sparkPath = analyticsPoints
    .map((point, index) => {
      const x = (index / (analyticsPoints.length - 1)) * 180
      const y = 110 - point
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")
  return (
    <div className="space-y-10 py-10">
      <Card className="relative overflow-hidden rounded-[28px] border border-transparent text-slate-900 shadow-[0_34px_88px_-48px_rgba(15,23,42,0.62)] dark:text-slate-100">
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.52),_transparent_55%),_radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.52),_transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/80 via-white/55 to-white/35 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-slate-900/40" />
        <CardHeader className="relative space-y-4 rounded-[24px] bg-white/78 p-6 shadow-[0_22px_46px_-30px_rgba(15,23,42,0.42)] backdrop-blur dark:bg-slate-900/70">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-4 py-1 text-[0.65rem] uppercase tracking-[0.25em] text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/70">
            <span>Compute</span>
            <span className="h-1 w-1 rounded-full bg-slate-400" aria-hidden="true" />
            <span>Serverless Compute</span>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
              Compute
            </CardTitle>
            <CardDescription>
              Deploy and manage your serverless functions.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <Badge variant="outline">Node.js</Badge>
            <Badge variant="outline">Python</Badge>
            <Badge variant="outline">Go</Badge>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}

export const Route = createFileRoute("/_layout/compute/")({
  component: ComputeIndexPage,
})
