import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { DashboardStat } from "./types"

const accentVariants = {
  brand: {
    card:
      "bg-[linear-gradient(135deg,_rgba(99,102,241,0.18),_rgba(14,165,233,0.12))] dark:bg-[linear-gradient(135deg,_rgba(129,140,248,0.24),_rgba(45,212,191,0.16))]",
    icon:
      "bg-[rgba(99,102,241,0.16)] text-indigo-600 dark:bg-[rgba(129,140,248,0.24)] dark:text-indigo-100",
  },
  success: {
    card:
      "bg-[linear-gradient(135deg,_rgba(16,185,129,0.16),_rgba(59,130,246,0.1))] dark:bg-[linear-gradient(135deg,_rgba(34,197,94,0.22),_rgba(96,165,250,0.14))]",
    icon:
      "bg-[rgba(16,185,129,0.18)] text-emerald-600 dark:bg-[rgba(34,197,94,0.26)] dark:text-emerald-100",
  },
  warning: {
    card:
      "bg-[linear-gradient(135deg,_rgba(251,191,36,0.22),_rgba(245,158,11,0.12))] dark:bg-[linear-gradient(135deg,_rgba(245,158,11,0.25),_rgba(226,232,240,0.1))]",
    icon:
      "bg-[rgba(251,191,36,0.22)] text-amber-600 dark:bg-[rgba(199, 16, 16, 0.93)28)] dark:text-amber-100",
  },
  ocean: {
    card:
      "bg-[linear-gradient(135deg,_rgba(6,182,212,0.2),_rgba(56,189,248,0.12))] dark:bg-[linear-gradient(135deg,_rgba(56,189,248,0.26),_rgba(6,182,212,0.18))]",
    icon:
      "bg-[rgba(6,182,212,0.18)] text-cyan-600 dark:bg-[rgba(56,189,248,0.28)] dark:text-cyan-100",
  },
} as const

interface StatHighlightsProps {
  stats: DashboardStat[]
}

const StatHighlights = ({ stats }: StatHighlightsProps) => {
  if (stats.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-100/70 p-6 text-slate-700 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200">
        <h3 className="text-sm font-semibold">No metrics to display</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Usage statistics will populate once requests start flowing through your account.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const palette = accentVariants[stat.accent]

        return (
          <div
            key={stat.label}
            className={cn(
              "flex h-full flex-col gap-6 rounded-[24px] border border-slate-200/70 p-6 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur-2xl transition duration-200 hover:-translate-y-1 hover:shadow-[0_32px_60px_-32px_rgba(15,23,42,0.55)] dark:border-slate-700/50 dark:shadow-[0_28px_60px_-35px_rgba(148,163,184,0.55)]",
              palette.card,
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className={cn("flex aspect-square h-12 items-center justify-center rounded-full", palette.icon)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <span className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {stat.description}
              </span>
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {stat.label}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StatHighlights
