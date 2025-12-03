import React from "react"

const ChartsSection: React.FC = () => {
  const analyticsPoints = [38, 62, 54, 78, 92, 66, 105, 98]
  const sparkPath = analyticsPoints
    .map((point, index) => {
      const x = (index / (analyticsPoints.length - 1)) * 180
      const y = 110 - point
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")

  const networkUsagePoints = [50, 40, 65, 70, 85, 95, 100, 110]
  const networkSparkPath = networkUsagePoints
    .map((point, index) => {
      const x = (index / (networkUsagePoints.length - 1)) * 180
      const y = 110 - point
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div>
        <h3 className="mb-4 text-xl font-semibold">Requests over time</h3>
        <div className="space-y-5">
          <div className="grid gap-4">
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
          </div>
        </div>
      </div>
      <div>
        <h3 className="mb-4 text-xl font-semibold">Network Usage</h3>
        <div className="space-y-5">
          <div className="grid gap-4">
            <div className="rounded-2xl border p-5 text-slate-900 dark:text-slate-50">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                Network Usage
              </div>
              <div className="mt-2 text-2xl font-semibold">1.2TB</div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                +8.2% vs last 7 days
              </p>
              <div className="mt-4">
                <svg viewBox="0 0 180 110" className="h-24 w-full">
                  <path
                    d={`${networkSparkPath} L 180 110 L 0 110 Z`}
                    fill="rgba(14,165,233,0.16)"
                    className="stroke-none"
                  />
                  <path
                    d={networkSparkPath}
                    stroke="rgba(56,189,248,0.9)"
                    strokeWidth={3}
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChartsSection
