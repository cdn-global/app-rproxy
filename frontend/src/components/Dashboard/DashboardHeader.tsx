import { Link as RouterLink } from "@tanstack/react-router"
import { FiArrowUpRight } from "react-icons/fi"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface DashboardHeaderProps {
  servicesCount: number
  nextRenewalLabel: string
  apiKeyCount: number
  averageRequestsPerKey: number
  onBillingClick: () => void
  isBillingLoading: boolean
  apiConsoleTo: string
}

const DashboardHeader = ({
  servicesCount,
  nextRenewalLabel,
  apiKeyCount,
  averageRequestsPerKey,
  onBillingClick,
  isBillingLoading,
  apiConsoleTo,
}: DashboardHeaderProps) => {
  return (
    <Card className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/90 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.36)] backdrop-blur-2xl transition-shadow dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_20px_50px_-32px_rgba(148,163,184,0.35)]">
      <BackgroundAura />
      <CardContent className="relative z-[1] space-y-10 p-8 md:p-10">
        <div className="space-y-5 xl:max-w-2xl">
          <Badge className="inline-flex items-center rounded-full bg-primary/15 px-4 py-1.5 text-xs font-semibold tracking-[0.08em] text-primary/80 dark:bg-primary/25 dark:text-primary-foreground/80">
            {servicesCount} active services · next renewal {nextRenewalLabel}
          </Badge>
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold leading-tight text-slate-900 dark:text-slate-100">
              Welcome back. Everything is synced and ready for your next crawl.
            </h1>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Track infrastructure health, monitor usage trends, and launch new workloads from a single, refined workspace.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBadge label="API keys" value={apiKeyCount.toString()} />
          <StatBadge
            label="Avg requests / key"
            value={averageRequestsPerKey.toLocaleString()}
          />
          <StatBadge label="Active services" value={servicesCount.toString()} />
          <StatBadge label="Next renewal" value={nextRenewalLabel} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            asChild
            size="lg"
            className="gap-2 rounded-full px-6 text-base font-semibold shadow-lg"
          >
            <RouterLink to={apiConsoleTo}>
              <span>Open API console</span>
              <FiArrowUpRight className="h-4 w-4" />
            </RouterLink>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2 rounded-full px-6 text-base font-medium"
            onClick={onBillingClick}
            isLoading={isBillingLoading}
          >
            <span>Customer billing</span>
            <FiArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const BackgroundAura = () => (
  <div className="pointer-events-none absolute inset-0 -z-10 opacity-50">
    <div
      className="absolute -right-36 -top-32 h-80 w-80 rounded-full blur-3xl"
      style={{
        background:
          "radial-gradient(circle, rgba(99,102,241,0.32) 0%, transparent 60%)",
      }}
    />
    <div
      className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full blur-[70px]"
      style={{
        background:
          "radial-gradient(circle, rgba(14,165,233,0.28) 0%, transparent 65%)",
      }}
    />
  </div>
)

interface StatBadgeProps {
  label: string
  value: string
}

const StatBadge = ({ label, value }: StatBadgeProps) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 backdrop-blur-2xl transition-colors dark:border-slate-700/50 dark:bg-slate-900/50">
    <span className="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
      {label}
    </span>
    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
      {value}
    </p>
  </div>
)

export default DashboardHeader
