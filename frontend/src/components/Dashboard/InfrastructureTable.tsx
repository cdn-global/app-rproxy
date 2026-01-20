import { Link as RouterLink } from "@tanstack/react-router"
import { FiArrowUpRight } from "react-icons/fi"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { ServerNode } from "./types"

interface InfrastructureTotals {
  totalCount: number
  totalVCPUs: number
  totalRAM: number
  totalStorage: number
  totalMonthlySpend: number
}

interface InfrastructureTableProps {
  servers: ServerNode[]
  totals: InfrastructureTotals
  formatCurrency: (value: number) => string
  ctaTo: string
}

const InfrastructureTable = ({ servers, totals, formatCurrency, ctaTo }: InfrastructureTableProps) => {
  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_26px_60px_-34px_rgba(15,23,42,0.42)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_26px_60px_-30px_rgba(15,23,42,0.62)]">
      <div className="space-y-1.5 border-b border-slate-200/70 p-6 dark:border-slate-700/60">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Infrastructure footprint</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Managed VPS instances across your RoamingProxy regions.
        </p>
      </div>
      <div className="p-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-700/60">
          <Table>
            <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
              <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                <TableHead>Server</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Specs</TableHead>
                <TableHead>Features</TableHead>
                <TableHead className="text-right">Monthly</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">No managed nodes yet</p>
                      <p className="text-sm">
                        Provision your first server to track availability, spend, and feature coverage.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                servers.map((server) => (
                  <TableRow
                    key={server.name}
                    className="border-slate-200/70 transition-colors hover:bg-slate-100/60 dark:border-slate-700/60 dark:hover:bg-slate-800/60"
                  >
                    <TableCell className="align-top font-medium text-slate-900 dark:text-slate-50">
                      <div>{server.name}</div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Active since {formatDate(server.activeSince)}
                      </p>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="text-slate-900 dark:text-slate-50">{server.ip}</div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {server.os} · v{server.version}
                      </p>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge
                        variant={server.status === "Connected" ? "success" : "warning"}
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                      >
                        {server.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                        <div>
                          {server.vCPUs ?? "-"} vCPU · {server.ramGB} GB RAM · {server.storageSizeGB} GB SSD
                        </div>
                        <div className="text-xs">Kernel {server.kernel}</div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <FeatureTags server={server} />
                    </TableCell>
                    <TableCell className="align-top text-right text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {formatCurrency(server.monthlyComputePrice)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-b-[28px] border-t border-slate-200/70 bg-white/60 p-6 dark:border-slate-700/60 dark:bg-slate-900/50">
        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
          <p>
            Network total: {totals.totalCount} servers · {totals.totalVCPUs} vCPUs · {totals.totalRAM} GB RAM · {totals.totalStorage} GB SSD
          </p>
          <p>Monthly run rate {formatCurrency(totals.totalMonthlySpend)} across active nodes.</p>
        </div>
        <div className="ml-auto">
          <Button
            asChild
            variant="outline"
            className="gap-2 rounded-full px-5 py-2 text-sm font-semibold"
          >
            <RouterLink to={ctaTo}>
              <span>Open infrastructure view</span>
              <FiArrowUpRight className="h-4 w-4" />
            </RouterLink>
          </Button>
        </div>
      </div>
    </div>
  )
}

const FeatureTags = ({ server }: { server: ServerNode }) => {
  const tags: string[] = []
  if (server.hasRotatingIP) tags.push("Rotating IPs")
  if (server.hasBackup) tags.push("Backups")
  if (server.hasMonitoring) tags.push("Monitoring")
  if (server.hasManagedSupport) tags.push("Managed support")

  if (tags.length === 0) {
    return (
      <Badge variant="subtle" className="rounded-full px-3 py-1 text-xs font-medium">
        Standard
      </Badge>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((label) => (
        <Badge key={label} variant="outline" className="rounded-full border-slate-300/80 px-3 py-1 text-xs font-medium dark:border-slate-600/80">
          {label}
        </Badge>
      ))}
    </div>
  )
}

const formatDate = (isoDate: string) => {
  try {
    const date = new Date(isoDate)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  } catch (error) {
    return isoDate
  }
}

export default InfrastructureTable
