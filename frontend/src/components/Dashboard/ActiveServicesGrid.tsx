import { Link as RouterLink } from "@tanstack/react-router"
import { FiArrowUpRight } from "react-icons/fi"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { DisplayedFeature } from "./types"

interface ActiveServicesGridProps {
  features: DisplayedFeature[]
}

const ActiveServicesGrid = ({ features }: ActiveServicesGridProps) => {
  if (!features.length) {
    return (
      <div className="rounded-[24px] border border-slate-200/70 bg-white/80 p-6 text-center backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
        <div className="space-y-3 p-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No active services yet</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Activate a product bundle to populate this grid with live usage entries.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {features.map((feature) => {
        const Icon = feature.icon

        return (
          <div
            key={feature.slug}
            className="relative overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.36)] backdrop-blur-2xl transition duration-200 hover:-translate-y-1 hover:shadow-[0_32px_70px_-30px_rgba(15,23,42,0.5)] dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_28px_60px_-36px_rgba(148,163,184,0.48)]"
            style={feature.gradient ? { background: feature.gradient } : undefined}
          >
            <div className="space-y-4 p-6 pb-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/5 text-slate-900 dark:bg-white/10 dark:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                  {feature.name}
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {feature.description}
                </p>
              </div>
              {feature.period ? (
                <Badge className="w-fit rounded-full bg-white/30 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-700 backdrop-blur dark:bg-white/10 dark:text-slate-200">
                  {feature.period}
                </Badge>
              ) : null}
            </div>
            <div className="mt-6 flex items-center justify-between gap-3 p-6 pt-0">
              <Button
                asChild
                variant="outline"
                className="gap-2 rounded-full bg-white/70 px-5 py-2 text-sm font-semibold backdrop-blur dark:bg-slate-900/60"
              >
                <RouterLink to={feature.path}>
                  <span>Open module</span>
                  <FiArrowUpRight className="h-4 w-4" />
                </RouterLink>
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ActiveServicesGrid
