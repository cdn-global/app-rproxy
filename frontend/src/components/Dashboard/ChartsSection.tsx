import React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const ChartsSection: React.FC = () => {
  const analyticsPoints = [38, 62, 54, 78, 92, 66, 105, 98]
  const sparkPath = analyticsPoints
    .map((point, index) => {
      const x = (index / (analyticsPoints.length - 1)) * 180
      const y = 110 - point
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="rounded-[24px] border border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle className="text-xl">Analytics & charts</CardTitle>
          <CardDescription>
            Metric cards, sparkline trends, and breakdown tags for throughput
            reviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border p-5 text-slate-900 dark:text-slate-50">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                Requests
              </div>
              <div className="mt-2 text-2xl font-semibold">4.8M</div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                +12.4% vs last 7 days
              </p>
              <div className="mt-4">
                <svg viewBox="0 0 180 110" className="h-24 w-full">
                  <path
                    d={`${sparkPath} L 180 110 L 0 110 Z`}
                    fill="rgba(14,165,233,0.16)"
                    className="stroke-none"
                  />
                  <path
                    d={sparkPath}
                    stroke="rgba(56,189,248,0.9)"
                    strokeWidth={3}
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4 rounded-2xl border p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Network mix
                </p>
                <div className="mt-2 flex items-baseline gap-2 text-2xl font-semibold">
                  64%
                  <span className="text-xs font-medium text-emerald-500">
                    target proximity
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Datacenter</span>
                  <Badge className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    42%
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Residential</span>
                  <Badge
                    variant="secondary"
                    className="rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em]"
                  >
                    38%
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>ISP</span>
                  <Badge
                    variant="outline"
                    className="rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em]"
                  >
                    20%
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-[24px] p-6">
        <CardHeader>
          <CardTitle>Requests over time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-44 flex items-center justify-center text-sm text-slate-500">
            Chart placeholder
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-[24px] p-6">
        <CardHeader>
          <CardTitle>Capacity utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-44 flex items-center justify-center text-sm text-slate-500">
            Chart placeholder
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ChartsSection
