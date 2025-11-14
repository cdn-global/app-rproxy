import { Link as RouterLink } from "@tanstack/react-router"
import { FiArrowUpRight } from "react-icons/fi"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import type { DisplayedFeature } from "./types"

interface ActiveServicesGridProps {
  features: DisplayedFeature[]
}

const ActiveServicesGrid = ({ features }: ActiveServicesGridProps) => {
  if (features.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-100/70 p-6 text-slate-700 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200">
        <h3 className="text-sm font-semibold">No active services yet</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Activate a subscription to see managed assets, renewal windows, and quick access links in this panel.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {features.map((feature) => (
        <Card
          key={feature.slug}
          className="group relative h-full overflow-hidden rounded-[24px] border border-white/30 bg-white/80 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.5)] backdrop-blur-2xl transition duration-200 ease-out hover:-translate-y-1.5 hover:shadow-[0_36px_70px_-32px_rgba(15,23,42,0.56)] dark:border-slate-700/60 dark:bg-slate-900/80"
          style={{ background: feature.gradient }}
        >
          <CardContent className="flex h-full flex-col gap-3 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white">
              <feature.icon className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {feature.name}
              </h3>
              <p className="text-sm leading-relaxed text-slate-900/80 dark:text-slate-100/80">
                {feature.description}
              </p>
            </div>
            <div className="mt-4 space-y-2">
              {feature.period ? (
                <Badge className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                  {feature.period}
                </Badge>
              ) : null}
              <Button
                asChild
                variant="outline"
                className="gap-2 rounded-full border-white/40 bg-white/10 text-white transition hover:bg-white/20"
              >
                <RouterLink to={feature.path}>
                  <span>Manage service</span>
                  <FiArrowUpRight className="h-4 w-4" />
                </RouterLink>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default ActiveServicesGrid
