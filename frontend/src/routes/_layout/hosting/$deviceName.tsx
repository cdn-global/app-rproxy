import { useCallback, useEffect, useState } from "react"
import { Link as RouterLink, createFileRoute, useParams } from "@tanstack/react-router"
import { FiArrowLeft, FiCheck, FiCopy } from "react-icons/fi"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { hostingServers } from "@/data/hosting"
import useCustomToast from "@/hooks/useCustomToast"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function DeviceDetailsPage() {
  const { deviceName } = useParams({ from: "/_layout/hosting/$deviceName" })
  const server = hostingServers.find((item) => item.name === deviceName)
  const showToast = useCustomToast()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopy = useCallback(
    async (value: string, key: string, label: string) => {
      try {
        if (typeof navigator === "undefined" || !navigator.clipboard) {
          throw new Error("Clipboard API unavailable")
        }
        await navigator.clipboard.writeText(value)
        setCopiedKey(key)
        showToast(`${label} copied`, value, "success")
      } catch (error) {
        console.error("Unable to copy value", error)
        showToast(
          "Copy failed",
          "We could not copy that value to your clipboard.",
          "error",
        )
      }
    },
    [showToast],
  )

  useEffect(() => {
    if (!copiedKey) return
    const timeout = window.setTimeout(() => setCopiedKey(null), 2000)
    return () => window.clearTimeout(timeout)
  }, [copiedKey])

  if (!server) {
    return (
      <div className="space-y-6 rounded-[32px] border border-amber-400/40 bg-amber-50/70 px-6 py-10 text-center text-amber-600 shadow-[0_30px_80px_-45px_rgba(217,119,6,0.35)] dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
        <h1 className="text-xl font-semibold">Server not found</h1>
        <p className="text-sm text-amber-700/90 dark:text-amber-100/80">
          We could not locate that device in your managed fleet.
        </p>
        <div className="flex justify-center">
          <Button
            asChild
            variant="outline"
            className="gap-2 rounded-full border-amber-400/60 px-5 py-2 text-sm font-semibold text-amber-600 hover:border-amber-500 hover:text-amber-700 dark:border-amber-500/60 dark:text-amber-100"
          >
            <RouterLink to="..">
              <FiArrowLeft className="h-4 w-4" />
              Back to list
            </RouterLink>
          </Button>
        </div>
      </div>
    )
  }

  const capacityLabel = `${server.vCPUs ?? 0} vCPU · ${server.ramGB} GB RAM · ${server.storageSizeGB} GB storage`

  return (
    <div className="space-y-10">
      <div className="rounded-[32px] border border-slate-200/70 bg-white/85 px-6 py-8 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {server.name}
              </h1>
              <Badge
                variant={server.status === "Connected" ? "success" : "warning"}
                className="rounded-full px-3 py-1 text-xs font-semibold"
              >
                {server.status}
              </Badge>
              {server.isTrial ? (
                <Badge variant="outline" className="rounded-full border-amber-400/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-500">
                  Trial
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Debian footprint powered by RoamingProxy managed compute. Active since {formatDate(server.activeSince)}.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-500">
              <span>{server.os.toUpperCase()} · Kernel {server.kernel}</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-400 sm:inline" />
              <span>{capacityLabel}</span>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="gap-2 rounded-full border-slate-200/80 bg-white/60 px-5 py-2 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
          >
            <RouterLink to="..">
              <FiArrowLeft className="h-4 w-4" />
              Back to list
            </RouterLink>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCard title="Basic information">
          <DefinitionList>
            <DefinitionRow label="Device name">{server.name}</DefinitionRow>
            <DefinitionRow label="Primary contact">
              <CopyableValue
                value={server.email}
                isCopied={copiedKey === "email"}
                onCopy={() => handleCopy(server.email, "email", "Email")}
              />
            </DefinitionRow>
            <DefinitionRow label="IP address">
              <CopyableValue
                value={server.ip}
                isCopied={copiedKey === "ip"}
                onCopy={() => handleCopy(server.ip, "ip", "IP address")}
              />
            </DefinitionRow>
            <DefinitionRow label="Type">{server.type}</DefinitionRow>
            <DefinitionRow label="Operating system">{server.os.toUpperCase()}</DefinitionRow>
          </DefinitionList>
        </InfoCard>

        <InfoCard title="System specifications">
          <DefinitionList>
            <DefinitionRow label="Version">{server.version}</DefinitionRow>
            <DefinitionRow label="Kernel">{server.kernel}</DefinitionRow>
            <DefinitionRow label="vCPU">
              {server.vCPUs ? `${server.vCPUs}` : "Not specified"}
            </DefinitionRow>
            <DefinitionRow label="Memory">{server.ramGB} GB</DefinitionRow>
            <DefinitionRow label="Storage">{server.storageSizeGB} GB</DefinitionRow>
          </DefinitionList>
        </InfoCard>

        <InfoCard title="Credentials" description="Values rotate alongside your dashboard actions. Copying respects the refreshed UI.">
          <DefinitionList>
            <DefinitionRow label="Username">
              <CopyableValue
                value={server.username}
                isCopied={copiedKey === "username"}
                onCopy={() => handleCopy(server.username, "username", "Username")}
              />
            </DefinitionRow>
            <DefinitionRow label="Password">
              <CopyableValue
                value={server.password}
                isCopied={copiedKey === "password"}
                onCopy={() => handleCopy(server.password, "password", "Password")}
              />
            </DefinitionRow>
          </DefinitionList>
        </InfoCard>

        <InfoCard title="Billing & feature flags">
          <DefinitionList>
            <DefinitionRow label="Monthly compute charge">
              {currencyFormatter.format(server.monthlyComputePrice)}
            </DefinitionRow>
            <DefinitionRow label="List price">
              {currencyFormatter.format(server.fullMonthlyComputePrice)}
            </DefinitionRow>
            <DefinitionRow label="Active since">{formatDate(server.activeSince)}</DefinitionRow>
            <DefinitionRow label="Rotating IP">
              <BooleanBadge value={server.hasRotatingIP} />
            </DefinitionRow>
            <DefinitionRow label="Backups">
              <BooleanBadge value={server.hasBackup} />
            </DefinitionRow>
            <DefinitionRow label="Monitoring">
              <BooleanBadge value={server.hasMonitoring} />
            </DefinitionRow>
            <DefinitionRow label="Managed support">
              <BooleanBadge value={server.hasManagedSupport ?? false} />
            </DefinitionRow>
          </DefinitionList>
        </InfoCard>
      </div>
    </div>
  )
}

const InfoCard = ({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) => (
  <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
    <div className="space-y-2 border-b border-slate-200/70 p-6 dark:border-slate-700/60">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      {description ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      ) : null}
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
)

const DefinitionList = ({ children }: { children: React.ReactNode }) => (
  <dl className="space-y-4">{children}</dl>
)

const DefinitionRow = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
      {label}
    </dt>
    <dd className="flex flex-wrap items-center gap-2 text-sm text-slate-900 dark:text-slate-100">
      {children}
    </dd>
  </div>
)

const CopyableValue = ({
  value,
  isCopied,
  onCopy,
}: {
  value: string
  isCopied: boolean
  onCopy: () => void
}) => (
  <div className="flex items-center gap-3">
    <span className="font-medium text-slate-900 dark:text-slate-100">{value}</span>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-full border border-transparent text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
      onClick={onCopy}
      aria-label="Copy value"
    >
      {isCopied ? <FiCheck className="h-4 w-4 text-emerald-500" /> : <FiCopy className="h-4 w-4" />}
    </Button>
  </div>
)

const BooleanBadge = ({ value }: { value: boolean }) => (
  <Badge
    variant={value ? "success" : "subtle"}
    className="rounded-full px-3 py-1 text-xs font-semibold"
  >
    {value ? "Enabled" : "Disabled"}
  </Badge>
)

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

export const Route = createFileRoute("/_layout/hosting/$deviceName")({
  component: DeviceDetailsPage,
})
