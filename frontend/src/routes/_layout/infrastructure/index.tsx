import { useCallback, useEffect, useMemo, useState } from "react"
import { Link as RouterLink, createFileRoute } from "@tanstack/react-router"
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
import PageScaffold, { PageSection } from "@/components/Common/PageLayout"
import { hostingServers } from "@/data/hosting"
import useCustomToast from "@/hooks/useCustomToast"


const numberFormatter = new Intl.NumberFormat("en-US")
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function InfrastructureIndexPage() {
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
    <PageScaffold className="py-8" sidebar={null}>
      <div className="space-y-6">
        <div className="mx-auto w-full max-w-4xl space-y-4 text-center">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Infrastructure</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage your infrastructure.</p>
        </div>

        <PageSection id="overview" title="Managed Infrastructure" description="Details about your Terraform, Ansible, and Kubernetes resources.">
          <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <Badge variant="outline">Terraform</Badge>
              <Badge variant="outline">Ansible</Badge>
              <Badge variant="outline">Kubernetes</Badge>
            </div>
          </div>
        </PageSection>
      </div>
    </PageScaffold>
  )
}

export const Route = createFileRoute('/_layout/infrastructure/')({
  component: InfrastructureIndexPage,
})
